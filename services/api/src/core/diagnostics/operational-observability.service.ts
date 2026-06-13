import type { PrismaClient } from "@prisma/client";
import { snapshotHttpMetrics } from "./http-metrics.js";

function hoursAgo(hours: number) {
  return new Date(Date.now() - hours * 60 * 60 * 1000);
}

function dayAgo(days: number) {
  return hoursAgo(days * 24);
}

export async function getOperationalObservability(prisma: PrismaClient, organizationId: string) {
  const last24h = hoursAgo(24);
  const last7d = dayAgo(7);
  const routes = snapshotHttpMetrics();

  const [
    documents24h,
    approvals24h,
    rejections24h,
    extractionFailures24h,
    openFaqThreads,
    pendingWikiReviews,
    unreadNotifications,
    recentFailures,
    recentAuditLogs
  ] = await Promise.all([
    prisma.salesDocument.count({ where: { organizationId, createdAt: { gte: last24h } } }),
    prisma.salesDocument.count({ where: { organizationId, status: "APPROVED", reviewedAt: { gte: last24h } } }),
    prisma.salesDocument.count({ where: { organizationId, status: { in: ["REJECTED", "DUPLICATE"] }, reviewedAt: { gte: last24h } } }),
    prisma.auditLog.count({ where: { organizationId, action: "sales_document.extract_failed", createdAt: { gte: last24h } } }),
    prisma.faqThread.count({ where: { organizationId, status: "OPEN" } }),
    prisma.wikiEditRequest.count({ where: { organizationId, status: "PENDING" } }),
    prisma.inAppNotification.count({ where: { organizationId, readAt: null } }),
    prisma.auditLog.findMany({
      where: {
        organizationId,
        createdAt: { gte: last7d },
        action: { in: ["sales_document.extract_failed", "sales_document.manual_correction", "sales_document.extract_duplicate"] }
      },
      include: { actor: { select: { id: true, name: true, email: true, role: true } } },
      orderBy: { createdAt: "desc" },
      take: 8
    }),
    prisma.auditLog.findMany({
      where: { organizationId, createdAt: { gte: last24h } },
      include: { actor: { select: { id: true, name: true, email: true, role: true } } },
      orderBy: { createdAt: "desc" },
      take: 8
    })
  ]);

  return {
    generatedAt: new Date().toISOString(),
    windows: {
      last24h: last24h.toISOString(),
      last7d: last7d.toISOString()
    },
    metrics: {
      documents24h,
      approvals24h,
      rejections24h,
      extractionFailures24h,
      openFaqThreads,
      pendingWikiReviews,
      unreadNotifications,
      observedRoutes: routes.length
    },
    http: {
      slowestRoutes: routes.slice(0, 8),
      errorRoutes: routes.filter((route) => route.errorCount > 0).slice(0, 8)
    },
    recentFailures: recentFailures.map((item) => ({
      id: item.id,
      action: item.action,
      entityType: item.entityType,
      entityId: item.entityId,
      createdAt: item.createdAt.toISOString(),
      actor: item.actor,
      metadataJson: item.metadataJson
    })),
    recentAuditLogs: recentAuditLogs.map((item) => ({
      id: item.id,
      action: item.action,
      entityType: item.entityType,
      entityId: item.entityId,
      createdAt: item.createdAt.toISOString(),
      actor: item.actor
    }))
  };
}
