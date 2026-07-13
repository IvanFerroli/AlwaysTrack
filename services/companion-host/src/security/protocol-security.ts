export interface ProtocolSecurityPolicy {
  messageTtlMs: number;
  maxFutureSkewMs: number;
  messageRateLimit: number;
  messageRateWindowMs: number;
}

export class ProtocolSecurityGuard {
  readonly #seen = new Map<string, number>();
  readonly #messages = new Map<string, number[]>();

  constructor(private readonly policy: ProtocolSecurityPolicy, private readonly now: () => number = Date.now) {}

  validatePeer(remoteAddress: string | undefined): "OK" | "NON_LOOPBACK_PEER" {
    return remoteAddress === "127.0.0.1" || remoteAddress === "::1" || remoteAddress === "::ffff:127.0.0.1" ? "OK" : "NON_LOOPBACK_PEER";
  }

  validateMessage(identity: string, messageId: string, timestamp: string): "OK" | "INVALID_TIMESTAMP" | "EXPIRED_MESSAGE" | "FUTURE_MESSAGE" | "REPLAYED_MESSAGE" | "MESSAGE_RATE_LIMITED" {
    const current = this.now();
    const sentAt = Date.parse(timestamp);
    if (!Number.isFinite(sentAt)) return "INVALID_TIMESTAMP";
    if (sentAt <= current - this.policy.messageTtlMs) return "EXPIRED_MESSAGE";
    if (sentAt > current + this.policy.maxFutureSkewMs) return "FUTURE_MESSAGE";
    for (const [id, seenAt] of this.#seen) if (seenAt <= current - this.policy.messageTtlMs) this.#seen.delete(id);
    if (this.#seen.has(messageId)) return "REPLAYED_MESSAGE";
    const recent = (this.#messages.get(identity) ?? []).filter((time) => time > current - this.policy.messageRateWindowMs);
    if (recent.length >= this.policy.messageRateLimit) return "MESSAGE_RATE_LIMITED";
    recent.push(current);
    this.#messages.set(identity, recent);
    this.#seen.set(messageId, current);
    return "OK";
  }
}
