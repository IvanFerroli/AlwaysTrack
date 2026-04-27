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

test("scraper rejects unknown sources as input errors", async () => {
  const ingestion = new IngestionService(new InMemoryStateStore());

  await assert.rejects(
    () => runScraper(ingestion, "unknown"),
    (err) => err instanceof ScraperInputError && err.code === "UNKNOWN_SCRAPER_SOURCE"
  );
});

test("runScraper processes RSS seed list with multiple feeds and report per seed", async () => {
  const originalFetch = globalThis.fetch;
  const originalSeedEnv = process.env["SCRAPER_RSS_SEEDS"];
  delete process.env["SCRAPER_RSS_SEEDS"];

  globalThis.fetch = (async (input: string | URL | globalThis.Request): Promise<Response> => {
    const url = String(input);
    if (url.includes("feed-one.example")) {
      return {
        ok: true,
        status: 200,
        statusText: "OK",
        headers: new Headers({ "content-type": "application/rss+xml; charset=utf-8" }),
        text: async () => `<?xml version="1.0"?>
<rss version="2.0"><channel><item>
  <title>Backend Engineer at SeedOne</title>
  <link>https://jobs.seed-one.example/backend-engineer?utm=rss</link>
  <description><![CDATA[<p>Node.js and TypeScript</p>]]></description>
  <pubDate>Sun, 26 Apr 2026 17:00:00 GMT</pubDate>
</item></channel></rss>`
      } as Response;
    }

    if (url.includes("feed-two.example")) {
      return {
        ok: true,
        status: 200,
        statusText: "OK",
        headers: new Headers({ "content-type": "application/xml; charset=utf-8" }),
        text: async () => `<?xml version="1.0"?>
<rss version="2.0"><channel><item>
  <title>Frontend Engineer at SeedTwo</title>
  <link>https://jobs.seed-two.example/frontend-engineer</link>
  <description><![CDATA[<p>React and accessibility</p>]]></description>
  <pubDate>Sun, 26 Apr 2026 18:00:00 GMT</pubDate>
</item></channel></rss>`
      } as Response;
    }

    throw new Error(`unexpected URL in test: ${url}`);
  }) as typeof globalThis.fetch;

  try {
    const ingestion = new IngestionService(new InMemoryStateStore());
    const result = await runScraper(ingestion, "rss-seed", undefined, {
      rssSeeds: [
        "Seed One|https://feed-one.example/jobs.rss",
        "Seed Two|https://feed-two.example/jobs.rss"
      ],
      maxConcurrency: 2
    });

    assert.equal(result.source, "RSS Seed List");
    assert.equal(result.fetched, 2);
    assert.equal(result.parsed, 2);
    assert.equal(result.ingested, 2);
    assert.equal(result.sourceReports?.length, 2);

    const firstSeed = result.sourceReports?.find((item) => item.name.includes("Seed One"));
    const secondSeed = result.sourceReports?.find((item) => item.name.includes("Seed Two"));

    assert.equal(firstSeed?.method, "rss");
    assert.equal(firstSeed?.mode, "auto");
    assert.equal(firstSeed?.ingested, 1);
    assert.equal(secondSeed?.method, "rss");
    assert.equal(secondSeed?.mode, "auto");
    assert.equal(secondSeed?.ingested, 1);
  } finally {
    globalThis.fetch = originalFetch;
    if (originalSeedEnv === undefined) {
      delete process.env["SCRAPER_RSS_SEEDS"];
    } else {
      process.env["SCRAPER_RSS_SEEDS"] = originalSeedEnv;
    }
  }
});

test("runScraper rejects invalid RSS seed list", async () => {
  const ingestion = new IngestionService(new InMemoryStateStore());
  await assert.rejects(
    () =>
      runScraper(ingestion, "rss-seed", undefined, {
        rssSeeds: ["not-a-valid-url"]
      }),
    (err) => err instanceof ScraperInputError && err.code === "RSS_SEED_LIST_INVALID"
  );
});

