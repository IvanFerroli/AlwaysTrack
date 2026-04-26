import type {
  ApiResult,
  IngestJobPostingInput,
  JobAcquisitionEvidence,
  JobAcquisitionInput,
  JobAcquisitionMethod,
  JobAcquisitionResult
} from "@olympus/shared-types";
import { IngestionService } from "../ingestion/ingestion.service.js";
import {
  extractGupyJob,
  extractSolidesJob,
  extractLinkedInJob,
  extractIndeedJob,
  extractGlassdoorJob,
  extractInfojobsJob,
  extractCathoJob,
  extractTrabalhaBrasilJob
} from "./ats-adapters.js";

function tryAtsAdapters(html: string, url: URL, method: JobAcquisitionMethod) {
  return extractGupyJob(html, url, method) ||
         extractSolidesJob(html, url, method) ||
         extractLinkedInJob(html, url, method) ||
         extractIndeedJob(html, url, method) ||
         extractGlassdoorJob(html, url, method) ||
         extractInfojobsJob(html, url, method) ||
         extractCathoJob(html, url, method) ||
         extractTrabalhaBrasilJob(html, url, method);
}

const MAX_TEXT_LENGTH = 80_000;
const MAX_HTML_LENGTH = 120_000;
const MAX_PROVIDER_JSON_LENGTH = 80_000;
const MAX_REDIRECTS = 3;
const BLOCKED_HOSTS = new Set(["localhost", "127.0.0.1", "0.0.0.0", "::1"]);

function ok<T>(data: T): ApiResult<T> {
  return { ok: true, data };
}

function fail(code: string, message: string): ApiResult<never> {
  return { ok: false, error: { code, message } };
}

