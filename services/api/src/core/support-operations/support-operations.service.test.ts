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
  rescheduleSupportPauseBooking,
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

function approvedMetricEntry(overrides: Record<string, unknown> = {}) {
  return {
    id: "kpi-1",
    metric: "CSAT_SCORE",
    definitionVersion: 2,
    unit: "SCORE_1_5",
    value: 4.4,
    numerator: null,
    denominator: null,
    channel: null,
    granularity: "REPORTED_INTERVAL",
    observationType: "ACTUAL",
    rawValue: null,
    dataState: "AVAILABLE",
    scopeType: "TEAM",
    userId: null,
    teamId: "team-1",
    teamLabel: "SAC Atendimento",
    periodStart: new Date("2026-07-01T03:00:00.000Z"),
    periodEnd: new Date("2026-07-07T02:59:59.999Z"),
    createdAt: new Date("2026-07-07T03:00:00.000Z"),
    status: "APPROVED",
    revision: 1,
    source: "Painel oficial",
    ...overrides
  };
}

function performanceListPrisma(entries: Array<Record<string, unknown>>) {
  return {
    supportTeamMembership: { findMany: vi.fn().mockResolvedValue([]) },
    supportTeam: { findMany: vi.fn().mockResolvedValue([{ id: "team-1", name: "SAC Atendimento" }]) },
    supportKpiEntry: { findMany: vi.fn().mockResolvedValue(entries) },
    supportCampaign: { findMany: vi.fn().mockResolvedValue([]) }
  };
}

