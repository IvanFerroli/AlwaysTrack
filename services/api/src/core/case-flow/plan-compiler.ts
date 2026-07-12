import { actionPolicyFor, type ActionCapability, type CaseFlowPlan, type CaseFlowPlanNode, type ServiceFlowVersionDefinition } from "@alwaystrack/shared";
import { validateFlowGraph } from "../service-flows/flow-validation.js";

function nodeSignature(node: ServiceFlowVersionDefinition["nodes"][number]) {
  return JSON.stringify([node.type, node.title.trim().toLowerCase(), [...node.requiredFacts].sort()]);
}

export function compileCaseFlowPlan(flows: ServiceFlowVersionDefinition[]): CaseFlowPlan {
  const primary = flows.filter((flow) => flow.role === "PRIMARY");
  const blockedReasons: string[] = [];
  if (primary.length !== 1) blockedReasons.push("EXACTLY_ONE_PRIMARY_REQUIRED");
  for (const flow of flows) {
    const validation = validateFlowGraph(flow.nodes, flow.transitions);
    blockedReasons.push(...validation.issues.map((issue) => `INVALID_GRAPH:${flow.versionId}:${issue.code}`));
  }

  const nodes = new Map<string, CaseFlowPlanNode>();
  const messages = new Map<string, string>();
  const forbidden = new Set<ActionCapability>();
  const dependencies = new Set<string>();
  for (const flow of flows) for (const node of flow.nodes) {
    for (const capability of [...node.allowedCapabilities, ...node.forbiddenCapabilities]) {
      const policy = actionPolicyFor(capability);
      if (policy.disposition === "FORBIDDEN" || node.forbiddenCapabilities.includes(capability)) forbidden.add(capability);
      if (node.allowedCapabilities.includes(capability) && policy.disposition === "FORBIDDEN") blockedReasons.push(`FORBIDDEN_ACTION:${capability}`);
    }
    for (const dependency of node.dependencies ?? []) dependencies.add(dependency);
    const signature = nodeSignature(node);
    const existingMessage = messages.get(signature);
    if (existingMessage && node.message && existingMessage !== node.message) blockedReasons.push(`CONFLICTING_MESSAGE:${node.title}`);
    if (node.message) messages.set(signature, node.message);
    const existing = nodes.get(signature);
    if (existing) {
      existing.sourceFlowIds.push(flow.flowId);
      existing.sourceVersionIds.push(flow.versionId);
      continue;
    }
    nodes.set(signature, { ...node, id: `${flow.versionId}:${node.key}`, sourceFlowIds: [flow.flowId], sourceVersionIds: [flow.versionId] });
  }

  const rank = (node: CaseFlowPlanNode) => node.type === "START" ? 0 : node.type === "RISK_GATE" ? 1 : node.riskLevel === "CRITICAL" ? 2 : node.type === "END" ? 4 : 3;
  const compiledNodes = [...nodes.values()].sort((left, right) => rank(left) - rank(right));
  const transitions = flows.flatMap((flow) => flow.transitions);
  const possibilities = transitions.filter((edge) => edge.requiresUserChoice || edge.condition).map((edge) => ({
    fromNodeKey: edge.fromNodeKey, toNodeKey: edge.toNodeKey, label: edge.label, unknown: Boolean(edge.condition)
  }));
  return {
    revision: 1,
    status: blockedReasons.length ? "BLOCKED" : "READY",
    primaryFlowId: primary[0]?.flowId ?? "",
    secondaryFlowIds: flows.filter((flow) => flow.role === "SECONDARY").map((flow) => flow.flowId),
    riskGateFlowIds: flows.filter((flow) => flow.role === "RISK_GATE").map((flow) => flow.flowId),
    reasons: flows.flatMap((flow) => flow.reason ? [flow.reason] : []), nodes: compiledNodes, transitions,
    currentNodeId: compiledNodes.find((node) => node.type !== "START")?.id ?? null,
    possibilities, dependencies: [...dependencies], forbiddenCapabilities: [...forbidden], blockedReasons: [...new Set(blockedReasons)]
  };
}