function trimText(value: unknown, maxLength: number): string {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function normalizeSpaces(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function stripHtml(value: string): string {
  return value
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function hostLooksPrivate(hostname: string): boolean {
  const lower = hostname.toLowerCase().replace(/^\[/, "").replace(/\]$/, "");
  if (BLOCKED_HOSTS.has(lower) || lower.endsWith(".local")) return true;
  if (/^10\./.test(lower) || /^192\.168\./.test(lower)) return true;
  if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(lower)) return true;
  if (/^169\.254\./.test(lower)) return true;
  if (lower === "0:0:0:0:0:0:0:1" || lower.startsWith("fc") || lower.startsWith("fd") || lower.startsWith("fe80:")) return true;
  if (lower.startsWith("::ffff:127.") || lower.startsWith("::ffff:10.") || lower.startsWith("::ffff:192.168.")) return true;
  return false;
}

function hostMatches(hostname: string, domain: string): boolean {
  const host = hostname.toLowerCase().replace(/^www\./, "");
  return host === domain || host.endsWith(`.${domain}`);
}

export function parseSafePublicUrl(value: unknown): URL | undefined {
  if (typeof value !== "string" || value.trim().length === 0 || value.length > 2048) {
    return undefined;
  }

  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") return undefined;
    if (hostLooksPrivate(url.hostname)) return undefined;
    return url;
  } catch {
    return undefined;
  }
}

function firstNonEmpty(...values: Array<string | undefined>): string {
  return values.find((item) => item && item.trim().length > 0)?.trim() ?? "";
}

function findLabeledValue(text: string, labels: string[]): string {
  for (const label of labels) {
    const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const match = text.match(new RegExp(`(?:^|\\n)\\s*${escaped}\\s*[:\\-]\\s*(.+)`, "i"));
    if (match?.[1]) return match[1].trim();
  }
  return "";
}

function inferCompanyFromUrl(url?: URL): string {
  if (!url) return "";
  const host = url.hostname.replace(/^www\./, "");
  const parts = host.split(".");
  return parts[0] ? parts[0].replace(/[-_]/g, " ") : "";
}

function inferSourceName(method: JobAcquisitionMethod, url?: URL, explicit?: string): string {
  if (explicit?.trim()) return explicit.trim().slice(0, 80);
  if (!url) return method;
  if (hostMatches(url.hostname, "gupy.io")) return "Gupy";
  if (hostMatches(url.hostname, "solides.jobs") || hostMatches(url.hostname, "solides.com")) return "Solides";
  if (hostMatches(url.hostname, "linkedin.com")) return "LinkedIn assisted capture";
  if (hostMatches(url.hostname, "indeed.com")) return "Indeed assisted capture";
  if (hostMatches(url.hostname, "glassdoor.com")) return "Glassdoor assisted capture";
  return url.hostname.replace(/^www\./, "").slice(0, 80);
}

function extractJsonLd(html: string): Record<string, unknown> | undefined {
  const scripts = html.match(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi) ?? [];
  for (const script of scripts) {
    const body = script.replace(/^<script[^>]*>/i, "").replace(/<\/script>$/i, "").trim();
    try {
      const parsed = JSON.parse(body) as unknown;
      const candidates = Array.isArray(parsed) ? parsed : [parsed];
      for (const candidate of candidates) {
        if (candidate && typeof candidate === "object") {
          const record = candidate as Record<string, unknown>;
          const type = record["@type"];
          if (type === "JobPosting" || (Array.isArray(type) && type.includes("JobPosting"))) {
            return record;
          }
        }
      }
    } catch {
      // Keep scanning: many pages contain invalid or unrelated JSON-LD blocks.
    }
  }
  return undefined;
}

function readJsonString(record: Record<string, unknown>, key: string): string {
  const value = record[key];
  return typeof value === "string" ? stripHtml(value) : "";
}

function readJsonNestedString(record: Record<string, unknown>, key: string, nestedKey: string): string {
  const value = record[key];
  if (!value || typeof value !== "object") return "";
  const nested = (value as Record<string, unknown>)[nestedKey];
  return typeof nested === "string" ? stripHtml(nested) : "";
}

function fromStructuredJson(
  payload: Record<string, unknown>,
  method: JobAcquisitionMethod,
  url?: URL,
  sourceName?: string
): { input: IngestJobPostingInput; evidence: JobAcquisitionEvidence } | undefined {
  const title = firstNonEmpty(
    readJsonString(payload, "title"),
    readJsonString(payload, "jobTitle"),
    readJsonString(payload, "name"),
    readJsonString(payload, "position")
  );
  const companyName = firstNonEmpty(
    readJsonNestedString(payload, "hiringOrganization", "name"),
    readJsonString(payload, "companyName"),
    readJsonString(payload, "company"),
    inferCompanyFromUrl(url)
  );
  const description = firstNonEmpty(
    readJsonString(payload, "description"),
    readJsonString(payload, "jobDescription"),
    readJsonString(payload, "summary")
  );
  const sourceUrl = firstNonEmpty(
    readJsonString(payload, "url"),
    readJsonString(payload, "applicationLink"),
    readJsonString(payload, "applyUrl"),
    url?.toString()
  );
  const location = firstNonEmpty(
    readJsonNestedString(payload, "jobLocation", "addressLocality"),
    readJsonString(payload, "location"),
    readJsonString(payload, "workplace")
  );
  const postedAt = firstNonEmpty(readJsonString(payload, "datePosted"), readJsonString(payload, "publishedAt"));

  const parsedUrl = parseSafePublicUrl(sourceUrl);
  if (!title || !companyName || !description || !parsedUrl) return undefined;

  return {
    input: {
      title: title.slice(0, 240),
      companyName: companyName.slice(0, 200),
      sourceName: inferSourceName(method, parsedUrl, sourceName),
      sourceUrl: parsedUrl.toString(),
      location: location ? location.slice(0, 200) : "Remote/unspecified",
      description: description.slice(0, 10_000),
      postedAt: postedAt || undefined
    },
    evidence: {
      method,
      sourceName: inferSourceName(method, parsedUrl, sourceName),
      sourceUrl: parsedUrl.toString(),
      parser: "structured-json",
      confidence: "high",
      notes: ["Parsed structured JobPosting/provider payload"]
    }
  };
}

function parseTextLikeJob(
  text: string,
  method: JobAcquisitionMethod,
  url?: URL,
  sourceName?: string
): { input: IngestJobPostingInput; evidence: JobAcquisitionEvidence } | undefined {
  const clean = normalizeSpaces(text).slice(0, MAX_TEXT_LENGTH);
  if (clean.length < 40) return undefined;

  const multiline = text.replace(/\r/g, "\n");
  const lines = multiline
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const title = firstNonEmpty(
    findLabeledValue(multiline, ["Title", "Cargo", "Vaga", "Position", "Job title"]),
    lines.find((line) => line.length >= 4 && line.length <= 120),
    "Imported job"
  );
  const companyName = firstNonEmpty(
    findLabeledValue(multiline, ["Company", "Empresa", "Organizacao", "Organization"]),
    inferCompanyFromUrl(url),
    "Unknown company"
  );
  const location = firstNonEmpty(findLabeledValue(multiline, ["Location", "Local", "Localizacao"]), "Remote/unspecified");
  const sourceUrl = firstNonEmpty(
    findLabeledValue(multiline, ["URL", "Link", "Source URL"]),
    multiline.match(/https?:\/\/\S+/)?.[0],
    url?.toString()
  );
  const parsedUrl = parseSafePublicUrl(sourceUrl);
  if (!parsedUrl) return undefined;

  return {
    input: {
      title: title.slice(0, 240),
      companyName: companyName.slice(0, 200),
      sourceName: inferSourceName(method, parsedUrl, sourceName),
      sourceUrl: parsedUrl.toString(),
      location: location.slice(0, 200),
      description: clean.slice(0, 10_000)
    },
    evidence: {
      method,
      sourceName: inferSourceName(method, parsedUrl, sourceName),
      sourceUrl: parsedUrl.toString(),
      parser: "text-heuristic",
      confidence: title && companyName !== "Unknown company" ? "medium" : "low",
      notes: ["Parsed from pasted/browser/email text using conservative heuristics"]
    }
  };
}

async function readResponseTextLimited(response: Response, maxBytes: number): Promise<string> {
  if (!response.body) {
    return "";
  }

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  let reading = true;
  while (reading) {
    const { done, value } = await reader.read();
    if (done) {
      reading = false;
      continue;
    }
    if (!value) continue;

    totalBytes += value.byteLength;
    if (totalBytes > maxBytes) {
      await reader.cancel();
      throw new Error("RESPONSE_TOO_LARGE");
    }
    chunks.push(value);
  }

  return new TextDecoder().decode(Buffer.concat(chunks));
}

async function fetchPublicPage(url: URL, redirectCount = 0): Promise<string> {
  const response = await fetch(url, {
    headers: {
      "accept": "text/html,application/xhtml+xml,application/json;q=0.8,text/plain;q=0.7",
      "user-agent": "olympus-climb-acquisition/1.0 (user-initiated import; local job matching tool)"
    },
    redirect: "manual",
    signal: AbortSignal.timeout(12_000)
  });

  if (response.status >= 300 && response.status < 400) {
    if (redirectCount >= MAX_REDIRECTS) {
      throw new Error("TOO_MANY_REDIRECTS");
    }

    const location = response.headers.get("location");
    if (!location) {
      throw new Error("INVALID_REDIRECT");
    }

    const redirectedUrl = parseSafePublicUrl(new URL(location, url).toString());
    if (!redirectedUrl) {
      throw new Error("UNSAFE_REDIRECT_URL");
    }

    return fetchPublicPage(redirectedUrl, redirectCount + 1);
  }

  if (!response.ok) {
    throw new Error(`FETCH_FAILED_${response.status}`);
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("text/html") && !contentType.includes("application/json") && !contentType.includes("text/plain")) {
    throw new Error("UNSUPPORTED_CONTENT_TYPE");
  }

  return readResponseTextLimited(response, MAX_HTML_LENGTH);
}

export class JobAcquisitionService {
  constructor(private readonly ingestionService: IngestionService) {}

  async acquire(payload: JobAcquisitionInput): Promise<ApiResult<JobAcquisitionResult>> {
    const sourceUrl = parseSafePublicUrl(payload.sourceUrl);
    const sourceName = trimText(payload.sourceName, 80);

    try {
      const parsed = await this.toIngestInput(payload, sourceUrl, sourceName);
      if (!parsed) {
        return fail("ACQUISITION_PARSE_FAILED", "Could not extract a complete job posting from this source");
      }

      const ingestion = await this.ingestionService.ingest(parsed.input);
      if (!ingestion.ok) {
        return ingestion;
      }

      return ok({ input: parsed.input, ingestion: ingestion.data, evidence: parsed.evidence });
    } catch (error) {
      return fail("ACQUISITION_ERROR", error instanceof Error ? error.message : "Unknown acquisition error");
    }
  }

  private async toIngestInput(
    payload: JobAcquisitionInput,
    sourceUrl?: URL,
    sourceName?: string
  ): Promise<{ input: IngestJobPostingInput; evidence: JobAcquisitionEvidence } | undefined> {
    if (payload.method === "provider-json") {
      const jsonText = JSON.stringify(payload.providerPayload ?? {});
      if (jsonText.length > MAX_PROVIDER_JSON_LENGTH) {
        return undefined;
      }
      const record = payload.providerPayload as unknown;
      if (record && typeof record === "object") {
        return fromStructuredJson(record as Record<string, unknown>, payload.method, sourceUrl, sourceName);
      }
      return undefined;
    }

    if (payload.method === "url-import" || payload.method === "ats-adapter") {
      if (!sourceUrl) return undefined;
      const fetched = await fetchPublicPage(sourceUrl);

      // 1. Tentar os ATS adapters específicos primeiro
      const atsMatch = tryAtsAdapters(fetched, sourceUrl, payload.method);
      if (atsMatch) return atsMatch;

      // 2. Se falhar, tentar Structured JSON-LD
      const jsonLd = extractJsonLd(fetched);
      if (jsonLd) return fromStructuredJson(jsonLd, payload.method, sourceUrl, sourceName);
      
      // 3. Fallback final: Text heuristic
      return parseTextLikeJob(stripHtml(fetched), payload.method, sourceUrl, sourceName);
    }

    if (payload.method === "browser-capture") {
      const html = trimText(payload.html, MAX_HTML_LENGTH);
      const text = trimText(payload.rawText, MAX_TEXT_LENGTH);
      
      if (html && sourceUrl) {
        const atsMatch = tryAtsAdapters(html, sourceUrl, payload.method);
        if (atsMatch) return atsMatch;
      }

      const jsonLd = html ? extractJsonLd(html) : undefined;
      if (jsonLd) return fromStructuredJson(jsonLd, payload.method, sourceUrl, sourceName);
      return parseTextLikeJob(text || stripHtml(html), payload.method, sourceUrl, sourceName);
    }

    if (payload.method === "email-alert" || payload.method === "smart-paste") {
      return parseTextLikeJob(trimText(payload.rawText, MAX_TEXT_LENGTH), payload.method, sourceUrl, sourceName);
    }

    return undefined;
  }
}
