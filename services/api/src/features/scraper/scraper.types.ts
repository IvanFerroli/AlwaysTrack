/** Config de uma fonte de scraping */
export interface ScraperSourceConfig {
  /** Nome amigável da fonte, ex: "Remotive" */
  name: string;
  /** URL do feed JSON/HTML público */
  url: string;
  /** Tipo do payload retornado */
  format: "remotive-json" | "arbeitnow-json" | "remoteok-json" | "jobicy-json";
}

/** Item bruto retornado pela fonte antes do parse */
export type RawJobItem = Record<string, unknown>;

/** Resultado de uma fonte individual */
export interface SourceRunResult {
  name: string;
  fetched: number;
  ingested: number;
  deduplicated: number;
  errors: string[];
}

/** Resultado do runner de scraping (uma fonte ou todas) */
export interface ScraperRunResult {
  source: string;
  fetched: number;
  ingested: number;
  deduplicated: number;
  errors: string[];
  sources?: SourceRunResult[];
}
