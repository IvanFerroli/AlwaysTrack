import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import type { PrismaClient } from "@prisma/client";
import type { CurrentUser } from "@alwaystrack/shared";
import { assertCredentialHash } from "../persistence.js";

const scrypt = promisify(scryptCallback);
const SCOPE = "CASE_FLOW_COMPANION" as const;

export class CompanionTrustError extends Error {
  constructor(public readonly code: "DISABLED" | "INVALID_CREDENTIAL" | "REVOKED" | "CORRELATION_MISMATCH" | "NOT_FOUND") { super(code); }
}

export interface CompanionMutationCorrelation {
  installationId: string; userId: string; browserProfileId: string; caseId: string; runId: string;
}

async function hashSecret(secret: string, salt = randomBytes(16).toString("base64url")): Promise<string> {
  const digest = await scrypt(secret, salt, 32) as Buffer;
  return assertCredentialHash(`scrypt$${salt}_${digest.toString("base64url")}`);
}

async function matches(secret: string, encoded: string): Promise<boolean> {
  const value = encoded.match(/^scrypt\$([A-Za-z0-9_-]{22})_([A-Za-z0-9_-]+)$/);
  if (!value) return false;
  const actual = await scrypt(secret, value[1]!, 32) as Buffer; const expected = Buffer.from(value[2]!, "base64url");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export async function issueCompanionCredential(
  db: PrismaClient, actor: CurrentUser,
  identity: { installationId: string; browserProfileId: string; extensionInstanceId: string },
  options: { enabled: boolean; now?: () => Date; ttlMs?: number }
) {
  if (!options.enabled) throw new CompanionTrustError("DISABLED");
  const now = (options.now ?? (() => new Date()))(); const expiresAt = new Date(now.getTime() + (options.ttlMs ?? 86_400_000));
  const secret = randomBytes(32).toString("base64url"); const credentialHash = await hashSecret(secret);
  const existing = await db.companionInstallation.findUnique({ where: { id: identity.installationId } });
  if (existing && (existing.organizationId !== actor.organizationId || existing.userId !== actor.id)) throw new CompanionTrustError("CORRELATION_MISMATCH");
  const installation = await db.companionInstallation.upsert({
    where: { id: identity.installationId },
    create: { id: identity.installationId, organizationId: actor.organizationId, userId: actor.id, browserProfileId: identity.browserProfileId, extensionInstanceId: identity.extensionInstanceId, credentialHash, credentialExpiresAt: expiresAt, pairedAt: now, status: "ACTIVE" },
    update: { userId: actor.id, browserProfileId: identity.browserProfileId, extensionInstanceId: identity.extensionInstanceId, credentialHash, credentialExpiresAt: expiresAt, pairedAt: now, revokedAt: null, status: "ACTIVE" }
  });
  return { installationId: installation.id, credentialId: installation.id, token: `${installation.id}.${secret}`, scope: SCOPE, expiresAt: expiresAt.toISOString() };
}

export async function revokeCompanionCredential(db: PrismaClient, actor: CurrentUser, installationId: string, now: () => Date = () => new Date()) {
  const installation = await db.companionInstallation.findFirst({ where: { id: installationId, organizationId: actor.organizationId, userId: actor.id } });
  if (!installation) throw new CompanionTrustError("NOT_FOUND");
  return db.companionInstallation.update({ where: { id: installation.id }, data: { status: "REVOKED", revokedAt: now() } });
}

export async function authorizeCompanionMutation(db: PrismaClient, token: string, correlation: CompanionMutationCorrelation, options: { enabled: boolean; now?: () => Date }) {
  if (!options.enabled) throw new CompanionTrustError("DISABLED");
  const separator = token.indexOf("."); if (separator <= 0) throw new CompanionTrustError("INVALID_CREDENTIAL");
  const installationId = token.slice(0, separator); const secret = token.slice(separator + 1);
  const installation = await db.companionInstallation.findUnique({ where: { id: installationId } });
  if (!installation || !(await matches(secret, installation.credentialHash))) throw new CompanionTrustError("INVALID_CREDENTIAL");
  if (installation.status !== "ACTIVE" || installation.revokedAt) throw new CompanionTrustError("REVOKED");
  const now = (options.now ?? (() => new Date()))(); if (installation.credentialExpiresAt && installation.credentialExpiresAt <= now) throw new CompanionTrustError("INVALID_CREDENTIAL");
  if (installation.id !== correlation.installationId || installation.userId !== correlation.userId || installation.browserProfileId !== correlation.browserProfileId) throw new CompanionTrustError("CORRELATION_MISMATCH");
  const run = await db.connectorRun.findFirst({ where: { id: correlation.runId, caseId: correlation.caseId, installationId: installation.id, userId: installation.userId, browserProfileId: installation.browserProfileId, organizationId: installation.organizationId } });
  if (!run) throw new CompanionTrustError("CORRELATION_MISMATCH");
  await db.companionInstallation.update({ where: { id: installation.id }, data: { lastSeenAt: now } });
  return { actor: { id: installation.userId, organizationId: installation.organizationId }, installation, run };
}
