import type { PrismaClient } from "@prisma/client";
import {
  canonicalNotificationTarget,
  canUseCommercialPermission,
  deriveNotificationTarget,
  normalizeNotificationTargetType,
  supportOperationsRoles,
  type CanonicalNotificationTarget,
  type CurrentUser,
  type NotificationTargetParams,
  type NotificationTargetStatus,
  type NotificationTargetType
} from "@alwaystrack/shared";

interface StoredNotificationTarget {
  type: string;
  entityType: string | null;
  entityId: string | null;
  href: string | null;
  targetType: string | null;
  targetParamsJson: string | null;
}

export interface NotificationTargetResolution {
  target: (CanonicalNotificationTarget & { type: NotificationTargetType }) | {
    type: NotificationTargetType | null;
    status: "FORBIDDEN_OR_MISSING";
    params: Record<string, never>;
    href: null;
    fallbackHref: null;
  };
}

interface EntityResolution {
  status: NotificationTargetStatus;
  params: NotificationTargetParams;
}

function parsedParams(value: string | null) {
  if (!value) return undefined;
  try {
    const parsed = JSON.parse(value) as unknown;
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : undefined;
  } catch {
    return undefined;
  }
}

function forbiddenOrMissing(type: NotificationTargetType | null = null): NotificationTargetResolution {
  return { target: { type, status: "FORBIDDEN_OR_MISSING", params: {}, href: null, fallbackHref: null } };
}

function targetRoleAllowed(actor: CurrentUser, type: NotificationTargetType) {
  if (type === "SUPPORT_SCHEDULE" || type === "SUPPORT_PAUSE" || type === "SUPPORT_CAMPAIGN" || type === "SUPPORT_PERFORMANCE") {
    return (supportOperationsRoles as readonly string[]).includes(actor.role);
  }
  if (type === "SALES_DOCUMENT") return canUseCommercialPermission(actor.role, "sales.read");
  if (type === "SCRIPT_LIBRARY") return canUseCommercialPermission(actor.role, "scriptLibrary.read");
  if (type === "ANNOUNCEMENT") return canUseCommercialPermission(actor.role, "announcements.read");
  if (type === "PROFILE") return canUseCommercialPermission(actor.role, "profile.manageSelf");
  return canUseCommercialPermission(actor.role, "knowledge.read");
}

function isManager(actor: CurrentUser) {
  return actor.role === "ADMIN" || actor.role === "GESTOR";
}

function statusFrom(value: string | null | undefined, archived: readonly string[], removed: readonly string[] = ["REMOVED", "DELETED"]) {
  const normalized = value?.toUpperCase();
  if (normalized && removed.includes(normalized)) return "REMOVED" as const;
  if (normalized && archived.includes(normalized)) return "ARCHIVED" as const;
  return "AVAILABLE" as const;
}

