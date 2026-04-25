import { strict as assert } from "node:assert";
import test from "node:test";
import { InMemoryStateStore } from "../../domain/state/store.js";
import { IngestionService } from "../ingestion/ingestion.service.js";
import { applyKeywordToSource, runScraper, SCRAPER_SOURCES, ScraperInputError } from "./scraper.runner.js";

test("scraper keyword injection preserves valid URLs per supported source", () => {
  const arbeitnow = applyKeywordToSource(SCRAPER_SOURCES["arbeitnow"], "type script");
  assert.equal(new URL(arbeitnow.url).searchParams.get("search"), "type script");

  const jobicy = applyKeywordToSource(SCRAPER_SOURCES["jobicy"], "typescript");
  assert.equal(new URL(jobicy.url).searchParams.get("tag"), "typescript");
  assert.equal(new URL(jobicy.url).searchParams.get("count"), "50");

  const remoteok = applyKeywordToSource(SCRAPER_SOURCES["remoteok"], "typescript");
  assert.equal(remoteok.url, SCRAPER_SOURCES["remoteok"].url);
});

test("scraper rejects unknown and unavailable sources as input errors", async () => {
  const ingestion = new IngestionService(new InMemoryStateStore());

  await assert.rejects(
    () => runScraper(ingestion, "unknown"),
    (err) => err instanceof ScraperInputError && err.code === "UNKNOWN_SCRAPER_SOURCE"
  );

  await assert.rejects(
    () => runScraper(ingestion, "cryptojobslist"),
    (err) => err instanceof ScraperInputError && err.code === "UNAVAILABLE_SCRAPER_SOURCE"
  );
});
