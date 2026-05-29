import { describe, expect, it, vi } from "vitest";
import type { CurrentUser } from "@alwaystrack/shared";
import {
  createGoogleOauthStartUrl,
  disconnectGoogleOauthConnection,
  getGoogleConnectionStatus,
  handleGoogleOauthCallback,
  resolveGoogleTemplateAccess
} from "./google-oauth.service.js";

const admin: CurrentUser = {
  id: "admin-1",
  name: "Admin",
  email: "admin@example.com",
  role: "ADMIN",
  organizationId: "org-1",
  unitScopeIds: [],
  sectorScopeIds: []
};

function baseEnv() {
  return {
    databaseUrl: "file:./dev.db",
    sessionSecret: "secret",
    sessionCookieName: "alwaystrack_session",
    port: 3333,
    storageProvider: "local" as const,
    storageLocalDir: ".storage/private",
    documentMaxBytes: 1024,
    notificationProvider: "fake" as const,
    notificationJobLimit: 25,
    documentAiProvider: "fake" as const,
    documentAiModel: "fake",
    googleClientId: "client-id",
    googleClientSecret: "client-secret",
    googleRedirectUri: "http://localhost:3333/v1/integrations/google/oauth/callback",
    googleTokenEncryptionKey: "token-secret"
  };
}

