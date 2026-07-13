import { describe, expect, it } from "vitest";
import { authorizeCompanionMutation, CompanionTrustError, issueCompanionCredential, revokeCompanionCredential } from "./companion-trust.service.js";

function fixture() {
  let installation: any;
  const run = { id: "run-1", caseId: "case-1", installationId: "install-1", userId: "user-1", browserProfileId: "profile-1", organizationId: "org-1" };
  const db = {
    companionInstallation: {
      findUnique: async ({ where }: any) => where.id === installation?.id ? installation : null,
      findFirst: async ({ where }: any) => installation && Object.entries(where).every(([key, value]) => installation[key] === value) ? installation : null,
      upsert: async ({ create, update }: any) => { installation = installation ? { ...installation, ...update } : { ...create }; return installation; },
      update: async ({ data }: any) => { installation = { ...installation, ...data }; return installation; }
    },
    connectorRun: { findFirst: async ({ where }: any) => Object.entries(where).every(([key, value]) => run[key as keyof typeof run] === value) ? run : null }
  };
  return { db: db as any, actor: { id: "user-1", organizationId: "org-1" } as any, getInstallation: () => installation };
}

describe("Companion API trust", () => {
  it("issues, correlates and revokes a dedicated credential", async () => {
    const { db, actor } = fixture(); const now = () => new Date("2026-07-12T12:00:00.000Z");
    const credential = await issueCompanionCredential(db, actor, { installationId: "install-1", browserProfileId: "profile-1", extensionInstanceId: "extension-1" }, { enabled: true, now });
    const correlation = { installationId: "install-1", userId: "user-1", browserProfileId: "profile-1", caseId: "case-1", runId: "run-1" };
    await expect(authorizeCompanionMutation(db, credential.token, correlation, { enabled: true, now })).resolves.toMatchObject({ actor: { id: "user-1", organizationId: "org-1" } });
    await expect(authorizeCompanionMutation(db, credential.token, { ...correlation, browserProfileId: "other" }, { enabled: true, now })).rejects.toMatchObject({ code: "CORRELATION_MISMATCH" });
    await revokeCompanionCredential(db, actor, "install-1", now);
    await expect(authorizeCompanionMutation(db, credential.token, correlation, { enabled: true, now })).rejects.toMatchObject({ code: "REVOKED" });
  });

  it("is default-off at every credential entry point", async () => {
    const { db, actor } = fixture();
    await expect(issueCompanionCredential(db, actor, { installationId: "i", browserProfileId: "p", extensionInstanceId: "e" }, { enabled: false })).rejects.toBeInstanceOf(CompanionTrustError);
    await expect(authorizeCompanionMutation(db, "i.secret", { installationId: "i", userId: "u", browserProfileId: "p", caseId: "c", runId: "r" }, { enabled: false })).rejects.toMatchObject({ code: "DISABLED" });
  });
});
