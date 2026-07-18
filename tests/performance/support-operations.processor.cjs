const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "0.0.0.0", "::1", "[::1]"]);
const LOCAL_TIMEZONE = "America/Sao_Paulo";
const ISO_LOCAL_DATE = /^\d{4}-\d{2}-\d{2}$/;
const ISO_MONTH = /^\d{4}-\d{2}$/;

function fail(message, done) {
  done(new Error(`[support-performance] ${message}`));
}

function isLocalTarget(target) {
  try {
    const hostname = new URL(target).hostname.toLowerCase();
    return LOCAL_HOSTS.has(hostname) || hostname.endsWith(".localhost");
  } catch {
    return false;
  }
}

function parseDate(value, name) {
  if (!ISO_LOCAL_DATE.test(value)) throw new Error(`${name} must use YYYY-MM-DD`);
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    throw new Error(`${name} must be a valid local date`);
  }
  return date;
}

function formatDate(date) {
  return date.toISOString().slice(0, 10);
}

function addDays(value, days) {
  const date = parseDate(value, "date");
  date.setUTCDate(date.getUTCDate() + days);
  return formatDate(date);
}

function mondayOf(value) {
  const date = parseDate(value, "date");
  const day = date.getUTCDay();
  date.setUTCDate(date.getUTCDate() - (day === 0 ? 6 : day - 1));
  return formatDate(date);
}

function todayInSaoPaulo() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: LOCAL_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(new Date());
  const part = (type) => parts.find((item) => item.type === type)?.value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}

function testRunId(context) {
  return String(context.vars.$testId || `${process.pid}-${Date.now()}`);
}

function numericHash(value) {
  let hash = 0;
  for (const character of value) hash = (Math.imul(hash, 31) + character.charCodeAt(0)) >>> 0;
  return hash;
}

function requestName(request) {
  return `${request.method || "HTTP"} ${request.url || "<unknown-url>"}`;
}

function objectValue(value, name) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(`${name} must be an object`);
  return value;
}

function arrayValue(value, name) {
  if (!Array.isArray(value)) throw new Error(`${name} must be an array`);
  return value;
}

function integerValue(value, name, minimum = 0) {
  if (!Number.isInteger(value) || value < minimum) throw new Error(`${name} must be an integer >= ${minimum}`);
  return value;
}

function idValue(value, name) {
  if (typeof value !== "string" || !value.trim()) throw new Error(`${name} must be a non-empty id`);
  return value;
}

function parseApiResponse(request, response, expectedStatus) {
  if (response.statusCode !== expectedStatus) {
    throw new Error(`${requestName(request)} returned HTTP ${response.statusCode}; expected ${expectedStatus}`);
  }
  let payload;
  try {
    payload = JSON.parse(response.body || "{}");
  } catch {
    throw new Error(`${requestName(request)} returned invalid JSON`);
  }
  objectValue(payload, "response");
  if (payload.ok !== true) throw new Error(`${requestName(request)} returned ok != true`);
  return objectValue(payload.data, "response.data");
}

function validateUnique(values, name) {
  if (new Set(values).size !== values.length) throw new Error(`${name} contains duplicates`);
}

function setCommonVariables(context) {
  if (!isLocalTarget(context.vars.target)) {
    throw new Error(`target must be local, received ${context.vars.target || "<empty>"}`);
  }
  if (!process.env.SEED_ADMIN_PASSWORD) {
    throw new Error("SEED_ADMIN_PASSWORD is required and must belong to the local seeded test account");
  }
  context.vars.adminEmail = process.env.PERF_ADMIN_EMAIL || "admin@example.com";
  context.vars.adminPassword = process.env.SEED_ADMIN_PASSWORD;
}

function requireTestWrites(purpose) {
  if (String(process.env.NODE_ENV || "").toLowerCase() === "production") {
    throw new Error(`${purpose} is disabled when NODE_ENV=production`);
  }
  if (process.env.PERF_ALLOW_TEST_WRITES !== "true") {
    throw new Error(`PERF_ALLOW_TEST_WRITES=true is required for ${purpose}`);
  }
}

