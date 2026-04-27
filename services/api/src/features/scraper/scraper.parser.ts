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

function decodeHtml(raw: string): string {
  return raw
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&nbsp;/gi, " ")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&#x2F;/gi, "/")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function extractHtmlBlock(html: string, className: string): string {
  const escaped = className.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = html.match(new RegExp(`<[^>]+class=["'][^"']*${escaped}[^"']*["'][^>]*>([\\s\\S]*?)<\\/[^>]+>`, "i"));
  return match?.[1] ? stripHtml(decodeHtml(match[1])) : "";
}

function extractHref(html: string): string {
  const match = html.match(/<a[^>]+class=["'][^"']*base-card__full-link[^"']*["'][^>]+href=["']([^"']+)["']/i);
  return match?.[1] ? decodeHtml(match[1]) : "";
}

function canonicalizeSourceUrl(rawUrl: string): string {
  try {
    const url = new URL(rawUrl);
    url.search = "";
    url.hash = "";
    return url.toString();
  } catch {
    return rawUrl;
  }
}

function inferCompanyFromTitle(title: string): string | undefined {
  const atMatch = title.match(/^(.*?)\s+at\s+(.+)$/i);
  if (atMatch?.[2]) {
    return atMatch[2].trim();
  }
  const dashMatch = title.match(/^(.*?)\s+-\s+(.+)$/);
  if (dashMatch?.[2]) {
    return dashMatch[2].trim();
  }
  return undefined;
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
function parseCryptoJobsListRssItem(item: RawJobItem, sourceName: string): IngestJobPostingInput | null {
  const title = safeStr(item["title"]);
  const companyHint = safeStr(item["companyName"], safeStr(item["creator"]));
  const companyName = companyHint || inferCompanyFromTitle(title) || "CryptoJobsList";
  const sourceUrl = canonicalizeSourceUrl(safeStr(item["link"], safeStr(item["sourceUrl"])));
  const description = safeStr(item["description"], title);
  const location = safeStr(item["location"], "Remote");
  const postedAt = safeDateStr(item["pubDate"]);

  if (!title || !sourceUrl || !description) return null;

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

function parseGenericRssItem(item: RawJobItem, sourceName: string): IngestJobPostingInput | null {
  const title = safeStr(item["title"]);
  const sourceUrl = canonicalizeSourceUrl(safeStr(item["link"], safeStr(item["sourceUrl"])));
  const description = safeStr(item["description"], title);
  const companyName =
    safeStr(item["companyName"], safeStr(item["creator"])) ||
    inferCompanyFromTitle(title) ||
    sourceName;
  const location = safeStr(item["location"], "Remote/unspecified");
  const postedAt = safeDateStr(item["pubDate"]);

  if (!title || !sourceUrl || !description) return null;

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

function parseLinkedInGuestItem(item: RawJobItem, sourceName: string): IngestJobPostingInput | null {
  const html = safeStr(item["html"]);
  if (!html) return null;

  const title = extractHtmlBlock(html, "base-search-card__title");
  const companyName = extractHtmlBlock(html, "base-search-card__subtitle");
  const location = extractHtmlBlock(html, "job-search-card__location") || "Remote/unspecified";
  const sourceUrl = canonicalizeSourceUrl(extractHref(html));
  const postedAt = html.match(/datetime=["']([^"']+)["']/i)?.[1];

  if (!title || !companyName || !sourceUrl) return null;

  return {
    title,
    companyName,
    sourceName,
    sourceUrl,
    location,
    postedAt: safeDateStr(postedAt),
    description: truncate(
      `LinkedIn public search result for ${title} at ${companyName}. Location: ${location}. Open the source URL for the complete job description.`,
      4000
    )
  };
}

function parseGupyPublicItem(item: RawJobItem, sourceName: string): IngestJobPostingInput | null {
  const title = safeStr(item["name"]);
  const companyName = safeStr(item["careerPageName"], safeStr(item["companyName"], "Gupy company"));
  const sourceUrl = safeStr(item["jobUrl"], safeStr(item["careerPageUrl"]));
  const description = safeStr(item["description"]);
  const city = safeStr(item["city"]);
  const state = safeStr(item["state"]);
  const country = safeStr(item["country"]);
  const workplaceType = safeStr(item["workplaceType"]);
  const isRemoteWork = item["isRemoteWork"] === true;
  const location = isRemoteWork
    ? "Remote"
    : [city, state, country].filter(Boolean).join(", ") || workplaceType || "Remote/unspecified";
  const postedAt = safeDateStr(item["publishedDate"]);

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

function parseGreenhouseItem(item: RawJobItem, sourceName: string): IngestJobPostingInput | null {
  const title = safeStr(item["title"]);
  const sourceUrl = canonicalizeSourceUrl(safeStr(item["absolute_url"], safeStr(item["url"])));
  const description = safeStr(item["content"], safeStr(item["description"], title));
  const companyName = safeStr(item["companyName"], sourceName);
  const locationField = item["location"];
  const location = (() => {
    if (locationField && typeof locationField === "object" && !Array.isArray(locationField)) {
      const name = safeStr((locationField as Record<string, unknown>)["name"]);
      if (name) return name;
    }
    return safeStr(item["locationName"], "Remote/unspecified");
  })();
  const postedAt = safeDateStr(item["updated_at"]) ?? safeDateStr(item["created_at"]);

  if (!title || !sourceUrl || !description) return null;

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
    } else if (source.format === "cryptojobslist-rss") {
      parsed = parseCryptoJobsListRssItem(item, source.name);
    } else if (source.format === "generic-rss") {
      parsed = parseGenericRssItem(item, source.name);
    } else if (source.format === "linkedin-guest-html") {
      parsed = parseLinkedInGuestItem(item, source.name);
    } else if (source.format === "gupy-public-json") {
      parsed = parseGupyPublicItem(item, source.name);
    } else if (source.format === "greenhouse-json") {
      parsed = parseGreenhouseItem(item, source.name);
    }

    if (parsed) results.push(parsed);
  }

  return results;
}
