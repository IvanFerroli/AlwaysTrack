import { describe, expect, it } from "vitest";
import {
  actionCapabilityPolicies,
  allowedActionCapabilities,
  conditionalActionCapabilities,
  forbiddenActionCapabilities,
  type ActionCapability,
  type ActionRisk,
  type HumanActionAuthorization
} from "../case-flow/action-capabilities.js";
import { connectorId } from "../case-flow/evidence.js";
import {
  enforceActionFirewall,
  type ActionFirewallAttempt,
  type ActionFirewallScope
} from "./action-firewall.js";

const connector = connectorId("alwayschat");
const otherConnector = connectorId("omie");
const now = "2026-07-15T12:00:00.000Z";

const baseAttempt: ActionFirewallAttempt = {
  actionId: "action-1",
  installationId: "installation-1",
  browserProfileId: "profile-1",
  userId: "user-1",
  caseId: "case-1",
  runId: "run-1",
  connectorId: connector,
  capability: "READ",
  target: "conversation:1",
  risk: "LOW",
  confirmation: { required: false },
  requestedAt: now
};

const executableCapabilities = [...allowedActionCapabilities, ...conditionalActionCapabilities];
const baseScope: ActionFirewallScope = {
  connectorId: connector,
  nodeCapabilities: executableCapabilities,
  connectorCapabilities: executableCapabilities,
  target: "conversation:1",
  targetDigest: "sha256:target",
  contextDigest: "sha256:context",
  now
};

function attemptFor(capability: ActionCapability): ActionFirewallAttempt {
  const policy = actionCapabilityPolicies[capability];
  return {
    ...baseAttempt,
    capability,
    risk: policy.risk,
    confirmation: policy.disposition === "CONDITIONAL"
      ? { required: true, authorizationRef: "authorization-1" }
      : { required: false }
  };
}

function authorizationFor(capability: (typeof conditionalActionCapabilities)[number]): HumanActionAuthorization {
  return {
    authorizationRef: "authorization-1",
    actionId: "action-1",
    userId: "user-1",
    caseId: "case-1",
    capability,
    targetDigest: "sha256:target",
    issuedAt: "2026-07-15T11:00:00.000Z",
    expiresAt: "2026-07-15T13:00:00.000Z"
  };
}

function expectBlocked(
  attempt: ActionFirewallAttempt,
  scope: ActionFirewallScope,
  reason: string
) {
  const result = enforceActionFirewall(attempt, scope);
  expect(result.decision).toMatchObject({ allowed: false, reason });
  expect(result).toMatchObject({ audit: { status: "BLOCKED", reason } });
  if (result.decision.allowed) throw new Error("Expected firewall attempt to be blocked");
  if (!result.audit) throw new Error("Expected blocked attempt to include an audit record");
  return result;
}