function setDateRange(context, options) {
  const baseDate = options.baseDate;
  const from = options.from || mondayOf(baseDate);
  const to = options.to || addDays(from, 6);
  const fromDate = parseDate(from, options.fromName);
  const toDate = parseDate(to, options.toName);
  const days = Math.round((toDate.getTime() - fromDate.getTime()) / 86_400_000) + 1;
  if (days < 1 || days > 62) throw new Error(`${options.fromName}/${options.toName} must span 1 to 62 days`);
  context.vars.supportFrom = from;
  context.vars.supportTo = to;
}

function prepareReadScenario(context, _events, done) {
  try {
    setCommonVariables(context);
    const baseDate = process.env.PERF_SUPPORT_DATE || todayInSaoPaulo();
    parseDate(baseDate, "PERF_SUPPORT_DATE");
    context.vars.supportDate = baseDate;
    setDateRange(context, {
      baseDate,
      from: process.env.PERF_SUPPORT_FROM,
      to: process.env.PERF_SUPPORT_TO,
      fromName: "PERF_SUPPORT_FROM",
      toName: "PERF_SUPPORT_TO"
    });
    done();
  } catch (error) {
    fail(error instanceof Error ? error.message : "invalid read scenario configuration", done);
  }
}

function prepareCoverageReadScenario(context, events, done) {
  prepareReadScenario(context, events, done);
}

function prepareMaterializationScenario(context, _events, done) {
  try {
    setCommonVariables(context);
    requireTestWrites("materialization");
    const defaultBaseDate = addDays(todayInSaoPaulo(), 21);
    const baseDate = process.env.PERF_MATERIALIZE_DATE || defaultBaseDate;
    parseDate(baseDate, "PERF_MATERIALIZE_DATE");
    setDateRange(context, {
      baseDate,
      from: process.env.PERF_MATERIALIZE_FROM,
      to: process.env.PERF_MATERIALIZE_TO,
      fromName: "PERF_MATERIALIZE_FROM",
      toName: "PERF_MATERIALIZE_TO"
    });
    context.vars.supportDate = process.env.PERF_MATERIALIZE_DATE || context.vars.supportFrom;
    parseDate(context.vars.supportDate, "PERF_MATERIALIZE_DATE");
    context.vars.materializationCalls = {};
    done();
  } catch (error) {
    fail(error instanceof Error ? error.message : "invalid materialization configuration", done);
  }
}

function prepareClaimBurstScenario(context, _events, done) {
  try {
    setCommonVariables(context);
    requireTestWrites("claim burst");
    if (!context.vars.claimDate) {
      const today = todayInSaoPaulo();
      const claimDate = process.env.PERF_CLAIM_DATE || addDays(today, 35);
      const dayDistance = Math.round((parseDate(claimDate, "PERF_CLAIM_DATE") - parseDate(today, "today")) / 86_400_000);
      if (dayDistance < 1 || dayDistance > 180) {
        throw new Error("PERF_CLAIM_DATE must be 1 to 180 days in the future");
      }
      const runId = testRunId(context);
      const offsetMilliseconds = numericHash(runId) % 300_000;
      const startsAt = new Date(Date.parse(`${claimDate}T18:00:00.000Z`) + offsetMilliseconds);
      context.vars.claimDate = claimDate;
      context.vars.claimStartsAt = startsAt.toISOString();
      context.vars.claimEndsAt = new Date(startsAt.getTime() + 60 * 60_000).toISOString();
      context.vars.claimNote = `Local performance claim ${runId}`.slice(0, 280);
    }
    done();
  } catch (error) {
    fail(error instanceof Error ? error.message : "invalid claim burst configuration", done);
  }
}

function recurrenceMonthRange(month) {
  if (!ISO_MONTH.test(month)) throw new Error("PERF_RECURRENCE_MONTH must use YYYY-MM");
  const [year, monthNumber] = month.split("-").map(Number);
  const first = new Date(Date.UTC(year, monthNumber - 1, 1));
  if (first.toISOString().slice(0, 7) !== month) throw new Error("PERF_RECURRENCE_MONTH must be valid");
  const last = new Date(Date.UTC(year, monthNumber, 0));
  return { from: formatDate(first), to: formatDate(last) };
}

function nextMonth(value) {
  const date = parseDate(value, "date");
  date.setUTCDate(1);
  date.setUTCMonth(date.getUTCMonth() + 1);
  return date.toISOString().slice(0, 7);
}

