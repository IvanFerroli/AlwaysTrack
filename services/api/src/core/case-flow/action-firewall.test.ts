import { connectorId, forbiddenActionCapabilities, type ActionFirewallAttempt, type ActionFirewallScope } from "@alwaystrack/shared";
import { describe, expect, it } from "vitest";
import { enforceCaseFlowAction } from "./action-firewall.js";

const connector = connectorId("alwayschat");
const baseAttempt: ActionFirewallAttempt = {
  actionId: "action-1", installationId: "installation-1", browserProfileId: "profile-1", userId: "user-1",
  caseId: "case-1", runId: "run-1", connectorId: connector, capability: "READ", target: "conversation:1",
  risk: "LOW", confirmation: { required: false }, requestedAt: "2026-07-12T12:00:00.000Z"
};
const baseScope: ActionFirewallScope = {
  connectorId: connector, nodeCapabilities: ["READ", "INSERT_DRAFT", "FILL_FORM"],
  connectorCapabilities: ["READ", "INSERT_DRAFT", "FILL_FORM"], target: "conversation:1",
  targetDigest: "sha256:target", contextDigest: "sha256:context", now: "2026-07-12T12:00:00.000Z"
};

describe("CaseFlow action firewall", () => {
  it.each(forbiddenActionCapabilities)("blocks and audits forbidden capability %s", (capability) => {
    const result = enforceCaseFlowAction({ ...baseAttempt, capability, risk: "CRITICAL" }, baseScope);
    expect(result.decision).toMatchObject({ allowed: false, capability, reason: "FORBIDDEN" });
    expect(result).toMatchObject({ audit: { capability, status: "BLOCKED", reason: "FORBIDDEN" } });
  });

  it("fails closed for unknown and undeclared capabilities", () => {
    expect(enforceCaseFlowAction({ ...baseAttempt, capability: "CLICK_SELECTOR" }, baseScope).decision).toMatchObject({ allowed: false, reason: "UNKNOWN" });
    const scope = { ...baseScope, nodeCapabilities: [] };
    expect(enforceCaseFlowAction(baseAttempt, scope).decision).toMatchObject({ allowed: false, reason: "FORBIDDEN" });
  });

  it.each(["INSERT_DRAFT", "FILL_FORM"] as const)("blocks %s without explicit confirmation", (capability) => {
    const result = enforceCaseFlowAction({ ...baseAttempt, capability, risk: capability === "FILL_FORM" ? "HIGH" : "MEDIUM", confirmation: { required: false } }, baseScope);
    expect(result.decision).toMatchObject({ allowed: false, reason: "CONFIRMATION_REQUIRED" });
    expect(result).toHaveProperty("audit.status", "BLOCKED");
  });

  it.each([
    { authorization: { consumedAt: "2026-07-12T11:59:00.000Z" }, reason: "AUTHORIZATION_USED" },
    { authorization: { expiresAt: "2026-07-12T11:59:00.000Z" }, reason: "AUTHORIZATION_EXPIRED" },
    { authorization: { targetDigest: "sha256:another-target" }, reason: "CONTEXT_MISMATCH" }
  ] as const)("blocks invalid conditional authorization: $reason", ({ authorization: override, reason }) => {
    const authorization = {
      authorizationRef: "authorization-1", actionId: "action-1", userId: "user-1", caseId: "case-1",
      capability: "INSERT_DRAFT" as const, targetDigest: "sha256:target", issuedAt: "2026-07-12T11:00:00.000Z",
      expiresAt: "2026-07-12T13:00:00.000Z", ...override
    };
    const result = enforceCaseFlowAction({
      ...baseAttempt, capability: "INSERT_DRAFT", risk: "MEDIUM",
      confirmation: { required: true, authorizationRef: "authorization-1" }
    }, { ...baseScope, authorization });
    expect(result.decision).toMatchObject({ allowed: false, reason });
    expect(result).toHaveProperty("audit.status", "BLOCKED");
  });

  it("rejects connector, target and risk mismatches before execution", () => {
    expect(enforceCaseFlowAction({ ...baseAttempt, connectorId: connectorId("omie") }, baseScope).decision).toMatchObject({ allowed: false, reason: "CONTEXT_MISMATCH" });
    expect(enforceCaseFlowAction({ ...baseAttempt, target: "conversation:2" }, baseScope).decision).toMatchObject({ allowed: false, reason: "CONTEXT_MISMATCH" });
    expect(enforceCaseFlowAction({ ...baseAttempt, risk: "HIGH" }, baseScope).decision).toMatchObject({ allowed: false, reason: "CONTEXT_MISMATCH" });
  });
});
