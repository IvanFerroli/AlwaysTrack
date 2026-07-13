import type { ConnectorResult, EvidenceFact, NormalizedEvidenceKey, OmieContext } from "@alwaystrack/shared";
import { connectorId, customEvidenceKey, omieResultToEvidenceFacts, parseOmieResult } from "@alwaystrack/shared";

export interface OmieFixtureRead {
  payload: unknown;
  manualMutationDetected?: boolean;
}

export interface OmieFixtureSource {
  read(context: OmieContext, search: { key: NormalizedEvidenceKey; value: unknown }): Promise<OmieFixtureRead>;
}

export interface OmieLedgerPort { append(result: ConnectorResult): Promise<void> }
export interface OmieEvidencePort { append(facts: readonly EvidenceFact[]): Promise<void> }

export interface OmieRuntimeOptions {
  enabled?: boolean;
  context: OmieContext;
  source: OmieFixtureSource;
  ledger: OmieLedgerPort;
  evidence: OmieEvidencePort;
  now?: () => string;
}

export interface OmieRuntimeRequest { caseId: string; runId: string; capability: string; evidence: readonly EvidenceFact[] }

const omieDetailFacts = (records: ReturnType<typeof parseOmieResult> & { outcome: "FOUND" }, request: OmieRuntimeRequest, observedAt: string): EvidenceFact[] =>
  records.records.flatMap((record, index) => ([
    ["connector.omie.production", record.production],
    ["connector.omie.deadline", record.deadline],
    ["connector.omie.notes", record.notes]
  ] satisfies Array<[string, string | undefined]>).flatMap(([key, value]) => value === undefined ? [] : [{
    id: `${request.runId}:${index}:${key}`,
    caseId: request.caseId,
    key: customEvidenceKey(key),
    value,
    normalizedValue: value,
    sourceSystem: connectorId(record.context === "FILIAL" ? "omie-filial" : "omie-pharma"),
    sourceReference: record.id,
    observedAt,
    collectedAt: observedAt,
    confidence: 1,
    freshness: "FRESH" as const,
    sensitivity: "INTERNAL" as const,
    acquisition: "SCRAPED" as const,
    connectorRunId: request.runId
  }]));

export class OmieReadOnlyRuntime {
  readonly #now: () => string;
  constructor(private readonly options: OmieRuntimeOptions) { this.#now = options.now ?? (() => new Date().toISOString()); }

  async run(request: OmieRuntimeRequest): Promise<ConnectorResult> {
    const id = this.options.context === "FILIAL" ? "omie-filial" : "omie-pharma";
    const startedAt = this.#now();
    const finish = async (status: ConnectorResult["status"], facts: EvidenceFact[] = [], warnings: ConnectorResult["warnings"] = []) => {
      const result: ConnectorResult = { connectorId: connectorId(id), runId: request.runId, status, startedAt, finishedAt: this.#now(), facts, warnings, diagnostics: { connectorVersion: "1.0.0", pageKind: "SANITIZED_FIXTURE" } };
      if (facts.length) await this.options.evidence.append(facts);
      await this.options.ledger.append(result);
      return result;
    };

    if (this.options.enabled !== true) return finish("NOT_APPLICABLE", [], [{ code: "RUNTIME_DISABLED", message: `${id} runtime is default-off` }]);
    if (request.capability !== "READ") return finish("CANCELLED", [], [{ code: "CAPABILITY_DENIED", message: "OMIE runtimes deny every non-read capability" }]);
    const search = request.evidence.find((fact) => fact.key === "order.omieId") ?? request.evidence.find((fact) => fact.key === "order.primaryId");
    if (!search) return finish("NOT_APPLICABLE", [], [{ code: "WAITING_DEPENDENCY", message: "No supported OMIE order evidence" }]);

    try {
      const read = await this.options.source.read(this.options.context, { key: search.key, value: search.normalizedValue });
      const parsed = parseOmieResult(read.payload);
      if (parsed.outcome !== "FOUND") return finish(parsed.outcome === "BLOCKED_LOGIN" ? "BLOCKED_AUTH" : parsed.outcome === "NOT_FOUND_IN_SOURCE" ? "NOT_FOUND" : parsed.outcome, [], parsed.message ? [{ code: parsed.outcome, message: parsed.message }] : []);
      if (parsed.records.some((record) => record.context !== this.options.context)) return finish("FAILED_UNEXPECTED_PAGE", [], [{ code: "OMIE_CONTEXT_MISMATCH", message: "Fixture context does not match the isolated OMIE runtime" }]);
      const warnings = read.manualMutationDetected ? [{ code: "MANUAL_MUTATION_DETECTED", message: "Manual OMIE change detected; no automated action was performed" }] : [];
      const observedAt = this.#now();
      const facts = [
        ...omieResultToEvidenceFacts(parsed, { caseId: request.caseId, runId: request.runId, observedAt }),
        ...omieDetailFacts(parsed, request, observedAt)
      ];
      return finish("COMPLETE", facts, warnings);
    } catch (error) {
      return finish("FAILED_UNEXPECTED_PAGE", [], [{ code: "INVALID_SANITIZED_FIXTURE", message: error instanceof Error ? error.message : "Invalid fixture" }]);
    }
  }
}
