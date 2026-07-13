import type { EvidenceFact } from "@alwaystrack/shared";

export interface CompanionCorrelation {
  installationId: string;
  userId: string;
  browserProfileId: string;
  caseId: string;
  runId: string;
}

export interface CompanionCredential {
  credentialId: string;
  token: string;
  expiresAt: string;
}

export interface CompanionApiTransport {
  request(input: { method: "POST"; path: string; headers: Readonly<Record<string, string>>; body: unknown; signal?: AbortSignal }): Promise<{ status: number; body?: unknown }>;
}

export class CompanionApiError extends Error {
  constructor(public readonly status: number, public readonly code: string) { super(code); }
}

export class CompanionApiClient {
  constructor(
    private readonly basePath: string,
    private readonly credential: CompanionCredential,
    private readonly transport: CompanionApiTransport,
    private readonly now: () => number = Date.now
  ) {}

  async ingestFacts(correlation: CompanionCorrelation, facts: EvidenceFact[], signal?: AbortSignal): Promise<unknown> {
    if (this.now() >= Date.parse(this.credential.expiresAt)) throw new CompanionApiError(401, "COMPANION_CREDENTIAL_EXPIRED");
    if (!facts.length || facts.some((fact) => fact.caseId !== correlation.caseId || fact.connectorRunId !== correlation.runId)) {
      throw new CompanionApiError(400, "CORRELATION_MISMATCH");
    }
    const response = await this.transport.request({
      method: "POST",
      path: `${this.basePath}/v1/companion/cases/${encodeURIComponent(correlation.caseId)}/runs/${encodeURIComponent(correlation.runId)}/facts`,
      headers: { authorization: `Companion ${this.credential.token}`, "content-type": "application/json" },
      body: { ...correlation, credentialId: this.credential.credentialId, facts },
      signal
    });
    if (response.status < 200 || response.status >= 300) throw new CompanionApiError(response.status, "COMPANION_API_REJECTED");
    return response.body;
  }
}

export const hostProtocolLayerReady = true;
