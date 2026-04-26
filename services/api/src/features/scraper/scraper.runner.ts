import type { IngestionService } from "../ingestion/ingestion.service.js";
import { fetchJobItems } from "./scraper.fetcher.js";
import { parseJobItems } from "./scraper.parser.js";
import type { ScraperRunResult, ScraperSourceConfig, SourceRunResult } from "./scraper.types.js";

const SENIORITY_KEYWORDS = new Set(["junior", "júnior", "pleno", "senior", "sênior", "estagio", "estágio", "intern"]);

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

async function runSingleSource(
  ingestionService: IngestionService,
  source: ScraperSourceConfig,
  keyword?: string
): Promise<SourceRunResult> {
  const rawItems = await fetchJobItems(source);
  const parsedItems = filterParsedItemsByKeyword(parseJobItems(rawItems, source), keyword);

  const errors: string[] = [];
  let ingested = 0;
  let deduplicated = 0;

  for (const item of parsedItems) {
    try {
      const result = await ingestionService.ingest(item);
      if (result.ok) {
        if (result.data.deduplicated) {
          deduplicated++;
        } else {
          ingested++;
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
    errors
  };
}

export function filterParsedItemsByKeyword<T extends { title: string; companyName: string; sourceName: string; location?: string; description: string }>(
  items: T[],
  keyword?: string
): T[] {
  const terms = keyword
    ?.toLowerCase()
    .split(/\s+/)
    .map((term) => term.trim())
    .filter((term) => term.length > 0);

  if (!terms || terms.length === 0) {
    return items;
  }

  return items.filter((item) => {
    const title = item.title.toLowerCase();
    const seniorityTerms = terms.filter((term) => SENIORITY_KEYWORDS.has(term));
    if (seniorityTerms.length > 0 && !seniorityTerms.every((term) => title.includes(term))) {
      return false;
    }

    const haystack = [
      item.title,
      item.companyName,
      item.sourceName,
      item.location ?? "",
      item.description
    ].join(" ").toLowerCase();

    return terms.every((term) => haystack.includes(term));
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
  if (sourceKey === "all") {
    const defaultSources = Object.values(SCRAPER_SOURCES).filter((src) => src.enabledByDefault !== false);
    const settledResults = await Promise.allSettled(
      defaultSources.map((src) => runSingleSource(ingestionService, applyKeywordToSource(src, keyword), keyword))
    );

    const results = settledResults
      .filter((r): r is PromiseFulfilledResult<SourceRunResult> => r.status === "fulfilled")
      .map(r => r.value);

    const rejectedErrors = settledResults
      .filter((r): r is PromiseRejectedResult => r.status === "rejected")
      .map(r => `[source error] ${r.reason instanceof Error ? r.reason.message : String(r.reason)}`);

    const total = results.reduce(
      (acc, res) => ({
        fetched: acc.fetched + res.fetched,
        ingested: acc.ingested + res.ingested,
        deduplicated: acc.deduplicated + res.deduplicated,
        errors: [...acc.errors, ...res.errors]
      }),
      { fetched: 0, ingested: 0, deduplicated: 0, errors: rejectedErrors }
    );

    return {
      source: "All Sources",
      ...total,
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

  const res = await runSingleSource(ingestionService, applyKeywordToSource(source, keyword), keyword);
  return {
    source: res.name,
    fetched: res.fetched,
    ingested: res.ingested,
    deduplicated: res.deduplicated,
    errors: res.errors
  };
}
