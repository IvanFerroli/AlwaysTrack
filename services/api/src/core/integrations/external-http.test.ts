import { describe, expect, it, vi } from "vitest";
import { ExternalHttpError, externalFetch, redactExternalData } from "./external-http.js";

describe("external HTTP helper", () => {
  it("adds timeout signal without removing caller options", async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response("ok"));

    await externalFetch(fetcher as never, "https://example.com", {
      method: "POST",
      headers: { authorization: "Bearer token" }
    });

    expect(fetcher).toHaveBeenCalledWith(
      "https://example.com",
      expect.objectContaining({
        method: "POST",
        headers: { authorization: "Bearer token" },
        signal: expect.any(AbortSignal)
      })
    );
  });

  it("redacts nested external payloads before logging", () => {
    expect(
      redactExternalData({
        access_token: "access",
        nested: { clientSecret: "secret", ok: true },
        list: [{ authorization: "Bearer token" }]
      })
    ).toEqual({
      access_token: "[redacted]",
      nested: { clientSecret: "[redacted]", ok: true },
      list: [{ authorization: "[redacted]" }]
    });
  });

  it("redacts secrets embedded in diagnostic strings and urls", () => {
    const sanitized = redactExternalData({
      message: "authorization: Bearer live-token client_secret=client-value",
      url: "https://provider.test/resource?key=gemini-value&ok=true"
    });

    expect(JSON.stringify(sanitized)).not.toContain("live-token");
    expect(JSON.stringify(sanitized)).not.toContain("client-value");
    expect(JSON.stringify(sanitized)).not.toContain("gemini-value");
    expect(sanitized).toEqual({
      message: "authorization: Bearer [redacted] client_secret=[redacted]",
      url: "https://provider.test/resource?key=[redacted]&ok=true"
    });
  });

  it("normalizes provider timeouts without exposing request data", async () => {
    const timeout = new DOMException("provider request aborted", "TimeoutError");
    const fetcher = vi.fn().mockRejectedValue(timeout);

    await expect(
      externalFetch(fetcher as never, "https://provider.test", {}, { operation: "provider.contract", timeoutMs: 25 })
    ).rejects.toEqual(expect.objectContaining<Partial<ExternalHttpError>>({
      message: "provider.contract timed out after 25ms"
    }));
  });
});
