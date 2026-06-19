import { describe, expect, it, vi } from "vitest";
import { externalFetch, redactExternalData } from "./external-http.js";

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
});