function prepareRecurrenceScenario(context, _events, done) {
  try {
    setCommonVariables(context);
    requireTestWrites("recurrence scheduler probe");
    if (!context.vars.recurrenceFrom) {
      const today = todayInSaoPaulo();
      const month = process.env.PERF_RECURRENCE_MONTH || nextMonth(today);
      const range = recurrenceMonthRange(month);
      if (range.from <= today) throw new Error("PERF_RECURRENCE_MONTH must be a future month");
      const runId = testRunId(context);
      const safeRunId = runId.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 36);
      context.vars.recurrenceFrom = range.from;
      context.vars.recurrenceTo = range.to;
      context.vars.recurrenceDay14 = `${month}-14`;
      context.vars.recurrenceDay29 = `${month}-29`;
      context.vars.recurrenceSlug = `perf-recorrencia-${safeRunId || numericHash(runId)}`.slice(0, 60);
      context.vars.recurrenceTitle = `Performance recurrence ${runId}`.slice(0, 130);
    }
    done();
  } catch (error) {
    fail(error instanceof Error ? error.message : "invalid recurrence configuration", done);
  }
}

function ensure2xx(request, response, _context, _events, done) {
  if (response.statusCode < 200 || response.statusCode >= 300) {
    return fail(`${requestName(request)} returned HTTP ${response.statusCode}`, done);
  }
  done();
}

function materializationKind(url) {
  if (url.includes("/v1/support/schedules/occurrences/materialize")) return "schedule";
  if (url.includes("/v1/support/pauses/slots/generate")) return "pauses";
  if (url.includes("/v1/announcements/materialize")) return "announcements";
  return null;
}

function verifyIdempotentMaterialization(request, response, context, _events, done) {
  try {
    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw new Error(`${requestName(request)} returned HTTP ${response.statusCode}`);
    }
    const kind = materializationKind(request.url);
    if (!kind) throw new Error(`unexpected materialization endpoint: ${request.url}`);
    const payload = JSON.parse(response.body || "{}");
    const data = payload.data ?? payload;
    const calls = context.vars.materializationCalls;
    calls[kind] = (calls[kind] || 0) + 1;
    if (calls[kind] === 2) {
      if (kind === "schedule" && (data.createdCount !== 0 || data.updatedCount !== 0)) {
        throw new Error("second schedule materialization created or updated occurrences");
      }
      if (kind === "pauses" && data.createdCount !== 0) {
        throw new Error("second pause-slot materialization created slots");
      }
      if (kind === "announcements" && (!Array.isArray(data.created) || data.created.length !== 0)) {
        throw new Error("second announcement materialization created occurrences");
      }
    }
    done();
  } catch (error) {
    fail(error instanceof Error ? error.message : "invalid materialization response", done);
  }
}

function verifySupportDiscovery(request, response, _context, _events, done) {
  try {
    const data = parseApiResponse(request, response, 200);
    const teams = arrayValue(data.teams, "response.data.teams");
    const agents = arrayValue(data.agents, "response.data.agents");
    if (!teams.length) throw new Error("seeded support team was not found");
    if (!agents.length) throw new Error("seeded support agent was not found");
    teams.forEach((team, index) => idValue(objectValue(team, `teams[${index}]`).id, `teams[${index}].id`));
    agents.forEach((agent, index) => idValue(objectValue(agent, `agents[${index}]`).id, `agents[${index}].id`));
    done();
  } catch (error) {
    fail(error instanceof Error ? error.message : "invalid support discovery response", done);
  }
}

function verifyCreatedClaimSlot(request, response, context, _events, done) {
  try {
    const data = parseApiResponse(request, response, 201);
    const slot = objectValue(data.slot, "response.data.slot");
    idValue(slot.id, "slot.id");
    if (slot.teamId !== context.vars.supportTeamId) throw new Error("created slot belongs to an unexpected team");
    if (slot.startsAt !== context.vars.claimStartsAt || slot.endsAt !== context.vars.claimEndsAt) {
      throw new Error("created slot interval differs from the controlled interval");
    }
    if (slot.capacity !== 1 || slot.status !== "OPEN") throw new Error("created slot must be OPEN with capacity 1");
    done();
  } catch (error) {
    fail(error instanceof Error ? error.message : "invalid claim slot response", done);
  }
}

