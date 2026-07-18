export type NotificationTargetStatus = "AVAILABLE" | "ARCHIVED" | "REMOVED" | "FORBIDDEN_OR_MISSING";

export type NotificationTargetType =
  | "SUPPORT_SCHEDULE"
  | "SUPPORT_PAUSE"
  | "ANNOUNCEMENT"
  | "WIKI_PAGE"
  | "FAQ_THREAD"
  | "SUPPORT_CAMPAIGN"
  | "SUPPORT_PERFORMANCE"
  | "SERVICE_FLOW"
  | "PROFILE";

export type NotificationView =
  | "dashboard"
  | "supportSchedules"
  | "supportPauses"
  | "supportPerformance"
  | "supportCampaigns"
  | "announcements"
  | "serviceFlows"
  | "scriptLibrary"
  | "wiki"
  | "faq"
  | "audit"
  | "settings"
  | "profile";

export interface NotificationNavigationIntent {
  query: Record<string, string>;
  supportSchedules?: { date?: string; teamId?: string; userId?: string; scheduleId?: string; offerId?: string; swapId?: string; tab?: string };
  supportPauses?: { date?: string; teamId?: string; slotId?: string; bookingId?: string; swapId?: string; tab?: string };
  announcements?: { slug?: string; occurrenceId?: string };
  wiki?: { slug?: string };
  faq?: { status?: string; threadId?: string };
  supportCampaigns?: { campaignId?: string };
  supportPerformance?: { metric?: string; userId?: string; teamId?: string; legacySource?: "ranking" | "statements" };
  serviceFlows?: { flowId?: string };
  dashboard?: { section?: string };
}

export interface NotificationTarget {
  type?: NotificationTargetType | string | null;
  status?: NotificationTargetStatus | string | null;
  params?: Record<string, unknown> | null;
  href?: string | null;
  fallbackHref?: string | null;
}

export interface NotificationNavigationSource {
  href?: string | null;
  resolvedHref?: string | null;
  fallbackHref?: string | null;
  targetStatus?: NotificationTargetStatus | string | null;
  entityType?: string | null;
  entityId?: string | null;
  target?: NotificationTarget | null;
}

export interface NotificationNavigationResult {
  state: "READY" | "FALLBACK" | "UNAVAILABLE";
  targetStatus: NotificationTargetStatus;
  href: string | null;
  view: NotificationView | null;
  intent: NotificationNavigationIntent;
  message: string | null;
}

export type NotificationNavigate = (href?: string | null, navigation?: NotificationNavigationResult) => void;

interface KnownRoute {
  href: string;
  collectionHref: string;
  view: NotificationView;
  intent: NotificationNavigationIntent;
}

const internalOrigin = "https://navigation.alwaystrack.invalid";

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
  PROFILE: "PROFILE"
};

function targetType(value: unknown) {
  if (typeof value !== "string") return null;
  const normalized = value
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .replace(/[.\s-]+/g, "_")
    .toUpperCase();
  return targetTypeAliases[normalized] ?? null;
}

function targetStatus(value: unknown): NotificationTargetStatus | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toUpperCase();
  return normalized === "AVAILABLE" || normalized === "ARCHIVED" || normalized === "REMOVED" || normalized === "FORBIDDEN_OR_MISSING"
    ? normalized
    : null;
}

function textParam(params: Record<string, unknown> | null | undefined, key: string) {
  const value = params?.[key];
  if (typeof value !== "string" && typeof value !== "number") return undefined;
  const normalized = String(value).trim();
  return normalized || undefined;
}

function withQuery(path: string, params: Record<string, unknown> | null | undefined, keys: string[]) {
  const query = new URLSearchParams();
  for (const key of keys) {
    const value = textParam(params, key);
    if (value) query.set(key, value);
  }
  return query.size ? `${path}?${query.toString()}` : path;
}

