import { describe, expect, it } from "vitest";
import { createInterventionIntent, getInterventionPresentation, interventionStates, isInterventionViewState } from "./intervention.js";

describe("human intervention", () => {
  it.each(interventionStates)("defines safe actions for %s", (state) => {
    const presentation = getInterventionPresentation(state);
    expect(presentation.actions.length).toBeGreaterThan(0);
    expect(`${presentation.title} ${presentation.message}`).not.toMatch(/digite.*(senha|codigo)|bypass/i);
  });

  it("keeps captcha and 2FA resolution manual", () => {
    for (const state of ["BLOCKED_CAPTCHA", "BLOCKED_2FA"] as const) {
      const actions = getInterventionPresentation(state).actions.map(({ action }) => action);
      expect(actions).toContain("FOCUS_TAB");
      expect(actions).toContain("CONTINUE");
      expect(actions).not.toContain("RETRY");
      expect(actions).not.toContain("USE_MANUAL_INPUT");
    }
  });

  it("emits a typed intent without case data", () => {
    expect(createInterventionIntent("int-1", "CONTINUE")).toEqual({
      type: "INTERVENTION_INTENT",
      payload: { interventionId: "int-1", action: "CONTINUE" }
    });
  });

  it("validates incoming view state", () => {
    expect(isInterventionViewState({ interventionId: "i", connectorLabel: "J&T", state: "BLOCKED_CAPTCHA" })).toBe(true);
    expect(isInterventionViewState({ interventionId: "i", connectorLabel: "J&T", state: "OTHER" })).toBe(false);
  });
});
