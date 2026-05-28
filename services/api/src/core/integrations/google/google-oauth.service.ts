import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes
} from "node:crypto";
import type { PrismaClient } from "@prisma/client";
import type { CurrentUser } from "@sylembra/shared";
import { loadEnv, type ApiEnv } from "../../../config/env.js";
import { ImportError } from "../../imports/professionals-licenses-import.service.js";

const googleOauthAuthorizeUrl = "https://accounts.google.com/o/oauth2/v2/auth";
const googleOauthTokenUrl = "https://oauth2.googleapis.com/token";
const googleOauthRevokeUrl = "https://oauth2.googleapis.com/revoke";
const googleOauthScopes = [
  "https://www.googleapis.com/auth/spreadsheets",
  "https://www.googleapis.com/auth/drive.file"
] as const;

type Fetcher = typeof fetch;

interface AuthorizationTokenPayload {
  access_token?: string;
  refresh_token?: string;
  scope?: string;
  expires_in?: number;
  token_type?: string;
  error?: string;
  error_description?: string;
}

export interface GoogleConnectionStatus {
  oauthConfigured: boolean;
  connected: boolean;
  fallbackAvailable: boolean;
  preferredMode: "oauth" | "service-account" | "unavailable";
  connectedAt: string | null;
  lastUsedAt: string | null;
}

export interface GoogleAccessContext {
  mode: "oauth" | "service-account";
  accessToken: string;
  shouldCreateInFolder: boolean;
  shouldShareWithActor: boolean;
}

function normalizeEmail(value: string | null | undefined) {
  const text = value?.trim().toLowerCase() ?? "";
  if (!text) return null;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text) ? text : null;
}

function encodeBase64Url(value: Buffer | string) {
  return Buffer.from(value).toString("base64url");
}

function sha256(value: string) {
  return createHash("sha256").update(value).digest();
}

function hashState(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function encryptionKey(env: ApiEnv) {
  return createHash("sha256").update(env.googleTokenEncryptionKey || env.sessionSecret).digest();
}

function encryptSecret(value: string, env: ApiEnv) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(env), iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [encodeBase64Url(iv), encodeBase64Url(tag), encodeBase64Url(encrypted)].join(".");
}

function decryptSecret(value: string, env: ApiEnv) {
  const [ivEncoded, tagEncoded, payloadEncoded] = value.split(".");
  if (!ivEncoded || !tagEncoded || !payloadEncoded) {
    throw new ImportError("GOOGLE_SHEETS_CREDENTIALS_MISSING", "Stored Google token is unreadable.");
  }
  const decipher = createDecipheriv(
    "aes-256-gcm",
    encryptionKey(env),
    Buffer.from(ivEncoded, "base64url")
  );
  decipher.setAuthTag(Buffer.from(tagEncoded, "base64url"));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(payloadEncoded, "base64url")),
    decipher.final()
  ]);
  return decrypted.toString("utf8");
}

export function isGoogleOauthConfigured(env = loadEnv()) {
  return Boolean(env.googleClientId && env.googleClientSecret && env.googleRedirectUri);
}

export function isGoogleServiceAccountConfigured(env = loadEnv()) {
  return Boolean(
    (env.googleServiceAccountEmail && env.googlePrivateKey) || env.googleApplicationCredentials
  );
}

export async function getGoogleConnectionStatus(
  prisma: PrismaClient,
  actor: CurrentUser,
  env = loadEnv()
): Promise<GoogleConnectionStatus> {
  const oauthConfigured = isGoogleOauthConfigured(env);
  const fallbackAvailable = isGoogleServiceAccountConfigured(env);
  const connection = await prisma.googleConnection.findUnique({
    where: { userId: actor.id }
  });

  const connected = Boolean(connection && !connection.revokedAt);
  return {
    oauthConfigured,
    connected,
    fallbackAvailable,
    preferredMode: connected
      ? "oauth"
      : fallbackAvailable
        ? "service-account"
        : oauthConfigured
          ? "oauth"
          : "unavailable",
    connectedAt: connection?.connectedAt.toISOString() ?? null,
    lastUsedAt: connection?.lastUsedAt?.toISOString() ?? null
  };
}

