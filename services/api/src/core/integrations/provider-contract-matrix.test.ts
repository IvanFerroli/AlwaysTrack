import { afterEach, describe, expect, it, vi } from "vitest";
import type { CurrentUser } from "@alwaystrack/shared";
import {
  FakeDocumentAiProvider,
  GeminiDocumentAiProvider,
  OpenAiDocumentAiProvider,
  getDocumentAiProvider,
  type DocumentAiProvider
} from "../document-ai/provider.js";
import { FakeNotificationProvider, MetaWhatsAppProvider, getNotificationProvider } from "../notifications/provider.js";
import { redactExternalData } from "./external-http.js";
import {
  externalProviderContractMatrix,
  externalProviderScenarios,
  validateExternalProviderContractMatrix
} from "./provider-contract-matrix.js";
import { createGoogleOauthStartUrl, handleGoogleOauthCallback } from "./google/google-oauth.service.js";

const admin: CurrentUser = {
  id: "admin-contract",
  name: "Contract Admin",
  email: "contract@example.test",
  role: "ADMIN",
  organizationId: "org-contract",
  unitScopeIds: [],
  sectorScopeIds: []
};

function googleEnv(configured = true) {
  return {
    appName: "AlwaysTrack",
    databaseUrl: "file:./contract.db",
    sessionSecret: "session-secret",
    sessionCookieName: "contract_session",
    port: 3333,
    storageProvider: "local" as const,
    storageLocalDir: ".storage/contract",
    documentMaxBytes: 1024,
    notificationProvider: "fake" as const,
    notificationJobLimit: 25,
    documentAiProvider: "fake" as const,
    documentAiModel: "fake",
    googleClientId: configured ? "google-client" : undefined,
    googleClientSecret: configured ? "google-secret" : undefined,
    googleRedirectUri: configured ? "http://localhost:3333/google/callback" : undefined,
    googleTokenEncryptionKey: "encryption-secret"
  };
}

function googleCallbackPrisma() {
  return {
    googleOauthState: {
      findUnique: vi.fn().mockResolvedValue({
        id: "state-contract",
        userId: admin.id,
        organizationId: admin.organizationId,
        codeVerifier: "verifier-contract",
        usedAt: null,
        expiresAt: new Date(Date.now() + 60_000)
      })
    },
    googleConnection: { findUnique: vi.fn() }
  };
}

function diagnostic(error: unknown) {
  const source = error instanceof Error
    ? { name: error.name, message: error.message, cause: error.cause }
    : { error };
  return JSON.stringify(redactExternalData(source));
}

const emptyExtraction = {
  documentKind: null,
  rawText: null,
  fields: {
    professionalName: { value: null, confidence: null, evidence: null },
    cpf: { value: null, confidence: null, evidence: null },
    licenseTypeName: { value: null, confidence: null, evidence: null },
    licenseNumber: { value: null, confidence: null, evidence: null },
    issuer: { value: null, confidence: null, evidence: null },
    uf: { value: null, confidence: null, evidence: null },
    issuedAt: { value: null, confidence: null, evidence: null },
    expiresAt: { value: null, confidence: null, evidence: null }
  },
  warnings: []
};

function aiResponse(provider: "openai" | "gemini", status = 200, payload: unknown = emptyExtraction) {
  const body = provider === "openai"
    ? { output_text: JSON.stringify(payload) }
    : { candidates: [{ content: { parts: [{ text: JSON.stringify(payload) }] } }] };
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" }
  });
}

async function analyze(provider: DocumentAiProvider) {
  return provider.analyze({ body: Buffer.from("synthetic-document"), mimeType: "application/pdf", fileName: "synthetic.pdf" });
}

