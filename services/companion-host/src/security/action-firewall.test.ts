import { connectorId, forbiddenActionCapabilities, type ActionFirewallAttempt, type ActionFirewallScope } from "@alwaystrack/shared";
import { describe, expect, it } from "vitest";
import { enforceHostAction } from "./action-firewall.js";

const connector = connectorId("omie");
const attempt: ActionFirewallAttempt = {
  actionId: "action-1", installationId: "installation-1", browserProfileId: "profile-1", userId: "user-1",
  caseId: "case-1", runId: "run-1", connectorId: connector, capability: "READ", target: "order:1", risk: "LOW",
  confirmation: { required: false }, requestedAt: "2026-07-12T12:00:00.000Z"
};
const scope: ActionFirewallScope = {
  connectorId: connector, nodeCapabilities: ["READ", "FILL_FORM"], connectorCapabilities: ["READ", "FILL_FORM"],
  target: "order:1", targetDigest: "sha256:target", contextDigest: "sha256:context", now: "2026-07-12T12:00:00.000Z"
};

describe("host action firewall adapter", () => {
  it.each(forbiddenActionCapabilities)("does not expose %s", (capability) => {
    expect(enforceHostAction({ ...attempt, capability }, scope)).toMatchObject({
      decision: { allowed: false, reason: "FORBIDDEN" }, audit: { status: "BLOCKED" }
    });
  });

  it("blocks OMIE drag/drop as an unknown generic action", () => {
    expect(enforceHostAction({ ...attempt, capability: "DRAG_DROP" }, scope).decision).toMatchObject({ allowed: false, reason: "UNKNOWN" });
  });
});
