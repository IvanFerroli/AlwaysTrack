import { computeSkillOverlap } from "../../domain/matching/scoring.js";
import type { IngestionService } from "../ingestion/ingestion.service.js";
import { fetchJobItems } from "./scraper.fetcher.js";
import { parseJobItems } from "./scraper.parser.js";
import type { ScraperRunResult, ScraperSourceConfig, SourceRunResult } from "./scraper.types.js";

const SENIORITY_ALIASES: Record<string, string[]> = {
  junior: ["junior", "jr", "entry", "entry-level", "trainee"],
  estagio: ["estagio", "estágio", "intern", "internship", "estagiario", "estagiário"],
  pleno: ["pleno", "mid", "mid-level", "intermediate"],
  senior: ["senior", "sênior", "sr", "lead", "staff", "principal"]
};

const KEYWORD_ALIASES: Record<string, string[]> = {
  react: ["react", "reactjs", "react.js"],
  node: ["node", "nodejs", "node.js", "node js"],
  typescript: ["typescript", "ts"],
  javascript: ["javascript", "js", "ecmascript"],
  backend: ["backend", "back-end", "server-side"],
  frontend: ["frontend", "front-end", "ui"],
  fullstack: ["fullstack", "full-stack", "full stack"]
};

const DEFAULT_AUTO_DISCARD_TAG = "auto-discard-no-match";

const TERM_TO_CANONICAL = new Map<string, string>();
for (const [canonical, variants] of Object.entries(SENIORITY_ALIASES)) {
  TERM_TO_CANONICAL.set(canonical, canonical);
  for (const variant of variants) {
    TERM_TO_CANONICAL.set(normalizeTerm(variant), canonical);
  }
}
for (const [canonical, variants] of Object.entries(KEYWORD_ALIASES)) {
  TERM_TO_CANONICAL.set(canonical, canonical);
  for (const variant of variants) {
    TERM_TO_CANONICAL.set(normalizeTerm(variant), canonical);
  }
}

interface KeywordGroup {
  canonical: string;
  variants: string[];
  seniority: boolean;
}

interface KeywordPlan {
  requested?: string;
  effective?: string;
  groups: KeywordGroup[];
}

/**
 * Fontes padrão configuradas.
 * SCRAPER_SOURCE env: "remotive" | "arbeitnow" (default: "remotive")
 */
export const SCRAPER_SOURCES: Record<string, ScraperSourceConfig> = {
  remotive: {
    name: "Remotive",
    url: "https://remotive.com/api/remote-jobs?limit=250",
    format: "remotive-json"
  },
  arbeitnow: {
    name: "Arbeitnow",
    url: "https://www.arbeitnow.com/api/job-board-api",
    format: "arbeitnow-json"
  },
  remoteok: {
    name: "RemoteOK",
    url: "https://remoteok.com/api",
    format: "remoteok-json"
  },
  jobicy: {
    name: "Jobicy",
    url: "https://jobicy.com/api/v2/remote-jobs?count=50",
    format: "jobicy-json"
  },
  himalayas: {
    name: "Himalayas",
    url: "https://himalayas.app/jobs/api?limit=150",
    format: "himalayas-json"
  },
  linkedin: {
    name: "LinkedIn",
    url: "https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search?keywords=software&location=Brazil&start=0",
    format: "linkedin-guest-html"
  },
  gupy: {
    name: "Gupy",
    url: "https://portal.api.gupy.io/api/job?name=software&offset=0&limit=50",
    format: "gupy-public-json"
  },
  indeed: {
    name: "Indeed",
    url: "https://www.indeed.com/rss?q=software&l=remote",
    format: "unavailable-platform",
    enabledByDefault: false,
    unavailableReason: "Indeed currently returns a security-check page instead of a stable public feed in this environment"
  },
  glassdoor: {
    name: "Glassdoor",
    url: "https://www.glassdoor.com/Job/jobs.htm?sc.keyword=software",
    format: "unavailable-platform",
    enabledByDefault: false,
    unavailableReason: "Glassdoor currently returns a security-check page instead of a stable public feed in this environment"
  },
  cryptojobslist: {
    name: "CryptoJobsList",
    url: "https://cryptojobslist.com/api/jobs",
    format: "cryptojobslist-json",
    enabledByDefault: false,
    unavailableReason: "JSON endpoint currently returns Cloudflare/404; RSS integration needs a dedicated parser task"
  }
};

