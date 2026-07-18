import { Prisma, type PrismaClient } from "@prisma/client";
import {
  SUPPORT_PERFORMANCE_DICTIONARY_VERSION,
  getSupportMetricDefinition,
  supportMetricDataStates,
  supportMetricDefinitions,
  supportMetricGranularities,
  supportObservationTypes,
  type CurrentUser,
  type SupportMetricDefinition,
  type SupportMetricKey,
  type WritableSupportMetricKey
} from "@alwaystrack/shared";
import { recordAuditLog } from "../audit/audit.service.js";
import { emitInAppNotifications } from "../notifications/notifications.service.js";
import {
  addSupportLocalDays,
  findPublishedOccurrenceCoveringInterval,
  isValidSupportLocalDate,
  supportLocalDateForInstant,
  supportZonedDateTimeToUtc
} from "../support-scheduling/support-scheduling.service.js";

export { supportMetricKeys } from "@alwaystrack/shared";

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

function dateRange(dateText: string | undefined, timezone: string) {
  const date = dateText ?? supportLocalDateForInstant(new Date(), timezone);
  if (!isValidSupportLocalDate(date)) throw new SupportOperationsError("INVALID_INPUT");
  try {
    const start = supportZonedDateTimeToUtc(date, 0, timezone);
    const nextStart = supportZonedDateTimeToUtc(addSupportLocalDays(date, 1), 0, timezone);
    return { date, start, end: new Date(nextStart.getTime() - 1) };
  } catch {
    throw new SupportOperationsError("INVALID_INPUT");
  }
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

function isPrismaErrorCode(error: unknown, code: string) {
  return typeof error === "object" && error !== null && "code" in error && error.code === code;
}

interface PauseShiftWindow {
  start: string;
  end: string;
}

const defaultPauseShiftWindows: PauseShiftWindow[] = [
  { start: "08:00", end: "14:45" },
  { start: "15:00", end: "22:00" }
];
const defaultPauseTemplateStarts = [
  "09:45", "10:30", "10:45", "11:15", "11:30", "11:45", "12:15", "13:00",
  "15:15", "17:15", "17:45", "18:15", "19:15", "19:45", "20:15"
];

function timeMinutes(value: unknown) {
  if (typeof value !== "string" || !/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) throw new SupportOperationsError("INVALID_INPUT");
  const [hour, minute] = value.split(":").map(Number);
  return hour * 60 + minute;
}

function normalizedShiftWindows(value: unknown, fallback = false): PauseShiftWindow[] {
  if (!Array.isArray(value) || !value.length) {
    if (fallback) return defaultPauseShiftWindows;
    throw new SupportOperationsError("INVALID_INPUT");
  }
  const windows = value.map((item) => {
    if (!item || typeof item !== "object") throw new SupportOperationsError("INVALID_INPUT");
    const record = item as Record<string, unknown>;
    const start = requiredString(record.start, 5);
    const end = requiredString(record.end, 5);
    if (timeMinutes(end) <= timeMinutes(start)) throw new SupportOperationsError("INVALID_INPUT");
    return { start, end };
  }).sort((left, right) => timeMinutes(left.start) - timeMinutes(right.start));
  for (let index = 1; index < windows.length; index += 1) {
    if (timeMinutes(windows[index].start) < timeMinutes(windows[index - 1].end)) throw new SupportOperationsError("INVALID_INPUT");
  }
  return windows;
}

function pauseFitsWindow(start: number, end: number, windows: PauseShiftWindow[], boundaryBufferMinutes: number) {
  return windows.some((window) => (
    start >= timeMinutes(window.start) + boundaryBufferMinutes
    && end <= timeMinutes(window.end) - boundaryBufferMinutes
  ));
}

function normalizedTemplateStarts(
  value: unknown,
  windows: PauseShiftWindow[],
  pauseDurationMinutes: number,
  boundaryBufferMinutes: number,
  slotMinutes: number,
  fallback = false
) {
  if (!Array.isArray(value) || !value.length) {
    if (fallback) return defaultPauseTemplateStarts;
    throw new SupportOperationsError("INVALID_INPUT");
  }
  const starts = [...new Set(value.map((item) => requiredString(item, 5)))].sort((left, right) => timeMinutes(left) - timeMinutes(right));
  if (starts.some((start) => {
    const minute = timeMinutes(start);
    return minute % slotMinutes !== 0 || !pauseFitsWindow(minute, minute + pauseDurationMinutes, windows, boundaryBufferMinutes);
  })) throw new SupportOperationsError("INVALID_INPUT");
  return starts;
}

function pausePolicyView(policy: {
  id?: string | null;
  organizationId: string;
  timezone?: string;
  minimumCoverage?: number;
  slotMinutes?: number;
  pauseDurationMinutes?: number;
  boundaryBufferMinutes?: number;
  shiftWindowsJson?: string;
  templateStartsJson?: string;
  active?: boolean;
}) {
  const slotMinutes = policy.slotMinutes ?? 15;
  const pauseDurationMinutes = policy.pauseDurationMinutes ?? 75;
  const boundaryBufferMinutes = policy.boundaryBufferMinutes ?? 15;
  let shiftWindows = defaultPauseShiftWindows;
  let templateStarts = defaultPauseTemplateStarts;
  try {
    shiftWindows = normalizedShiftWindows(parseStoredJson<unknown>(policy.shiftWindowsJson) ?? defaultPauseShiftWindows, true);
    templateStarts = normalizedTemplateStarts(
      parseStoredJson<unknown>(policy.templateStartsJson) ?? defaultPauseTemplateStarts,
      shiftWindows,
      pauseDurationMinutes,
      boundaryBufferMinutes,
      slotMinutes,
      true
    );
  } catch {
    shiftWindows = defaultPauseShiftWindows;
    templateStarts = defaultPauseTemplateStarts;
  }
  return {
    id: policy.id ?? null,
    organizationId: policy.organizationId,
    timezone: policy.timezone ?? "America/Sao_Paulo",
    minimumCoverage: policy.minimumCoverage ?? 2,
    slotMinutes,
    pauseDurationMinutes,
    boundaryBufferMinutes,
    shiftWindows,
    templateStarts,
    active: policy.active !== false
  };
}

function localDateMinute(value: Date, timezone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).formatToParts(value);
  const fields = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return {
    date: `${fields.year}-${fields.month}-${fields.day}`,
    minute: Number(fields.hour) * 60 + Number(fields.minute)
  };
}

function validatePauseSlotAgainstPolicy(startsAt: Date, endsAt: Date, policy: ReturnType<typeof pausePolicyView>) {
  const durationMinutes = (endsAt.getTime() - startsAt.getTime()) / 60_000;
  if (durationMinutes !== policy.pauseDurationMinutes) throw new SupportOperationsError("INVALID_INPUT");
  const start = localDateMinute(startsAt, policy.timezone);
  const end = localDateMinute(endsAt, policy.timezone);
  if (start.date !== end.date || start.minute % policy.slotMinutes !== 0) throw new SupportOperationsError("INVALID_INPUT");
  if (!pauseFitsWindow(start.minute, end.minute, policy.shiftWindows, policy.boundaryBufferMinutes)) {
    throw new SupportOperationsError("CONFLICT");
  }
}

function dateAtTimeInZone(date: string, time: string, timezone: string) {
  try {
    return supportZonedDateTimeToUtc(date, timeMinutes(time), timezone);
  } catch {
    throw new SupportOperationsError("INVALID_INPUT");
  }
}

function policyDefaults(organizationId: string) {
  return pausePolicyView({
    id: null,
    organizationId,
    timezone: "America/Sao_Paulo",
    minimumCoverage: 2,
    slotMinutes: 15,
    pauseDurationMinutes: 75,
    boundaryBufferMinutes: 15,
    shiftWindowsJson: JSON.stringify(defaultPauseShiftWindows),
    templateStartsJson: JSON.stringify(defaultPauseTemplateStarts),
    active: true
  });
}

