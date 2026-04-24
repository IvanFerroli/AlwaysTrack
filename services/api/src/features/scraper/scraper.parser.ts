import type { IngestJobPostingInput } from "@olympus/shared-types";
import type { RawJobItem, ScraperSourceConfig } from "./scraper.types.js";

function safeStr(value: unknown, fallback = ""): string {
  if (typeof value === "string" && value.trim().length > 0) return value.trim();
  return fallback;
}

function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "…";
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

  if (!title || !companyName || !sourceUrl || !description) return null;

  return {
    title,
    companyName,
    sourceName,
    sourceUrl,
    location,
    description: truncate(description, 4000)
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

  if (!title || !companyName || !sourceUrl || !description) return null;

  return {
    title,
    companyName,
    sourceName,
    sourceUrl,
    location,
    description: truncate(description, 4000)
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
    }

    if (parsed) results.push(parsed);
  }

  return results;
}
