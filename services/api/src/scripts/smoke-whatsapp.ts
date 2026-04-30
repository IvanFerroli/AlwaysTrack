import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

function loadDotEnv() {
  const candidates = [
    path.resolve(process.cwd(), ".env"),
    path.resolve(process.cwd(), "../.env"),
    path.resolve(process.cwd(), "../../.env")
  ];
  const envPath = candidates.find((candidate) => existsSync(candidate));
  if (!envPath) return;

  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const [key, ...rest] = trimmed.split("=");
    if (process.env[key]) continue;
    process.env[key] = rest.join("=").trim().replace(/^['"]|['"]$/g, "");
  }
}

function requiredEnv(key: string) {
  const value = process.env[key]?.trim();
  if (!value) {
    throw new Error(`Missing required env: ${key}`);
  }
  return value;
}

function optionalEnv(key: string, fallback: string) {
  return process.env[key]?.trim() || fallback;
}

function normalizePhone(value: string) {
  return value.replace(/\D/g, "");
}

function sanitize(value: unknown): unknown {
  if (typeof value === "string") {
    const digits = value.replace(/\D/g, "");
    if (digits.length >= 8) {
      return `${digits.slice(0, 4)}***${digits.slice(-2)}`;
    }
    return value;
  }
  if (Array.isArray(value)) return value.map(sanitize);
  if (!value || typeof value !== "object") return value;

  const sensitiveKeys = new Set([
    "authorization",
    "token",
    "access_token",
    "app_secret",
    "verify_token",
    "input",
    "to",
    "wa_id",
    "phone",
    "recipient_phone"
  ]);
  const output: Record<string, unknown> = {};
  for (const [key, nestedValue] of Object.entries(value)) {
    output[key] = sensitiveKeys.has(key.toLowerCase()) ? "[redacted]" : sanitize(nestedValue);
  }
  return output;
}

function providerMessageId(body: unknown) {
  if (!body || typeof body !== "object" || !("messages" in body)) return undefined;
  const messages = (body as { messages?: Array<{ id?: unknown }> }).messages;
  const id = messages?.[0]?.id;
  return typeof id === "string" ? id : undefined;
}

async function main() {
  loadDotEnv();

  const token = requiredEnv("META_WHATSAPP_TOKEN");
  const phoneNumberId = requiredEnv("META_WHATSAPP_PHONE_NUMBER_ID");
  const to = normalizePhone(requiredEnv("META_WHATSAPP_SMOKE_TO"));
  const templateName = optionalEnv("META_WHATSAPP_SMOKE_TEMPLATE", "hello_world");
  const language = optionalEnv("META_WHATSAPP_SMOKE_TEMPLATE_LANGUAGE", "en_US");

  if (!to) {
    throw new Error("META_WHATSAPP_SMOKE_TO must contain a valid recipient phone number.");
  }

  const payload = {
    messaging_product: "whatsapp",
    to,
    type: "template",
    template: {
      name: templateName,
      language: { code: language }
    }
  };

  const response = await fetch(`https://graph.facebook.com/v20.0/${phoneNumberId}/messages`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json"
    },
    body: JSON.stringify(payload)
  });
  const body = await response.json().catch(() => null);
  const messageId = providerMessageId(body);

  console.log(
    JSON.stringify(
      {
        ok: response.ok,
        status: response.status,
        statusText: response.statusText,
        template: templateName,
        language,
        providerMessageId: messageId,
        body: sanitize(body)
      },
      null,
      2
    )
  );

  if (!response.ok) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Smoke WhatsApp failed.");
  process.exitCode = 1;
});