export async function createGoogleOauthStartUrl(
  prisma: PrismaClient,
  actor: CurrentUser,
  env = loadEnv()
) {
  if (actor.role !== "ADMIN") throw new ImportError("FORBIDDEN");
  if (!isGoogleOauthConfigured(env)) {
    throw new ImportError("NOT_CONFIGURED", "Google OAuth is not configured for this environment.");
  }

  const state = encodeBase64Url(randomBytes(32));
  const codeVerifier = encodeBase64Url(randomBytes(48));
  const codeChallenge = encodeBase64Url(sha256(codeVerifier));

  await prisma.googleOauthState.create({
    data: {
      organizationId: actor.organizationId,
      userId: actor.id,
      provider: "google",
      stateHash: hashState(state),
      codeVerifier,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000)
    }
  });

  const url = new URL(googleOauthAuthorizeUrl);
  url.searchParams.set("client_id", env.googleClientId as string);
  url.searchParams.set("redirect_uri", env.googleRedirectUri as string);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", googleOauthScopes.join(" "));
  url.searchParams.set("access_type", "offline");
  url.searchParams.set("include_granted_scopes", "true");
  url.searchParams.set("prompt", "consent");
  url.searchParams.set("state", state);
  url.searchParams.set("code_challenge", codeChallenge);
  url.searchParams.set("code_challenge_method", "S256");

  return url.toString();
}

export async function handleGoogleOauthCallback(
  prisma: PrismaClient,
  input: { code?: string; state?: string; error?: string },
  env = loadEnv(),
  fetcher: Fetcher = fetch
) {
  if (!isGoogleOauthConfigured(env)) {
    throw new ImportError("NOT_CONFIGURED", "Google OAuth is not configured for this environment.");
  }
  if (input.error) {
    throw new ImportError("INVALID_INPUT", `Google authorization failed: ${input.error}`);
  }
  if (!input.code || !input.state) {
    throw new ImportError("INVALID_INPUT", "Google OAuth callback is missing code/state.");
  }

  const stateRecord = await prisma.googleOauthState.findUnique({
    where: { stateHash: hashState(input.state) }
  });
  if (!stateRecord || stateRecord.usedAt || stateRecord.expiresAt.getTime() < Date.now()) {
    throw new ImportError("INVALID_INPUT", "Google OAuth state is invalid or expired.");
  }

  const response = await fetcher(googleOauthTokenUrl, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code: input.code,
      client_id: env.googleClientId as string,
      client_secret: env.googleClientSecret as string,
      redirect_uri: env.googleRedirectUri as string,
      grant_type: "authorization_code",
      code_verifier: stateRecord.codeVerifier
    })
  });
  const payload = (await response.json()) as AuthorizationTokenPayload;
  if (!response.ok) {
    throw new ImportError(
      "INVALID_INPUT",
      payload.error_description || payload.error || "Google OAuth token exchange failed."
    );
  }

  const existing = await prisma.googleConnection.findUnique({
    where: { userId: stateRecord.userId }
  });
  const refreshToken = payload.refresh_token || (existing ? decryptSecret(existing.refreshTokenEncrypted, env) : null);
  if (!refreshToken) {
    throw new ImportError(
      "INVALID_INPUT",
      "Google OAuth did not return a refresh token. Reconnect with consent and try again."
    );
  }

  await prisma.$transaction(async (tx) => {
    await tx.googleConnection.upsert({
      where: { userId: stateRecord.userId },
      update: {
        organizationId: stateRecord.organizationId,
        provider: "google",
        refreshTokenEncrypted: encryptSecret(refreshToken, env),
        scopesJson: JSON.stringify((payload.scope || googleOauthScopes.join(" ")).split(/\s+/).filter(Boolean)),
        connectedAt: existing?.connectedAt ?? new Date(),
        lastUsedAt: null,
        revokedAt: null
      },
      create: {
        organizationId: stateRecord.organizationId,
        userId: stateRecord.userId,
        provider: "google",
        refreshTokenEncrypted: encryptSecret(refreshToken, env),
        scopesJson: JSON.stringify((payload.scope || googleOauthScopes.join(" ")).split(/\s+/).filter(Boolean))
      }
    });
    await tx.googleOauthState.update({
      where: { id: stateRecord.id },
      data: { usedAt: new Date() }
    });
    await tx.auditLog.create({
      data: {
        organizationId: stateRecord.organizationId,
        actorId: stateRecord.userId,
        action: "integrations.google.connect",
        entityType: "GoogleConnection",
        entityId: stateRecord.userId,
        metadataJson: JSON.stringify({
          scopes: (payload.scope || googleOauthScopes.join(" ")).split(/\s+/).filter(Boolean)
        })
      }
    });
  });

  return { userId: stateRecord.userId, organizationId: stateRecord.organizationId };
}