function verifyClaimBurstResponse(request, response, context, _events, done) {
  try {
    const data = parseApiResponse(request, response, 200);
    const claim = objectValue(data.claim, "response.data.claim");
    idValue(claim.id, "claim.id");
    if (claim.slotId !== context.vars.claimSlotId) throw new Error("claim references an unexpected slot");
    if (claim.userId !== context.vars.supportUserId) throw new Error("claim references an unexpected user");
    if (claim.status !== "PENDING") throw new Error(`claim status must be PENDING, received ${claim.status}`);
    if (claim.occurrenceId !== null || data.occurrence !== null) {
      throw new Error("manager-approved seed policy must not create an occurrence during claim");
    }
    if (typeof data.idempotent !== "boolean") throw new Error("claim idempotent marker must be boolean");
    done();
  } catch (error) {
    fail(error instanceof Error ? error.message : "invalid claim burst response", done);
  }
}

function verifyClaimBurstReadback(request, response, context, _events, done) {
  try {
    const data = parseApiResponse(request, response, 200);
    if (data.scope !== "TEAM" || data.teamId !== context.vars.supportTeamId) {
      throw new Error("claim readback returned an unexpected calendar scope");
    }
    const slots = arrayValue(data.extraSlots, "response.data.extraSlots");
    const slot = slots.find((item) => item && item.id === context.vars.claimSlotId);
    if (!slot) throw new Error("created claim slot was not returned by calendar readback");
    const claims = arrayValue(slot.claims, "claim slot claims");
    const userClaims = claims.filter((claim) => claim && claim.userId === context.vars.supportUserId);
    if (userClaims.length !== 1) throw new Error(`expected exactly one persisted claim, received ${userClaims.length}`);
    const claim = objectValue(userClaims[0], "persisted claim");
    idValue(claim.id, "persisted claim.id");
    if (claim.status !== "PENDING" || claim.occurrenceId !== null) {
      throw new Error("persisted claim must remain PENDING without an occurrence");
    }
    validateUnique(claims.map((item, index) => idValue(objectValue(item, `claims[${index}]`).id, `claims[${index}].id`)), "claim ids");
    done();
  } catch (error) {
    fail(error instanceof Error ? error.message : "invalid claim burst readback", done);
  }
}

function verifyCoverageRead(request, response, context, _events, done) {
  try {
    const data = parseApiResponse(request, response, 200);
    if (data.selectedTeamId !== context.vars.supportTeamId) throw new Error("coverage response selected an unexpected team");
    if (!ISO_LOCAL_DATE.test(data.date || "")) throw new Error("coverage response date must use YYYY-MM-DD");
    if (!new Set(["PUBLISHED_SCHEDULE", "LEGACY_MEMBERSHIP"]).has(data.coverageSource)) {
      throw new Error(`unexpected coverageSource ${data.coverageSource}`);
    }
    if (data.coverageSource === "PUBLISHED_SCHEDULE" && data.membershipMode !== "PUBLISHED_SCHEDULE") {
      throw new Error("published coverage must use PUBLISHED_SCHEDULE membershipMode");
    }
    const policy = objectValue(data.policy, "response.data.policy");
    const minimumCoverage = integerValue(policy.minimumCoverage, "policy.minimumCoverage", 1);
    const slotMinutes = integerValue(policy.slotMinutes, "policy.slotMinutes", 1);
    const agents = arrayValue(data.agents, "response.data.agents");
    const slots = arrayValue(data.slots, "response.data.slots");
    const timeline = arrayValue(data.timeline, "response.data.timeline");
    const summary = objectValue(data.summary, "response.data.summary");
    if (summary.activeAgents !== agents.length) throw new Error("summary.activeAgents differs from agents.length");
    if (summary.minimumCoverage !== minimumCoverage) throw new Error("summary.minimumCoverage differs from policy");
    const bookedPauses = slots.reduce((total, value, index) => {
      const slot = objectValue(value, `slots[${index}]`);
      const bookings = arrayValue(slot.bookings, `slots[${index}].bookings`);
      if (slot.bookedCount !== bookings.length) throw new Error(`slots[${index}].bookedCount differs from bookings.length`);
      if (slot.remainingCapacity !== Math.max(slot.capacity - bookings.length, 0)) {
        throw new Error(`slots[${index}].remainingCapacity is inconsistent`);
      }
      return total + bookings.length;
    }, 0);
    if (summary.bookedPauses !== bookedPauses) throw new Error("summary.bookedPauses differs from slot bookings");
    let criticalIntervals = 0;
    let previousEnd = null;
    timeline.forEach((value, index) => {
      const interval = objectValue(value, `timeline[${index}]`);
      const startsAt = new Date(interval.startsAt);
      const endsAt = new Date(interval.endsAt);
      if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime()) || startsAt >= endsAt) {
        throw new Error(`timeline[${index}] has an invalid interval`);
      }
      if (previousEnd !== null && startsAt.getTime() !== previousEnd) throw new Error("coverage timeline must be contiguous");
      if (endsAt.getTime() - startsAt.getTime() > slotMinutes * 60_000) throw new Error(`timeline[${index}] exceeds slotMinutes`);
      previousEnd = endsAt.getTime();
      const active = integerValue(interval.activeCount, `timeline[${index}].activeCount`);
      const paused = integerValue(interval.pausedCount, `timeline[${index}].pausedCount`);
      const available = integerValue(interval.availableCount, `timeline[${index}].availableCount`);
      if (paused > active || available !== active - paused) throw new Error(`timeline[${index}] coverage arithmetic is inconsistent`);
      const critical = available < minimumCoverage;
      if (interval.critical !== critical) throw new Error(`timeline[${index}].critical is inconsistent`);
      if (critical) criticalIntervals += 1;
    });
    if (summary.criticalIntervals !== criticalIntervals) throw new Error("summary.criticalIntervals differs from timeline");
    done();
  } catch (error) {
    fail(error instanceof Error ? error.message : "invalid coverage response", done);
  }
}

