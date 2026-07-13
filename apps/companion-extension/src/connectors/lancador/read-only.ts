import type { ConnectorResult, EvidenceFact, NormalizedEvidenceKey } from "@alwaystrack/shared";
import { connectorId, lancadorQueryResultToEvidenceFacts, parseLancadorQueryResult } from "@alwaystrack/shared";

export interface LancadorReadOnlySource { readonly mode: "READ_ONLY"; read(search: { key: NormalizedEvidenceKey; value: unknown }): Promise<unknown> }
export interface LancadorRuntimeOptions { enabled?: boolean; source: LancadorReadOnlySource; ledger: { append(result: ConnectorResult): Promise<void> }; evidence: { append(facts: readonly EvidenceFact[]): Promise<void> }; now?: () => string }
export interface LancadorRuntimeRequest { caseId: string; runId: string; capability: string; evidence: readonly EvidenceFact[] }

export class LancadorReadOnlyRuntime {
  readonly #now: () => string;
  constructor(private readonly options: LancadorRuntimeOptions) { this.#now = options.now ?? (() => new Date().toISOString()); }
  async run(request: LancadorRuntimeRequest): Promise<ConnectorResult> {
    const startedAt = this.#now();
    const finish = async (status: ConnectorResult["status"], facts: EvidenceFact[] = [], warnings: ConnectorResult["warnings"] = []) => {
      const result: ConnectorResult = { connectorId: connectorId("lancador-pedidos"), runId: request.runId, status, startedAt, finishedAt: this.#now(), facts, warnings, diagnostics: { connectorVersion: "1.0.0", pageKind: "SANITIZED_FIXTURE" } };
      if (facts.length) await this.options.evidence.append(facts);
      await this.options.ledger.append(result); return result;
    };
    if (this.options.enabled !== true) return finish("NOT_APPLICABLE", [], [{ code: "RUNTIME_DISABLED", message: "Lancador runtime is default-off" }]);
    if (request.capability !== "READ") return finish("CANCELLED", [], [{ code: "CAPABILITY_DENIED", message: "Lancador consultation never fills or creates orders" }]);
    const priorities: NormalizedEvidenceKey[] = ["customer.cpf", "order.primaryId", "customer.email", "customer.phone", "order.manualId"];
    const search = priorities.map((key) => request.evidence.find((fact) => fact.key === key)).find(Boolean);
    if (!search) return finish("NOT_APPLICABLE", [], [{ code: "WAITING_DEPENDENCY", message: "No supported Lancador search evidence" }]);
    try {
      const parsed = parseLancadorQueryResult(await this.options.source.read({ key: search.key, value: search.normalizedValue }));
      if (parsed.outcome !== "FOUND") return finish(parsed.outcome === "NOT_FOUND_IN_SOURCE" ? "NOT_FOUND" : parsed.outcome === "BLOCKED_LOGIN" ? "BLOCKED_AUTH" : parsed.outcome, [], [{ code: parsed.outcome, message: parsed.message ?? "Lancador read returned no records" }]);
      return finish("COMPLETE", lancadorQueryResultToEvidenceFacts(parsed, { caseId: request.caseId, runId: request.runId, observedAt: this.#now() }));
    } catch (error) { return finish("FAILED_UNEXPECTED_PAGE", [], [{ code: "INVALID_SANITIZED_FIXTURE", message: error instanceof Error ? error.message : "Invalid fixture" }]); }
  }
}
