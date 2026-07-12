import type { EvidenceFact, EvidenceSensitivity, NormalizedEvidenceKey } from "../case-flow/evidence.js";
import { connectorId } from "../case-flow/evidence.js";

type JsonObject = Record<string, unknown>;

export interface AlwaysChatMessage {
  id: string;
  author: "CUSTOMER" | "AGENT" | "SYSTEM";
  text: string;
  sentAt: string;
  attachments: AlwaysChatAttachment[];
}

export interface AlwaysChatAttachment {
  id: string;
  name: string;
  mediaType: string;
  url?: string;
}

export interface AlwaysChatOrderSummary {
  id: string;
  status?: string;
  coupons: string[];
}

export interface AlwaysChatIntake {
  conversation: {
    id: string;
    url: string;
    channel: string;
    tags: string[];
    previousAgent?: string;
  };
  customer: {
    name: string;
    cpf?: string;
    email?: string;
    phone?: string;
  };
  displayedOrder?: string;
  orders: AlwaysChatOrderSummary[];
  history: AlwaysChatMessage[];
  recentMessages: AlwaysChatMessage[];
  visibleAttachments: AlwaysChatAttachment[];
  visibleCoupons: string[];
  customerText: string;
  apparentIntent?: string;
  citedInformation: string[];
}

export interface ParserFactContext {
  caseId: string;
  runId: string;
  observedAt: string;
  collectedAt?: string;
}

function object(value: unknown, path: string): JsonObject {
  if (typeof value !== "object" || value === null || Array.isArray(value)) throw new TypeError(`${path} must be an object`);
  return value as JsonObject;
}

function string(value: unknown, path: string): string {
  if (typeof value !== "string" || !value.trim()) throw new TypeError(`${path} must be a non-empty string`);
  return value.trim();
}

function optionalString(value: unknown, path: string): string | undefined {
  return value === undefined || value === null || value === "" ? undefined : string(value, path);
}

function strings(value: unknown, path: string): string[] {
  if (!Array.isArray(value)) throw new TypeError(`${path} must be an array`);
  return value.map((item, index) => string(item, `${path}[${index}]`));
}

function attachment(value: unknown, path: string): AlwaysChatAttachment {
  const raw = object(value, path);
  return {
    id: string(raw.id, `${path}.id`),
    name: string(raw.name, `${path}.name`),
    mediaType: string(raw.mediaType, `${path}.mediaType`),
    url: optionalString(raw.url, `${path}.url`)
  };
}

function message(value: unknown, path: string): AlwaysChatMessage {
  const raw = object(value, path);
  const author = string(raw.author, `${path}.author`);
  if (author !== "CUSTOMER" && author !== "AGENT" && author !== "SYSTEM") throw new TypeError(`${path}.author is invalid`);
  if (!Array.isArray(raw.attachments)) throw new TypeError(`${path}.attachments must be an array`);
  return {
    id: string(raw.id, `${path}.id`),
    author,
    text: string(raw.text, `${path}.text`),
    sentAt: string(raw.sentAt, `${path}.sentAt`),
    attachments: raw.attachments.map((item, index) => attachment(item, `${path}.attachments[${index}]`))
  };
}

export function parseAlwaysChatIntake(input: unknown): AlwaysChatIntake {
  const raw = object(input, "AlwaysChatIntake");
  const conversation = object(raw.conversation, "conversation");
  const customer = object(raw.customer, "customer");
  if (!Array.isArray(raw.orders) || !Array.isArray(raw.history) || !Array.isArray(raw.recentMessages) || !Array.isArray(raw.visibleAttachments)) {
    throw new TypeError("AlwaysChat intake collections must be arrays");
  }

  return {
    conversation: {
      id: string(conversation.id, "conversation.id"),
      url: string(conversation.url, "conversation.url"),
      channel: string(conversation.channel, "conversation.channel"),
      tags: strings(conversation.tags, "conversation.tags"),
      previousAgent: optionalString(conversation.previousAgent, "conversation.previousAgent")
    },
    customer: {
      name: string(customer.name, "customer.name"),
      cpf: optionalString(customer.cpf, "customer.cpf"),
      email: optionalString(customer.email, "customer.email"),
      phone: optionalString(customer.phone, "customer.phone")
    },
    displayedOrder: optionalString(raw.displayedOrder, "displayedOrder"),
    orders: raw.orders.map((item, index) => {
      const order = object(item, `orders[${index}]`);
      return { id: string(order.id, `orders[${index}].id`), status: optionalString(order.status, `orders[${index}].status`), coupons: strings(order.coupons, `orders[${index}].coupons`) };
    }),
    history: raw.history.map((item, index) => message(item, `history[${index}]`)),
    recentMessages: raw.recentMessages.map((item, index) => message(item, `recentMessages[${index}]`)),
    visibleAttachments: raw.visibleAttachments.map((item, index) => attachment(item, `visibleAttachments[${index}]`)),
    visibleCoupons: strings(raw.visibleCoupons, "visibleCoupons"),
    customerText: string(raw.customerText, "customerText"),
    apparentIntent: optionalString(raw.apparentIntent, "apparentIntent"),
    citedInformation: strings(raw.citedInformation, "citedInformation")
  };
}

export function alwaysChatIntakeToEvidenceFacts(intake: AlwaysChatIntake, context: ParserFactContext): EvidenceFact[] {
  const sourceSystem = connectorId("alwayschat");
  const collectedAt = context.collectedAt ?? context.observedAt;
  const facts: EvidenceFact[] = [];
  const add = (key: NormalizedEvidenceKey, value: unknown, sensitivity: EvidenceSensitivity = "INTERNAL") => {
    if (value === undefined || value === "" || (Array.isArray(value) && value.length === 0)) return;
    facts.push({ id: `${context.runId}:${key}`, caseId: context.caseId, key, value, normalizedValue: value, sourceSystem, sourceReference: intake.conversation.url, observedAt: context.observedAt, collectedAt, confidence: 1, freshness: "FRESH", sensitivity, acquisition: "SCRAPED", connectorRunId: context.runId });
  };
  add("conversation.id", intake.conversation.id);
  add("conversation.url", intake.conversation.url);
  add("conversation.channel", intake.conversation.channel);
  add("conversation.tags", intake.conversation.tags);
  add("conversation.previousAgent", intake.conversation.previousAgent);
  add("conversation.intentText", intake.apparentIntent ?? intake.customerText);
  add("conversation.summarySeed", { customerText: intake.customerText, citedInformation: intake.citedInformation, recentMessages: intake.recentMessages });
  add("customer.name", intake.customer.name, "PII");
  add("customer.cpf", intake.customer.cpf, "PII");
  add("customer.email", intake.customer.email, "PII");
  add("customer.phone", intake.customer.phone, "PII");
  add("order.primaryId", intake.displayedOrder ?? intake.orders[0]?.id);
  add("order.coupon", intake.visibleCoupons);
  return facts;
}
