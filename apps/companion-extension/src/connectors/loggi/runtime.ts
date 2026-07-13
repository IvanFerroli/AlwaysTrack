import type { ConnectorResult, EvidenceFact, NormalizedEvidenceKey } from "@alwaystrack/shared";
import { connectorId, loggiResultToEvidenceFacts, parseLoggiResult } from "@alwaystrack/shared";

export interface LoggiReadOnlySource { readonly mode: "READ_ONLY"; read(search: { key: NormalizedEvidenceKey; value: unknown }): Promise<unknown> }
export interface LoggiRuntimeOptions { enabled?: boolean; source: LoggiReadOnlySource; ledger: { append(result: ConnectorResult): Promise<void> }; evidence: { append(facts: readonly EvidenceFact[]): Promise<void> }; now?: () => string }
export interface LoggiRuntimeRequest { caseId: string; runId: string; capability: string; evidence: readonly EvidenceFact[] }

export class LoggiReadOnlyRuntime {
  readonly #now: () => string;
  constructor(private readonly options: LoggiRuntimeOptions) { this.#now = options.now ?? (() => new Date().toISOString()); }
  async run(request: LoggiRuntimeRequest): Promise<ConnectorResult> {
    const startedAt = this.#now();
    const finish = async (status: ConnectorResult["status"], facts: EvidenceFact[] = [], warnings: ConnectorResult["warnings"] = []) => {
      const result: ConnectorResult = { connectorId: connectorId("loggi"), runId: request.runId, status, startedAt, finishedAt: this.#now(), facts, warnings, diagnostics: { connectorVersion: "1.0.0", pageKind: "SANITIZED_FIXTURE" } };
      if (facts.length) await this.options.evidence.append(facts);
      await this.options.ledger.append(result);
      return result;
    };
    if (this.options.enabled !== true) return finish("NOT_APPLICABLE", [], [{ code: "RUNTIME_DISABLED", message: "Loggi runtime is default-off" }]);
    if (request.capability !== "READ") return finish("CANCELLED", [], [{ code: "CAPABILITY_DENIED", message: "Loggi denies every non-read capability" }]);
    const search = request.evidence.find((fact) => fact.key === "customer.cpf") ?? request.evidence.find((fact) => fact.key === "logistics.trackingCode") ?? request.evidence.find((fact) => fact.key === "order.primaryId");
    if (!search) return finish("NOT_APPLICABLE", [], [{ code: "WAITING_DEPENDENCY", message: "No CPF, tracking or order evidence" }]);
    try {
      const parsed = parseLoggiResult(await this.options.source.read({ key: search.key, value: search.normalizedValue }));
      if (parsed.outcome !== "FOUND") {
        const status = parsed.outcome === "BLOCKED_LOGIN" ? "BLOCKED_AUTH" : parsed.outcome === "NOT_FOUND_IN_SOURCE" ? "NOT_FOUND" : parsed.outcome;
        return finish(status, [], [{ code: parsed.outcome, message: parsed.message ?? "Loggi read did not return records" }]);
      }
      return finish("COMPLETE", loggiResultToEvidenceFacts(parsed, { caseId: request.caseId, runId: request.runId, observedAt: this.#now() }));
    } catch (error) { return finish("FAILED_UNEXPECTED_PAGE", [], [{ code: "INVALID_SANITIZED_FIXTURE", message: error instanceof Error ? error.message : "Invalid fixture" }]); }
  }
}
