export interface DetectedFlow {
  id: string;
  label: string;
  confidence: number;
  role: "PRIMARY" | "SECONDARY";
  matchedRules: string[];
  supportingFacts: Array<{ id: string; label: string }>;
  risk: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
}

export interface FlowOverrideIntent {
  type: "CASE_FLOW_OVERRIDE_REQUESTED";
  payload: { flowId: string };
}

export function createFlowOverrideIntent(flowId: string): FlowOverrideIntent {
  return { type: "CASE_FLOW_OVERRIDE_REQUESTED", payload: { flowId } };
}

export function needsFlowTriage(flows: DetectedFlow[], threshold = 0.7): boolean {
  const primary = flows.find((flow) => flow.role === "PRIMARY");
  return !primary || primary.confidence < threshold;
}
