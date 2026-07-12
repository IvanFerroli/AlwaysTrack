import { describe, expect, it } from "vitest";
import { getPlanUpdateLabel, shouldKeepVisibleStep, type PlanUpdate } from "./plan-updates.js";

const update: PlanUpdate = { revision: 3, kind: "PLAN_UPDATED", recommendationChanged: true, copiedMessageBecameObsolete: false, message: "Nova evidencia recebida" };

describe("plan update stability", () => {
  it("keeps a still-valid visible step while the plan is refined", () => {
    expect(shouldKeepVisibleStep(update, true)).toBe(true);
    expect(shouldKeepVisibleStep(update, false)).toBe(false);
  });

  it("distinguishes update kinds", () => {
    expect(getPlanUpdateLabel("PLAN_UPDATED")).toBe("Plano atualizado");
    expect(getPlanUpdateLabel("BRANCH_INVALIDATED")).toBe("Opcao indisponivel");
    expect(getPlanUpdateLabel("MESSAGE_RECOMPILED")).toBe("Mensagem atualizada");
  });
});
