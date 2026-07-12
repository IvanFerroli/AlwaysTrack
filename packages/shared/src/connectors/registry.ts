import type { ActionRisk, AllowedActionCapability, ForbiddenActionCapability } from "../case-flow/action-capabilities.js";
import { actionPolicyFor } from "../case-flow/action-capabilities.js";
import type { ConnectorId, NormalizedEvidenceKey } from "../case-flow/evidence.js";
import { connectorId } from "../case-flow/evidence.js";
import type { SanitizedConnectorFixture, SelectorPolicy } from "./selectors.js";

export interface ConnectorDefinition {
  id: ConnectorId;
  version: string;
  displayName: string;
  domains: readonly string[];
  riskLevel: ActionRisk;
  capabilities: readonly AllowedActionCapability[];
  forbiddenCapabilities: readonly ForbiddenActionCapability[];
  searchKeys: readonly NormalizedEvidenceKey[];
  extractedFields: readonly NormalizedEvidenceKey[];
  selectorPolicy: SelectorPolicy;
  fixtures: readonly SanitizedConnectorFixture[];
  lastValidatedAt: string;
  policy?: string;
}

const selectors = (version: string, signals: string[]): SelectorPolicy => ({
  version, primary: [{ key: "search", strategy: "ARIA_LABEL", value: "search" }],
  fallback: [{ key: "result", strategy: "TEXT", value: "result" }],
  unexpectedPageSignals: signals, lastValidatedAt: "2026-07-11"
});
const fixture = (id: string, file: string, scenarios: string[]): SanitizedConnectorFixture => ({ id, connectorVersion: "1.0.0", file, sanitized: true, expectedPageKind: "SEARCH_RESULT", scenarios });
const readOnly = ["OPEN_TAB", "FOCUS_TAB", "NAVIGATE", "SEARCH", "READ", "EXTRACT"] as const;
const commonForbidden = ["SUBMIT", "CHANGE_STATUS", "CHANGE_ADDRESS"] as const;

