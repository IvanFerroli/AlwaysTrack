export const notificationTargetTypes = [
  "SUPPORT_SCHEDULE",
  "SUPPORT_PAUSE",
  "ANNOUNCEMENT",
  "WIKI_PAGE",
  "FAQ_THREAD",
  "SUPPORT_CAMPAIGN",
  "SUPPORT_PERFORMANCE",
  "SERVICE_FLOW",
  "SCRIPT_LIBRARY",
  "SALES_DOCUMENT",
  "PROFILE"
] as const;

export type NotificationTargetType = (typeof notificationTargetTypes)[number];

export const notificationTargetStatuses = ["AVAILABLE", "ARCHIVED", "REMOVED", "FORBIDDEN_OR_MISSING"] as const;
export type NotificationTargetStatus = (typeof notificationTargetStatuses)[number];

export type NotificationTargetParams = Record<string, string>;

export interface NotificationTargetDefinition {
  fallbackHref: string;
  paramKeys: readonly string[];
}

export interface DerivedNotificationTarget {
  type: NotificationTargetType;
  params: NotificationTargetParams;
  status: NotificationTargetStatus;
}

export interface CanonicalNotificationTarget extends DerivedNotificationTarget {
  href: string | null;
  fallbackHref: string | null;
}

export const notificationTargetCatalog = {
  SUPPORT_SCHEDULE: {
    fallbackHref: "/escalas",
    paramKeys: ["date", "teamId", "userId", "scheduleId", "occurrenceId", "slotId", "claimId", "offerId", "at", "tab"]
  },
  SUPPORT_PAUSE: {
    fallbackHref: "/pausas",
    paramKeys: ["date", "teamId", "slotId", "bookingId", "swapId", "tab"]
  },
  ANNOUNCEMENT: {
    fallbackHref: "/avisos",
    paramKeys: ["announcementId", "occurrenceId", "slug"]
  },
  WIKI_PAGE: {
    fallbackHref: "/wiki",
    paramKeys: ["pageId", "requestId", "faqThreadId", "slug"]
  },
  FAQ_THREAD: {
    fallbackHref: "/faq",
    paramKeys: ["threadId", "status"]
  },
  SUPPORT_CAMPAIGN: {
    fallbackHref: "/campanhas",
    paramKeys: ["campaignId"]
  },
  SUPPORT_PERFORMANCE: {
    fallbackHref: "/performance",
    paramKeys: ["entryId", "metric", "userId", "teamId"]
  },
  SERVICE_FLOW: {
    fallbackHref: "/fluxos",
    paramKeys: ["flowId", "slug"]
  },
  SCRIPT_LIBRARY: {
    fallbackHref: "/scriptoteca",
    paramKeys: ["scriptId", "suggestionId"]
  },
  SALES_DOCUMENT: {
    fallbackHref: "/notas",
    paramKeys: ["documentId"]
  },
  PROFILE: {
    fallbackHref: "/profile",
    paramKeys: ["userId"]
  }
} as const satisfies Record<NotificationTargetType, NotificationTargetDefinition>;

const targetTypeAliases: Record<string, NotificationTargetType> = {
  SCHEDULE: "SUPPORT_SCHEDULE",
  SUPPORT_SCHEDULE: "SUPPORT_SCHEDULE",
  SUPPORT_SHIFT: "SUPPORT_SCHEDULE",
  PAUSE: "SUPPORT_PAUSE",
  SUPPORT_PAUSE: "SUPPORT_PAUSE",
  SUPPORT_PAUSE_BOOKING: "SUPPORT_PAUSE",
  SUPPORT_PAUSE_SWAP: "SUPPORT_PAUSE",
  ANNOUNCEMENT: "ANNOUNCEMENT",
  ANNOUNCEMENT_OCCURRENCE: "ANNOUNCEMENT",
  WIKI: "WIKI_PAGE",
  WIKI_PAGE: "WIKI_PAGE",
  FAQ: "FAQ_THREAD",
  FAQ_THREAD: "FAQ_THREAD",
  SUPPORT_CAMPAIGN: "SUPPORT_CAMPAIGN",
  CAMPAIGN: "SUPPORT_CAMPAIGN",
  SUPPORT_PERFORMANCE: "SUPPORT_PERFORMANCE",
  PERFORMANCE: "SUPPORT_PERFORMANCE",
  SERVICE_FLOW: "SERVICE_FLOW",
  SCRIPT_LIBRARY: "SCRIPT_LIBRARY",
  OPERATIONAL_SCRIPT: "SCRIPT_LIBRARY",
  SALES_DOCUMENT: "SALES_DOCUMENT",
  PROFILE: "PROFILE",
  USER: "PROFILE"
};

