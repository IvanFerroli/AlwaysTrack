import { describe, expect, it, vi } from "vitest";
import { insertAuthorizedAlwaysChatDraft } from "./draft.js";

const target = () => ({ mode: "DRAFT_ONLY" as const, insertDraft: vi.fn(async () => undefined), focusDraft: vi.fn(async () => undefined) });
describe("AlwaysChat authorized draft", () => {
  it("requires enablement, explicit click and firewall authorization", async () => {
    for (const input of [
      { enabled: false, explicitClick: true, decision: { allowed: true as const, capability: "INSERT_DRAFT" as const, authorizationRef: "auth" } },
      { enabled: true, explicitClick: false, decision: { allowed: true as const, capability: "INSERT_DRAFT" as const, authorizationRef: "auth" } },
      { enabled: true, explicitClick: true, decision: { allowed: false as const } }
    ]) { const dom = target(); await expect(insertAuthorizedAlwaysChatDraft({ ...input, actionId: "a", text: "Rascunho", target: dom })).rejects.toThrow(); expect(dom.insertDraft).not.toHaveBeenCalled(); }
  });
  it("inserts text only and returns an auditable event", async () => { const dom = target(); const result = await insertAuthorizedAlwaysChatDraft({ enabled: true, explicitClick: true, actionId: "a", text: "  Rascunho seguro  ", decision: { allowed: true, capability: "INSERT_DRAFT", authorizationRef: "auth-1" }, target: dom }); expect(dom.insertDraft).toHaveBeenCalledWith("Rascunho seguro"); expect(result.type).toBe("ALWAYSCHAT_DRAFT_INSERTED"); expect(Object.keys(dom)).not.toEqual(expect.arrayContaining(["submit", "send", "resolve"])); });
});
