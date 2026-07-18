import { describe, expect, it } from "vitest";
import {
  SUPPORT_PERFORMANCE_DICTIONARY_VERSION,
  getSupportMetricDefinition,
  supportMetricDefinitions,
  writableSupportMetricKeys
} from "./performance-metrics.js";

describe("support performance metric dictionary", () => {
  it("keeps current score, duration, percentage and count semantics explicit", () => {
    expect(SUPPORT_PERFORMANCE_DICTIONARY_VERSION).toBe(2);
    expect(getSupportMetricDefinition("CSAT_SCORE")).toMatchObject({
      label: "CSAT",
      unit: "SCORE_1_5",
      direction: "HIGHER_IS_BETTER",
      aggregation: "WEIGHTED_MEAN",
      status: "CURRENT"
    });
    expect(getSupportMetricDefinition("SLA_DURATION")).toMatchObject({
      label: "SLA",
      unit: "DURATION_SECONDS",
      direction: "LOWER_IS_BETTER"
    });
    expect(getSupportMetricDefinition("FIRST_RESPONSE_TIME")).toMatchObject({
      unit: "DURATION_SECONDS",
      direction: "LOWER_IS_BETTER"
    });
    expect(getSupportMetricDefinition("SATISFACTION_RATE")).toMatchObject({ unit: "PERCENT", aggregation: "RATIO" });
    expect(getSupportMetricDefinition("RESOLUTION_WITHIN_24H_RATE")).toMatchObject({ unit: "PERCENT", aggregation: "RATIO" });
    expect(getSupportMetricDefinition("PRODUCTIVITY")).toMatchObject({
      unit: "COUNT",
      aggregation: "SUM",
      provisional: true
    });
    expect(getSupportMetricDefinition("PRODUCTIVITY")?.note).toContain("anexo operacional não contém produtividade");
    expect(getSupportMetricDefinition("RECLAME_AQUI_OPEN")).toMatchObject({ unit: "COUNT", aggregation: "LATEST" });
  });

  it("keeps old percentage keys readable but not writable", () => {
    expect(getSupportMetricDefinition("CSAT_LEGACY_PERCENT")).toMatchObject({
      definitionVersion: 1,
      unit: "PERCENT",
      status: "LEGACY_READ_ONLY"
    });
    expect(getSupportMetricDefinition("SLA_LEGACY_PERCENT")).toMatchObject({
      definitionVersion: 1,
      unit: "PERCENT",
      status: "LEGACY_READ_ONLY"
    });
    expect(writableSupportMetricKeys).not.toContain("CSAT_LEGACY_PERCENT");
    expect(writableSupportMetricKeys).not.toContain("SLA_LEGACY_PERCENT");
    expect(new Set(supportMetricDefinitions.map((definition) => definition.key)).size).toBe(supportMetricDefinitions.length);
  });
});