const entityTargets: Record<string, { type: NotificationTargetType; idParam: string }> = {
  SupportShiftAssignment: { type: "SUPPORT_SCHEDULE", idParam: "scheduleId" },
  SupportShiftOccurrence: { type: "SUPPORT_SCHEDULE", idParam: "occurrenceId" },
  SupportExtraShiftSlot: { type: "SUPPORT_SCHEDULE", idParam: "slotId" },
  SupportExtraShiftClaim: { type: "SUPPORT_SCHEDULE", idParam: "claimId" },
  SupportShiftOffer: { type: "SUPPORT_SCHEDULE", idParam: "offerId" },
  SupportPauseSlot: { type: "SUPPORT_PAUSE", idParam: "slotId" },
  SupportPauseBooking: { type: "SUPPORT_PAUSE", idParam: "bookingId" },
  SupportPauseSwap: { type: "SUPPORT_PAUSE", idParam: "swapId" },
  Announcement: { type: "ANNOUNCEMENT", idParam: "announcementId" },
  AnnouncementOccurrence: { type: "ANNOUNCEMENT", idParam: "occurrenceId" },
  WikiPage: { type: "WIKI_PAGE", idParam: "pageId" },
  WikiEditRequest: { type: "WIKI_PAGE", idParam: "requestId" },
  FaqThread: { type: "FAQ_THREAD", idParam: "threadId" },
  SupportCampaign: { type: "SUPPORT_CAMPAIGN", idParam: "campaignId" },
  SupportKpiEntry: { type: "SUPPORT_PERFORMANCE", idParam: "entryId" },
  ServiceFlow: { type: "SERVICE_FLOW", idParam: "flowId" },
  OperationalScript: { type: "SCRIPT_LIBRARY", idParam: "scriptId" },
  OperationalScriptSuggestion: { type: "SCRIPT_LIBRARY", idParam: "suggestionId" },
  SalesDocument: { type: "SALES_DOCUMENT", idParam: "documentId" },
  User: { type: "PROFILE", idParam: "userId" }
};

const internalOrigin = "https://notifications.alwaystrack.invalid";

function normalizedName(value: string) {
  return value
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .replace(/[.\s-]+/g, "_")
    .toUpperCase();
}

export function normalizeNotificationTargetType(value: unknown): NotificationTargetType | null {
  return typeof value === "string" ? targetTypeAliases[normalizedName(value)] ?? null : null;
}

export function normalizeNotificationTargetStatus(value: unknown): NotificationTargetStatus | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toUpperCase();
  return notificationTargetStatuses.includes(normalized as NotificationTargetStatus)
    ? (normalized as NotificationTargetStatus)
    : null;
}

function safeParam(value: unknown) {
  if (typeof value !== "string" && typeof value !== "number") return null;
  const normalized = String(value).trim();
  return normalized && normalized.length <= 240 ? normalized : null;
}

export function sanitizeNotificationTargetParams(type: NotificationTargetType, value: unknown): NotificationTargetParams {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const source = value as Record<string, unknown>;
  const params: NotificationTargetParams = {};
  for (const key of notificationTargetCatalog[type].paramKeys) {
    const normalized = safeParam(source[key]);
    if (normalized !== null) params[key] = normalized;
  }
  return params;
}

export function notificationTargetFallbackHref(type: NotificationTargetType | null | undefined) {
  return type ? notificationTargetCatalog[type].fallbackHref : null;
}

function queryHref(path: string, params: NotificationTargetParams, keys: readonly string[]) {
  const query = new URLSearchParams();
  for (const key of keys) {
    if (params[key]) query.set(key, params[key]);
  }
  return query.size ? `${path}?${query.toString()}` : path;
}

