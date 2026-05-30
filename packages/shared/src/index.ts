export const userRoles = ["ADMIN", "SAC", "FINANCEIRO", "VENDEDOR", "SUPERVISOR", "GESTOR", "RT"] as const;
export type UserRole = (typeof userRoles)[number];

export const commercialUserRoles = ["ADMIN", "SAC", "FINANCEIRO", "VENDEDOR", "SUPERVISOR", "GESTOR"] as const;
export type CommercialUserRole = (typeof commercialUserRoles)[number];

export const licenseStatuses = [
  "REGULAR",
  "EXPIRING",
  "EXPIRED",
  "PENDING_DOCUMENT",
  "PENDING_VALIDATION",
  "INACTIVE"
] as const;
export type LicenseStatus = (typeof licenseStatuses)[number];

export const documentStatuses = ["UPLOADED", "APPROVED", "REJECTED", "ARCHIVED"] as const;
export type DocumentStatus = (typeof documentStatuses)[number];

export const salesDocumentStatuses = ["UPLOADED", "EXTRACTING", "PENDING_REVIEW", "APPROVED", "REJECTED", "DUPLICATE"] as const;
export type SalesDocumentStatus = (typeof salesDocumentStatuses)[number];

export const campaignStatuses = ["DRAFT", "ACTIVE", "PAUSED", "CLOSED"] as const;
export type CampaignStatus = (typeof campaignStatuses)[number];

export const notificationStatuses = [
  "PENDING",
  "PROCESSING",
  "SENT",
  "DELIVERED",
  "READ",
  "FAILED",
  "CANCELLED",
  "SKIPPED"
] as const;
export type NotificationStatus = (typeof notificationStatuses)[number];

export const notificationChannels = ["WHATSAPP", "DASHBOARD", "EMAIL"] as const;
export type NotificationChannel = (typeof notificationChannels)[number];

export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: string; message: string } };

export interface CurrentUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  organizationId: string;
  unitScopeIds: string[];
  sectorScopeIds: string[];
}
