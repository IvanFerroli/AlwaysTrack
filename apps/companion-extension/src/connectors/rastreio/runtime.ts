import { parseRastreioSearchResult, rastreioResultToEvidenceFacts, type ParserFactContext, type RastreioSearchKey } from "@alwaystrack/shared";

export interface RastreioIdentifiers { cpf?: string; order?: string; email?: string; phone?: string }
export type RastreioRuntimeState =
  | { status: "COMPLETED" | "PARTIAL"; searchedBy: RastreioSearchKey; facts: ReturnType<typeof rastreioResultToEvidenceFacts> }
  | { status: "NOT_FOUND"; searchedBy: RastreioSearchKey }
  | { status: "AWAITING_IDENTIFIER" }
  | { status: "BLOCKED_LOGIN" }
  | { status: "FAILED_TIMEOUT" }
  | { status: "FAILED_SELECTOR_DRIFT"; field?: string };

export interface RastreioReadOnlySource {
  readonly mode: "READ_ONLY";
  search(key: RastreioSearchKey, value: string, signal: AbortSignal): Promise<unknown>;
}

export function bestRastreioIdentifier(ids: RastreioIdentifiers): { key: RastreioSearchKey; value: string } | undefined {
  for (const [key, value] of [["CPF", ids.cpf], ["ORDER", ids.order], ["EMAIL", ids.email], ["PHONE", ids.phone]] as const) {
    if (value?.trim()) return { key, value: value.trim() };
  }
  return undefined;
}

export async function runRastreio(source: RastreioReadOnlySource, ids: RastreioIdentifiers, context: ParserFactContext, signal: AbortSignal): Promise<RastreioRuntimeState> {
  const identifier = bestRastreioIdentifier(ids);
  if (!identifier) return { status: "AWAITING_IDENTIFIER" };
  const raw = await source.search(identifier.key, identifier.value, signal);
  const record = typeof raw === "object" && raw !== null ? raw as Record<string, unknown> : {};
  if (record.state === "login") return { status: "BLOCKED_LOGIN" };
  if (record.state === "timeout") return { status: "FAILED_TIMEOUT" };
  if (record.state === "drift") return { status: "FAILED_SELECTOR_DRIFT", field: typeof record.field === "string" ? record.field : undefined };
  try {
    const result = parseRastreioSearchResult(record.result ?? raw);
    if (result.outcome === "NOT_FOUND_IN_SOURCE") return { status: "NOT_FOUND", searchedBy: result.searchedBy };
    return { status: record.partial === true ? "PARTIAL" : "COMPLETED", searchedBy: result.searchedBy, facts: rastreioResultToEvidenceFacts(result, context) };
  } catch (error) {
    return { status: "FAILED_SELECTOR_DRIFT", field: error instanceof Error ? error.message : undefined };
  }
}
