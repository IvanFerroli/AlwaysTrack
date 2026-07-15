import { prisma } from "../core/db/prisma.js";
import { enqueuePrivacyLifecycleJob } from "../core/jobs/privacy-lifecycle.jobs.js";

const organizationId = process.env.PRIVACY_ORGANIZATION_ID?.trim();
const execute = process.env.PRIVACY_LIFECYCLE_MODE === "execute";
const confirmation = process.env.PRIVACY_EXECUTION_CONFIRMATION;

if (!organizationId) {
  throw new Error("PRIVACY_ORGANIZATION_ID is required; lifecycle jobs never run across all tenants.");
}
if (execute && confirmation !== `${organizationId}:PURGE_EXPIRED_DIAGNOSTICS`) {
  throw new Error("Execute mode requires tenant-bound PRIVACY_EXECUTION_CONFIRMATION.");
}

try {
  const result = await enqueuePrivacyLifecycleJob(prisma, {
    organizationId,
    dryRun: !execute,
    scheduledFor: new Date().toISOString()
  }, { confirmation });
  console.log(JSON.stringify({ job: result.job, result: result.result }));
} finally {
  await prisma.$disconnect();
}
