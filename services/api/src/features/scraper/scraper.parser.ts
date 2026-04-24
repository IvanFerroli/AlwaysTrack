import type { IngestJobPostingInput } from "@olympus/shared-types";
import type { RawJobItem, ScraperSourceConfig } from "./scraper.types.js";

function safeStr(value: unknown, fallback = ""): string {
  if (typeof value === "string" && value.trim().length > 0) return value.trim();
  return fallback;
}

function safeDateStr(value: unknown): string | undefined {
  if (typeof value === "string" && value.trim().length > 0) {
    const d = new Date(value);
    if (!isNaN(d.getTime())) return d.toISOString();
  }
  if (typeof value === "number") {
    // try to handle unix timestamp in seconds
    const d = new Date(value * 1000);
    if (!isNaN(d.getTime())) return d.toISOString();
  }
  return undefined;
}

function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "…";
}

/**
 * Remove tags HTML da string, preservando o texto legível.
 * Sem dependências externas — regex simples e suficiente para feeds JSON.
 */
function stripHtml(raw: string): string {
  return raw
    .replace(/<[^>]*>/g, " ")   // remove tags
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s{2,}/g, " ")    // colapsa espaços múltiplos
    .trim();
}

/**
 * Converte um item bruto do formato Remotive para IngestJobPostingInput.
 */
function parseRemotiveItem(item: RawJobItem, sourceName: string): IngestJobPostingInput | null {
  const title = safeStr(item["title"]);
  const companyName = safeStr(item["company_name"]);
  const sourceUrl = safeStr(item["url"]);
  const description = safeStr(item["description"]);
  const location = safeStr(item["candidate_required_location"], "Remote");
  const postedAt = safeDateStr(item["publication_date"]);

  if (!title || !companyName || !sourceUrl || !description) return null;

  return {
    title,
    companyName,
    sourceName,
    sourceUrl,
    location,
    postedAt,
    description: truncate(stripHtml(description), 4000)
  };
}

/**
 * Converte um item bruto do formato Arbeitnow para IngestJobPostingInput.
 */
function parseArbeitnowItem(item: RawJobItem, sourceName: string): IngestJobPostingInput | null {
  const title = safeStr(item["title"]);
  const companyName = safeStr(item["company_name"]);
  const sourceUrl = safeStr(item["url"]);
  const description = safeStr(item["description"]);
  const location = safeStr(item["location"], "Remote");
  const postedAt = safeDateStr(item["created_at"]);

  if (!title || !companyName || !sourceUrl || !description) return null;

  return {
    title,
    companyName,
    sourceName,
    sourceUrl,
    location,
    postedAt,
    description: truncate(stripHtml(description), 4000)
  };
}

/**
 * Converte um item bruto do formato RemoteOK para IngestJobPostingInput.
 */
function parseRemoteOkItem(item: RawJobItem, sourceName: string): IngestJobPostingInput | null {
  const title = safeStr(item["position"]);
  const companyName = safeStr(item["company"]);
  const sourceUrl = safeStr(item["url"]);
  const description = safeStr(item["description"]);
  const location = safeStr(item["location"], "Remote");
  const postedAt = safeDateStr(item["date"]);

  if (!title || !companyName || !sourceUrl || !description) return null;

  return {
    title,
    companyName,
    sourceName,
    sourceUrl,
    location,
    postedAt,
    description: truncate(stripHtml(description), 4000)
  };
}

/**
 * Converte um item bruto do formato Jobicy para IngestJobPostingInput.
 */
function parseJobicyItem(item: RawJobItem, sourceName: string): IngestJobPostingInput | null {
  const title = safeStr(item["jobTitle"]);
  const companyName = safeStr(item["companyName"]);
  const sourceUrl = safeStr(item["url"]);
  const description = safeStr(item["jobDescription"]);
  const location = safeStr(item["jobGeo"], "Remote");
  const postedAt = safeDateStr(item["pubDate"]);

  if (!title || !companyName || !sourceUrl || !description) return null;

  return {
    title,
    companyName,
    sourceName,
    sourceUrl,
    location,
    postedAt,
    description: truncate(stripHtml(description), 4000)
  };
}

/**
 * Converte um item bruto do formato Himalayas para IngestJobPostingInput.
 */
function parseHimalayasItem(item: RawJobItem, sourceName: string): IngestJobPostingInput | null {
  const title = safeStr(item["title"]);
  const companyName = safeStr(item["companyName"]);
  const sourceUrl = safeStr(item["applicationLink"]);
  const description = safeStr(item["description"]);
  
  let location = "Remote";
  if (Array.isArray(item["locationRestrictions"]) && item["locationRestrictions"].length > 0) {
    location = String(item["locationRestrictions"].join(", "));
  }

  const postedAt = safeDateStr(item["pubDate"]);

  if (!title || !companyName || !sourceUrl || !description) return null;

  return {
    title,
    companyName,
    sourceName,
    sourceUrl,
    location,
    postedAt,
    description: truncate(stripHtml(description), 4000)
  };
}

/**
 * Converte um item bruto do formato CryptoJobsList para IngestJobPostingInput.
 */
function parseCryptoJobsListItem(item: RawJobItem, sourceName: string): IngestJobPostingInput | null {
  const title = safeStr(item["jobTitle"]);
  const companyName = safeStr(item["companyName"]);
  const sourceUrl = safeStr(item["applicationLink"]);
  const description = safeStr(item["jobDescription"]);
  const location = safeStr(item["location"], "Remote");
  const postedAt = safeDateStr(item["publishedAt"]);

  if (!title || !companyName || !sourceUrl || !description) return null;

  return {
    title,
    companyName,
    sourceName,
    sourceUrl,
    location,
    postedAt,
    description: truncate(stripHtml(description), 4000)
  };
}

/**
 * Converte uma lista de itens brutos para IngestJobPostingInput[],
 * descartando silenciosamente itens inválidos ou incompletos.
 */
export function parseJobItems(
  items: RawJobItem[],
  source: ScraperSourceConfig
): IngestJobPostingInput[] {
  const results: IngestJobPostingInput[] = [];

  for (const item of items) {
    let parsed: IngestJobPostingInput | null = null;

    if (source.format === "remotive-json") {
      parsed = parseRemotiveItem(item, source.name);
    } else if (source.format === "arbeitnow-json") {
      parsed = parseArbeitnowItem(item, source.name);
    } else if (source.format === "remoteok-json") {
      parsed = parseRemoteOkItem(item, source.name);
    } else if (source.format === "jobicy-json") {
      parsed = parseJobicyItem(item, source.name);
    } else if (source.format === "himalayas-json") {
      parsed = parseHimalayasItem(item, source.name);
    } else if (source.format === "cryptojobslist-json") {
      parsed = parseCryptoJobsListItem(item, source.name);
    }

    if (parsed) results.push(parsed);
  }

  return results;
}
