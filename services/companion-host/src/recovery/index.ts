export interface HostRecoveryState {
  organizationId: string;
  caseId: string;
  sessionId: string;
  flowVersion: string;
  lastStepKey: string;
  runs: readonly { runId: string; sessionId: string; flowVersion: string; status: "ACTIVE" | "WAITING_INTERVENTION" }[];
}

export interface HostRecoveryStore {
  read(organizationId: string, caseId: string): Promise<HostRecoveryState | undefined>;
  cancel(runId: string, reason: "ORPHANED_AFTER_RECOVERY"): Promise<void>;
}

export interface RecoveryTransport {
  resume(state: HostRecoveryState): Promise<void>;
}

export async function recoverHostCase(store: HostRecoveryStore, transport: RecoveryTransport, key: { organizationId: string; caseId: string; sessionId: string; flowVersion: string }) {
  const state = await store.read(key.organizationId, key.caseId);
  if (!state || state.sessionId !== key.sessionId) throw new Error("RECOVERY_NOT_FOUND");
  if (state.flowVersion !== key.flowVersion) throw new Error("FLOW_VERSION_MISMATCH");
  const orphaned = state.runs.filter((run) => run.sessionId !== key.sessionId || run.flowVersion !== key.flowVersion);
  await Promise.all(orphaned.map((run) => store.cancel(run.runId, "ORPHANED_AFTER_RECOVERY")));
  const recovered = { ...state, runs: state.runs.filter((run) => !orphaned.includes(run)) };
  await transport.resume(recovered);
  return recovered;
}
