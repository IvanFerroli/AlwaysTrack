import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { loadEnv } from "../../config/env.js";

export interface NotificationSendInput {
  to: string;
  templateName: string;
  language: string;
  payload: Record<string, unknown>;
  bodyParameters?: string[];
}

export interface NotificationSendResult {
  provider: string;
  providerMessageId: string;
  rawPayload: unknown;
  rawResponse: unknown;
}

export interface NotificationProvider {
  sendWhatsAppTemplate(input: NotificationSendInput): Promise<NotificationSendResult>;
}

export class NotificationProviderError extends Error {
  constructor(
    message: string,
    public readonly rawResponse?: unknown
  ) {
    super(message);
  }
}

export class FakeNotificationProvider implements NotificationProvider {
  async sendWhatsAppTemplate(input: NotificationSendInput): Promise<NotificationSendResult> {
    const providerMessageId = `fake_${createHash("sha1").update(JSON.stringify(input)).digest("hex").slice(0, 16)}`;
    return {
      provider: "fake",
      providerMessageId,
      rawPayload: input,
      rawResponse: { ok: true, messages: [{ id: providerMessageId }] }
    };
  }
}

export class MetaWhatsAppProvider implements NotificationProvider {
  constructor(
    private readonly token: string,
    private readonly phoneNumberId: string,
    private readonly fetcher: typeof fetch = fetch
  ) {}

  async sendWhatsAppTemplate(input: NotificationSendInput): Promise<NotificationSendResult> {
    const bodyParameters = input.bodyParameters?.filter((value) => value.trim().length > 0) ?? [];
    const payload = {
      messaging_product: "whatsapp",
      to: input.to,
      type: "template",
      template: {
        name: input.templateName,
        language: { code: input.language },
        ...(bodyParameters.length
          ? {
              components: [
                {
                  type: "body",
                  parameters: bodyParameters.map((text) => ({ type: "text", text }))
                }
              ]
            }
          : {})
      }
    };

    const response = await this.fetcher(`https://graph.facebook.com/v20.0/${this.phoneNumberId}/messages`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${this.token}`,
        "content-type": "application/json"
      },
      body: JSON.stringify(payload)
    });
    const rawResponse = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new NotificationProviderError("META_WHATSAPP_SEND_FAILED", rawResponse);
    }

    const providerMessageId =
      typeof rawResponse === "object" &&
      rawResponse !== null &&
      "messages" in rawResponse &&
      Array.isArray(rawResponse.messages) &&
      typeof rawResponse.messages[0]?.id === "string"
        ? rawResponse.messages[0].id
        : "";
    if (!providerMessageId) {
      throw new NotificationProviderError("META_WHATSAPP_MISSING_MESSAGE_ID", rawResponse);
    }

    return { provider: "meta-whatsapp", providerMessageId, rawPayload: payload, rawResponse };
  }
}

let provider: NotificationProvider | null = null;

export function getNotificationProvider() {
  if (provider) return provider;
  const env = loadEnv();
  if (env.notificationProvider === "meta" && env.metaWhatsAppToken && env.metaWhatsAppPhoneNumberId) {
    provider = new MetaWhatsAppProvider(env.metaWhatsAppToken, env.metaWhatsAppPhoneNumberId);
    return provider;
  }
  provider = new FakeNotificationProvider();
  return provider;
}

export function verifyMetaSignature(body: string, signatureHeader: string | undefined, appSecret: string | undefined) {
  if (!appSecret || !signatureHeader?.startsWith("sha256=")) return false;
  const expected = createHmac("sha256", appSecret).update(body).digest("hex");
  const provided = signatureHeader.slice("sha256=".length);
  const expectedBuffer = Buffer.from(expected, "hex");
  const providedBuffer = Buffer.from(provided, "hex");
  return expectedBuffer.length === providedBuffer.length && timingSafeEqual(expectedBuffer, providedBuffer);
}
