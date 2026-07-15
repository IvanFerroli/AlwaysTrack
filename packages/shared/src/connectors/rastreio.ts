import type { EvidenceFact, EvidenceSensitivity, NormalizedEvidenceKey } from "../case-flow/evidence.js";
import { connectorId } from "../case-flow/evidence.js";
import type { ParserFactContext } from "./alwayschat.js";
import { connectorParserLimits } from "./parser.js";

type JsonObject = Record<string, unknown>;
export type RastreioSearchKey = "CPF" | "ORDER" | "EMAIL" | "PHONE";
export const rastreioSearchPriority = ["CPF", "ORDER", "EMAIL", "PHONE"] as const satisfies readonly RastreioSearchKey[];

export interface RastreioMovement { status: string; occurredAt: string; location?: string; details?: string }
export interface RastreioReshipment { orderId?: string; trackingCode?: string; createdAt?: string; status?: string }
export interface RastreioDelivery { deliveredAt: string; receiver?: string; proof?: string }
export interface RastreioOrder {
  id: string;
  createdAt?: string;
  status: string;
  forecast?: string;
  products: Array<{ name: string; quantity: number }>;
  payment?: { status?: string; method?: string };
  address?: string;
  carrier?: string;
  trackingCodes: string[];
  movements: RastreioMovement[];
  reshipments: RastreioReshipment[];
  delivery?: RastreioDelivery;
}
export type RastreioSearchResult =
  | { outcome: "NOT_FOUND_IN_SOURCE"; searchedBy: RastreioSearchKey; orders: [] }
  | { outcome: "FOUND"; searchedBy: RastreioSearchKey; orders: RastreioOrder[] };

function object(value: unknown, path: string): JsonObject {
  if (typeof value !== "object" || value === null || Array.isArray(value)) throw new TypeError(`${path} must be an object`);
  return value as JsonObject;
}
function string(value: unknown, path: string): string {
  if (typeof value !== "string" || !value.trim()) throw new TypeError(`${path} must be a non-empty string`);
  const trimmed = value.trim();
  if (trimmed.length > connectorParserLimits.maxStringLength) throw new TypeError(`${path} is too long`);
  return trimmed;
}
function optionalString(value: unknown, path: string) { return value === undefined || value === null || value === "" ? undefined : string(value, path); }
function array(value: unknown, path: string): unknown[] { if (!Array.isArray(value)) throw new TypeError(`${path} must be an array`); if (value.length > connectorParserLimits.maxCollectionItems) throw new TypeError(`${path} has too many items`); return value; }
function searchKey(value: unknown): RastreioSearchKey {
  const key = string(value, "searchedBy");
  if (key !== "CPF" && key !== "ORDER" && key !== "EMAIL" && key !== "PHONE") throw new TypeError("searchedBy is invalid");
  return key;
}

