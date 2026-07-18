import { Prisma, type PrismaClient } from "@prisma/client";
import type { CurrentUser } from "@alwaystrack/shared";
import { recordAuditLog } from "../audit/audit.service.js";

export const supportMetricKeys = ["CSAT", "PRODUCTIVITY", "SLA", "RECLAME_AQUI_OPEN"] as const;
export type SupportMetricKey = (typeof supportMetricKeys)[number];

const campaignStatuses = ["DRAFT", "ACTIVE", "PAUSED", "CLOSED"] as const;
const scopeTypes = ["ORGANIZATION", "USER", "TEAM"] as const;
const comparisons = ["GTE", "LTE"] as const;

export class SupportOperationsError extends Error {
  constructor(public readonly code: "NOT_FOUND" | "FORBIDDEN" | "CONFLICT" | "INVALID_INPUT") {
    super(code);
  }
}

function isManager(actor: CurrentUser) {
  return actor.role === "ADMIN" || actor.role === "GESTOR";
}

function requiredString(value: unknown, max = 160) {
  if (typeof value !== "string") throw new SupportOperationsError("INVALID_INPUT");
  const normalized = value.trim();
  if (!normalized || normalized.length > max) throw new SupportOperationsError("INVALID_INPUT");
  return normalized;
}

function optionalString(value: unknown, max = 1000) {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string") throw new SupportOperationsError("INVALID_INPUT");
  const normalized = value.trim();
  if (normalized.length > max) throw new SupportOperationsError("INVALID_INPUT");
  return normalized || null;
}

function numberInRange(value: unknown, minimum: number, maximum: number) {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed) || parsed < minimum || parsed > maximum) throw new SupportOperationsError("INVALID_INPUT");
  return parsed;
}

function integerInRange(value: unknown, minimum: number, maximum: number) {
  const parsed = numberInRange(value, minimum, maximum);
  if (!Number.isInteger(parsed)) throw new SupportOperationsError("INVALID_INPUT");
  return parsed;
}

function parseDateTime(value: unknown) {
  if (typeof value !== "string") throw new SupportOperationsError("INVALID_INPUT");
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) throw new SupportOperationsError("INVALID_INPUT");
  return parsed;
}

function dateRange(dateText?: string) {
  const fallback = new Date().toISOString().slice(0, 10);
  const date = dateText && /^\d{4}-\d{2}-\d{2}$/.test(dateText) ? dateText : fallback;
  const start = new Date(`${date}T00:00:00-03:00`);
  const end = new Date(`${date}T23:59:59.999-03:00`);
  return { date, start, end };
}

function overlaps(startsAt: Date, endsAt: Date) {
  return { startsAt: { lt: endsAt }, endsAt: { gt: startsAt } };
}

function activeMembership(startsAt: Date, endsAt = startsAt): Prisma.SupportTeamMembershipWhereInput {
  return {
    validFrom: { lte: endsAt },
    OR: [{ validTo: null }, { validTo: { gte: startsAt } }]
  };
}

function uniqueAgents<T extends { user: { id: string } }>(memberships: T[]) {
  return [...new Map(memberships.map((membership) => [membership.user.id, membership.user])).values()];
}

function isRetryableTransactionError(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && error.code === "P2034";
}

function policyDefaults(organizationId: string) {
  return {
    id: null,
    organizationId,
    timezone: "America/Sao_Paulo",
    minimumCoverage: 2,
    slotMinutes: 15,
    active: true
  };
}

