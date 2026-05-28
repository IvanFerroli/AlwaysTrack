import type { LicenseStatus } from "@alwaystrack/shared";

export interface LicenseStatusDocument {
  status: string;
}

export interface LicenseStatusRule {
  active: boolean;
  daysBeforeExpiration: number | null;
}

export interface LicenseStatusInput {
  currentStatus?: string | null;
  expiresAt?: Date | string | null;
  defaultWarningDays?: string | null;
  documents?: LicenseStatusDocument[];
  notificationRules?: LicenseStatusRule[];
  today?: Date;
}

function startOfUtcDay(date: Date) {
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

export function parseWarningDays(defaultWarningDays?: string | null, notificationRules: LicenseStatusRule[] = []) {
  const fromType =
    defaultWarningDays
      ?.split(",")
      .map((item) => Number.parseInt(item.trim(), 10))
      .filter((item) => Number.isInteger(item) && item > 0) ?? [];
  const fromRules = notificationRules
    .filter((rule) => rule.active)
    .map((rule) => rule.daysBeforeExpiration)
    .filter((item): item is number => typeof item === "number" && item > 0);
  const values = [...fromType, ...fromRules];
  return values.length ? Math.max(...values) : 30;
}

export function calculateLicenseStatus(input: LicenseStatusInput): LicenseStatus {
  if (input.currentStatus === "INACTIVE") {
    return "INACTIVE";
  }

  const documents = input.documents ?? [];
  if (documents.some((document) => document.status === "UPLOADED")) {
    return "PENDING_VALIDATION";
  }

  if (!documents.some((document) => document.status === "APPROVED")) {
    return "PENDING_DOCUMENT";
  }

  if (!input.expiresAt) {
    return "REGULAR";
  }

  const expiresAt = input.expiresAt instanceof Date ? input.expiresAt : new Date(input.expiresAt);
  if (Number.isNaN(expiresAt.getTime())) {
    return "REGULAR";
  }

  const today = input.today ?? new Date();
  const daysUntilExpiration = Math.ceil((startOfUtcDay(expiresAt) - startOfUtcDay(today)) / 86_400_000);
  if (daysUntilExpiration < 0) {
    return "EXPIRED";
  }

  const warningDays = parseWarningDays(input.defaultWarningDays, input.notificationRules);
  return daysUntilExpiration <= warningDays ? "EXPIRING" : "REGULAR";
}
