import type { ConnectorResult, EvidenceFact, NormalizedEvidenceKey } from "@alwaystrack/shared";
import { connectorId, correiosReverseResultToEvidenceFacts, parseCorreiosReverseResult } from "@alwaystrack/shared";

export interface CorreiosReverseReadOnlySource { readonly mode: "READ_ONLY"; read(search: { key: NormalizedEvidenceKey; value: unknown }): Promise<unknown> }
export interface CorreiosReverseRuntimeOptions { enabled?: boolean; source: CorreiosReverseReadOnlySource; ledger: { append(result: ConnectorResult): Promise<void> }; evidence: { append(facts: readonly EvidenceFact[]): Promise<void> }; now?: () => string }
export interface CorreiosReverseRuntimeRequest { caseId: string; runId: string; capability: string; evidence: readonly EvidenceFact[] }

export class CorreiosReverseReadOnlyRuntime {
  readonly #now: () => string;
  constructor(private readonly options: CorreiosReverseRuntimeOptions) { this.#now = options.now ?? (() => new Date().toISOString()); }
  async run(request: CorreiosReverseRuntimeRequest): Promise<ConnectorResult> {
    const startedAt = this.#now();
    const finish = async (status: ConnectorResult["status"], facts: EvidenceFact[] = [], warnings: ConnectorResult["warnings"] = []) => {
      const result: ConnectorResult = { connectorId: connectorId("correios-reversa"), runId: request.runId, status, startedAt, finishedAt: this.#now(), facts, warnings, diagnostics: { connectorVersion: "1.0.0", pageKind: "SANITIZED_FIXTURE" } };
      if (facts.length) await this.options.evidence.append(facts);
      await this.options.ledger.append(result); return result;
    };
    if (this.options.enabled !== true) return finish("NOT_APPLICABLE", [], [{ code: "RUNTIME_DISABLED", message: "Correios/Reversa runtime is default-off" }]);
    if (request.capability !== "READ") return finish("CANCELLED", [], [{ code: "CAPABILITY_DENIED", message: "Correios/Reversa denies every non-read capability, including CREATE_REVERSE" }]);
    const search = request.evidence.find((fact) => fact.key === "treatment.reverseCode") ?? request.evidence.find((fact) => fact.key === "logistics.trackingCode") ?? request.evidence.find((fact) => fact.key === "customer.name");
    if (!search) return finish("NOT_APPLICABLE", [], [{ code: "WAITING_DEPENDENCY", message: "No authorization, object or recipient evidence" }]);
    try {
      const parsed = parseCorreiosReverseResult(await this.options.source.read({ key: search.key, value: search.normalizedValue }));
      if (parsed.outcome !== "FOUND") {
        const status = parsed.outcome === "BLOCKED_LOGIN" ? "BLOCKED_AUTH" : parsed.outcome === "NOT_FOUND_IN_SOURCE" ? "NOT_FOUND" : parsed.outcome;
        return finish(status, [], [{ code: parsed.outcome, message: parsed.message ?? "Correios/Reversa read paused or returned no records" }]);
      }
      return finish("COMPLETE", correiosReverseResultToEvidenceFacts(parsed, { caseId: request.caseId, runId: request.runId, observedAt: this.#now() }));
    } catch (error) { return finish("FAILED_UNEXPECTED_PAGE", [], [{ code: "INVALID_SANITIZED_FIXTURE", message: error instanceof Error ? error.message : "Invalid fixture" }]); }
  }
}