test("runScraper accepts genericrss alias for RSS seed collector", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => {
    return {
      ok: true,
      status: 200,
      statusText: "OK",
      headers: new Headers({ "content-type": "application/rss+xml; charset=utf-8" }),
      text: async () => `<?xml version="1.0"?>
<rss version="2.0"><channel><item>
  <title>Platform Engineer at Seed Alias</title>
  <link>https://jobs.seed-alias.example/platform-engineer</link>
  <description><![CDATA[<p>Kubernetes and observability</p>]]></description>
</item></channel></rss>`
    } as Response;
  };

  try {
    const ingestion = new IngestionService(new InMemoryStateStore());
    const result = await runScraper(ingestion, "genericrss", undefined, {
      rssSeeds: ["Alias Seed|https://seed-alias.example/jobs.rss"]
    });

    assert.equal(result.source, "RSS Seed List");
    assert.equal(result.ingested, 1);
    assert.equal(result.sourceReports?.[0]?.name.includes("Alias Seed"), true);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("scraper source registry defines canonical method per source", () => {
  assert.equal(SCRAPER_SOURCES["remotive"].method, "api-json");
  assert.equal(SCRAPER_SOURCES["arbeitnow"].method, "api-json");
  assert.equal(SCRAPER_SOURCES["remoteok"].method, "api-json");
  assert.equal(SCRAPER_SOURCES["jobicy"].method, "api-json");
  assert.equal(SCRAPER_SOURCES["himalayas"].method, "api-json");
  assert.equal(SCRAPER_SOURCES["linkedin"].method, "html");
  assert.equal(SCRAPER_SOURCES["gupy"].method, "ats");
  assert.equal(SCRAPER_SOURCES["solides"].method, "ats");
  assert.equal(SCRAPER_SOURCES["indeed"].method, "rss");
  assert.equal(SCRAPER_SOURCES["glassdoor"].method, "html");
  assert.equal(SCRAPER_SOURCES["cryptojobslist"].method, "rss");
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

test("scraper parses CryptoJobsList RSS items with dedicated parser", () => {
  const items = parseJobItems(
    [
      {
        title: "Solidity Engineer at Onchain Labs",
        link: "https://cryptojobslist.com/jobs/solidity-engineer-onchain-labs?ref=feed",
        description: "<p>Build smart contracts with Solidity and TypeScript.</p>",
        pubDate: "Sun, 26 Apr 2026 19:00:00 GMT"
      }
    ],
    SCRAPER_SOURCES["cryptojobslist"]
  );

  assert.equal(items.length, 1);
  assert.equal(items[0]?.sourceName, "CryptoJobsList");
  assert.equal(items[0]?.companyName, "Onchain Labs");
  assert.equal(items[0]?.sourceUrl, "https://cryptojobslist.com/jobs/solidity-engineer-onchain-labs");
  assert.ok(items[0]?.description.includes("smart contracts"));
});

test("runScraper executes cryptojobslist RSS source in auto mode", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => {
    const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>CryptoJobsList Jobs</title>
    <item>
      <title>Protocol Engineer at ChainOps</title>
      <link>https://cryptojobslist.com/jobs/protocol-engineer-chainops?utm_source=rss</link>
      <description><![CDATA[<p>Protocol development with Rust and TypeScript.</p>]]></description>
      <pubDate>Sun, 26 Apr 2026 17:00:00 GMT</pubDate>
    </item>
  </channel>
</rss>`;
    return {
      ok: true,
      status: 200,
      statusText: "OK",
      headers: new Headers({ "content-type": "application/rss+xml; charset=utf-8" }),
      text: async () => rss
    } as Response;
  };

  try {
    const ingestion = new IngestionService(new InMemoryStateStore());
    const result = await runScraper(ingestion, "cryptojobslist");
    assert.equal(result.source, "CryptoJobsList");
    assert.equal(result.fetched, 1);
    assert.equal(result.parsed, 1);
    assert.equal(result.ingested, 1);
    assert.equal(result.sourceReports?.[0]?.mode, "auto");
    assert.equal(result.sourceReports?.[0]?.method, "rss");
    assert.equal(result.errors.length, 0);
  } finally {
    globalThis.fetch = originalFetch;
  }
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
    const result = await runScraper(ingestion, "remotive", "jr react", { autoDiscard: true });

    assert.equal(result.keywordRequested, "jr react");
    assert.equal(result.keywordEffective, "junior react");
    assert.equal(result.fetched, 1);
    assert.equal(result.ingested, 1);
    assert.equal(result.autoDiscarded, 1);
    assert.equal(result.errors.length, 0);
    assert.equal(result.sourceReports?.[0]?.mode, "auto");
    assert.equal(result.sourceReports?.[0]?.method, "api-json");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("runScraper reports fallback mode for unavailable platforms", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input: string | URL | globalThis.Request): Promise<Response> => {
    const url = String(input);
    if (url.includes("indeed.com")) {
      return {
        ok: true,
        status: 200,
        statusText: "OK",
        headers: new Headers({ "content-type": "text/html; charset=utf-8" }),
        text: async () =>
          `<html><body>
             <h1 class="jobsearch-JobInfoHeader-title">Backend Developer</h1>
             <div class="jobsearch-CompanyInfoContainer"><a href="#">Indeed Inc</a></div>
             <div class="jobsearch-JobInfoHeader-subtitle"><div>Remote</div></div>
             <div id="jobDescriptionText">Build backend services with node and typescript.</div>
           </body></html>`
      } as Response;
    }

    if (url.includes("solides.jobs")) {
      return {
        ok: true,
        status: 200,
        statusText: "OK",
        headers: new Headers({ "content-type": "text/html; charset=utf-8" }),
        text: async () =>
          `<html><body>
             <h2 class="vacancy-title">Desenvolvedor Backend</h2>
             <span class="vacancy-location">Remote</span>
             <div class="vacancy-description">Stack node js e typescript.</div>
           </body></html>`
      } as Response;
    }

    throw new Error(`unexpected URL in test: ${url}`);
  };

  try {
    const indeedIngestion = new IngestionService(new InMemoryStateStore());
    const indeedResult = await runScraper(indeedIngestion, "indeed", "node");
    assert.equal(indeedResult.sourceReports?.[0]?.mode, "fallback");
    assert.equal(indeedResult.sourceReports?.[0]?.method, "rss");
    assert.equal(indeedResult.sourceReports?.[0]?.fallbackMethod, "url-import");
    assert.ok(indeedResult.errors.length >= 1);

    const solidesIngestion = new IngestionService(new InMemoryStateStore());
    const solidesResult = await runScraper(solidesIngestion, "solides", "typescript");
    assert.equal(solidesResult.sourceReports?.[0]?.mode, "fallback");
    assert.equal(solidesResult.sourceReports?.[0]?.method, "ats");
    assert.equal(solidesResult.sourceReports?.[0]?.fallbackMethod, "url-import");
    assert.ok(solidesResult.errors.length >= 1);
    assert.equal(solidesResult.sourceReports?.[0]?.name, "Solides");
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

test("runScraper(all) limits concurrency and reports partial failures with timeout classification", async () => {
  const originalFetch = globalThis.fetch;
  const originalEnabledByDefault = new Map<string, boolean | undefined>();

  for (const [key, source] of Object.entries(SCRAPER_SOURCES)) {
    originalEnabledByDefault.set(key, source.enabledByDefault);
    source.enabledByDefault = false;
  }
  SCRAPER_SOURCES["remotive"].enabledByDefault = true;
  SCRAPER_SOURCES["arbeitnow"].enabledByDefault = true;
  SCRAPER_SOURCES["remoteok"].enabledByDefault = true;

  let inFlight = 0;
  let maxInFlight = 0;

  globalThis.fetch = (async (input: string | URL | globalThis.Request, init?: RequestInit): Promise<Response> => {
    inFlight++;
    maxInFlight = Math.max(maxInFlight, inFlight);

    const release = () => {
      inFlight--;
    };

    const url = String(input);
    if (url.includes("remotive.com")) {
      await new Promise((resolve) => setTimeout(resolve, 40));
      release();
      return {
        ok: true,
        status: 200,
        statusText: "OK",
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => ({
          jobs: [
            {
              title: "Backend Engineer",
              company_name: "Acme",
              url: "https://example.com/jobs/backend",
              candidate_required_location: "Remote",
              publication_date: "2026-04-26T00:00:00Z",
              description: "Node.js and TypeScript"
            }
          ]
        })
      } as Response;
    }

    if (url.includes("arbeitnow.com")) {
      await new Promise((resolve) => setTimeout(resolve, 30));
      release();
      return {
        ok: false,
        status: 503,
        statusText: "Service Unavailable",
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => ({})
      } as Response;
    }

    if (url.includes("remoteok.com")) {
      return await new Promise<Response>((resolve, reject) => {
        const timer = setTimeout(() => {
          release();
          resolve({
            ok: true,
            status: 200,
            statusText: "OK",
            headers: new Headers({ "content-type": "application/json" }),
            json: async () => ([{ legal: "meta" }])
          } as Response);
        }, 2_000);

        init?.signal?.addEventListener("abort", () => {
          clearTimeout(timer);
          release();
          reject(new DOMException("The operation was aborted due to timeout", "TimeoutError"));
        });
      });
    }

    release();
    throw new Error(`unexpected URL in test: ${url}`);
  }) as typeof globalThis.fetch;

  try {
    const ingestion = new IngestionService(new InMemoryStateStore());
    const result = await runScraper(ingestion, "all", undefined, {
      autoDiscard: false,
      maxConcurrency: 2,
      sourceTimeoutMs: 1_000
    });

    assert.equal(result.source, "All Sources");
    assert.equal(result.ingested, 1);
    assert.equal(result.deduplicated, 0);
    assert.ok(Array.isArray(result.sourceReports));
    assert.equal(result.sourceReports?.length, 3);
    assert.ok(maxInFlight <= 2);

    const remotiveReport = result.sourceReports?.find((item) => item.name === "Remotive");
    const arbeitnowReport = result.sourceReports?.find((item) => item.name === "Arbeitnow");
    const remoteOkReport = result.sourceReports?.find((item) => item.name === "RemoteOK");

    assert.equal(remotiveReport?.fetched, 1);
    assert.equal(remotiveReport?.parsed, 1);
    assert.equal(remotiveReport?.ingested, 1);
    assert.equal(remotiveReport?.mode, "auto");
    assert.equal(remotiveReport?.method, "api-json");
    assert.equal(remotiveReport?.failureType, undefined);

    assert.equal(arbeitnowReport?.mode, "auto");
    assert.equal(arbeitnowReport?.method, "api-json");
    assert.equal(arbeitnowReport?.failureType, "http");
    assert.equal(remoteOkReport?.mode, "auto");
    assert.equal(remoteOkReport?.method, "api-json");
    assert.equal(remoteOkReport?.failureType, "timeout");
    assert.ok((result.errors ?? []).length >= 2);
  } finally {
    globalThis.fetch = originalFetch;
    for (const [key, enabledByDefault] of originalEnabledByDefault.entries()) {
      SCRAPER_SOURCES[key].enabledByDefault = enabledByDefault;
    }
  }
});

test("runScraper(all) includes cryptojobslist and keeps cycle alive on RSS security-check failure", async () => {
  const originalFetch = globalThis.fetch;
  const originalEnabledByDefault = new Map<string, boolean | undefined>();

  for (const [key, source] of Object.entries(SCRAPER_SOURCES)) {
    originalEnabledByDefault.set(key, source.enabledByDefault);
    source.enabledByDefault = false;
  }
  SCRAPER_SOURCES["remotive"].enabledByDefault = true;
  SCRAPER_SOURCES["cryptojobslist"].enabledByDefault = true;

  globalThis.fetch = (async (input: string | URL | globalThis.Request): Promise<Response> => {
    const url = String(input);
    if (url.includes("remotive.com")) {
      return {
        ok: true,
        status: 200,
        statusText: "OK",
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => ({
          jobs: [
            {
              title: "Backend Engineer",
              company_name: "Acme",
              url: "https://example.com/jobs/backend-all",
              candidate_required_location: "Remote",
              publication_date: "2026-04-26T00:00:00Z",
              description: "Node.js and TypeScript"
            }
          ]
        })
      } as Response;
    }

    if (url.includes("cryptojobslist.com")) {
      return {
        ok: false,
        status: 403,
        statusText: "Forbidden",
        headers: new Headers({ "content-type": "text/html; charset=utf-8" }),
        text: async () => "<html>cloudflare challenge</html>"
      } as Response;
    }

    throw new Error(`unexpected URL in test: ${url}`);
  }) as typeof globalThis.fetch;

  try {
    const ingestion = new IngestionService(new InMemoryStateStore());
    const result = await runScraper(ingestion, "all", undefined, {
      autoDiscard: false,
      maxConcurrency: 2,
      sourceTimeoutMs: 2_000
    });

    assert.equal(result.sourceReports?.length, 2);
    const remotiveReport = result.sourceReports?.find((item) => item.name === "Remotive");
    const cryptoReport = result.sourceReports?.find((item) => item.name === "CryptoJobsList");

    assert.equal(remotiveReport?.mode, "auto");
    assert.equal(remotiveReport?.method, "api-json");
    assert.equal(remotiveReport?.ingested, 1);
    assert.equal(cryptoReport?.mode, "auto");
    assert.equal(cryptoReport?.method, "rss");
    assert.equal(cryptoReport?.failureType, "security-check");
    assert.ok((result.errors ?? []).length >= 1);
    assert.equal(result.ingested, 1);
  } finally {
    globalThis.fetch = originalFetch;
    for (const [key, enabledByDefault] of originalEnabledByDefault.entries()) {
      SCRAPER_SOURCES[key].enabledByDefault = enabledByDefault;
    }
  }
});

test("runScraper(rss-seed) uses default seed list when no seeds are configured", async () => {
  const originalFetch = globalThis.fetch;
  const originalSeedEnv = process.env["SCRAPER_RSS_SEEDS"];
  delete process.env["SCRAPER_RSS_SEEDS"];
  const visitedHosts = new Set<string>();

  globalThis.fetch = (async (input: string | URL | globalThis.Request): Promise<Response> => {
    const url = String(input);
    visitedHosts.add(new URL(url).host);
    return {
      ok: true,
      status: 200,
      statusText: "OK",
      headers: new Headers({ "content-type": "application/rss+xml; charset=utf-8" }),
      text: async () => `<?xml version="1.0"?><rss><channel><item>
        <title>Engineer at ${new URL(url).host}</title>
        <link>${url}</link>
        <description>Default seed feed entry</description>
        <pubDate>Sun, 26 Apr 2026 18:00:00 GMT</pubDate>
      </item></channel></rss>`
    } as Response;
  }) as typeof globalThis.fetch;

  try {
    const ingestion = new IngestionService(new InMemoryStateStore());
    const result = await runScraper(ingestion, "rss-seed");

    assert.equal(result.source, "RSS Seed List");
    assert.equal(result.sourceReports?.length, 3);
    assert.equal(visitedHosts.has("www.python.org"), true);
    assert.equal(visitedHosts.has("weworkremotely.com"), true);
    assert.equal(visitedHosts.has("remoteok.com"), true);
  } finally {
    globalThis.fetch = originalFetch;
    if (originalSeedEnv === undefined) {
      delete process.env["SCRAPER_RSS_SEEDS"];
    } else {
      process.env["SCRAPER_RSS_SEEDS"] = originalSeedEnv;
    }
  }
});

test("runScraper(rss-seed) ingests from multiple configured RSS feeds", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async (input: string | URL | globalThis.Request): Promise<Response> => {
    const url = String(input);
    if (url.includes("feed-one.example")) {
      return {
        ok: true,
        status: 200,
        statusText: "OK",
        headers: new Headers({ "content-type": "application/rss+xml; charset=utf-8" }),
        text: async () => `<?xml version="1.0"?><rss><channel><item>
          <title>Backend Engineer at Feed One</title>
          <link>https://feed-one.example/jobs/backend</link>
          <description>Node and TypeScript</description>
          <pubDate>Sun, 26 Apr 2026 17:00:00 GMT</pubDate>
        </item></channel></rss>`
      } as Response;
    }

    if (url.includes("feed-two.example")) {
      return {
        ok: true,
        status: 200,
        statusText: "OK",
        headers: new Headers({ "content-type": "application/xml; charset=utf-8" }),
        text: async () => `<?xml version="1.0"?><rss><channel><item>
          <title>Frontend Engineer at Feed Two</title>
          <link>https://feed-two.example/jobs/frontend</link>
          <description>React and TypeScript</description>
          <pubDate>Sun, 26 Apr 2026 18:00:00 GMT</pubDate>
        </item></channel></rss>`
      } as Response;
    }

    throw new Error(`unexpected URL in test: ${url}`);
  }) as typeof globalThis.fetch;

  try {
    const ingestion = new IngestionService(new InMemoryStateStore());
    const result = await runScraper(ingestion, "rss-seed", undefined, {
      rssSeeds: ["https://feed-one.example/jobs.rss", "https://feed-two.example/jobs.rss"]
    });

    assert.equal(result.source, "RSS Seed List");
    assert.equal(result.fetched, 2);
    assert.equal(result.parsed, 2);
    assert.equal(result.ingested, 2);
    assert.equal(result.errors.length, 0);
    assert.equal(result.sourceReports?.length, 2);
    assert.equal(result.sourceReports?.every((report) => report.method === "rss"), true);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
