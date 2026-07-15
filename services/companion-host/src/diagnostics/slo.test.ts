import { describe, expect, it } from "vitest";
import { companionOperationalState, companionSloSignals } from "./slo.js";

describe("Companion SLO diagnostics", () => {
  it("distinguishes healthy, partial, degraded and unavailable states", () => {
    const healthy = { hostRunning: true, extensionPaired: true, reconnectFailures: 0, pendingActions: 0, selectorDriftCount: 0 };
    expect(companionOperationalState(healthy)).toBe("HEALTHY");
    expect(companionOperationalState({ ...healthy, selectorDriftCount: 1 })).toBe("PARTIAL_FAILURE");
    expect(companionOperationalState({ ...healthy, extensionPaired: false })).toBe("DEGRADED");
    expect(companionOperationalState({ ...healthy, hostRunning: false })).toBe("UNAVAILABLE");
  });

  it("fires only bounded counter alerts", () => {
    expect(companionSloSignals({ hostRunning: true, extensionPaired: true, reconnectFailures: 4, pendingActions: 26, selectorDriftCount: 1 })).toEqual({
      state: "DEGRADED", reconnectAlert: true, backlogAlert: true, driftAlert: true
    });
  });
});
