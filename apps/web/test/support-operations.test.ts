import { describe, expect, it } from "vitest";
import {
  emptySupportCampaignDraft,
  formatSupportMetricValue,
  isSupportManager,
  supportCampaignPayloadFromDraft,
  supportDayBoundaryIso,
  supportKpiPayloadFromDraft,
  supportSlotDateTimeIso
} from "../src/support-operations";

describe("support operations helpers", () => {
  it("keeps manager permissions limited to ADMIN and GESTOR", () => {
    expect(isSupportManager({ role: "ADMIN" })).toBe(true);
    expect(isSupportManager({ role: "GESTOR" })).toBe(true);
    expect(isSupportManager({ role: "SAC" })).toBe(false);
  });

  it("serializes Sao Paulo day and slot boundaries", () => {
    expect(supportDayBoundaryIso("2026-07-17", "start")).toBe("2026-07-17T03:00:00.000Z");
    expect(supportDayBoundaryIso("2026-07-17", "end")).toBe("2026-07-18T02:59:59.999Z");
    expect(supportSlotDateTimeIso("2026-07-17", "12:15")).toBe("2026-07-17T15:15:00.000Z");
  });

  it("builds governed KPI and campaign payloads without stale scope values", () => {
    expect(supportKpiPayloadFromDraft({
      id: "",
      metric: "CSAT",
      value: "94.5",
      sampleSize: "80",
      scopeType: "USER",
      userId: "sac-1",
      teamLabel: "Equipe antiga",
      teamId: "team-old",
      periodStart: "2026-07-01",
      periodEnd: "2026-07-07",
      source: "Planilha semanal",
      note: "Conferido"
    })).toMatchObject({ metric: "CSAT", value: 94.5, sampleSize: 80, scopeType: "USER", userId: "sac-1", teamLabel: undefined, teamId: undefined });

    expect(supportKpiPayloadFromDraft({
      id: "entry-1",
      metric: "SLA",
      value: "88",
      sampleSize: "40",
      scopeType: "ORGANIZATION",
      userId: "",
      teamLabel: "",
      teamId: "",
      periodStart: "2026-07-01",
      periodEnd: "2026-07-07",
      source: "",
      note: ""
    })).toEqual({ value: 88, sampleSize: 40, source: null, note: null });

    const campaign = emptySupportCampaignDraft("2026-07-17");
    expect(supportCampaignPayloadFromDraft({
      ...campaign,
      name: "Fila sob controle",
      metric: "RECLAME_AQUI_OPEN",
      targetValue: "8",
      comparison: "LTE",
      scopeType: "TEAM",
      userId: "sac-antigo",
      teamLabel: "Retenção",
      teamId: "team-1"
    })).toMatchObject({
      name: "Fila sob controle",
      metric: "RECLAME_AQUI_OPEN",
      targetValue: 8,
      comparison: "LTE",
      scopeType: "TEAM",
      teamLabel: "Retenção",
      teamId: "team-1",
      userId: undefined
    });
  });

  it("formats percentage and count metrics with their native semantics", () => {
    expect(formatSupportMetricValue("CSAT", 94.5)).toBe("94,5%");
    expect(formatSupportMetricValue("SLA", null)).toBe("-");
    expect(formatSupportMetricValue("RECLAME_AQUI_OPEN", 12)).toBe("12");
  });
});
