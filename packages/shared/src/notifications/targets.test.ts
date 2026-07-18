import { describe, expect, it } from "vitest";
import {
  deriveNotificationTarget,
  notificationTargetCatalog,
  notificationTargetFallbackHref,
  notificationTargetHref,
  notificationTargetTypes,
  sanitizeNotificationTargetParams
} from "./targets.js";

describe("notification target catalog", () => {
  it("defines every supported target with an internal collection fallback", () => {
    expect(Object.keys(notificationTargetCatalog)).toEqual([...notificationTargetTypes]);
    for (const type of notificationTargetTypes) expect(notificationTargetFallbackHref(type)).toMatch(/^\/(?!\/)/);
  });

  it("allowlists params and builds canonical hrefs", () => {
    expect(sanitizeNotificationTargetParams("SUPPORT_SCHEDULE", {
      date: "2026-07-18",
      teamId: "team 1",
      secret: "do-not-copy"
    })).toEqual({ date: "2026-07-18", teamId: "team 1" });
    expect(notificationTargetHref("SUPPORT_SCHEDULE", { date: "2026-07-18", teamId: "team 1", secret: "x" }))
      .toBe("/escalas?date=2026-07-18&teamId=team+1");
  });

  it("derives current emitter targets from entity and legacy href", () => {
    expect(deriveNotificationTarget({
      notificationType: "announcement.published",
      entityType: "Announcement",
      entityId: "announcement-1",
      href: "/avisos/rota-antiga"
    })).toEqual({
      type: "ANNOUNCEMENT",
      status: "AVAILABLE",
      params: { announcementId: "announcement-1", slug: "rota-antiga" }
    });
    expect(deriveNotificationTarget({ entityType: "OperationalScriptSuggestion", entityId: "suggestion-1", href: "/scriptoteca" }))
      .toMatchObject({ type: "SCRIPT_LIBRARY", params: { suggestionId: "suggestion-1" } });
  });

  it.each([
    ["SupportShiftAssignment", "SUPPORT_SCHEDULE", "scheduleId"],
    ["SupportShiftOccurrence", "SUPPORT_SCHEDULE", "occurrenceId"],
    ["SupportExtraShiftSlot", "SUPPORT_SCHEDULE", "slotId"],
    ["SupportExtraShiftClaim", "SUPPORT_SCHEDULE", "claimId"],
    ["SupportShiftOffer", "SUPPORT_SCHEDULE", "offerId"],
    ["SupportPauseSlot", "SUPPORT_PAUSE", "slotId"],
    ["SupportPauseBooking", "SUPPORT_PAUSE", "bookingId"],
    ["SupportPauseSwap", "SUPPORT_PAUSE", "swapId"],
    ["Announcement", "ANNOUNCEMENT", "announcementId"],
    ["AnnouncementOccurrence", "ANNOUNCEMENT", "occurrenceId"],
    ["WikiPage", "WIKI_PAGE", "pageId"],
    ["WikiEditRequest", "WIKI_PAGE", "requestId"],
    ["FaqThread", "FAQ_THREAD", "threadId"],
    ["SupportCampaign", "SUPPORT_CAMPAIGN", "campaignId"],
    ["SupportKpiEntry", "SUPPORT_PERFORMANCE", "entryId"],
    ["ServiceFlow", "SERVICE_FLOW", "flowId"],
    ["OperationalScript", "SCRIPT_LIBRARY", "scriptId"],
    ["OperationalScriptSuggestion", "SCRIPT_LIBRARY", "suggestionId"],
    ["SalesDocument", "SALES_DOCUMENT", "documentId"],
    ["User", "PROFILE", "userId"]
  ] as const)("maps emitter entity %s to %s", (entityType, type, idParam) => {
    expect(deriveNotificationTarget({ entityType, entityId: "entity-1", href: notificationTargetFallbackHref(type) }))
      .toMatchObject({ type, params: { [idParam]: "entity-1" } });
  });

  it("maps promoted FAQ notifications to Wiki before the generic FAQ mapping", () => {
    expect(deriveNotificationTarget({
      notificationType: "faq.thread.promoted_to_wiki",
      entityType: "FaqThread",
      entityId: "thread-1",
      href: "/wiki/como-trocar"
    })).toEqual({
      type: "WIKI_PAGE",
      status: "AVAILABLE",
      params: { faqThreadId: "thread-1", slug: "como-trocar" }
    });
  });

  it("keeps unknown legacy destinations non-actionable", () => {
    expect(deriveNotificationTarget({ entityType: "LegacyThing", entityId: "private", href: "/outside-catalog" })).toBeNull();
    expect(deriveNotificationTarget({ href: "https://example.test/faq" })).toBeNull();
  });
});
