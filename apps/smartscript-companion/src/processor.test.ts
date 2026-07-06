import { describe, expect, it } from "vitest";
import { isAllowedEvent } from "./allowlist.js";
import { processEvents } from "./processor.js";
import type { CaptureEvent } from "./storage.js";

const baseEvent: CaptureEvent = {
  id: "evt-1",
  timestamp: "2026-07-06T12:00:00.000Z",
  type: "alwayschat-sent",
  source: "AlwaysChat",
  destination: "AlwaysChat",
  text: "Olá Ana, seu pedido 123456 com CPF 123.456.789-09 será reenviado para a Rua Teste, 123."
};

describe("SmartScript companion", () => {
  it("keeps capture allowlisted", () => {
    expect(isAllowedEvent(baseEvent)).toBe(true);
    expect(isAllowedEvent({ source: "Banco", destination: "Planilha privada" })).toBe(false);
  });

  it("processes local events into at most 10 sanitized candidates", () => {
    const events = Array.from({ length: 12 }, (_, index) => ({ ...baseEvent, id: `evt-${index}`, text: `${baseEvent.text} Caso ${index}` }));
    const pkg = processEvents(events, new Date("2026-07-06T12:00:00.000Z"));
    expect(pkg.candidates.length).toBeLessThanOrEqual(10);
    expect(pkg.candidates[0]?.trigger.startsWith(":")).toBe(true);
    expect(pkg.candidates[0]?.body).not.toContain("123.456.789-09");
    expect(pkg.candidates[0]?.body).not.toContain("Rua Teste, 123");
  });
});
