export const userRoles = ["ADMIN", "SAC", "FINANCEIRO", "VENDEDOR", "SUPERVISOR", "GESTOR", "RT"] as const;
export * from "./case-flow/index.js";
export * from "./connectors/index.js";
export * from "./companion/index.js";
export type UserRole = (typeof userRoles)[number];

export const commercialUserRoles = ["ADMIN", "SAC", "FINANCEIRO", "VENDEDOR", "SUPERVISOR", "GESTOR"] as const;
export type CommercialUserRole = (typeof commercialUserRoles)[number];

export const adminOnlyRoles = ["ADMIN"] as const satisfies readonly UserRole[];
export const commercialAllRoles = ["ADMIN", "GESTOR", "SAC", "FINANCEIRO", "VENDEDOR", "SUPERVISOR"] as const satisfies readonly UserRole[];
export const commercialSalesAccessRoles = ["ADMIN", "GESTOR", "FINANCEIRO", "VENDEDOR", "SUPERVISOR"] as const satisfies readonly UserRole[];
export const commercialManagerRoles = ["ADMIN", "GESTOR"] as const satisfies readonly UserRole[];
export const commercialReviewerRoles = ["ADMIN", "GESTOR", "FINANCEIRO"] as const satisfies readonly UserRole[];
export const commercialMonitorRoles = ["ADMIN", "GESTOR", "SUPERVISOR", "FINANCEIRO"] as const satisfies readonly UserRole[];
export const commercialKnowledgeContributorRoles = ["GESTOR", "SAC", "FINANCEIRO", "VENDEDOR", "SUPERVISOR"] as const satisfies readonly UserRole[];
export const commercialKnowledgeGovernorRoles = ["ADMIN", "GESTOR", "SUPERVISOR"] as const satisfies readonly UserRole[];

