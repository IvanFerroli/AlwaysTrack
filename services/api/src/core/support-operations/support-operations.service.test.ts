import { describe, expect, it, vi } from "vitest";
import type { CurrentUser } from "@alwaystrack/shared";
import {
  SupportOperationsError,
  bookSupportPauseSlot,
  createSupportCampaign,
  createSupportKpiEntry,
  decideSupportPauseSwap,
  listSupportCampaigns,
  listSupportPauses,
  listSupportPerformance
} from "./support-operations.service.js";

const admin: CurrentUser = {
  id: "admin-1",
  name: "Admin",
  email: "admin@example.com",
  role: "ADMIN",
  organizationId: "org-1",
  unitScopeIds: [],
  sectorScopeIds: []
};

const sac: CurrentUser = { ...admin, id: "sac-1", role: "SAC", email: "sac@example.com" };

function auditMock() {
  return { create: vi.fn().mockResolvedValue({ id: "audit-1" }) };
}

describe("support operations service", () => {
  it("builds an overlap timeline from active SAC agents and booked slots", async () => {
    const prisma = {
      supportTeam: { findMany: vi.fn().mockResolvedValue([]) },
      supportPausePolicy: { findUnique: vi.fn().mockResolvedValue({ id: "policy-1", organizationId: "org-1", timezone: "America/Sao_Paulo", minimumCoverage: 2, slotMinutes: 15, active: true }) },
      user: { findMany: vi.fn().mockResolvedValue([
        { id: "sac-1", name: "Ana", email: "ana@example.com" },
        { id: "sac-2", name: "Bruno", email: "bruno@example.com" },
        { id: "sac-3", name: "Carla", email: "carla@example.com" }
      ]) },
      supportPauseSlot: { findMany: vi.fn().mockResolvedValue([
        {
          id: "slot-1", startsAt: new Date("2026-07-17T15:00:00.000Z"), endsAt: new Date("2026-07-17T15:30:00.000Z"), capacity: 2,
          bookings: [
            { id: "booking-1", userId: "sac-1", user: { id: "sac-1", name: "Ana", email: "ana@example.com" } },
            { id: "booking-2", userId: "sac-2", user: { id: "sac-2", name: "Bruno", email: "bruno@example.com" } }
          ]
        }
      ]) },
      supportPauseSwap: { findMany: vi.fn().mockResolvedValue([]) }
    };

    const result = await listSupportPauses(prisma as never, admin, "2026-07-17");

    expect(result.summary).toMatchObject({ activeAgents: 3, bookedPauses: 2, criticalIntervals: 2 });
    expect(result.timeline).toHaveLength(2);
    expect(result.timeline[0]).toMatchObject({ pausedCount: 2, availableCount: 1, critical: true });
    expect(result.slots[0]).toMatchObject({ bookedCount: 2, remainingCapacity: 0 });
  });

  it("blocks capacity violations for SAC and permits an audited manager override", async () => {
    const slot = {
      id: "slot-1",
      organizationId: "org-1",
      startsAt: new Date("2099-07-17T15:00:00.000Z"),
      endsAt: new Date("2099-07-17T15:30:00.000Z"),
      capacity: 3,
      bookings: []
    };
    const base = () => ({
      user: { findFirst: vi.fn().mockResolvedValue({ id: "sac-1" }), count: vi.fn().mockResolvedValue(3) },
      supportPauseSlot: { findFirst: vi.fn().mockResolvedValue({ ...slot, teamId: null }) },
      supportPausePolicy: { findUnique: vi.fn().mockResolvedValue({ minimumCoverage: 3 }) },
      supportPauseBooking: {
        findFirst: vi.fn().mockResolvedValue(null),
        findMany: vi.fn().mockResolvedValue([]),
        findUnique: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockResolvedValue({ id: "booking-1", slotId: "slot-1", userId: "sac-1" })
      },
      auditLog: auditMock(),
      $transaction: vi.fn(async function (this: Record<string, unknown>, work: (tx: unknown) => Promise<unknown>) {
        return work(this);
      })
    });
    const blocked = base();
    await expect(bookSupportPauseSlot(blocked as never, sac, slot.id, {})).rejects.toEqual(new SupportOperationsError("CONFLICT"));
    expect(blocked.supportPauseBooking.create).not.toHaveBeenCalled();

    const overridden = base();
    await expect(bookSupportPauseSlot(overridden as never, admin, slot.id, { userId: "sac-1", overrideCoverage: true }))
      .resolves.toMatchObject({ booking: { id: "booking-1" } });
    expect(overridden.auditLog.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ action: "support_pause.booking.override" }) }));
  });

  it("accepts a peer swap atomically after checking both resulting schedules", async () => {
    const requesterBooking = { id: "booking-a", slotId: "slot-a", userId: "sac-1", slot: { startsAt: new Date("2099-07-17T15:00:00.000Z"), endsAt: new Date("2099-07-17T15:30:00.000Z") } };
    const targetBooking = { id: "booking-b", slotId: "slot-b", userId: "sac-2", slot: { startsAt: new Date("2099-07-17T16:00:00.000Z"), endsAt: new Date("2099-07-17T16:30:00.000Z") } };
    const bookingUpdate = vi.fn().mockResolvedValue({});
    const swapUpdate = vi.fn().mockResolvedValue({ id: "swap-1", status: "ACCEPTED" });
    const tx = {
      supportPauseSwap: {
        findFirst: vi.fn().mockResolvedValue({ id: "swap-1", targetBooking, requesterBooking }),
        update: swapUpdate
      },
      supportPauseBooking: {
        findFirst: vi.fn().mockResolvedValue(null),
        deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
        update: bookingUpdate
      },
      auditLog: auditMock()
    };
    const prisma = {
      $transaction: vi.fn(async (work: (client: unknown) => Promise<unknown>) => work(tx))
    };
    const targetActor: CurrentUser = { ...sac, id: "sac-2" };

    await expect(decideSupportPauseSwap(prisma as never, targetActor, "swap-1", { decision: "ACCEPTED" }))
      .resolves.toMatchObject({ swap: { status: "ACCEPTED" } });
    expect(bookingUpdate).toHaveBeenNthCalledWith(1, { where: { id: "booking-a" }, data: { slotId: "slot-b" } });
    expect(bookingUpdate).toHaveBeenNthCalledWith(2, { where: { id: "booking-b" }, data: { slotId: "slot-a" } });
    expect(tx.auditLog.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ action: "support_pause.swap.accepted" }) }));
  });

  it("weights CSAT and SLA by sample size instead of averaging percentages", async () => {
    const prisma = {
      supportTeamMembership: { findMany: vi.fn().mockResolvedValue([]) },
      supportTeam: { findMany: vi.fn().mockResolvedValue([{ id: "team-1", name: "SAC Atendimento" }]) },
      supportKpiEntry: { findMany: vi.fn().mockResolvedValue([
        { metric: "CSAT", value: 80, numerator: 8, denominator: 10 },
        { metric: "CSAT", value: 100, numerator: 90, denominator: 90 }
      ]) },
      supportCampaign: { findMany: vi.fn().mockResolvedValue([]) }
    };

    const result = await listSupportPerformance(prisma as never, admin, {});
    const csat = result.summary.find((item) => item.metric === "CSAT");

    expect(csat).toEqual({ metric: "CSAT", latest: 100, average: 98, samples: 100, aggregation: "WEIGHTED" });
  });

  it("validates KPI semantics and records governed manual input", async () => {
    const prisma = {
      user: { findFirst: vi.fn().mockResolvedValue({ id: "sac-1" }) },
      supportKpiEntry: { create: vi.fn().mockImplementation(({ data }) => Promise.resolve({ id: "kpi-1", ...data })) },
      auditLog: auditMock()
    };
    const input = {
      metric: "CSAT",
      value: 94.5,
      scopeType: "USER",
      userId: "sac-1",
      periodStart: "2026-07-01T03:00:00.000Z",
      periodEnd: "2026-07-07T02:59:59.999Z",
      source: "Planilha semanal"
    };
    await expect(createSupportKpiEntry(prisma as never, admin, input)).resolves.toMatchObject({ entry: { metric: "CSAT", value: 94.5 } });
    await expect(createSupportKpiEntry(prisma as never, admin, { ...input, value: 140 })).rejects.toEqual(new SupportOperationsError("INVALID_INPUT"));
    expect(prisma.auditLog.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ action: "support_performance.entry.create" }) }));
  });

  it("creates a lower-is-better ReclameAqui campaign without sales dependencies", async () => {
    const prisma = {
      supportCampaign: { create: vi.fn().mockImplementation(({ data }) => Promise.resolve({ id: "campaign-1", ...data })) },
      auditLog: auditMock()
    };
    const result = await createSupportCampaign(prisma as never, admin, {
      name: "Zero reincidência",
      metric: "RECLAME_AQUI_OPEN",
      targetValue: 0,
      comparison: "LTE",
      scopeType: "ORGANIZATION",
      status: "ACTIVE",
      startsAt: "2026-07-17T03:00:00.000Z",
      endsAt: "2026-07-31T02:59:59.999Z"
    });
    expect(result.campaign).toMatchObject({ metric: "RECLAME_AQUI_OPEN", comparison: "LTE", targetValue: 0 });
  });

  it("evaluates campaign progress with the same weighted period aggregation as performance", async () => {
    const prisma = {
      supportCampaign: { findMany: vi.fn().mockResolvedValue([{
        id: "campaign-1",
        organizationId: "org-1",
        name: "CSAT 95",
        metric: "CSAT",
        targetValue: 95,
        comparison: "GTE",
        scopeType: "TEAM",
        teamId: "team-1",
        teamLabel: "SAC Atendimento",
        userId: null,
        startsAt: new Date("2026-07-01T03:00:00.000Z"),
        endsAt: new Date("2026-08-01T02:59:59.999Z")
      }]) },
      supportTeam: { findMany: vi.fn().mockResolvedValue([{ id: "team-1", name: "SAC Atendimento" }]) },
      supportKpiEntry: { findMany: vi.fn().mockResolvedValue([
        {
          metric: "CSAT", value: 80, numerator: 8, denominator: 10, scopeType: "TEAM", teamId: "team-1", teamLabel: "SAC Atendimento",
          periodStart: new Date("2026-07-01T03:00:00.000Z"), periodEnd: new Date("2026-07-07T02:59:59.999Z")
        },
        {
          metric: "CSAT", value: 100, numerator: 90, denominator: 90, scopeType: "TEAM", teamId: "team-1", teamLabel: "SAC Atendimento",
          periodStart: new Date("2026-07-08T03:00:00.000Z"), periodEnd: new Date("2026-07-14T02:59:59.999Z")
        }
      ]) }
    };

    const result = await listSupportCampaigns(prisma as never, admin);

    expect(result.items[0]?.result).toEqual({
      current: 98,
      average: 98,
      samples: 100,
      aggregation: "WEIGHTED",
      achieved: true,
      progressPercent: 100
    });
  });
});
