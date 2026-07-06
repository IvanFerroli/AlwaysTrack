import { sanitizeSmartScriptText, validateSmartScriptTrigger } from "@alwaystrack/shared";
import type { CandidatePackage, CaptureEvent } from "./storage.js";

function normalizeText(value: string) {
  return value
    .replace(/\s+/g, " ")
    .replace(/^(ol[aá]|boa tarde|bom dia|boa noite)[,!.\s]+/i, "")
    .trim();
}

function slug(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 28) || "smartscript";
}

function titleFor(text: string) {
  const sentence = text.split(/[.!?]/)[0]?.trim() || text.trim();
  return sentence.slice(0, 70) || "Resposta SmartScript";
}

export function processEvents(events: CaptureEvent[], now = new Date()): CandidatePackage {
  const groups = new Map<string, { text: string; count: number; sources: Set<string> }>();
  for (const event of events) {
    const normalized = normalizeText(event.text);
    if (normalized.length < 24) continue;
    const sanitized = sanitizeSmartScriptText(normalized);
    const key = slug(sanitized.text.slice(0, 80));
    const current = groups.get(key) ?? { text: sanitized.text, count: 0, sources: new Set<string>() };
    current.count += 1;
    current.sources.add(event.source);
    if (sanitized.text.length > current.text.length) current.text = sanitized.text;
    groups.set(key, current);
  }
  const candidates = [...groups.values()]
    .sort((left, right) => right.count - left.count || right.text.length - left.text.length)
    .slice(0, 10)
    .map((group) => {
      const trigger = `:${slug(titleFor(group.text)).slice(0, 36)}`;
      const validTrigger = validateSmartScriptTrigger(trigger);
      return {
        title: titleFor(group.text),
        body: group.text,
        trigger: validTrigger.ok ? validTrigger.trigger : ":smartscript",
        channel: "WHATSAPP",
        tags: ["smartscript"],
        source: [...group.sources].sort().join(", ").slice(0, 80),
        occurrenceCount: group.count
      };
    });
  return { batchId: `smartscript-${now.toISOString()}`, processedAt: now.toISOString(), candidates };
}