describe("google oauth service", () => {
  it("creates an authorization url and persists short-lived state", async () => {
    const prisma = {
      googleOauthState: { create: vi.fn().mockResolvedValue({ id: "state-1" }) }
    };

    const url = await createGoogleOauthStartUrl(prisma as never, admin, baseEnv());

    expect(prisma.googleOauthState.create).toHaveBeenCalledOnce();
    expect(url).toContain("accounts.google.com");
    expect(url).toContain("code_challenge");
    expect(url).toContain("access_type=offline");
  });

  it("stores a refresh token on callback", async () => {
    const prisma = {
      googleOauthState: {
        findUnique: vi.fn().mockResolvedValue({
          id: "state-1",
          userId: admin.id,
          organizationId: admin.organizationId,
          codeVerifier: "verifier-123",
          usedAt: null,
          expiresAt: new Date(Date.now() + 60_000)
        }),
        update: vi.fn().mockResolvedValue({})
      },
      googleConnection: {
        findUnique: vi.fn().mockResolvedValue(null),
        upsert: vi.fn().mockResolvedValue({})
      },
      auditLog: {
        create: vi.fn().mockResolvedValue({})
      },
      $transaction: vi.fn()
    };
    prisma.$transaction.mockImplementation(async (fn: (tx: typeof prisma) => Promise<unknown>) => fn(prisma));

    const fetcher = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          access_token: "access-123",
          refresh_token: "refresh-123",
          scope: "https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.file"
        }),
        { status: 200, headers: { "content-type": "application/json" } }
      )
    );

    await handleGoogleOauthCallback(
      prisma as never,
      { code: "code-123", state: "raw-state-123" },
      baseEnv(),
      fetcher as never
    );

    expect(prisma.googleConnection.upsert).toHaveBeenCalledOnce();
    expect(prisma.googleOauthState.update).toHaveBeenCalledOnce();
  });

  it("prefers user oauth when a connection exists", async () => {
    const prisma = {
      googleConnection: {
        findUnique: vi.fn().mockResolvedValue({
          userId: admin.id,
          refreshTokenEncrypted: "1Wfo1Yz7TkDW5PNw.H0B9S5h6ABiEwDa3Qcuu3Q.XA0yzd7VCq1qI9_l",
          revokedAt: null
        }),
        update: vi.fn().mockResolvedValue({})
      }
    };

    const env = baseEnv();
    const start = await createGoogleOauthStartUrl({ googleOauthState: { create: vi.fn().mockResolvedValue({}) } } as never, admin, env);
    expect(start).toContain("state=");

    const encrypted = (await (async () => {
      const callbackPrisma = {
        googleOauthState: {
          findUnique: vi.fn().mockResolvedValue({
            id: "state-1",
            userId: admin.id,
            organizationId: admin.organizationId,
            codeVerifier: "verifier-123",
            usedAt: null,
            expiresAt: new Date(Date.now() + 60_000)
          }),
          update: vi.fn().mockResolvedValue({})
        },
        googleConnection: {
          findUnique: vi.fn().mockResolvedValue(null),
          upsert: vi.fn().mockResolvedValue({})
        },
        auditLog: { create: vi.fn().mockResolvedValue({}) },
        $transaction: vi.fn()
      };
      callbackPrisma.$transaction.mockImplementation(
        async (fn: (tx: typeof callbackPrisma) => Promise<unknown>) => fn(callbackPrisma)
      );
      await handleGoogleOauthCallback(
        callbackPrisma as never,
        { code: "code-123", state: "raw-state-123" },
        env,
        vi.fn().mockResolvedValue(
          new Response(JSON.stringify({ access_token: "access", refresh_token: "refresh-123" }), {
            status: 200,
            headers: { "content-type": "application/json" }
          })
        ) as never
      );
      return String(callbackPrisma.googleConnection.upsert.mock.calls[0]?.[0]?.create?.refreshTokenEncrypted ?? "");
    })());

    prisma.googleConnection.findUnique.mockResolvedValue({
      userId: admin.id,
      refreshTokenEncrypted: encrypted,
      revokedAt: null
    });

    const access = await resolveGoogleTemplateAccess(
      prisma as never,
      admin,
      env,
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ access_token: "oauth-access-123" }), {
          status: 200,
          headers: { "content-type": "application/json" }
        })
      ) as never
    );

    expect(access).toMatchObject({
      mode: "oauth",
      accessToken: "oauth-access-123",
      shouldCreateInFolder: false,
      shouldShareWithActor: false
    });
  });

  it("reports disconnected when no connection exists", async () => {
    const status = await getGoogleConnectionStatus(
      { googleConnection: { findUnique: vi.fn().mockResolvedValue(null) } } as never,
      admin,
      baseEnv()
    );

    expect(status).toMatchObject({
      oauthConfigured: true,
      connected: false,
      preferredMode: "oauth"
    });
  });

  it("revokes the stored refresh token when disconnecting", async () => {
    const env = baseEnv();
    const callbackPrisma = {
      googleOauthState: {
        findUnique: vi.fn().mockResolvedValue({
          id: "state-1",
          userId: admin.id,
          organizationId: admin.organizationId,
          codeVerifier: "verifier-123",
          usedAt: null,
          expiresAt: new Date(Date.now() + 60_000)
        }),
        update: vi.fn().mockResolvedValue({})
      },
      googleConnection: {
        findUnique: vi.fn().mockResolvedValue(null),
        upsert: vi.fn().mockResolvedValue({})
      },
      auditLog: { create: vi.fn().mockResolvedValue({}) },
      $transaction: vi.fn()
    };
    callbackPrisma.$transaction.mockImplementation(
      async (fn: (tx: typeof callbackPrisma) => Promise<unknown>) => fn(callbackPrisma)
    );

    await handleGoogleOauthCallback(
      callbackPrisma as never,
      { code: "code-123", state: "raw-state-123" },
      env,
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ access_token: "access", refresh_token: "refresh-123" }), {
          status: 200,
          headers: { "content-type": "application/json" }
        })
      ) as never
    );

    const refreshTokenEncrypted = String(
      callbackPrisma.googleConnection.upsert.mock.calls[0]?.[0]?.create?.refreshTokenEncrypted ?? ""
    );
    const prisma = {
      googleConnection: {
        findUnique: vi.fn().mockResolvedValue({ userId: admin.id, refreshTokenEncrypted }),
        delete: vi.fn().mockResolvedValue({})
      },
      auditLog: { create: vi.fn().mockResolvedValue({}) },
      $transaction: vi.fn()
    };
    prisma.$transaction.mockImplementation(async (fn: (tx: typeof prisma) => Promise<unknown>) => fn(prisma));
    const fetcher = vi.fn().mockResolvedValue(new Response("", { status: 200 }));

    await expect(disconnectGoogleOauthConnection(prisma as never, admin, env, fetcher as never)).resolves.toEqual({
      disconnected: true
    });

    expect(fetcher).toHaveBeenCalledOnce();
    expect(String(fetcher.mock.calls[0]?.[0])).toBe("https://oauth2.googleapis.com/revoke");
    expect(String(fetcher.mock.calls[0]?.[1]?.body)).toContain("refresh-123");
    expect(prisma.googleConnection.delete).toHaveBeenCalledOnce();
    expect(prisma.auditLog.create).toHaveBeenCalledOnce();
    expect(String(prisma.auditLog.create.mock.calls[0]?.[0]?.data?.metadataJson)).toContain('"revokedRemotely":true');
  });

  it("keeps local disconnect resilient when Google revoke fails", async () => {
    const prisma = {
      googleConnection: {
        findUnique: vi.fn().mockResolvedValue({
          userId: admin.id,
          refreshTokenEncrypted: "invalid-token-format"
        }),
        delete: vi.fn().mockResolvedValue({})
      },
      auditLog: { create: vi.fn().mockResolvedValue({}) },
      $transaction: vi.fn()
    };
    prisma.$transaction.mockImplementation(async (fn: (tx: typeof prisma) => Promise<unknown>) => fn(prisma));
    const fetcher = vi.fn();

    await expect(disconnectGoogleOauthConnection(prisma as never, admin, baseEnv(), fetcher as never)).resolves.toEqual({
      disconnected: true
    });

    expect(fetcher).not.toHaveBeenCalled();
    expect(prisma.googleConnection.delete).toHaveBeenCalledOnce();
    expect(String(prisma.auditLog.create.mock.calls[0]?.[0]?.data?.metadataJson)).toContain('"revokedRemotely":false');
  });
});