export const connectorDefinitions = [
  { id: connectorId("yampi"), version: "1.0.0", displayName: "Yampi", domains: ["app.yampi.example"], riskLevel: "HIGH", capabilities: readOnly, forbiddenCapabilities: [...commonForbidden, "OPEN_BOLETO", "TRIGGER_RECOVERY", "CHANGE_PAYMENT"], searchKeys: ["customer.name", "customer.cpf", "customer.email", "order.yampiId"], extractedFields: ["order.products", "order.quantities", "order.total", "order.shipping", "order.coupon", "order.cashback", "order.upsell", "payment.cardholder", "payment.installments", "payment.transactionIds", "payment.status", "payment.boleto"], selectorPolicy: selectors("1.0.0", ["login", "unexpected"]), fixtures: [fixture("yampi-empty", "yampi/fixtures/result-empty.sanitized.json", ["EMPTY"]), fixture("yampi-multiple", "yampi/fixtures/result-multiple.sanitized.json", ["MULTIPLE"])], lastValidatedAt: "2026-07-11" },
  { id: connectorId("omie-filial"), version: "1.0.0", displayName: "OMIE Filial", domains: ["app.omie.example"], riskLevel: "HIGH", capabilities: readOnly, forbiddenCapabilities: [...commonForbidden, "MOVE_OMIE_STATUS"], searchKeys: ["order.omieId", "order.primaryId"], extractedFields: ["order.omieId", "order.products", "order.quantities", "order.total", "order.address", "order.status", "invoice.number", "invoice.danfeAvailable", "invoice.products", "invoice.total"], selectorPolicy: selectors("1.0.0", ["unexpected", "status changed"]), fixtures: [fixture("omie-filial", "omie/fixtures/filial.sanitized.json", ["FOUND"]), fixture("omie-unexpected", "omie/fixtures/unexpected-page.sanitized.json", ["UNEXPECTED_PAGE"])], lastValidatedAt: "2026-07-11", policy: "FILIAL_READ_ONLY" },
  { id: connectorId("omie-pharma"), version: "1.0.0", displayName: "OMIE Matriz/Pharma", domains: ["app.omie.example"], riskLevel: "CRITICAL", capabilities: readOnly, forbiddenCapabilities: [...commonForbidden, "MOVE_OMIE_STATUS", "CHANGE_PAYMENT", "CANCEL_ORDER"], searchKeys: ["order.omieId", "order.primaryId"], extractedFields: ["order.omieId", "order.products", "order.quantities", "order.status", "customer.name"], selectorPolicy: selectors("1.0.0", ["unexpected", "status changed"]), fixtures: [fixture("omie-pharma", "omie/fixtures/pharma.sanitized.json", ["FOUND"])], lastValidatedAt: "2026-07-11", policy: "PHARMA_STRICT_READ_ONLY" },
  { id: connectorId("loggi"), version: "1.0.0", displayName: "Loggi", domains: ["portal.loggi.example"], riskLevel: "MEDIUM", capabilities: readOnly, forbiddenCapabilities: [...commonForbidden, "OPEN_ACAREACAO"], searchKeys: ["customer.cpf", "logistics.trackingCode"], extractedFields: ["logistics.events", "order.address", "logistics.receiver", "logistics.proof", "logistics.returnState", "logistics.status"], selectorPolicy: selectors("1.0.0", ["login", "unexpected"]), fixtures: [fixture("loggi-empty", "loggi/fixtures/result-empty.sanitized.json", ["EMPTY"]), fixture("loggi-multiple", "loggi/fixtures/result-multiple.sanitized.json", ["MULTIPLE"]), fixture("loggi-timeout", "loggi/fixtures/timeout.sanitized.json", ["TIMEOUT"])], lastValidatedAt: "2026-07-11" },
  { id: connectorId("jt-vip"), version: "1.0.0", displayName: "J&T VIP", domains: ["vip.jt.example"], riskLevel: "HIGH", capabilities: readOnly, forbiddenCapabilities: [...commonForbidden, "OPEN_TICKET", "OPEN_ACAREACAO"], searchKeys: ["logistics.trackingCode", "treatment.workOrders", "treatment.openTickets"], extractedFields: ["logistics.events", "logistics.retries", "logistics.deliveredAt", "treatment.workOrders", "treatment.openTickets"], selectorPolicy: selectors("1.0.0", ["login", "captcha", "unexpected"]), fixtures: [fixture("jt-login", "jt-vip/fixtures/login.sanitized.json", ["LOGIN"]), fixture("jt-captcha", "jt-vip/fixtures/captcha.sanitized.json", ["CAPTCHA"]), fixture("jt-empty", "jt-vip/fixtures/result-empty.sanitized.json", ["EMPTY"]), fixture("jt-multiple", "jt-vip/fixtures/result-multiple.sanitized.json", ["MULTIPLE"]), fixture("jt-timeout", "jt-vip/fixtures/timeout.sanitized.json", ["TIMEOUT"])], lastValidatedAt: "2026-07-11" },
  { id: connectorId("correios-reversa"), version: "1.0.0", displayName: "Correios/Reversa", domains: ["reversa.correios.example"], riskLevel: "MEDIUM", capabilities: readOnly, forbiddenCapabilities: [...commonForbidden, "CREATE_REVERSE"], searchKeys: ["treatment.reverseCode", "logistics.trackingCode", "customer.name"], extractedFields: ["treatment.reverseCode", "treatment.reverseValidity", "logistics.trackingCode", "logistics.returnState"], selectorPolicy: selectors("1.0.0", ["login", "2fa", "unexpected"]), fixtures: [fixture("correios-login", "correios-reversa/fixtures/login.sanitized.json", ["LOGIN"]), fixture("correios-2fa", "correios-reversa/fixtures/2fa.sanitized.json", ["TWO_FACTOR"]), fixture("correios-empty", "correios-reversa/fixtures/result-empty.sanitized.json", ["EMPTY"]), fixture("correios-multiple", "correios-reversa/fixtures/result-multiple.sanitized.json", ["MULTIPLE"])], lastValidatedAt: "2026-07-11" },
  { id: connectorId("lancador-pedidos"), version: "1.0.0", displayName: "Lancador de Pedidos", domains: ["pedidos.example"], riskLevel: "CRITICAL", capabilities: readOnly, forbiddenCapabilities: [...commonForbidden, "CREATE_ORDER", "CONFIRM_ORDER", "CREATE_RESHIPMENT", "CHANGE_PAYMENT"], searchKeys: ["customer.cpf", "order.primaryId", "customer.email"], extractedFields: ["customer.name", "order.manualId", "order.products", "order.quantities", "order.address", "payment.method", "order.responsible"], selectorPolicy: selectors("1.0.0", ["login", "unexpected"]), fixtures: [fixture("lancador-empty", "lancador/fixtures/result-empty.sanitized.json", ["EMPTY"]), fixture("lancador-multiple", "lancador/fixtures/result-multiple.sanitized.json", ["MULTIPLE"])], lastValidatedAt: "2026-07-11", policy: "QUERY_ONLY_DRAFT_CONTRACT_SEPARATE" }
] as const satisfies readonly ConnectorDefinition[];

export function createConnectorRegistry(definitions: readonly ConnectorDefinition[] = connectorDefinitions) {
  const registry = new Map<string, ConnectorDefinition>();
  for (const definition of definitions) {
    if (registry.has(definition.id)) throw new Error(`Duplicate connector id: ${definition.id}`);
    if (!definition.domains.length || !definition.fixtures.length) throw new Error(`Connector ${definition.id} requires domains and fixtures`);
    for (const capability of definition.capabilities) if (actionPolicyFor(capability).disposition !== "ALLOWED") throw new Error(`Connector ${definition.id} has unsafe capability ${capability}`);
    for (const capability of definition.forbiddenCapabilities) if (actionPolicyFor(capability).disposition !== "FORBIDDEN") throw new Error(`Connector ${definition.id} has invalid forbidden capability ${capability}`);
    registry.set(definition.id, definition);
  }
  return registry;
}

export const connectorRegistry = createConnectorRegistry();
