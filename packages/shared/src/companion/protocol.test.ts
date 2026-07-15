import { describe, expect, it } from "vitest";
import {
  companionHelloSchema,
  companionPairedSchema,
  companionProtocolErrorSchema,
  companionReconnectSchema
} from "./protocol.js";

const envelope = { protocolVersion: "1", messageId: "message-1", timestamp: "2026-07-15T12:00:00.000Z" };

describe("companion handshake runtime schemas", () => {
  it("accepts the complete HELLO and PAIRED contracts", () => {
    expect(companionHelloSchema.safeParse({
      ...envelope,
      type: "COMPANION_HELLO",
      extensionInstanceId: "extension-1",
      payload: { token: "token-1", supportedProtocolVersions: ["1"] }
    }).success).toBe(true);
    expect(companionPairedSchema.safeParse({
      ...envelope,
      type: "COMPANION_PAIRED",
      installationId: "installation-1",
      browserProfileId: "profile-1",
      userId: "user-1",
      payload: { sessionId: "session-1", expiresAt: "2026-07-15T12:01:00.000Z", reconnectToken: "token-2" }
    }).success).toBe(true);
    expect(companionReconnectSchema.safeParse({
      sessionId: "session-1",
      expiresAt: "2026-07-15T12:01:00.000Z",
      reconnectToken: "token-2"
    }).success).toBe(true);
  });

  it("rejects incomplete handshake and error payloads", () => {
    expect(companionHelloSchema.safeParse({ ...envelope, type: "COMPANION_HELLO", payload: { token: "token-1" } }).success).toBe(false);
    expect(companionPairedSchema.safeParse({ ...envelope, type: "COMPANION_PAIRED", payload: { sessionId: "session-1" } }).success).toBe(false);
    expect(companionProtocolErrorSchema.safeParse({ ...envelope, type: "COMPANION_ERROR", payload: {} }).success).toBe(false);
  });

  it("rejects protocol drift", () => {
    expect(companionHelloSchema.safeParse({
      ...envelope,
      protocolVersion: "2",
      type: "COMPANION_HELLO",
      extensionInstanceId: "extension-1",
      payload: { token: "token-1", supportedProtocolVersions: ["2"] }
    }).success).toBe(false);
  });
});
