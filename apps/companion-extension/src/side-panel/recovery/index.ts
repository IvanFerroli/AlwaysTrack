export interface SidePanelRecoverySnapshot {
  organizationId: string;
  caseId: string;
  sessionId: string;
  flowVersion: string;
  lastStepKey: string;
  savedAt: string;
}

export interface SidePanelRecoveryStorage {
  get(key: string): Promise<SidePanelRecoverySnapshot | undefined>;
  set(key: string, value: SidePanelRecoverySnapshot): Promise<void>;
  remove(key: string): Promise<void>;
}

export interface SidePanelRecoveryTransport {
  rehydrate(input: { organizationId: string; caseId: string; sessionId: string; flowVersion: string }): Promise<{ snapshot: SidePanelRecoverySnapshot }>;
}

const keyFor = (organizationId: string, caseId: string) => `case-flow-recovery:${organizationId}:${caseId}`;

export class SidePanelRecovery {
  constructor(private readonly storage: SidePanelRecoveryStorage, private readonly transport: SidePanelRecoveryTransport, private readonly now: () => Date = () => new Date()) {}

  async checkpoint(snapshot: Omit<SidePanelRecoverySnapshot, "savedAt">): Promise<SidePanelRecoverySnapshot> {
    const value = { ...snapshot, savedAt: this.now().toISOString() };
    await this.storage.set(keyFor(value.organizationId, value.caseId), value);
    return value;
  }

  async restore(organizationId: string, caseId: string): Promise<SidePanelRecoverySnapshot | undefined> {
    const local = await this.storage.get(keyFor(organizationId, caseId));
    if (!local || local.organizationId !== organizationId || local.caseId !== caseId) return undefined;
    const result = await this.transport.rehydrate({ organizationId, caseId, sessionId: local.sessionId, flowVersion: local.flowVersion });
    if (result.snapshot.flowVersion !== local.flowVersion || result.snapshot.sessionId !== local.sessionId) throw new Error("RECOVERY_IDENTITY_MISMATCH");
    await this.storage.set(keyFor(organizationId, caseId), result.snapshot);
    return result.snapshot;
  }

  clear(organizationId: string, caseId: string): Promise<void> { return this.storage.remove(keyFor(organizationId, caseId)); }
}
