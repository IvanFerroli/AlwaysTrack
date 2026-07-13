import type { AlwaysChatIntake, EvidenceFact } from "@alwaystrack/shared";

export type IntakeConnectorStatus = "RUNNING" | "COMPLETED" | "PARTIAL" | "NOT_FOUND" | "AWAITING_IDENTIFIER" | "BLOCKED_LOGIN" | "FAILED_TIMEOUT" | "FAILED_SELECTOR_DRIFT" | "FAILED" | "CANCELLED";
export type CaseIntakePhase = "IDLE" | "RUNNING" | "PARTIAL" | "CANCELLED" | "FAILED";
export interface CaseIntakeState { phase: CaseIntakePhase; caseId?: string; summary?: string[]; connectors: Record<string, IntakeConnectorStatus>; error?: "HOST_OFFLINE" | "API_FAILURE" }
export interface CaseIntakeEvent { caseId: string; connectorId: string; status: IntakeConnectorStatus; facts?: EvidenceFact[]; summary?: string[] }
export interface CaseIntakeHost {
  readonly mode: "SHADOW_READ_ONLY";
  start(intake: AlwaysChatIntake, signal: AbortSignal): AsyncIterable<CaseIntakeEvent>;
}

export class CaseIntakeController {
  #state: CaseIntakeState = { phase: "IDLE", connectors: {} };
  #controller?: AbortController;
  #activeKey?: string;
  constructor(private readonly host: CaseIntakeHost, private readonly onChange: (state: CaseIntakeState) => void = () => undefined) {}
  get state(): CaseIntakeState { return { ...this.#state, connectors: { ...this.#state.connectors } }; }

  async mount(intake: AlwaysChatIntake): Promise<void> {
    const key = `${intake.conversation.id}:${intake.displayedOrder ?? ""}`;
    if (this.#controller && this.#activeKey === key) return;
    this.#controller?.abort();
    this.#controller = new AbortController();
    this.#activeKey = key;
    this.#set({ phase: "RUNNING", connectors: { alwayschat: "RUNNING" } });
    try {
      for await (const event of this.host.start(intake, this.#controller.signal)) {
        if (this.#controller.signal.aborted) break;
        this.#set({ phase: event.status === "COMPLETED" && event.connectorId === "rastreio" ? "PARTIAL" : this.#state.phase, caseId: event.caseId, summary: event.summary ?? this.#state.summary, connectors: { ...this.#state.connectors, [event.connectorId]: event.status } });
      }
    } catch {
      if (!this.#controller.signal.aborted) this.#set({ ...this.#state, phase: "FAILED", error: "HOST_OFFLINE" });
    } finally { this.#activeKey = undefined; }
  }

  cancel(): void {
    this.#controller?.abort();
    this.#set({ ...this.#state, phase: "CANCELLED", connectors: Object.fromEntries(Object.entries(this.#state.connectors).map(([id, status]) => [id, status === "RUNNING" ? "CANCELLED" : status])) });
  }

  refresh(intake: AlwaysChatIntake): Promise<void> { return this.mount(intake); }
  #set(state: CaseIntakeState): void { this.#state = state; this.onChange(this.state); }
}
