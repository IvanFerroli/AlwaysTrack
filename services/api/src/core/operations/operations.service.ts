import type { Prisma, PrismaClient } from "@prisma/client";
import type { CurrentUser } from "@alwaystrack/shared";
import { getSalesRanking } from "../sales-documents/sales-documents.service.js";

function startOfUtcDay(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function endOfUtcDay(date: Date) {
  const end = startOfUtcDay(date);
  end.setUTCHours(23, 59, 59, 999);
  return end;
}

function addUtcDays(date: Date, days: number) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function isoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function sellerScopeWhere(actor: CurrentUser): Prisma.SellerProfileWhereInput {
  if (["ADMIN", "GESTOR", "SAC", "FINANCEIRO"].includes(actor.role)) return { organizationId: actor.organizationId };
  if (actor.role === "VENDEDOR") return { organizationId: actor.organizationId, userId: actor.id };
  if (actor.role === "SUPERVISOR") return { organizationId: actor.organizationId, salesGroup: { supervisorId: actor.id } };
  return { organizationId: "__forbidden__" };
}

function salesDocumentScopeWhere(actor: CurrentUser): Prisma.SalesDocumentWhereInput {
  return {
    organizationId: actor.organizationId,
    sellerProfile: sellerScopeWhere(actor)
  };
}

function canSeeKnowledgeReviewQueue(actor: CurrentUser) {
  return ["ADMIN", "GESTOR", "SUPERVISOR"].includes(actor.role);
}

function announcementScopeWhere(actor: CurrentUser, today: Date): Prisma.AnnouncementWhereInput {
  return {
    organizationId: actor.organizationId,
    status: "PUBLISHED",
    OR: [{ startsAt: null }, { startsAt: { lte: today } }],
    AND: [{ OR: [{ expiresAt: null }, { expiresAt: { gte: today } }] }],
    targetRolesJson: { contains: `"${actor.role}"` }
  };
}

/** Aggregates the operational state used by the executive "Hoje" dashboard. */
export async function getOperationalToday(prisma: PrismaClient, actor: CurrentUser, today = new Date()) {
  const dayStart = startOfUtcDay(today);
  const dayEnd = endOfUtcDay(today);
  const todayText = isoDate(dayStart);
  const documentScope = salesDocumentScopeWhere(actor);
  const managerKnowledgeScope = canSeeKnowledgeReviewQueue(actor);
  const campaignScope: Prisma.SalesCampaignWhereInput = {
    organizationId: actor.organizationId,
    status: "ACTIVE",
    startsAt: { lte: dayEnd },
    endsAt: { gte: dayStart },
    salesGroup: actor.role === "SUPERVISOR" ? { supervisorId: actor.id } : undefined
  };
  const announcementScope = announcementScopeWhere(actor, dayEnd);

  const [
    pendingDocuments,
    approvedToday,
    rejectedToday,
    duplicates,
    extractionFailuresToday,
    pendingQueue,
    activeCampaigns,
    campaignsEndingSoon,
    wikiPendingReviews,
    wikiPendingQueue,
    faqUnanswered,
    faqUnansweredQueue,
    unreadNotifications,
    unreadNotificationQueue,
    activeAnnouncements,
    announcementQueue,
    criticalAnnouncements,
    ranking
  ] = await Promise.all([
    prisma.salesDocument.count({ where: { ...documentScope, status: { in: ["UPLOADED", "EXTRACTING", "PENDING_REVIEW"] } } }),
    prisma.salesDocument.count({ where: { ...documentScope, status: "APPROVED", reviewedAt: { gte: dayStart, lte: dayEnd } } }),
    prisma.salesDocument.count({ where: { ...documentScope, status: "REJECTED", reviewedAt: { gte: dayStart, lte: dayEnd } } }),
    prisma.salesDocument.count({ where: { ...documentScope, status: "DUPLICATE" } }),
    prisma.auditLog.count({
      where: {
        organizationId: actor.organizationId,
        action: "sales_document.extract_failed",
        createdAt: { gte: dayStart, lte: dayEnd }
      }
    }),
    prisma.salesDocument.findMany({
      where: { ...documentScope, status: { in: ["UPLOADED", "EXTRACTING", "PENDING_REVIEW"] } },
      include: { sellerProfile: { include: { salesGroup: true } } },
      orderBy: [{ status: "asc" }, { createdAt: "asc" }],
      take: 5
    }),
    prisma.salesCampaign.findMany({
      where: campaignScope,
      include: { salesGroup: true },
      orderBy: [{ endsAt: "asc" }, { name: "asc" }],
      take: 5
    }),
    prisma.salesCampaign.count({
      where: {
        ...campaignScope,
        endsAt: { gte: dayStart, lte: endOfUtcDay(addUtcDays(dayStart, 7)) }
      }
    }),
    managerKnowledgeScope ? prisma.wikiEditRequest.count({ where: { organizationId: actor.organizationId, status: "PENDING" } }) : Promise.resolve(0),
    managerKnowledgeScope
      ? prisma.wikiEditRequest.findMany({
          where: { organizationId: actor.organizationId, status: "PENDING" },
          include: { page: { select: { id: true, slug: true, title: true } }, author: { select: { id: true, name: true, role: true } } },
          orderBy: { createdAt: "asc" },
          take: 5
        })
      : Promise.resolve([]),
    prisma.faqThread.count({ where: { organizationId: actor.organizationId, status: "OPEN", comments: { none: {} } } }),
    prisma.faqThread.findMany({
      where: { organizationId: actor.organizationId, status: "OPEN", comments: { none: {} } },
      include: { author: { select: { id: true, name: true, role: true } } },
      orderBy: { createdAt: "asc" },
      take: 5
    }),
    prisma.inAppNotification.count({ where: { organizationId: actor.organizationId, recipientId: actor.id, readAt: null } }),
    prisma.inAppNotification.findMany({
      where: { organizationId: actor.organizationId, recipientId: actor.id, readAt: null },
      orderBy: { createdAt: "desc" },
      take: 5
    }),
    prisma.announcement.count({ where: announcementScope }),
    prisma.announcement.findMany({
      where: announcementScope,
      orderBy: [{ pinned: "desc" }, { priority: "desc" }, { publishedAt: "desc" }],
      take: 3
    }),
    prisma.announcement.count({ where: { ...announcementScope, priority: { in: ["HIGH", "CRITICAL"] } } }),
    getSalesRanking(prisma, actor, { from: todayText, to: todayText })
  ]);

  const alerts = [
    extractionFailuresToday > 0
      ? { severity: "danger", title: "Falhas de extracao hoje", detail: `${extractionFailuresToday} evento(s) precisam de diagnostico.`, target: "notes" }
      : null,
    duplicates > 0 ? { severity: "warning", title: "Duplicidades detectadas", detail: `${duplicates} nota(s) marcadas como duplicadas.`, target: "notes" } : null,
    wikiPendingReviews > 0
      ? { severity: "info", title: "Wiki aguardando revisao", detail: `${wikiPendingReviews} proposta(s) pendente(s).`, target: "wiki" }
      : null,
    faqUnanswered > 0 ? { severity: "info", title: "FAQ sem resposta", detail: `${faqUnanswered} pergunta(s) aberta(s).`, target: "faq" } : null,
    campaignsEndingSoon > 0
      ? { severity: "warning", title: "Campanhas perto do fim", detail: `${campaignsEndingSoon} campanha(s) encerram em ate 7 dias.`, target: "campaigns" }
      : null,
    criticalAnnouncements > 0
      ? { severity: "warning", title: "Avisos importantes", detail: `${criticalAnnouncements} comunicado(s) de alta prioridade para hoje.`, target: "announcements" }
      : null
  ].filter(Boolean);

  return {
    generatedAt: new Date().toISOString(),
    period: { today: todayText, from: todayText, to: todayText },
    metrics: {
      pendingDocuments,
      approvedToday,
      rejectedToday,
      duplicates,
      extractionFailuresToday,
      activeCampaigns: activeCampaigns.length,
      campaignsEndingSoon,
      wikiPendingReviews,
      faqUnanswered,
      unreadNotifications,
      activeAnnouncements
    },
    queues: {
      pendingDocuments: pendingQueue,
      ranking: ranking.items.slice(0, 5),
      activeCampaigns,
      wikiPendingReviews: wikiPendingQueue,
      faqUnanswered: faqUnansweredQueue,
      unreadNotifications: unreadNotificationQueue,
      activeAnnouncements: announcementQueue,
      alerts
    }
  };
}
