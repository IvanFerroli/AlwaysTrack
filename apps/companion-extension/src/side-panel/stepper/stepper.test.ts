import { describe, expect, it } from "vitest";
import { createStepBackIntent, createStepChoiceIntent } from "./stepper.js";

describe("guided stepper intents", () => {
  it("emits an internal choice without an external action", () => {
    const intent = createStepChoiceIntent("step-2", "late");
    expect(intent).toEqual({ type: "CASE_FLOW_STEP_CHOSEN", payload: { stepId: "step-2", optionId: "late" } });
    expect(JSON.stringify(intent)).not.toMatch(/submit|send|insert|fill/i);
  });

  it("keeps the previous step recoverable", () => {
    expect(createStepBackIntent("step-2")).toEqual({ type: "CASE_FLOW_STEP_BACK", payload: { stepId: "step-2" } });
  });
});
