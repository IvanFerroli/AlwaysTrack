import { describe, expect, it, vi } from "vitest";
import { prepareAuthorizedLancadorDraft, undoLancadorDraft } from "./draft.js";

const fields = { type: "REENVIO", products: [{ name: "Produto", quantity: 1 }], reason: "Entrega nao reconhecida" };
const target = () => ({ mode: "DRAFT_ONLY" as const, fillDraft: vi.fn(async () => undefined), clearDraft: vi.fn(async () => undefined) });
describe("Lancador authorized draft", () => {
  it("fails closed before the authorized fake DOM", async () => { const dom = target(); await expect(prepareAuthorizedLancadorDraft({ enabled: true, explicitClick: false, actionId: "a", fields, decision: { allowed: true, capability: "FILL_FORM", authorizationRef: "auth" }, target: dom })).rejects.toThrow("EXPLICIT_CLICK_REQUIRED"); expect(dom.fillDraft).not.toHaveBeenCalled(); await expect(prepareAuthorizedLancadorDraft({ enabled: true, explicitClick: true, actionId: "a", fields, decision: { allowed: false }, target: dom })).rejects.toThrow("AUTHORIZATION_REQUIRED"); expect(dom.fillDraft).not.toHaveBeenCalled(); });
  it("fills draft fields, never confirms, and can clear local preparation", async () => { const dom = target(); const result = await prepareAuthorizedLancadorDraft({ enabled: true, explicitClick: true, actionId: "a", fields, decision: { allowed: true, capability: "FILL_FORM", authorizationRef: "auth" }, target: dom }); expect(dom.fillDraft).toHaveBeenCalledWith(fields); expect(result.checklist.join(" ")).toMatch(/manual/i); expect(Object.keys(dom)).not.toEqual(expect.arrayContaining(["submit", "confirm", "createOrder"])); await undoLancadorDraft(dom); expect(dom.clearDraft).toHaveBeenCalledOnce(); });
});
