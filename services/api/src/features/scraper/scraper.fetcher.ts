import type { ScraperSourceConfig, RawJobItem } from "./scraper.types.js";

function decodeXmlEntities(input: string): string {
  return input
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/gi, "$1")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&nbsp;/gi, " ")
    .replace(/&quot;/gi, "\"")
    .replace(/&#39;/gi, "'")
    .replace(/&#x2f;/gi, "/")
    .replace(/&#x3a;/gi, ":")
    .replace(/&#(\d+);/g, (_match, code) => {
      const parsed = Number.parseInt(code, 10);
      if (!Number.isFinite(parsed)) return "";
      return String.fromCharCode(parsed);
    })
    .trim();
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function extractXmlTag(block: string, tagName: string): string | undefined {
  const match = block.match(new RegExp(`<${escapeRegex(tagName)}[^>]*>([\\s\\S]*?)</${escapeRegex(tagName)}>`, "i"));
  if (!match?.[1]) return undefined;
  const cleaned = decodeXmlEntities(match[1]);
  return cleaned.length > 0 ? cleaned : undefined;
}

function extractAtomLink(block: string): string | undefined {
  const hrefMatch = block.match(/<link\b[^>]*\bhref=["']([^"']+)["'][^>]*\/?>/i);
  if (!hrefMatch?.[1]) return undefined;
  const cleaned = decodeXmlEntities(hrefMatch[1]);
  return cleaned.length > 0 ? cleaned : undefined;
}

function parseRssItems(xml: string): RawJobItem[] {
  const items: RawJobItem[] = [];
  const matches = xml.matchAll(/<item\b[^>]*>([\s\S]*?)<\/item>/gi);

  for (const match of matches) {
    const block = match[1] ?? "";
    const title = extractXmlTag(block, "title");
    const link = extractXmlTag(block, "link") ?? extractXmlTag(block, "guid");
    const description =
      extractXmlTag(block, "description") ??
      extractXmlTag(block, "content:encoded") ??
      extractXmlTag(block, "summary");
    const pubDate = extractXmlTag(block, "pubDate") ?? extractXmlTag(block, "dc:date");
    const creator = extractXmlTag(block, "dc:creator");
    const companyName = extractXmlTag(block, "company");
    const location = extractXmlTag(block, "location");

    items.push({
      title,
      link,
      description,
      pubDate,
      creator,
      companyName,
      location
    });
  }

  if (items.length === 0) {
    const entries = xml.matchAll(/<entry\b[^>]*>([\s\S]*?)<\/entry>/gi);
    for (const match of entries) {
      const block = match[1] ?? "";
      const title = extractXmlTag(block, "title");
      const link =
        extractAtomLink(block) ??
        extractXmlTag(block, "id") ??
        extractXmlTag(block, "link");
      const description =
        extractXmlTag(block, "summary") ??
        extractXmlTag(block, "content") ??
        extractXmlTag(block, "description");
      const pubDate =
        extractXmlTag(block, "updated") ??
        extractXmlTag(block, "published") ??
        extractXmlTag(block, "dc:date");
      const creator =
        extractXmlTag(block, "author") ??
        extractXmlTag(block, "dc:creator");

      items.push({
        title,
        link,
        description,
        pubDate,
        creator
      });
    }
  }

  return items;
}

function parseSitemapLocs(xml: string, tagName: "url" | "sitemap"): string[] {
  const matches = xml.matchAll(new RegExp(`<${tagName}\\b[^>]*>([\\s\\S]*?)<\\/${tagName}>`, "gi"));
  const urls: string[] = [];

  for (const match of matches) {
    const block = match[1] ?? "";
    const loc = extractXmlTag(block, "loc");
    if (!loc) continue;
    try {
      const parsed = new URL(loc);
      if (parsed.protocol === "http:" || parsed.protocol === "https:") {
        urls.push(parsed.toString());
      }
    } catch {
      // Ignore malformed sitemap locs.
    }
  }

  return urls;
}

export async function fetchSitemapUrls(
  sitemapUrl: string,
  timeoutMs = 15_000,
  maxUrls = 500
): Promise<string[]> {
  const response = await fetch(sitemapUrl, {
    headers: {
      "user-agent": "olympus-climb-scraper/1.0 (job-discovery; contact: dev@olympus-climb.local)",
      "accept": "application/xml, text/xml;q=0.9, */*;q=0.1"
    },
    signal: AbortSignal.timeout(timeoutMs)
  });

  if (!response.ok) {
    throw new Error(`[scraper.fetcher] sitemap fetch failed: HTTP ${response.status} ${response.statusText}`);
  }

  const xml = (await response.text()).slice(0, 2_000_000);
  const contentType = response.headers.get("content-type") ?? "";
  const looksXml = contentType.includes("xml") || xml.includes("<urlset") || xml.includes("<sitemapindex");
  if (!looksXml) {
    throw new Error(`[scraper.fetcher] sitemap unexpected content-type: ${contentType}`);
  }

  const urlSetEntries = parseSitemapLocs(xml, "url");
  if (urlSetEntries.length > 0) {
    return urlSetEntries.slice(0, maxUrls);
  }

  const nestedSitemaps = parseSitemapLocs(xml, "sitemap").slice(0, 5);
  const collected = new Set<string>();
  for (const nested of nestedSitemaps) {
    if (collected.size >= maxUrls) break;
    try {
      const nestedUrls = await fetchSitemapUrls(nested, timeoutMs, maxUrls - collected.size);
      for (const url of nestedUrls) {
        collected.add(url);
        if (collected.size >= maxUrls) break;
      }
    } catch {
      // Keep discovery resilient on partial sitemap failures.
    }
  }

  return [...collected];
}

/**
 * Faz fetch do feed público da fonte e retorna os itens brutos.
 * Usa `fetch` nativo do Node 18+. Sem browser headless.
 */
export async function fetchJobItems(
  source: ScraperSourceConfig,
  timeoutMs = 15_000
): Promise<RawJobItem[]> {
  const response = await fetch(source.url, {
    headers: {
      "user-agent": "olympus-climb-scraper/1.0 (job-matching-tool; contact: dev@olympus-climb.local)",
      "accept":
        source.method === "html" || source.method === "html-jsonld"
          ? "text/html"
          : source.method === "rss"
            ? "application/rss+xml, application/xml, text/xml;q=0.9, */*;q=0.1"
            : "application/json"
    },
    signal: AbortSignal.timeout(timeoutMs)
  });

  if (!response.ok) {
    throw new Error(
      `[scraper.fetcher] fetch failed for ${source.name}: HTTP ${response.status} ${response.statusText}`
    );
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (source.format === "linkedin-guest-html") {
    if (!contentType.includes("text/html")) {
      throw new Error(
        `[scraper.fetcher] unexpected content-type for ${source.name}: ${contentType}`
      );
    }
    const html = (await response.text()).slice(0, 500_000);
    return html
      .split(/<li>/gi)
      .map((chunk) => chunk.trim())
      .filter((chunk) => chunk.includes("base-search-card") && chunk.includes("job-search-card"))
      .map((chunk) => ({ html: `<li>${chunk}` }));
  }

  if (source.format === "cryptojobslist-rss" || source.format === "generic-rss") {
    const xml = (await response.text()).slice(0, 2_000_000);
    const hasXmlContentType =
      contentType.includes("application/rss+xml") ||
      contentType.includes("application/xml") ||
      contentType.includes("text/xml");

    if (!hasXmlContentType && !xml.includes("<rss") && !xml.includes("<feed")) {
      throw new Error(
        `[scraper.fetcher] unexpected content-type for ${source.name}: ${contentType}`
      );
    }

    const items = parseRssItems(xml);
    if (items.length === 0) {
      throw new Error(`[scraper.fetcher] ${source.name} RSS response missing 'item' entries`);
    }
    return items;
  }

  if (!contentType.includes("application/json")) {
    throw new Error(
      `[scraper.fetcher] unexpected content-type for ${source.name}: ${contentType}`
    );
  }

  const data = await response.json() as unknown;

  if (source.format === "remotive-json") {
    // Remotive: { jobs: [...] }
    const payload = data as { jobs?: RawJobItem[] };
    if (!Array.isArray(payload.jobs)) {
      throw new Error(`[scraper.fetcher] Remotive response missing 'jobs' array`);
    }
    return payload.jobs;
  }

  if (source.format === "arbeitnow-json") {
    // Arbeitnow: { data: [...] }
    const payload = data as { data?: RawJobItem[] };
    if (!Array.isArray(payload.data)) {
      throw new Error(`[scraper.fetcher] Arbeitnow response missing 'data' array`);
    }
    return payload.data;
  }

  if (source.format === "remoteok-json") {
    // RemoteOK: array onde índice 0 é meta e os restantes são jobs
    const arr = data as RawJobItem[];
    if (!Array.isArray(arr) || arr.length < 2) {
      throw new Error(`[scraper.fetcher] RemoteOK response invalid array`);
    }
    // Remove o índice 0 (legal/meta)
    return arr.slice(1);
  }

  if (source.format === "jobicy-json") {
    // Jobicy: { jobs: [...] }
    const payload = data as { jobs?: RawJobItem[] };
    if (!Array.isArray(payload.jobs)) {
      throw new Error(`[scraper.fetcher] Jobicy response missing 'jobs' array`);
    }
    return payload.jobs;
  }

  if (source.format === "himalayas-json") {
    const payload = data as { jobs?: RawJobItem[] };
    if (!Array.isArray(payload.jobs)) {
      throw new Error(`[scraper.fetcher] Himalayas response missing 'jobs' array`);
    }
    return payload.jobs;
  }

  if (source.format === "gupy-public-json") {
    const payload = data as { data?: RawJobItem[] };
    if (!Array.isArray(payload.data)) {
      throw new Error(`[scraper.fetcher] Gupy response missing 'data' array`);
    }
    return payload.data;
  }

  if (source.format === "greenhouse-json") {
    const payload = data as { jobs?: RawJobItem[] };
    if (!Array.isArray(payload.jobs)) {
      throw new Error(`[scraper.fetcher] Greenhouse response missing 'jobs' array`);
    }
    return payload.jobs;
  }

  if (source.format === "lever-json") {
    const payload = data as RawJobItem[];
    if (!Array.isArray(payload)) {
      throw new Error(`[scraper.fetcher] Lever response must be an array`);
    }
    return payload;
  }

  if (source.format === "workday-json") {
    if (Array.isArray(data)) {
      return data as RawJobItem[];
    }

    const payload = data as { jobPostings?: RawJobItem[]; postings?: RawJobItem[] };
    if (Array.isArray(payload.jobPostings)) {
      return payload.jobPostings;
    }
    if (Array.isArray(payload.postings)) {
      return payload.postings;
    }

    throw new Error(`[scraper.fetcher] Workday response missing supported jobs array`);
  }

  throw new Error(`[scraper.fetcher] unsupported format: ${source.format}`);
}
