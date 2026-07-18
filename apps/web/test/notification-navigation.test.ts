import { describe, expect, it } from "vitest";
import { resolveNotificationNavigation } from "../src/notification-navigation";

describe("notification navigation resolver", () => {
  it("preserves pause query parameters in href and typed intent", () => {
    const result = resolveNotificationNavigation({ href: "/pausas?date=2026-07-17&teamId=team%201&slotId=slot-7" });

    expect(result).toMatchObject({
      state: "READY",
      href: "/pausas?date=2026-07-17&teamId=team%201&slotId=slot-7",
      view: "supportPauses",
      intent: { supportPauses: { date: "2026-07-17", teamId: "team 1", slotId: "slot-7" } }
    });
  });

  it("maps schedule and announcement deep links to view intents", () => {
    expect(resolveNotificationNavigation({ href: "/escalas?date=2026-07-18&teamId=team-2&offerId=offer-1" })).toMatchObject({
      state: "READY",
      view: "supportSchedules",
      intent: { supportSchedules: { date: "2026-07-18", teamId: "team-2", offerId: "offer-1" } }
    });
    expect(resolveNotificationNavigation({ href: "/avisos/mudanca-critica?occurrenceId=occ-1" })).toMatchObject({
      state: "READY",
      view: "announcements",
      intent: { announcements: { slug: "mudanca-critica", occurrenceId: "occ-1" } }
    });
  });

  it("derives hrefs from typed targets", () => {
    const result = resolveNotificationNavigation({
      target: {
        type: "ANNOUNCEMENT_OCCURRENCE",
        status: "AVAILABLE",
        params: { slug: "mudança crítica", occurrenceId: "occ-29" }
      }
    });

    expect(result).toMatchObject({
      state: "READY",
      href: "/avisos/mudan%C3%A7a%20cr%C3%ADtica?occurrenceId=occ-29",
      view: "announcements",
      intent: { announcements: { slug: "mudança crítica", occurrenceId: "occ-29" } }
    });
  });

  it("uses a collection fallback without leaking a forbidden entity", () => {
    const result = resolveNotificationNavigation({
      target: { type: "ANNOUNCEMENT", status: "FORBIDDEN_OR_MISSING", href: "/avisos/segredo?occurrenceId=private" }
    });

    expect(result).toMatchObject({ state: "FALLBACK", href: "/avisos", view: "announcements" });
    expect(result.intent.announcements?.slug).toBeUndefined();
    expect(result.href).not.toContain("segredo");
  });

  it("honors an authoritative backend denial without inventing a fallback", () => {
    const result = resolveNotificationNavigation({
      href: "/avisos/href-legado",
      target: { type: "ANNOUNCEMENT", status: "FORBIDDEN_OR_MISSING", params: {}, href: null, fallbackHref: null }
    });

    expect(result).toMatchObject({ state: "UNAVAILABLE", targetStatus: "FORBIDDEN_OR_MISSING", href: null, view: null });
  });

  it("keeps legacy routes compatible and rejects arbitrary destinations", () => {
    expect(resolveNotificationNavigation({ href: "/ranking?teamId=team-1" })).toMatchObject({
      state: "READY",
      view: "supportPerformance",
      intent: { supportPerformance: { teamId: "team-1", legacySource: "ranking" } }
    });
    expect(resolveNotificationNavigation({ href: "https://example.test/pausas" })).toMatchObject({ state: "UNAVAILABLE", href: null, view: null });
    expect(resolveNotificationNavigation({ href: "/destino-desconhecido" })).toMatchObject({ state: "UNAVAILABLE", href: null, view: null });
  });

  it("uses Shared catalog routes for Script Library and sales documents", () => {
    expect(resolveNotificationNavigation({ target: { type: "SCRIPT_LIBRARY", status: "AVAILABLE", params: { suggestionId: "suggestion-1" } } }))
      .toMatchObject({ state: "READY", href: "/scriptoteca?suggestionId=suggestion-1", view: "scriptLibrary" });
    expect(resolveNotificationNavigation({ target: { type: "SALES_DOCUMENT", status: "AVAILABLE", params: { documentId: "document-1" } } }))
      .toMatchObject({ state: "READY", href: "/notas?documentId=document-1", view: "dashboard" });
  });
});