export async function disconnectGoogleOauthConnection(
  prisma: PrismaClient,
  actor: CurrentUser,
  env = loadEnv(),
  fetcher: Fetcher = fetch
) {
  if (actor.role !== "ADMIN") throw new ImportError("FORBIDDEN");

  const existing = await prisma.googleConnection.findUnique({ where: { userId: actor.id } });
  if (!existing) {
    return { disconnected: false };
  }

  const revokedRemotely = await revokeStoredGoogleRefreshToken(existing.refreshTokenEncrypted, env, fetcher);

  await prisma.$transaction(async (tx) => {
    await tx.googleConnection.delete({ where: { userId: actor.id } });
    await tx.auditLog.create({
      data: {
        organizationId: actor.organizationId,
        actorId: actor.id,
        action: "integrations.google.disconnect",
        entityType: "GoogleConnection",
        entityId: actor.id,
        metadataJson: JSON.stringify({ provider: "google", revokedRemotely })
      }
    });
  });

  return { disconnected: true };
}

async function revokeStoredGoogleRefreshToken(
  refreshTokenEncrypted: string,
  env: ApiEnv,
  fetcher: Fetcher
) {
  try {
    const response = await fetcher(googleOauthRevokeUrl, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ token: decryptSecret(refreshTokenEncrypted, env) })
    });
    if (!response.ok) {
      console.error("GOOGLE_OAUTH_REVOKE_ERROR", { httpStatus: response.status });
      return false;
    }
    return true;
  } catch (error) {
    console.error("GOOGLE_OAUTH_REVOKE_ERROR", {
      message: error instanceof Error ? error.message : "Unknown revoke failure"
    });
    return false;
  }
}

export async function resolveGoogleTemplateAccess(
  prisma: PrismaClient,
  actor: CurrentUser,
  env = loadEnv(),
  fetcher: Fetcher = fetch
): Promise<GoogleAccessContext> {
  if (isGoogleOauthConfigured(env)) {
    const connection = await prisma.googleConnection.findUnique({ where: { userId: actor.id } });
    if (connection && !connection.revokedAt) {
      const response = await fetcher(googleOauthTokenUrl, {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: env.googleClientId as string,
          client_secret: env.googleClientSecret as string,
          refresh_token: decryptSecret(connection.refreshTokenEncrypted, env),
          grant_type: "refresh_token"
        })
      });
      const payload = (await response.json()) as AuthorizationTokenPayload;
      if (!response.ok || !payload.access_token) {
        throw new ImportError(
          "GOOGLE_SHEETS_CREDENTIALS_MISSING",
          payload.error_description || payload.error || "Could not refresh Google OAuth access token."
        );
      }
      await prisma.googleConnection.update({
        where: { userId: actor.id },
        data: { lastUsedAt: new Date() }
      });
      return {
        mode: "oauth",
        accessToken: payload.access_token,
        shouldCreateInFolder: false,
        shouldShareWithActor: false
      };
    }
  }

  if (isGoogleServiceAccountConfigured(env)) {
    const { requestServiceAccountAccessToken } = await import("../../imports/google-sheets-template.service.js");
    const accessToken = await requestServiceAccountAccessToken(env, fetcher);
    return {
      mode: "service-account",
      accessToken,
      shouldCreateInFolder: Boolean(env.googleSheetsTemplateFolderId),
      shouldShareWithActor: true
    };
  }

  if (isGoogleOauthConfigured(env)) {
    throw new ImportError(
      "NOT_CONFIGURED",
      "Google is configured for user OAuth, but this user has not connected a Google account yet."
    );
  }

  throw new ImportError("NOT_CONFIGURED", "Google Sheets template is not configured for this environment.");
}
