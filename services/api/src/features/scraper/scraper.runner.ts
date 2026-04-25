import type { IngestionService } from "../ingestion/ingestion.service.js";
import { fetchJobItems } from "./scraper.fetcher.js";
import { parseJobItems } from "./scraper.parser.js";
import type { ScraperRunResult, ScraperSourceConfig, SourceRunResult } from "./scraper.types.js";

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

  return { ...source, url: url.toString() };
}

async function runSingleSource(
  ingestionService: IngestionService,
  source: ScraperSourceConfig
): Promise<SourceRunResult> {
  const rawItems = await fetchJobItems(source);
  const parsedItems = parseJobItems(rawItems, source);

  const errors: string[] = [];
  let ingested = 0;
  let deduplicated = 0;

  for (const item of parsedItems) {
    try {
      const result = ingestionService.ingest(item);
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
      defaultSources.map((src) => runSingleSource(ingestionService, applyKeywordToSource(src, keyword)))
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

  const res = await runSingleSource(ingestionService, applyKeywordToSource(source, keyword));
  return {
    source: res.name,
    fetched: res.fetched,
    ingested: res.ingested,
    deduplicated: res.deduplicated,
    errors: res.errors
  };
}