export async function listSupportPauses(prisma: PrismaClient, actor: CurrentUser, dateText?: string, requestedTeamId?: string) {
  const { date, start, end } = dateRange(dateText);
  const teams = await prisma.supportTeam.findMany({
    where: { organizationId: actor.organizationId, active: true },
    select: { id: true, name: true },
    orderBy: { name: "asc" }
  });
  const actorMemberships = actor.role === "SAC"
    ? await prisma.supportTeamMembership.findMany({
        where: { organizationId: actor.organizationId, userId: actor.id, team: { active: true }, ...activeMembership(start, end) },
        select: { teamId: true }
      })
    : [];
  const allowedTeamIds = new Set(actorMemberships.map((membership) => membership.teamId));
  if (requestedTeamId && !teams.some((team) => team.id === requestedTeamId)) throw new SupportOperationsError("NOT_FOUND");
  if (requestedTeamId && actor.role === "SAC" && !allowedTeamIds.has(requestedTeamId)) throw new SupportOperationsError("FORBIDDEN");
  const teamId = requestedTeamId
    ?? (actor.role === "SAC" ? actorMemberships[0]?.teamId : teams[0]?.id)
    ?? null;
  const memberships = teamId
    ? await prisma.supportTeamMembership.findMany({
        where: { organizationId: actor.organizationId, teamId, user: { active: true, role: "SAC" }, ...activeMembership(start, end) },
        include: { user: { select: { id: true, name: true, email: true } } },
        orderBy: { user: { name: "asc" } }
      })
    : [];
  const membershipAgents = uniqueAgents(memberships);
  const fallbackAgents = teams.length === 0
    ? await prisma.user.findMany({
        where: { organizationId: actor.organizationId, role: "SAC", active: true },
        select: { id: true, name: true, email: true },
        orderBy: [{ name: "asc" }, { email: "asc" }]
      })
    : [];
  const agents = teamId ? membershipAgents : fallbackAgents;
  const [storedPolicy, slots, swaps] = await Promise.all([
    prisma.supportPausePolicy.findUnique({ where: { organizationId: actor.organizationId } }),
    prisma.supportPauseSlot.findMany({
      where: {
        organizationId: actor.organizationId,
        startsAt: { gte: start, lte: end },
        ...(teamId ? { OR: [{ teamId }, { teamId: null }] } : {})
      },
      include: {
        bookings: {
          where: { status: "BOOKED" },
          include: { user: { select: { id: true, name: true, email: true } } },
          orderBy: { createdAt: "asc" }
        }
      },
      orderBy: [{ startsAt: "asc" }, { endsAt: "asc" }]
    }),
    prisma.supportPauseSwap.findMany({
      where: {
        organizationId: actor.organizationId,
        OR: [
          { status: "PENDING" },
          { updatedAt: { gte: start, lte: end } }
        ]
      },
      include: {
        requestedBy: { select: { id: true, name: true, email: true } },
        decidedBy: { select: { id: true, name: true, email: true } },
        requesterBooking: { include: { user: { select: { id: true, name: true, email: true } }, slot: true } },
        targetBooking: { include: { user: { select: { id: true, name: true, email: true } }, slot: true } }
      },
      orderBy: { createdAt: "desc" },
      take: 50
    })
  ]);
  const policy = storedPolicy ?? policyDefaults(actor.organizationId);
  const relevantStarts = slots.map((slot) => slot.startsAt.getTime());
  const relevantEnds = slots.map((slot) => slot.endsAt.getTime());
  const timelineStart = relevantStarts.length ? Math.min(...relevantStarts) : start.getTime() + 8 * 60 * 60 * 1000;
  const timelineEnd = relevantEnds.length ? Math.max(...relevantEnds) : start.getTime() + 18 * 60 * 60 * 1000;
  const timeline = [];
  for (let point = timelineStart; point < timelineEnd; point += policy.slotMinutes * 60 * 1000) {
    const intervalStart = new Date(point);
    const intervalEnd = new Date(Math.min(point + policy.slotMinutes * 60 * 1000, timelineEnd));
    const pausedUsers = new Set(slots.flatMap((slot) =>
      slot.startsAt < intervalEnd && slot.endsAt > intervalStart ? slot.bookings.map((booking) => booking.userId) : []
    ));
    const pausedCount = pausedUsers.size;
    const availableCount = Math.max(agents.length - pausedCount, 0);
    timeline.push({
      startsAt: intervalStart,
      endsAt: intervalEnd,
      pausedCount,
      availableCount,
      critical: availableCount < policy.minimumCoverage
    });
  }
  return {
    date,
    canManage: isManager(actor),
    teams,
    selectedTeamId: teamId,
    membershipMode: teams.length ? "DATED_MEMBERSHIP" : "ROLE_FALLBACK",
    policy,
    agents,
    summary: {
      activeAgents: agents.length,
      minimumCoverage: policy.minimumCoverage,
      bookedPauses: slots.reduce((total, slot) => total + slot.bookings.length, 0),
      criticalIntervals: timeline.filter((item) => item.critical).length
    },
    timeline,
    slots: slots.map((slot) => ({
      ...slot,
      bookedCount: slot.bookings.length,
      remainingCapacity: Math.max(slot.capacity - slot.bookings.length, 0),
      myBooking: slot.bookings.find((booking) => booking.userId === actor.id) ?? null
    })),
    swaps
  };
}

export async function updateSupportPausePolicy(prisma: PrismaClient, actor: CurrentUser, input: unknown) {
  if (!isManager(actor) || !input || typeof input !== "object") throw new SupportOperationsError("FORBIDDEN");
  const body = input as Record<string, unknown>;
  const data = {
    timezone: optionalString(body.timezone, 80) ?? "America/Sao_Paulo",
    minimumCoverage: integerInRange(body.minimumCoverage, 1, 500),
    slotMinutes: integerInRange(body.slotMinutes, 5, 120),
    active: body.active !== false
  };
  const policy = await prisma.supportPausePolicy.upsert({
    where: { organizationId: actor.organizationId },
    create: { organizationId: actor.organizationId, ...data },
    update: data
  });
  await recordAuditLog(prisma, {
    organizationId: actor.organizationId,
    actorId: actor.id,
    action: "support_pause.policy.update",
    entityType: "SupportPausePolicy",
    entityId: policy.id,
    metadata: data
  });
  return { policy };
}

export async function createSupportPauseSlot(prisma: PrismaClient, actor: CurrentUser, input: unknown) {
  if (!isManager(actor) || !input || typeof input !== "object") throw new SupportOperationsError("FORBIDDEN");
  const body = input as Record<string, unknown>;
  const startsAt = parseDateTime(body.startsAt);
  const endsAt = parseDateTime(body.endsAt);
  if (endsAt <= startsAt || endsAt.getTime() - startsAt.getTime() > 4 * 60 * 60 * 1000) throw new SupportOperationsError("INVALID_INPUT");
  const teamId = body.teamId
    ? requiredString(body.teamId)
    : (await prisma.supportTeam.findFirst({
        where: { organizationId: actor.organizationId, active: true },
        select: { id: true },
        orderBy: { name: "asc" }
      }))?.id ?? null;
  if (teamId) await ensureSupportTeam(prisma, actor.organizationId, teamId);
  const slot = await prisma.supportPauseSlot.create({
    data: {
      organizationId: actor.organizationId,
      label: optionalString(body.label, 80),
      startsAt,
      endsAt,
      capacity: integerInRange(body.capacity ?? 1, 1, 100),
      teamId,
      createdById: actor.id
    }
  }).catch(() => { throw new SupportOperationsError("CONFLICT"); });
  await recordAuditLog(prisma, {
    organizationId: actor.organizationId,
    actorId: actor.id,
    action: "support_pause.slot.create",
    entityType: "SupportPauseSlot",
    entityId: slot.id,
    metadata: { startsAt, endsAt, capacity: slot.capacity }
  });
  return { slot };
}

