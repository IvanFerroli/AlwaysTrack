import type { ConnectorResult, EvidenceFact, NormalizedEvidenceKey } from "@alwaystrack/shared";
import { connectorId, parseYampiResult, yampiResultToEvidenceFacts } from "@alwaystrack/shared";

export interface YampiFixtureSource {
  read(search: { key: NormalizedEvidenceKey; value: unknown }): Promise<unknown>;
}

export interface ConnectorLedgerPort {
  append(result: ConnectorResult): Promise<void>;
}

export interface EvidencePort {
  append(facts: readonly EvidenceFact[]): Promise<void>;
}

export interface YampiRuntimeRequest {
  caseId: string;
  runId: string;
  capability: string;
  evidence: readonly EvidenceFact[];
}

export interface YampiRuntimeOptions {
  enabled?: boolean;
  source: YampiFixtureSource;
  ledger: ConnectorLedgerPort;
  evidence: EvidencePort;
  now?: () => string;
}

const searchPriority = ["customer.name", "customer.cpf", "customer.email", "order.yampiId"] as const;

export class YampiReadOnlyRuntime {
  readonly #now: () => string;

  constructor(private readonly options: YampiRuntimeOptions) {
    this.#now = options.now ?? (() => new Date().toISOString());
  }

  async run(request: YampiRuntimeRequest): Promise<ConnectorResult> {
    const startedAt = this.#now();
    const finish = async (status: ConnectorResult["status"], facts: EvidenceFact[] = [], warnings: ConnectorResult["warnings"] = []) => {
      const result: ConnectorResult = { connectorId: connectorId("yampi"), runId: request.runId, status, startedAt, finishedAt: this.#now(), facts, warnings, diagnostics: { connectorVersion: "1.0.0", pageKind: "SANITIZED_FIXTURE" } };
      if (facts.length) await this.options.evidence.append(facts);
      await this.options.ledger.append(result);
      return result;
    };

    if (this.options.enabled !== true) return finish("NOT_APPLICABLE", [], [{ code: "RUNTIME_DISABLED", message: "Yampi runtime is default-off" }]);
    if (request.capability !== "READ") return finish("CANCELLED", [], [{ code: "CAPABILITY_DENIED", message: "Unknown or non-read capability denied" }]);

    const search = searchPriority.map((key) => request.evidence.find((fact) => fact.key === key)).find(Boolean);
    if (!search) return finish("NOT_APPLICABLE", [], [{ code: "WAITING_DEPENDENCY", message: "No supported Yampi search evidence" }]);

    try {
      const parsed = parseYampiResult(await this.options.source.read({ key: search.key, value: search.normalizedValue }));
      if (parsed.outcome === "NOT_FOUND_IN_SOURCE") return finish("NOT_FOUND", [], [{ code: "NOT_FOUND_IN_SOURCE", message: "Source absence does not end the investigation" }]);
      if (parsed.outcome !== "FOUND") return finish(parsed.outcome === "BLOCKED_LOGIN" ? "BLOCKED_AUTH" : parsed.outcome, [], parsed.message ? [{ code: parsed.outcome, message: parsed.message }] : []);
      const facts = yampiResultToEvidenceFacts(parsed, { caseId: request.caseId, runId: request.runId, observedAt: this.#now() });
      return finish("COMPLETE", facts);
    } catch (error) {
      return finish("FAILED_UNEXPECTED_PAGE", [], [{ code: "INVALID_SANITIZED_FIXTURE", message: error instanceof Error ? error.message : "Invalid fixture" }]);
    }
  }
}
