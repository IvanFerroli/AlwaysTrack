import { describe, expect, it, vi } from "vitest";
import { FakeNotificationProvider, MetaWhatsAppProvider, NotificationProviderError, verifyMetaSignature } from "./provider.js";
import { createHmac } from "node:crypto";

describe("notification providers", () => {
  it("fake provider returns stable provider message ids", async () => {
    const result = await new FakeNotificationProvider().sendWhatsAppTemplate({
      to: "+550000",
      templateName: "venc",
      language: "pt_BR",
      payload: { name: "Ana" }
    });

    expect(result.provider).toBe("fake");
    expect(result.providerMessageId).toMatch(/^fake_/);
  });

  it("meta provider normalizes accepted responses", async () => {
    const fetcher = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ messages: [{ id: "wamid.1" }] })
    });

    const result = await new MetaWhatsAppProvider("token", "phone-id", fetcher as never).sendWhatsAppTemplate({
      to: "+550000",
      templateName: "venc",
      language: "pt_BR",
      payload: {}
    });

    expect(result.provider).toBe("meta-whatsapp");
    expect(result.providerMessageId).toBe("wamid.1");
    expect(fetcher).toHaveBeenCalledWith(
      expect.stringContaining("/phone-id/messages"),
      expect.objectContaining({ headers: expect.objectContaining({ authorization: "Bearer token" }) })
    );
  });

  it("meta provider normalizes failures without exposing token", async () => {
    const fetcher = vi.fn().mockResolvedValue({
      ok: false,
      json: vi.fn().mockResolvedValue({ error: { message: "bad request" } })
    });

    await expect(
      new MetaWhatsAppProvider("secret-token", "phone-id", fetcher as never).sendWhatsAppTemplate({
        to: "+550000",
        templateName: "venc",
        language: "pt_BR",
        payload: {}
      })
    ).rejects.toBeInstanceOf(NotificationProviderError);
  });

  it("verifies Meta webhook signatures", () => {
    const body = JSON.stringify({ ok: true });
    const signature = `sha256=${createHmac("sha256", "secret").update(body).digest("hex")}`;
    expect(verifyMetaSignature(body, signature, "secret")).toBe(true);
    expect(verifyMetaSignature(body, signature, "other")).toBe(false);
  });
});