describe("canonical action firewall", () => {
  describe("capability disposition", () => {
    it.each(allowedActionCapabilities)("allows declared %s actions without authorization", (capability) => {
      const result = enforceActionFirewall(attemptFor(capability), baseScope);

      expect(result).toEqual({
        decision: {
          allowed: true,
          actionId: "action-1",
          capability,
          risk: actionCapabilityPolicies[capability].risk,
          contextDigest: "sha256:context"
        }
      });
    });

    it.each(forbiddenActionCapabilities)("blocks and audits forbidden capability %s", (capability) => {
      const result = expectBlocked(attemptFor(capability), baseScope, "FORBIDDEN");

      expect(result).toMatchObject({
        decision: { capability, risk: actionCapabilityPolicies[capability].risk },
        audit: {
          actionId: "action-1",
          capability,
          connectorId: connector,
          caseId: "case-1",
          runId: "run-1",
          occurredAt: now,
          targetReference: "sha256:target"
        }
      });
    });

    it("fails closed for an unknown capability", () => {
      const result = expectBlocked({ ...baseAttempt, capability: "CLICK_SELECTOR" }, baseScope, "UNKNOWN");
      expect(result.decision).toMatchObject({ risk: "CRITICAL" });
    });

    it.each([
      ["node", { nodeCapabilities: [] }],
      ["connector", { connectorCapabilities: [] }]
    ] as const)("requires the capability in the %s declaration", (_source, scopeOverride) => {
      expectBlocked(baseAttempt, { ...baseScope, ...scopeOverride }, "FORBIDDEN");
    });
  });

  describe("context correlation", () => {
    it.each([
      ["actionId", { actionId: undefined }, {}],
      ["installationId", { installationId: undefined }, {}],
      ["browserProfileId", { browserProfileId: undefined }, {}],
      ["userId", { userId: undefined }, {}],
      ["caseId", { caseId: undefined }, {}],
      ["runId", { runId: undefined }, {}],
      ["connectorId", { connectorId: undefined }, {}],
      ["target", { target: undefined }, {}],
      ["requestedAt", { requestedAt: undefined }, {}],
      ["scope target", {}, { target: "" }],
      ["targetDigest", {}, { targetDigest: "" }],
      ["contextDigest", {}, { contextDigest: "" }]
    ] as const)("blocks missing required context: %s", (_field, attemptOverride, scopeOverride) => {
      expectBlocked(
        { ...baseAttempt, ...attemptOverride },
        { ...baseScope, ...scopeOverride },
        "CONTEXT_MISMATCH"
      );
    });

    it.each([
      ["connector", { connectorId: otherConnector }],
      ["target", { target: "conversation:2" }],
      ["risk", { risk: "HIGH" as ActionRisk }]
    ] as const)("blocks a %s mismatch", (_field, attemptOverride) => {
      expectBlocked({ ...baseAttempt, ...attemptOverride }, baseScope, "CONTEXT_MISMATCH");
    });

    it("uses safe audit fallbacks when request context is absent", () => {
      const result = expectBlocked(
        { capability: "READ", risk: "LOW", confirmation: { required: false } },
        { ...baseScope, contextDigest: "", targetDigest: "", now: undefined },
        "CONTEXT_MISMATCH"
      );

      expect(result).toMatchObject({
        decision: { actionId: undefined, contextDigest: undefined },
        audit: {
          actionId: "UNKNOWN_ACTION",
          connectorId: undefined,
          caseId: "UNKNOWN_CASE",
          runId: "UNKNOWN_RUN",
          targetReference: undefined
        }
      });
      expect(Date.parse(result.audit.occurredAt)).not.toBeNaN();
    });
  });

  describe("confirmation and authorization", () => {
    it.each([
      ["missing confirmation", undefined],
      ["confirmation required", { required: true }],
      ["unexpected authorization reference", { required: false, authorizationRef: "authorization-1" }]
    ] as const)("rejects allowed actions with %s", (_scenario, confirmation) => {
      expectBlocked({ ...baseAttempt, confirmation }, baseScope, "CONTEXT_MISMATCH");
    });

    it.each([
      ["missing confirmation", undefined],
      ["confirmation denied", { required: false }],
      ["missing reference", { required: true }]
    ] as const)("requires explicit conditional confirmation: %s", (_scenario, confirmation) => {
      expectBlocked(
        { ...attemptFor("INSERT_DRAFT"), confirmation },
        { ...baseScope, authorization: authorizationFor("INSERT_DRAFT") },
        "CONFIRMATION_REQUIRED"
      );
    });

    it("rejects an unknown authorization reference", () => {
      expectBlocked(attemptFor("INSERT_DRAFT"), baseScope, "CONFIRMATION_REQUIRED");
    });

    it("rejects a consumed authorization", () => {
      expectBlocked(attemptFor("INSERT_DRAFT"), {
        ...baseScope,
        authorization: { ...authorizationFor("INSERT_DRAFT"), consumedAt: "2026-07-15T11:30:00.000Z" }
      }, "AUTHORIZATION_USED");
    });

    it.each([
      ["expired", { expiresAt: "2026-07-15T11:59:59.999Z" }, now],
      ["expires exactly now", { expiresAt: now }, now],
      ["invalid expiry", { expiresAt: "not-a-date" }, now],
      ["invalid current time", {}, "not-a-date"]
    ] as const)("rejects an %s authorization", (_scenario, authorizationOverride, currentTime) => {
      expectBlocked(attemptFor("INSERT_DRAFT"), {
        ...baseScope,
        now: currentTime,
        authorization: { ...authorizationFor("INSERT_DRAFT"), ...authorizationOverride }
      }, "AUTHORIZATION_EXPIRED");
    });

    it.each([
      ["reference", { authorizationRef: "authorization-2" }],
      ["action", { actionId: "action-2" }],
      ["user", { userId: "user-2" }],
      ["case", { caseId: "case-2" }],
      ["capability", { capability: "FILL_FORM" as const }],
      ["target digest", { targetDigest: "sha256:other-target" }]
    ] as const)("rejects authorization with mismatched %s", (_field, authorizationOverride) => {
      expectBlocked(attemptFor("INSERT_DRAFT"), {
        ...baseScope,
        authorization: { ...authorizationFor("INSERT_DRAFT"), ...authorizationOverride }
      }, "CONTEXT_MISMATCH");
    });

    it.each(conditionalActionCapabilities)("allows %s with a valid correlated authorization", (capability) => {
      const authorization = authorizationFor(capability);
      const result = enforceActionFirewall(attemptFor(capability), { ...baseScope, authorization });

      expect(result).toEqual({
        decision: {
          allowed: true,
          actionId: "action-1",
          capability,
          risk: actionCapabilityPolicies[capability].risk,
          contextDigest: "sha256:context",
          authorizationRef: "authorization-1"
        }
      });
    });

    it("uses the current clock when a valid authorization has no scoped time", () => {
      const authorization = { ...authorizationFor("INSERT_DRAFT"), expiresAt: "2999-01-01T00:00:00.000Z" };
      const result = enforceActionFirewall(attemptFor("INSERT_DRAFT"), {
        ...baseScope,
        now: undefined,
        authorization
      });

      expect(result.decision).toMatchObject({ allowed: true, authorizationRef: "authorization-1" });
    });
  });
});
