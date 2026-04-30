import { loadEnv } from "../config/env.js";
import { parseScopeIds } from "../core/auth/scope.js";
import { prisma } from "../core/db/prisma.js";
import { getNotificationProvider } from "../core/notifications/provider.js";
import { processNotificationJobs, scanNotificationJobs } from "../core/notifications/notifications.service.js";

async function main() {
  const env = loadEnv();
  const admin = await prisma.user.findFirst({
    where: { role: "ADMIN", active: true },
    orderBy: { createdAt: "asc" }
  });

  if (!admin) {
    throw new Error("No active ADMIN user available for notification job.");
  }

  const actor = {
    id: admin.id,
    organizationId: admin.organizationId,
    name: admin.name,
    email: admin.email,
    role: "ADMIN" as const,
    unitScopeIds: parseScopeIds(admin.unitScopeJson),
    sectorScopeIds: parseScopeIds(admin.sectorScopeJson)
  };

  const scanResult = await scanNotificationJobs(prisma, actor, {});
  const processResult = await processNotificationJobs(prisma, actor, getNotificationProvider(), env.notificationJobLimit);

  console.log(
    JSON.stringify({
      scanned: scanResult.created.length,
      skipped: scanResult.skipped,
      processed: processResult.processed.length
    })
  );
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