async function ensureSupportAgent(prisma: PrismaClient | Prisma.TransactionClient, organizationId: string, userId: string, teamId?: string | null, at = new Date()) {
  const user = await prisma.user.findFirst({ where: { id: userId, organizationId, role: "SAC", active: true }, select: { id: true } });
  if (!user) throw new SupportOperationsError("NOT_FOUND");
  if (teamId) {
    const membership = await prisma.supportTeamMembership.findFirst({
      where: { organizationId, teamId, userId, ...activeMembership(at) },
      select: { id: true }
    });
    if (!membership) throw new SupportOperationsError("FORBIDDEN");
  }
}

async function ensureSupportTeam(prisma: PrismaClient | Prisma.TransactionClient, organizationId: string, teamId: string) {
  const team = await prisma.supportTeam.findFirst({ where: { id: teamId, organizationId, active: true }, select: { id: true, name: true } });
  if (!team) throw new SupportOperationsError("NOT_FOUND");
  return team;
}

export async function bookSupportPauseSlot(prisma: PrismaClient, actor: CurrentUser, slotId: string, input: unknown) {
  const body = input && typeof input === "object" ? input as Record<string, unknown> : {};
  const requestedUserId = typeof body.userId === "string" ? body.userId : actor.id;
  const overrideCoverage = body.overrideCoverage === true;
  if (requestedUserId !== actor.id && !isManager(actor)) throw new SupportOperationsError("FORBIDDEN");
  if (overrideCoverage && !isManager(actor)) throw new SupportOperationsError("FORBIDDEN");
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await prisma.$transaction(async (tx) => {
        const slot = await tx.supportPauseSlot.findFirst({
          where: { id: slotId, organizationId: actor.organizationId, active: true },
          include: { bookings: { where: { status: "BOOKED" } } }
        });
        if (!slot) throw new SupportOperationsError("NOT_FOUND");
        if (slot.startsAt <= new Date()) throw new SupportOperationsError("CONFLICT");
        await ensureSupportAgent(tx, actor.organizationId, requestedUserId, slot.teamId, slot.startsAt);
        if (slot.bookings.length >= slot.capacity) throw new SupportOperationsError("CONFLICT");
        const existingOverlap = await tx.supportPauseBooking.findFirst({
          where: {
            organizationId: actor.organizationId,
            userId: requestedUserId,
            status: "BOOKED",
            slot: overlaps(slot.startsAt, slot.endsAt)
          }
        });
        if (existingOverlap) throw new SupportOperationsError("CONFLICT");
        const [policy, membershipCount, roleCount, overlappingBookings] = await Promise.all([
          tx.supportPausePolicy.findUnique({ where: { organizationId: actor.organizationId } }),
          slot.teamId
            ? tx.supportTeamMembership.findMany({
                where: { organizationId: actor.organizationId, teamId: slot.teamId, user: { active: true, role: "SAC" }, ...activeMembership(slot.startsAt, slot.endsAt) },
                distinct: ["userId"],
                select: { userId: true }
              })
            : Promise.resolve([]),
          slot.teamId ? Promise.resolve(0) : tx.user.count({ where: { organizationId: actor.organizationId, role: "SAC", active: true } }),
          tx.supportPauseBooking.findMany({
            where: {
              organizationId: actor.organizationId,
              status: "BOOKED",
              slot: { ...overlaps(slot.startsAt, slot.endsAt), ...(slot.teamId ? { OR: [{ teamId: slot.teamId }, { teamId: null }] } : {}) }
            },
            select: { userId: true }
          })
        ]);
        const activeAgents = slot.teamId ? membershipCount.length : roleCount;
        const pausedUsers = new Set(overlappingBookings.map((booking) => booking.userId));
        pausedUsers.add(requestedUserId);
        const minimumCoverage = policy?.minimumCoverage ?? 2;
        if (!overrideCoverage && activeAgents - pausedUsers.size < minimumCoverage) throw new SupportOperationsError("CONFLICT");
        const existing = await tx.supportPauseBooking.findUnique({ where: { slotId_userId: { slotId, userId: requestedUserId } } });
        const booking = existing
          ? await tx.supportPauseBooking.update({ where: { id: existing.id }, data: { status: "BOOKED" } })
          : await tx.supportPauseBooking.create({ data: { organizationId: actor.organizationId, slotId, userId: requestedUserId } });
        await tx.auditLog.create({
          data: {
            organizationId: actor.organizationId,
            actorId: actor.id,
            action: overrideCoverage ? "support_pause.booking.override" : "support_pause.booking.create",
            entityType: "SupportPauseBooking",
            entityId: booking.id,
            metadataJson: JSON.stringify({ slotId, userId: requestedUserId, overrideCoverage, teamId: slot.teamId })
          }
        });
        return { booking };
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    } catch (error) {
      if (isRetryableTransactionError(error) && attempt < 2) continue;
      if (typeof error === "object" && error !== null && "code" in error && error.code === "P2002") throw new SupportOperationsError("CONFLICT");
      throw error;
    }
  }
  throw new SupportOperationsError("CONFLICT");
}