function verifyCreatedRecurrenceSeries(request, response, context, _events, done) {
  try {
    const data = parseApiResponse(request, response, 201);
    const series = objectValue(data.series, "response.data.series");
    const version = objectValue(data.version, "response.data.version");
    idValue(series.id, "series.id");
    idValue(version.id, "version.id");
    if (series.slug !== context.vars.recurrenceSlug || series.status !== "ACTIVE") {
      throw new Error("created recurrence series has unexpected identity or status");
    }
    if (version.seriesId !== series.id || version.effectiveFromDate !== context.vars.recurrenceFrom) {
      throw new Error("created recurrence version has unexpected scope or effective date");
    }
    if (JSON.stringify(version.recurrenceDays) !== JSON.stringify([14, 29])) {
      throw new Error("created recurrence version must use days 14 and 29");
    }
    done();
  } catch (error) {
    fail(error instanceof Error ? error.message : "invalid recurrence series response", done);
  }
}

function verifyRecurrenceMaterialization(request, response, context, _events, done) {
  try {
    const data = parseApiResponse(request, response, 200);
    integerValue(data.series, "materialization.series", 1);
    const candidates = arrayValue(data.candidates, "materialization.candidates");
    const created = arrayValue(data.created, "materialization.created");
    const skipped = arrayValue(data.skipped, "materialization.skipped");
    const stale = arrayValue(data.staleCandidates, "materialization.staleCandidates");
    const expectedDates = [context.vars.recurrenceDay14, context.vars.recurrenceDay29];
    const testCandidates = candidates.filter((candidate) => candidate && candidate.seriesId === context.vars.recurrenceSeriesId);
    const candidateDates = testCandidates.map((candidate) => candidate.localDate).sort();
    if (JSON.stringify(candidateDates) !== JSON.stringify(expectedDates)) {
      throw new Error(`expected recurrence candidates ${expectedDates.join(",")}, received ${candidateDates.join(",")}`);
    }
    testCandidates.forEach((candidate, index) => {
      if (candidate.versionId !== context.vars.recurrenceVersionId) throw new Error(`candidate[${index}] uses an unexpected version`);
      if (Number.isNaN(new Date(candidate.scheduledFor).getTime())) throw new Error(`candidate[${index}] has invalid scheduledFor`);
    });
    validateUnique(candidates.map((candidate) => `${candidate.seriesId}:${candidate.versionId}:${candidate.localDate}`), "candidate keys");
    validateUnique(created, "created occurrence ids");
    validateUnique(skipped, "skipped occurrence ids");
    if (created.some((id) => skipped.includes(id))) throw new Error("an occurrence cannot be both created and skipped");
    if (stale.some((candidate) => candidate && candidate.seriesId === context.vars.recurrenceSeriesId)) {
      throw new Error("controlled recurrence produced a stale candidate");
    }
    const expiration = objectValue(data.expiration, "materialization.expiration");
    const publication = objectValue(data.publication, "materialization.publication");
    arrayValue(expiration.expired, "materialization.expiration.expired");
    if (publication.due !== 0 || arrayValue(publication.published, "materialization.publication.published").length !== 0) {
      throw new Error("publishDue=false must not publish occurrences");
    }
    if (arrayValue(publication.failed, "materialization.publication.failed").length !== 0) {
      throw new Error("controlled recurrence materialization reported publication failures");
    }
    if (data.dryRun !== false) throw new Error("recurrence probe must persist its controlled occurrences");
    done();
  } catch (error) {
    fail(error instanceof Error ? error.message : "invalid recurrence materialization response", done);
  }
}

