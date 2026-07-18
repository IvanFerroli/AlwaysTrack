const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "0.0.0.0", "::1", "[::1]"]);
const LOCAL_TIMEZONE = "America/Sao_Paulo";
const ISO_LOCAL_DATE = /^\d{4}-\d{2}-\d{2}$/;

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

function prepareMaterializationScenario(context, _events, done) {
  try {
    setCommonVariables(context);
    if (process.env.NODE_ENV === "production") throw new Error("materialization is disabled when NODE_ENV=production");
    if (process.env.PERF_ALLOW_TEST_WRITES !== "true") {
      throw new Error("PERF_ALLOW_TEST_WRITES=true is required for materialization");
    }
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

function ensure2xx(request, response, _context, _events, done) {
  if (response.statusCode < 200 || response.statusCode >= 300) {
    return fail(`${request.method} ${request.url} returned HTTP ${response.statusCode}`, done);
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
      throw new Error(`${request.method} ${request.url} returned HTTP ${response.statusCode}`);
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

module.exports = {
  ensure2xx,
  prepareMaterializationScenario,
  prepareReadScenario,
  verifyIdempotentMaterialization
};
