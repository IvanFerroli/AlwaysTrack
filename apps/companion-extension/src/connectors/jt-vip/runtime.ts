import type { ConnectorResult, EvidenceFact, NormalizedEvidenceKey } from "@alwaystrack/shared";
import { connectorId, jtVipResultToEvidenceFacts, parseJtVipResult } from "@alwaystrack/shared";

export interface JtVipReadOnlySource { readonly mode: "READ_ONLY"; read(search: { key: NormalizedEvidenceKey; value: unknown }): Promise<unknown> }
export interface JtVipRuntimeOptions { enabled?: boolean; source: JtVipReadOnlySource; ledger: { append(result: ConnectorResult): Promise<void> }; evidence: { append(facts: readonly EvidenceFact[]): Promise<void> }; now?: () => string }
export interface JtVipRuntimeRequest { caseId: string; runId: string; capability: string; evidence: readonly EvidenceFact[] }

export class JtVipReadOnlyRuntime {
  readonly #now: () => string;
  constructor(private readonly options: JtVipRuntimeOptions) { this.#now = options.now ?? (() => new Date().toISOString()); }
  async run(request: JtVipRuntimeRequest): Promise<ConnectorResult> {
    const startedAt = this.#now();
    const finish = async (status: ConnectorResult["status"], facts: EvidenceFact[] = [], warnings: ConnectorResult["warnings"] = []) => {
      const result: ConnectorResult = { connectorId: connectorId("jt-vip"), runId: request.runId, status, startedAt, finishedAt: this.#now(), facts, warnings, diagnostics: { connectorVersion: "1.0.0", pageKind: "SANITIZED_FIXTURE" } };
      if (facts.length) await this.options.evidence.append(facts);
      await this.options.ledger.append(result); return result;
    };
    if (this.options.enabled !== true) return finish("NOT_APPLICABLE", [], [{ code: "RUNTIME_DISABLED", message: "J&T VIP runtime is default-off" }]);
    if (request.capability !== "READ") return finish("CANCELLED", [], [{ code: "CAPABILITY_DENIED", message: "J&T VIP denies every non-read capability" }]);
    const search = request.evidence.find((fact) => fact.key === "logistics.trackingCode") ?? request.evidence.find((fact) => fact.key === "treatment.workOrders") ?? request.evidence.find((fact) => fact.key === "treatment.openTickets");
    if (!search) return finish("NOT_APPLICABLE", [], [{ code: "WAITING_DEPENDENCY", message: "No tracking, work order or ticket evidence" }]);
    try {
      const parsed = parseJtVipResult(await this.options.source.read({ key: search.key, value: search.normalizedValue }));
      if (parsed.outcome !== "FOUND") {
        const status = parsed.outcome === "BLOCKED_LOGIN" ? "BLOCKED_AUTH" : parsed.outcome === "NOT_FOUND_IN_SOURCE" ? "NOT_FOUND" : parsed.outcome;
        return finish(status, [], [{ code: parsed.outcome, message: parsed.message ?? "J&T VIP read paused or returned no records" }]);
      }
      return finish("COMPLETE", jtVipResultToEvidenceFacts(parsed, { caseId: request.caseId, runId: request.runId, observedAt: this.#now() }));
    } catch (error) { return finish("FAILED_UNEXPECTED_PAGE", [], [{ code: "INVALID_SANITIZED_FIXTURE", message: error instanceof Error ? error.message : "Invalid fixture" }]); }
  }
}