export class ScraperInputError extends Error {
  constructor(
    readonly code: string,
    message: string
  ) {
    super(message);
    this.name = "ScraperInputError";
  }
}

function normalizeTerm(term: string): string {
  return term
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9+.#\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeTextForMatch(text: string): string {
  return normalizeTerm(text).replace(/[-./]/g, " ").replace(/\s+/g, " ").trim();
}

function buildKeywordVariants(canonical: string): string[] {
  const aliases = [
    ...(SENIORITY_ALIASES[canonical] ?? []),
    ...(KEYWORD_ALIASES[canonical] ?? []),
    canonical
  ];
  return [...new Set(aliases.map(normalizeTerm).filter(Boolean))];
}

function buildKeywordPlan(keyword?: string): KeywordPlan {
  const requested = keyword?.trim();
  if (!requested) {
    return { groups: [] };
  }

  const parts = requested
    .split(/[\s,]+/)
    .map((part) => normalizeTerm(part))
    .filter((part) => part.length > 0);

  const groups: KeywordGroup[] = [];
  const seenCanonical = new Set<string>();

  for (const part of parts) {
    const canonical = TERM_TO_CANONICAL.get(part) ?? part;
    if (seenCanonical.has(canonical)) {
      continue;
    }
    seenCanonical.add(canonical);

    groups.push({
      canonical,
      variants: buildKeywordVariants(canonical),
      seniority: Object.prototype.hasOwnProperty.call(SENIORITY_ALIASES, canonical)
    });
  }

  return {
    requested,
    effective: groups.map((group) => group.canonical).join(" ") || undefined,
    groups
  };
}

function matchesVariants(text: string, tokens: Set<string>, variants: string[]): boolean {
  return variants.some((variant) => {
    if (!variant) return false;
    if (variant.includes(" ")) {
      return text.includes(variant);
    }
    return tokens.has(variant);
  });
}

export function applyKeywordToSource(
  source: ScraperSourceConfig,
  keyword?: string
): ScraperSourceConfig {
  const trimmedKeyword = keyword?.trim();
  if (!trimmedKeyword) return source;

  const url = new URL(source.url);
  if (source.format === "remotive-json") url.searchParams.set("search", trimmedKeyword);
  if (source.format === "arbeitnow-json") url.searchParams.set("search", trimmedKeyword);
  if (source.format === "himalayas-json") url.searchParams.set("q", trimmedKeyword);
  if (source.format === "jobicy-json") url.searchParams.set("tag", trimmedKeyword);
  if (source.format === "linkedin-guest-html") url.searchParams.set("keywords", trimmedKeyword);
  if (source.format === "gupy-public-json") url.searchParams.set("name", trimmedKeyword);

  return { ...source, url: url.toString() };
}

function shouldAutoDiscardNoMatch(jobTokens: string[], profileSkills: string[]): boolean {
  const { matchedSkills } = computeSkillOverlap(profileSkills, jobTokens);
  return matchedSkills.length === 0;
}