function typedTargetHref(type: NotificationTargetType | null, params: Record<string, unknown> | null | undefined) {
  if (type === "SUPPORT_SCHEDULE") {
    return withQuery("/escalas", params, ["date", "teamId", "userId", "scheduleId", "offerId", "swapId", "tab"]);
  }
  if (type === "SUPPORT_PAUSE") {
    return withQuery("/pausas", params, ["date", "teamId", "slotId", "bookingId", "swapId", "tab"]);
  }
  if (type === "ANNOUNCEMENT") {
    const slug = textParam(params, "slug");
    return withQuery(slug ? `/avisos/${encodeURIComponent(slug)}` : "/avisos", params, ["occurrenceId"]);
  }
  if (type === "WIKI_PAGE") {
    const slug = textParam(params, "slug");
    return slug ? `/wiki/${encodeURIComponent(slug)}` : "/wiki";
  }
  if (type === "FAQ_THREAD") return withQuery("/faq", params, ["status", "threadId"]);
  if (type === "SUPPORT_CAMPAIGN") return withQuery("/campanhas", params, ["campaignId"]);
  if (type === "SUPPORT_PERFORMANCE") return withQuery("/performance", params, ["metric", "userId", "teamId"]);
  if (type === "SERVICE_FLOW") return withQuery("/fluxos", params, ["flowId"]);
  if (type === "PROFILE") return "/profile";
  return null;
}

function fallbackHrefForType(type: NotificationTargetType | null) {
  if (type === "SUPPORT_SCHEDULE") return "/escalas";
  if (type === "SUPPORT_PAUSE") return "/pausas";
  if (type === "ANNOUNCEMENT") return "/avisos";
  if (type === "WIKI_PAGE") return "/wiki";
  if (type === "FAQ_THREAD") return "/faq";
  if (type === "SUPPORT_CAMPAIGN") return "/campanhas";
  if (type === "SUPPORT_PERFORMANCE") return "/performance";
  if (type === "SERVICE_FLOW") return "/fluxos";
  if (type === "PROFILE") return "/profile";
  return null;
}

