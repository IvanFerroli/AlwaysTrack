import type { CaseFlowPlan } from "@alwaystrack/shared";

export interface PlanReconciliationState {
  currentNodeId: string | null;
  confirmedChoices: Record<string, string>;
  copiedMessageNodeIds: string[];
}

export function reconcileCaseFlowPlan(previous: CaseFlowPlan, next: CaseFlowPlan, state: PlanReconciliationState) {
  const nextIds = new Set(next.nodes.map((node) => node.id));
  const currentNodeId = state.currentNodeId && nextIds.has(state.currentNodeId) ? state.currentNodeId : next.currentNodeId;
  const confirmedChoices = Object.fromEntries(Object.entries(state.confirmedChoices).filter(([nodeId]) => nextIds.has(nodeId)));
  const copiedMessageNodeIds = state.copiedMessageNodeIds.filter((nodeId) => nextIds.has(nodeId));
  const removedNodeIds = previous.nodes.map((node) => node.id).filter((id) => !nextIds.has(id));
  const recommendationChanged = previous.primaryFlowId !== next.primaryFlowId || removedNodeIds.length > 0;
  return {
    plan: { ...next, revision: previous.revision + 1, currentNodeId },
    state: { currentNodeId, confirmedChoices, copiedMessageNodeIds },
    revision: { from: previous.revision, to: previous.revision + 1, removedNodeIds, recommendationChanged,
      warning: recommendationChanged ? "PLAN_RECOMMENDATION_CHANGED" : null }
  };
}
