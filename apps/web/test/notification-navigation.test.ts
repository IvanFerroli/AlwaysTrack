import { describe, expect, it } from "vitest";
import { resolveNotificationNavigation } from "../src/notification-navigation";

describe("notification navigation resolver", () => {
  it("preserves pause query parameters in href and typed intent", () => {
    const result = resolveNotificationNavigation({ href: "/pausas?date=2026-07-17&teamId=team%201&slotId=slot-7&bookingId=booking-2&swapId=swap-3&tab=swaps" });

    expect(result).toMatchObject({
      state: "READY",
      href: "/pausas?date=2026-07-17&teamId=team%201&slotId=slot-7&bookingId=booking-2&swapId=swap-3&tab=swaps",
      view: "supportPauses",
      intent: { supportPauses: { date: "2026-07-17", teamId: "team 1", slotId: "slot-7", bookingId: "booking-2", swapId: "swap-3", tab: "swaps" } }
    });
  });

  it("parses every schedule target parameter", () => {
    expect(resolveNotificationNavigation({ href: "/escalas/assignment-1?date=2026-07-18&teamId=team-2&userId=user-3&occurrenceId=occurrence-4&slotId=slot-5&claimId=claim-6&offerId=offer-7&at=2026-07-18T12%3A00%3A00.000Z&tab=claims" })).toMatchObject({
      state: "READY",
      view: "supportSchedules",
      intent: {
        supportSchedules: {
          date: "2026-07-18",
          teamId: "team-2",
          userId: "user-3",
          scheduleId: "assignment-1",
          occurrenceId: "occurrence-4",
          slotId: "slot-5",
          claimId: "claim-6",
          offerId: "offer-7",
          at: "2026-07-18T12:00:00.000Z",
          tab: "claims"
        }
      }
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

  it.each([
    ["claim", { claimId: "claim-1", tab: "claims" }, "/escalas?claimId=claim-1&tab=claims", "supportSchedules"],
    ["offer", { offerId: "offer-1", tab: "offers" }, "/escalas?offerId=offer-1&tab=offers", "supportSchedules"],
    ["occurrence", { occurrenceId: "occurrence-1", tab: "occurrences" }, "/escalas?occurrenceId=occurrence-1&tab=occurrences", "supportSchedules"],
    ["pause booking", { bookingId: "booking-1", tab: "schedule" }, "/pausas?bookingId=booking-1&tab=schedule", "supportPauses"],
    ["pause swap", { swapId: "swap-1", tab: "swaps" }, "/pausas?swapId=swap-1&tab=swaps", "supportPauses"]
  ])("derives a ready navigation for %s targets", (_label, params, href, view) => {
    const type = view === "supportPauses" ? "SUPPORT_PAUSE" : "SUPPORT_SCHEDULE";
    expect(resolveNotificationNavigation({ target: { type, status: "AVAILABLE", params } })).toMatchObject({
      state: "READY",
      href,
      view,
      intent: view === "supportPauses" ? { supportPauses: params } : { supportSchedules: params }
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
