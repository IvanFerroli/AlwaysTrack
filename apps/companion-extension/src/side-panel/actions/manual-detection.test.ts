import type { EvidenceFact } from "@alwaystrack/shared";
import { describe, expect, it } from "vitest";
import { prepareManualOrderAlert } from "./manual-detection.js";

const fact: EvidenceFact = { id: "manual", caseId: "case-1", key: "order.manualId", value: "L-NEW", normalizedValue: "L-NEW", sourceSystem: "DERIVED", sourceReference: "draft-1", observedAt: "2026-07-12T10:00:00Z", collectedAt: "2026-07-12T10:00:00Z", confidence: 1, freshness: "FRESH", sensitivity: "INTERNAL", acquisition: "DERIVED", ruleId: "lancador.manual-confirmation" };
describe("manual order Slack alert", () => { it("produces copy-only Slack content", () => { const result = prepareManualOrderAlert({ evidence: fact, value: "R$ 10,00", reason: "reenvio" }); expect(result.action.kind).toBe("SLACK_DRAFT"); expect(result.action.content).toContain("L-NEW"); expect(JSON.stringify(result)).not.toMatch(/postMessage|webhook|channelId/i); }); });
