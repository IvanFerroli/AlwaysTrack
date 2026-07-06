import type { CaptureEvent } from "./storage.js";

export const defaultAllowlist = ["AlwaysChat", "ChatGPT", "alwayschat.local", "chat.openai.com", "chatgpt.com"];

export function isAllowedEvent(event: Pick<CaptureEvent, "source" | "destination">, allowlist = defaultAllowlist) {
  const haystack = `${event.source} ${event.destination ?? ""}`.toLowerCase();
  return allowlist.some((entry) => haystack.includes(entry.toLowerCase()));
}

export function redactEventForStatus(event: CaptureEvent) {
  return {
    id: event.id,
    timestamp: event.timestamp,
    type: event.type,
    source: event.source,
    destination: event.destination ?? null,
    textLength: event.text.length
  };
}
