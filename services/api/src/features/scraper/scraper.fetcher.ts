import type { ScraperSourceConfig, RawJobItem } from "./scraper.types.js";

/**
 * Faz fetch do feed público da fonte e retorna os itens brutos.
 * Usa `fetch` nativo do Node 18+. Sem browser headless.
 */
export async function fetchJobItems(source: ScraperSourceConfig): Promise<RawJobItem[]> {
  const response = await fetch(source.url, {
    headers: {
      "user-agent": "olympus-climb-scraper/1.0 (job-matching-tool; contact: dev@olympus-climb.local)",
      "accept": "application/json"
    },
    signal: AbortSignal.timeout(15_000)
  });

  if (!response.ok) {
    throw new Error(
      `[scraper.fetcher] fetch failed for ${source.name}: HTTP ${response.status} ${response.statusText}`
    );
  }

  const contentType = response.headers.get("content-type") ?? "";
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

  throw new Error(`[scraper.fetcher] unsupported format: ${source.format}`);
}