export async function cancelSupportPauseBooking(prisma: PrismaClient, actor: CurrentUser, bookingId: string) {
  const booking = await prisma.supportPauseBooking.findFirst({ where: { id: bookingId, organizationId: actor.organizationId } });
  if (!booking) throw new SupportOperationsError("NOT_FOUND");
  if (booking.userId !== actor.id && !isManager(actor)) throw new SupportOperationsError("FORBIDDEN");
  const updated = await prisma.$transaction(async (tx) => {
    await tx.supportPauseSwap.updateMany({
      where: { status: "PENDING", OR: [{ requesterBookingId: booking.id }, { targetBookingId: booking.id }] },
      data: { status: "CANCELLED", decidedById: actor.id, decidedAt: new Date() }
    });
    return tx.supportPauseBooking.update({ where: { id: booking.id }, data: { status: "CANCELLED" } });
  });
  await recordAuditLog(prisma, {
    organizationId: actor.organizationId,
    actorId: actor.id,
    action: "support_pause.booking.cancel",
    entityType: "SupportPauseBooking",
    entityId: booking.id
  });
  return { booking: updated };
}

export async function requestSupportPauseSwap(prisma: PrismaClient, actor: CurrentUser, input: unknown) {
  if (!input || typeof input !== "object") throw new SupportOperationsError("INVALID_INPUT");
  const body = input as Record<string, unknown>;
  const requesterBookingId = requiredString(body.requesterBookingId);
  const targetBookingId = requiredString(body.targetBookingId);
  if (requesterBookingId === targetBookingId) throw new SupportOperationsError("INVALID_INPUT");
  const [requesterBooking, targetBooking] = await Promise.all([
    prisma.supportPauseBooking.findFirst({ where: { id: requesterBookingId, organizationId: actor.organizationId, status: "BOOKED" } }),
    prisma.supportPauseBooking.findFirst({ where: { id: targetBookingId, organizationId: actor.organizationId, status: "BOOKED" } })
  ]);
  if (!requesterBooking || !targetBooking) throw new SupportOperationsError("NOT_FOUND");
  if (requesterBooking.userId !== actor.id || targetBooking.userId === actor.id) throw new SupportOperationsError("FORBIDDEN");
  const pending = await prisma.supportPauseSwap.findFirst({
    where: { organizationId: actor.organizationId, requesterBookingId, targetBookingId, status: "PENDING" }
  });
  if (pending) throw new SupportOperationsError("CONFLICT");
  const swap = await prisma.supportPauseSwap.create({
    data: {
      organizationId: actor.organizationId,
      requesterBookingId,
      targetBookingId,
      requestedById: actor.id,
      note: optionalString(body.note, 300)
    }
  });
  await recordAuditLog(prisma, {
    organizationId: actor.organizationId,
    actorId: actor.id,
    action: "support_pause.swap.request",
    entityType: "SupportPauseSwap",
    entityId: swap.id,
    metadata: { requesterBookingId, targetBookingId }
  });
  return { swap };
}

export async function decideSupportPauseSwap(prisma: PrismaClient, actor: CurrentUser, swapId: string, input: unknown) {
  if (!input || typeof input !== "object") throw new SupportOperationsError("INVALID_INPUT");
  const decision = requiredString((input as Record<string, unknown>).decision, 20).toUpperCase();
  if (decision !== "ACCEPTED" && decision !== "DECLINED") throw new SupportOperationsError("INVALID_INPUT");
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await prisma.$transaction(async (tx) => {
        const swap = await tx.supportPauseSwap.findFirst({
          where: { id: swapId, organizationId: actor.organizationId, status: "PENDING" },
          include: { requesterBooking: { include: { slot: true } }, targetBooking: { include: { slot: true } } }
        });
        if (!swap) throw new SupportOperationsError("NOT_FOUND");
        if (swap.targetBooking.userId !== actor.id && !isManager(actor)) throw new SupportOperationsError("FORBIDDEN");
        if (decision === "ACCEPTED") {
          const [requesterConflict, targetConflict] = await Promise.all([
            tx.supportPauseBooking.findFirst({
              where: { organizationId: actor.organizationId, userId: swap.requesterBooking.userId, status: "BOOKED", id: { not: swap.requesterBooking.id }, slot: overlaps(swap.targetBooking.slot.startsAt, swap.targetBooking.slot.endsAt) }
            }),
            tx.supportPauseBooking.findFirst({
              where: { organizationId: actor.organizationId, userId: swap.targetBooking.userId, status: "BOOKED", id: { not: swap.targetBooking.id }, slot: overlaps(swap.requesterBooking.slot.startsAt, swap.requesterBooking.slot.endsAt) }
            })
          ]);
          if (requesterConflict || targetConflict) throw new SupportOperationsError("CONFLICT");
          await tx.supportPauseBooking.deleteMany({
            where: {
              status: "CANCELLED",
              OR: [
                { slotId: swap.targetBooking.slotId, userId: swap.requesterBooking.userId },
                { slotId: swap.requesterBooking.slotId, userId: swap.targetBooking.userId }
              ]
            }
          });
          const requesterSlotId = swap.requesterBooking.slotId;
          await tx.supportPauseBooking.update({ where: { id: swap.requesterBooking.id }, data: { slotId: swap.targetBooking.slotId } });
          await tx.supportPauseBooking.update({ where: { id: swap.targetBooking.id }, data: { slotId: requesterSlotId } });
        }
        const updated = await tx.supportPauseSwap.update({
          where: { id: swap.id },
          data: { status: decision, decidedById: actor.id, decidedAt: new Date() }
        });
        await tx.auditLog.create({
          data: {
            organizationId: actor.organizationId,
            actorId: actor.id,
            action: `support_pause.swap.${decision.toLowerCase()}`,
            entityType: "SupportPauseSwap",
            entityId: swap.id
          }
        });
        return { swap: updated };
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    } catch (error) {
      if (isRetryableTransactionError(error) && attempt < 2) continue;
      if (typeof error === "object" && error !== null && "code" in error && error.code === "P2002") throw new SupportOperationsError("CONFLICT");
      throw error;
    }
  }
  throw new SupportOperationsError("CONFLICT");
}

