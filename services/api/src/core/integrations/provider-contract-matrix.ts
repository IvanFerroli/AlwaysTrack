export const externalProviderEvidenceLevels = ["fake", "local", "production-like", "live"] as const;
export type ExternalProviderEvidenceLevel = (typeof externalProviderEvidenceLevels)[number];

export const externalProviderScenarios = [
  "success",
  "credentials-missing",
  "timeout",
  "rate-limit",
  "invalid-response",
  "unavailable",
  "redaction"
] as const;
export type ExternalProviderScenario = (typeof externalProviderScenarios)[number];

export interface ExternalProviderContract {
  id: "google" | "meta-whatsapp" | "openai" | "gemini" | "fake-notification" | "fake-document-ai";
  owner: string;
  contract: string;
  timeoutMs: number | null;
  localSuites: readonly string[];
  requiredOfflineScenarios: readonly ExternalProviderScenario[];
  sandbox: { status: "pending"; blocker: string };
  live: { status: "pending"; blocker: string };
}

const remoteScenarios = externalProviderScenarios;
const fakeScenarios = ["success", "unavailable", "redaction"] as const;

export const externalProviderContractMatrix: readonly ExternalProviderContract[] = [
  {
    id: "google",
    owner: "API / Integrations",
    contract: "OAuth 2.0 token lifecycle and Google Sheets/Drive access",
    timeoutMs: 15_000,
    localSuites: [
      "src/core/integrations/provider-contract-matrix.test.ts",
      "src/core/integrations/google/google-oauth.service.test.ts",
      "src/core/imports/google-sheets-template.service.test.ts"
    ],
    requiredOfflineScenarios: remoteScenarios,
    sandbox: { status: "pending", blocker: "Authorized Google test project and credentials are unavailable." },
    live: { status: "pending", blocker: "Production authorization and redacted live evidence are unavailable." }
  },
  {
    id: "meta-whatsapp",
    owner: "API / Notifications",
    contract: "WhatsApp Cloud API template send and signed webhook",
    timeoutMs: 15_000,
    localSuites: [
      "src/core/integrations/provider-contract-matrix.test.ts",
      "src/core/notifications/provider.test.ts"
    ],
    requiredOfflineScenarios: remoteScenarios,
    sandbox: { status: "pending", blocker: "Authorized Meta test number and credentials are unavailable." },
    live: { status: "pending", blocker: "Production authorization and redacted live evidence are unavailable." }
  },
  {
    id: "openai",
    owner: "API / Document AI",
    contract: "Responses API structured document extraction",
    timeoutMs: 30_000,
    localSuites: [
      "src/core/integrations/provider-contract-matrix.test.ts",
      "src/core/document-ai/provider.test.ts"
    ],
    requiredOfflineScenarios: remoteScenarios,
    sandbox: { status: "pending", blocker: "Authorized provider project and budget are unavailable." },
    live: { status: "pending", blocker: "Production authorization and redacted live evidence are unavailable." }
  },
  {
    id: "gemini",
    owner: "API / Document AI",
    contract: "Gemini generateContent structured document extraction",
    timeoutMs: 30_000,
    localSuites: [
      "src/core/integrations/provider-contract-matrix.test.ts",
      "src/core/document-ai/provider.test.ts"
    ],
    requiredOfflineScenarios: remoteScenarios,
    sandbox: { status: "pending", blocker: "Authorized provider project and quota are unavailable." },
    live: { status: "pending", blocker: "Production authorization and redacted live evidence are unavailable." }
  },
  {
    id: "fake-notification",
    owner: "API / Notifications",
    contract: "Deterministic offline WhatsApp send result",
    timeoutMs: null,
    localSuites: [
      "src/core/integrations/provider-contract-matrix.test.ts",
      "src/core/notifications/provider.test.ts"
    ],
    requiredOfflineScenarios: fakeScenarios,
    sandbox: { status: "pending", blocker: "Not applicable until a remote fake environment is defined." },
    live: { status: "pending", blocker: "Fake providers must never be promoted as live evidence." }
  },
  {
    id: "fake-document-ai",
    owner: "API / Document AI",
    contract: "Explicit no-provider document extraction degradation",
    timeoutMs: null,
    localSuites: [
      "src/core/integrations/provider-contract-matrix.test.ts",
      "src/core/document-ai/document-ai.service.test.ts"
    ],
    requiredOfflineScenarios: fakeScenarios,
    sandbox: { status: "pending", blocker: "Not applicable until a remote fake environment is defined." },
    live: { status: "pending", blocker: "Fake providers must never be promoted as live evidence." }
  }
] as const;

export function validateExternalProviderContractMatrix(matrix = externalProviderContractMatrix) {
  const ids = new Set<string>();
  for (const provider of matrix) {
    if (ids.has(provider.id)) throw new Error(`Duplicate external provider contract: ${provider.id}`);
    ids.add(provider.id);
    if (!provider.owner.trim() || !provider.contract.trim() || provider.localSuites.length === 0) {
      throw new Error(`External provider contract ${provider.id} is missing owner or contract.`);
    }
    if (provider.sandbox.status !== "pending" || provider.live.status !== "pending") {
      throw new Error(`External provider contract ${provider.id} cannot infer sandbox/live completion from local evidence.`);
    }
    if (provider.requiredOfflineScenarios.length === 0) {
      throw new Error(`External provider contract ${provider.id} has no mandatory offline scenarios.`);
    }
  }
  return { providers: ids.size, evidenceLevel: "local" as const };
}
