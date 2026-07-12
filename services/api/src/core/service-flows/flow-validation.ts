import type { FlowNodeDefinition, FlowTransitionDefinition } from "@alwaystrack/shared";

export type FlowValidationCode =
  | "MISSING_START" | "MULTIPLE_STARTS" | "MISSING_END" | "DUPLICATE_NODE_KEY"
  | "UNKNOWN_TRANSITION_NODE" | "DUPLICATE_TRANSITION" | "ORPHAN_NODE"
  | "UNREACHABLE_END" | "DISALLOWED_LOOP" | "MISSING_RISK_GATE";

export interface FlowValidationIssue { code: FlowValidationCode; nodeKey?: string; transition?: string }

export function validateFlowGraph(nodes: FlowNodeDefinition[], transitions: FlowTransitionDefinition[]) {
  const issues: FlowValidationIssue[] = [];
  const keys = new Set<string>();
  for (const node of nodes) {
    if (keys.has(node.key)) issues.push({ code: "DUPLICATE_NODE_KEY", nodeKey: node.key });
    keys.add(node.key);
  }
  const starts = nodes.filter((node) => node.type === "START");
  const ends = nodes.filter((node) => node.type === "END" || node.terminal);
  if (!starts.length) issues.push({ code: "MISSING_START" });
  if (starts.length > 1) issues.push({ code: "MULTIPLE_STARTS" });
  if (!ends.length) issues.push({ code: "MISSING_END" });

  const outgoing = new Map<string, FlowTransitionDefinition[]>();
  const incoming = new Map<string, FlowTransitionDefinition[]>();
  const transitionKeys = new Set<string>();
  for (const edge of transitions) {
    const id = `${edge.fromNodeKey}->${edge.toNodeKey}:${edge.label}`;
    if (!keys.has(edge.fromNodeKey) || !keys.has(edge.toNodeKey)) issues.push({ code: "UNKNOWN_TRANSITION_NODE", transition: id });
    if (transitionKeys.has(id)) issues.push({ code: "DUPLICATE_TRANSITION", transition: id });
    transitionKeys.add(id);
    outgoing.set(edge.fromNodeKey, [...(outgoing.get(edge.fromNodeKey) ?? []), edge]);
    incoming.set(edge.toNodeKey, [...(incoming.get(edge.toNodeKey) ?? []), edge]);
  }

  const reachable = new Set<string>();
  const visit = (key: string) => {
    if (reachable.has(key)) return;
    reachable.add(key);
    for (const edge of outgoing.get(key) ?? []) visit(edge.toNodeKey);
  };
  if (starts[0]) visit(starts[0].key);
  for (const node of nodes) if (!reachable.has(node.key)) issues.push({ code: "ORPHAN_NODE", nodeKey: node.key });

  const canReachEnd = new Set(ends.map((node) => node.key));
  let changed = true;
  while (changed) {
    changed = false;
    for (const edge of transitions) if (canReachEnd.has(edge.toNodeKey) && !canReachEnd.has(edge.fromNodeKey)) { canReachEnd.add(edge.fromNodeKey); changed = true; }
  }
  for (const node of nodes) if (reachable.has(node.key) && !canReachEnd.has(node.key)) issues.push({ code: "UNREACHABLE_END", nodeKey: node.key });

  const active = new Set<string>();
  const done = new Set<string>();
  const detectCycle = (key: string) => {
    active.add(key);
    for (const edge of outgoing.get(key) ?? []) {
      if (active.has(edge.toNodeKey)) {
        if (!edge.allowLoop) issues.push({ code: "DISALLOWED_LOOP", transition: `${edge.fromNodeKey}->${edge.toNodeKey}:${edge.label}` });
      } else if (!done.has(edge.toNodeKey)) detectCycle(edge.toNodeKey);
    }
    active.delete(key); done.add(key);
  };
  if (starts[0]) detectCycle(starts[0].key);

  for (const node of nodes) {
    if ((node.riskLevel === "HIGH" || node.riskLevel === "CRITICAL") && node.type !== "RISK_GATE") {
      const guarded = (incoming.get(node.key) ?? []).some((edge) => nodes.find((item) => item.key === edge.fromNodeKey)?.type === "RISK_GATE");
      if (!guarded) issues.push({ code: "MISSING_RISK_GATE", nodeKey: node.key });
    }
  }
  return { valid: issues.length === 0, issues };
}
