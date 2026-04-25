import type { HttpHandler } from "../../core/http/types.js";
import { sendApiResult, sendJson } from "../../core/http/send.js";
import { IngestionService } from "../ingestion/ingestion.service.js";
import { runScraper } from "./scraper.runner.js";

export function createScraperHandlers(ingestionService: IngestionService): {
  run: HttpHandler;
} {
  const run: HttpHandler = async ({ request, response }) => {
    // Aceitar ?source=arbeitnow etc. via query param
    const rawUrl = request.url ?? "";
    const queryStart = rawUrl.indexOf("?");
    const params = new URLSearchParams(queryStart >= 0 ? rawUrl.slice(queryStart + 1) : "");
    const sourceKey = params.get("source") ?? process.env["SCRAPER_SOURCE"] ?? "all";
    const keyword = params.get("keyword") ?? undefined;

    try {
      const result = await runScraper(ingestionService, sourceKey, keyword);
      sendApiResult(response, {
        ok: true,
        data: {
          ok: result.errors.length === 0,
          source: result.source,
          fetched: result.fetched,
          ingested: result.ingested,
          deduplicated: result.deduplicated,
          errors: result.errors,
          sources: result.sources
        }
      });
    } catch (err) {
      sendJson(response, 500, {
        ok: false,
        error: {
          code: "SCRAPER_ERROR",
          message: err instanceof Error ? err.message : "Unknown scraper error"
        }
      });
    }
  };

  return { run };
}
