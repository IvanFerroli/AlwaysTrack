/** Config de uma fonte de scraping */
export type ScraperSourceFormat =
  | "remotive-json"
  | "arbeitnow-json"
  | "remoteok-json"
  | "jobicy-json"
  | "himalayas-json"
  | "cryptojobslist-json"
  | "linkedin-guest-html"
  | "gupy-public-json"
  | "unavailable-platform";

export interface ScraperSourceConfig {
  /** Nome amigável da fonte, ex: "Remotive" */
  name: string;
  /** URL do feed JSON/HTML público */
  url: string;
  /** Tipo do payload retornado */
  format: ScraperSourceFormat;
  /** Modo operacional da fonte no runtime atual. */
  mode?: SourceMode;
  /** Método de fallback recomendado quando `mode=fallback`. */
  fallbackMethod?: "url-import" | "browser-capture";
  /** Quando false, fica fora do `source=all` sem remover o naming da fonte. */
  enabledByDefault?: boolean;
  /** Motivo operacional para fonte mantida, mas indisponivel. */
  unavailableReason?: string;
}

/** Item bruto retornado pela fonte antes do parse */
export type RawJobItem = Record<string, unknown>;

export type SourceFailureType = "timeout" | "http" | "parse" | "security-check" | "unknown";
export type SourceMode = "auto" | "fallback" | "blocked";

/** Resultado de uma fonte individual */
export interface SourceRunResult {
  name: string;
  mode: SourceMode;
  latencyMs: number;
  fetched: number;
  parsed: number;
  ingested: number;
  deduplicated: number;
  discarded: number;
  fallbackMethod?: "url-import" | "browser-capture";
  note?: string;
  failureType?: SourceFailureType;
  keywordEffective?: string;
  errors: string[];
}

/** Resultado do runner de scraping (uma fonte ou todas) */
export interface ScraperRunResult {
  source: string;
  fetched: number;
  parsed: number;
  ingested: number;
  deduplicated: number;
  autoDiscarded: number;
  keywordRequested?: string;
  keywordEffective?: string;
  errors: string[];
  sourceReports?: SourceRunResult[];
  /** Compat legado: manter até consumidores migrarem para `sourceReports`. */
  sources?: SourceRunResult[];
}
