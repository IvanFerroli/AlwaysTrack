import { describe, expect, it } from "vitest";
import { InMemoryPairingAuthority } from "./index.js";

describe("InMemoryPairingAuthority", () => {
  it("issues strong opaque single-use tokens", () => {
    const authority = new InMemoryPairingAuthority(1_000);
    const grant = authority.issue({ installationId: "install-1" });

    expect(grant.token).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(authority.consume(grant.token)?.installationId).toBe("install-1");
    expect(authority.consume(grant.token)).toBeUndefined();
  });

  it("consumes and rejects an expired token", () => {
    let now = 1_000;
    const authority = new InMemoryPairingAuthority(50, () => now);
    const grant = authority.issue();
    now = 1_050;
    expect(authority.consume(grant.token)).toBeUndefined();
    expect(authority.consume(grant.token)).toBeUndefined();
  });
});
