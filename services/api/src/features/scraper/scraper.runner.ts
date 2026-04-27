import { computeSkillOverlap } from "../../domain/matching/scoring.js";
import type { IngestionService } from "../ingestion/ingestion.service.js";
import { JobAcquisitionService } from "../acquisition/acquisition.service.js";
import { fetchJobItems } from "./scraper.fetcher.js";
import { parseJobItems } from "./scraper.parser.js";
import type { ScraperRunResult, ScraperSourceConfig, SourceFailureType, SourceRunResult } from "./scraper.types.js";

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
const DEFAULT_MAX_CONCURRENCY = 3;
const DEFAULT_SOURCE_TIMEOUT_MS = 15_000;
const DEFAULT_RSS_SEED_LIST: ReadonlyArray<{ name: string; url: string }> = [
  { name: "Python.org Jobs", url: "https://www.python.org/jobs/feed/rss/" },
  { name: "We Work Remotely", url: "https://weworkremotely.com/remote-jobs.rss" },
  { name: "RemoteOK Dev", url: "https://remoteok.com/remote-dev-jobs.rss" }
];

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

interface RunScraperOptions {
  autoDiscard?: boolean;
  maxConcurrency?: number;
  sourceTimeoutMs?: number;
  rssSeeds?: string[];
}

/**
 * Fontes padrão configuradas.
 * SCRAPER_SOURCE env: "remotive" | "arbeitnow" (default: "remotive")
 */
export const SCRAPER_SOURCES: Record<string, ScraperSourceConfig> = {
  remotive: {
    name: "Remotive",
    url: "https://remotive.com/api/remote-jobs?limit=250",
    format: "remotive-json",
    method: "api-json",
    mode: "auto"
  },
  arbeitnow: {
    name: "Arbeitnow",
    url: "https://www.arbeitnow.com/api/job-board-api",
    format: "arbeitnow-json",
    method: "api-json",
    mode: "auto"
  },
  remoteok: {
    name: "RemoteOK",
    url: "https://remoteok.com/api",
    format: "remoteok-json",
    method: "api-json",
    mode: "auto"
  },
  jobicy: {
    name: "Jobicy",
    url: "https://jobicy.com/api/v2/remote-jobs?count=50",
    format: "jobicy-json",
    method: "api-json",
    mode: "auto"
  },
  himalayas: {
    name: "Himalayas",
    url: "https://himalayas.app/jobs/api?limit=150",
    format: "himalayas-json",
    method: "api-json",
    mode: "auto"
  },
  linkedin: {
    name: "LinkedIn",
    url: "https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search?keywords=software&location=Brazil&start=0",
    format: "linkedin-guest-html",
    method: "html",
    mode: "auto"
  },
  gupy: {
    name: "Gupy",
    url: "https://portal.api.gupy.io/api/job?name=software&offset=0&limit=50",
    format: "gupy-public-json",
    method: "ats",
    mode: "auto"
  },
  solides: {
    name: "Solides",
    url: "https://solides.jobs",
    format: "unavailable-platform",
    method: "ats",
    mode: "fallback",
    fallbackMethod: "url-import"
  },
  indeed: {
    name: "Indeed",
    url: "https://www.indeed.com/rss?q=software&l=remote",
    format: "unavailable-platform",
    method: "rss",
    mode: "fallback",
    fallbackMethod: "url-import",
    unavailableReason: "Indeed auto-feed is unstable in this environment; use acquisition fallback"
  },
  glassdoor: {
    name: "Glassdoor",
    url: "https://www.glassdoor.com/Job/jobs.htm?sc.keyword=software",
    format: "unavailable-platform",
    method: "html",
    mode: "fallback",
    fallbackMethod: "url-import",
    unavailableReason: "Glassdoor auto-feed is unstable in this environment; use acquisition fallback"
  },
  cryptojobslist: {
    name: "CryptoJobsList",
    url: "https://cryptojobslist.com/jobs.rss",
    format: "cryptojobslist-rss",
    method: "rss",
    mode: "auto"
  },
  genericrss: {
    name: "Generic RSS (Seed List)",
    url: "https://www.python.org/jobs/feed/rss/",
    format: "generic-rss",
    method: "rss",
    enabledByDefault: false,
    mode: "auto"
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

function envInt(name: string, fallback: number, min: number, max: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(min, Math.min(max, parsed));
}

function resolveConcurrency(options?: RunScraperOptions): number {
  if (typeof options?.maxConcurrency === "number" && Number.isFinite(options.maxConcurrency)) {
    return Math.max(1, Math.min(10, Math.floor(options.maxConcurrency)));
  }
  return envInt("SCRAPER_MAX_CONCURRENCY", DEFAULT_MAX_CONCURRENCY, 1, 10);
}

function resolveSourceTimeoutMs(options?: RunScraperOptions): number {
  if (typeof options?.sourceTimeoutMs === "number" && Number.isFinite(options.sourceTimeoutMs)) {
    return Math.max(1_000, Math.min(120_000, Math.floor(options.sourceTimeoutMs)));
  }
  return envInt("SCRAPER_SOURCE_TIMEOUT_MS", DEFAULT_SOURCE_TIMEOUT_MS, 1_000, 120_000);
}

async function runWithConcurrency<T>(tasks: Array<() => Promise<T>>, maxConcurrency: number): Promise<T[]> {
  const concurrency = Math.max(1, Math.min(maxConcurrency, tasks.length));
  const results: T[] = new Array(tasks.length);
  let nextIndex = 0;

  const worker = async () => {
    for (;;) {
      const index = nextIndex;
      nextIndex += 1;
      if (index >= tasks.length) return;
      results[index] = await tasks[index]();
    }
  };

  await Promise.all(Array.from({ length: concurrency }, () => worker()));
  return results;
}

function classifyFailure(error: unknown): SourceFailureType {
  const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();

  if (
    message.includes("timeout") ||
    message.includes("abort") ||
    message.includes("timed out") ||
    message.includes("aborted")
  ) {
    return "timeout";
  }

  if (
    message.includes("security-check") ||
    message.includes("cloudflare") ||
    (message.includes("unexpected content-type") && message.includes("text/html")) ||
    message.includes("http 403") ||
    message.includes("http 429")
  ) {
    return "security-check";
  }

  if (
    message.includes("missing") ||
    message.includes("invalid") ||
    message.includes("unsupported format") ||
    message.includes("unexpected content-type") ||
    message.includes("parse")
  ) {
    return "parse";
  }

  if (message.includes("http ")) {
    return "http";
  }

  return "unknown";
}

function resolveSourceMode(source: ScraperSourceConfig): "auto" | "fallback" | "blocked" {
  if (source.mode) return source.mode;
  if (source.format === "unavailable-platform") return "fallback";
  return "auto";
}

interface RssSeed {
  name: string;
  url: string;
}

function rssSeedNameFromUrl(rawUrl: string): string {
  try {
    return new URL(rawUrl).host;
  } catch {
    return rawUrl;
  }
}

function parseRssSeed(rawSeed: string): RssSeed | null {
  const raw = rawSeed.trim();
  if (!raw) return null;

  const [rawName, rawUrlMaybe] = raw.includes("|")
    ? raw.split("|", 2).map((part) => part.trim())
    : ["", raw];
  const rawUrl = rawUrlMaybe || rawName;

  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null;
    }

    return {
      name: rawName || rssSeedNameFromUrl(parsed.toString()),
      url: parsed.toString()
    };
  } catch {
    return null;
  }
}

