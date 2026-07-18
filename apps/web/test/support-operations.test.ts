import { describe, expect, it } from "vitest";
import {
  emptySupportCampaignDraft,
  formatSupportDuration,
  formatSupportMetricValue,
  isSupportManager,
  parseSupportDuration,
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
      metric: "CSAT_SCORE",
      value: "4,4",
      sampleSize: "80",
      channel: "",
      granularity: "REPORTED_INTERVAL",
      observationType: "ACTUAL",
      scopeType: "USER",
      userId: "sac-1",
      teamLabel: "Equipe antiga",
      teamId: "team-old",
      periodStart: "2026-07-01",
      periodEnd: "2026-07-07",
      source: "Planilha semanal",
      note: "Conferido"
    })).toMatchObject({
      metric: "CSAT_SCORE",
      value: 4.4,
      sampleSize: 80,
      channel: null,
      granularity: "REPORTED_INTERVAL",
      observationType: "ACTUAL",
      scopeType: "USER",
      userId: "sac-1",
      teamLabel: undefined,
      teamId: undefined
    });

    expect(supportKpiPayloadFromDraft({
      id: "entry-1",
      metric: "SLA_DURATION",
      value: "12min58s",
      sampleSize: "40",
      channel: "WHATSAPP",
      granularity: "REPORTED_INTERVAL",
      observationType: "ACTUAL",
      scopeType: "ORGANIZATION",
      userId: "",
      teamLabel: "",
      teamId: "",
      periodStart: "2026-07-01",
      periodEnd: "2026-07-07",
      source: "",
      note: ""
    })).toEqual({
      value: 778,
      sampleSize: 40,
      channel: "WHATSAPP",
      granularity: "REPORTED_INTERVAL",
      observationType: "ACTUAL",
      rawValue: "12min58s",
      source: null,
      note: null
    });

    const campaign = emptySupportCampaignDraft("2026-07-17");
    expect(supportCampaignPayloadFromDraft({
      ...campaign,
      name: "Fila sob controle",
      metric: "FIRST_RESPONSE_TIME",
      targetValue: "2h35min",
      comparison: "LTE",
      channel: "TIKTOK",
      granularity: "REPORTED_MONTH",
      observationType: "EXPECTATION",
      scopeType: "TEAM",
      userId: "sac-antigo",
      teamLabel: "Retenção",
      teamId: "team-1"
    })).toMatchObject({
      name: "Fila sob controle",
      metric: "FIRST_RESPONSE_TIME",
      targetValue: 9300,
      comparison: "LTE",
      channel: "TIKTOK",
      granularity: "REPORTED_MONTH",
      observationType: "EXPECTATION",
      scopeType: "TEAM",
      teamLabel: "Retenção",
      teamId: "team-1",
      userId: undefined
    });
  });

  it("formats the concrete score, duration, percentage and count units", () => {
    expect(formatSupportMetricValue("CSAT_SCORE", 4.4)).toBe("4,4 / 5");
    expect(formatSupportMetricValue("SLA_DURATION", 778)).toBe("12min58s");
    expect(formatSupportMetricValue("SATISFACTION_RATE", 82.8)).toBe("82,8%");
    expect(formatSupportMetricValue("FIRST_RESPONSE_TIME", 9300)).toBe("2h35min");
    expect(formatSupportMetricValue("RECLAME_AQUI_OPEN", 12)).toBe("12");
    expect(formatSupportMetricValue("SLA_DURATION", null)).toBe("-");
    expect(formatSupportDuration(53)).toBe("53s");
    expect(parseSupportDuration("1h9min")).toBe(4140);
    expect(() => parseSupportDuration("12:58")).toThrow(/53s/);
  });
});
