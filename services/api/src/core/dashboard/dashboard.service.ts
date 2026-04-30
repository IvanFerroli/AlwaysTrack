import type { Prisma, PrismaClient } from "@prisma/client";
import type { CurrentUser } from "@sylembra/shared";

export class DashboardError extends Error {
  constructor(public readonly code: "FORBIDDEN") {
    super(code);
  }
}

function scopedProfessionalWhere(actor: CurrentUser): Prisma.ProfessionalWhereInput {
  if (actor.role === "ADMIN") {
    return { organizationId: actor.organizationId };
  }

  if (actor.role === "RT") {
    return { organizationId: actor.organizationId, responsibleRtId: actor.id };
  }

  if (actor.role === "SUPERVISOR") {
    return {
      organizationId: actor.organizationId,
      OR: [
        actor.unitScopeIds.length ? { unitId: { in: actor.unitScopeIds } } : { id: "__no_unit_scope__" },
        actor.sectorScopeIds.length ? { sectorId: { in: actor.sectorScopeIds } } : { id: "__no_sector_scope__" }
      ]
    };
  }

  throw new DashboardError("FORBIDDEN");
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function startOfDay(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function countBy<T>(items: T[], keyFor: (item: T) => string) {
  const counts = new Map<string, number>();
  for (const item of items) {
    const key = keyFor(item);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return [...counts.entries()].map(([label, total]) => ({ label, total }));
}

export async function getDashboard(prisma: PrismaClient, actor: CurrentUser, today = new Date()) {
  const professionalScope = scopedProfessionalWhere(actor);
  const now = startOfDay(today);
  const in30Days = addDays(now, 30);
  const licenseScope: Prisma.LicenseWhereInput = { professional: professionalScope };
  const documentScope: Prisma.DocumentWhereInput = { professional: professionalScope };
  const notificationScope: Prisma.NotificationJobWhereInput = { professional: professionalScope };

  const [
    totalProfessionals,
    regularLicenses,
    expiringLicenses,
    expiredLicenses,
    pendingDocuments,
    pendingNotifications,
    sentNotifications,
    failedNotifications,
    expiringQueue,
    expiredQueue,
    pendingDocumentQueue,
    recentUploads,
    failedNotificationQueue
  ] = await Promise.all([
    prisma.professional.count({ where: professionalScope }),
    prisma.license.count({ where: { ...licenseScope, status: "REGULAR" } }),
    prisma.license.count({
      where: { ...licenseScope, status: "EXPIRING", expiresAt: { gte: now, lte: in30Days } }
    }),
    prisma.license.count({ where: { ...licenseScope, status: "EXPIRED" } }),
    prisma.document.count({ where: { ...documentScope, status: "UPLOADED" } }),
    prisma.notificationJob.count({ where: { ...notificationScope, status: { in: ["PENDING", "PROCESSING"] } } }),
    prisma.notificationJob.count({ where: { ...notificationScope, status: { in: ["SENT", "DELIVERED", "READ"] } } }),
    prisma.notificationJob.count({ where: { ...notificationScope, status: "FAILED" } }),
    prisma.license.findMany({
      where: { ...licenseScope, status: "EXPIRING", expiresAt: { gte: now, lte: in30Days } },
      include: {
        licenseType: true,
        professional: { include: { unit: true, sector: true, responsibleRt: { select: { id: true, name: true } } } }
      },
      orderBy: { expiresAt: "asc" },
      take: 10
    }),
    prisma.license.findMany({
      where: { ...licenseScope, status: "EXPIRED" },
      include: {
        licenseType: true,
        professional: { include: { unit: true, sector: true, responsibleRt: { select: { id: true, name: true } } } }
      },
      orderBy: { expiresAt: "asc" },
      take: 10
    }),
    prisma.document.findMany({
      where: { ...documentScope, status: "UPLOADED" },
      include: {
        professional: { include: { unit: true, sector: true, responsibleRt: { select: { id: true, name: true } } } },
        license: { include: { licenseType: true } }
      },
      orderBy: { createdAt: "desc" },
      take: 10
    }),
    prisma.document.findMany({
      where: documentScope,
      include: {
        professional: { include: { unit: true, sector: true } },
        license: { include: { licenseType: true } }
      },
      orderBy: { createdAt: "desc" },
      take: 10
    }),
    prisma.notificationJob.findMany({
      where: { ...notificationScope, status: "FAILED" },
      include: {
        professional: { include: { unit: true, sector: true, responsibleRt: { select: { id: true, name: true } } } },
        license: { include: { licenseType: true } }
      },
      orderBy: { updatedAt: "desc" },
      take: 10
    })
  ]);

  return {
    metrics: {
      totalProfessionals,
      licenses: {
        regular: regularLicenses,
        expiring: expiringLicenses,
        expired: expiredLicenses
      },
      documents: {
        pendingValidation: pendingDocuments
      },
      notifications: {
        pending: pendingNotifications,
        sent: sentNotifications,
        failed: failedNotifications
      }
    },
    queues: {
      expiringLicenses: expiringQueue,
      expiredLicenses: expiredQueue,
      pendingDocuments: pendingDocumentQueue,
      recentUploads,
      failedNotifications: failedNotificationQueue,
      expiredBySector: countBy(expiredQueue, (item) => item.professional.sector.name),
      pendingDocumentsByRt: countBy(pendingDocumentQueue, (item) => item.professional.responsibleRt?.name ?? "Sem RT"),
      pendingDocumentsByUnit: countBy(pendingDocumentQueue, (item) => item.professional.unit.name)
    }
  };
}
