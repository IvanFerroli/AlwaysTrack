export interface RecoverySnapshot {
  organizationId: string;
  caseId: string;
  sessionId: string;
  flowVersion: string;
  lastStepKey: string;
  updatedAt: string;
}

export interface RecoveryStorage {
  load(organizationId: string, caseId: string): Promise<RecoverySnapshot | undefined>;
  listActiveRuns(organizationId: string, caseId: string): Promise<readonly { runId: string; sessionId: string; flowVersion: string }[]>;
  cancelRun(runId: string, reason: "ORPHANED_AFTER_RECOVERY"): Promise<void>;
}

export class RecoveryError extends Error {}

export async function rehydrateCase(storage: RecoveryStorage, input: { organizationId: string; caseId: string; sessionId: string; flowVersion: string }) {
  const snapshot = await storage.load(input.organizationId, input.caseId);
  if (!snapshot || snapshot.sessionId !== input.sessionId) throw new RecoveryError("RECOVERY_NOT_FOUND");
  if (snapshot.flowVersion !== input.flowVersion) throw new RecoveryError("FLOW_VERSION_MISMATCH");
  const runs = await storage.listActiveRuns(input.organizationId, input.caseId);
  const orphanedRunIds = runs.filter((run) => run.sessionId !== snapshot.sessionId || run.flowVersion !== snapshot.flowVersion).map((run) => run.runId);
  await Promise.all(orphanedRunIds.map((runId) => storage.cancelRun(runId, "ORPHANED_AFTER_RECOVERY")));
  return { snapshot, orphanedRunIds };
}
