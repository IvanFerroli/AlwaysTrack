import { describe, expect, it } from "vitest";
import {
  SUPPORT_PERFORMANCE_DICTIONARY_VERSION,
  SUPPORT_METRIC_DATA_STATE_VERSION,
  getSupportMetricDefinition,
  isWritableSupportMetricDefinition,
  supportMetricDataStates,
  supportMetricDefinitions,
  writableSupportMetricKeys
} from "./performance-metrics.js";

describe("support performance metric dictionary", () => {
  it("keeps current score, duration, percentage and count semantics explicit", () => {
    expect(SUPPORT_PERFORMANCE_DICTIONARY_VERSION).toBe(3);
    expect(SUPPORT_METRIC_DATA_STATE_VERSION).toBe(1);
    expect(supportMetricDataStates).toEqual(["AVAILABLE", "NOT_REPORTED", "NOT_APPLICABLE", "INVALID_SOURCE"]);
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

  it("supports provisional read-only definitions without making them writable", () => {
    const provisional = {
      key: "FUTURE_METRIC",
      definitionVersion: 3,
      label: "Métrica futura",
      unit: "COUNT",
      direction: "HIGHER_IS_BETTER",
      aggregation: "SUM",
      status: "PROVISIONAL_READ_ONLY"
    } as const;

    expect(isWritableSupportMetricDefinition(provisional)).toBe(false);
    expect(isWritableSupportMetricDefinition(getSupportMetricDefinition("PRODUCTIVITY")!)).toBe(true);
  });
});
