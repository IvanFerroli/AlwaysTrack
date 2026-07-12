import { describe, expect, it, vi } from "vitest";
import { copyActionContent, createCopyIntent, type CopyAction } from "./copy-actions.js";

const action: CopyAction = { id: "slack-1", kind: "SLACK_DRAFT", label: "Copiar rascunho Slack", content: "Texto interno" };

describe("copy-only actions", () => {
  it("writes only to the clipboard and emits an audit intent", async () => {
    const clipboard = { writeText: vi.fn().mockResolvedValue(undefined) };
    await expect(copyActionContent(action, clipboard)).resolves.toEqual(createCopyIntent(action));
    expect(clipboard.writeText).toHaveBeenCalledWith("Texto interno");
    expect(JSON.stringify(createCopyIntent(action))).not.toMatch(/submit|send|insert|fill/i);
  });

  it("does not emit an intent when clipboard writing fails", async () => {
    const clipboard = { writeText: vi.fn().mockRejectedValue(new Error("denied")) };
    await expect(copyActionContent(action, clipboard)).rejects.toThrow("denied");
  });
});
