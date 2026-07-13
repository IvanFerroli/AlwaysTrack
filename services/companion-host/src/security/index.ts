import { randomBytes, randomUUID } from "node:crypto";

export * from "./action-firewall.js";
export * from "./protocol-security.js";

export interface PairingIdentity {
  installationId: string;
  browserProfileId: string;
  userId: string;
}

export interface PairingGrant {
  token: string;
  expiresAt: string;
}

export interface ConsumedPairingGrant extends PairingIdentity {
  sessionId: string;
}

export interface PairingAuthority {
  issue(identity?: Partial<PairingIdentity>, ttlMs?: number): PairingGrant;
  consume(token: string): ConsumedPairingGrant | undefined;
}

interface StoredGrant extends ConsumedPairingGrant {
  expiresAtMs: number;
}

export class InMemoryPairingAuthority implements PairingAuthority {
  readonly #grants = new Map<string, StoredGrant>();

  constructor(private readonly ttlMs: number, private readonly now: () => number = Date.now) {}

  issue(identity: Partial<PairingIdentity> = {}, ttlMs = this.ttlMs): PairingGrant {
    const token = randomBytes(32).toString("base64url");
    const expiresAtMs = this.now() + ttlMs;
    this.#grants.set(token, {
      installationId: identity.installationId ?? randomUUID(),
      browserProfileId: identity.browserProfileId ?? randomUUID(),
      userId: identity.userId ?? "local-user",
      sessionId: randomUUID(),
      expiresAtMs
    });
    return { token, expiresAt: new Date(expiresAtMs).toISOString() };
  }

  consume(token: string): ConsumedPairingGrant | undefined {
    const grant = this.#grants.get(token);
    this.#grants.delete(token);
    if (!grant || grant.expiresAtMs <= this.now()) return undefined;
    const { expiresAtMs: _expiresAtMs, ...consumed } = grant;
    return consumed;
  }
}
