import { describe, expect, it, vi } from "vitest";
import fixture from "../../connectors/alwayschat/fixtures/intake-complete.sanitized.json";
import { parseAlwaysChatIntake } from "@alwaystrack/shared";
import { CaseIntakeController, type CaseIntakeHost } from "./case-intake.js";

const intake = parseAlwaysChatIntake(fixture);
describe("case intake controller", () => {
  it("streams extension -> fake host -> API progress and deduplicates an active refresh", async () => {
    let release!: () => void;
    const wait = new Promise<void>((resolve) => { release = resolve; });
    const api = {
      createCase: vi.fn(async () => "case-1"),
      ingestFacts: vi.fn(async (_caseId: string, _connectorId: string) => undefined)
    };
    const start = vi.fn(async function* () {
      const caseId = await api.createCase();
      await api.ingestFacts(caseId, "alwayschat");
      yield { caseId, connectorId: "alwayschat", status: "COMPLETED" as const };
      await wait;
      await api.ingestFacts(caseId, "rastreio");
      yield { caseId, connectorId: "rastreio", status: "COMPLETED" as const, summary: ["Demanda: consultar pedido.", "Pedido: ORDER-DEMO-1001.", "Logistica: em transporte."] };
    });
    const host = { mode: "SHADOW_READ_ONLY" as const, start } satisfies CaseIntakeHost;
    const controller = new CaseIntakeController(host);
    const running = controller.mount(intake);
    await Promise.resolve();
    await controller.refresh(intake);
    expect(start).toHaveBeenCalledTimes(1);
    release(); await running;
    expect(controller.state).toMatchObject({ phase: "PARTIAL", caseId: "case-1", connectors: { alwayschat: "COMPLETED", rastreio: "COMPLETED" } });
    expect(api.createCase).toHaveBeenCalledTimes(1);
    expect(api.ingestFacts).toHaveBeenCalledTimes(2);
    expect(Object.keys(host)).not.toEqual(expect.arrayContaining(["submit", "sendMessage", "writeExternal"]));
  });

  it("cancels runs without deleting the case", async () => {
    const host: CaseIntakeHost = { mode: "SHADOW_READ_ONLY", async *start(_intake, signal) { yield { caseId: "case-2", connectorId: "alwayschat", status: "COMPLETED" }; await new Promise<void>((resolve) => signal.addEventListener("abort", () => resolve(), { once: true })); } };
    let caseCreated!: () => void;
    const created = new Promise<void>((resolve) => { caseCreated = resolve; });
    const controller = new CaseIntakeController(host, (state) => { if (state.caseId) caseCreated(); });
    const running = controller.mount(intake); await created; controller.cancel(); await running;
    expect(controller.state).toMatchObject({ phase: "CANCELLED", caseId: "case-2" });
  });
});
