import { strict as assert } from "node:assert";
import test from "node:test";
import { InMemoryStateStore } from "../../domain/state/store.js";
import { IngestionService } from "../ingestion/ingestion.service.js";
import { parseJobItems } from "./scraper.parser.js";
import {
  applyKeywordToSource,
  filterParsedItemsByKeyword,
  runScraper,
  SCRAPER_INTERNALS,
  SCRAPER_SOURCES,
  ScraperInputError
} from "./scraper.runner.js";

test("scraper keyword injection preserves valid URLs per supported source", () => {
  const arbeitnow = applyKeywordToSource(SCRAPER_SOURCES["arbeitnow"], "type script");
  assert.equal(new URL(arbeitnow.url).searchParams.get("search"), "type script");

  const jobicy = applyKeywordToSource(SCRAPER_SOURCES["jobicy"], "typescript");
  assert.equal(new URL(jobicy.url).searchParams.get("tag"), "typescript");
  assert.equal(new URL(jobicy.url).searchParams.get("count"), "50");

  const remoteok = applyKeywordToSource(SCRAPER_SOURCES["remoteok"], "typescript");
  assert.equal(remoteok.url, SCRAPER_SOURCES["remoteok"].url);

  const linkedin = applyKeywordToSource(SCRAPER_SOURCES["linkedin"], "node");
  assert.equal(new URL(linkedin.url).searchParams.get("keywords"), "node");

  const gupy = applyKeywordToSource(SCRAPER_SOURCES["gupy"], "backend");
  assert.equal(new URL(gupy.url).searchParams.get("name"), "backend");
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

  await assert.rejects(
    () => runScraper(ingestion, "indeed"),
    (err) => err instanceof ScraperInputError && err.code === "UNAVAILABLE_SCRAPER_SOURCE"
  );
});

test("scraper keyword post-filter keeps seniority keywords strict to title", () => {
  const items = [
    {
      title: "Senior Backend Engineer",
      companyName: "Acme",
      sourceName: "LinkedIn",
      sourceUrl: "https://example.com/senior",
      location: "Remote",
      description: "Mentor junior developers using Node.js"
    },
    {
      title: "Junior Full Stack Developer",
      companyName: "Acme",
      sourceName: "LinkedIn",
      sourceUrl: "https://example.com/junior",
      location: "Remote",
      description: "React and Node.js"
    }
  ];

  const filtered = filterParsedItemsByKeyword(items, "junior");
  assert.equal(filtered.length, 1);
  assert.equal(filtered[0]?.title, "Junior Full Stack Developer");
});

test("scraper keyword aliases normalize accents and short forms", () => {
  const items = [
    {
      title: "JR Frontend Engineer",
      companyName: "Acme",
      sourceName: "LinkedIn",
      sourceUrl: "https://example.com/jr",
      location: "Remote",
      description: "Building React.js interfaces"
    },
    {
      title: "Senior Frontend Engineer",
      companyName: "Acme",
      sourceName: "LinkedIn",
      sourceUrl: "https://example.com/sr",
      location: "Remote",
      description: "Building React.js interfaces for junior teammates"
    }
  ];

  const filtered = filterParsedItemsByKeyword(items, "júnior react");
  assert.equal(filtered.length, 1);
  assert.equal(filtered[0]?.title, "JR Frontend Engineer");

  const plan = SCRAPER_INTERNALS.buildKeywordPlan("júnior react");
  assert.equal(plan.effective, "junior react");
});

test("scraper parses LinkedIn guest search cards with platform source", () => {
  const items = parseJobItems(
    [
      {
        html: `
          <li>
            <a class="base-card__full-link" href="https://br.linkedin.com/jobs/view/software-engineer-at-acme-123?trackingId=x"></a>
            <h3 class="base-search-card__title"> Software Engineer </h3>
            <h4 class="base-search-card__subtitle"> Acme Corp </h4>
            <span class="job-search-card__location"> Brazil </span>
            <time datetime="2026-04-20"></time>
          </li>
        `
      }
    ],
    SCRAPER_SOURCES["linkedin"]
  );

  assert.equal(items.length, 1);
  assert.equal(items[0]?.sourceName, "LinkedIn");
  assert.equal(items[0]?.companyName, "Acme Corp");
  assert.equal(items[0]?.sourceUrl, "https://br.linkedin.com/jobs/view/software-engineer-at-acme-123");
});

test("scraper parses Gupy public portal items with platform source", () => {
  const items = parseJobItems(
    [
      {
        name: "Pessoa Desenvolvedora Backend",
        careerPageName: "FCamara",
        jobUrl: "https://fcamara.gupy.io/jobs/123",
        description: "<p>Node.js, TypeScript e PostgreSQL.</p>",
        isRemoteWork: true,
        publishedDate: "2026-04-20T00:00:00Z"
      }
    ],
    SCRAPER_SOURCES["gupy"]
  );

  assert.equal(items.length, 1);
  assert.equal(items[0]?.sourceName, "Gupy");
  assert.equal(items[0]?.companyName, "FCamara");
  assert.equal(items[0]?.location, "Remote");
});

test("runScraper returns autoDiscarded and keywordEffective", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => {
    const payload = {
      jobs: [
        {
          title: "Junior React Developer",
          company_name: "Frontend Inc",
          url: "https://example.com/jobs/react-junior",
          candidate_required_location: "Remote",
          publication_date: "2026-04-26T00:00:00Z",
          description: "Build React.js experiences with modern CSS."
        }
      ]
    };

    return {
      ok: true,
      status: 200,
      statusText: "OK",
      headers: new Headers({ "content-type": "application/json" }),
      json: async () => payload
    } as Response;
  };

  try {
    const ingestion = new IngestionService(new InMemoryStateStore());
    const result = await runScraper(ingestion, "remotive", "jr react");

    assert.equal(result.keywordRequested, "jr react");
    assert.equal(result.keywordEffective, "junior react");
    assert.equal(result.fetched, 1);
    assert.equal(result.ingested, 1);
    assert.equal(result.autoDiscarded, 1);
    assert.equal(result.errors.length, 0);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("runScraper can disable autoDiscard and later apply it on deduped new posting", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => {
    const payload = {
      jobs: [
        {
          title: "Junior React Developer",
          company_name: "Frontend Inc",
          url: "https://example.com/jobs/react-junior-dedupe",
          candidate_required_location: "Remote",
          publication_date: "2026-04-26T00:00:00Z",
          description: "Build React.js experiences with modern CSS."
        }
      ]
    };

    return {
      ok: true,
      status: 200,
      statusText: "OK",
      headers: new Headers({ "content-type": "application/json" }),
      json: async () => payload
    } as Response;
  };

  try {
    const store = new InMemoryStateStore();
    const ingestion = new IngestionService(store);

    const first = await runScraper(ingestion, "remotive", "jr react", { autoDiscard: false });
    assert.equal(first.ingested, 1);
    assert.equal(first.autoDiscarded, 0);

    const second = await runScraper(ingestion, "remotive", "jr react", { autoDiscard: true });
    assert.equal(second.deduplicated, 1);
    assert.equal(second.autoDiscarded, 1);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
