import type { EvidenceFact } from "@alwaystrack/shared";
import { describe, expect, it, vi } from "vitest";
import filialFixture from "./fixtures/filial.sanitized.json";
import pharmaFixture from "./fixtures/pharma.sanitized.json";
import unexpectedFixture from "./fixtures/unexpected-page.sanitized.json";
import { createOmieFilialRuntime } from "./filial.js";
import { createOmiePharmaRuntime } from "./pharma.js";

const orderFact: EvidenceFact = { id: "f:order", caseId: "case-1", key: "order.primaryId", value: "SYN-1", normalizedValue: "SYN-1", sourceSystem: "MANUAL", observedAt: "2026-07-12T10:00:00Z", collectedAt: "2026-07-12T10:00:00Z", confidence: 1, freshness: "FRESH", sensitivity: "INTERNAL", acquisition: "MANUAL" };
const request = { caseId: "case-1", runId: "run-1", capability: "READ", evidence: [orderFact] };
const ports = (payload: unknown, manualMutationDetected = false) => ({
  source: { read: vi.fn(async () => ({ payload, manualMutationDetected })) },
  ledger: { append: vi.fn(async () => undefined) },
  evidence: { append: vi.fn(async () => undefined) },
  now: () => "2026-07-12T10:00:00Z"
});

describe("OMIE read-only runtimes", () => {
  it("is default-off and blocks drag, status changes and unknown capabilities", async () => {
    const disabledPorts = ports(filialFixture);
    expect((await createOmieFilialRuntime(disabledPorts).run(request)).status).toBe("NOT_APPLICABLE");
    expect(disabledPorts.source.read).not.toHaveBeenCalled();

    for (const capability of ["MOVE_OMIE_STATUS", "CHANGE_STATUS", "DRAG_DROP"]) {
      const enabledPorts = ports(filialFixture);
      const result = await createOmieFilialRuntime({ ...enabledPorts, enabled: true }).run({ ...request, capability });
      expect(result.warnings[0]?.code).toBe("CAPABILITY_DENIED");
      expect(enabledPorts.source.read).not.toHaveBeenCalled();
    }
  });

  it("records Filial facts and only warns about observed manual changes", async () => {
    const runtimePorts = ports(filialFixture, true);
    const result = await createOmieFilialRuntime({ ...runtimePorts, enabled: true }).run(request);
    expect(result.status).toBe("COMPLETE");
    expect(result.facts.map((fact) => fact.key)).toContain("invoice.danfeAvailable");
    expect(result.facts.map((fact) => fact.key)).toContain("connector.omie.notes");
    expect(result.warnings[0]?.code).toBe("MANUAL_MUTATION_DETECTED");
  });

  it("keeps Pharma critical context isolated and fails closed on context mismatch", async () => {
    const pharmaPorts = ports(pharmaFixture);
    const pharma = await createOmiePharmaRuntime({ ...pharmaPorts, enabled: true }).run(request);
    expect(pharma.status).toBe("COMPLETE");
    expect(pharma.facts.every((fact) => fact.sourceSystem === "omie-pharma")).toBe(true);
    expect(pharma.facts.map((fact) => fact.key)).toEqual(expect.arrayContaining(["connector.omie.production", "connector.omie.deadline"]));

    const mismatchPorts = ports(filialFixture);
    const mismatch = await createOmiePharmaRuntime({ ...mismatchPorts, enabled: true }).run(request);
    expect(mismatch.warnings[0]?.code).toBe("OMIE_CONTEXT_MISMATCH");
    expect(mismatchPorts.evidence.append).not.toHaveBeenCalled();

    const driftPorts = ports(unexpectedFixture);
    expect((await createOmieFilialRuntime({ ...driftPorts, enabled: true }).run(request)).status).toBe("FAILED_UNEXPECTED_PAGE");
  });
});
