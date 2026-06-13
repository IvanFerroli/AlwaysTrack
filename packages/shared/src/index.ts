export const userRoles = ["ADMIN", "SAC", "FINANCEIRO", "VENDEDOR", "SUPERVISOR", "GESTOR", "RT"] as const;
export type UserRole = (typeof userRoles)[number];

export const commercialUserRoles = ["ADMIN", "SAC", "FINANCEIRO", "VENDEDOR", "SUPERVISOR", "GESTOR"] as const;
export type CommercialUserRole = (typeof commercialUserRoles)[number];

export const adminOnlyRoles = ["ADMIN"] as const satisfies readonly UserRole[];
export const commercialAllRoles = ["ADMIN", "GESTOR", "SAC", "FINANCEIRO", "VENDEDOR", "SUPERVISOR"] as const satisfies readonly UserRole[];
export const commercialManagerRoles = ["ADMIN", "GESTOR", "SUPERVISOR"] as const satisfies readonly UserRole[];
export const commercialReviewerRoles = ["ADMIN", "GESTOR", "SAC", "FINANCEIRO"] as const satisfies readonly UserRole[];
export const commercialKnowledgeContributorRoles = ["GESTOR", "SAC", "FINANCEIRO", "VENDEDOR", "SUPERVISOR"] as const satisfies readonly UserRole[];

export const commercialPermissionMatrix = {
  "sales.read": commercialAllRoles,
  "sales.upload": commercialAllRoles,
  "sales.review": commercialReviewerRoles,
  "campaign.read": commercialAllRoles,
  "campaign.manage": commercialManagerRoles,
  "ranking.read": ["ADMIN", "GESTOR", "VENDEDOR", "SUPERVISOR"] as const satisfies readonly UserRole[],
  "ranking.filterSeller": commercialManagerRoles,
  "statements.read": commercialAllRoles,
  "knowledge.read": commercialAllRoles,
  "knowledge.contribute": commercialKnowledgeContributorRoles,
  "knowledge.publish": adminOnlyRoles,
  "faq.moderate": commercialManagerRoles,
  "announcements.read": commercialAllRoles,
  "announcements.manage": commercialManagerRoles,
  "scriptLibrary.read": commercialAllRoles,
  "scriptLibrary.manage": commercialManagerRoles,
  "scriptLibrary.copy": commercialAllRoles,
  "users.manage": adminOnlyRoles,
  "audit.read": adminOnlyRoles,
  "profile.manageSelf": commercialAllRoles,
  "notifications.readSelf": commercialAllRoles
} as const;

export type CommercialPermission = keyof typeof commercialPermissionMatrix;

export function canUseCommercialPermission(role: UserRole, permission: CommercialPermission) {
  return (commercialPermissionMatrix[permission] as readonly UserRole[]).includes(role);
}

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
  avatarUrl?: string | null;
  role: UserRole;
  organizationId: string;
  unitScopeIds: string[];
  sectorScopeIds: string[];
}
