import { pathToFileURL } from "node:url";
import type { PrismaClient } from "@prisma/client";
import { loadEnv } from "../config/env.js";
import { parseScopeIds } from "../core/auth/scope.js";
import { prisma } from "../core/db/prisma.js";
import { getNotificationProvider } from "../core/notifications/provider.js";
import type { NotificationProvider } from "../core/notifications/provider.js";
import { processNotificationJobs, scanNotificationJobs } from "../core/notifications/notifications.service.js";

export async function runNotificationWorker(database: PrismaClient, provider: NotificationProvider, limit: number) {
  const admins = await database.user.findMany({
    where: { role: "ADMIN", active: true, organization: { active: true } },
    orderBy: [{ organizationId: "asc" }, { createdAt: "asc" }]
  });

  if (admins.length === 0) {
    throw new Error("No active ADMIN user available for notification job.");
  }

  const firstAdminByOrganization = new Map<string, (typeof admins)[number]>();
  for (const admin of admins) {
    if (!firstAdminByOrganization.has(admin.organizationId)) {
      firstAdminByOrganization.set(admin.organizationId, admin);
    }
  }

  const organizations = [];
  for (const admin of firstAdminByOrganization.values()) {
    const actor = {
      id: admin.id,
      organizationId: admin.organizationId,
      name: admin.name,
      email: admin.email,
      role: "ADMIN" as const,
      unitScopeIds: parseScopeIds(admin.unitScopeJson),
      sectorScopeIds: parseScopeIds(admin.sectorScopeJson)
    };
    try {
      const scanResult = await scanNotificationJobs(database, actor, {});
      const processResult = await processNotificationJobs(database, actor, provider, limit);
      organizations.push({
        organizationId: admin.organizationId,
        scanned: scanResult.created.length,
        skipped: scanResult.skipped,
        processed: processResult.processed.length
      });
    } catch (error) {
      organizations.push({
        organizationId: admin.organizationId,
        scanned: 0,
        skipped: [],
        processed: 0,
        error: error instanceof Error ? error.message : "UNKNOWN_NOTIFICATION_WORKER_ERROR"
      });
    }
  }

  return {
    organizations,
    scanned: organizations.reduce((total, organization) => total + organization.scanned, 0),
    skipped: organizations.flatMap((organization) =>
      organization.skipped.map((item) => ({ organizationId: organization.organizationId, ...item }))
    ),
    processed: organizations.reduce((total, organization) => total + organization.processed, 0),
    failures: organizations.filter((organization) => "error" in organization)
  };
}

async function main() {
  const env = loadEnv();
  const result = await runNotificationWorker(prisma, getNotificationProvider(), env.notificationJobLimit);
  console.log(JSON.stringify(result));
  if (result.failures.length > 0) process.exitCode = 1;
}

const isMainModule = process.argv[1] ? import.meta.url === pathToFileURL(process.argv[1]).href : false;
if (isMainModule) {
  main()
    .catch((error) => {
      console.error(error instanceof Error ? error.message : error);
      process.exitCode = 1;
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