describe("external provider contract matrix", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("is complete, uniquely owned and cannot promote local evidence", () => {
    expect(validateExternalProviderContractMatrix()).toEqual({ providers: 6, evidenceLevel: "local" });
    expect(externalProviderContractMatrix.map(({ id }) => id)).toEqual([
      "google",
      "meta-whatsapp",
      "openai",
      "gemini",
      "fake-notification",
      "fake-document-ai"
    ]);
    for (const provider of externalProviderContractMatrix) {
      expect(provider.owner).not.toBe("");
      expect(provider.localSuites.length).toBeGreaterThan(0);
      expect(provider.sandbox.status).toBe("pending");
      expect(provider.live.status).toBe("pending");
      expect(provider.sandbox.blocker).not.toBe("");
      expect(provider.live.blocker).not.toBe("");
    }
  });

  it("requires the full degradation contract for every remote provider", () => {
    for (const provider of externalProviderContractMatrix.filter(({ timeoutMs }) => timeoutMs !== null)) {
      expect(provider.requiredOfflineScenarios).toEqual(externalProviderScenarios);
    }
  });

  describe("Google OAuth", () => {
    it("fails closed without credentials and never starts remote IO", async () => {
      const prisma = { googleOauthState: { create: vi.fn() } };
      await expect(createGoogleOauthStartUrl(prisma as never, admin, googleEnv(false))).rejects.toMatchObject({
        code: "NOT_CONFIGURED"
      });
      expect(prisma.googleOauthState.create).not.toHaveBeenCalled();
    });

    it.each([
      ["rate-limit", new Response(JSON.stringify({ error: "rate_limit", error_description: "quota exhausted" }), { status: 429 })],
      ["invalid-response", new Response("not-json", { status: 200 })]
    ])("fails closed on %s responses without persisting a connection", async (_scenario, response) => {
      const prisma = googleCallbackPrisma();
      const fetcher = vi.fn().mockResolvedValue(response);
      await expect(
        handleGoogleOauthCallback(prisma as never, { code: "code", state: "state" }, googleEnv(), fetcher as never)
      ).rejects.toBeDefined();
      expect(prisma.googleConnection.findUnique).not.toHaveBeenCalled();
    });

    it.each([
      ["timeout", new DOMException("request aborted", "TimeoutError")],
      ["unavailable", new Error("ECONNRESET authorization: Bearer google-live-token")]
    ])("sanitizes %s diagnostics", async (_scenario, failure) => {
      const fetcher = vi.fn().mockRejectedValue(failure);
      let caught: unknown;
      try {
        await handleGoogleOauthCallback(
          googleCallbackPrisma() as never,
          { code: "code", state: "state" },
          googleEnv(),
          fetcher as never
        );
      } catch (error) {
        caught = error;
      }
      const sanitized = diagnostic(caught);
      expect(sanitized).not.toContain("google-live-token");
      expect(sanitized).toContain(_scenario === "timeout" ? "timed out after 15000ms" : "ECONNRESET");
    });
  });

  describe("Meta WhatsApp", () => {
    const input = { to: "+55 83 99999-9999", templateName: "contract", language: "pt_BR", payload: {} };

    it("degrades to the fake provider when Meta credentials are missing", () => {
      vi.stubEnv("NOTIFICATION_PROVIDER", "meta");
      vi.stubEnv("META_WHATSAPP_TOKEN", "");
      vi.stubEnv("META_WHATSAPP_PHONE_NUMBER_ID", "");
      expect(getNotificationProvider()).toBeInstanceOf(FakeNotificationProvider);
    });

    it("normalizes a faithful accepted response", async () => {
      const fetcher = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ messaging_product: "whatsapp", messages: [{ id: "wamid.contract" }] }), { status: 200 })
      );
      await expect(new MetaWhatsAppProvider("meta-token", "phone-id", fetcher as never).sendWhatsAppTemplate(input))
        .resolves.toMatchObject({ provider: "meta-whatsapp", providerMessageId: "wamid.contract" });
    });

    it.each([
      ["rate-limit", new Response(JSON.stringify({ error: { code: 4, message: "rate limited", access_token: "meta-live-token" } }), { status: 429 })],
      ["invalid-response", new Response("not-json", { status: 502 })]
    ])("normalizes and redacts %s responses", async (_scenario, response) => {
      let caught: unknown;
      try {
        await new MetaWhatsAppProvider("meta-token", "phone-id", vi.fn().mockResolvedValue(response) as never)
          .sendWhatsAppTemplate(input);
      } catch (error) {
        caught = error;
      }
      const sanitized = diagnostic(caught);
      expect(sanitized).not.toContain("meta-live-token");
      expect(sanitized).toContain("META_WHATSAPP_SEND_FAILED");
    });

    it.each([
      ["timeout", new DOMException("request aborted", "TimeoutError")],
      ["unavailable", new Error("ECONNRESET cookie=session-live")]
    ])("fails closed and sanitizes %s diagnostics", async (_scenario, failure) => {
      let caught: unknown;
      try {
        await new MetaWhatsAppProvider("meta-token", "phone-id", vi.fn().mockRejectedValue(failure) as never)
          .sendWhatsAppTemplate(input);
      } catch (error) {
        caught = error;
      }
      const sanitized = diagnostic(caught);
      expect(sanitized).not.toContain("session-live");
      expect(sanitized).toContain(_scenario === "timeout" ? "timed out after 15000ms" : "ECONNRESET");
    });
  });

  describe.each([
    ["openai", () => new OpenAiDocumentAiProvider("openai-local-key", "contract-model")],
    ["gemini", () => new GeminiDocumentAiProvider("gemini-local-key", "contract-model")]
  ] as const)("%s Document AI", (providerId, createProvider) => {
    it("degrades to the fake provider when credentials are missing", () => {
      vi.stubEnv("DOCUMENT_AI_PROVIDER", providerId);
      vi.stubEnv(providerId === "openai" ? "OPENAI_API_KEY" : "GEMINI_API_KEY", "");
      expect(getDocumentAiProvider()).toBeInstanceOf(FakeDocumentAiProvider);
    });
    it("normalizes a faithful structured response", async () => {
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue(aiResponse(providerId)));
      await expect(analyze(createProvider())).resolves.toEqual(emptyExtraction);
    });

    it.each([
      ["rate-limit", new Response(JSON.stringify({ error: { message: "rate limited", api_key: "provider-live-key" } }), { status: 429 })],
      ["invalid-response", new Response("not-json", { status: 200 })]
    ])("fails closed and sanitizes %s responses", async (_scenario, response) => {
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response));
      let caught: unknown;
      try {
        await analyze(createProvider());
      } catch (error) {
        caught = error;
      }
      const sanitized = diagnostic(caught);
      expect(sanitized).not.toContain("provider-live-key");
      expect(sanitized).toMatch(/rate limited|EMPTY_AI_RESPONSE|Cannot read properties of null/);
    });

    it.each([
      ["timeout", new DOMException("request aborted", "TimeoutError")],
      ["unavailable", new Error("ECONNRESET authorization: Bearer provider-live-token")]
    ])("propagates and sanitizes %s failures", async (_scenario, failure) => {
      vi.stubGlobal("fetch", vi.fn().mockRejectedValue(failure));
      let caught: unknown;
      try {
        await analyze(createProvider());
      } catch (error) {
        caught = error;
      }
      const sanitized = diagnostic(caught);
      expect(sanitized).not.toContain("provider-live-token");
      expect(sanitized).toContain(_scenario === "timeout" ? "request aborted" : "ECONNRESET");
    });

    it("attaches the declared timeout signal without issuing network IO", async () => {
      const fetcher = vi.fn().mockResolvedValue(aiResponse(providerId));
      vi.stubGlobal("fetch", fetcher);
      await analyze(createProvider());
      expect(fetcher).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ signal: expect.any(AbortSignal) }));
      expect(externalProviderContractMatrix.find(({ id }) => id === providerId)?.timeoutMs).toBe(30_000);
    });
  });

  it("keeps fake providers deterministic, explicit and network-free", async () => {
    const fetcher = vi.fn();
    vi.stubGlobal("fetch", fetcher);
    const notification = new FakeNotificationProvider();
    const notificationInput = { to: "+5500000000000", templateName: "fake", language: "pt_BR", payload: { synthetic: true } };
    const first = await notification.sendWhatsAppTemplate(notificationInput);
    const second = await notification.sendWhatsAppTemplate(notificationInput);
    const document = await new FakeDocumentAiProvider().analyze();

    expect(first.providerMessageId).toBe(second.providerMessageId);
    expect(document.warnings).toEqual([expect.stringContaining("nao configurado")]);
    expect(fetcher).not.toHaveBeenCalled();
  });
});