function parseMetric(value: unknown): SupportMetricKey {
  const metric = requiredString(value, 40).toUpperCase();
  if (!(supportMetricKeys as readonly string[]).includes(metric)) throw new SupportOperationsError("INVALID_INPUT");
  return metric as SupportMetricKey;
}

function parseScope(body: Record<string, unknown>) {
  const scopeType = requiredString(body.scopeType ?? "ORGANIZATION", 30).toUpperCase();
  if (!(scopeTypes as readonly string[]).includes(scopeType)) throw new SupportOperationsError("INVALID_INPUT");
  const userId = scopeType === "USER" ? requiredString(body.userId) : null;
  const teamId = scopeType === "TEAM" ? optionalString(body.teamId, 160) : null;
  const teamLabel = scopeType === "TEAM" ? optionalString(body.teamLabel, 80) : null;
  if (scopeType === "TEAM" && !teamId && !teamLabel) throw new SupportOperationsError("INVALID_INPUT");
  return { scopeType, userId, teamId, teamLabel };
}

function validateMetricValue(metric: SupportMetricKey, value: unknown) {
  if (metric === "CSAT" || metric === "SLA") return numberInRange(value, 0, 100);
  if (metric === "RECLAME_AQUI_OPEN") return integerInRange(value, 0, 100000);
  return numberInRange(value, 0, 1000000);
}

function performanceWhere(actor: CurrentUser, query: { from?: string; to?: string; metric?: string; userId?: string }) {
  const to = query.to ? parseDateTime(query.to) : new Date();
  const from = query.from ? parseDateTime(query.from) : new Date(to.getTime() - 30 * 24 * 60 * 60 * 1000);
  const metric = query.metric ? parseMetric(query.metric) : undefined;
  const where: Prisma.SupportKpiEntryWhereInput = {
    organizationId: actor.organizationId,
    archivedAt: null,
    metric,
    userId: isManager(actor) ? query.userId || undefined : undefined,
    periodStart: { gte: from, lte: to },
    OR: isManager(actor) ? undefined : [{ userId: actor.id }, { scopeType: "ORGANIZATION" }]
  };
  return { where, from, to };
}

function percentageWeight(metric: SupportMetricKey, value: number, body: Record<string, unknown>, fallbackDenominator: number | null = null) {
  if (metric !== "CSAT" && metric !== "SLA") return { numerator: null, denominator: null };
  const supplied = body.denominator ?? body.sampleSize;
  const denominator = supplied === undefined ? fallbackDenominator : numberInRange(supplied, 1, 1_000_000);
  return denominator === null
    ? { numerator: null, denominator: null }
    : { numerator: value * denominator / 100, denominator };
}

function aggregateMetricEntries(metric: SupportMetricKey, entries: Array<{ value: number; numerator: number | null; denominator: number | null }>) {
  const canWeight = (metric === "CSAT" || metric === "SLA")
    && entries.length > 0
    && entries.every((entry) => entry.numerator !== null && entry.denominator !== null && entry.denominator > 0);
  const denominator = canWeight ? entries.reduce((total, entry) => total + (entry.denominator ?? 0), 0) : null;
  const average = canWeight && denominator
    ? entries.reduce((total, entry) => total + (entry.numerator ?? 0), 0) / denominator * 100
    : entries.length ? entries.reduce((total, entry) => total + entry.value, 0) / entries.length : null;
  return {
    average,
    samples: denominator ?? entries.length,
    aggregation: canWeight ? "WEIGHTED" as const : "SIMPLE" as const
  };
}

function campaignProgress(comparison: string, targetValue: number, current: number | null) {
  if (current === null) return { achieved: false, progressPercent: 0 };
  const achieved = comparison === "LTE" ? current <= targetValue : current >= targetValue;
  if (achieved) return { achieved, progressPercent: 100 };
  if (comparison === "LTE") {
    return { achieved, progressPercent: current > 0 ? Math.max(Math.min(targetValue / current * 100, 99), 0) : 0 };
  }
  return { achieved, progressPercent: targetValue > 0 ? Math.max(Math.min(current / targetValue * 100, 99), 0) : 0 };
}