export const commercialPermissionMatrix = {
  "sales.read": commercialSalesAccessRoles,
  "sales.upload": commercialSalesAccessRoles,
  "sales.review": commercialReviewerRoles,
  "campaign.read": commercialSalesAccessRoles,
  "campaign.manage": commercialManagerRoles,
  "ranking.read": ["ADMIN", "GESTOR", "VENDEDOR", "SUPERVISOR"] as const satisfies readonly UserRole[],
  "ranking.filterSeller": commercialManagerRoles,
  "statements.read": commercialSalesAccessRoles,
  "knowledge.read": commercialAllRoles,
  "knowledge.contribute": commercialKnowledgeContributorRoles,
  "knowledge.publish": adminOnlyRoles,
  "faq.moderate": commercialKnowledgeGovernorRoles,
  "announcements.read": commercialAllRoles,
  "announcements.manage": commercialManagerRoles,
  "scriptLibrary.read": commercialAllRoles,
  "scriptLibrary.manage": commercialManagerRoles,
  "scriptLibrary.copy": commercialAllRoles,
  "scriptLibrary.smartscript": commercialAllRoles,
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

export const smartScriptVisibleStates = ["IN_USE", "GENERATED_TODAY", "IN_REVIEW"] as const;
export type SmartScriptVisibleState = (typeof smartScriptVisibleStates)[number];

export const smartScriptVisibleStateLabels = {
  IN_USE: "Em uso",
  GENERATED_TODAY: "Gerados hoje",
  IN_REVIEW: "Em revisão"
} as const satisfies Record<SmartScriptVisibleState, string>;

export const smartScriptDecisionActions = ["IMPORT", "APPROVE", "REJECT", "EDIT", "REVIEW", "EXPORT", "USE", "SUGGEST_CANONICAL"] as const;
export type SmartScriptDecisionAction = (typeof smartScriptDecisionActions)[number];

export const smartScriptDecisionSources = ["BUTTON", "NUMBERED_REVIEW", "COMPANION", "SYSTEM"] as const;
export type SmartScriptDecisionSource = (typeof smartScriptDecisionSources)[number];

export interface SmartScriptCandidatePayload {
  title: string;
  body: string;
  trigger?: string | null;
  channel?: string | null;
  tags?: string[];
  source?: string | null;
  occurrenceCount?: number | null;
}

export interface SmartScriptImportPayload {
  batchId?: string | null;
  processedAt?: string | null;
  candidates: SmartScriptCandidatePayload[];
}

export interface SmartScriptDecisionPayload {
  action: Exclude<SmartScriptDecisionAction, "IMPORT" | "EXPORT" | "USE" | "SUGGEST_CANONICAL">;
  source?: SmartScriptDecisionSource;
  title?: string;
  body?: string;
  trigger?: string | null;
  channel?: string | null;
  tags?: string[];
}

export interface SmartScriptSanitizationResult {
  text: string;
  changed: boolean;
  markers: string[];
}

const sensitivePatterns: Array<[RegExp, string, string]> = [
  [/\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/g, "{cpf_cliente}", "cpf"],
  [/\b(?:\+?55\s?)?(?:\(?\d{2}\)?\s?)?(?:9\s?)?\d{4}[-\s]?\d{4}\b/g, "{telefone_cliente}", "telefone"],
  [/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, "{email_cliente}", "email"],
  [/\b(?:pedido|ped\.?|ordem|order)\s*#?\s*\d{4,}\b/gi, "pedido {numero_pedido}", "pedido"],
  [/\b[A-Z]{2}\d{9}[A-Z]{2}\b/g, "{codigo_rastreio}", "rastreio"],
  [/\b(?:rua|avenida|av\.|travessa|alameda|rodovia)\s+[^\n,]{3,80},?\s+\d{1,6}\b/gi, "{endereco_cliente}", "endereco"],
  [/https?:\/\/(?:[^\s/]+\.)?(?:drive|docs|dropbox|onedrive|wa\.me|api\.whatsapp|mercadopago|pagseguro)[^\s)]+/gi, "{link_sensivel}", "link_sensivel"],
  [/\bR\$\s?\d{1,3}(?:\.\d{3})*,\d{2}\b/g, "{valor}", "valor"],
  [/\b(?:cliente|consumidor(?:a)?|comprador(?:a)?)\s+[A-ZÁÉÍÓÚÂÊÔÃÕÇ][a-záéíóúâêôãõç]+(?:\s+[A-ZÁÉÍÓÚÂÊÔÃÕÇ][a-záéíóúâêôãõç]+){1,3}\b/g, "cliente {nome_cliente}", "nome_cliente"]
];

export function sanitizeSmartScriptText(input: string): SmartScriptSanitizationResult {
  let text = input.replace(/\r\n/g, "\n").replace(/[ \t]+/g, " ").trim();
  const markers = new Set<string>();
  for (const [pattern, replacement, marker] of sensitivePatterns) {
    text = text.replace(pattern, () => {
      markers.add(marker);
      return replacement;
    });
  }
  text = text.replace(/\n{3,}/g, "\n\n").trim();
  return { text, changed: text !== input.trim(), markers: [...markers].sort((left, right) => left.localeCompare(right)) };
}

export function validateSmartScriptTrigger(trigger: string | null | undefined) {
  const normalized = trigger?.trim().toLowerCase() ?? "";
  if (!normalized) return { ok: false as const, trigger: "", reason: "MISSING_TRIGGER" };
  if (normalized.startsWith("/")) return { ok: false as const, trigger: normalized, reason: "SLASH_RESERVED" };
  if (!normalized.startsWith(":")) return { ok: false as const, trigger: normalized, reason: "COLON_REQUIRED" };
  if (!/^:[a-z0-9][a-z0-9-]{1,48}$/.test(normalized)) return { ok: false as const, trigger: normalized, reason: "INVALID_FORMAT" };
  return { ok: true as const, trigger: normalized };
}
