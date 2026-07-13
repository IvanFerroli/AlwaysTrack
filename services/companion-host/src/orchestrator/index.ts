import type { ConnectorResult, ConnectorTerminalStatus, EvidenceFact } from "@alwaystrack/shared";

export type ConnectorWave = 0 | 1 | 2 | 3;
export interface OrchestratorJob {
  connectorId: string; runId: string; wave: ConnectorWave;
  execute(signal: AbortSignal, emit: (status: string, message?: string) => void): Promise<ConnectorResult>;
}
export type OrchestratorEvent =
  | { type: "progress"; connectorId: string; runId: string; status: string; message?: string }
  | { type: "result"; result: ConnectorResult };
export interface OrchestratorOptions { enabled: boolean; concurrency: number; timeoutMs: number; now?: () => number; setTimer?: typeof setTimeout; clearTimer?: typeof clearTimeout; }

export class ProgressiveOrchestrator {
  private readonly controllers = new Map<string, AbortController>();
  constructor(private readonly options: OrchestratorOptions) {}
  cancel(runId: string): boolean { const controller = this.controllers.get(runId); if (!controller) return false; controller.abort("CANCELLED"); return true; }

  async run(jobs: readonly OrchestratorJob[], onEvent: (event: OrchestratorEvent) => void): Promise<ConnectorResult[]> {
    if (!this.options.enabled) throw new Error("COMPANION_RUNTIME_DISABLED");
    if (!Number.isSafeInteger(this.options.concurrency) || this.options.concurrency <= 0) throw new Error("Invalid concurrency");
    if (new Set(jobs.map((job) => job.runId)).size !== jobs.length) throw new Error("Duplicate runId");
    const results: ConnectorResult[] = [];
    for (const wave of [0, 1, 2, 3] as const) {
      const pending = jobs.filter((job) => job.wave === wave);
      let cursor = 0;
      const worker = async () => { while (cursor < pending.length) { const job = pending[cursor++]; const result = await this.execute(job!, onEvent); results.push(result); onEvent({ type: "result", result }); } };
      await Promise.all(Array.from({ length: Math.min(this.options.concurrency, pending.length) }, worker));
    }
    return results;
  }

  private async execute(job: OrchestratorJob, onEvent: (event: OrchestratorEvent) => void): Promise<ConnectorResult> {
    const now = this.options.now ?? Date.now; const setTimer = this.options.setTimer ?? setTimeout; const clearTimer = this.options.clearTimer ?? clearTimeout;
    const startedAt = new Date(now()).toISOString(); const controller = new AbortController(); this.controllers.set(job.runId, controller);
    let timedOut = false; const timer = setTimer(() => { timedOut = true; controller.abort("TIMEOUT"); }, this.options.timeoutMs);
    try {
      const aborted = new Promise<never>((_resolve, reject) => controller.signal.addEventListener("abort", () => reject(new Error(String(controller.signal.reason ?? "CANCELLED"))), { once: true }));
      return await Promise.race([job.execute(controller.signal, (status, message) => onEvent({ type: "progress", connectorId: job.connectorId, runId: job.runId, status, message })), aborted]);
    } catch (error) {
      const status: ConnectorTerminalStatus = timedOut ? "FAILED_TIMEOUT" : controller.signal.aborted ? "CANCELLED" : "FAILED_UNEXPECTED_PAGE";
      return { connectorId: job.connectorId as ConnectorResult["connectorId"], runId: job.runId, status, startedAt, finishedAt: new Date(now()).toISOString(), facts: [] as EvidenceFact[], warnings: [{ code: status, message: error instanceof Error ? error.message : status }] };
    } finally { clearTimer(timer); this.controllers.delete(job.runId); }
  }
}

export const hostOrchestratorLayerReady = true;