function parseOrder(value: unknown, path: string): RastreioOrder {
  const raw = object(value, path);
  return {
    id: string(raw.id, `${path}.id`), createdAt: optionalString(raw.createdAt, `${path}.createdAt`), status: string(raw.status, `${path}.status`), forecast: optionalString(raw.forecast, `${path}.forecast`),
    products: array(raw.products, `${path}.products`).map((item, index) => { const product = object(item, `${path}.products[${index}]`); if (typeof product.quantity !== "number" || !Number.isInteger(product.quantity) || product.quantity < 1) throw new TypeError(`${path}.products[${index}].quantity must be a positive integer`); return { name: string(product.name, `${path}.products[${index}].name`), quantity: product.quantity }; }),
    payment: raw.payment === undefined ? undefined : (() => { const payment = object(raw.payment, `${path}.payment`); return { status: optionalString(payment.status, `${path}.payment.status`), method: optionalString(payment.method, `${path}.payment.method`) }; })(),
    address: optionalString(raw.address, `${path}.address`), carrier: optionalString(raw.carrier, `${path}.carrier`),
    trackingCodes: array(raw.trackingCodes, `${path}.trackingCodes`).map((item, index) => string(item, `${path}.trackingCodes[${index}]`)),
    movements: array(raw.movements, `${path}.movements`).map((item, index) => { const movement = object(item, `${path}.movements[${index}]`); return { status: string(movement.status, `${path}.movements[${index}].status`), occurredAt: string(movement.occurredAt, `${path}.movements[${index}].occurredAt`), location: optionalString(movement.location, `${path}.movements[${index}].location`), details: optionalString(movement.details, `${path}.movements[${index}].details`) }; }),
    reshipments: array(raw.reshipments, `${path}.reshipments`).map((item, index) => { const reshipment = object(item, `${path}.reshipments[${index}]`); return { orderId: optionalString(reshipment.orderId, `${path}.reshipments[${index}].orderId`), trackingCode: optionalString(reshipment.trackingCode, `${path}.reshipments[${index}].trackingCode`), createdAt: optionalString(reshipment.createdAt, `${path}.reshipments[${index}].createdAt`), status: optionalString(reshipment.status, `${path}.reshipments[${index}].status`) }; }),
    delivery: raw.delivery === undefined || raw.delivery === null ? undefined : (() => { const delivery = object(raw.delivery, `${path}.delivery`); return { deliveredAt: string(delivery.deliveredAt, `${path}.delivery.deliveredAt`), receiver: optionalString(delivery.receiver, `${path}.delivery.receiver`), proof: optionalString(delivery.proof, `${path}.delivery.proof`) }; })()
  };
}

export function parseRastreioSearchResult(input: unknown): RastreioSearchResult {
  const raw = object(input, "RastreioSearchResult");
  const searchedBy = searchKey(raw.searchedBy);
  const orders = array(raw.orders, "orders").map((item, index) => parseOrder(item, `orders[${index}]`));
  if (orders.length === 0) return { outcome: "NOT_FOUND_IN_SOURCE", searchedBy, orders: [] };
  return { outcome: "FOUND", searchedBy, orders };
}

export function rastreioResultToEvidenceFacts(result: RastreioSearchResult, context: ParserFactContext): EvidenceFact[] {
  if (result.outcome === "NOT_FOUND_IN_SOURCE") return [];
  const sourceSystem = connectorId("rastreio-lancador");
  const collectedAt = context.collectedAt ?? context.observedAt;
  const facts: EvidenceFact[] = [];
  result.orders.forEach((order, orderIndex) => {
    const add = (key: NormalizedEvidenceKey, value: unknown, sensitivity: EvidenceSensitivity = "INTERNAL") => {
      if (value === undefined || value === "" || (Array.isArray(value) && value.length === 0)) return;
      facts.push({ id: `${context.runId}:${orderIndex}:${key}`, caseId: context.caseId, key, value, normalizedValue: value, sourceSystem, sourceReference: order.id, observedAt: context.observedAt, collectedAt, confidence: 1, freshness: "FRESH", sensitivity, acquisition: "SCRAPED", connectorRunId: context.runId });
    };
    add("order.primaryId", order.id); add("order.createdAt", order.createdAt); add("order.status", order.status); add("order.products", order.products); add("order.quantities", order.products.map((product) => product.quantity)); add("order.address", order.address, "PII");
    add("payment.status", order.payment?.status, "FINANCIAL"); add("payment.method", order.payment?.method, "FINANCIAL"); add("logistics.carrier", order.carrier); add("logistics.trackingCode", order.trackingCodes); add("logistics.status", order.status); add("logistics.forecast", order.forecast); add("logistics.events", order.movements); add("logistics.deliveredAt", order.delivery?.deliveredAt); add("logistics.receiver", order.delivery?.receiver, "PII"); add("logistics.proof", order.delivery?.proof, "PII"); add("logistics.reshipment", order.reshipments);
  });
  return facts;
}
