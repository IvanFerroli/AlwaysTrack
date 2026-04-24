/** Config de uma fonte de scraping */
export interface ScraperSourceConfig {
  /** Nome amigável da fonte, ex: "Remotive" */
  name: string;
  /** URL do feed JSON/HTML público */
  url: string;
  /** Tipo do payload retornado */
  format: "remotive-json" | "arbeitnow-json";
}

/** Item bruto retornado pela fonte antes do parse */
export type RawJobItem = Record<string, unknown>;

/** Resultado do runner de scraping */
export interface ScraperRunResult {
  source: string;
  fetched: number;
  ingested: number;
  deduplicated: number;
  errors: string[];
}
