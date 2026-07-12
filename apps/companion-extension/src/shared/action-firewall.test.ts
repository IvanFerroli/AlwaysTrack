import { connectorId, forbiddenActionCapabilities, type ActionFirewallAttempt, type ActionFirewallScope } from "@alwaystrack/shared";
import { describe, expect, it } from "vitest";
import { enforceExtensionAction } from "./action-firewall.js";

const connector = connectorId("alwayschat");
const attempt: ActionFirewallAttempt = {
  actionId: "action-1", installationId: "installation-1", browserProfileId: "profile-1", userId: "user-1",
  caseId: "case-1", runId: "run-1", connectorId: connector, capability: "READ", target: "conversation:1", risk: "LOW",
  confirmation: { required: false }, requestedAt: "2026-07-12T12:00:00.000Z"
};
const scope: ActionFirewallScope = {
  connectorId: connector, nodeCapabilities: ["READ", "INSERT_DRAFT"], connectorCapabilities: ["READ", "INSERT_DRAFT"],
  target: "conversation:1", targetDigest: "sha256:target", contextDigest: "sha256:context", now: "2026-07-12T12:00:00.000Z"
};

describe("extension action firewall adapter", () => {
  it.each(forbiddenActionCapabilities)("does not expose %s", (capability) => {
    expect(enforceExtensionAction({ ...attempt, capability }, scope)).toMatchObject({
      decision: { allowed: false, reason: "FORBIDDEN" }, audit: { status: "BLOCKED" }
    });
  });

  it("cannot insert a draft without a correlated authorization", () => {
    expect(enforceExtensionAction({ ...attempt, capability: "INSERT_DRAFT", risk: "MEDIUM" }, scope).decision)
      .toMatchObject({ allowed: false, reason: "CONFIRMATION_REQUIRED" });
  });
});