function localDate(value: Date, timezone = "America/Sao_Paulo") {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(value);
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

async function hasSupportTeamAccess(
  prisma: PrismaClient,
  actor: CurrentUser,
  teamId: string | null | undefined,
  involvedUserIds: Array<string | null | undefined> = []
) {
  if (isManager(actor)) return true;
  if (actor.role !== "SAC" || !teamId) return false;
  if (involvedUserIds.includes(actor.id)) return true;
  const now = new Date();
  const membership = await prisma.supportTeamMembership.findFirst({
    where: {
      organizationId: actor.organizationId,
      teamId,
      userId: actor.id,
      validFrom: { lte: now },
      OR: [{ validTo: null }, { validTo: { gt: now } }]
    },
    select: { id: true }
  });
  return Boolean(membership);
}

async function resolveSupportSchedule(
  prisma: PrismaClient,
  actor: CurrentUser,
  source: StoredNotificationTarget,
  params: NotificationTargetParams
): Promise<EntityResolution | null> {
  const id = source.entityId;
  if (!id) return null;
  if (source.entityType === "SupportExtraShiftSlot") {
    const item = await prisma.supportExtraShiftSlot.findFirst({
      where: { id, organizationId: actor.organizationId },
      select: { id: true, teamId: true, startsAt: true, status: true, ruleVersion: { select: { timezone: true } } }
    });
    if (!item || !(await hasSupportTeamAccess(prisma, actor, item.teamId))) return null;
    return {
      status: statusFrom(item.status, ["CANCELLED", "EXPIRED", "ARCHIVED"]),
      params: { slotId: item.id, teamId: item.teamId, date: localDate(item.startsAt, item.ruleVersion.timezone), at: item.startsAt.toISOString(), tab: "extras" }
    };
  }
  if (source.entityType === "SupportExtraShiftClaim") {
    const item = await prisma.supportExtraShiftClaim.findFirst({
      where: { id, organizationId: actor.organizationId },
      select: {
        id: true,
        teamId: true,
        userId: true,
        status: true,
        slot: { select: { startsAt: true, ruleVersion: { select: { timezone: true } } } }
      }
    });
    if (!item || !(await hasSupportTeamAccess(prisma, actor, item.teamId, [item.userId]))) return null;
    return {
      status: statusFrom(item.status, ["CANCELLED", "EXPIRED", "REJECTED", "ARCHIVED"]),
      params: { claimId: item.id, teamId: item.teamId, date: localDate(item.slot.startsAt, item.slot.ruleVersion.timezone), at: item.slot.startsAt.toISOString(), tab: "extras" }
    };
  }
  if (source.entityType === "SupportShiftOffer") {
    const item = await prisma.supportShiftOffer.findFirst({
      where: { id, organizationId: actor.organizationId },
      select: {
        id: true,
        teamId: true,
        offeredById: true,
        targetUserId: true,
        status: true,
        occurrence: { select: { localDate: true, startsAt: true } }
      }
    });
    if (!item || !(await hasSupportTeamAccess(prisma, actor, item.teamId, [item.offeredById, item.targetUserId]))) return null;
    return {
      status: statusFrom(item.status, ["CANCELLED", "EXPIRED", "REJECTED", "ARCHIVED"]),
      params: { offerId: item.id, teamId: item.teamId, date: item.occurrence.localDate, at: item.occurrence.startsAt.toISOString(), tab: "trocas" }
    };
  }
  if (source.entityType === "SupportShiftOccurrence") {
    const item = await prisma.supportShiftOccurrence.findFirst({
      where: { id, organizationId: actor.organizationId },
      select: { id: true, teamId: true, userId: true, localDate: true, status: true }
    });
    if (!item || !(await hasSupportTeamAccess(prisma, actor, item.teamId, [item.userId]))) return null;
    return { status: statusFrom(item.status, ["CANCELLED", "ARCHIVED"]), params: { occurrenceId: item.id, teamId: item.teamId, date: item.localDate, tab: "calendario" } };
  }
  if (source.entityType === "SupportShiftAssignment") {
    const item = await prisma.supportShiftAssignment.findFirst({
      where: { id, organizationId: actor.organizationId },
      select: { id: true, teamId: true, userId: true, active: true }
    });
    if (!item || !(await hasSupportTeamAccess(prisma, actor, item.teamId, [item.userId]))) return null;
    return { status: item.active ? "AVAILABLE" : "ARCHIVED", params: { ...params, scheduleId: item.id, teamId: item.teamId, userId: item.userId, tab: "calendario" } };
  }
  return null;
}

async function resolveSupportPause(prisma: PrismaClient, actor: CurrentUser, source: StoredNotificationTarget): Promise<EntityResolution | null> {
  const id = source.entityId;
  if (!id) return null;
  if (source.entityType === "SupportPauseSlot") {
    const item = await prisma.supportPauseSlot.findFirst({
      where: { id, organizationId: actor.organizationId },
      select: { id: true, teamId: true, startsAt: true, active: true }
    });
    if (!item || !(await hasSupportTeamAccess(prisma, actor, item.teamId))) return null;
    return { status: item.active ? "AVAILABLE" : "ARCHIVED", params: { slotId: item.id, ...(item.teamId ? { teamId: item.teamId } : {}), date: localDate(item.startsAt) } };
  }
  if (source.entityType === "SupportPauseBooking") {
    const item = await prisma.supportPauseBooking.findFirst({
      where: { id, organizationId: actor.organizationId },
      select: { id: true, userId: true, status: true, slot: { select: { id: true, teamId: true, startsAt: true } } }
    });
    if (!item || !(await hasSupportTeamAccess(prisma, actor, item.slot.teamId, [item.userId]))) return null;
    return {
      status: statusFrom(item.status, ["CANCELLED", "ARCHIVED"]),
      params: { bookingId: item.id, slotId: item.slot.id, ...(item.slot.teamId ? { teamId: item.slot.teamId } : {}), date: localDate(item.slot.startsAt) }
    };
  }
  if (source.entityType === "SupportPauseSwap") {
    const item = await prisma.supportPauseSwap.findFirst({
      where: { id, organizationId: actor.organizationId },
      select: {
        id: true,
        requestedById: true,
        status: true,
        requesterBooking: { select: { userId: true, slot: { select: { teamId: true, startsAt: true } } } },
        targetBooking: { select: { userId: true } }
      }
    });
    const teamId = item?.requesterBooking.slot.teamId;
    if (!item || !(await hasSupportTeamAccess(prisma, actor, teamId, [item.requestedById, item.requesterBooking.userId, item.targetBooking.userId]))) return null;
    return {
      status: statusFrom(item.status, ["CANCELLED", "EXPIRED", "REJECTED", "ARCHIVED"]),
      params: { swapId: item.id, ...(teamId ? { teamId } : {}), date: localDate(item.requesterBooking.slot.startsAt), tab: "swaps" }
    };
  }
  return null;
}

function parseStringArray(value: string | null | undefined) {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

async function resolveAnnouncement(prisma: PrismaClient, actor: CurrentUser, source: StoredNotificationTarget): Promise<EntityResolution | null> {
  const id = source.entityId;
  if (!id) return null;
  const occurrence = source.entityType === "AnnouncementOccurrence"
    ? await prisma.announcementOccurrence.findFirst({
        where: { id, organizationId: actor.organizationId },
        select: { id: true, status: true, announcement: { select: { id: true, slug: true, status: true, archivedAt: true, startsAt: true, expiresAt: true, targetRolesJson: true } } }
      })
    : null;
  const announcement = occurrence?.announcement ?? await prisma.announcement.findFirst({
    where: { id, organizationId: actor.organizationId },
    select: { id: true, slug: true, status: true, archivedAt: true, startsAt: true, expiresAt: true, targetRolesJson: true }
  });
  if (!announcement) return null;
  const targetRoles = parseStringArray(announcement.targetRolesJson);
  if (!isManager(actor) && targetRoles.length > 0 && !targetRoles.includes(actor.role)) return null;
  const archived = announcement.archivedAt || announcement.status === "ARCHIVED" || (announcement.expiresAt && announcement.expiresAt < new Date());
  if (!isManager(actor) && !archived && (announcement.status !== "PUBLISHED" || (announcement.startsAt && announcement.startsAt > new Date()))) return null;
  const status = archived ? "ARCHIVED" : statusFrom(announcement.status, []);
  return {
    status,
    params: { announcementId: announcement.id, slug: announcement.slug, ...(occurrence ? { occurrenceId: occurrence.id } : {}) }
  };
}

async function resolveWikiPage(prisma: PrismaClient, actor: CurrentUser, source: StoredNotificationTarget, params: NotificationTargetParams): Promise<EntityResolution | null> {
  if (source.entityType === "WikiPage" && source.entityId) {
    const page = await prisma.wikiPage.findFirst({ where: { id: source.entityId, organizationId: actor.organizationId }, select: { id: true, slug: true, active: true } });
    return page ? { status: page.active ? "AVAILABLE" : "ARCHIVED", params: { pageId: page.id, slug: page.slug } } : null;
  }
  if (source.entityType === "WikiEditRequest" && source.entityId) {
    const request = await prisma.wikiEditRequest.findFirst({
      where: { id: source.entityId, organizationId: actor.organizationId },
      select: { id: true, authorId: true, page: { select: { id: true, slug: true, active: true } } }
    });
    if (!request || (actor.role !== "ADMIN" && request.authorId !== actor.id)) return null;
    return { status: request.page.active ? "AVAILABLE" : "ARCHIVED", params: { requestId: request.id, pageId: request.page.id, slug: request.page.slug } };
  }
  const faqThreadId = params.faqThreadId ?? (source.entityType === "FaqThread" ? source.entityId : null);
  if (faqThreadId) {
    const thread = await prisma.faqThread.findFirst({
      where: { id: faqThreadId, organizationId: actor.organizationId },
      select: { id: true, wikiPage: { select: { id: true, slug: true, active: true } } }
    });
    if (!thread?.wikiPage) return null;
    return {
      status: thread.wikiPage.active ? "AVAILABLE" : "ARCHIVED",
      params: { faqThreadId: thread.id, pageId: thread.wikiPage.id, slug: thread.wikiPage.slug }
    };
  }
  return null;
}

async function resolveFaqThread(prisma: PrismaClient, actor: CurrentUser, source: StoredNotificationTarget): Promise<EntityResolution | null> {
  if (!source.entityId) return null;
  const thread = await prisma.faqThread.findFirst({
    where: { id: source.entityId, organizationId: actor.organizationId },
    select: { id: true, status: true }
  });
  if (!thread) return null;
  return { status: statusFrom(thread.status, ["ARCHIVED"]), params: { threadId: thread.id, status: thread.status } };
}

async function resolveSupportCampaign(prisma: PrismaClient, actor: CurrentUser, source: StoredNotificationTarget): Promise<EntityResolution | null> {
  if (!source.entityId) return null;
  const campaign = await prisma.supportCampaign.findFirst({
    where: { id: source.entityId, organizationId: actor.organizationId },
    select: { id: true, status: true, scopeType: true, userId: true, teamId: true, audienceSnapshotJson: true }
  });
  if (!campaign) return null;
  if (!isManager(actor)) {
    if (campaign.status === "DRAFT") return null;
    let audienceIds: string[] = [];
    try {
      const snapshot = campaign.audienceSnapshotJson ? JSON.parse(campaign.audienceSnapshotJson) as { members?: Array<{ id?: unknown }> } : null;
      audienceIds = snapshot?.members?.flatMap((member) => typeof member.id === "string" ? [member.id] : []) ?? [];
    } catch {
      audienceIds = [];
    }
    const inScope = audienceIds.length > 0
      ? audienceIds.includes(actor.id)
      : campaign.scopeType === "ORGANIZATION"
        || (campaign.scopeType === "USER" && campaign.userId === actor.id)
        || (campaign.scopeType === "TEAM" && await hasSupportTeamAccess(prisma, actor, campaign.teamId));
    if (!inScope) return null;
  }
  return { status: statusFrom(campaign.status, ["ARCHIVED"]), params: { campaignId: campaign.id } };
}

async function resolveSupportPerformance(prisma: PrismaClient, actor: CurrentUser, source: StoredNotificationTarget): Promise<EntityResolution | null> {
  if (!source.entityId) return null;
  const entry = await prisma.supportKpiEntry.findFirst({
    where: { id: source.entityId, organizationId: actor.organizationId },
    select: { id: true, metric: true, scopeType: true, userId: true, teamId: true, status: true, archivedAt: true }
  });
  if (!entry) return null;
  if (!isManager(actor)) {
    if (entry.status !== "APPROVED") return null;
    const inScope = entry.scopeType === "ORGANIZATION"
      || entry.userId === actor.id
      || (entry.scopeType === "TEAM" && await hasSupportTeamAccess(prisma, actor, entry.teamId));
    if (!inScope) return null;
  }
  return {
    status: entry.archivedAt ? "ARCHIVED" : statusFrom(entry.status, ["ARCHIVED"]),
    params: { entryId: entry.id, metric: entry.metric, ...(entry.userId ? { userId: entry.userId } : {}), ...(entry.teamId ? { teamId: entry.teamId } : {}) }
  };
}

async function resolveServiceFlow(prisma: PrismaClient, actor: CurrentUser, source: StoredNotificationTarget): Promise<EntityResolution | null> {
  if (!source.entityId) return null;
  const flow = await prisma.serviceFlow.findFirst({
    where: { id: source.entityId, organizationId: actor.organizationId },
    select: { id: true, slug: true, status: true }
  });
  if (!flow || (!isManager(actor) && flow.status !== "PUBLISHED" && flow.status !== "ARCHIVED")) return null;
  return { status: statusFrom(flow.status, ["ARCHIVED"]), params: { flowId: flow.id, slug: flow.slug } };
}

async function resolveScriptLibrary(prisma: PrismaClient, actor: CurrentUser, source: StoredNotificationTarget): Promise<EntityResolution | null> {
  if (!source.entityId) return null;
  if (source.entityType === "OperationalScriptSuggestion") {
    const suggestion = await prisma.operationalScriptSuggestion.findFirst({
      where: { id: source.entityId, organizationId: actor.organizationId },
      select: { id: true, authorId: true }
    });
    if (!suggestion || (!isManager(actor) && actor.role !== "SUPERVISOR" && suggestion.authorId !== actor.id)) return null;
    return { status: "AVAILABLE", params: { suggestionId: suggestion.id } };
  }
  if (source.entityType === "OperationalScript") {
    const script = await prisma.operationalScript.findFirst({
      where: { id: source.entityId, organizationId: actor.organizationId },
      select: { id: true, status: true }
    });
    if (!script || (!isManager(actor) && script.status !== "VALIDATED" && script.status !== "OBSOLETE")) return null;
    return { status: statusFrom(script.status, ["OBSOLETE", "ARCHIVED"]), params: { scriptId: script.id } };
  }
  return null;
}

async function resolveSalesDocument(prisma: PrismaClient, actor: CurrentUser, source: StoredNotificationTarget): Promise<EntityResolution | null> {
  if (!source.entityId) return null;
  const sellerScope = actor.role === "VENDEDOR"
    ? { userId: actor.id }
    : actor.role === "SUPERVISOR"
      ? { salesGroup: { supervisorId: actor.id } }
      : {};
  const document = await prisma.salesDocument.findFirst({
    where: { id: source.entityId, organizationId: actor.organizationId, sellerProfile: sellerScope },
    select: { id: true, status: true }
  });
  return document ? { status: statusFrom(document.status, ["ARCHIVED"]), params: { documentId: document.id } } : null;
}

async function resolveProfile(prisma: PrismaClient, actor: CurrentUser, source: StoredNotificationTarget): Promise<EntityResolution | null> {
  const userId = source.entityId ?? actor.id;
  if (userId !== actor.id) return null;
  const user = await prisma.user.findFirst({ where: { id: userId, organizationId: actor.organizationId }, select: { id: true, active: true } });
  return user?.active ? { status: "AVAILABLE", params: { userId: user.id } } : null;
}

async function resolveEntity(
  prisma: PrismaClient,
  actor: CurrentUser,
  source: StoredNotificationTarget,
  type: NotificationTargetType,
  params: NotificationTargetParams
) {
  if (type === "SUPPORT_SCHEDULE") return resolveSupportSchedule(prisma, actor, source, params);
  if (type === "SUPPORT_PAUSE") return resolveSupportPause(prisma, actor, source);
  if (type === "ANNOUNCEMENT") return resolveAnnouncement(prisma, actor, source);
  if (type === "WIKI_PAGE") return resolveWikiPage(prisma, actor, source, params);
  if (type === "FAQ_THREAD") return resolveFaqThread(prisma, actor, source);
  if (type === "SUPPORT_CAMPAIGN") return resolveSupportCampaign(prisma, actor, source);
  if (type === "SUPPORT_PERFORMANCE") return resolveSupportPerformance(prisma, actor, source);
  if (type === "SERVICE_FLOW") return resolveServiceFlow(prisma, actor, source);
  if (type === "SCRIPT_LIBRARY") return resolveScriptLibrary(prisma, actor, source);
  if (type === "SALES_DOCUMENT") return resolveSalesDocument(prisma, actor, source);
  return resolveProfile(prisma, actor, source);
}

export async function resolveStoredNotificationTarget(
  prisma: PrismaClient,
  actor: CurrentUser,
  source: StoredNotificationTarget
): Promise<NotificationTargetResolution> {
  const persistedType = normalizeNotificationTargetType(source.targetType);
  const derived = deriveNotificationTarget({
    type: persistedType,
    notificationType: source.type,
    entityType: source.entityType,
    entityId: source.entityId,
    href: source.href,
    params: parsedParams(source.targetParamsJson)
  });
  if (!derived || (!persistedType && !source.entityId) || !targetRoleAllowed(actor, derived.type)) return forbiddenOrMissing(derived?.type ?? null);
  const entity = await resolveEntity(prisma, actor, source, derived.type, derived.params);
  if (!entity) return forbiddenOrMissing(derived.type);
  return { target: canonicalNotificationTarget(derived.type, entity.status, entity.params) };
}

export async function resolveInAppNotificationTarget(prisma: PrismaClient, actor: CurrentUser, notificationId: string) {
  const notification = await prisma.inAppNotification.findFirst({
    where: { id: notificationId, organizationId: actor.organizationId, recipientId: actor.id },
    select: {
      type: true,
      entityType: true,
      entityId: true,
      href: true,
      targetType: true,
      targetParamsJson: true
    }
  });
  if (!notification) return forbiddenOrMissing();
  return resolveStoredNotificationTarget(prisma, actor, notification);
}
