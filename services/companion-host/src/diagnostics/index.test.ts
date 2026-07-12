import { describe, expect, it } from "vitest";
import { degradedHealthFromDiagnostic, redactConnectorDiagnostic, type ConnectorDiagnosticInput } from "./index.js";

const diagnostic = (caseId: string, runId: string): ConnectorDiagnosticInput => ({
  connectorId: "YAMPI",
  connectorVersion: "1.2.0",
  selectorVersion: "2026-07-12",
  code: "SELECTOR_DRIFT",
  pageKind: "unexpected-checkout",
  occurredAt: "2026-07-12T12:00:00.000Z",
  durationMs: 450,
  caseId,
  runId,
  url: "https://example.invalid/order?cpf=12345678909",
  html: "<html>customer secret</html>",
  screenshot: "data:image/png;base64,secret"
});

describe("connector drift diagnostics", () => {
  it("keeps only the diagnostic allowlist and derives degraded health", () => {
    const redacted = redactConnectorDiagnostic(diagnostic("case-a", "run-a"));
    expect(redacted).not.toHaveProperty("html");
    expect(redacted).not.toHaveProperty("url");
    expect(redacted).not.toHaveProperty("screenshot");
    expect(degradedHealthFromDiagnostic(diagnostic("case-a", "run-a"))).toMatchObject({ state: "DEGRADED", lastSelectorDriftAt: "2026-07-12T12:00:00.000Z" });
  });

  it("does not reuse diagnostic identity across sequential cases A and B", () => {
    const caseA = redactConnectorDiagnostic(diagnostic("case-a", "run-a"));
    const caseB = redactConnectorDiagnostic(diagnostic("case-b", "run-b"));
    expect(caseA).toMatchObject({ caseId: "case-a", runId: "run-a" });
    expect(caseB).toMatchObject({ caseId: "case-b", runId: "run-b" });
    expect(caseB).not.toMatchObject({ caseId: caseA.caseId, runId: caseA.runId });
  });
});
