import { describe, expect, it } from "vitest";
import { InputValidationError } from "../validation/input-validation.js";
import {
  parseServiceFlowGovernanceInput,
  parseServiceFlowInput,
  parseServiceFlowSessionStepInput
} from "./service-flows.service.js";

describe("service flows parser contracts", () => {
  it("normalizes service flow authoring payloads", () => {
    expect(
      parseServiceFlowInput({
        title: " Triagem ",
        slug: "",
        summary: " passo a passo ",
        tags: ["#SAC", "saude", "SAC"],
        status: "published",
        priority: "5",
        steps: [
          {
            title: " Verificar uso ",
            body: "",
            kind: "yes_no",
            order: "2",
            required: true,
            scriptIds: ["script-1", "script-1", "script-2"]
          }
        ]
      })
    ).toMatchObject({
      title: "Triagem",
      slug: null,
      summary: "passo a passo",
      tags: ["sac", "saude"],
      status: "PUBLISHED",
      priority: 5,
      steps: [
        {
          title: "Verificar uso",
          body: null,
          kind: "YES_NO",
          order: 2,
          required: true,
          scriptIds: ["script-1", "script-2"]
        }
      ]
    });
  });

  it("rejects malformed service flow inputs before service execution", () => {
    expect(() => parseServiceFlowInput("bad")).toThrow(InputValidationError);
    expect(() => parseServiceFlowInput({ steps: "bad" })).toThrow(InputValidationError);
    expect(() => parseServiceFlowInput({ steps: [{ title: "ok", scriptIds: Array.from({ length: 13 }, (_, index) => `s-${index}`) }] })).toThrow(InputValidationError);
    expect(() => parseServiceFlowSessionStepInput({ note: "x".repeat(2_001) })).toThrow(InputValidationError);
    expect(() => parseServiceFlowGovernanceInput({ comment: "x".repeat(2_001) })).toThrow(InputValidationError);
  });
});