function resolveRssSeeds(options?: RunScraperOptions): RssSeed[] {
  const fromOptions = options?.rssSeeds ?? [];
  const fromEnv = (process.env["SCRAPER_RSS_SEEDS"] ?? "")
    .split(/[,\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
  const rawSeeds = [...fromOptions, ...fromEnv];
  const hasExplicitSeedInput = rawSeeds.length > 0;

  const parsedFromInput = rawSeeds
    .map(parseRssSeed)
    .filter((seed): seed is RssSeed => seed !== null);

  if (hasExplicitSeedInput && parsedFromInput.length === 0) {
    return [];
  }

  const fallbackSeeds = DEFAULT_RSS_SEED_LIST.map((seed) => ({
    name: seed.name,
    url: seed.url
  }));

  const selected = parsedFromInput.length > 0 ? parsedFromInput : fallbackSeeds;
  const uniqueByUrl = new Map<string, RssSeed>();
  for (const seed of selected) {
    if (!uniqueByUrl.has(seed.url)) {
      uniqueByUrl.set(seed.url, seed);
    }
  }

  return [...uniqueByUrl.values()];
}

async function runFallbackSource(
  ingestionService: IngestionService,
  source: ScraperSourceConfig,
  keywordPlan: KeywordPlan
): Promise<SourceRunResult> {
  const startedAt = Date.now();
  const fallbackMethod = source.fallbackMethod ?? "url-import";
  const acquisition = new JobAcquisitionService(ingestionService);

  const payload = await acquisition.acquire({
    method: fallbackMethod,
    sourceUrl: source.url,
    sourceName: source.name,
    rawText: keywordPlan.effective
      ? `Keyword context: ${keywordPlan.effective}`
      : undefined
  });

  if (!payload.ok) {
    return {
      name: source.name,
      method: source.method,
      mode: "fallback",
      fallbackMethod,
      latencyMs: Date.now() - startedAt,
      fetched: 0,
      parsed: 0,
      ingested: 0,
      deduplicated: 0,
      discarded: 0,
      failureType: classifyFailure(payload.error.message),
      keywordEffective: keywordPlan.effective,
      note: source.unavailableReason ?? "Auto mode unavailable; fallback via acquisition attempted",
      errors: [payload.error.message]
    };
  }

  return {
    name: source.name,
    method: source.method,
    mode: "fallback",
    fallbackMethod,
    latencyMs: Date.now() - startedAt,
    fetched: 1,
    parsed: 1,
    ingested: payload.data.ingestion.deduplicated ? 0 : 1,
    deduplicated: payload.data.ingestion.deduplicated ? 1 : 0,
    discarded: 0,
    keywordEffective: keywordPlan.effective,
    note: "Auto mode unavailable; ingested via acquisition fallback",
    errors: []
  };
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
  keywordPlan: KeywordPlan,
  sourceTimeoutMs: number,
  options?: RunScraperOptions
): Promise<SourceRunResult> {
  const startedAt = Date.now();
  const autoDiscardEnabled = options?.autoDiscard ?? false;
  const mode = resolveSourceMode(source);

  try {
    if (mode === "blocked") {
      return {
        name: source.name,
        method: source.method,
        mode: "blocked",
        latencyMs: Date.now() - startedAt,
        fetched: 0,
        parsed: 0,
        ingested: 0,
        deduplicated: 0,
        discarded: 0,
        keywordEffective: keywordPlan.effective,
        note: source.unavailableReason ?? "Source blocked in current environment",
        errors: []
      };
    }

    if (mode === "fallback") {
      return await runFallbackSource(ingestionService, source, keywordPlan);
    }

    const rawItems = await fetchJobItems(source, sourceTimeoutMs);
    const parsedItems = filterParsedItemsByKeyword(parseJobItems(rawItems, source), keywordPlan.effective);
    const defaultProfile = await ingestionService.getDefaultResumeProfile();

    const errors: string[] = [];
    let ingested = 0;
    let deduplicated = 0;
    let discarded = 0;

    for (const item of parsedItems) {
      try {
        const result = await ingestionService.ingest(item);
        if (result.ok) {
          const shouldDiscard =
            autoDiscardEnabled &&
            defaultProfile &&
            result.data.jobPosting.userStatus === "new" &&
            shouldAutoDiscardNoMatch(result.data.jobPosting.normalizedTokens, defaultProfile.skills);

          if (result.data.deduplicated) {
            deduplicated++;
            if (shouldDiscard) {
              const autoDiscardResult = await ingestionService.autoDiscardJobNoMatch(
                result.data.jobPosting.id,
                DEFAULT_AUTO_DISCARD_TAG
              );
              if (autoDiscardResult.ok) {
                discarded++;
              } else {
                errors.push(`[${item.title}] auto-discard failed: ${autoDiscardResult.error.message}`);
              }
            }
            continue;
          }

          ingested++;

          if (shouldDiscard) {
            const autoDiscardResult = await ingestionService.autoDiscardJobNoMatch(
              result.data.jobPosting.id,
              DEFAULT_AUTO_DISCARD_TAG
            );
            if (autoDiscardResult.ok) {
              discarded++;
            } else {
              errors.push(`[${item.title}] auto-discard failed: ${autoDiscardResult.error.message}`);
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
      method: source.method,
      mode: "auto",
      latencyMs: Date.now() - startedAt,
      fetched: rawItems.length,
      parsed: parsedItems.length,
      ingested,
      deduplicated,
      discarded,
      keywordEffective: keywordPlan.effective,
      errors
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      name: source.name,
      method: source.method,
      mode,
      latencyMs: Date.now() - startedAt,
      fetched: 0,
      parsed: 0,
      ingested: 0,
      deduplicated: 0,
      discarded: 0,
      failureType: classifyFailure(error),
      keywordEffective: keywordPlan.effective,
      errors: [message]
    };
  }
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

async function runRssSeedList(
  ingestionService: IngestionService,
  keywordPlan: KeywordPlan,
  sourceTimeoutMs: number,
  options?: RunScraperOptions
): Promise<ScraperRunResult> {
  const seeds = resolveRssSeeds(options);
  if (seeds.length === 0) {
    throw new ScraperInputError(
      "RSS_SEED_LIST_INVALID",
      `[scraper.runner] source "rss-seed" requires valid seed URLs in rssSeeds option or SCRAPER_RSS_SEEDS env`
    );
  }

  const maxConcurrency = resolveConcurrency(options);
  const reports = await runWithConcurrency(
    seeds.map((seed, index) => async () => {
      const source: ScraperSourceConfig = {
        name: `RSS Seed ${index + 1}: ${seed.name}`,
        url: seed.url,
        format: "generic-rss",
        method: "rss",
        mode: "auto"
      };

      return runSingleSource(
        ingestionService,
        applyKeywordToSource(source, keywordPlan.effective),
        keywordPlan,
        sourceTimeoutMs,
        options
      );
    }),
    maxConcurrency
  );

  const total = reports.reduce(
    (acc, report) => ({
      fetched: acc.fetched + report.fetched,
      parsed: acc.parsed + report.parsed,
      ingested: acc.ingested + report.ingested,
      deduplicated: acc.deduplicated + report.deduplicated,
      autoDiscarded: acc.autoDiscarded + report.discarded,
      errors: [...acc.errors, ...report.errors]
    }),
    { fetched: 0, parsed: 0, ingested: 0, deduplicated: 0, autoDiscarded: 0, errors: [] as string[] }
  );

  return {
    source: "RSS Seed List",
    ...total,
    keywordRequested: keywordPlan.requested,
    keywordEffective: keywordPlan.effective,
    sourceReports: reports,
    sources: reports
  };
}

/**
 * Orquestra o ciclo completo: fetch → parse → ingest.
 * Delega ao IngestionService para manter deduplicação e auditoria.
 */
export async function runScraper(
  ingestionService: IngestionService,
  sourceKey = process.env["SCRAPER_SOURCE"] ?? "all",
  keyword?: string,
  options?: RunScraperOptions
): Promise<ScraperRunResult> {
  const keywordPlan = buildKeywordPlan(keyword);
  const sourceTimeoutMs = resolveSourceTimeoutMs(options);

  if (sourceKey === "rss-seed" || sourceKey === "genericrss" || sourceKey === "generic-rss") {
    return runRssSeedList(ingestionService, keywordPlan, sourceTimeoutMs, options);
  }

  if (sourceKey === "all") {
    const defaultSources = Object.values(SCRAPER_SOURCES).filter((src) => src.enabledByDefault !== false);
    const maxConcurrency = resolveConcurrency(options);

    const reports = await runWithConcurrency(
      defaultSources.map((src) => () =>
        runSingleSource(
          ingestionService,
          applyKeywordToSource(src, keywordPlan.effective),
          keywordPlan,
          sourceTimeoutMs,
          options
        )
      ),
      maxConcurrency
    );

    const total = reports.reduce(
      (acc, report) => ({
        fetched: acc.fetched + report.fetched,
        parsed: acc.parsed + report.parsed,
        ingested: acc.ingested + report.ingested,
        deduplicated: acc.deduplicated + report.deduplicated,
        autoDiscarded: acc.autoDiscarded + report.discarded,
        errors: [...acc.errors, ...report.errors]
      }),
      { fetched: 0, parsed: 0, ingested: 0, deduplicated: 0, autoDiscarded: 0, errors: [] as string[] }
    );

    return {
      source: "All Sources",
      ...total,
      keywordRequested: keywordPlan.requested,
      keywordEffective: keywordPlan.effective,
      sourceReports: reports,
      sources: reports
    };
  }

  const source = SCRAPER_SOURCES[sourceKey];
  if (!source) {
    throw new ScraperInputError(
      "UNKNOWN_SCRAPER_SOURCE",
      `[scraper.runner] unknown source key: "${sourceKey}". Available: all, rss-seed, genericrss, ${Object.keys(SCRAPER_SOURCES).join(", ")}`
    );
  }

  const report = await runSingleSource(
    ingestionService,
    applyKeywordToSource(source, keywordPlan.effective),
    keywordPlan,
    sourceTimeoutMs,
    options
  );

  return {
    source: report.name,
    fetched: report.fetched,
    parsed: report.parsed,
    ingested: report.ingested,
    deduplicated: report.deduplicated,
    autoDiscarded: report.discarded,
    keywordRequested: keywordPlan.requested,
    keywordEffective: keywordPlan.effective,
    errors: report.errors,
    sourceReports: [report],
    sources: [report]
  };
}

export const SCRAPER_INTERNALS = {
  buildKeywordPlan,
  normalizeTerm,
  normalizeTextForMatch,
  shouldAutoDiscardNoMatch,
  DEFAULT_AUTO_DISCARD_TAG
};
