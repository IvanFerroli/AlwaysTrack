import {
  normalizeNotificationTargetStatus,
  normalizeNotificationTargetType,
  notificationTargetFallbackHref,
  notificationTargetHref,
  type NotificationTargetStatus,
  type NotificationTargetType
} from "@alwaystrack/shared";

export type { NotificationTargetStatus, NotificationTargetType } from "@alwaystrack/shared";

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
  supportSchedules?: {
    date?: string;
    teamId?: string;
    userId?: string;
    scheduleId?: string;
    occurrenceId?: string;
    slotId?: string;
    claimId?: string;
    offerId?: string;
    at?: string;
    swapId?: string;
    tab?: string;
  };
  supportPauses?: { date?: string; teamId?: string; slotId?: string; bookingId?: string; swapId?: string; tab?: string };
  announcements?: { slug?: string; occurrenceId?: string };
  wiki?: { slug?: string };
  faq?: { status?: string; threadId?: string };
  supportCampaigns?: { campaignId?: string };
  supportPerformance?: { metric?: string; userId?: string; teamId?: string; legacySource?: "ranking" | "statements" };
  serviceFlows?: { flowId?: string };
  scriptLibrary?: {
    mode?: string;
    categoryId?: string;
    scriptId?: string;
    packId?: string;
    smartScriptState?: string;
    smartScriptId?: string;
    suggestionId?: string;
  };
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
          occurrenceId: queryValue(url.searchParams, "occurrenceId"),
          slotId: queryValue(url.searchParams, "slotId"),
          claimId: queryValue(url.searchParams, "claimId"),
          offerId: queryValue(url.searchParams, "offerId"),
          at: queryValue(url.searchParams, "at"),
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
  if (path === "/scriptoteca") {
    return {
      href,
      collectionHref: "/scriptoteca",
      view: "scriptLibrary",
      intent: {
        query,
        scriptLibrary: {
          mode: queryValue(url.searchParams, "mode"),
          categoryId: queryValue(url.searchParams, "categoryId"),
          scriptId: queryValue(url.searchParams, "scriptId"),
          packId: queryValue(url.searchParams, "packId"),
          smartScriptState: queryValue(url.searchParams, "smartScriptState"),
          smartScriptId: queryValue(url.searchParams, "smartScriptId"),
          suggestionId: queryValue(url.searchParams, "suggestionId")
        }
      }
    };
  }
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
  const normalizedStatus = normalizeNotificationTargetStatus(rawStatus);
  const status = rawStatus && !normalizedStatus ? "FORBIDDEN_OR_MISSING" : normalizedStatus ?? "AVAILABLE";
  const type = normalizeNotificationTargetType(source.target?.type ?? source.entityType);
  const targetHasHref = Boolean(source.target && Object.prototype.hasOwnProperty.call(source.target, "href"));
  const targetHasFallback = Boolean(source.target && Object.prototype.hasOwnProperty.call(source.target, "fallbackHref"));
  const candidateHref = source.resolvedHref
    ?? (targetHasHref ? source.target?.href : type ? notificationTargetHref(type, source.target?.params) : null)
    ?? source.href;
  const candidateRoute = knownRoute(candidateHref);
  const explicitFallback = knownRoute(targetHasFallback ? source.target?.fallbackHref : source.fallbackHref);
  const typeFallback = targetHasFallback ? null : knownRoute(notificationTargetFallbackHref(type));
  const routeFallback = targetHasFallback ? null : candidateRoute ? knownRoute(candidateRoute.collectionHref) : null;
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