export async function listSupportPerformance(prisma: PrismaClient, actor: CurrentUser, query: { from?: string; to?: string; metric?: string; userId?: string }) {
  const { where, from, to } = performanceWhere(actor, query);
  const [actorMemberships, allTeams] = await Promise.all([
    actor.role === "SAC"
      ? prisma.supportTeamMembership.findMany({
          where: { organizationId: actor.organizationId, userId: actor.id, ...activeMembership(from, to) },
          select: { teamId: true }
        })
      : Promise.resolve([]),
    prisma.supportTeam.findMany({
      where: { organizationId: actor.organizationId, active: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" }
    })
  ]);
  const actorTeamIds = actorMemberships.map((membership) => membership.teamId);
  if (!isManager(actor)) {
    where.OR = [{ userId: actor.id }, { scopeType: "ORGANIZATION" }, ...(actorTeamIds.length ? [{ teamId: { in: actorTeamIds } }] : [])];
    where.status = "APPROVED";
  }
  const teamMemberships = await prisma.supportTeamMembership.findMany({
    where: {
      organizationId: actor.organizationId,
      ...(isManager(actor) ? {} : { teamId: { in: actorTeamIds } }),
      user: { active: true, role: "SAC" },
      ...activeMembership(new Date())
    },
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: { user: { name: "asc" } }
  });
  const membershipAgents = uniqueAgents(teamMemberships);
  const fallbackAgents = allTeams.length === 0
    ? await prisma.user.findMany({
        where: { organizationId: actor.organizationId, role: "SAC", active: true },
        select: { id: true, name: true, email: true },
        orderBy: { name: "asc" }
      })
    : [];
  const agents = membershipAgents.length ? membershipAgents : fallbackAgents;
  const [entries, campaigns] = await Promise.all([
    prisma.supportKpiEntry.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true } },
        team: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true } }
      },
      orderBy: [{ periodStart: "asc" }, { createdAt: "asc" }],
      take: 1000
    }),
    prisma.supportCampaign.findMany({
      where: {
        organizationId: actor.organizationId,
        status: { in: ["ACTIVE", "PAUSED"] },
        OR: isManager(actor) ? undefined : [
          { scopeType: "ORGANIZATION" },
          { userId: actor.id },
          ...(actorTeamIds.length ? [{ teamId: { in: actorTeamIds } }] : [])
        ]
      },
      include: { user: { select: { id: true, name: true, email: true } }, team: { select: { id: true, name: true } } },
      orderBy: [{ endsAt: "asc" }, { name: "asc" }]
    })
  ]);
  const approvedEntries = entries.filter((entry) => entry.status === "APPROVED");
  const summary = supportMetricKeys.map((metric) => {
    const metricEntries = approvedEntries.filter((entry) => entry.metric === metric);
    const latest = metricEntries.at(-1) ?? null;
    const aggregate = aggregateMetricEntries(metric, metricEntries);
    return {
      metric,
      latest: latest?.value ?? null,
      ...aggregate
    };
  });
  return {
    canManage: isManager(actor),
    period: { from, to },
    agents,
    teams: allTeams,
    summary,
    entries,
    pendingReviewCount: entries.filter((entry) => entry.status === "SUBMITTED").length,
    campaigns
  };
}

export async function createSupportKpiEntry(prisma: PrismaClient, actor: CurrentUser, input: unknown) {
  if (!isManager(actor) || !input || typeof input !== "object") throw new SupportOperationsError("FORBIDDEN");
  const body = input as Record<string, unknown>;
  const metric = parseMetric(body.metric);
  const scope = parseScope(body);
  const periodStart = parseDateTime(body.periodStart);
  const periodEnd = parseDateTime(body.periodEnd);
  if (periodEnd < periodStart) throw new SupportOperationsError("INVALID_INPUT");
  if (scope.userId) await ensureSupportAgent(prisma, actor.organizationId, scope.userId);
  if (scope.teamId) {
    const team = await ensureSupportTeam(prisma, actor.organizationId, scope.teamId);
    scope.teamLabel ??= team.name;
  }
  const value = validateMetricValue(metric, body.value);
  const weight = percentageWeight(metric, value, body);
  const entry = await prisma.supportKpiEntry.create({
    data: {
      organizationId: actor.organizationId,
      metric,
      value,
      ...weight,
      ...scope,
      periodStart,
      periodEnd,
      source: optionalString(body.source, 160),
      note: optionalString(body.note, 1000),
      createdById: actor.id,
      updatedById: actor.id,
      status: "DRAFT"
    },
    include: { user: { select: { id: true, name: true, email: true } } }
  });
  await recordAuditLog(prisma, {
    organizationId: actor.organizationId,
    actorId: actor.id,
    action: "support_performance.entry.draft.create",
    entityType: "SupportKpiEntry",
    entityId: entry.id,
    metadata: { metric, scopeType: scope.scopeType, userId: scope.userId, periodStart, periodEnd }
  });
  return { entry };
}

export async function updateSupportKpiEntry(prisma: PrismaClient, actor: CurrentUser, entryId: string, input: unknown) {
  if (!isManager(actor) || !input || typeof input !== "object") throw new SupportOperationsError("FORBIDDEN");
  const existing = await prisma.supportKpiEntry.findFirst({ where: { id: entryId, organizationId: actor.organizationId, archivedAt: null } });
  if (!existing) throw new SupportOperationsError("NOT_FOUND");
  const body = input as Record<string, unknown>;
  const metric = body.metric === undefined ? existing.metric as SupportMetricKey : parseMetric(body.metric);
  const value = body.value === undefined ? existing.value : validateMetricValue(metric, body.value);
  const weight = percentageWeight(metric, value, body, existing.denominator);
  if (existing.status === "SUBMITTED" || existing.status === "SUPERSEDED") throw new SupportOperationsError("CONFLICT");
  if (body.archived === true && existing.status === "APPROVED") throw new SupportOperationsError("CONFLICT");
  const data = {
    value,
    ...weight,
    source: body.source === undefined ? existing.source : optionalString(body.source, 160),
    note: body.note === undefined ? existing.note : optionalString(body.note, 1000),
    updatedById: actor.id
  };
  const createsRevision = existing.status === "APPROVED" || existing.status === "REJECTED";
  const entry = createsRevision
    ? await prisma.supportKpiEntry.create({
        data: {
          organizationId: existing.organizationId,
          metric,
          ...data,
          scopeType: existing.scopeType,
          userId: existing.userId,
          teamLabel: existing.teamLabel,
          teamId: existing.teamId,
          periodStart: existing.periodStart,
          periodEnd: existing.periodEnd,
          createdById: actor.id,
          status: "DRAFT",
          revision: existing.revision + 1,
          supersedesId: existing.supersedesId ?? existing.id
        }
      })
    : await prisma.supportKpiEntry.update({
        where: { id: existing.id },
        data: { ...data, archivedAt: body.archived === true ? new Date() : undefined }
      });
  await recordAuditLog(prisma, {
    organizationId: actor.organizationId,
    actorId: actor.id,
    action: body.archived === true
      ? "support_performance.entry.archive"
      : createsRevision ? "support_performance.entry.revision.create" : "support_performance.entry.draft.update",
    entityType: "SupportKpiEntry",
    entityId: entry.id
  });
  return { entry };
}

