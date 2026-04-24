import type { IngestionService } from "../ingestion/ingestion.service.js";
import { fetchJobItems } from "./scraper.fetcher.js";
import { parseJobItems } from "./scraper.parser.js";
import type { ScraperRunResult, ScraperSourceConfig } from "./scraper.types.js";

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
  }
};

/**
 * Orquestra o ciclo completo: fetch → parse → ingest.
 * Delega ao IngestionService para manter deduplicação e auditoria.
 */
export async function runScraper(
  ingestionService: IngestionService,
  sourceKey = process.env["SCRAPER_SOURCE"] ?? "remotive"
): Promise<ScraperRunResult> {
  const source = SCRAPER_SOURCES[sourceKey];

  if (!source) {
    throw new Error(
      `[scraper.runner] unknown source key: "${sourceKey}". Available: ${Object.keys(SCRAPER_SOURCES).join(", ")}`
    );
  }

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
    source: source.name,
    fetched: rawItems.length,
    ingested,
    deduplicated,
    errors
  };
}
