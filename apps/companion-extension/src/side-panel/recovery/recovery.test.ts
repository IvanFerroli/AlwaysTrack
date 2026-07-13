import { expect, it, vi } from "vitest";
import { SidePanelRecovery } from "./index.js";

it("restores the tenant case and pinned flow after panel restart", async () => {
  const saved = { organizationId: "tenant", caseId: "case", sessionId: "session", flowVersion: "v3", lastStepKey: "captcha", savedAt: "2026-07-12T10:00:00Z" };
  const storage = { get: vi.fn().mockResolvedValue(saved), set: vi.fn(), remove: vi.fn() };
  const rehydrate = vi.fn().mockResolvedValue({ snapshot: saved });
  await expect(new SidePanelRecovery(storage, { rehydrate }).restore("tenant", "case")).resolves.toEqual(saved);
  expect(rehydrate).toHaveBeenCalledWith({ organizationId: "tenant", caseId: "case", sessionId: "session", flowVersion: "v3" });
});