function verifyRecurrenceReadback(request, response, context, _events, done) {
  try {
    const data = parseApiResponse(request, response, 200);
    const items = arrayValue(data.items, "response.data.items");
    if (data.total !== items.length) throw new Error("series total differs from items.length");
    const series = items.find((item) => item && item.id === context.vars.recurrenceSeriesId);
    if (!series) throw new Error("controlled recurrence series was not returned");
    if (series.status !== "ACTIVE") throw new Error("controlled recurrence series must remain ACTIVE before cleanup");
    const occurrences = arrayValue(series.occurrences, "controlled series occurrences");
    if (occurrences.length !== 2) throw new Error(`expected two recurrence occurrences, received ${occurrences.length}`);
    validateUnique(occurrences.map((item) => item.id), "recurrence occurrence ids");
    validateUnique(occurrences.map((item) => item.idempotencyKey), "recurrence idempotency keys");
    validateUnique(occurrences.map((item) => item.announcementId), "recurrence announcement ids");
    const dates = occurrences.map((item) => item.localDate).sort();
    const expectedDates = [context.vars.recurrenceDay14, context.vars.recurrenceDay29];
    if (JSON.stringify(dates) !== JSON.stringify(expectedDates)) {
      throw new Error(`persisted recurrence dates differ from ${expectedDates.join(",")}`);
    }
    occurrences.forEach((value, index) => {
      const occurrence = objectValue(value, `occurrences[${index}]`);
      if (occurrence.versionId !== context.vars.recurrenceVersionId) throw new Error(`occurrences[${index}] uses an unexpected version`);
      const expectedKey = `${context.vars.recurrenceSeriesId}:${context.vars.recurrenceVersionId}:${occurrence.localDate}`;
      if (occurrence.idempotencyKey !== expectedKey) throw new Error(`occurrences[${index}] has an unexpected idempotency key`);
      if (occurrence.status !== "SCHEDULED") throw new Error(`occurrences[${index}] must remain SCHEDULED`);
      const announcement = objectValue(occurrence.announcement, `occurrences[${index}].announcement`);
      if (announcement.id !== occurrence.announcementId || announcement.status !== "SCHEDULED") {
        throw new Error(`occurrences[${index}] announcement is inconsistent`);
      }
    });
    done();
  } catch (error) {
    fail(error instanceof Error ? error.message : "invalid recurrence readback", done);
  }
}

function verifyArchivedRecurrenceSeries(request, response, context, _events, done) {
  try {
    const data = parseApiResponse(request, response, 200);
    const series = objectValue(data.series, "response.data.series");
    if (series.id !== context.vars.recurrenceSeriesId || series.status !== "ARCHIVED") {
      throw new Error("recurrence cleanup did not archive the controlled series");
    }
    if (data.cancelledOccurrences !== 2) {
      throw new Error(`recurrence cleanup must cancel two occurrences, received ${data.cancelledOccurrences}`);
    }
    done();
  } catch (error) {
    fail(error instanceof Error ? error.message : "invalid recurrence cleanup response", done);
  }
}

module.exports = {
  ensure2xx,
  prepareClaimBurstScenario,
  prepareCoverageReadScenario,
  prepareMaterializationScenario,
  prepareReadScenario,
  prepareRecurrenceScenario,
  verifyArchivedRecurrenceSeries,
  verifyClaimBurstReadback,
  verifyClaimBurstResponse,
  verifyCoverageRead,
  verifyCreatedClaimSlot,
  verifyCreatedRecurrenceSeries,
  verifyIdempotentMaterialization,
  verifyRecurrenceMaterialization,
  verifyRecurrenceReadback,
  verifySupportDiscovery
};