function pauseFlowHarness(options: { initialBooking?: boolean; peerBooking?: boolean; pendingSwap?: boolean } = {}) {
  const slots = [
    {
      id: "slot-previous",
      organizationId: "org-1",
      teamId: null,
      startsAt: new Date("2099-07-17T14:45:00.000Z"),
      endsAt: new Date("2099-07-17T16:00:00.000Z"),
      capacity: 1,
      active: true
    },
    {
      id: "slot-other",
      organizationId: "org-1",
      teamId: null,
      startsAt: new Date("2099-07-17T17:00:00.000Z"),
      endsAt: new Date("2099-07-17T18:15:00.000Z"),
      capacity: 1,
      active: true
    }
  ];
  const bookings: Array<Record<string, unknown>> = [];
  if (options.initialBooking !== false) {
    bookings.push({
      id: "booking-previous",
      organizationId: "org-1",
      slotId: "slot-previous",
      userId: sac.id,
      status: "BOOKED",
      shiftOccurrenceId: null,
      rescheduleRequiredAt: null,
      overrideReason: null,
      overrideRevokedById: null,
      overrideRevokedAt: null,
      overrideRevokeReason: null
    });
  }
  if (options.peerBooking) {
    bookings.push({
      id: "booking-peer",
      organizationId: "org-1",
      slotId: "slot-previous",
      userId: "sac-2",
      status: "BOOKED",
      shiftOccurrenceId: null,
      rescheduleRequiredAt: null,
      overrideReason: null
    });
  }
  const swaps = options.pendingSwap ? [{
    id: "swap-pending",
    organizationId: "org-1",
    requesterBookingId: "booking-previous",
    targetBookingId: "booking-peer",
    status: "PENDING"
  }] : [];
  const auditEntries: Array<Record<string, unknown>> = [];
  let bookingSequence = 0;

  const supportPauseBooking = {
    findUnique: vi.fn(({ where }: { where: { slotId_userId: { slotId: string; userId: string } } }) => Promise.resolve(
      bookings.find((booking) => (
        booking.slotId === where.slotId_userId.slotId && booking.userId === where.slotId_userId.userId
      )) ?? null
    )),
    findFirst: vi.fn(({ where }: { where: Record<string, unknown> }) => {
      if (typeof where.id === "string") {
        const booking = bookings.find((item) => item.id === where.id && item.organizationId === where.organizationId);
        if (!booking) return Promise.resolve(null);
        const slot = slots.find((item) => item.id === booking.slotId);
        return Promise.resolve({ ...booking, slot: slot ? { startsAt: slot.startsAt } : null });
      }
      return Promise.resolve(null);
    }),
    findMany: vi.fn().mockResolvedValue([]),
    create: vi.fn(({ data }: { data: Record<string, unknown> }) => {
      const booking = { id: `booking-new-${++bookingSequence}`, status: "BOOKED", ...data };
      bookings.push(booking);
      return Promise.resolve(booking);
    }),
    update: vi.fn(({ where, data }: { where: { id: string }; data: Record<string, unknown> }) => {
      const booking = bookings.find((item) => item.id === where.id);
      if (!booking) throw new Error("booking missing");
      Object.assign(booking, data);
      return Promise.resolve({ ...booking });
    }),
    updateMany: vi.fn(({ where, data }: { where: Record<string, unknown>; data: Record<string, unknown> }) => {
      const booking = bookings.find((item) => (
        item.id === where.id
        && item.organizationId === where.organizationId
        && item.status === where.status
      ));
      if (!booking) return Promise.resolve({ count: 0 });
      Object.assign(booking, data);
      return Promise.resolve({ count: 1 });
    })
  };
  const tx = {
    supportPauseSlot: {
      findFirst: vi.fn(({ where }: { where: { id: string; organizationId: string; active: boolean } }) => {
        const slot = slots.find((item) => (
          item.id === where.id && item.organizationId === where.organizationId && item.active === where.active
        ));
        return Promise.resolve(slot ? {
          ...slot,
          bookings: bookings.filter((booking) => booking.slotId === slot.id && booking.status === "BOOKED")
        } : null);
      })
    },
    supportPausePolicy: { findUnique: vi.fn().mockResolvedValue(null) },
    supportShiftOccurrence: {
      count: vi.fn().mockResolvedValue(0),
      findFirst: vi.fn().mockResolvedValue(null),
      findMany: vi.fn().mockResolvedValue([])
    },
    user: {
      findFirst: vi.fn(({ where }: { where: { id: string } }) => Promise.resolve({ id: where.id })),
      count: vi.fn().mockResolvedValue(3)
    },
    supportPauseBooking,
    supportPauseSwap: {
      findMany: vi.fn().mockImplementation(() => Promise.resolve(
        swaps.filter((swap) => swap.status === "PENDING").map((swap) => ({ id: swap.id }))
      )),
      updateMany: vi.fn(({ where, data }: { where: { id: { in: string[] }; status: string }; data: Record<string, unknown> }) => {
        const matching = swaps.filter((swap) => where.id.in.includes(swap.id) && swap.status === where.status);
        matching.forEach((swap) => Object.assign(swap, data));
        return Promise.resolve({ count: matching.length });
      })
    },
    supportPauseSwapBookingLock: { deleteMany: vi.fn().mockResolvedValue({ count: options.pendingSwap ? 2 : 0 }) },
    auditLog: {
      create: vi.fn(({ data }: { data: Record<string, unknown> }) => {
        auditEntries.push(data);
        return Promise.resolve({ id: `audit-${auditEntries.length}`, ...data });
      })
    }
  };
  let transactionQueue = Promise.resolve();
  const prisma = {
    $transaction: vi.fn((work: (client: typeof tx) => Promise<unknown>) => {
      const result = transactionQueue.then(() => work(tx));
      transactionQueue = result.then(() => undefined, () => undefined);
      return result;
    })
  };
  return { prisma, tx, slots, bookings, swaps, auditEntries };
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
      supportShiftOccurrence: { findMany: vi.fn().mockResolvedValue([]) },
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

  it("rejects a generated slot whose local time does not exist during a DST transition", async () => {
    const prisma = {
      supportPausePolicy: {
        findUnique: vi.fn().mockResolvedValue({
          id: "policy-1",
          organizationId: "org-1",
          timezone: "America/New_York",
          minimumCoverage: 2,
          slotMinutes: 15,
          pauseDurationMinutes: 75,
          boundaryBufferMinutes: 0,
          shiftWindowsJson: JSON.stringify([{ start: "00:00", end: "05:00" }]),
          templateStartsJson: JSON.stringify(["02:15"]),
          active: true
        })
      }
    };

    await expect(generateSupportPauseSlots(prisma as never, admin, {
      date: "2026-03-08",
      capacity: 1
    })).rejects.toEqual(new SupportOperationsError("INVALID_INPUT"));
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
      supportShiftOccurrence: {
        count: vi.fn().mockResolvedValue(0),
        findFirst: vi.fn().mockResolvedValue(null),
        findMany: vi.fn().mockResolvedValue([])
      },
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

  it("returns an existing active booking for an idempotent retry", async () => {
    const slot = {
      id: "slot-1",
      organizationId: "org-1",
      startsAt: new Date("2099-07-17T15:00:00.000Z"),
      endsAt: new Date("2099-07-17T16:15:00.000Z"),
      capacity: 1,
      teamId: null,
      bookings: [{ id: "booking-1", userId: "sac-1" }]
    };
    const booking = { id: "booking-1", slotId: slot.id, userId: "sac-1", status: "BOOKED" };
    const tx = {
      supportPauseSlot: { findFirst: vi.fn().mockResolvedValue(slot) },
      supportPausePolicy: { findUnique: vi.fn().mockResolvedValue(null) },
      supportShiftOccurrence: {
        count: vi.fn().mockResolvedValue(0),
        findFirst: vi.fn().mockResolvedValue(null),
        findMany: vi.fn().mockResolvedValue([])
      },
      user: { findFirst: vi.fn().mockResolvedValue({ id: "sac-1" }) },
      supportPauseBooking: {
        findUnique: vi.fn().mockResolvedValue(booking),
        findFirst: vi.fn(),
        create: vi.fn(),
        update: vi.fn()
      }
    };
    const prisma = { $transaction: vi.fn(async (work: (client: unknown) => Promise<unknown>) => work(tx)) };

    await expect(bookSupportPauseSlot(prisma as never, sac, slot.id, {}))
      .resolves.toEqual({ booking, idempotent: true });
    expect(tx.supportPauseBooking.findFirst).not.toHaveBeenCalled();
    expect(tx.supportPauseBooking.create).not.toHaveBeenCalled();
    expect(tx.supportPauseBooking.update).not.toHaveBeenCalled();
  });

  it("cancels a pause, releases its pending swap and books another eligible slot", async () => {
    const harness = pauseFlowHarness({ pendingSwap: true });

    await expect(cancelSupportPauseBooking(harness.prisma as never, sac, "booking-previous"))
      .resolves.toMatchObject({ booking: { id: "booking-previous", status: "CANCELLED" } });
    await expect(bookSupportPauseSlot(harness.prisma as never, sac, "slot-other", {}))
      .resolves.toMatchObject({ booking: { slotId: "slot-other", status: "BOOKED" } });

    expect(harness.bookings.find((booking) => booking.id === "booking-previous"))
      .toMatchObject({ status: "CANCELLED", slotId: "slot-previous" });
    expect(harness.bookings.find((booking) => booking.slotId === "slot-other"))
      .toMatchObject({ status: "BOOKED", userId: sac.id });
    expect(harness.tx.supportPauseBooking.updateMany).toHaveBeenCalledWith({
      where: {
        id: "booking-previous",
        organizationId: sac.organizationId,
        status: "BOOKED"
      },
      data: expect.objectContaining({ status: "CANCELLED" })
    });
    expect(harness.swaps).toEqual([expect.objectContaining({ id: "swap-pending", status: "CANCELLED" })]);
    expect(harness.tx.supportPauseSwap.findMany).toHaveBeenCalledWith({
      where: expect.objectContaining({ organizationId: sac.organizationId, status: "PENDING" }),
      select: { id: true }
    });
    expect(harness.tx.supportPauseSwap.updateMany).toHaveBeenCalledWith({
      where: expect.objectContaining({ organizationId: sac.organizationId, status: "PENDING" }),
      data: expect.objectContaining({ status: "CANCELLED", decidedById: sac.id })
    });
    expect(harness.tx.supportPauseSwapBookingLock.deleteMany).toHaveBeenCalledWith({
      where: { swapId: { in: ["swap-pending"] } }
    });
    expect(harness.auditEntries.map((entry) => entry.action)).toEqual([
      "support_pause.booking.cancel",
      "support_pause.booking.create"
    ]);
    expect(harness.prisma.$transaction).toHaveBeenNthCalledWith(
      1,
      expect.any(Function),
      { isolationLevel: "Serializable" }
    );
  });

  it("reactivates the same cancelled slot with an explicit audit trail", async () => {
    const harness = pauseFlowHarness();

    await cancelSupportPauseBooking(harness.prisma as never, sac, "booking-previous");
    await expect(bookSupportPauseSlot(harness.prisma as never, sac, "slot-previous", {}))
      .resolves.toMatchObject({ booking: { id: "booking-previous", status: "BOOKED" } });

    expect(harness.tx.supportPauseBooking.create).not.toHaveBeenCalled();
    expect(harness.auditEntries.map((entry) => entry.action)).toEqual([
      "support_pause.booking.cancel",
      "support_pause.booking.reactivate"
    ]);
    const reactivation = harness.auditEntries[1];
    expect(JSON.parse(String(reactivation.metadataJson))).toMatchObject({
      slotId: "slot-previous",
      userId: sac.id,
      previousStatus: "CANCELLED",
      overrideCoverage: false
    });
  });

  it("keeps a cancelled booking auditable when its former slot has reached capacity", async () => {
    const harness = pauseFlowHarness({ peerBooking: true });

    await cancelSupportPauseBooking(harness.prisma as never, sac, "booking-previous");
    await expect(bookSupportPauseSlot(harness.prisma as never, sac, "slot-previous", {}))
      .rejects.toEqual(new SupportOperationsError("CONFLICT"));

    expect(harness.bookings.find((booking) => booking.id === "booking-previous"))
      .toMatchObject({ status: "CANCELLED" });
    expect(harness.tx.supportPauseBooking.update).not.toHaveBeenCalled();
    expect(harness.auditEntries.map((entry) => entry.action)).toEqual(["support_pause.booking.cancel"]);
  });

  it("allows only one winner when two agents concurrently book the last capacity", async () => {
    const harness = pauseFlowHarness({ initialBooking: false });
    const peer = { ...sac, id: "sac-2", email: "sac2@example.com" };

    const results = await Promise.allSettled([
      bookSupportPauseSlot(harness.prisma as never, sac, "slot-previous", {}),
      bookSupportPauseSlot(harness.prisma as never, peer, "slot-previous", {})
    ]);

    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    const rejected = results.find((result) => result.status === "rejected");
    expect(rejected).toMatchObject({ reason: new SupportOperationsError("CONFLICT") });
    expect(harness.bookings.filter((booking) => (
      booking.slotId === "slot-previous" && booking.status === "BOOKED"
    ))).toHaveLength(1);
    expect(harness.auditEntries).toHaveLength(1);
  });

  it("does not reactivate a rescheduled booking and erase its audit chain", async () => {
    const harness = pauseFlowHarness();
    const previous = harness.bookings.find((booking) => booking.id === "booking-previous")!;
    previous.status = "RESCHEDULED";

    await expect(bookSupportPauseSlot(harness.prisma as never, sac, "slot-previous", {}))
      .rejects.toEqual(new SupportOperationsError("CONFLICT"));

    expect(harness.tx.supportPauseBooking.update).not.toHaveBeenCalled();
    expect(previous).toMatchObject({ status: "RESCHEDULED" });
    expect(harness.auditEntries).toHaveLength(0);
  });

  it("blocks a pause outside the operator published shift", async () => {
    const slot = {
      id: "slot-1",
      organizationId: "org-1",
      startsAt: new Date("2099-07-17T15:00:00.000Z"),
      endsAt: new Date("2099-07-17T16:15:00.000Z"),
      capacity: 1,
      teamId: "team-1",
      bookings: []
    };
    const tx = {
      supportPauseSlot: { findFirst: vi.fn().mockResolvedValue(slot) },
      supportPausePolicy: { findUnique: vi.fn().mockResolvedValue({ organizationId: "org-1", timezone: "America/Sao_Paulo" }) },
      supportPauseBooking: { findUnique: vi.fn().mockResolvedValue(null) },
      supportShiftOccurrence: {
        count: vi.fn().mockResolvedValue(3),
        findFirst: vi.fn().mockResolvedValue(null)
      },
      supportTeamMembership: { findFirst: vi.fn().mockResolvedValue({ id: "membership-1" }) },
      user: { findFirst: vi.fn().mockResolvedValue({ id: sac.id }) }
    };
    const prisma = { $transaction: vi.fn(async (work: (client: unknown) => Promise<unknown>) => work(tx)) };

    await expect(bookSupportPauseSlot(prisma as never, sac, slot.id, {}))
      .rejects.toEqual(new SupportOperationsError("CONFLICT"));
  });

  it("uses published shift coverage and links the pause to its occurrence", async () => {
    const slot = {
      id: "slot-1",
      organizationId: "org-1",
      startsAt: new Date("2099-07-17T15:00:00.000Z"),
      endsAt: new Date("2099-07-17T16:15:00.000Z"),
      capacity: 2,
      teamId: "team-1",
      bookings: []
    };
    const occurrence = {
      id: "occurrence-1",
      userId: sac.id,
      teamId: "team-1",
      status: "PUBLISHED",
      startsAt: new Date("2099-07-17T11:00:00.000Z"),
      endsAt: new Date("2099-07-17T17:45:00.000Z")
    };
    const bookingCreate = vi.fn().mockResolvedValue({ id: "booking-1", shiftOccurrenceId: occurrence.id });
    const tx = {
      supportPauseSlot: { findFirst: vi.fn().mockResolvedValue(slot) },
      supportPausePolicy: { findUnique: vi.fn().mockResolvedValue({ organizationId: "org-1", timezone: "America/Sao_Paulo", minimumCoverage: 2 }) },
      supportPauseBooking: {
        findUnique: vi.fn().mockResolvedValue(null),
        findFirst: vi.fn().mockResolvedValue(null),
        findMany: vi.fn().mockResolvedValue([]),
        create: bookingCreate
      },
      supportShiftOccurrence: {
        count: vi.fn().mockResolvedValue(3),
        findFirst: vi.fn().mockResolvedValue(occurrence),
        findMany: vi.fn().mockResolvedValue([{ userId: "sac-1" }, { userId: "sac-2" }, { userId: "sac-3" }])
      },
      supportTeamMembership: {
        findFirst: vi.fn().mockResolvedValue({ id: "membership-1" }),
        findMany: vi.fn().mockResolvedValue([])
      },
      user: { findFirst: vi.fn().mockResolvedValue({ id: sac.id }) },
      auditLog: auditMock()
    };
    const prisma = { $transaction: vi.fn(async (work: (client: unknown) => Promise<unknown>) => work(tx)) };

    await expect(bookSupportPauseSlot(prisma as never, sac, slot.id, {}))
      .resolves.toMatchObject({ booking: { id: "booking-1", shiftOccurrenceId: occurrence.id } });
    expect(bookingCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        shiftOccurrenceId: occurrence.id,
        coverageBefore: null,
        coverageAfter: null
      })
    });
    expect(tx.auditLog.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ metadataJson: expect.stringContaining('"coverageSource":"PUBLISHED_SCHEDULE"') })
    }));
  });

  it("reschedules an invalidated pause explicitly and preserves its audit chain", async () => {
    const original = {
      id: "booking-old",
      organizationId: "org-1",
      slotId: "slot-old",
      userId: sac.id,
      status: "BOOKED",
      slot: { id: "slot-old", teamId: "team-1", startsAt: new Date("2099-07-17T14:00:00.000Z") }
    };
    const targetSlot = {
      id: "slot-new",
      organizationId: "org-1",
      teamId: "team-1",
      startsAt: new Date("2099-07-17T15:00:00.000Z"),
      endsAt: new Date("2099-07-17T16:15:00.000Z"),
      capacity: 2,
      bookings: []
    };
    const occurrence = { id: "occurrence-1", userId: sac.id };
    const bookingCreate = vi.fn().mockResolvedValue({
      id: "booking-new",
      slotId: targetSlot.id,
      userId: sac.id,
      rescheduledFromId: original.id,
      shiftOccurrenceId: occurrence.id
    });
    const bookingUpdate = vi.fn().mockResolvedValue({ ...original, status: "RESCHEDULED" });
    const tx = {
      supportPauseBooking: {
        findFirst: vi.fn().mockResolvedValueOnce(original).mockResolvedValueOnce(null),
        findUnique: vi.fn().mockResolvedValue(null),
        findMany: vi.fn().mockResolvedValue([]),
        create: bookingCreate,
        update: bookingUpdate
      },
      supportPauseSlot: { findFirst: vi.fn().mockResolvedValue(targetSlot) },
      supportPausePolicy: { findUnique: vi.fn().mockResolvedValue({ organizationId: "org-1", timezone: "America/Sao_Paulo", minimumCoverage: 2 }) },
      supportShiftOccurrence: {
        count: vi.fn().mockResolvedValue(3),
        findFirst: vi.fn().mockResolvedValue(occurrence),
        findMany: vi.fn().mockResolvedValue([{ userId: "sac-1" }, { userId: "sac-2" }, { userId: "sac-3" }])
      },
      supportTeamMembership: {
        findFirst: vi.fn().mockResolvedValue({ id: "membership-1" }),
        findMany: vi.fn().mockResolvedValue([])
      },
      user: { findFirst: vi.fn().mockResolvedValue({ id: sac.id }) },
      supportPauseSwap: { updateMany: vi.fn().mockResolvedValue({ count: 0 }) },
      supportPauseSwapBookingLock: { deleteMany: vi.fn().mockResolvedValue({ count: 0 }) },
      auditLog: auditMock()
    };
    const prisma = { $transaction: vi.fn(async (work: (client: unknown) => Promise<unknown>) => work(tx)) };

    await expect(rescheduleSupportPauseBooking(prisma as never, sac, original.id, { targetSlotId: targetSlot.id }))
      .resolves.toMatchObject({
        booking: { id: "booking-new", rescheduledFromId: original.id },
        previousBooking: { id: original.id, status: "RESCHEDULED" }
      });
    expect(bookingCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        rescheduledFromId: original.id,
        shiftOccurrenceId: occurrence.id,
        slotId: targetSlot.id
      })
    });
    expect(bookingUpdate).toHaveBeenCalledWith({
      where: { id: original.id },
      data: { status: "RESCHEDULED", rescheduleRequiredAt: null }
    });
    expect(tx.auditLog.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ action: "support_pause.booking.reschedule" })
    }));
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
    const tx = {
      supportPauseBooking: {
        findFirst: vi.fn().mockResolvedValue({
          id: "booking-1",
          userId: sac.id,
          status: "BOOKED",
          overrideReason: null,
          slot: { startsAt: new Date("2020-07-17T15:00:00.000Z") }
        }),
        updateMany: vi.fn()
      }
    };
    const prisma = { $transaction: vi.fn((work: (client: typeof tx) => Promise<unknown>) => work(tx)) };

    await expect(cancelSupportPauseBooking(prisma as never, sac, "booking-1"))
      .rejects.toEqual(new SupportOperationsError("CONFLICT"));
    expect(tx.supportPauseBooking.updateMany).not.toHaveBeenCalled();
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
      supportShiftOccurrence: { findMany: vi.fn().mockResolvedValue([]) },
      supportPauseSwap: {
        findMany: vi.fn().mockResolvedValue([swap]),
        updateMany: vi.fn().mockResolvedValue({ count: 1 })
      },
      supportPauseSwapBookingLock: { deleteMany: vi.fn().mockResolvedValue({ count: 2 }) },
      auditLog: auditMock()
    };
    Object.assign(prisma, {
      $transaction: vi.fn(async (work: (client: unknown) => Promise<unknown>) => work(prisma))
    });

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
      supportShiftOccurrence: { findMany: vi.fn().mockResolvedValue([]) },
      supportPauseSwap: { findMany: findManySwaps }
    };

    await listSupportPauses(prisma as never, sac, "2026-07-17");

    expect(prisma.supportTeam.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ id: { in: ["team-1"] } })
    }));
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
      supportPausePolicy: { findUnique: vi.fn().mockResolvedValue(null) },
      supportTeam: { findMany: vi.fn().mockResolvedValue([{ id: "team-1", name: "SAC A" }]) },
      supportTeamMembership: { findMany: vi.fn().mockResolvedValue([]) }
    };

    await expect(listSupportPauses(prisma as never, sac, "2026-07-17"))
      .rejects.toEqual(new SupportOperationsError("FORBIDDEN"));
  });

  it("builds a pause day from the policy timezone across a DST transition", async () => {
    const slotFindMany = vi.fn().mockResolvedValue([]);
    const prisma = {
      supportPausePolicy: { findUnique: vi.fn().mockResolvedValue({ organizationId: "org-1", timezone: "America/New_York" }) },
      supportTeam: { findMany: vi.fn().mockResolvedValue([]) },
      user: { findMany: vi.fn().mockResolvedValue([]) },
      supportPauseSlot: { findMany: slotFindMany },
      supportPauseSwap: { findMany: vi.fn().mockResolvedValue([]) },
      supportShiftOccurrence: { findMany: vi.fn().mockResolvedValue([]) }
    };

    await listSupportPauses(prisma as never, admin, "2026-03-08");

    expect(slotFindMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        startsAt: {
          gte: new Date("2026-03-08T05:00:00.000Z"),
          lte: new Date("2026-03-09T03:59:59.999Z")
        }
      })
    }));
  });

  it("rejects an invalid civil pause date", async () => {
    const prisma = {
      supportPausePolicy: { findUnique: vi.fn().mockResolvedValue({ organizationId: "org-1", timezone: "Asia/Tokyo" }) }
    };

    await expect(listSupportPauses(prisma as never, admin, "2026-02-30"))
      .rejects.toEqual(new SupportOperationsError("INVALID_INPUT"));
  });

  it("limits a swap request to 24 hours or the first pause and lets its owner cancel it", async () => {
    const firstPause = new Date(Date.now() + 2 * 60 * 60 * 1000);
    const tx = {
      supportPauseBooking: {
        findFirst: vi.fn()
          .mockResolvedValueOnce({ id: "booking-a", userId: "sac-1", slot: { startsAt: firstPause, teamId: "team-1" } })
          .mockResolvedValueOnce({ id: "booking-b", userId: "sac-2", slot: { startsAt: new Date(Date.now() + 3 * 60 * 60 * 1000), teamId: "team-1" } })
      },
      user: { findFirst: vi.fn().mockResolvedValue({ id: "sac" }) },
      supportTeamMembership: { findFirst: vi.fn().mockResolvedValue({ id: "membership-1" }) },
      supportPauseSwap: {
        findFirst: vi.fn().mockResolvedValue({ id: "swap-1", requestedById: "sac-1", status: "PENDING" }),
        findMany: vi.fn().mockResolvedValue([]),
        create: vi.fn().mockImplementation(({ data }) => Promise.resolve({ id: "swap-1", ...data })),
        updateMany: vi.fn().mockResolvedValue({ count: 1 })
      },
      supportPauseSwapBookingLock: {
        createMany: vi.fn().mockResolvedValue({ count: 2 }),
        deleteMany: vi.fn().mockResolvedValue({ count: 2 })
      },
      auditLog: auditMock()
    };
    const prisma = { ...tx, $transaction: vi.fn(async (work: (client: unknown) => Promise<unknown>) => work(tx)) };

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
    const tx = {
      supportPauseBooking: {
        findFirst: vi.fn()
          .mockResolvedValueOnce({ id: "booking-a", userId: "sac-1", slot: { startsAt: new Date("2099-07-17T15:00:00.000Z"), teamId: "team-1" } })
          .mockResolvedValueOnce({ id: "booking-b", userId: "sac-2", slot: { startsAt: new Date("2099-07-17T16:00:00.000Z"), teamId: "team-2" } })
      }
    };
    const prisma = { $transaction: vi.fn(async (work: (client: unknown) => Promise<unknown>) => work(tx)) };

    await expect(requestSupportPauseSwap(prisma as never, sac, {
      requesterBookingId: "booking-a",
      targetBookingId: "booking-b"
    })).rejects.toEqual(new SupportOperationsError("CONFLICT"));
  });

  it("prevents another SAC agent from cancelling a peer swap", async () => {
    const tx = {
      supportPauseSwap: { findFirst: vi.fn().mockResolvedValue({ id: "swap-1", requestedById: "sac-1", status: "PENDING" }) }
    };
    const prisma = { $transaction: vi.fn(async (work: (client: unknown) => Promise<unknown>) => work(tx)) };

    await expect(cancelSupportPauseSwap(prisma as never, { ...sac, id: "sac-2" }, "swap-1"))
      .rejects.toEqual(new SupportOperationsError("FORBIDDEN"));
  });

  it("accepts a peer swap atomically after checking both resulting schedules", async () => {
    const requesterBooking = { id: "booking-a", slotId: "slot-a", userId: "sac-1", status: "BOOKED", slot: { startsAt: new Date("2099-07-17T15:00:00.000Z"), endsAt: new Date("2099-07-17T15:30:00.000Z"), teamId: "team-1" } };
    const targetBooking = { id: "booking-b", slotId: "slot-b", userId: "sac-2", status: "BOOKED", slot: { startsAt: new Date("2099-07-17T16:00:00.000Z"), endsAt: new Date("2099-07-17T16:30:00.000Z"), teamId: "team-1" } };
    const bookingUpdateMany = vi.fn().mockResolvedValue({ count: 1 });
    const swapUpdateMany = vi.fn().mockResolvedValue({ count: 1 });
    const tx = {
      supportPauseSwap: {
        findFirst: vi.fn().mockResolvedValue({ id: "swap-1", status: "PENDING", expiresAt: null, targetBooking, requesterBooking }),
        updateMany: swapUpdateMany
      },
      supportPauseBooking: {
        findFirst: vi.fn().mockResolvedValue(null),
        deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
        updateMany: bookingUpdateMany
      },
      supportShiftOccurrence: {
        findFirst: vi.fn()
          .mockResolvedValueOnce({ id: "occurrence-requester" })
          .mockResolvedValueOnce({ id: "occurrence-target" })
      },
      user: { findFirst: vi.fn().mockResolvedValue({ id: "sac" }) },
      supportTeamMembership: { findFirst: vi.fn().mockResolvedValue({ id: "membership-1" }) },
      supportPauseSwapBookingLock: { deleteMany: vi.fn().mockResolvedValue({ count: 2 }) },
      auditLog: auditMock()
    };
    const prisma = {
      $transaction: vi.fn(async (work: (client: unknown) => Promise<unknown>) => work(tx))
    };
    const targetActor: CurrentUser = { ...sac, id: "sac-2" };

    await expect(decideSupportPauseSwap(prisma as never, targetActor, "swap-1", { decision: "ACCEPTED" }))
      .resolves.toMatchObject({ swap: { status: "ACCEPTED" } });
    expect(bookingUpdateMany).toHaveBeenNthCalledWith(1, {
      where: expect.objectContaining({ id: "booking-a", slotId: "slot-a", status: "BOOKED" }),
      data: expect.objectContaining({ slotId: "slot-b", shiftOccurrenceId: "occurrence-requester" })
    });
    expect(bookingUpdateMany).toHaveBeenNthCalledWith(2, {
      where: expect.objectContaining({ id: "booking-b", slotId: "slot-b", status: "BOOKED" }),
      data: expect.objectContaining({ slotId: "slot-a", shiftOccurrenceId: "occurrence-target" })
    });
    expect(tx.supportPauseSwapBookingLock.deleteMany).toHaveBeenCalledWith({ where: { swapId: "swap-1" } });
    expect(tx.auditLog.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ action: "support_pause.swap.accepted" }) }));
  });

  it("rejects simulated concurrent swap requests that share a booking", async () => {
    const future = new Date("2099-07-17T15:00:00.000Z");
    const bookings = new Map([
      ["booking-a", { id: "booking-a", userId: "sac-1", slot: { startsAt: future, teamId: "team-1" } }],
      ["booking-b", { id: "booking-b", userId: "sac-2", slot: { startsAt: future, teamId: "team-1" } }],
      ["booking-c", { id: "booking-c", userId: "sac-3", slot: { startsAt: future, teamId: "team-1" } }]
    ]);
    const locks = new Set<string>();
    const createdSwaps: Array<Record<string, unknown>> = [];
    let transactionNumber = 0;
    const prisma = {
      supportPauseSwap: {
        findFirst: vi.fn(({ where }) => Promise.resolve(createdSwaps.find((swap) => (
          swap.requesterBookingId === where.requesterBookingId
          && swap.targetBookingId === where.targetBookingId
          && swap.requestedById === where.requestedById
        )) ?? null))
      },
      $transaction: vi.fn(async (work: (client: unknown) => Promise<unknown>) => {
        const swapId = `swap-${++transactionNumber}`;
        let pendingSwap: Record<string, unknown> | null = null;
        const tx = {
          supportPauseBooking: {
            findFirst: vi.fn(({ where }) => Promise.resolve(bookings.get(where.id) ?? null))
          },
          user: { findFirst: vi.fn().mockResolvedValue({ id: "sac" }) },
          supportTeamMembership: { findFirst: vi.fn().mockResolvedValue({ id: "membership-1" }) },
          supportPauseSwap: {
            findMany: vi.fn().mockResolvedValue([]),
            updateMany: vi.fn().mockResolvedValue({ count: 0 }),
            create: vi.fn(({ data }) => {
              pendingSwap = { id: swapId, status: "PENDING", ...data };
              return Promise.resolve(pendingSwap);
            })
          },
          supportPauseSwapBookingLock: {
            createMany: vi.fn(({ data }) => {
              if (data.some(({ bookingId }: { bookingId: string }) => locks.has(bookingId))) {
                return Promise.reject({ code: "P2002" });
              }
              data.forEach(({ bookingId }: { bookingId: string }) => locks.add(bookingId));
              if (pendingSwap) createdSwaps.push(pendingSwap);
              return Promise.resolve({ count: data.length });
            }),
            deleteMany: vi.fn().mockResolvedValue({ count: 0 })
          },
          auditLog: auditMock()
        };
        return work(tx);
      })
    };

    const results = await Promise.allSettled([
      requestSupportPauseSwap(prisma as never, sac, { requesterBookingId: "booking-a", targetBookingId: "booking-b" }),
      requestSupportPauseSwap(prisma as never, sac, { requesterBookingId: "booking-a", targetBookingId: "booking-c" })
    ]);

    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    const rejection = results.find((result) => result.status === "rejected");
    expect(rejection).toMatchObject({ status: "rejected", reason: new SupportOperationsError("CONFLICT") });
    expect(locks.size).toBe(2);
  });

  it("rejects an accepted swap when a booking no longer occupies its expected slot", async () => {
    const requesterBooking = { id: "booking-a", slotId: "slot-a", userId: "sac-1", status: "BOOKED", slot: { startsAt: new Date("2099-07-17T15:00:00.000Z"), endsAt: new Date("2099-07-17T15:30:00.000Z"), teamId: "team-1" } };
    const targetBooking = { id: "booking-b", slotId: "slot-b", userId: "sac-2", status: "BOOKED", slot: { startsAt: new Date("2099-07-17T16:00:00.000Z"), endsAt: new Date("2099-07-17T16:30:00.000Z"), teamId: "team-1" } };
    const swapUpdateMany = vi.fn();
    const tx = {
      supportPauseSwap: { findFirst: vi.fn().mockResolvedValue({ id: "swap-1", status: "PENDING", expiresAt: null, requesterBooking, targetBooking }), updateMany: swapUpdateMany },
      supportPauseBooking: {
        findFirst: vi.fn().mockResolvedValue(null),
        deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
        updateMany: vi.fn().mockResolvedValueOnce({ count: 0 })
      },
      supportShiftOccurrence: { findFirst: vi.fn().mockResolvedValue({ id: "occurrence-1" }) },
      user: { findFirst: vi.fn().mockResolvedValue({ id: "sac" }) },
      supportTeamMembership: { findFirst: vi.fn().mockResolvedValue({ id: "membership-1" }) },
      auditLog: auditMock()
    };
    const prisma = { $transaction: vi.fn(async (work: (client: unknown) => Promise<unknown>) => work(tx)) };

    await expect(decideSupportPauseSwap(prisma as never, { ...sac, id: "sac-2" }, "swap-1", { decision: "ACCEPTED" }))
      .rejects.toEqual(new SupportOperationsError("CONFLICT"));
    expect(swapUpdateMany).not.toHaveBeenCalled();
    expect(tx.auditLog.create).not.toHaveBeenCalled();
  });

  it("rejects an accepted swap outside either operator published shift", async () => {
    const requesterBooking = { id: "booking-a", slotId: "slot-a", userId: "sac-1", status: "BOOKED", slot: { startsAt: new Date("2099-07-17T15:00:00.000Z"), endsAt: new Date("2099-07-17T15:30:00.000Z"), teamId: "team-1" } };
    const targetBooking = { id: "booking-b", slotId: "slot-b", userId: "sac-2", status: "BOOKED", slot: { startsAt: new Date("2099-07-17T16:00:00.000Z"), endsAt: new Date("2099-07-17T16:30:00.000Z"), teamId: "team-1" } };
    const bookingUpdateMany = vi.fn();
    const tx = {
      supportPauseSwap: { findFirst: vi.fn().mockResolvedValue({ id: "swap-1", status: "PENDING", expiresAt: null, requesterBooking, targetBooking }) },
      supportPauseBooking: { findFirst: vi.fn().mockResolvedValue(null), deleteMany: vi.fn(), updateMany: bookingUpdateMany },
      supportShiftOccurrence: { findFirst: vi.fn().mockResolvedValueOnce({ id: "occurrence-1" }).mockResolvedValueOnce(null) },
      user: { findFirst: vi.fn().mockResolvedValue({ id: "sac" }) },
      supportTeamMembership: { findFirst: vi.fn().mockResolvedValue({ id: "membership-1" }) },
      auditLog: auditMock()
    };
    const prisma = { $transaction: vi.fn(async (work: (client: unknown) => Promise<unknown>) => work(tx)) };

    await expect(decideSupportPauseSwap(prisma as never, { ...sac, id: "sac-2" }, "swap-1", { decision: "ACCEPTED" }))
      .rejects.toEqual(new SupportOperationsError("CONFLICT"));
    expect(bookingUpdateMany).not.toHaveBeenCalled();
  });

  it("aggregates score, duration, percentage, flow count and open-case gauge by definition", async () => {
    const prisma = performanceListPrisma([
      approvedMetricEntry({ id: "csat-1", value: 4, numerator: 40, denominator: 10 }),
      approvedMetricEntry({ id: "csat-2", value: 5, numerator: 450, denominator: 90, periodStart: new Date("2026-07-08T03:00:00.000Z") }),
      approvedMetricEntry({ id: "sla-1", metric: "SLA_DURATION", unit: "DURATION_SECONDS", value: 600, numerator: 6000, denominator: 10 }),
      approvedMetricEntry({ id: "sla-2", metric: "SLA_DURATION", unit: "DURATION_SECONDS", value: 778, numerator: 70020, denominator: 90, periodStart: new Date("2026-07-08T03:00:00.000Z") }),
      approvedMetricEntry({ id: "rate-1", metric: "SATISFACTION_RATE", unit: "PERCENT", value: 80, numerator: 8, denominator: 10, channel: "TIKTOK", scopeType: "ORGANIZATION", teamId: null, teamLabel: null }),
      approvedMetricEntry({ id: "rate-2", metric: "SATISFACTION_RATE", unit: "PERCENT", value: 100, numerator: 90, denominator: 90, channel: "TIKTOK", scopeType: "ORGANIZATION", teamId: null, teamLabel: null, periodStart: new Date("2026-07-08T03:00:00.000Z") }),
      approvedMetricEntry({ id: "productivity-1", metric: "PRODUCTIVITY", unit: "COUNT", value: 3 }),
      approvedMetricEntry({ id: "productivity-2", metric: "PRODUCTIVITY", unit: "COUNT", value: 4, periodStart: new Date("2026-07-08T03:00:00.000Z") }),
      approvedMetricEntry({ id: "open-1", metric: "RECLAME_AQUI_OPEN", unit: "COUNT", value: 6 }),
      approvedMetricEntry({ id: "open-2", metric: "RECLAME_AQUI_OPEN", unit: "COUNT", value: 4, periodStart: new Date("2026-07-08T03:00:00.000Z"), periodEnd: new Date("2026-07-14T02:59:59.999Z") })
    ]);

    const result = await listSupportPerformance(prisma as never, admin, {});

    expect(result.summary.find((item) => item.metric === "CSAT_SCORE")).toMatchObject({ latest: 5, average: 4.9, samples: 100, aggregation: "WEIGHTED_MEAN", unit: "SCORE_1_5" });
    expect(result.summary.find((item) => item.metric === "SLA_DURATION")).toMatchObject({ latest: 778, average: 760.2, samples: 100, aggregation: "WEIGHTED_MEAN", unit: "DURATION_SECONDS" });
    expect(result.summary.find((item) => item.metric === "SATISFACTION_RATE")).toMatchObject({ average: 98, samples: 100, aggregation: "RATIO", channel: "TIKTOK" });
    expect(result.summary.find((item) => item.metric === "PRODUCTIVITY")).toMatchObject({ average: 7, aggregation: "SUM" });
    expect(result.summary.find((item) => item.metric === "RECLAME_AQUI_OPEN")).toMatchObject({ latest: 4, average: 4, samples: 1, aggregation: "LATEST" });
    expect(prisma.supportKpiEntry.findMany).toHaveBeenCalledWith(expect.objectContaining({
      orderBy: [{ periodEnd: "asc" }, { periodStart: "asc" }, { createdAt: "asc" }]
    }));
  });

  it("keeps channel, granularity, observation type and subject in separate summary series", async () => {
    const base = { metric: "SATISFACTION_RATE", unit: "PERCENT", value: 80, scopeType: "ORGANIZATION", teamId: null, teamLabel: null };
    const prisma = performanceListPrisma([
      approvedMetricEntry({ ...base, id: "tiktok-actual", channel: "TIKTOK" }),
      approvedMetricEntry({ ...base, id: "whatsapp-actual", channel: "WHATSAPP" }),
      approvedMetricEntry({ ...base, id: "tiktok-month", channel: "TIKTOK", granularity: "REPORTED_MONTH" }),
      approvedMetricEntry({ ...base, id: "tiktok-expectation", channel: "TIKTOK", observationType: "EXPECTATION" }),
      approvedMetricEntry({ ...base, id: "team-1", channel: "TIKTOK", scopeType: "TEAM", teamId: "team-1", teamLabel: "SAC Atendimento" }),
      approvedMetricEntry({ ...base, id: "team-2", channel: "TIKTOK", scopeType: "TEAM", teamId: "team-2", teamLabel: "SAC B" }),
      approvedMetricEntry({ ...base, id: "user-1", channel: "TIKTOK", scopeType: "USER", userId: "sac-1" })
    ]);

    const result = await listSupportPerformance(prisma as never, admin, {});
    const satisfaction = result.summary.filter((item) => item.metric === "SATISFACTION_RATE");

    expect(satisfaction).toHaveLength(7);
    expect(satisfaction).toEqual(expect.arrayContaining([
      expect.objectContaining({ channel: "TIKTOK", granularity: "REPORTED_INTERVAL", observationType: "ACTUAL", scopeType: "ORGANIZATION" }),
      expect.objectContaining({ channel: "WHATSAPP", scopeType: "ORGANIZATION" }),
      expect.objectContaining({ channel: "TIKTOK", granularity: "REPORTED_MONTH", scopeType: "ORGANIZATION" }),
      expect.objectContaining({ channel: "TIKTOK", observationType: "EXPECTATION", scopeType: "ORGANIZATION" }),
      expect.objectContaining({ scopeType: "TEAM", teamId: "team-1" }),
      expect.objectContaining({ scopeType: "TEAM", teamId: "team-2" }),
      expect.objectContaining({ scopeType: "USER", userId: "sac-1" })
    ]));
  });

  it("keeps migrated legacy percentages readable without reinterpreting their values", async () => {
    const prisma = performanceListPrisma([
      approvedMetricEntry({ metric: "CSAT_LEGACY_PERCENT", definitionVersion: 1, unit: "PERCENT", value: 94.5, numerator: 94.5, denominator: 100 })
    ]);

    const result = await listSupportPerformance(prisma as never, admin, {});

    expect(result.definitions.find((definition) => definition.key === "CSAT_LEGACY_PERCENT")).toMatchObject({ status: "LEGACY_READ_ONLY", unit: "PERCENT" });
    expect(result.summary).toContainEqual(expect.objectContaining({ metric: "CSAT_LEGACY_PERCENT", latest: 94.5, average: 94.5, unit: "PERCENT" }));
  });

  it("applies channel filters without weakening SAC tenancy and membership windows", async () => {
    const validFrom = new Date("2026-07-10T00:00:00.000Z");
    const validTo = new Date("2026-07-20T23:59:59.999Z");
    const kpiFindMany = vi.fn().mockResolvedValue([]);
    const campaignFindMany = vi.fn().mockResolvedValue([]);
    const teamFindMany = vi.fn().mockResolvedValue([{ id: "team-1", name: "SAC A" }]);
    const prisma = {
      supportTeamMembership: {
        findMany: vi.fn()
          .mockResolvedValueOnce([{ teamId: "team-1", validFrom, validTo }])
          .mockResolvedValueOnce([])
      },
      supportTeam: { findMany: teamFindMany },
      supportKpiEntry: { findMany: kpiFindMany },
      supportCampaign: { findMany: campaignFindMany }
    };

    const result = await listSupportPerformance(prisma as never, sac, {
      from: "2026-07-01T00:00:00.000Z",
      to: "2026-07-31T23:59:59.999Z",
      metric: "SATISFACTION_RATE",
      userId: "user-from-another-tenant",
      channel: "tiktok",
      granularity: "REPORTED_INTERVAL",
      observationType: "ACTUAL"
    });

    expect(result.teams).toEqual([{ id: "team-1", name: "SAC A" }]);
    expect(teamFindMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ id: { in: ["team-1"] } })
    }));
    expect(kpiFindMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        organizationId: "org-1",
        metric: "SATISFACTION_RATE",
        userId: undefined,
        channel: "TIKTOK",
        granularity: "REPORTED_INTERVAL",
        observationType: "ACTUAL",
        OR: expect.arrayContaining([
          expect.objectContaining({ teamId: "team-1", periodStart: { gte: validFrom }, periodEnd: { lte: validTo } })
        ])
      })
    }));
    expect(campaignFindMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        OR: expect.arrayContaining([
          expect.objectContaining({ teamId: "team-1", startsAt: { gte: validFrom }, endsAt: { lte: validTo } })
        ])
      })
    }));
  });

  it("persists CSAT 4.4, SLA 778 seconds and TikTok as a normalized dimension", async () => {
    const prisma = {
      user: { findFirst: vi.fn().mockResolvedValue({ id: "sac-1" }) },
      supportKpiEntry: { create: vi.fn().mockImplementation(({ data }) => Promise.resolve({ id: "kpi-1", ...data })) },
      auditLog: auditMock()
    };
    const input = {
      metric: "CSAT_SCORE",
      value: 4.4,
      sampleSize: 10,
      rawValue: "4,4",
      scopeType: "USER",
      userId: "sac-1",
      periodStart: "2026-07-01T03:00:00.000Z",
      periodEnd: "2026-07-07T02:59:59.999Z",
      source: "Planilha semanal"
    };
    await expect(createSupportKpiEntry(prisma as never, admin, input)).resolves.toMatchObject({
      entry: { metric: "CSAT_SCORE", definitionVersion: 2, unit: "SCORE_1_5", value: 4.4, numerator: 44, denominator: 10 }
    });
    await expect(createSupportKpiEntry(prisma as never, admin, {
      ...input,
      metric: "SLA_DURATION",
      value: 778,
      sampleSize: undefined,
      rawValue: "12min58s",
      scopeType: "ORGANIZATION",
      userId: undefined
    })).resolves.toMatchObject({ entry: { metric: "SLA_DURATION", unit: "DURATION_SECONDS", value: 778, rawValue: "12min58s" } });
    await expect(createSupportKpiEntry(prisma as never, admin, {
      ...input,
      metric: "SATISFACTION_RATE",
      value: 82.8,
      sampleSize: undefined,
      channel: "tiktok",
      scopeType: "ORGANIZATION",
      userId: undefined
    })).resolves.toMatchObject({ entry: { metric: "SATISFACTION_RATE", unit: "PERCENT", channel: "TIKTOK", value: 82.8 } });
    await expect(createSupportKpiEntry(prisma as never, admin, { ...input, value: 94.5 })).rejects.toEqual(new SupportOperationsError("INVALID_INPUT"));
    await expect(createSupportKpiEntry(prisma as never, admin, { ...input, metric: "CSAT_LEGACY_PERCENT" })).rejects.toEqual(new SupportOperationsError("INVALID_INPUT"));
    await expect(createSupportKpiEntry(prisma as never, admin, { ...input, channel: "Tik Tok" })).rejects.toEqual(new SupportOperationsError("INVALID_INPUT"));
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
      id: "kpi-1", organizationId: "org-1", metric: "CSAT_SCORE", definitionVersion: 2, unit: "SCORE_1_5",
      value: 4.2, numerator: 420, denominator: 100, channel: null, granularity: "REPORTED_INTERVAL", observationType: "ACTUAL",
      rawValue: "4,2", dataState: "AVAILABLE",
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

    const result = await updateSupportKpiEntry(prisma as never, admin, "kpi-1", { value: 4.5, sampleSize: 120, rawValue: "4,5" });

    expect(result.entry).toMatchObject({ id: "kpi-2", status: "DRAFT", revision: 2, supersedesId: "kpi-1", value: 4.5, numerator: 540, denominator: 120 });
    expect(prisma.supportKpiEntry.update).not.toHaveBeenCalled();
    expect(prisma.auditLog.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ action: "support_performance.entry.revision.create" }) }));
  });

  it("keeps legacy KPI revisions read-only", async () => {
    const prisma = {
      supportKpiEntry: {
        findFirst: vi.fn().mockResolvedValue(approvedMetricEntry({ metric: "SLA_LEGACY_PERCENT", definitionVersion: 1, unit: "PERCENT", value: 92 }))
      }
    };

    await expect(updateSupportKpiEntry(prisma as never, admin, "legacy-1", { value: 90 }))
      .rejects.toEqual(new SupportOperationsError("INVALID_INPUT"));
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
      scopeType: "ORGANIZATION",
      status: "DRAFT",
      startsAt: "2026-07-17T03:00:00.000Z",
      endsAt: "2026-07-31T02:59:59.999Z"
    });
    expect(result.campaign).toMatchObject({ metric: "RECLAME_AQUI_OPEN", unit: "COUNT", comparison: "LTE", targetValue: 0, status: "DRAFT" });
    await expect(createSupportCampaign(prisma as never, admin, {
      name: "SLA abaixo de 13 minutos",
      metric: "SLA_DURATION",
      targetValue: 780,
      scopeType: "ORGANIZATION",
      startsAt: "2026-07-17T03:00:00.000Z",
      endsAt: "2026-07-31T02:59:59.999Z"
    })).resolves.toMatchObject({ campaign: { metric: "SLA_DURATION", comparison: "LTE", targetValue: 780 } });
    await expect(createSupportCampaign(prisma as never, admin, {
      name: "Publicação direta",
      metric: "CSAT_SCORE",
      targetValue: 4.4,
      scopeType: "ORGANIZATION",
      status: "ACTIVE",
      startsAt: "2026-07-17T03:00:00.000Z",
      endsAt: "2026-07-31T02:59:59.999Z"
    })).rejects.toEqual(new SupportOperationsError("INVALID_INPUT"));
  });

  it("publishes a draft with a fixed audience snapshot, audit and deduplicated notification", async () => {
    const existing = {
      id: "campaign-1", organizationId: "org-1", name: "CSAT alto", description: "Qualidade sustentável", metric: "CSAT_SCORE",
      definitionVersion: 2, unit: "SCORE_1_5", channel: null, granularity: "REPORTED_INTERVAL", observationType: "ACTUAL",
      targetValue: 4.4, comparison: "GTE", scopeType: "ORGANIZATION", userId: null, teamId: null, teamLabel: null,
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

  it("recomputes a draft campaign default comparison when its metric direction changes", async () => {
    const existing = {
      id: "campaign-1", organizationId: "org-1", name: "Qualidade", description: null, metric: "CSAT_SCORE",
      definitionVersion: 2, unit: "SCORE_1_5", channel: null, granularity: "REPORTED_INTERVAL", observationType: "ACTUAL",
      targetValue: 4.4, comparison: "GTE", scopeType: "ORGANIZATION", userId: null, teamId: null, teamLabel: null,
      status: "DRAFT", startsAt: new Date("2026-07-17T03:00:00.000Z"), endsAt: new Date("2026-07-31T02:59:59.999Z"),
      audienceSnapshotJson: null, publishedAt: null, lifecycleVersion: 1
    };
    const update = vi.fn().mockImplementation(({ data }) => Promise.resolve({ ...existing, ...data }));
    const tx = { supportCampaign: { findFirst: vi.fn().mockResolvedValue(existing), update }, auditLog: auditMock() };
    const prisma = { $transaction: vi.fn(async (work: (client: unknown) => Promise<unknown>) => work(tx)) };

    await expect(updateSupportCampaign(prisma as never, admin, "campaign-1", { metric: "SLA_DURATION", targetValue: 778 }))
      .resolves.toMatchObject({ campaign: { metric: "SLA_DURATION", unit: "DURATION_SECONDS", comparison: "LTE", targetValue: 778 } });
    expect(update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ comparison: "LTE" }) }));
  });

  it("blocks destructive edits after publication and freezes approved provenance on close", async () => {
    const audienceSnapshotJson = JSON.stringify({ rule: "FIXED_AT_ACTIVATION", members: [{ id: "sac-1", name: "Ana" }] });
    const existing = {
      id: "campaign-1", organizationId: "org-1", name: "SLA estável", description: null, metric: "SLA_DURATION",
      definitionVersion: 2, unit: "DURATION_SECONDS", channel: null, granularity: "REPORTED_INTERVAL", observationType: "ACTUAL",
      targetValue: 780, comparison: "LTE", scopeType: "ORGANIZATION", userId: null, teamId: null, teamLabel: null,
      status: "ACTIVE", startsAt: new Date("2026-07-01T03:00:00.000Z"), endsAt: new Date("2026-07-31T02:59:59.999Z"),
      audienceSnapshotJson, publishedAt: new Date("2026-07-01T03:00:00.000Z"), lifecycleVersion: 2
    };
    const approved = [{
      id: "kpi-1", metric: "SLA_DURATION", definitionVersion: 2, unit: "DURATION_SECONDS", channel: null,
      granularity: "REPORTED_INTERVAL", observationType: "ACTUAL", value: 778, numerator: 7780, denominator: 10, scopeType: "ORGANIZATION", userId: null,
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

    await expect(updateSupportCampaign(prisma as never, admin, "campaign-1", { targetValue: 700 }))
      .rejects.toEqual(new SupportOperationsError("CONFLICT"));
    await expect(updateSupportCampaign(prisma as never, admin, "campaign-1", { status: "CLOSED" }))
      .resolves.toMatchObject({ campaign: { status: "CLOSED" } });
    const frozen = JSON.parse(campaignUpdate.mock.calls[0]?.[0].data.resultSnapshotJson);
    expect(frozen).toMatchObject({ current: 778, achieved: true, samples: 10, aggregation: "WEIGHTED_MEAN" });
    expect(frozen.provenance).toEqual([expect.objectContaining({ entryId: "kpi-1", revision: 2, source: "Painel oficial" })]);
  });

  it("evaluates campaign progress with the same weighted period aggregation as performance", async () => {
    const prisma = {
      supportCampaign: { findMany: vi.fn().mockResolvedValue([{
        id: "campaign-1",
        organizationId: "org-1",
        name: "CSAT 4,8",
        metric: "CSAT_SCORE",
        definitionVersion: 2,
        unit: "SCORE_1_5",
        channel: null,
        granularity: "REPORTED_INTERVAL",
        observationType: "ACTUAL",
        targetValue: 4.8,
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
          metric: "CSAT_SCORE", definitionVersion: 2, unit: "SCORE_1_5", channel: null, granularity: "REPORTED_INTERVAL", observationType: "ACTUAL",
          value: 4, numerator: 40, denominator: 10, scopeType: "TEAM", userId: null, teamId: "team-1", teamLabel: "SAC Atendimento",
          periodStart: new Date("2026-07-01T03:00:00.000Z"), periodEnd: new Date("2026-07-07T02:59:59.999Z")
        },
        {
          metric: "CSAT_SCORE", definitionVersion: 2, unit: "SCORE_1_5", channel: null, granularity: "REPORTED_INTERVAL", observationType: "ACTUAL",
          value: 5, numerator: 450, denominator: 90, scopeType: "TEAM", userId: null, teamId: "team-1", teamLabel: "SAC Atendimento",
          periodStart: new Date("2026-07-08T03:00:00.000Z"), periodEnd: new Date("2026-07-14T02:59:59.999Z")
        }
      ]) }
    };

    const result = await listSupportCampaigns(prisma as never, admin);

    expect(result.items[0]?.result).toMatchObject({
      current: 4.9,
      average: 4.9,
      samples: 100,
      aggregation: "WEIGHTED_MEAN",
      achieved: true,
      progressPercent: 100,
      frozenAt: null
    });
    expect(result.items[0]?.result.trend).toHaveLength(2);
    expect(result.items[0]?.result.provenance).toHaveLength(2);
  });

  it("evaluates a campaign only against its exact channel and reporting series", async () => {
    const campaign = {
      id: "campaign-tiktok",
      organizationId: "org-1",
      name: "Satisfação TikTok",
      metric: "SATISFACTION_RATE",
      definitionVersion: 2,
      unit: "PERCENT",
      channel: "TIKTOK",
      granularity: "REPORTED_INTERVAL",
      observationType: "ACTUAL",
      targetValue: 80,
      comparison: "GTE",
      scopeType: "ORGANIZATION",
      userId: null,
      teamId: null,
      teamLabel: null,
      status: "ACTIVE",
      startsAt: new Date("2026-07-01T03:00:00.000Z"),
      endsAt: new Date("2026-08-01T02:59:59.999Z"),
      audienceSnapshotJson: null,
      resultSnapshotJson: null,
      resultSnapshotAt: null
    };
    const base = approvedMetricEntry({ metric: "SATISFACTION_RATE", unit: "PERCENT", value: 80, scopeType: "ORGANIZATION", teamId: null, teamLabel: null });
    const prisma = {
      supportCampaign: { findMany: vi.fn().mockResolvedValue([campaign]) },
      supportTeam: { findMany: vi.fn().mockResolvedValue([]) },
      supportKpiEntry: { findMany: vi.fn().mockResolvedValue([
        { ...base, id: "matching", channel: "TIKTOK" },
        { ...base, id: "other-channel", channel: "WHATSAPP", value: 100 },
        { ...base, id: "monthly", channel: "TIKTOK", granularity: "REPORTED_MONTH", value: 100 },
        { ...base, id: "expectation", channel: "TIKTOK", observationType: "EXPECTATION", value: 100 }
      ]) }
    };

    const result = await listSupportCampaigns(prisma as never, admin);

    expect(result.items[0]?.result).toMatchObject({ current: 80, average: 80, samples: 1, aggregation: "MEAN", achieved: true });
    expect(result.items[0]?.result.trend).toHaveLength(1);
    expect(result.items[0]?.result.trend[0]).toMatchObject({ entryId: "matching", channel: "TIKTOK", granularity: "REPORTED_INTERVAL", observationType: "ACTUAL" });
  });

  it("does not enumerate support teams outside a SAC membership", async () => {
    const prisma = {
      supportTeamMembership: { findMany: vi.fn().mockResolvedValue([{ teamId: "team-1" }]) },
      supportCampaign: { findMany: vi.fn().mockResolvedValue([]) },
      supportTeam: { findMany: vi.fn().mockResolvedValue([{ id: "team-1", name: "SAC Atendimento" }]) }
    };

    const result = await listSupportCampaigns(prisma as never, sac);

    expect(result.teams).toEqual([{ id: "team-1", name: "SAC Atendimento" }]);
    expect(prisma.supportTeam.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ id: { in: ["team-1"] } })
    }));
  });
});
