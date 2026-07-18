import { describe, expect, it, vi } from "vitest";
import type { CurrentUser } from "@alwaystrack/shared";
import {
  SupportOperationsError,
  bookSupportPauseSlot,
  cancelSupportPauseBooking,
  cancelSupportPauseSwap,
  createSupportPauseSlot,
  createSupportCampaign,
  createSupportKpiEntry,
  decideSupportPauseSwap,
  listSupportCampaigns,
  listSupportPauses,
  listSupportPerformance,
  generateSupportPauseSlots,
  requestSupportPauseSwap,
  reviewSupportKpiEntry,
  submitSupportKpiEntry,
  updateSupportCampaign,
  updateSupportKpiEntry,
  updateSupportPausePolicy
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

  it("stores the 75-minute two-shift policy and rejects an invalid template boundary", async () => {
    const prisma = {
      supportPausePolicy: {
        findUnique: vi.fn().mockResolvedValue(null),
        upsert: vi.fn().mockImplementation(({ create }) => Promise.resolve({ id: "policy-1", ...create }))
      },
      auditLog: auditMock()
    };
    const input = {
      timezone: "America/Sao_Paulo",
      minimumCoverage: 2,
      slotMinutes: 15,
      pauseDurationMinutes: 75,
      boundaryBufferMinutes: 15,
      shiftWindows: [{ start: "08:00", end: "14:45" }, { start: "15:00", end: "22:00" }],
      templateStarts: ["09:45", "15:15", "20:15"]
    };

    await expect(updateSupportPausePolicy(prisma as never, admin, input)).resolves.toMatchObject({
      policy: { pauseDurationMinutes: 75, boundaryBufferMinutes: 15, shiftWindows: input.shiftWindows }
    });
    await expect(updateSupportPausePolicy(prisma as never, admin, { ...input, templateStarts: ["14:45"] }))
      .rejects.toEqual(new SupportOperationsError("INVALID_INPUT"));
  });

  it("accepts only 75-minute slots inside a shift and away from its boundaries", async () => {
    const storedPolicy = {
      id: "policy-1", organizationId: "org-1", timezone: "America/Sao_Paulo", minimumCoverage: 2, slotMinutes: 15,
      pauseDurationMinutes: 75, boundaryBufferMinutes: 15,
      shiftWindowsJson: JSON.stringify([{ start: "08:00", end: "14:45" }, { start: "15:00", end: "22:00" }]),
      templateStartsJson: JSON.stringify(["09:45", "15:15"]), active: true
    };
    const prisma = {
      supportPausePolicy: { findUnique: vi.fn().mockResolvedValue(storedPolicy) },
      supportTeam: { findFirst: vi.fn().mockResolvedValue({ id: "team-1", name: "SAC" }) },
      supportPauseSlot: { create: vi.fn().mockImplementation(({ data }) => Promise.resolve({ id: "slot-1", ...data })) },
      auditLog: auditMock()
    };

    await expect(createSupportPauseSlot(prisma as never, admin, {
      startsAt: "2099-07-17T12:45:00.000Z",
      endsAt: "2099-07-17T14:00:00.000Z",
      capacity: 1
    })).resolves.toMatchObject({ slot: { id: "slot-1" } });
    await expect(createSupportPauseSlot(prisma as never, admin, {
      startsAt: "2099-07-17T17:45:00.000Z",
      endsAt: "2099-07-17T19:00:00.000Z",
      capacity: 1
    })).rejects.toEqual(new SupportOperationsError("CONFLICT"));
    await expect(createSupportPauseSlot(prisma as never, admin, {
      startsAt: "2099-07-17T18:15:00.000Z",
      endsAt: "2099-07-17T19:00:00.000Z",
      capacity: 1
    })).rejects.toEqual(new SupportOperationsError("INVALID_INPUT"));
  });

  it("generates the valid name-free base grid idempotently", async () => {
    const storedPolicy = {
      id: "policy-1", organizationId: "org-1", timezone: "America/Sao_Paulo", minimumCoverage: 2, slotMinutes: 15,
      pauseDurationMinutes: 75, boundaryBufferMinutes: 15,
      shiftWindowsJson: JSON.stringify([{ start: "08:00", end: "14:45" }, { start: "15:00", end: "22:00" }]),
      templateStartsJson: JSON.stringify(["09:45", "15:15", "20:15"]), active: true
    };
    const slotCreate = vi.fn().mockImplementation(({ data }) => Promise.resolve({ id: `slot-${data.label}`, ...data }));
    const prisma = {
      supportPausePolicy: { findUnique: vi.fn().mockResolvedValue(storedPolicy) },
      supportTeam: { findFirst: vi.fn().mockResolvedValue({ id: "team-1", name: "SAC" }) },
      supportPauseSlot: { findUnique: vi.fn().mockResolvedValue(null), create: slotCreate },
      auditLog: auditMock()
    };

    const result = await generateSupportPauseSlots(prisma as never, admin, { date: "2099-07-17", capacity: 1 });

    expect(result).toMatchObject({ createdCount: 3, reusedCount: 0 });
    expect(slotCreate).toHaveBeenCalledTimes(3);
    expect(slotCreate.mock.calls.map(([call]) => call.data.label)).toEqual(["Pausa 09:45", "Pausa 15:15", "Pausa 20:15"]);
    expect(prisma.auditLog.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ action: "support_pause.slots.generate" })
    }));
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
    await expect(bookSupportPauseSlot(overridden as never, admin, slot.id, {
      userId: "sac-1",
      overrideCoverage: true,
      overrideReason: "Cobertura emergencial aprovada pela gestão",
      confirmImpact: true
    }))
      .resolves.toMatchObject({ booking: { id: "booking-1" } });
    expect(overridden.supportPauseBooking.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        coverageBefore: 3,
        coverageAfter: 2,
        minimumCoverage: 3,
        overrideById: "admin-1",
        overrideReason: "Cobertura emergencial aprovada pela gestão"
      })
    });
    expect(overridden.auditLog.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ action: "support_pause.booking.override" }) }));
  });

  it("requires a reason and explicit impact confirmation for a manager override", async () => {
    const prisma = { $transaction: vi.fn() };

    await expect(bookSupportPauseSlot(prisma as never, admin, "slot-1", {
      userId: "sac-1",
      overrideCoverage: true,
      overrideReason: ""
    })).rejects.toEqual(new SupportOperationsError("INVALID_INPUT"));
    await expect(bookSupportPauseSlot(prisma as never, admin, "slot-1", {
      userId: "sac-1",
      overrideCoverage: true,
      overrideReason: "Cobertura autorizada"
    })).rejects.toEqual(new SupportOperationsError("INVALID_INPUT"));
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it("keeps elapsed pause bookings immutable", async () => {
    const prisma = {
      supportPauseBooking: {
        findFirst: vi.fn().mockResolvedValue({
          id: "booking-1",
          userId: sac.id,
          overrideReason: null,
          slot: { startsAt: new Date("2020-07-17T15:00:00.000Z") }
        }),
        update: vi.fn()
      },
      $transaction: vi.fn()
    };

    await expect(cancelSupportPauseBooking(prisma as never, sac, "booking-1"))
      .rejects.toEqual(new SupportOperationsError("CONFLICT"));
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it("expires stale swaps while building the pause agenda", async () => {
    const swap = {
      id: "swap-expired",
      status: "PENDING",
      expiresAt: new Date("2025-01-01T00:00:00.000Z")
    };
    const prisma = {
      supportTeam: { findMany: vi.fn().mockResolvedValue([]) },
      supportPausePolicy: { findUnique: vi.fn().mockResolvedValue(null) },
      user: { findMany: vi.fn().mockResolvedValue([]) },
      supportPauseSlot: { findMany: vi.fn().mockResolvedValue([]) },
      supportPauseSwap: {
        findMany: vi.fn().mockResolvedValue([swap]),
        updateMany: vi.fn().mockResolvedValue({ count: 1 })
      },
      auditLog: auditMock()
    };

    const result = await listSupportPauses(prisma as never, admin, "2026-07-17");

    expect(result.swaps).toEqual([expect.objectContaining({ id: "swap-expired", status: "EXPIRED" })]);
    expect(prisma.supportPauseSwap.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ id: { in: ["swap-expired"] }, status: "PENDING" }),
      data: expect.objectContaining({ status: "EXPIRED" })
    }));
    expect(prisma.auditLog.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ action: "support_pause.swap.expired", actorId: null })
    }));
  });

  it("scopes the SAC swap agenda to both bookings in the actor team", async () => {
    const findManySwaps = vi.fn().mockResolvedValue([]);
    const prisma = {
      supportTeam: { findMany: vi.fn().mockResolvedValue([{ id: "team-1", name: "SAC A" }]) },
      supportTeamMembership: {
        findMany: vi.fn()
          .mockResolvedValueOnce([{ teamId: "team-1" }])
          .mockResolvedValueOnce([{ user: { id: "sac-1", name: "SAC Demo", email: "sac@example.com" } }])
      },
      supportPausePolicy: { findUnique: vi.fn().mockResolvedValue(null) },
      supportPauseSlot: { findMany: vi.fn().mockResolvedValue([]) },
      supportPauseSwap: { findMany: findManySwaps }
    };

    await listSupportPauses(prisma as never, sac, "2026-07-17");

    expect(findManySwaps).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        organizationId: "org-1",
        AND: expect.arrayContaining([
          expect.objectContaining({
            requesterBooking: { slot: { teamId: "team-1" } },
            targetBooking: { slot: { teamId: "team-1" } }
          })
        ])
      })
    }));
  });

  it("rejects a SAC pause agenda without an active team membership", async () => {
    const prisma = {
      supportTeam: { findMany: vi.fn().mockResolvedValue([{ id: "team-1", name: "SAC A" }]) },
      supportTeamMembership: { findMany: vi.fn().mockResolvedValue([]) }
    };

    await expect(listSupportPauses(prisma as never, sac, "2026-07-17"))
      .rejects.toEqual(new SupportOperationsError("FORBIDDEN"));
  });

  it("limits a swap request to 24 hours or the first pause and lets its owner cancel it", async () => {
    const firstPause = new Date(Date.now() + 2 * 60 * 60 * 1000);
    const prisma = {
      supportPauseBooking: {
        findFirst: vi.fn()
          .mockResolvedValueOnce({ id: "booking-a", userId: "sac-1", slot: { startsAt: firstPause, teamId: "team-1" } })
          .mockResolvedValueOnce({ id: "booking-b", userId: "sac-2", slot: { startsAt: new Date(Date.now() + 3 * 60 * 60 * 1000), teamId: "team-1" } })
      },
      user: { findFirst: vi.fn().mockResolvedValue({ id: "sac" }) },
      supportTeamMembership: { findFirst: vi.fn().mockResolvedValue({ id: "membership-1" }) },
      supportPauseSwap: {
        findFirst: vi.fn().mockResolvedValueOnce(null).mockResolvedValueOnce({ id: "swap-1", requestedById: "sac-1", status: "PENDING" }),
        create: vi.fn().mockImplementation(({ data }) => Promise.resolve({ id: "swap-1", ...data })),
        update: vi.fn().mockResolvedValue({ id: "swap-1", status: "CANCELLED" })
      },
      auditLog: auditMock()
    };

    const requested = await requestSupportPauseSwap(prisma as never, sac, {
      requesterBookingId: "booking-a",
      targetBookingId: "booking-b",
      note: "Consulta médica"
    });
    expect(requested.swap.expiresAt?.getTime()).toBe(firstPause.getTime());

    await expect(cancelSupportPauseSwap(prisma as never, sac, "swap-1"))
      .resolves.toMatchObject({ swap: { status: "CANCELLED" } });
    expect(prisma.auditLog.create).toHaveBeenLastCalledWith(expect.objectContaining({
      data: expect.objectContaining({ action: "support_pause.swap.cancelled" })
    }));
  });

  it("rejects a pause swap across support teams", async () => {
    const prisma = {
      supportPauseBooking: {
        findFirst: vi.fn()
          .mockResolvedValueOnce({ id: "booking-a", userId: "sac-1", slot: { startsAt: new Date("2099-07-17T15:00:00.000Z"), teamId: "team-1" } })
          .mockResolvedValueOnce({ id: "booking-b", userId: "sac-2", slot: { startsAt: new Date("2099-07-17T16:00:00.000Z"), teamId: "team-2" } })
      }
    };

    await expect(requestSupportPauseSwap(prisma as never, sac, {
      requesterBookingId: "booking-a",
      targetBookingId: "booking-b"
    })).rejects.toEqual(new SupportOperationsError("CONFLICT"));
  });

  it("prevents another SAC agent from cancelling a peer swap", async () => {
    const prisma = {
      supportPauseSwap: { findFirst: vi.fn().mockResolvedValue({ id: "swap-1", requestedById: "sac-1", status: "PENDING" }) }
    };

    await expect(cancelSupportPauseSwap(prisma as never, { ...sac, id: "sac-2" }, "swap-1"))
      .rejects.toEqual(new SupportOperationsError("FORBIDDEN"));
  });

  it("accepts a peer swap atomically after checking both resulting schedules", async () => {
    const requesterBooking = { id: "booking-a", slotId: "slot-a", userId: "sac-1", slot: { startsAt: new Date("2099-07-17T15:00:00.000Z"), endsAt: new Date("2099-07-17T15:30:00.000Z"), teamId: "team-1" } };
    const targetBooking = { id: "booking-b", slotId: "slot-b", userId: "sac-2", slot: { startsAt: new Date("2099-07-17T16:00:00.000Z"), endsAt: new Date("2099-07-17T16:30:00.000Z"), teamId: "team-1" } };
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
      user: { findFirst: vi.fn().mockResolvedValue({ id: "sac" }) },
      supportTeamMembership: { findFirst: vi.fn().mockResolvedValue({ id: "membership-1" }) },
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
        { metric: "CSAT", value: 80, numerator: 8, denominator: 10, status: "APPROVED" },
        { metric: "CSAT", value: 100, numerator: 90, denominator: 90, status: "APPROVED" }
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
    expect(prisma.auditLog.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ action: "support_performance.entry.draft.create" }) }));
  });

  it("submits a KPI draft and approves it atomically while superseding the previous version", async () => {
    const submitted = {
      id: "kpi-2", organizationId: "org-1", status: "SUBMITTED", revision: 2, supersedesId: "kpi-1"
    };
    const tx = {
      supportKpiEntry: {
        findFirst: vi.fn().mockResolvedValue(submitted),
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
        update: vi.fn().mockResolvedValue({ ...submitted, status: "APPROVED" })
      },
      auditLog: auditMock()
    };
    const submitPrisma = {
      supportKpiEntry: {
        findFirst: vi.fn().mockResolvedValue({ id: "kpi-2", organizationId: "org-1", status: "DRAFT", revision: 2, supersedesId: "kpi-1" }),
        update: vi.fn().mockResolvedValue(submitted)
      },
      auditLog: auditMock()
    };

    await expect(submitSupportKpiEntry(submitPrisma as never, admin, "kpi-2")).resolves.toMatchObject({ entry: { status: "SUBMITTED" } });
    expect(submitPrisma.auditLog.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ action: "support_performance.entry.submit" }) }));

    const reviewPrisma = { $transaction: vi.fn(async (work: (client: unknown) => Promise<unknown>) => work(tx)) };
    await expect(reviewSupportKpiEntry(reviewPrisma as never, admin, "kpi-2", { decision: "APPROVED", reviewNote: "Conferido" }))
      .resolves.toMatchObject({ entry: { status: "APPROVED" } });
    expect(tx.supportKpiEntry.updateMany).toHaveBeenCalledWith({
      where: { id: "kpi-1", organizationId: "org-1", status: "APPROVED" },
      data: { status: "SUPERSEDED", updatedById: "admin-1" }
    });
    expect(tx.auditLog.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ action: "support_performance.entry.approved" }) }));
  });

  it("creates a draft revision instead of overwriting an approved KPI", async () => {
    const existing = {
      id: "kpi-1", organizationId: "org-1", metric: "CSAT", value: 90, numerator: 90, denominator: 100,
      scopeType: "TEAM", userId: null, teamId: "team-1", teamLabel: "SAC Atendimento",
      periodStart: new Date("2026-07-01T03:00:00.000Z"), periodEnd: new Date("2026-07-07T02:59:59.999Z"),
      source: "Painel", note: null, status: "APPROVED", revision: 1, supersedesId: null
    };
    const prisma = {
      supportKpiEntry: {
        findFirst: vi.fn().mockResolvedValue(existing),
        create: vi.fn().mockImplementation(({ data }) => Promise.resolve({ id: "kpi-2", ...data })),
        update: vi.fn()
      },
      auditLog: auditMock()
    };

    const result = await updateSupportKpiEntry(prisma as never, admin, "kpi-1", { value: 95, sampleSize: 120 });

    expect(result.entry).toMatchObject({ id: "kpi-2", status: "DRAFT", revision: 2, supersedesId: "kpi-1", value: 95 });
    expect(prisma.supportKpiEntry.update).not.toHaveBeenCalled();
    expect(prisma.auditLog.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ action: "support_performance.entry.revision.create" }) }));
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
      status: "DRAFT",
      startsAt: "2026-07-17T03:00:00.000Z",
      endsAt: "2026-07-31T02:59:59.999Z"
    });
    expect(result.campaign).toMatchObject({ metric: "RECLAME_AQUI_OPEN", comparison: "LTE", targetValue: 0, status: "DRAFT" });
    await expect(createSupportCampaign(prisma as never, admin, {
      name: "Publicação direta",
      metric: "CSAT",
      targetValue: 90,
      scopeType: "ORGANIZATION",
      status: "ACTIVE",
      startsAt: "2026-07-17T03:00:00.000Z",
      endsAt: "2026-07-31T02:59:59.999Z"
    })).rejects.toEqual(new SupportOperationsError("INVALID_INPUT"));
  });

  it("publishes a draft with a fixed audience snapshot, audit and deduplicated notification", async () => {
    const existing = {
      id: "campaign-1", organizationId: "org-1", name: "CSAT alto", description: "Qualidade sustentável", metric: "CSAT",
      targetValue: 92, comparison: "GTE", scopeType: "ORGANIZATION", userId: null, teamId: null, teamLabel: null,
      status: "DRAFT", startsAt: new Date("2026-07-17T03:00:00.000Z"), endsAt: new Date("2026-07-31T02:59:59.999Z"),
      audienceSnapshotJson: null, publishedAt: null, lifecycleVersion: 1
    };
    const agents = [{ id: "sac-1", name: "Ana" }, { id: "sac-2", name: "Bruno" }];
    const campaignUpdate = vi.fn().mockImplementation(({ data }) => Promise.resolve({
      ...existing,
      ...data,
      status: "ACTIVE",
      lifecycleVersion: 2
    }));
    const tx = {
      supportCampaign: { findFirst: vi.fn().mockResolvedValue(existing), update: campaignUpdate },
      user: { findMany: vi.fn().mockResolvedValue(agents) },
      auditLog: auditMock()
    };
    const prisma = {
      $transaction: vi.fn(async (work: (client: unknown) => Promise<unknown>) => work(tx)),
      user: { findMany: vi.fn().mockResolvedValue(agents.map(({ id }) => ({ id }))) },
      inAppNotification: { upsert: vi.fn().mockResolvedValue({ id: "notification-1" }) }
    };

    await expect(updateSupportCampaign(prisma as never, admin, "campaign-1", { status: "ACTIVE" }))
      .resolves.toMatchObject({ campaign: { status: "ACTIVE", lifecycleVersion: 2 } });
    const updateData = campaignUpdate.mock.calls[0]?.[0].data;
    expect(JSON.parse(updateData.audienceSnapshotJson)).toEqual({ rule: "FIXED_AT_ACTIVATION", members: agents });
    expect(tx.auditLog.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ action: "support_campaign.status.active" })
    }));
    expect(prisma.inAppNotification.upsert).toHaveBeenCalledTimes(2);
    expect(prisma.inAppNotification.upsert).toHaveBeenCalledWith(expect.objectContaining({
      create: expect.objectContaining({ type: "support_campaign.active", entityId: "campaign-1" })
    }));
  });

  it("blocks destructive edits after publication and freezes approved provenance on close", async () => {
    const audienceSnapshotJson = JSON.stringify({ rule: "FIXED_AT_ACTIVATION", members: [{ id: "sac-1", name: "Ana" }] });
    const existing = {
      id: "campaign-1", organizationId: "org-1", name: "SLA estável", description: null, metric: "SLA",
      targetValue: 90, comparison: "GTE", scopeType: "ORGANIZATION", userId: null, teamId: null, teamLabel: null,
      status: "ACTIVE", startsAt: new Date("2026-07-01T03:00:00.000Z"), endsAt: new Date("2026-07-31T02:59:59.999Z"),
      audienceSnapshotJson, publishedAt: new Date("2026-07-01T03:00:00.000Z"), lifecycleVersion: 2
    };
    const approved = [{
      id: "kpi-1", metric: "SLA", value: 95, numerator: 95, denominator: 100, scopeType: "ORGANIZATION", userId: null,
      teamId: null, teamLabel: null, periodStart: new Date("2026-07-01T03:00:00.000Z"), periodEnd: new Date("2026-07-07T02:59:59.999Z"),
      revision: 2, source: "Painel oficial"
    }];
    const campaignUpdate = vi.fn().mockImplementation(({ data }) => Promise.resolve({ ...existing, ...data, status: "CLOSED", lifecycleVersion: 3 }));
    const tx = {
      supportCampaign: { findFirst: vi.fn().mockResolvedValue(existing), update: campaignUpdate },
      supportKpiEntry: { findMany: vi.fn().mockResolvedValue(approved) },
      auditLog: auditMock()
    };
    const prisma = {
      $transaction: vi.fn(async (work: (client: unknown) => Promise<unknown>) => work(tx)),
      user: { findMany: vi.fn().mockResolvedValue([{ id: "sac-1" }]) },
      inAppNotification: { upsert: vi.fn().mockResolvedValue({ id: "notification-1" }) }
    };

    await expect(updateSupportCampaign(prisma as never, admin, "campaign-1", { targetValue: 99 }))
      .rejects.toEqual(new SupportOperationsError("CONFLICT"));
    await expect(updateSupportCampaign(prisma as never, admin, "campaign-1", { status: "CLOSED" }))
      .resolves.toMatchObject({ campaign: { status: "CLOSED" } });
    const frozen = JSON.parse(campaignUpdate.mock.calls[0]?.[0].data.resultSnapshotJson);
    expect(frozen).toMatchObject({ current: 95, achieved: true, samples: 100 });
    expect(frozen.provenance).toEqual([expect.objectContaining({ entryId: "kpi-1", revision: 2, source: "Painel oficial" })]);
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

    expect(result.items[0]?.result).toMatchObject({
      current: 98,
      average: 98,
      samples: 100,
      aggregation: "WEIGHTED",
      achieved: true,
      progressPercent: 100,
      frozenAt: null
    });
    expect(result.items[0]?.result.trend).toHaveLength(2);
    expect(result.items[0]?.result.provenance).toHaveLength(2);
  });
});
