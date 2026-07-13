import { describe, expect, it } from "vitest";
import { createLancadorFormDraftAction } from "./form-draft.js";

describe("Lancador form draft action", () => {
  it("describes preparation and manual review without a final command", () => {
    const action = createLancadorFormDraftAction("draft-1", { type: "REENVIO", products: [{ name: "Produto", quantity: 1 }], reason: "Entrega nao reconhecida" });
    expect(action.kind).toBe("LANCADOR_DRAFT");
    expect(action.reviewChecklist.join(" ")).toMatch(/manualmente/i);
    expect(JSON.stringify(action)).not.toMatch(/submit|confirmOrder|createOrder/i);
  });
});
