declare const connectorIdBrand: unique symbol;

// Connector ids remain extensible until the connector registry contract is finalized.
export type ConnectorId = string & { readonly [connectorIdBrand]: true };

export function connectorId(value: string): ConnectorId {
  const normalized = value.trim();
  if (!normalized) throw new Error("ConnectorId cannot be empty");
  return normalized as ConnectorId;
}

export const evidenceSourceKinds = ["ALWAYSCHAT", "MANUAL", "DERIVED"] as const;
export type EvidenceSourceKind = (typeof evidenceSourceKinds)[number];
export type EvidenceSourceSystem = ConnectorId | EvidenceSourceKind;

export const evidenceFreshnesses = ["FRESH", "STALE", "UNKNOWN"] as const;
export type EvidenceFreshness = (typeof evidenceFreshnesses)[number];

export const evidenceSensitivities = ["PUBLIC", "INTERNAL", "PII", "FINANCIAL"] as const;
export type EvidenceSensitivity = (typeof evidenceSensitivities)[number];

export const evidenceAcquisitionMethods = ["SCRAPED", "MANUAL", "DERIVED"] as const;
export type EvidenceAcquisition = (typeof evidenceAcquisitionMethods)[number];

export const minimumEvidenceKeys = [
  "customer.name",
  "customer.cpf",
  "customer.email",
  "customer.phone",
  "conversation.id",
  "conversation.url",
  "conversation.channel",
  "conversation.tags",
  "conversation.previousAgent",
  "conversation.intentText",
  "conversation.summarySeed",
  "order.primaryId",
  "order.yampiId",
  "order.omieId",
  "order.manualId",
  "order.createdAt",
  "order.source",
  "order.status",
  "order.products",
  "order.quantities",
  "order.total",
  "order.shipping",
  "order.discount",
  "order.coupon",
  "order.cashback",
  "order.upsell",
  "order.address",
  "order.responsible",
  "payment.status",
  "payment.method",
  "payment.installments",
  "payment.cardholder",
  "payment.transactionIds",
  "payment.boleto",
  "payment.pix",
  "payment.recoveryState",
  "invoice.number",
  "invoice.accessKey",
  "invoice.status",
  "invoice.danfeAvailable",
  "invoice.products",
  "invoice.total",
  "logistics.carrier",
  "logistics.trackingCode",
  "logistics.status",
  "logistics.forecast",
  "logistics.events",
  "logistics.deliveredAt",
  "logistics.receiver",
  "logistics.proof",
  "logistics.returnState",
  "logistics.retries",
  "logistics.reshipment",
  "treatment.openTickets",
  "treatment.acareacao",
  "treatment.workOrders",
  "treatment.reverseCode",
  "treatment.reverseValidity",
  "treatment.slackDraftNeeded",
  "risk.money",
  "risk.health",
  "risk.legal",
  "risk.fraud",
  "risk.dataMismatch",
  "risk.manualConfirmationRequired"
] as const;

export type EvidenceKey = (typeof minimumEvidenceKeys)[number];

declare const customEvidenceKeyBrand: unique symbol;
export type CustomEvidenceKey = string & { readonly [customEvidenceKeyBrand]: true };
export type NormalizedEvidenceKey = EvidenceKey | CustomEvidenceKey;

export function customEvidenceKey(value: string): CustomEvidenceKey {
  const normalized = value.trim().toLowerCase();
  if (!/^(?:custom|connector)\.[a-z0-9]+(?:\.[a-z0-9]+)+$/.test(normalized)) {
    throw new Error("Custom evidence keys must use custom.* or connector.* namespacing");
  }
  return normalized as CustomEvidenceKey;
}

export interface EvidenceFact<TValue = unknown, TNormalizedValue = unknown> {
  id: string;
  caseId: string;
  key: NormalizedEvidenceKey;
  value: TValue;
  normalizedValue: TNormalizedValue;
  sourceSystem: EvidenceSourceSystem;
  sourceReference?: string;
  observedAt: string;
  collectedAt: string;
  confidence: number;
  freshness: EvidenceFreshness;
  sensitivity: EvidenceSensitivity;
  acquisition: EvidenceAcquisition;
  connectorRunId?: string;
  ruleId?: string;
}
