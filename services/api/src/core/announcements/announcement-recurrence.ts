const LOCAL_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const LOCAL_TIME_PATTERN = /^(\d{2}):(\d{2})$/;

export interface RecurrenceVersionLike {
  id: string;
  version: number;
  effectiveFromDate: string;
  validFromDate: string;
  validToDate: string | null;
  recurrenceDaysJson: string;
}

export interface RecurrenceCandidate<TVersion extends RecurrenceVersionLike> {
  localDate: string;
  version: TVersion;
}

interface LocalDateParts {
  year: number;
  month: number;
  day: number;
}

interface LocalDateTimeParts extends LocalDateParts {
  hour: number;
  minute: number;
}

function localDateParts(value: string): LocalDateParts | null {
  const match = LOCAL_DATE_PATTERN.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const probe = new Date(Date.UTC(year, month - 1, day));
  if (probe.getUTCFullYear() !== year || probe.getUTCMonth() !== month - 1 || probe.getUTCDate() !== day) return null;
  return { year, month, day };
}

function localTimeParts(value: string): Pick<LocalDateTimeParts, "hour" | "minute"> | null {
  const match = LOCAL_TIME_PATTERN.exec(value);
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  return hour <= 23 && minute <= 59 ? { hour, minute } : null;
}

function padded(value: number) {
  return String(value).padStart(2, "0");
}

function dateFromParts(parts: LocalDateParts) {
  return `${String(parts.year).padStart(4, "0")}-${padded(parts.month)}-${padded(parts.day)}`;
}

function formatterFor(timezone: string) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23"
  });
}

function partsInTimezone(value: Date, timezone: string): LocalDateTimeParts & { second: number } {
  const values = Object.fromEntries(
    formatterFor(timezone)
      .formatToParts(value)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, Number(part.value)])
  );
  return {
    year: values.year,
    month: values.month,
    day: values.day,
    hour: values.hour,
    minute: values.minute,
    second: values.second
  };
}

function timezoneOffsetMs(value: Date, timezone: string) {
  const parts = partsInTimezone(value, timezone);
  const representedAsUtc = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
  return representedAsUtc - value.getTime();
}

export function isValidLocalDate(value: string) {
  return localDateParts(value) !== null;
}

export function isValidLocalTime(value: string) {
  return localTimeParts(value) !== null;
}

export function isValidIanaTimezone(value: string) {
  try {
    formatterFor(value).format(new Date(0));
    return true;
  } catch {
    return false;
  }
}

export function formatLocalDate(value: Date, timezone: string) {
  const parts = partsInTimezone(value, timezone);
  return dateFromParts(parts);
}

export function addLocalDays(localDate: string, days: number) {
  const parts = localDateParts(localDate);
  if (!parts) throw new Error("INVALID_LOCAL_DATE");
  const value = new Date(Date.UTC(parts.year, parts.month - 1, parts.day + days));
  return dateFromParts({ year: value.getUTCFullYear(), month: value.getUTCMonth() + 1, day: value.getUTCDate() });
}

export function monthlyOccurrenceLocalDates(year: number, month: number, days: readonly number[] = [14, 29]) {
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return [...new Set(days)]
    .filter((day) => Number.isInteger(day) && day >= 1 && day <= lastDay)
    .sort((left, right) => left - right)
    .map((day) => dateFromParts({ year, month, day }));
}

export function zonedLocalDateTimeToUtc(localDate: string, localTime: string, timezone: string) {
  const dateParts = localDateParts(localDate);
  const timeParts = localTimeParts(localTime);
  if (!dateParts || !timeParts || !isValidIanaTimezone(timezone)) throw new Error("INVALID_LOCAL_DATETIME");

  const localAsUtc = Date.UTC(dateParts.year, dateParts.month - 1, dateParts.day, timeParts.hour, timeParts.minute, 0);
  let instant = localAsUtc;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const next = localAsUtc - timezoneOffsetMs(new Date(instant), timezone);
    if (next === instant) break;
    instant = next;
  }

  const result = new Date(instant);
  const actual = partsInTimezone(result, timezone);
  if (
    actual.year !== dateParts.year ||
    actual.month !== dateParts.month ||
    actual.day !== dateParts.day ||
    actual.hour !== timeParts.hour ||
    actual.minute !== timeParts.minute
  ) {
    throw new Error("NONEXISTENT_LOCAL_DATETIME");
  }
  return result;
}

export function recurrenceDays(value: string) {
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!Array.isArray(parsed)) return [];
    return [...new Set(parsed.filter((day): day is number => Number.isInteger(day) && (day === 14 || day === 29)))].sort(
      (left, right) => left - right
    );
  } catch {
    return [];
  }
}

export function buildRecurrenceCandidates<TVersion extends RecurrenceVersionLike>(
  versions: TVersion[],
  fromDate: string,
  toDate: string
): RecurrenceCandidate<TVersion>[] {
  const from = localDateParts(fromDate);
  const to = localDateParts(toDate);
  if (!from || !to || fromDate > toDate) throw new Error("INVALID_LOCAL_DATE_RANGE");
  const orderedVersions = [...versions].sort(
    (left, right) => right.effectiveFromDate.localeCompare(left.effectiveFromDate) || right.version - left.version
  );
  const result: RecurrenceCandidate<TVersion>[] = [];

  let year = from.year;
  let month = from.month;
  while (year < to.year || (year === to.year && month <= to.month)) {
    for (const localDate of monthlyOccurrenceLocalDates(year, month)) {
      if (localDate < fromDate || localDate > toDate) continue;
      const version = orderedVersions.find(
        (candidate) =>
          candidate.effectiveFromDate <= localDate &&
          candidate.validFromDate <= localDate &&
          (!candidate.validToDate || candidate.validToDate >= localDate)
      );
      if (!version || !recurrenceDays(version.recurrenceDaysJson).includes(Number(localDate.slice(-2)))) continue;
      result.push({ localDate, version });
    }
    month += 1;
    if (month === 13) {
      year += 1;
      month = 1;
    }
  }
  return result;
}
