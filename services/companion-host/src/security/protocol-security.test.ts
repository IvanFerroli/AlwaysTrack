import { describe, expect, it } from "vitest";
import { ProtocolSecurityGuard } from "./protocol-security.js";

const policy = { messageTtlMs: 1_000, maxFutureSkewMs: 100, messageRateLimit: 2, messageRateWindowMs: 1_000 };

describe("protocol security guard", () => {
  it("rejects non-loopback peers, replay, expiration, future messages and rate excess", () => {
    let now = 10_000;
    const guard = new ProtocolSecurityGuard(policy, () => now);
    expect(guard.validatePeer("10.0.0.2")).toBe("NON_LOOPBACK_PEER");
    expect(guard.validatePeer("::ffff:127.0.0.1")).toBe("OK");
    expect(guard.validateMessage("install", "a", new Date(now).toISOString())).toBe("OK");
    expect(guard.validateMessage("install", "a", new Date(now).toISOString())).toBe("REPLAYED_MESSAGE");
    expect(guard.validateMessage("install", "old", new Date(now - 1_001).toISOString())).toBe("EXPIRED_MESSAGE");
    expect(guard.validateMessage("install", "future", new Date(now + 101).toISOString())).toBe("FUTURE_MESSAGE");
    expect(guard.validateMessage("install", "b", new Date(now).toISOString())).toBe("OK");
    expect(guard.validateMessage("install", "c", new Date(now).toISOString())).toBe("MESSAGE_RATE_LIMITED");
    now += 1_001;
    expect(guard.validateMessage("install", "c", new Date(now).toISOString())).toBe("OK");
  });
});