export async function submitSupportKpiEntry(prisma: PrismaClient, actor: CurrentUser, entryId: string) {
  if (!isManager(actor)) throw new SupportOperationsError("FORBIDDEN");
  const existing = await prisma.supportKpiEntry.findFirst({
    where: { id: entryId, organizationId: actor.organizationId, archivedAt: null }
  });
  if (!existing) throw new SupportOperationsError("NOT_FOUND");
  if (existing.status !== "DRAFT") throw new SupportOperationsError("CONFLICT");
  const entry = await prisma.supportKpiEntry.update({
    where: { id: existing.id },
    data: { status: "SUBMITTED", submittedAt: new Date(), reviewedAt: null, reviewedById: null, reviewNote: null, updatedById: actor.id }
  });
  await recordAuditLog(prisma, {
    organizationId: actor.organizationId,
    actorId: actor.id,
    action: "support_performance.entry.submit",
    entityType: "SupportKpiEntry",
    entityId: entry.id,
    metadata: { revision: entry.revision, supersedesId: entry.supersedesId }
  });
  return { entry };
}

export async function reviewSupportKpiEntry(prisma: PrismaClient, actor: CurrentUser, entryId: string, input: unknown) {
  if (!isManager(actor) || !input || typeof input !== "object") throw new SupportOperationsError("FORBIDDEN");
  const body = input as Record<string, unknown>;
  const decision = requiredString(body.decision, 20).toUpperCase();
  if (decision !== "APPROVED" && decision !== "REJECTED") throw new SupportOperationsError("INVALID_INPUT");
  const reviewNote = optionalString(body.reviewNote, 1000);
  if (decision === "REJECTED" && !reviewNote) throw new SupportOperationsError("INVALID_INPUT");

  return prisma.$transaction(async (tx) => {
    const existing = await tx.supportKpiEntry.findFirst({
      where: { id: entryId, organizationId: actor.organizationId, archivedAt: null, status: "SUBMITTED" }
    });
    if (!existing) throw new SupportOperationsError("CONFLICT");
    if (decision === "APPROVED" && existing.supersedesId) {
      await tx.supportKpiEntry.updateMany({
        where: { id: existing.supersedesId, organizationId: actor.organizationId, status: "APPROVED" },
        data: { status: "SUPERSEDED", updatedById: actor.id }
      });
    }
    const entry = await tx.supportKpiEntry.update({
      where: { id: existing.id },
      data: { status: decision, reviewedAt: new Date(), reviewedById: actor.id, reviewNote, updatedById: actor.id }
    });
    await tx.auditLog.create({
      data: {
        organizationId: actor.organizationId,
        actorId: actor.id,
        action: `support_performance.entry.${decision.toLowerCase()}`,
        entityType: "SupportKpiEntry",
        entityId: entry.id,
        metadataJson: JSON.stringify({ revision: entry.revision, supersedesId: entry.supersedesId, reviewNote })
      }
    });
    return { entry };
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}

export async function listSupportCampaigns(prisma: PrismaClient, actor: CurrentUser) {
  const actorTeamIds = actor.role === "SAC"
    ? (await prisma.supportTeamMembership.findMany({
        where: { organizationId: actor.organizationId, userId: actor.id, ...activeMembership(new Date()) },
        select: { teamId: true }
      })).map((membership) => membership.teamId)
    : [];
  const [items, teams] = await Promise.all([
    prisma.supportCampaign.findMany({
      where: {
        organizationId: actor.organizationId,
        OR: isManager(actor) ? undefined : [
          { scopeType: "ORGANIZATION" },
          { userId: actor.id },
          ...(actorTeamIds.length ? [{ teamId: { in: actorTeamIds } }] : [])
        ]
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        team: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true } },
        updatedBy: { select: { id: true, name: true } }
      },
      orderBy: [{ status: "asc" }, { startsAt: "desc" }]
    }),
    prisma.supportTeam.findMany({
      where: { organizationId: actor.organizationId, active: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" }
    })
  ]);
  const periodStart = items.length ? new Date(Math.min(...items.map((item) => item.startsAt.getTime()))) : null;
  const periodEnd = items.length ? new Date(Math.max(...items.map((item) => item.endsAt.getTime()))) : null;
  const entries = periodStart && periodEnd
    ? await prisma.supportKpiEntry.findMany({
        where: {
          organizationId: actor.organizationId,
          archivedAt: null,
          status: "APPROVED",
          metric: { in: [...new Set(items.map((item) => item.metric))] },
          periodStart: { lte: periodEnd },
          periodEnd: { gte: periodStart }
        },
        orderBy: [{ periodEnd: "asc" }, { createdAt: "asc" }]
      })
    : [];
  const evaluatedItems = items.map((campaign) => {
    const metric = campaign.metric as SupportMetricKey;
    const campaignEntries = entries.filter((entry) => {
      if (entry.metric !== metric || entry.periodEnd < campaign.startsAt || entry.periodStart > campaign.endsAt) return false;
      if (campaign.scopeType === "USER") return entry.userId === campaign.userId;
      if (campaign.scopeType === "TEAM") {
        return campaign.teamId ? entry.teamId === campaign.teamId : entry.teamLabel === campaign.teamLabel;
      }
      return entry.scopeType === "ORGANIZATION";
    });
    const aggregate = aggregateMetricEntries(metric, campaignEntries);
    const current = aggregate.average;
    return {
      ...campaign,
      result: {
        current,
        ...aggregate,
        ...campaignProgress(campaign.comparison, campaign.targetValue, current)
      }
    };
  });
  return { canManage: isManager(actor), items: evaluatedItems, teams };
}

function campaignData(actor: CurrentUser, body: Record<string, unknown>) {
  const metric = parseMetric(body.metric);
  const comparison = requiredString(body.comparison ?? (metric === "RECLAME_AQUI_OPEN" ? "LTE" : "GTE"), 10).toUpperCase();
  const status = requiredString(body.status ?? "DRAFT", 20).toUpperCase();
  if (!(comparisons as readonly string[]).includes(comparison) || !(campaignStatuses as readonly string[]).includes(status)) {
    throw new SupportOperationsError("INVALID_INPUT");
  }
  const startsAt = parseDateTime(body.startsAt);
  const endsAt = parseDateTime(body.endsAt);
  if (endsAt < startsAt) throw new SupportOperationsError("INVALID_INPUT");
  return {
    organizationId: actor.organizationId,
    name: requiredString(body.name),
    description: optionalString(body.description, 1000),
    metric,
    targetValue: validateMetricValue(metric, body.targetValue),
    comparison,
    ...parseScope(body),
    status,
    startsAt,
    endsAt,
    updatedById: actor.id
  };
}

export async function createSupportCampaign(prisma: PrismaClient, actor: CurrentUser, input: unknown) {
  if (!isManager(actor) || !input || typeof input !== "object") throw new SupportOperationsError("FORBIDDEN");
  const data = campaignData(actor, input as Record<string, unknown>);
  if (data.userId) await ensureSupportAgent(prisma, actor.organizationId, data.userId);
  if (data.teamId) {
    const team = await ensureSupportTeam(prisma, actor.organizationId, data.teamId);
    data.teamLabel ??= team.name;
  }
  const campaign = await prisma.supportCampaign.create({ data: { ...data, createdById: actor.id } });
  await recordAuditLog(prisma, {
    organizationId: actor.organizationId,
    actorId: actor.id,
    action: "support_campaign.create",
    entityType: "SupportCampaign",
    entityId: campaign.id,
    metadata: { metric: campaign.metric, targetValue: campaign.targetValue, scopeType: campaign.scopeType }
  });
  return { campaign };
}

export async function updateSupportCampaign(prisma: PrismaClient, actor: CurrentUser, campaignId: string, input: unknown) {
  if (!isManager(actor) || !input || typeof input !== "object") throw new SupportOperationsError("FORBIDDEN");
  const existing = await prisma.supportCampaign.findFirst({ where: { id: campaignId, organizationId: actor.organizationId } });
  if (!existing) throw new SupportOperationsError("NOT_FOUND");
  const body = input as Record<string, unknown>;
  const data = campaignData(actor, {
    name: body.name ?? existing.name,
    description: body.description === undefined ? existing.description : body.description,
    metric: body.metric ?? existing.metric,
    targetValue: body.targetValue ?? existing.targetValue,
    comparison: body.comparison ?? existing.comparison,
    scopeType: body.scopeType ?? existing.scopeType,
    userId: body.userId === undefined ? existing.userId : body.userId,
    teamId: body.teamId === undefined ? existing.teamId : body.teamId,
    teamLabel: body.teamLabel === undefined ? existing.teamLabel : body.teamLabel,
    status: body.status ?? existing.status,
    startsAt: body.startsAt ?? existing.startsAt.toISOString(),
    endsAt: body.endsAt ?? existing.endsAt.toISOString()
  });
  if (data.userId) await ensureSupportAgent(prisma, actor.organizationId, data.userId);
  if (data.teamId) {
    const team = await ensureSupportTeam(prisma, actor.organizationId, data.teamId);
    data.teamLabel ??= team.name;
  }
  const campaign = await prisma.supportCampaign.update({ where: { id: existing.id }, data });
  await recordAuditLog(prisma, {
    organizationId: actor.organizationId,
    actorId: actor.id,
    action: "support_campaign.update",
    entityType: "SupportCampaign",
    entityId: campaign.id,
    metadata: { status: campaign.status }
  });
  return { campaign };
}

export async function getSupportDashboard(prisma: PrismaClient, actor: CurrentUser, dateText?: string) {
  const date = dateText ?? new Date().toISOString().slice(0, 10);
  const [pauses, performance, campaigns] = await Promise.all([
    listSupportPauses(prisma, actor, date),
    listSupportPerformance(prisma, actor, {}),
    listSupportCampaigns(prisma, actor)
  ]);
  return {
    date,
    pauses: { summary: pauses.summary, timeline: pauses.timeline, slots: pauses.slots },
    performance: { summary: performance.summary, entries: performance.entries.filter((entry) => entry.status === "APPROVED").slice(-40) },
    campaigns: campaigns.items.filter((campaign) => campaign.status === "ACTIVE")
  };
}
