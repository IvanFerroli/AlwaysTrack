import { describe, expect, it } from "vitest";
import { OfflineCaseFlowSimulator, fiveFakeConnectors, type OfflineClock } from "./offline-simulator.js";

class DeterministicClock implements OfflineClock {
  private value = 0;
  now() { return this.value; }
  async sleep(ms: number, signal: AbortSignal) {
    if (signal.aborted) throw new Error("ABORTED");
    this.value += ms;
    await Promise.resolve();
    if (signal.aborted) throw new Error("ABORTED");
  }
}

async function collect<T>(source: AsyncGenerator<T>) { const values: T[] = []; for await (const value of source) values.push(value); return values; }

describe("offline CaseFlow simulation", () => {
  it("runs five fake connectors and emits partial data without waiting for the stuck connector", async () => {
    const simulator = new OfflineCaseFlowSimulator(new DeterministicClock());
    const results = await collect(simulator.run("tenant-a", "case-a", fiveFakeConnectors()));
    expect(results).toHaveLength(5);
    expect(results.find((item) => item.connectorId === "FAKE_PARTIAL")?.outcome).toBe("PARTIAL");
    expect(results.find((item) => item.connectorId === "FAKE_STUCK")).toMatchObject({ outcome: "FAILED_TIMEOUT", durationMs: 30_000 });
  });

  it("reports cache age and isolates cache by tenant and case", async () => {
    const clock = new DeterministicClock();
    const simulator = new OfflineCaseFlowSimulator(clock);
    const connector = [{ id: "FAKE_CACHE", delayMs: 100, value: "allowlisted-result" }];
    await collect(simulator.run("tenant-a", "case-a", connector));
    expect((await collect(simulator.run("tenant-a", "case-a", connector)))[0]).toMatchObject({ fromCache: true, cacheAgeMs: 0 });
    expect((await collect(simulator.run("tenant-a", "case-b", connector)))[0]).toMatchObject({ fromCache: false, caseId: "case-b" });
    expect((await collect(simulator.run("tenant-b", "case-a", connector)))[0]).toMatchObject({ fromCache: false, tenantId: "tenant-b" });
  });

  it("cancels a prior duplicate run without affecting another case", async () => {
    class ControlledClock implements OfflineClock {
      now() { return 0; }
      sleep(_ms: number, signal: AbortSignal) { return new Promise<void>((resolve, reject) => signal.addEventListener("abort", () => reject(new Error("ABORTED")), { once: true })); }
    }
    const simulator = new OfflineCaseFlowSimulator(new ControlledClock());
    const first = collect(simulator.run("tenant-a", "case-a", [{ id: "FAKE_STUCK", delayMs: 60_000 }]));
    const second = collect(simulator.run("tenant-a", "case-a", []));
    const other = collect(simulator.run("tenant-a", "case-b", []));
    await second; await other;
    await expect(first).resolves.toMatchObject([{ caseId: "case-a", outcome: "CANCELLED" }]);
  });
});
