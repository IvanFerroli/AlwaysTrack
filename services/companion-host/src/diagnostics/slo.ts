export type CompanionOperationalState = "HEALTHY" | "PARTIAL_FAILURE" | "DEGRADED" | "UNAVAILABLE";

export interface CompanionSloSample {
  hostRunning: boolean;
  extensionPaired: boolean;
  reconnectFailures: number;
  pendingActions: number;
  selectorDriftCount: number;
}

export function companionOperationalState(sample: CompanionSloSample): CompanionOperationalState {
  if (!sample.hostRunning) return "UNAVAILABLE";
  if (!sample.extensionPaired || sample.reconnectFailures > 3) return "DEGRADED";
  if (sample.pendingActions > 0 || sample.selectorDriftCount > 0) return "PARTIAL_FAILURE";
  return "HEALTHY";
}

export function companionSloSignals(sample: CompanionSloSample) {
  return {
    state: companionOperationalState(sample),
    reconnectAlert: sample.reconnectFailures > 3,
    backlogAlert: sample.pendingActions > 25,
    driftAlert: sample.selectorDriftCount > 0
  };
}
