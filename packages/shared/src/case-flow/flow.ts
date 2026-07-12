import type { ActionCapability, ActionRisk } from "./action-capabilities.js";

export const flowNodeTypes = [
  "START", "CONTEXT", "CONSULT", "CHECK", "DECISION", "MANUAL_INPUT", "MESSAGE",
  "DRAFT_ACTION", "RISK_GATE", "HUMAN_CONFIRM", "WAIT_EXTERNAL", "END"
] as const;
export type FlowNodeType = (typeof flowNodeTypes)[number];
export type RiskLevel = ActionRisk;

export type RuleExpression =
  | { operator: "ALWAYS" }
  | { operator: "FACT_EXISTS"; factKey: string }
  | { operator: "FACT_EQUALS"; factKey: string; value: string | number | boolean };

export interface ScriptBinding {
  scriptId: string;
  revisionId?: string;
  label?: string;
}

export interface FlowNodeDefinition {
  key: string;
  type: FlowNodeType;
  title: string;
  operatorInstruction?: string;
  requiredFacts: string[];
  optionalFacts: string[];
  scripts: ScriptBinding[];
  allowedCapabilities: ActionCapability[];
  forbiddenCapabilities: ActionCapability[];
  autoAdvance: boolean;
  riskLevel: RiskLevel;
  terminal: boolean;
  message?: string;
  dependencies?: string[];
}

export interface FlowTransitionDefinition {
  fromNodeKey: string;
  toNodeKey: string;
  label: string;
  order: number;
  condition?: RuleExpression;
  requiresUserChoice: boolean;
  allowLoop?: boolean;
}

export interface ServiceFlowVersionDefinition {
  flowId: string;
  versionId: string;
  version: number;
  role: "PRIMARY" | "SECONDARY" | "RISK_GATE";
  reason?: string;
  nodes: FlowNodeDefinition[];
  transitions: FlowTransitionDefinition[];
}

export interface CaseFlowPlanNode extends FlowNodeDefinition {
  id: string;
  sourceFlowIds: string[];
  sourceVersionIds: string[];
}

export interface CaseFlowPlan {
  revision: number;
  status: "READY" | "BLOCKED";
  primaryFlowId: string;
  secondaryFlowIds: string[];
  riskGateFlowIds: string[];
  reasons: string[];
  nodes: CaseFlowPlanNode[];
  transitions: FlowTransitionDefinition[];
  currentNodeId: string | null;
  possibilities: Array<{ fromNodeKey: string; toNodeKey: string; label: string; unknown: boolean }>;
  dependencies: string[];
  forbiddenCapabilities: ActionCapability[];
  blockedReasons: string[];
}