function decodeSegment(value: string | undefined) {
  if (!value) return undefined;
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function queryRecord(searchParams: URLSearchParams) {
  const query: Record<string, string> = {};
  searchParams.forEach((value, key) => {
    query[key] = value;
  });
  return query;
}

function queryValue(searchParams: URLSearchParams, key: string) {
  const value = searchParams.get(key)?.trim();
  return value || undefined;
}

function knownRoute(value: string | null | undefined): KnownRoute | null {
  if (typeof value !== "string" || !value.trim().startsWith("/") || value.trim().startsWith("//")) return null;
  let url: URL;
  try {
    url = new URL(value.trim(), internalOrigin);
  } catch {
    return null;
  }
  if (url.origin !== internalOrigin) return null;

  const path = url.pathname.length > 1 ? url.pathname.replace(/\/+$/, "") : "/";
  const href = `${path}${url.search}${url.hash}`;
  const query = queryRecord(url.searchParams);
  const scheduleMatch = path.match(/^\/escalas(?:\/([^/]+))?$/);
  if (scheduleMatch) {
    return {
      href,
      collectionHref: "/escalas",
      view: "supportSchedules",
      intent: {
        query,
        supportSchedules: {
          date: queryValue(url.searchParams, "date"),
          teamId: queryValue(url.searchParams, "teamId"),
          userId: queryValue(url.searchParams, "userId"),
          scheduleId: decodeSegment(scheduleMatch[1]) ?? queryValue(url.searchParams, "scheduleId"),
          offerId: queryValue(url.searchParams, "offerId"),
          swapId: queryValue(url.searchParams, "swapId"),
          tab: queryValue(url.searchParams, "tab")
        }
      }
    };
  }
  if (path === "/pausas") {
    return {
      href,
      collectionHref: "/pausas",
      view: "supportPauses",
      intent: {
        query,
        supportPauses: {
          date: queryValue(url.searchParams, "date"),
          teamId: queryValue(url.searchParams, "teamId"),
          slotId: queryValue(url.searchParams, "slotId"),
          bookingId: queryValue(url.searchParams, "bookingId"),
          swapId: queryValue(url.searchParams, "swapId"),
          tab: queryValue(url.searchParams, "tab")
        }
      }
    };
  }
  const announcementMatch = path.match(/^\/avisos(?:\/([^/]+))?$/);
  if (announcementMatch) {
    return {
      href,
      collectionHref: "/avisos",
      view: "announcements",
      intent: { query, announcements: { slug: decodeSegment(announcementMatch[1]), occurrenceId: queryValue(url.searchParams, "occurrenceId") } }
    };
  }
  const wikiMatch = path.match(/^\/wiki(?:\/([^/]+))?$/);
  if (wikiMatch) {
    return { href, collectionHref: "/wiki", view: "wiki", intent: { query, wiki: { slug: decodeSegment(wikiMatch[1]) } } };
  }
  if (path === "/faq") {
    return { href, collectionHref: "/faq", view: "faq", intent: { query, faq: { status: queryValue(url.searchParams, "status"), threadId: queryValue(url.searchParams, "threadId") } } };
  }
  if (path === "/campanhas") {
    return { href, collectionHref: "/campanhas", view: "supportCampaigns", intent: { query, supportCampaigns: { campaignId: queryValue(url.searchParams, "campaignId") } } };
  }
  if (path === "/performance" || path === "/ranking" || path === "/extratos") {
    const legacySource = path === "/ranking" ? "ranking" : path === "/extratos" ? "statements" : undefined;
    return {
      href,
      collectionHref: "/performance",
      view: "supportPerformance",
      intent: {
        query,
        supportPerformance: {
          metric: queryValue(url.searchParams, "metric"),
          userId: queryValue(url.searchParams, "userId"),
          teamId: queryValue(url.searchParams, "teamId"),
          legacySource
        }
      }
    };
  }
  if (path === "/fluxos") {
    return { href, collectionHref: "/fluxos", view: "serviceFlows", intent: { query, serviceFlows: { flowId: queryValue(url.searchParams, "flowId") } } };
  }
  if (path === "/scriptoteca") return { href, collectionHref: "/scriptoteca", view: "scriptLibrary", intent: { query } };
  if (path === "/audit") return { href, collectionHref: "/audit", view: "audit", intent: { query } };
  if (path === "/settings") return { href, collectionHref: "/settings", view: "settings", intent: { query } };
  if (path === "/profile") return { href, collectionHref: "/profile", view: "profile", intent: { query } };
  if (path === "/" || path === "/notas") {
    return { href, collectionHref: "/", view: "dashboard", intent: { query, dashboard: path === "/notas" ? { section: "notes" } : undefined } };
  }
  return null;
}

function fallbackMessage(status: NotificationTargetStatus) {
  if (status === "ARCHIVED") return "O conteúdo original foi arquivado. Abrindo a visão relacionada.";
  if (status === "REMOVED") return "O conteúdo original não está mais disponível. Abrindo a visão relacionada.";
  return "Este conteúdo não está disponível para sua conta.";
}

function routeResult(route: KnownRoute, state: "READY" | "FALLBACK", status: NotificationTargetStatus, message: string | null): NotificationNavigationResult {
  return { state, targetStatus: status, href: route.href, view: route.view, intent: route.intent, message };
}

function unavailableResult(message = "Este conteúdo não está disponível para sua conta."): NotificationNavigationResult {
  return { state: "UNAVAILABLE", targetStatus: "FORBIDDEN_OR_MISSING", href: null, view: null, intent: { query: {} }, message };
}

export function resolveNotificationNavigation(source: NotificationNavigationSource): NotificationNavigationResult {
  const rawStatus = source.target?.status ?? source.targetStatus;
  const normalizedStatus = targetStatus(rawStatus);
  const status = rawStatus && !normalizedStatus ? "FORBIDDEN_OR_MISSING" : normalizedStatus ?? "AVAILABLE";
  const type = targetType(source.target?.type ?? source.entityType);
  const candidateHref = source.resolvedHref
    ?? source.target?.href
    ?? typedTargetHref(type, source.target?.params)
    ?? source.href;
  const candidateRoute = knownRoute(candidateHref);
  const explicitFallback = knownRoute(source.target?.fallbackHref ?? source.fallbackHref);
  const typeFallback = knownRoute(fallbackHrefForType(type));
  const routeFallback = candidateRoute ? knownRoute(candidateRoute.collectionHref) : null;
  const fallback = explicitFallback ?? typeFallback ?? routeFallback;

  if (status !== "AVAILABLE") {
    return fallback
      ? routeResult(fallback, "FALLBACK", status, fallbackMessage(status))
      : unavailableResult(fallbackMessage(status));
  }
  if (candidateRoute) return routeResult(candidateRoute, "READY", status, null);
  if (fallback) return routeResult(fallback, "FALLBACK", "FORBIDDEN_OR_MISSING", fallbackMessage("FORBIDDEN_OR_MISSING"));
  return unavailableResult();
}
