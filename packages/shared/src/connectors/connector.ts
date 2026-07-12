import type { AllowedActionCapability, ConditionalActionCapability, ForbiddenActionCapability } from "../case-flow/action-capabilities.js";
import type { ActionRisk } from "../case-flow/action-capabilities.js";
import type { ConnectorId, EvidenceFact, NormalizedEvidenceKey } from "../case-flow/evidence.js";
import type { ConnectorResult, ConnectorRunStatus } from "./execution.js";
import type { Intervention, PageSnapshot } from "./intervention.js";
import type { SanitizedConnectorFixture, SelectorPolicy } from "./selectors.js";

export type ConnectorExecutableCapability = AllowedActionCapability | ConditionalActionCapability;
export type ConnectorWave = 0 | 1 | 2 | 3;

export interface ProbeContext {
  installationId: string;
  browserProfileId: string;
  checkedAt: string;
}

export interface ProbeResult {
  available: boolean;
  authenticated: boolean;
  intervention?: Intervention;
  checkedAt: string;
}

export interface ConnectorContext {
  userId: string;
  caseId: string;
  runId: string;
  installationId: string;
  browserProfileId: string;
  facts: EvidenceFact[];
}

export type ApplicabilityResult =
  | { applicable: true; searchKeys: NormalizedEvidenceKey[] }
  | { applicable: false; reason: "NOT_APPLICABLE" }
  | { applicable: false; reason: "WAITING_DEPENDENCY"; missingKeys: NormalizedEvidenceKey[] };

export interface SearchStep {
  key: NormalizedEvidenceKey;
  valueReference: string;
  capability: ConnectorExecutableCapability;
}

export interface SearchPlan {
  connectorId: ConnectorId;
  runId: string;
  wave: ConnectorWave;
  steps: SearchStep[];
  timeoutMs: number;
}

export interface ConnectorRuntime {
  signal: AbortSignal;
  emitProgress(status: ConnectorRunStatus, message?: string): void;
}

export interface ConnectorHealth {
  connectorId: ConnectorId;
  state: "HEALTHY" | "DEGRADED" | "UNAVAILABLE" | "UNKNOWN";
  version: string;
  checkedAt: string;
  lastValidatedAt?: string;
  lastSelectorDriftAt?: string;
}

export interface ConsultativeConnector {
  id: ConnectorId;
  version: string;
  displayName: string;
  domains: string[];
  riskLevel: ActionRisk;
  capabilities: ConnectorExecutableCapability[];
  forbiddenCapabilities: ForbiddenActionCapability[];
  searchKeys: NormalizedEvidenceKey[];
  extractedFields: NormalizedEvidenceKey[];
  selectorPolicy: SelectorPolicy;
  fixtures: SanitizedConnectorFixture[];

  probe(ctx: ProbeContext): Promise<ProbeResult>;
  resolveApplicability(ctx: ConnectorContext): Promise<ApplicabilityResult>;
  buildSearchPlan(ctx: ConnectorContext): Promise<SearchPlan>;
  execute(plan: SearchPlan, runtime: ConnectorRuntime): Promise<ConnectorResult>;
  normalize(raw: unknown, ctx: ConnectorContext): Promise<EvidenceFact[]>;
  detectIntervention(page: PageSnapshot): Promise<Intervention | null>;
  healthCheck(): Promise<ConnectorHealth>;
}