async function runSingleSource(
  ingestionService: IngestionService,
  source: ScraperSourceConfig,
  keywordPlan: KeywordPlan
): Promise<SourceRunResult> {
  const rawItems = await fetchJobItems(source);
  const parsedItems = filterParsedItemsByKeyword(parseJobItems(rawItems, source), keywordPlan.effective);
  const defaultProfile = await ingestionService.getDefaultResumeProfile();

  const errors: string[] = [];
  let ingested = 0;
  let deduplicated = 0;
  let autoDiscarded = 0;

  for (const item of parsedItems) {
    try {
      const result = await ingestionService.ingest(item);
      if (result.ok) {
        if (result.data.deduplicated) {
          deduplicated++;
          continue;
        }

        ingested++;

        if (defaultProfile && shouldAutoDiscardNoMatch(result.data.jobPosting.normalizedTokens, defaultProfile.skills)) {
          const discarded = await ingestionService.autoDiscardJobNoMatch(
            result.data.jobPosting.id,
            DEFAULT_AUTO_DISCARD_TAG
          );
          if (discarded.ok) {
            autoDiscarded++;
          } else {
            errors.push(`[${item.title}] auto-discard failed: ${discarded.error.message}`);
          }
        }
      } else {
        errors.push(`[${item.title}] ${result.error.message}`);
      }
    } catch (err) {
      errors.push(`[${item.title}] unexpected error: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return {
    name: source.name,
    fetched: rawItems.length,
    ingested,
    deduplicated,
    autoDiscarded,
    keywordEffective: keywordPlan.effective,
    errors
  };
}

export function filterParsedItemsByKeyword<T extends { title: string; companyName: string; sourceName: string; location?: string; description: string }>(
  items: T[],
  keyword?: string
): T[] {
  const keywordPlan = buildKeywordPlan(keyword);
  if (keywordPlan.groups.length === 0) {
    return items;
  }

  return items.filter((item) => {
    const title = normalizeTextForMatch(item.title);
    const haystack = normalizeTextForMatch([
      item.title,
      item.companyName,
      item.sourceName,
      item.location ?? "",
      item.description
    ].join(" "));

    const titleTokens = new Set(title.split(/\s+/).filter(Boolean));
    const haystackTokens = new Set(haystack.split(/\s+/).filter(Boolean));

    return keywordPlan.groups.every((group) => {
      if (group.seniority) {
        return matchesVariants(title, titleTokens, group.variants);
      }
      return matchesVariants(haystack, haystackTokens, group.variants);
    });
  });
}

/**
 * Orquestra o ciclo completo: fetch → parse → ingest.
 * Delega ao IngestionService para manter deduplicação e auditoria.
 */
export async function runScraper(
  ingestionService: IngestionService,
  sourceKey = process.env["SCRAPER_SOURCE"] ?? "all",
  keyword?: string
): Promise<ScraperRunResult> {
  const keywordPlan = buildKeywordPlan(keyword);

  if (sourceKey === "all") {
    const defaultSources = Object.values(SCRAPER_SOURCES).filter((src) => src.enabledByDefault !== false);
    const settledResults = await Promise.allSettled(
      defaultSources.map((src) => runSingleSource(ingestionService, applyKeywordToSource(src, keywordPlan.effective), keywordPlan))
    );

    const results = settledResults
      .filter((r): r is PromiseFulfilledResult<SourceRunResult> => r.status === "fulfilled")
      .map((r) => r.value);

    const rejectedErrors = settledResults
      .filter((r): r is PromiseRejectedResult => r.status === "rejected")
      .map((r) => `[source error] ${r.reason instanceof Error ? r.reason.message : String(r.reason)}`);

    const total = results.reduce(
      (acc, res) => ({
        fetched: acc.fetched + res.fetched,
        ingested: acc.ingested + res.ingested,
        deduplicated: acc.deduplicated + res.deduplicated,
        autoDiscarded: acc.autoDiscarded + res.autoDiscarded,
        errors: [...acc.errors, ...res.errors]
      }),
      { fetched: 0, ingested: 0, deduplicated: 0, autoDiscarded: 0, errors: rejectedErrors }
    );

    return {
      source: "All Sources",
      ...total,
      keywordRequested: keywordPlan.requested,
      keywordEffective: keywordPlan.effective,
      sources: results
    };
  }

  const source = SCRAPER_SOURCES[sourceKey];
  if (!source) {
    throw new ScraperInputError(
      "UNKNOWN_SCRAPER_SOURCE",
      `[scraper.runner] unknown source key: "${sourceKey}". Available: all, ${Object.keys(SCRAPER_SOURCES).join(", ")}`
    );
  }
  if (source.enabledByDefault === false) {
    throw new ScraperInputError(
      "UNAVAILABLE_SCRAPER_SOURCE",
      `[scraper.runner] source "${sourceKey}" is currently unavailable: ${source.unavailableReason ?? "no operational endpoint"}`
    );
  }

  const res = await runSingleSource(ingestionService, applyKeywordToSource(source, keywordPlan.effective), keywordPlan);
  return {
    source: res.name,
    fetched: res.fetched,
    ingested: res.ingested,
    deduplicated: res.deduplicated,
    autoDiscarded: res.autoDiscarded,
    keywordRequested: keywordPlan.requested,
    keywordEffective: keywordPlan.effective,
    errors: res.errors
  };
}

export const SCRAPER_INTERNALS = {
  buildKeywordPlan,
  normalizeTerm,
  normalizeTextForMatch,
  shouldAutoDiscardNoMatch,
  DEFAULT_AUTO_DISCARD_TAG
};