export function notificationTargetHref(type: NotificationTargetType, value: unknown) {
  const params = sanitizeNotificationTargetParams(type, value);
  if (type === "SUPPORT_SCHEDULE") {
    return queryHref("/escalas", params, ["date", "teamId", "userId", "scheduleId", "occurrenceId", "slotId", "claimId", "offerId", "at", "tab"]);
  }
  if (type === "SUPPORT_PAUSE") return queryHref("/pausas", params, ["date", "teamId", "slotId", "bookingId", "swapId", "tab"]);
  if (type === "ANNOUNCEMENT") {
    const path = params.slug ? `/avisos/${encodeURIComponent(params.slug)}` : "/avisos";
    return queryHref(path, params, ["occurrenceId"]);
  }
  if (type === "WIKI_PAGE") return params.slug ? `/wiki/${encodeURIComponent(params.slug)}` : "/wiki";
  if (type === "FAQ_THREAD") return queryHref("/faq", params, ["status", "threadId"]);
  if (type === "SUPPORT_CAMPAIGN") return queryHref("/campanhas", params, ["campaignId"]);
  if (type === "SUPPORT_PERFORMANCE") return queryHref("/performance", params, ["metric", "userId", "teamId", "entryId"]);
  if (type === "SERVICE_FLOW") return queryHref("/fluxos", params, ["flowId"]);
  if (type === "SCRIPT_LIBRARY") return queryHref("/scriptoteca", params, ["scriptId", "suggestionId"]);
  if (type === "SALES_DOCUMENT") return queryHref("/notas", params, ["documentId"]);
  return "/profile";
}

function hrefContext(href: string | null | undefined) {
  if (!href?.startsWith("/") || href.startsWith("//")) return null;
  try {
    const url = new URL(href, internalOrigin);
    return url.origin === internalOrigin ? url : null;
  } catch {
    return null;
  }
}

function typeFromPath(pathname: string): NotificationTargetType | null {
  if (pathname === "/escalas" || pathname.startsWith("/escalas/")) return "SUPPORT_SCHEDULE";
  if (pathname === "/pausas") return "SUPPORT_PAUSE";
  if (pathname === "/avisos" || pathname.startsWith("/avisos/")) return "ANNOUNCEMENT";
  if (pathname === "/wiki" || pathname.startsWith("/wiki/")) return "WIKI_PAGE";
  if (pathname === "/faq") return "FAQ_THREAD";
  if (pathname === "/campanhas") return "SUPPORT_CAMPAIGN";
  if (["/performance", "/ranking", "/extratos"].includes(pathname)) return "SUPPORT_PERFORMANCE";
  if (pathname === "/fluxos") return "SERVICE_FLOW";
  if (pathname === "/scriptoteca") return "SCRIPT_LIBRARY";
  if (pathname === "/notas") return "SALES_DOCUMENT";
  if (pathname === "/profile") return "PROFILE";
  return null;
}

function paramsFromHref(type: NotificationTargetType, url: URL | null) {
  if (!url) return {};
  const source: Record<string, string> = {};
  url.searchParams.forEach((value, key) => {
    source[key] = value;
  });
  const segments = url.pathname.split("/").filter(Boolean);
  const decodedSegment = (value: string) => {
    try {
      return decodeURIComponent(value);
    } catch {
      return value;
    }
  };
  if (type === "ANNOUNCEMENT" && segments[0] === "avisos" && segments[1]) source.slug = decodedSegment(segments[1]);
  if (type === "WIKI_PAGE" && segments[0] === "wiki" && segments[1]) source.slug = decodedSegment(segments[1]);
  return sanitizeNotificationTargetParams(type, source);
}

export function deriveNotificationTarget(input: {
  type?: unknown;
  notificationType?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  href?: string | null;
  params?: unknown;
  status?: unknown;
}): DerivedNotificationTarget | null {
  const url = hrefContext(input.href);
  const entityTarget = input.entityType ? entityTargets[input.entityType] : undefined;
  const promotedFaq = input.entityType === "FaqThread"
    && (input.notificationType === "faq.thread.promoted_to_wiki" || url?.pathname.startsWith("/wiki/") === true);
  const type = promotedFaq
    ? "WIKI_PAGE"
    : normalizeNotificationTargetType(input.type) ?? entityTarget?.type ?? (url ? typeFromPath(url.pathname) : null);
  if (!type) return null;

  const params = {
    ...paramsFromHref(type, url),
    ...sanitizeNotificationTargetParams(type, input.params)
  };
  const entityId = safeParam(input.entityId);
  if (promotedFaq && entityId) params.faqThreadId = entityId;
  else if (entityTarget?.type === type && entityId) params[entityTarget.idParam] = entityId;

  return {
    type,
    params: sanitizeNotificationTargetParams(type, params),
    status: normalizeNotificationTargetStatus(input.status) ?? "AVAILABLE"
  };
}

export function canonicalNotificationTarget(
  type: NotificationTargetType,
  status: NotificationTargetStatus,
  value: unknown
): CanonicalNotificationTarget {
  const params = sanitizeNotificationTargetParams(type, value);
  return {
    type,
    status,
    params,
    href: status === "AVAILABLE" ? notificationTargetHref(type, params) : null,
    fallbackHref: notificationTargetFallbackHref(type)
  };
}