export async function listSupportPauses(prisma: PrismaClient, actor: CurrentUser, dateText?: string, requestedTeamId?: string) {
  const storedPolicy = await prisma.supportPausePolicy.findUnique({ where: { organizationId: actor.organizationId } });
  const policy = storedPolicy ? pausePolicyView(storedPolicy) : policyDefaults(actor.organizationId);
  const { date, start, end } = dateRange(dateText, policy.timezone);
  const actorMemberships = actor.role === "SAC"
    ? await prisma.supportTeamMembership.findMany({
        where: { organizationId: actor.organizationId, userId: actor.id, team: { active: true }, ...activeMembership(start, end) },
        select: { teamId: true }
      })
    : [];
  const allowedTeamIds = new Set(actorMemberships.map((membership) => membership.teamId));
  const teams = await prisma.supportTeam.findMany({
    where: {
      organizationId: actor.organizationId,
      active: true,
      ...(actor.role === "SAC" ? { id: { in: [...allowedTeamIds] } } : {})
    },
    select: { id: true, name: true },
    orderBy: { name: "asc" }
  });
  if (requestedTeamId && !teams.some((team) => team.id === requestedTeamId)) throw new SupportOperationsError("NOT_FOUND");
  if (requestedTeamId && actor.role === "SAC" && !allowedTeamIds.has(requestedTeamId)) throw new SupportOperationsError("FORBIDDEN");
  const teamId = requestedTeamId
    ?? (actor.role === "SAC" ? actorMemberships[0]?.teamId : null)
    ?? null;
  if (actor.role === "SAC" && !teamId) throw new SupportOperationsError("FORBIDDEN");
  const memberships = teamId
    ? await prisma.supportTeamMembership.findMany({
        where: { organizationId: actor.organizationId, teamId, user: { active: true, role: "SAC" }, ...activeMembership(start, end) },
        include: { user: { select: { id: true, name: true, email: true } } },
        orderBy: { user: { name: "asc" } }
      })
    : [];
  const membershipAgents = uniqueAgents(memberships);
  const fallbackAgents = !teamId
    ? await prisma.user.findMany({
        where: { organizationId: actor.organizationId, role: "SAC", active: true },
        select: { id: true, name: true, email: true },
        orderBy: [{ name: "asc" }, { email: "asc" }]
      })
    : [];
  const [slots, swaps, publishedOccurrences] = await Promise.all([
    prisma.supportPauseSlot.findMany({
      where: {
        organizationId: actor.organizationId,
        active: true,
        startsAt: { gte: start, lte: end },
        ...(teamId ? { OR: [{ teamId }, { teamId: null }] } : {})
      },
      include: {
        bookings: {
          where: { status: "BOOKED" },
          include: {
            user: { select: { id: true, name: true, email: true } },
            shiftOccurrence: { select: { id: true, status: true, startsAt: true, endsAt: true } }
          },
          orderBy: { createdAt: "asc" }
        }
      },
      orderBy: [{ startsAt: "asc" }, { endsAt: "asc" }]
    }),
    prisma.supportPauseSwap.findMany({
      where: {
        organizationId: actor.organizationId,
        AND: [
          {
            OR: [
              { status: "PENDING" },
              { updatedAt: { gte: start, lte: end } }
            ]
          },
          ...(actor.role === "SAC" && teamId ? [{
            requesterBooking: { slot: { teamId } },
            targetBooking: { slot: { teamId } }
          }] : [])
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
    }),
    prisma.supportShiftOccurrence.findMany({
      where: {
        organizationId: actor.organizationId,
        status: "PUBLISHED",
        localDate: date,
        ...(teamId ? { teamId } : {})
      },
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: [{ startsAt: "asc" }, { user: { name: "asc" } }]
    })
  ]);
  const scheduleMode = publishedOccurrences.length > 0;
  const scheduledAgents = [...new Map(publishedOccurrences.map((occurrence) => [occurrence.user.id, occurrence.user])).values()];
  const agents = scheduleMode ? scheduledAgents : (teamId ? membershipAgents : fallbackAgents);
  const expiredSwapIds = swaps
    .filter((swap) => swap.status === "PENDING" && swap.expiresAt && swap.expiresAt <= new Date())
    .map((swap) => swap.id);
  if (expiredSwapIds.length) {
    await prisma.$transaction(async (tx) => {
      await tx.supportPauseSwap.updateMany({
        where: { organizationId: actor.organizationId, id: { in: expiredSwapIds }, status: "PENDING" },
        data: { status: "EXPIRED", decidedAt: new Date() }
      });
      await tx.supportPauseSwapBookingLock.deleteMany({
        where: { swap: { is: { organizationId: actor.organizationId, id: { in: expiredSwapIds }, status: "EXPIRED" } } }
      });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    await Promise.all(expiredSwapIds.map((swapId) => recordAuditLog(prisma, {
      organizationId: actor.organizationId,
      actorId: null,
      action: "support_pause.swap.expired",
      entityType: "SupportPauseSwap",
      entityId: swapId
    })));
  }
  const relevantStarts = slots.map((slot) => slot.startsAt.getTime());
  const relevantEnds = slots.map((slot) => slot.endsAt.getTime());
  const timelineStart = relevantStarts.length ? Math.min(...relevantStarts) : start.getTime() + 8 * 60 * 60 * 1000;
  const timelineEnd = relevantEnds.length ? Math.max(...relevantEnds) : start.getTime() + 18 * 60 * 60 * 1000;
  const timeline = [];
  for (let point = timelineStart; point < timelineEnd; point += policy.slotMinutes * 60 * 1000) {
    const intervalStart = new Date(point);
    const intervalEnd = new Date(Math.min(point + policy.slotMinutes * 60 * 1000, timelineEnd));
    const scheduledUserIds = scheduleMode
      ? new Set(publishedOccurrences
          .filter((occurrence) => occurrence.startsAt <= intervalStart && occurrence.endsAt >= intervalEnd)
          .map((occurrence) => occurrence.userId))
      : new Set(agents.map((agent) => agent.id));
    const pausedUsers = new Set(slots.flatMap((slot) =>
      slot.startsAt < intervalEnd && slot.endsAt > intervalStart ? slot.bookings.map((booking) => booking.userId) : []
    ));
    const pausedCount = [...pausedUsers].filter((userId) => scheduledUserIds.has(userId)).length;
    const availableCount = Math.max(scheduledUserIds.size - pausedCount, 0);
    timeline.push({
      startsAt: intervalStart,
      endsAt: intervalEnd,
      activeCount: scheduledUserIds.size,
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
    membershipMode: scheduleMode ? "PUBLISHED_SCHEDULE" : (teams.length ? "DATED_MEMBERSHIP" : "ROLE_FALLBACK"),
    coverageSource: scheduleMode ? "PUBLISHED_SCHEDULE" : "LEGACY_MEMBERSHIP",
    policy,
    agents,
    summary: {
      activeAgents: agents.length,
      minimumCoverage: policy.minimumCoverage,
      bookedPauses: slots.reduce((total, slot) => total + slot.bookings.length, 0),
      criticalIntervals: timeline.filter((item) => item.critical).length
    },
    timeline,
    slots: slots.map((slot) => {
      const bookings = slot.bookings.map((booking) => ({
        ...booking,
        requiresReschedule: Boolean(
          booking.rescheduleRequiredAt
          || (scheduleMode && (
            !booking.shiftOccurrence
            || booking.shiftOccurrence.status !== "PUBLISHED"
            || booking.shiftOccurrence.startsAt > slot.startsAt
            || booking.shiftOccurrence.endsAt < slot.endsAt
          ))
        )
      }));
      return {
        ...slot,
        bookings,
        bookedCount: bookings.length,
        remainingCapacity: Math.max(slot.capacity - bookings.length, 0),
        myBooking: bookings.find((booking) => booking.userId === actor.id) ?? null
      };
    }),
    swaps: swaps.map((swap) => expiredSwapIds.includes(swap.id) ? { ...swap, status: "EXPIRED" } : swap)
  };
}

export async function updateSupportPausePolicy(prisma: PrismaClient, actor: CurrentUser, input: unknown) {
  if (!isManager(actor) || !input || typeof input !== "object") throw new SupportOperationsError("FORBIDDEN");
  const body = input as Record<string, unknown>;
  const existing = await prisma.supportPausePolicy.findUnique({ where: { organizationId: actor.organizationId } });
  const timezone = optionalString(body.timezone, 80) ?? existing?.timezone ?? "America/Sao_Paulo";
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: timezone }).format(new Date());
  } catch {
    throw new SupportOperationsError("INVALID_INPUT");
  }
  const minimumCoverage = integerInRange(body.minimumCoverage ?? existing?.minimumCoverage ?? 2, 1, 500);
  const slotMinutes = integerInRange(body.slotMinutes ?? existing?.slotMinutes ?? 15, 5, 60);
  const pauseDurationMinutes = integerInRange(body.pauseDurationMinutes ?? existing?.pauseDurationMinutes ?? 75, 15, 180);
  const boundaryBufferMinutes = integerInRange(body.boundaryBufferMinutes ?? existing?.boundaryBufferMinutes ?? 15, 1, 120);
  const shiftWindows = normalizedShiftWindows(
    body.shiftWindows ?? parseStoredJson<unknown>(existing?.shiftWindowsJson) ?? defaultPauseShiftWindows
  );
  const templateStarts = normalizedTemplateStarts(
    body.templateStarts ?? parseStoredJson<unknown>(existing?.templateStartsJson) ?? defaultPauseTemplateStarts,
    shiftWindows,
    pauseDurationMinutes,
    boundaryBufferMinutes,
    slotMinutes
  );
  const data = {
    timezone,
    minimumCoverage,
    slotMinutes,
    pauseDurationMinutes,
    boundaryBufferMinutes,
    shiftWindowsJson: JSON.stringify(shiftWindows),
    templateStartsJson: JSON.stringify(templateStarts),
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
  return { policy: pausePolicyView(policy) };
}

export async function createSupportPauseSlot(prisma: PrismaClient, actor: CurrentUser, input: unknown) {
  if (!isManager(actor) || !input || typeof input !== "object") throw new SupportOperationsError("FORBIDDEN");
  const body = input as Record<string, unknown>;
  const startsAt = parseDateTime(body.startsAt);
  const endsAt = parseDateTime(body.endsAt);
  if (endsAt <= startsAt || endsAt.getTime() - startsAt.getTime() > 4 * 60 * 60 * 1000) throw new SupportOperationsError("INVALID_INPUT");
  const storedPolicy = await prisma.supportPausePolicy.findUnique({ where: { organizationId: actor.organizationId } });
  const policy = storedPolicy ? pausePolicyView(storedPolicy) : policyDefaults(actor.organizationId);
  validatePauseSlotAgainstPolicy(startsAt, endsAt, policy);
  const teamId = body.teamId ? requiredString(body.teamId) : null;
  if (teamId) await ensureSupportTeam(prisma, actor.organizationId, teamId);
  const slot = await prisma.supportPauseSlot.create({
    data: {
      organizationId: actor.organizationId,
      label: optionalString(body.label, 80),
      startsAt,
      endsAt,
      capacity: integerInRange(body.capacity ?? 1, 1, 100),
      teamId,
      policySnapshotJson: JSON.stringify(policy),
      createdById: actor.id
    }
  }).catch(() => { throw new SupportOperationsError("CONFLICT"); });
  await recordAuditLog(prisma, {
    organizationId: actor.organizationId,
    actorId: actor.id,
    action: "support_pause.slot.create",
    entityType: "SupportPauseSlot",
    entityId: slot.id,
    metadata: { startsAt, endsAt, capacity: slot.capacity, pauseDurationMinutes: policy.pauseDurationMinutes, shiftWindows: policy.shiftWindows }
  });
  return { slot };
}

export async function generateSupportPauseSlots(prisma: PrismaClient, actor: CurrentUser, input: unknown) {
  if (!isManager(actor) || !input || typeof input !== "object") throw new SupportOperationsError("FORBIDDEN");
  const body = input as Record<string, unknown>;
  const date = requiredString(body.date, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new SupportOperationsError("INVALID_INPUT");
  const capacity = integerInRange(body.capacity ?? 1, 1, 100);
  const storedPolicy = await prisma.supportPausePolicy.findUnique({ where: { organizationId: actor.organizationId } });
  const policy = storedPolicy ? pausePolicyView(storedPolicy) : policyDefaults(actor.organizationId);
  const teamId = body.teamId ? requiredString(body.teamId) : null;
  if (teamId) await ensureSupportTeam(prisma, actor.organizationId, teamId);
  const slots = [];
  let createdCount = 0;
  let reusedCount = 0;
  for (const startTime of policy.templateStarts) {
    const startsAt = dateAtTimeInZone(date, startTime, policy.timezone);
    const endsAt = new Date(startsAt.getTime() + policy.pauseDurationMinutes * 60_000);
    validatePauseSlotAgainstPolicy(startsAt, endsAt, policy);
    const existing = await prisma.supportPauseSlot.findUnique({
      where: { organizationId_startsAt_endsAt: { organizationId: actor.organizationId, startsAt, endsAt } }
    });
    if (existing) {
      slots.push(existing);
      reusedCount += 1;
      continue;
    }
    slots.push(await prisma.supportPauseSlot.create({
      data: {
        organizationId: actor.organizationId,
        teamId,
        label: `Pausa ${startTime}`,
        startsAt,
        endsAt,
        capacity,
        policySnapshotJson: JSON.stringify(policy),
        createdById: actor.id
      }
    }));
    createdCount += 1;
  }
  await recordAuditLog(prisma, {
    organizationId: actor.organizationId,
    actorId: actor.id,
    action: "support_pause.slots.generate",
    entityType: "SupportPauseSlot",
    entityId: date,
    metadata: { date, teamId, capacity, createdCount, reusedCount, templateStarts: policy.templateStarts }
  });
  return { slots, createdCount, reusedCount, policy };
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

async function effectiveShiftForPause(
  prisma: Prisma.TransactionClient,
  input: {
    organizationId: string;
    userId: string;
    teamId: string | null;
    startsAt: Date;
    endsAt: Date;
    timezone: string;
  }
) {
  const localDate = supportLocalDateForInstant(input.startsAt, input.timezone);
  const scheduledOnDay = await prisma.supportShiftOccurrence.count({
    where: {
      organizationId: input.organizationId,
      status: "PUBLISHED",
      localDate,
      ...(input.teamId ? { teamId: input.teamId } : {})
    }
  });
  const occurrence = await findPublishedOccurrenceCoveringInterval(prisma, {
    organizationId: input.organizationId,
    userId: input.userId,
    startsAt: input.startsAt,
    endsAt: input.endsAt,
    ...(input.teamId ? { teamId: input.teamId } : {})
  });
  if (scheduledOnDay > 0 && !occurrence) throw new SupportOperationsError("CONFLICT");
  return { occurrence, scheduleMode: scheduledOnDay > 0, localDate };
}

export async function bookSupportPauseSlot(prisma: PrismaClient, actor: CurrentUser, slotId: string, input: unknown) {
  const body = input && typeof input === "object" ? input as Record<string, unknown> : {};
  const requestedUserId = typeof body.userId === "string" ? body.userId : actor.id;
  const overrideCoverage = body.overrideCoverage === true;
  const overrideReason = overrideCoverage ? requiredString(body.overrideReason, 300) : null;
  if (overrideCoverage && body.confirmImpact !== true) throw new SupportOperationsError("INVALID_INPUT");
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
        const existing = await tx.supportPauseBooking.findUnique({ where: { slotId_userId: { slotId, userId: requestedUserId } } });
        const storedPolicy = await tx.supportPausePolicy.findUnique({ where: { organizationId: actor.organizationId } });
        const policy = storedPolicy ? pausePolicyView(storedPolicy) : policyDefaults(actor.organizationId);
        const effectiveShift = await effectiveShiftForPause(tx, {
          organizationId: actor.organizationId,
          userId: requestedUserId,
          teamId: slot.teamId,
          startsAt: slot.startsAt,
          endsAt: slot.endsAt,
          timezone: policy.timezone
        });
        if (
          existing?.status === "BOOKED"
          && !existing.rescheduleRequiredAt
          && (!effectiveShift.scheduleMode || existing.shiftOccurrenceId === effectiveShift.occurrence?.id)
        ) return { booking: existing, idempotent: true };
        if (existing && existing.status !== "BOOKED" && existing.status !== "CANCELLED") {
          throw new SupportOperationsError("CONFLICT");
        }
        const previousStatus = existing?.status ?? null;
        const reactivating = previousStatus === "CANCELLED";
        if (slot.bookings.length >= slot.capacity && !overrideCoverage) throw new SupportOperationsError("CONFLICT");
        const existingOverlap = await tx.supportPauseBooking.findFirst({
          where: {
            organizationId: actor.organizationId,
            userId: requestedUserId,
            status: "BOOKED",
            id: existing ? { not: existing.id } : undefined,
            slot: overlaps(slot.startsAt, slot.endsAt)
          }
        });
        if (existingOverlap) throw new SupportOperationsError("CONFLICT");
        const [membershipCount, roleCount, overlappingBookings, scheduledCoverage] = await Promise.all([
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
          }),
          effectiveShift.scheduleMode
            ? tx.supportShiftOccurrence.findMany({
                where: {
                  organizationId: actor.organizationId,
                  status: "PUBLISHED",
                  localDate: effectiveShift.localDate,
                  startsAt: { lte: slot.startsAt },
                  endsAt: { gte: slot.endsAt },
                  ...(slot.teamId ? { teamId: slot.teamId } : {})
                },
                distinct: ["userId"],
                select: { userId: true }
              })
            : Promise.resolve([])
        ]);
        const activeAgents = effectiveShift.scheduleMode
          ? scheduledCoverage.length
          : (slot.teamId ? membershipCount.length : roleCount);
        const pausedUsers = new Set(overlappingBookings.map((booking) => booking.userId));
        const coverageBefore = Math.max(activeAgents - pausedUsers.size, 0);
        pausedUsers.add(requestedUserId);
        const minimumCoverage = policy.minimumCoverage;
        const coverageAfter = Math.max(activeAgents - pausedUsers.size, 0);
        const exceedsSlotCapacity = slot.bookings.length >= slot.capacity;
        const breachesCoverage = coverageAfter < minimumCoverage;
        if (!overrideCoverage && breachesCoverage) throw new SupportOperationsError("CONFLICT");
        if (overrideCoverage && !exceedsSlotCapacity && !breachesCoverage) throw new SupportOperationsError("INVALID_INPUT");
        const overrideData = overrideCoverage ? {
          overrideReason,
          coverageBefore,
          coverageAfter,
          minimumCoverage,
          overrideById: actor.id,
          overrideAt: new Date(),
          overrideRevokedById: null,
          overrideRevokedAt: null,
          overrideRevokeReason: null
        } : {
          overrideReason: null,
          coverageBefore: null,
          coverageAfter: null,
          minimumCoverage: null,
          overrideById: null,
          overrideAt: null,
          overrideRevokedById: null,
          overrideRevokedAt: null,
          overrideRevokeReason: null
        };
        const booking = existing
          ? await tx.supportPauseBooking.update({
              where: { id: existing.id },
              data: {
                status: "BOOKED",
                shiftOccurrenceId: effectiveShift.occurrence?.id ?? null,
                rescheduleRequiredAt: null,
                rescheduleReason: null,
                ...overrideData
              }
            })
          : await tx.supportPauseBooking.create({
              data: {
                organizationId: actor.organizationId,
                slotId,
                userId: requestedUserId,
                shiftOccurrenceId: effectiveShift.occurrence?.id ?? null,
                ...overrideData
              }
            });
        await tx.auditLog.create({
          data: {
            organizationId: actor.organizationId,
            actorId: actor.id,
            action: reactivating
              ? "support_pause.booking.reactivate"
              : overrideCoverage ? "support_pause.booking.override" : "support_pause.booking.create",
            entityType: "SupportPauseBooking",
            entityId: booking.id,
            metadataJson: JSON.stringify({
              slotId,
              userId: requestedUserId,
              previousStatus: reactivating ? previousStatus : null,
              overrideCoverage,
              overrideReason,
              teamId: slot.teamId,
              slotCapacity: slot.capacity,
              bookedBefore: slot.bookings.length,
              coverageBefore,
              coverageAfter,
              minimumCoverage,
              coverageSource: effectiveShift.scheduleMode ? "PUBLISHED_SCHEDULE" : "LEGACY_MEMBERSHIP",
              shiftOccurrenceId: effectiveShift.occurrence?.id ?? null
            })
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

export async function cancelSupportPauseBooking(prisma: PrismaClient, actor: CurrentUser, bookingId: string, input?: unknown) {
  const body = input && typeof input === "object" ? input as Record<string, unknown> : {};
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await prisma.$transaction(async (tx) => {
        const booking = await tx.supportPauseBooking.findFirst({
          where: { id: bookingId, organizationId: actor.organizationId },
          include: { slot: { select: { startsAt: true } } }
        });
        if (!booking) throw new SupportOperationsError("NOT_FOUND");
        if (booking.userId !== actor.id && !isManager(actor)) throw new SupportOperationsError("FORBIDDEN");
        if (booking.slot.startsAt <= new Date()) throw new SupportOperationsError("CONFLICT");
        if (booking.status !== "BOOKED" && booking.status !== "CANCELLED") {
          throw new SupportOperationsError("CONFLICT");
        }
        const managerRevocation = booking.userId !== actor.id && isManager(actor) && Boolean(booking.overrideReason);
        const revokeReason = booking.status === "BOOKED"
          ? managerRevocation ? requiredString(body.reason, 300) : optionalString(body.reason, 300)
          : null;
        const now = new Date();
        const pendingSwaps = await tx.supportPauseSwap.findMany({
          where: {
            organizationId: actor.organizationId,
            status: "PENDING",
            OR: [{ requesterBookingId: booking.id }, { targetBookingId: booking.id }]
          },
          select: { id: true }
        });
        const pendingSwapIds = pendingSwaps.map((swap) => swap.id);
        if (pendingSwapIds.length) {
          const cancelledSwaps = await tx.supportPauseSwap.updateMany({
            where: {
              id: { in: pendingSwapIds },
              organizationId: actor.organizationId,
              status: "PENDING"
            },
            data: { status: "CANCELLED", decidedById: actor.id, decidedAt: now }
          });
          if (cancelledSwaps.count !== pendingSwapIds.length) throw new SupportOperationsError("CONFLICT");
          await tx.supportPauseSwapBookingLock.deleteMany({ where: { swapId: { in: pendingSwapIds } } });
        }
        if (booking.status === "CANCELLED") return { booking, idempotent: true };

        const changed = await tx.supportPauseBooking.updateMany({
          where: { id: booking.id, organizationId: actor.organizationId, status: "BOOKED" },
          data: {
            status: "CANCELLED",
            overrideRevokedById: booking.overrideReason ? actor.id : undefined,
            overrideRevokedAt: booking.overrideReason ? now : undefined,
            overrideRevokeReason: booking.overrideReason ? revokeReason : undefined
          }
        });
        if (changed.count !== 1) throw new SupportOperationsError("CONFLICT");
        const updated = {
          ...booking,
          status: "CANCELLED",
          overrideRevokedById: booking.overrideReason ? actor.id : booking.overrideRevokedById,
          overrideRevokedAt: booking.overrideReason ? now : booking.overrideRevokedAt,
          overrideRevokeReason: booking.overrideReason ? revokeReason : booking.overrideRevokeReason
        };
        await tx.auditLog.create({
          data: {
            organizationId: actor.organizationId,
            actorId: actor.id,
            action: "support_pause.booking.cancel",
            entityType: "SupportPauseBooking",
            entityId: booking.id,
            metadataJson: JSON.stringify({
              overrideRevocation: Boolean(booking.overrideReason),
              reason: revokeReason,
              cancelledSwapIds: pendingSwapIds
            })
          }
        });
        return { booking: updated };
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    } catch (error) {
      if (isRetryableTransactionError(error) && attempt < 2) continue;
      throw error;
    }
  }
  throw new SupportOperationsError("CONFLICT");
}

export async function rescheduleSupportPauseBooking(
  prisma: PrismaClient,
  actor: CurrentUser,
  bookingId: string,
  input: unknown
) {
  if (!input || typeof input !== "object") throw new SupportOperationsError("INVALID_INPUT");
  const targetSlotId = requiredString((input as Record<string, unknown>).targetSlotId);
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await prisma.$transaction(async (tx) => {
        const original = await tx.supportPauseBooking.findFirst({
          where: { id: bookingId, organizationId: actor.organizationId },
          include: { slot: true }
        });
        if (!original) throw new SupportOperationsError("NOT_FOUND");
        if (original.userId !== actor.id && !isManager(actor)) throw new SupportOperationsError("FORBIDDEN");
        if (original.status === "RESCHEDULED") {
          const current = await tx.supportPauseBooking.findFirst({
            where: { organizationId: actor.organizationId, rescheduledFromId: original.id, status: "BOOKED" }
          });
          if (current) return { booking: current, previousBooking: original, idempotent: true };
        }
        if (original.status !== "BOOKED" || original.slotId === targetSlotId) throw new SupportOperationsError("CONFLICT");

        const targetSlot = await tx.supportPauseSlot.findFirst({
          where: { id: targetSlotId, organizationId: actor.organizationId, active: true },
          include: { bookings: { where: { status: "BOOKED" } } }
        });
        if (!targetSlot) throw new SupportOperationsError("NOT_FOUND");
        if (targetSlot.startsAt <= new Date()) throw new SupportOperationsError("CONFLICT");
        if (original.slot.teamId && targetSlot.teamId && original.slot.teamId !== targetSlot.teamId) {
          throw new SupportOperationsError("FORBIDDEN");
        }
        await ensureSupportAgent(tx, actor.organizationId, original.userId, targetSlot.teamId, targetSlot.startsAt);

        const storedPolicy = await tx.supportPausePolicy.findUnique({ where: { organizationId: actor.organizationId } });
        const policy = storedPolicy ? pausePolicyView(storedPolicy) : policyDefaults(actor.organizationId);
        const effectiveShift = await effectiveShiftForPause(tx, {
          organizationId: actor.organizationId,
          userId: original.userId,
          teamId: targetSlot.teamId,
          startsAt: targetSlot.startsAt,
          endsAt: targetSlot.endsAt,
          timezone: policy.timezone
        });
        const targetExisting = await tx.supportPauseBooking.findUnique({
          where: { slotId_userId: { slotId: targetSlot.id, userId: original.userId } }
        });
        if (targetExisting?.status === "BOOKED") throw new SupportOperationsError("CONFLICT");
        const activeTargetBookings = targetSlot.bookings.filter((booking) => booking.id !== targetExisting?.id);
        if (activeTargetBookings.length >= targetSlot.capacity) throw new SupportOperationsError("CONFLICT");
        const overlapping = await tx.supportPauseBooking.findFirst({
          where: {
            organizationId: actor.organizationId,
            userId: original.userId,
            status: "BOOKED",
            id: { notIn: [original.id, ...(targetExisting ? [targetExisting.id] : [])] },
            slot: overlaps(targetSlot.startsAt, targetSlot.endsAt)
          }
        });
        if (overlapping) throw new SupportOperationsError("CONFLICT");

        const [membershipCount, roleCount, overlappingBookings, scheduledCoverage] = await Promise.all([
          targetSlot.teamId
            ? tx.supportTeamMembership.findMany({
                where: {
                  organizationId: actor.organizationId,
                  teamId: targetSlot.teamId,
                  user: { active: true, role: "SAC" },
                  ...activeMembership(targetSlot.startsAt, targetSlot.endsAt)
                },
                distinct: ["userId"],
                select: { userId: true }
              })
            : Promise.resolve([]),
          targetSlot.teamId
            ? Promise.resolve(0)
            : tx.user.count({ where: { organizationId: actor.organizationId, role: "SAC", active: true } }),
          tx.supportPauseBooking.findMany({
            where: {
              organizationId: actor.organizationId,
              status: "BOOKED",
              id: { not: original.id },
              slot: {
                ...overlaps(targetSlot.startsAt, targetSlot.endsAt),
                ...(targetSlot.teamId ? { OR: [{ teamId: targetSlot.teamId }, { teamId: null }] } : {})
              }
            },
            select: { userId: true }
          }),
          effectiveShift.scheduleMode
            ? tx.supportShiftOccurrence.findMany({
                where: {
                  organizationId: actor.organizationId,
                  status: "PUBLISHED",
                  localDate: effectiveShift.localDate,
                  startsAt: { lte: targetSlot.startsAt },
                  endsAt: { gte: targetSlot.endsAt },
                  ...(targetSlot.teamId ? { teamId: targetSlot.teamId } : {})
                },
                distinct: ["userId"],
                select: { userId: true }
              })
            : Promise.resolve([])
        ]);
        const activeAgents = effectiveShift.scheduleMode
          ? scheduledCoverage.length
          : (targetSlot.teamId ? membershipCount.length : roleCount);
        const pausedUsers = new Set(overlappingBookings.map((booking) => booking.userId));
        pausedUsers.add(original.userId);
        if (Math.max(activeAgents - pausedUsers.size, 0) < policy.minimumCoverage) {
          throw new SupportOperationsError("CONFLICT");
        }

        const now = new Date();
        const booking = targetExisting
          ? await tx.supportPauseBooking.update({
              where: { id: targetExisting.id },
              data: {
                status: "BOOKED",
                rescheduledFromId: original.id,
                shiftOccurrenceId: effectiveShift.occurrence?.id ?? null,
                rescheduleRequiredAt: null,
                rescheduleReason: null,
                overrideReason: null,
                coverageBefore: null,
                coverageAfter: null,
                minimumCoverage: null,
                overrideById: null,
                overrideAt: null
              }
            })
          : await tx.supportPauseBooking.create({
              data: {
                organizationId: actor.organizationId,
                slotId: targetSlot.id,
                userId: original.userId,
                rescheduledFromId: original.id,
                shiftOccurrenceId: effectiveShift.occurrence?.id ?? null
              }
            });
        const previousBooking = await tx.supportPauseBooking.update({
          where: { id: original.id },
          data: { status: "RESCHEDULED", rescheduleRequiredAt: null }
        });
        await tx.supportPauseSwap.updateMany({
          where: { status: "PENDING", OR: [{ requesterBookingId: original.id }, { targetBookingId: original.id }] },
          data: { status: "CANCELLED", decidedById: actor.id, decidedAt: now }
        });
        await tx.supportPauseSwapBookingLock.deleteMany({
          where: {
            swap: {
              is: {
                status: "CANCELLED",
                OR: [{ requesterBookingId: original.id }, { targetBookingId: original.id }]
              }
            }
          }
        });
        await tx.auditLog.create({
          data: {
            organizationId: actor.organizationId,
            actorId: actor.id,
            action: "support_pause.booking.reschedule",
            entityType: "SupportPauseBooking",
            entityId: booking.id,
            metadataJson: JSON.stringify({
              previousBookingId: original.id,
              previousSlotId: original.slotId,
              targetSlotId: targetSlot.id,
              userId: original.userId,
              shiftOccurrenceId: effectiveShift.occurrence?.id ?? null,
              coverageSource: effectiveShift.scheduleMode ? "PUBLISHED_SCHEDULE" : "LEGACY_MEMBERSHIP"
            })
          }
        });
        return { booking, previousBooking };
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    } catch (error) {
      if (isRetryableTransactionError(error) && attempt < 2) continue;
      if (typeof error === "object" && error !== null && "code" in error && error.code === "P2002") {
        throw new SupportOperationsError("CONFLICT");
      }
      throw error;
    }
  }
  throw new SupportOperationsError("CONFLICT");
}

export async function requestSupportPauseSwap(prisma: PrismaClient, actor: CurrentUser, input: unknown) {
  if (!input || typeof input !== "object") throw new SupportOperationsError("INVALID_INPUT");
  const body = input as Record<string, unknown>;
  const requesterBookingId = requiredString(body.requesterBookingId);
  const targetBookingId = requiredString(body.targetBookingId);
  if (requesterBookingId === targetBookingId) throw new SupportOperationsError("INVALID_INPUT");
  const note = optionalString(body.note, 300);
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await prisma.$transaction(async (tx) => {
        const now = new Date();
        const [requesterBooking, targetBooking] = await Promise.all([
          tx.supportPauseBooking.findFirst({
            where: { id: requesterBookingId, organizationId: actor.organizationId, status: "BOOKED" },
            include: { slot: { select: { startsAt: true, teamId: true } } }
          }),
          tx.supportPauseBooking.findFirst({
            where: { id: targetBookingId, organizationId: actor.organizationId, status: "BOOKED" },
            include: { slot: { select: { startsAt: true, teamId: true } } }
          })
        ]);
        if (!requesterBooking || !targetBooking) throw new SupportOperationsError("NOT_FOUND");
        if (requesterBooking.userId !== actor.id || targetBooking.userId === actor.id) {
          throw new SupportOperationsError("FORBIDDEN");
        }
        const teamId = requesterBooking.slot.teamId;
        if (!teamId || targetBooking.slot.teamId !== teamId) throw new SupportOperationsError("CONFLICT");
        await Promise.all([
          ensureSupportAgent(tx, actor.organizationId, requesterBooking.userId, teamId, requesterBooking.slot.startsAt),
          ensureSupportAgent(tx, actor.organizationId, targetBooking.userId, teamId, targetBooking.slot.startsAt)
        ]);

        const bookingIds = [requesterBookingId, targetBookingId];
        const staleSwaps = await tx.supportPauseSwap.findMany({
          where: {
            organizationId: actor.organizationId,
            status: "PENDING",
            expiresAt: { lte: now },
            OR: [{ requesterBookingId: { in: bookingIds } }, { targetBookingId: { in: bookingIds } }]
          },
          select: { id: true }
        });
        if (staleSwaps.length) {
          const staleSwapIds = staleSwaps.map((swap) => swap.id);
          await tx.supportPauseSwap.updateMany({
            where: { id: { in: staleSwapIds }, organizationId: actor.organizationId, status: "PENDING", expiresAt: { lte: now } },
            data: { status: "EXPIRED", decidedAt: now }
          });
          await tx.supportPauseSwapBookingLock.deleteMany({ where: { swapId: { in: staleSwapIds } } });
        }

        const activeSwaps = await tx.supportPauseSwap.findMany({
          where: {
            organizationId: actor.organizationId,
            status: "PENDING",
            AND: [
              { OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] },
              { OR: [{ requesterBookingId: { in: bookingIds } }, { targetBookingId: { in: bookingIds } }] }
            ]
          },
          orderBy: [{ createdAt: "asc" }, { id: "asc" }]
        });
        const idempotentSwap = activeSwaps.find((swap) => (
          swap.requesterBookingId === requesterBookingId
          && swap.targetBookingId === targetBookingId
          && swap.requestedById === actor.id
        ));
        if (activeSwaps.length) {
          if (activeSwaps.length === 1 && idempotentSwap) return { swap: idempotentSwap, idempotent: true };
          throw new SupportOperationsError("CONFLICT");
        }

        const expiresAt = new Date(Math.min(
          now.getTime() + 24 * 60 * 60 * 1000,
          requesterBooking.slot.startsAt.getTime(),
          targetBooking.slot.startsAt.getTime()
        ));
        if (expiresAt <= now) throw new SupportOperationsError("CONFLICT");
        const swap = await tx.supportPauseSwap.create({
          data: {
            organizationId: actor.organizationId,
            requesterBookingId,
            targetBookingId,
            requestedById: actor.id,
            note,
            expiresAt
          }
        });
        await tx.supportPauseSwapBookingLock.createMany({
          data: bookingIds.map((bookingId) => ({ swapId: swap.id, bookingId }))
        });
        await tx.auditLog.create({
          data: {
            organizationId: actor.organizationId,
            actorId: actor.id,
            action: "support_pause.swap.request",
            entityType: "SupportPauseSwap",
            entityId: swap.id,
            metadataJson: JSON.stringify({ requesterBookingId, targetBookingId, expiresAt: swap.expiresAt })
          }
        });
        return { swap };
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    } catch (error) {
      if (isRetryableTransactionError(error) && attempt < 2) continue;
      if (isPrismaErrorCode(error, "P2002")) {
        const existing = await prisma.supportPauseSwap.findFirst({
          where: {
            organizationId: actor.organizationId,
            requesterBookingId,
            targetBookingId,
            requestedById: actor.id,
            status: "PENDING",
            OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }]
          }
        });
        if (existing) return { swap: existing, idempotent: true };
        throw new SupportOperationsError("CONFLICT");
      }
      throw error;
    }
  }
  throw new SupportOperationsError("CONFLICT");
}

export async function cancelSupportPauseSwap(prisma: PrismaClient, actor: CurrentUser, swapId: string) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await prisma.$transaction(async (tx) => {
        const swap = await tx.supportPauseSwap.findFirst({
          where: { id: swapId, organizationId: actor.organizationId }
        });
        if (!swap) throw new SupportOperationsError("NOT_FOUND");
        if (swap.requestedById !== actor.id && !isManager(actor)) throw new SupportOperationsError("FORBIDDEN");
        if (swap.status === "CANCELLED") return { swap, idempotent: true };
        if (swap.status !== "PENDING") throw new SupportOperationsError("CONFLICT");
        const decidedAt = new Date();
        const changed = await tx.supportPauseSwap.updateMany({
          where: { id: swap.id, organizationId: actor.organizationId, status: "PENDING" },
          data: { status: "CANCELLED", decidedById: actor.id, decidedAt }
        });
        if (changed.count !== 1) throw new SupportOperationsError("CONFLICT");
        await tx.supportPauseSwapBookingLock.deleteMany({ where: { swapId: swap.id } });
        await tx.auditLog.create({
          data: {
            organizationId: actor.organizationId,
            actorId: actor.id,
            action: "support_pause.swap.cancelled",
            entityType: "SupportPauseSwap",
            entityId: swap.id
          }
        });
        return { swap: { ...swap, status: "CANCELLED", decidedById: actor.id, decidedAt } };
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    } catch (error) {
      if (isRetryableTransactionError(error) && attempt < 2) continue;
      throw error;
    }
  }
  throw new SupportOperationsError("CONFLICT");
}

export async function decideSupportPauseSwap(prisma: PrismaClient, actor: CurrentUser, swapId: string, input: unknown) {
  if (!input || typeof input !== "object") throw new SupportOperationsError("INVALID_INPUT");
  const decision = requiredString((input as Record<string, unknown>).decision, 20).toUpperCase();
  if (decision !== "ACCEPTED" && decision !== "DECLINED") throw new SupportOperationsError("INVALID_INPUT");
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await prisma.$transaction(async (tx) => {
        const swap = await tx.supportPauseSwap.findFirst({
          where: { id: swapId, organizationId: actor.organizationId },
          include: { requesterBooking: { include: { slot: true } }, targetBooking: { include: { slot: true } } }
        });
        if (!swap) throw new SupportOperationsError("NOT_FOUND");
        if (swap.targetBooking.userId !== actor.id && !isManager(actor)) throw new SupportOperationsError("FORBIDDEN");
        if (swap.status === decision) return { swap, idempotent: true };
        if (swap.status !== "PENDING" || (swap.expiresAt && swap.expiresAt <= new Date())) {
          throw new SupportOperationsError("CONFLICT");
        }
        const teamId = swap.requesterBooking.slot.teamId;
        if (!teamId || swap.targetBooking.slot.teamId !== teamId) throw new SupportOperationsError("CONFLICT");
        if (swap.requesterBooking.status !== "BOOKED" || swap.targetBooking.status !== "BOOKED") {
          throw new SupportOperationsError("CONFLICT");
        }
        await Promise.all([
          ensureSupportAgent(tx, actor.organizationId, swap.requesterBooking.userId, teamId, swap.requesterBooking.slot.startsAt),
          ensureSupportAgent(tx, actor.organizationId, swap.targetBooking.userId, teamId, swap.targetBooking.slot.startsAt)
        ]);
        if (decision === "ACCEPTED") {
          const [requesterOccurrence, targetOccurrence, requesterConflict, targetConflict] = await Promise.all([
            findPublishedOccurrenceCoveringInterval(tx, {
              organizationId: actor.organizationId,
              userId: swap.requesterBooking.userId,
              teamId,
              startsAt: swap.targetBooking.slot.startsAt,
              endsAt: swap.targetBooking.slot.endsAt
            }),
            findPublishedOccurrenceCoveringInterval(tx, {
              organizationId: actor.organizationId,
              userId: swap.targetBooking.userId,
              teamId,
              startsAt: swap.requesterBooking.slot.startsAt,
              endsAt: swap.requesterBooking.slot.endsAt
            }),
            tx.supportPauseBooking.findFirst({
              where: { organizationId: actor.organizationId, userId: swap.requesterBooking.userId, status: "BOOKED", id: { not: swap.requesterBooking.id }, slot: overlaps(swap.targetBooking.slot.startsAt, swap.targetBooking.slot.endsAt) }
            }),
            tx.supportPauseBooking.findFirst({
              where: { organizationId: actor.organizationId, userId: swap.targetBooking.userId, status: "BOOKED", id: { not: swap.targetBooking.id }, slot: overlaps(swap.requesterBooking.slot.startsAt, swap.requesterBooking.slot.endsAt) }
            })
          ]);
          if (!requesterOccurrence || !targetOccurrence || requesterConflict || targetConflict) {
            throw new SupportOperationsError("CONFLICT");
          }
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
          const requesterChanged = await tx.supportPauseBooking.updateMany({
            where: {
              id: swap.requesterBooking.id,
              organizationId: actor.organizationId,
              userId: swap.requesterBooking.userId,
              status: "BOOKED",
              slotId: requesterSlotId
            },
            data: {
              slotId: swap.targetBooking.slotId,
              shiftOccurrenceId: requesterOccurrence.id,
              rescheduleRequiredAt: null,
              rescheduleReason: null
            }
          });
          if (requesterChanged.count !== 1) throw new SupportOperationsError("CONFLICT");
          const targetChanged = await tx.supportPauseBooking.updateMany({
            where: {
              id: swap.targetBooking.id,
              organizationId: actor.organizationId,
              userId: swap.targetBooking.userId,
              status: "BOOKED",
              slotId: swap.targetBooking.slotId
            },
            data: {
              slotId: requesterSlotId,
              shiftOccurrenceId: targetOccurrence.id,
              rescheduleRequiredAt: null,
              rescheduleReason: null
            }
          });
          if (targetChanged.count !== 1) throw new SupportOperationsError("CONFLICT");
        }
        const decidedAt = new Date();
        const changed = await tx.supportPauseSwap.updateMany({
          where: { id: swap.id, organizationId: actor.organizationId, status: "PENDING" },
          data: { status: decision, decidedById: actor.id, decidedAt }
        });
        if (changed.count !== 1) throw new SupportOperationsError("CONFLICT");
        await tx.supportPauseSwapBookingLock.deleteMany({ where: { swapId: swap.id } });
        await tx.auditLog.create({
          data: {
            organizationId: actor.organizationId,
            actorId: actor.id,
            action: `support_pause.swap.${decision.toLowerCase()}`,
            entityType: "SupportPauseSwap",
            entityId: swap.id
          }
        });
        return { swap: { ...swap, status: decision, decidedById: actor.id, decidedAt } };
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    } catch (error) {
      if (isRetryableTransactionError(error) && attempt < 2) continue;
      if (isPrismaErrorCode(error, "P2002") || isPrismaErrorCode(error, "P2025")) {
        throw new SupportOperationsError("CONFLICT");
      }
      throw error;
    }
  }
  throw new SupportOperationsError("CONFLICT");
}

function parseMetric(value: unknown): SupportMetricKey {
  const metric = requiredString(value, 40).toUpperCase();
  if (!getSupportMetricDefinition(metric)) throw new SupportOperationsError("INVALID_INPUT");
  return metric as SupportMetricKey;
}

function parseWritableMetric(value: unknown): WritableSupportMetricKey {
  const metric = parseMetric(value);
  if (getSupportMetricDefinition(metric)?.status !== "CURRENT") throw new SupportOperationsError("INVALID_INPUT");
  return metric as WritableSupportMetricKey;
}

function metricDefinition(metric: string): SupportMetricDefinition {
  const definition = getSupportMetricDefinition(metric);
  if (!definition) throw new SupportOperationsError("INVALID_INPUT");
  return definition;
}

function choice<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  const normalized = requiredString(value ?? fallback, 40).toUpperCase();
  if (!(allowed as readonly string[]).includes(normalized)) throw new SupportOperationsError("INVALID_INPUT");
  return normalized as T;
}

interface SeriesDimensions {
  channel: string | null;
  granularity: (typeof supportMetricGranularities)[number];
  observationType: (typeof supportObservationTypes)[number];
}

function normalizedChannel(value: unknown) {
  const channel = optionalString(value, 40)?.toUpperCase() ?? null;
  if (channel && !/^[A-Z0-9][A-Z0-9_-]{0,39}$/.test(channel)) throw new SupportOperationsError("INVALID_INPUT");
  return channel;
}

function seriesDimensions(body: Record<string, unknown>, fallback?: Partial<SeriesDimensions>): SeriesDimensions {
  const channelValue = body.channel === undefined ? fallback?.channel ?? null : normalizedChannel(body.channel);
  return {
    channel: channelValue,
    granularity: choice(body.granularity, supportMetricGranularities, fallback?.granularity ?? "REPORTED_INTERVAL"),
    observationType: choice(body.observationType, supportObservationTypes, fallback?.observationType ?? "ACTUAL")
  };
}

function observationData(
  body: Record<string, unknown>,
  fallback?: Partial<SeriesDimensions & { rawValue: string | null; dataState: (typeof supportMetricDataStates)[number] }>
) {
  return {
    ...seriesDimensions(body, fallback),
    rawValue: body.rawValue === undefined ? fallback?.rawValue ?? null : optionalString(body.rawValue, 160),
    dataState: choice(body.dataState, supportMetricDataStates, fallback?.dataState ?? "AVAILABLE")
  };
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

function validateMetricValue(definition: SupportMetricDefinition, value: unknown) {
  if (definition.unit === "SCORE_1_5") return numberInRange(value, 1, 5);
  if (definition.unit === "DURATION_SECONDS") return integerInRange(value, 0, 31_536_000);
  if (definition.unit === "PERCENT") return numberInRange(value, 0, 100);
  return integerInRange(value, 0, 1_000_000_000);
}

export interface SupportPerformanceQuery {
  from?: string;
  to?: string;
  metric?: string;
  userId?: string;
  channel?: string;
  granularity?: string;
  observationType?: string;
}

function performanceWhere(actor: CurrentUser, query: SupportPerformanceQuery) {
  const to = query.to ? parseDateTime(query.to) : new Date();
  const from = query.from ? parseDateTime(query.from) : new Date(to.getTime() - 30 * 24 * 60 * 60 * 1000);
  const metric = query.metric ? parseMetric(query.metric) : undefined;
  const channel = query.channel ? normalizedChannel(query.channel) ?? undefined : undefined;
  const granularity = query.granularity
    ? choice(query.granularity, supportMetricGranularities, "REPORTED_INTERVAL")
    : undefined;
  const observationType = query.observationType
    ? choice(query.observationType, supportObservationTypes, "ACTUAL")
    : undefined;
  const where: Prisma.SupportKpiEntryWhereInput = {
    organizationId: actor.organizationId,
    archivedAt: null,
    metric,
    channel,
    granularity,
    observationType,
    userId: isManager(actor) ? query.userId || undefined : undefined,
    periodStart: { gte: from, lte: to },
    OR: isManager(actor) ? undefined : [{ userId: actor.id }, { scopeType: "ORGANIZATION" }]
  };
  return { where, from, to };
}

function approximatelyEqual(left: number, right: number) {
  return Math.abs(left - right) <= Math.max(1e-9, Math.abs(right) * 1e-9);
}

function metricComponents(
  definition: SupportMetricDefinition,
  value: number,
  body: Record<string, unknown>,
  fallback: { numerator: number | null; denominator: number | null } = { numerator: null, denominator: null }
) {
  const hasInput = ["numerator", "denominator", "sampleSize"].some((key) => key in body);
  if (definition.aggregation === "SUM" || definition.aggregation === "LATEST") {
    if (hasInput) throw new SupportOperationsError("INVALID_INPUT");
    return { numerator: null, denominator: null };
  }

  if (body.denominator !== undefined && body.sampleSize !== undefined
    && Number(body.denominator) !== Number(body.sampleSize)) throw new SupportOperationsError("INVALID_INPUT");
  const suppliedDenominator = body.denominator ?? body.sampleSize;
  const denominator = hasInput
    ? suppliedDenominator === null || suppliedDenominator === undefined ? null : numberInRange(suppliedDenominator, 1, 1_000_000_000)
    : fallback.denominator;
  if (denominator === null) {
    if (body.numerator !== undefined && body.numerator !== null) throw new SupportOperationsError("INVALID_INPUT");
    return { numerator: null, denominator: null };
  }

  const expectedNumerator = definition.aggregation === "RATIO"
    ? value * denominator / 100
    : value * denominator;
  const numerator = body.numerator === undefined || body.numerator === null
    ? expectedNumerator
    : numberInRange(body.numerator, 0, Number.MAX_SAFE_INTEGER);
  if (!approximatelyEqual(numerator, expectedNumerator)) throw new SupportOperationsError("INVALID_INPUT");
  return { numerator, denominator };
}

interface AggregationEntry {
  value: number;
  numerator: number | null;
  denominator: number | null;
}

function aggregateMetricEntries(definition: SupportMetricDefinition, entries: AggregationEntry[]) {
  if (!entries.length) return { average: null, samples: 0, aggregation: definition.aggregation };
  if (definition.aggregation === "LATEST") {
    return { average: entries[entries.length - 1].value, samples: 1, aggregation: "LATEST" as const };
  }
  if (definition.aggregation === "SUM") {
    return {
      average: entries.reduce((total, entry) => total + entry.value, 0),
      samples: entries.length,
      aggregation: "SUM" as const
    };
  }
  const hasCompleteComponents = entries.every((entry) => (
    entry.numerator !== null && entry.denominator !== null && entry.denominator > 0
  ));
  if (hasCompleteComponents) {
    const denominator = entries.reduce((total, entry) => total + (entry.denominator ?? 0), 0);
    const numerator = entries.reduce((total, entry) => total + (entry.numerator ?? 0), 0);
    return {
      average: definition.aggregation === "RATIO" ? numerator / denominator * 100 : numerator / denominator,
      samples: denominator,
      aggregation: definition.aggregation
    };
  }
  return {
    average: entries.reduce((total, entry) => total + entry.value, 0) / entries.length,
    samples: entries.length,
    aggregation: "MEAN" as const
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

interface CampaignAudienceMember {
  id: string;
  name: string;
}

interface CampaignAudienceSnapshot {
  rule: "FIXED_AT_ACTIVATION";
  members: CampaignAudienceMember[];
}

interface CampaignResultEntry {
  id?: string;
  metric: string;
  definitionVersion?: number;
  unit?: string;
  channel?: string | null;
  granularity?: string;
  observationType?: string;
  value: number;
  numerator: number | null;
  denominator: number | null;
  scopeType: string;
  userId: string | null;
  teamId: string | null;
  teamLabel: string | null;
  periodStart: Date;
  periodEnd: Date;
  revision?: number;
  source?: string | null;
}

interface MetricSeriesRecord {
  metric: string;
  definitionVersion?: number;
  unit?: string;
  channel?: string | null;
  granularity?: string;
  observationType?: string;
}

function resolvedMetricSeries(record: MetricSeriesRecord) {
  const definition = metricDefinition(record.metric);
  return {
    definition,
    definitionVersion: record.definitionVersion ?? definition.definitionVersion,
    unit: record.unit ?? definition.unit,
    channel: record.channel ?? null,
    granularity: record.granularity ?? "REPORTED_INTERVAL",
    observationType: record.observationType ?? "ACTUAL"
  };
}

function sameMetricSeries(left: MetricSeriesRecord, right: MetricSeriesRecord) {
  const leftSeries = resolvedMetricSeries(left);
  const rightSeries = resolvedMetricSeries(right);
  return left.metric === right.metric
    && leftSeries.definitionVersion === rightSeries.definitionVersion
    && leftSeries.unit === rightSeries.unit
    && leftSeries.channel === rightSeries.channel
    && leftSeries.granularity === rightSeries.granularity
    && leftSeries.observationType === rightSeries.observationType;
}

function parseStoredJson<T>(value: string | null | undefined): T | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

function entriesForCampaign(
  campaign: MetricSeriesRecord & {
    scopeType: string;
    userId: string | null;
    teamId: string | null;
    teamLabel: string | null;
    startsAt: Date;
    endsAt: Date;
  },
  entries: CampaignResultEntry[]
) {
  return entries.filter((entry) => {
    if (!sameMetricSeries(entry, campaign) || entry.periodEnd < campaign.startsAt || entry.periodStart > campaign.endsAt) return false;
    if (campaign.scopeType === "USER") return entry.userId === campaign.userId;
    if (campaign.scopeType === "TEAM") return campaign.teamId ? entry.teamId === campaign.teamId : entry.teamLabel === campaign.teamLabel;
    return entry.scopeType === "ORGANIZATION";
  });
}

function evaluatedCampaignResult(
  campaign: MetricSeriesRecord & { comparison: string; targetValue: number },
  entries: CampaignResultEntry[],
  frozenAt: Date | null = null
) {
  const aggregate = aggregateMetricEntries(metricDefinition(campaign.metric), entries);
  const current = aggregate.average;
  return {
    current,
    ...aggregate,
    ...campaignProgress(campaign.comparison, campaign.targetValue, current),
    frozenAt,
    trend: entries.map((entry) => ({
      entryId: entry.id ?? null,
      revision: entry.revision ?? 1,
      periodStart: entry.periodStart,
      periodEnd: entry.periodEnd,
      value: entry.value,
      samples: entry.denominator ?? 1,
      channel: entry.channel ?? null,
      granularity: entry.granularity ?? "REPORTED_INTERVAL",
      observationType: entry.observationType ?? "ACTUAL"
    })),
    provenance: entries.map((entry) => ({
      entryId: entry.id ?? null,
      revision: entry.revision ?? 1,
      source: entry.source ?? null,
      periodStart: entry.periodStart,
      periodEnd: entry.periodEnd
    }))
  };
}

async function resolveCampaignAudience(
  prisma: PrismaClient | Prisma.TransactionClient,
  organizationId: string,
  campaign: { scopeType: string; userId: string | null; teamId: string | null }
): Promise<CampaignAudienceSnapshot> {
  let members: CampaignAudienceMember[];
  if (campaign.scopeType === "USER") {
    const user = campaign.userId
      ? await prisma.user.findFirst({
          where: { id: campaign.userId, organizationId, role: "SAC", active: true },
          select: { id: true, name: true }
        })
      : null;
    members = user ? [user] : [];
  } else if (campaign.scopeType === "TEAM") {
    const memberships = campaign.teamId
      ? await prisma.supportTeamMembership.findMany({
          where: { organizationId, teamId: campaign.teamId, user: { active: true, role: "SAC" }, ...activeMembership(new Date()) },
          include: { user: { select: { id: true, name: true } } },
          orderBy: { user: { name: "asc" } }
        })
      : [];
    members = [...new Map(memberships.map((membership) => [membership.user.id, membership.user])).values()];
  } else {
    members = await prisma.user.findMany({
      where: { organizationId, role: "SAC", active: true },
      select: { id: true, name: true },
      orderBy: [{ name: "asc" }, { id: "asc" }]
    });
  }
  if (!members.length) throw new SupportOperationsError("CONFLICT");
  return { rule: "FIXED_AT_ACTIVATION", members };
}

export async function listSupportPerformance(prisma: PrismaClient, actor: CurrentUser, query: SupportPerformanceQuery) {
  const { where, from, to } = performanceWhere(actor, query);
  const actorMemberships = actor.role === "SAC"
    ? await prisma.supportTeamMembership.findMany({
        where: { organizationId: actor.organizationId, userId: actor.id, ...activeMembership(from, to) },
        select: { teamId: true, validFrom: true, validTo: true }
      })
    : [];
  const actorTeamIds = [...new Set(actorMemberships.map((membership) => membership.teamId))];
  const allTeams = await prisma.supportTeam.findMany({
    where: {
      organizationId: actor.organizationId,
      active: true,
      ...(isManager(actor) ? {} : { id: { in: actorTeamIds } })
    },
    select: { id: true, name: true },
    orderBy: { name: "asc" }
  });
  if (!isManager(actor)) {
    const teamWindows: Prisma.SupportKpiEntryWhereInput[] = actorMemberships.map((membership) => ({
      teamId: membership.teamId,
      periodStart: { gte: membership.validFrom },
      ...(membership.validTo ? { periodEnd: { lte: membership.validTo } } : {})
    }));
    where.OR = [{ userId: actor.id }, { scopeType: "ORGANIZATION" }, ...teamWindows];
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
      orderBy: [{ periodEnd: "asc" }, { periodStart: "asc" }, { createdAt: "asc" }],
      take: 1000
    }),
    prisma.supportCampaign.findMany({
      where: {
        organizationId: actor.organizationId,
        status: { in: ["ACTIVE", "PAUSED"] },
        OR: isManager(actor) ? undefined : [
          { scopeType: "ORGANIZATION" },
          { userId: actor.id },
          ...actorMemberships.map((membership) => ({
            teamId: membership.teamId,
            startsAt: { gte: membership.validFrom },
            ...(membership.validTo ? { endsAt: { lte: membership.validTo } } : {})
          }))
        ]
      },
      include: { user: { select: { id: true, name: true, email: true } }, team: { select: { id: true, name: true } } },
      orderBy: [{ endsAt: "asc" }, { name: "asc" }]
    })
  ]);
  const approvedEntries = entries.filter((entry) => entry.status === "APPROVED");
  const seriesGroups = new Map<string, {
    series: ReturnType<typeof resolvedMetricSeries>;
    scope: { scopeType: string; userId: string | null; teamId: string | null; teamLabel: string | null };
    entries: typeof approvedEntries;
  }>();
  for (const entry of approvedEntries) {
    const series = resolvedMetricSeries(entry);
    if (series.definitionVersion !== series.definition.definitionVersion || series.unit !== series.definition.unit) continue;
    const scope = {
      scopeType: entry.scopeType,
      userId: entry.scopeType === "USER" ? entry.userId : null,
      teamId: entry.scopeType === "TEAM" ? entry.teamId : null,
      teamLabel: entry.scopeType === "TEAM" ? entry.teamLabel : null
    };
    const key = JSON.stringify([
      entry.metric,
      series.definitionVersion,
      series.unit,
      series.channel,
      series.granularity,
      series.observationType,
      scope.scopeType,
      scope.userId,
      scope.teamId ?? scope.teamLabel
    ]);
    const group = seriesGroups.get(key);
    if (group) group.entries.push(entry);
    else seriesGroups.set(key, { series, scope, entries: [entry] });
  }
  const summary = [...seriesGroups.values()].map(({ series, scope, entries: metricEntries }) => {
    const latest = metricEntries.at(-1) ?? null;
    const aggregate = aggregateMetricEntries(series.definition, metricEntries);
    return {
      metric: series.definition.key,
      definitionVersion: series.definitionVersion,
      unit: series.unit,
      channel: series.channel,
      granularity: series.granularity,
      observationType: series.observationType,
      ...scope,
      latest: latest?.value ?? null,
      ...aggregate
    };
  });
  return {
    canManage: isManager(actor),
    dictionaryVersion: SUPPORT_PERFORMANCE_DICTIONARY_VERSION,
    definitions: supportMetricDefinitions,
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
  const metric = parseWritableMetric(body.metric);
  const definition = metricDefinition(metric);
  const observation = observationData(body);
  const scope = parseScope(body);
  const periodStart = parseDateTime(body.periodStart);
  const periodEnd = parseDateTime(body.periodEnd);
  if (periodEnd < periodStart) throw new SupportOperationsError("INVALID_INPUT");
  if (scope.userId) await ensureSupportAgent(prisma, actor.organizationId, scope.userId);
  if (scope.teamId) {
    const team = await ensureSupportTeam(prisma, actor.organizationId, scope.teamId);
    scope.teamLabel ??= team.name;
  }
  const value = validateMetricValue(definition, body.value);
  const components = metricComponents(definition, value, body);
  const entry = await prisma.supportKpiEntry.create({
    data: {
      organizationId: actor.organizationId,
      metric,
      definitionVersion: definition.definitionVersion,
      unit: definition.unit,
      value,
      ...components,
      ...observation,
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
    metadata: {
      metric,
      definitionVersion: definition.definitionVersion,
      unit: definition.unit,
      channel: observation.channel,
      granularity: observation.granularity,
      observationType: observation.observationType,
      scopeType: scope.scopeType,
      userId: scope.userId,
      periodStart,
      periodEnd
    }
  });
  return { entry };
}

export async function updateSupportKpiEntry(prisma: PrismaClient, actor: CurrentUser, entryId: string, input: unknown) {
  if (!isManager(actor) || !input || typeof input !== "object") throw new SupportOperationsError("FORBIDDEN");
  const existing = await prisma.supportKpiEntry.findFirst({ where: { id: entryId, organizationId: actor.organizationId, archivedAt: null } });
  if (!existing) throw new SupportOperationsError("NOT_FOUND");
  const body = input as Record<string, unknown>;
  if (metricDefinition(existing.metric).status !== "CURRENT") throw new SupportOperationsError("INVALID_INPUT");
  const metric = body.metric === undefined ? existing.metric as WritableSupportMetricKey : parseWritableMetric(body.metric);
  const definition = metricDefinition(metric);
  const value = validateMetricValue(definition, body.value === undefined ? existing.value : body.value);
  const components = metricComponents(definition, value, body, metric === existing.metric
    ? { numerator: existing.numerator, denominator: existing.denominator }
    : undefined);
  const observation = observationData(body, {
    channel: existing.channel,
    granularity: existing.granularity as SeriesDimensions["granularity"],
    observationType: existing.observationType as SeriesDimensions["observationType"],
    rawValue: existing.rawValue,
    dataState: existing.dataState as (typeof supportMetricDataStates)[number]
  });
  if (existing.status === "SUBMITTED" || existing.status === "SUPERSEDED") throw new SupportOperationsError("CONFLICT");
  if (body.archived === true && existing.status === "APPROVED") throw new SupportOperationsError("CONFLICT");
  const data = {
    metric,
    definitionVersion: definition.definitionVersion,
    unit: definition.unit,
    value,
    ...components,
    ...observation,
    source: body.source === undefined ? existing.source : optionalString(body.source, 160),
    note: body.note === undefined ? existing.note : optionalString(body.note, 1000),
    updatedById: actor.id
  };
  const createsRevision = existing.status === "APPROVED" || existing.status === "REJECTED";
  const entry = createsRevision
    ? await prisma.supportKpiEntry.create({
        data: {
          organizationId: existing.organizationId,
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
        status: isManager(actor) ? undefined : { in: ["ACTIVE", "PAUSED", "CLOSED"] }
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
      where: {
        organizationId: actor.organizationId,
        active: true,
        ...(isManager(actor) ? {} : { id: { in: actorTeamIds } })
      },
      select: { id: true, name: true },
      orderBy: { name: "asc" }
    })
  ]);
  const actorTeamIdSet = new Set(actorTeamIds);
  const visibleItems = isManager(actor) ? items : items.filter((campaign) => {
    const audience = parseStoredJson<CampaignAudienceSnapshot>(campaign.audienceSnapshotJson);
    if (audience) return audience.members.some((member) => member.id === actor.id);
    if (campaign.scopeType === "ORGANIZATION") return true;
    if (campaign.scopeType === "USER") return campaign.userId === actor.id;
    return Boolean(campaign.teamId && actorTeamIdSet.has(campaign.teamId));
  });
  const periodStart = visibleItems.length ? new Date(Math.min(...visibleItems.map((item) => item.startsAt.getTime()))) : null;
  const periodEnd = visibleItems.length ? new Date(Math.max(...visibleItems.map((item) => item.endsAt.getTime()))) : null;
  const entries = periodStart && periodEnd
    ? await prisma.supportKpiEntry.findMany({
        where: {
          organizationId: actor.organizationId,
          archivedAt: null,
          status: "APPROVED",
          metric: { in: [...new Set(visibleItems.map((item) => item.metric))] },
          periodStart: { lte: periodEnd },
          periodEnd: { gte: periodStart }
        },
        orderBy: [{ periodEnd: "asc" }, { createdAt: "asc" }]
      })
    : [];
  const evaluatedItems = visibleItems.map((campaign) => {
    const audience = parseStoredJson<CampaignAudienceSnapshot>(campaign.audienceSnapshotJson) ?? {
      rule: "FIXED_AT_ACTIVATION" as const,
      members: []
    };
    const frozenResult = campaign.status === "CLOSED"
      ? parseStoredJson<ReturnType<typeof evaluatedCampaignResult>>(campaign.resultSnapshotJson)
      : null;
    const result = frozenResult ?? evaluatedCampaignResult(
      campaign,
      entriesForCampaign(campaign, entries),
      campaign.resultSnapshotAt
    );
    const { audienceSnapshotJson: _audienceSnapshotJson, resultSnapshotJson: _resultSnapshotJson, ...campaignView } = campaign;
    return {
      ...campaignView,
      audience,
      result
    };
  });
  return {
    canManage: isManager(actor),
    dictionaryVersion: SUPPORT_PERFORMANCE_DICTIONARY_VERSION,
    definitions: supportMetricDefinitions,
    items: evaluatedItems,
    teams
  };
}

function campaignData(actor: CurrentUser, body: Record<string, unknown>) {
  const metric = parseWritableMetric(body.metric);
  const definition = metricDefinition(metric);
  const dimensions = seriesDimensions(body);
  const defaultComparison = definition.direction === "LOWER_IS_BETTER" ? "LTE" : "GTE";
  const comparison = requiredString(body.comparison ?? defaultComparison, 10).toUpperCase();
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
    definitionVersion: definition.definitionVersion,
    unit: definition.unit,
    ...dimensions,
    targetValue: validateMetricValue(definition, body.targetValue),
    comparison,
    ...parseScope(body),
    status,
    startsAt,
    endsAt,
    updatedById: actor.id
  };
}

const campaignTransitions: Record<string, readonly string[]> = {
  DRAFT: ["DRAFT", "ACTIVE"],
  ACTIVE: ["PAUSED", "CLOSED"],
  PAUSED: ["ACTIVE", "CLOSED"],
  CLOSED: []
};

export async function createSupportCampaign(prisma: PrismaClient, actor: CurrentUser, input: unknown) {
  if (!isManager(actor) || !input || typeof input !== "object") throw new SupportOperationsError("FORBIDDEN");
  const data = campaignData(actor, input as Record<string, unknown>);
  if (data.status !== "DRAFT") throw new SupportOperationsError("INVALID_INPUT");
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
    metadata: {
      metric: campaign.metric,
      definitionVersion: campaign.definitionVersion,
      unit: campaign.unit,
      channel: campaign.channel,
      granularity: campaign.granularity,
      observationType: campaign.observationType,
      targetValue: campaign.targetValue,
      scopeType: campaign.scopeType
    }
  });
  return { campaign };
}

export async function updateSupportCampaign(prisma: PrismaClient, actor: CurrentUser, campaignId: string, input: unknown) {
  if (!isManager(actor) || !input || typeof input !== "object") throw new SupportOperationsError("FORBIDDEN");
  const body = input as Record<string, unknown>;
  const transition = await prisma.$transaction(async (tx) => {
    const existing = await tx.supportCampaign.findFirst({ where: { id: campaignId, organizationId: actor.organizationId } });
    if (!existing) throw new SupportOperationsError("NOT_FOUND");
    const nextStatus = requiredString(body.status ?? existing.status, 20).toUpperCase();
    if (!(campaignTransitions[existing.status] ?? []).includes(nextStatus)) throw new SupportOperationsError("CONFLICT");
    if (existing.status !== "DRAFT" && Object.keys(body).some((key) => key !== "status")) {
      throw new SupportOperationsError("CONFLICT");
    }

    const data = existing.status === "DRAFT"
      ? campaignData(actor, {
          name: body.name ?? existing.name,
          description: body.description === undefined ? existing.description : body.description,
          metric: body.metric ?? existing.metric,
          channel: body.channel === undefined ? existing.channel : body.channel,
          granularity: body.granularity ?? existing.granularity,
          observationType: body.observationType ?? existing.observationType,
          targetValue: body.targetValue ?? existing.targetValue,
          comparison: body.comparison ?? (body.metric !== undefined && body.metric !== existing.metric ? undefined : existing.comparison),
          scopeType: body.scopeType ?? existing.scopeType,
          userId: body.userId === undefined ? existing.userId : body.userId,
          teamId: body.teamId === undefined ? existing.teamId : body.teamId,
          teamLabel: body.teamLabel === undefined ? existing.teamLabel : body.teamLabel,
          status: nextStatus,
          startsAt: body.startsAt ?? existing.startsAt.toISOString(),
          endsAt: body.endsAt ?? existing.endsAt.toISOString()
        })
      : { status: nextStatus, updatedById: actor.id };

    if ("userId" in data && data.userId) await ensureSupportAgent(tx, actor.organizationId, data.userId);
    if ("teamId" in data && data.teamId) {
      const team = await ensureSupportTeam(tx, actor.organizationId, data.teamId);
      data.teamLabel ??= team.name;
    }

    const now = new Date();
    const statusChanged = existing.status !== nextStatus;
    const updateData: Prisma.SupportCampaignUncheckedUpdateInput = { ...data };
    let audience = parseStoredJson<CampaignAudienceSnapshot>(existing.audienceSnapshotJson);
    if (nextStatus !== "DRAFT" && !audience) {
      const campaignScope = {
        scopeType: "scopeType" in data ? data.scopeType : existing.scopeType,
        userId: "userId" in data ? data.userId : existing.userId,
        teamId: "teamId" in data ? data.teamId : existing.teamId
      };
      audience = await resolveCampaignAudience(tx, actor.organizationId, campaignScope);
      updateData.audienceSnapshotJson = JSON.stringify(audience);
      updateData.audienceSnapshotAt = now;
      updateData.audienceRule = audience.rule;
    }
    if (statusChanged) {
      updateData.lifecycleVersion = { increment: 1 };
      if (nextStatus === "ACTIVE") {
        updateData.publishedAt = existing.publishedAt ?? now;
        updateData.pausedAt = null;
      } else if (nextStatus === "PAUSED") {
        updateData.pausedAt = now;
      } else if (nextStatus === "CLOSED") {
        const campaignForResult = {
          ...existing,
          ...data,
          startsAt: "startsAt" in data ? data.startsAt : existing.startsAt,
          endsAt: "endsAt" in data ? data.endsAt : existing.endsAt,
          scopeType: "scopeType" in data ? data.scopeType : existing.scopeType,
          userId: "userId" in data ? data.userId : existing.userId,
          teamId: "teamId" in data ? data.teamId : existing.teamId,
          teamLabel: "teamLabel" in data ? data.teamLabel : existing.teamLabel,
          metric: "metric" in data ? data.metric : existing.metric,
          comparison: "comparison" in data ? data.comparison : existing.comparison,
          targetValue: "targetValue" in data ? data.targetValue : existing.targetValue
        };
        const approvedEntries = await tx.supportKpiEntry.findMany({
          where: {
            organizationId: actor.organizationId,
            archivedAt: null,
            status: "APPROVED",
            metric: campaignForResult.metric,
            periodStart: { lte: campaignForResult.endsAt },
            periodEnd: { gte: campaignForResult.startsAt }
          },
          orderBy: [{ periodEnd: "asc" }, { createdAt: "asc" }]
        });
        const resultSnapshot = evaluatedCampaignResult(
          campaignForResult,
          entriesForCampaign(campaignForResult, approvedEntries),
          now
        );
        updateData.resultSnapshotJson = JSON.stringify(resultSnapshot);
        updateData.resultSnapshotAt = now;
        updateData.closedAt = now;
      }
    }

    const campaign = await tx.supportCampaign.update({ where: { id: existing.id }, data: updateData });
    await tx.auditLog.create({
      data: {
        organizationId: actor.organizationId,
        actorId: actor.id,
        action: statusChanged ? `support_campaign.status.${nextStatus.toLowerCase()}` : "support_campaign.draft.update",
        entityType: "SupportCampaign",
        entityId: campaign.id,
        metadataJson: JSON.stringify({
          previousStatus: existing.status,
          status: nextStatus,
          lifecycleVersion: campaign.lifecycleVersion,
          audienceCount: audience?.members.length ?? 0,
          resultFrozen: nextStatus === "CLOSED"
        })
      }
    });
    return { campaign, previousStatus: existing.status, audience, statusChanged };
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

  if (transition.statusChanged && transition.audience) {
    const statusTitle = transition.campaign.status === "ACTIVE"
      ? transition.previousStatus === "PAUSED" ? "Campanha retomada" : "Nova campanha SAC"
      : transition.campaign.status === "PAUSED" ? "Campanha pausada" : "Campanha encerrada";
    await emitInAppNotifications(prisma, actor.organizationId, {
      actorId: actor.id,
      recipientIds: transition.audience.members.map((member) => member.id),
      type: `support_campaign.${transition.campaign.status.toLowerCase()}`,
      title: `${statusTitle}: ${transition.campaign.name}`,
      body: transition.campaign.description,
      entityType: "SupportCampaign",
      entityId: transition.campaign.id,
      href: "/campanhas",
      dedupeKey: `support-campaign:${transition.campaign.id}:status:${transition.campaign.status}:v${transition.campaign.lifecycleVersion}`
    });
  }
  return { campaign: transition.campaign };
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
