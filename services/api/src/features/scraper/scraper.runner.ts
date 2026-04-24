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
    url: "https://remotive.com/api/remote-jobs?limit=50",
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
    url: "https://jobicy.com/api/v2/remote-jobs",
    format: "jobicy-json"
  }
};

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
  sourceKey = process.env["SCRAPER_SOURCE"] ?? "all"
): Promise<ScraperRunResult> {
  if (sourceKey === "all") {
    const results = await Promise.all(
      Object.values(SCRAPER_SOURCES).map(src => runSingleSource(ingestionService, src))
    );

    const total = results.reduce(
      (acc, res) => ({
        fetched: acc.fetched + res.fetched,
        ingested: acc.ingested + res.ingested,
        deduplicated: acc.deduplicated + res.deduplicated,
        errors: [...acc.errors, ...res.errors]
      }),
      { fetched: 0, ingested: 0, deduplicated: 0, errors: [] as string[] }
    );

    return {
      source: "All Sources",
      ...total,
      sources: results
    };
  }

  const source = SCRAPER_SOURCES[sourceKey];
  if (!source) {
    throw new Error(
      `[scraper.runner] unknown source key: "${sourceKey}". Available: all, ${Object.keys(SCRAPER_SOURCES).join(", ")}`
    );
  }

  const res = await runSingleSource(ingestionService, source);
  return {
    source: res.name,
    fetched: res.fetched,
    ingested: res.ingested,
    deduplicated: res.deduplicated,
    errors: res.errors
  };
}
