import { createHash } from "node:crypto";
import type { PrismaClient } from "@prisma/client";
import {
  caseFlowMessageChannels,
  type CaseFlowMessageChannel,
  type CaseFlowMessageCopyReceipt,
  type CompiledCaseFlowMessage,
  type CurrentUser,
  type MessagePlaceholderDefinition, type CaseFlowPlan
} from "@alwaystrack/shared";
import { recordAuditLog } from "../audit/audit.service.js";
import { parseCaseFlowJson } from "./persistence.js";

export class CaseFlowMessageError extends Error {
  constructor(public readonly code: "NOT_FOUND" | "INVALID_INPUT" | "COPY_BLOCKED") { super(code); }
}

export interface MessageTemplate {
  scriptId: string;
  revisionId: string;
  revision: number;
  nodeId: string;
  channel: CaseFlowMessageChannel;
  body: string;
  placeholders: MessagePlaceholderDefinition[];
}

const conditionalPattern = /\{conditional:([a-zA-Z0-9_.-]+)\}([\s\S]*?)\{\/conditional\}/g;
const placeholderPattern = /\{([a-zA-Z0-9_.-]+)\}/g;

function clean(value: unknown): string | undefined {
  if (value === null || value === undefined) return undefined;
  const result = typeof value === "string" ? value.trim() : String(value);
  return result && result !== "undefined" ? result : undefined;
}

export function compileMessageTemplate(caseId: string, planRevision: number, template: MessageTemplate, facts: Readonly<Record<string, unknown>>): CompiledCaseFlowMessage {
  if (!caseFlowMessageChannels.includes(template.channel)) throw new CaseFlowMessageError("INVALID_INPUT");
  const definitions = new Map(template.placeholders.map((item) => [item.key, item]));
  const pending = new Set<string>();
  let text = template.body.replace(conditionalPattern, (_block, key: string, content: string) => clean(facts[key]) ? content : "");
  text = text.replace(placeholderPattern, (_token, key: string) => {
    const value = clean(facts[key]);
    if (value !== undefined) return value;
    const definition = definitions.get(key) ?? { key, kind: "REQUIRED" as const, essential: true };
    if (definition.kind === "OPTIONAL") return "";
    pending.add(key);
    return definition.fallback ?? "informacao pendente";
  }).replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
  const copyAllowed = ![...pending].some((key) => definitions.get(key)?.essential !== false);
  const signature = JSON.stringify([caseId, planRevision, template.scriptId, template.revisionId, template.nodeId, template.channel, text]);
  return {
    id: `msg_${createHash("sha256").update(signature).digest("hex").slice(0, 24)}`,
    caseId, planRevision, nodeId: template.nodeId, channel: template.channel, text,
    source: { scriptId: template.scriptId, revisionId: template.revisionId, revision: template.revision },
    pendingPlaceholders: [...pending].sort(), copyAllowed
  };
}

type MessageDb = Pick<PrismaClient, "serviceCase" | "evidenceFact" | "operationalScript" | "operationalScriptRevision" | "auditLog">;

const scriptChannel = (channel: string, label?: string): CaseFlowMessageChannel => {
  const requested = label?.trim().toUpperCase();
  if (requested && caseFlowMessageChannels.includes(requested as CaseFlowMessageChannel)) return requested as CaseFlowMessageChannel;
  return ({ EMAIL: "EMAIL", INTERNAL: "INTERNAL_NOTE", PHONE: "WHISPER", WHATSAPP: "CUSTOMER", INSTAGRAM: "CUSTOMER" } as Record<string, CaseFlowMessageChannel>)[channel] ?? "CUSTOMER";
};

export async function loadPlanMessageTemplates(db: MessageDb, actor: CurrentUser, plan: CaseFlowPlan): Promise<MessageTemplate[]> {
  const bindings = plan.nodes.flatMap((node) => node.scripts.map((binding) => ({ node, binding })));
  const scriptIds = [...new Set(bindings.map((item) => item.binding.scriptId))];
  if (!scriptIds.length) return [];
  const scripts = await db.operationalScript.findMany({ where: { id: { in: scriptIds }, organizationId: actor.organizationId, status: "VALIDATED" } });
  const byId = new Map(scripts.map((script) => [script.id, script]));
  const result: MessageTemplate[] = [];
  for (const { node, binding } of bindings) {
    const script = byId.get(binding.scriptId);
    if (!script) continue;
    const revision = binding.revisionId
      ? await db.operationalScriptRevision.findFirst({ where: { id: binding.revisionId, scriptId: script.id, organizationId: actor.organizationId } })
      : await db.operationalScriptRevision.findFirst({ where: { scriptId: script.id, organizationId: actor.organizationId }, orderBy: { version: "desc" } });
    if (!revision) continue;
    const keys = jsonStringArray(revision.placeholdersJson);
    result.push({
      scriptId: script.id, revisionId: revision.id, revision: revision.version, nodeId: node.id,
      channel: scriptChannel(revision.channel, binding.label), body: revision.body,
      placeholders: keys.map((key) => ({ key, kind: node.optionalFacts.includes(key) ? "OPTIONAL" : "REQUIRED", essential: node.requiredFacts.includes(key) }))
    });
  }
  return result.sort((left, right) => JSON.stringify([left.nodeId, left.channel, left.scriptId]).localeCompare(JSON.stringify([right.nodeId, right.channel, right.scriptId])));
}

function jsonStringArray(value: string | null | undefined): string[] {
  if (!value) return [];
  try { const parsed = JSON.parse(value) as unknown; return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : []; } catch { return []; }
}

export async function compileCaseMessages(db: MessageDb, actor: CurrentUser, caseId: string, planRevision: number, templates: MessageTemplate[]) {
  const serviceCase = await db.serviceCase.findFirst({ where: { id: caseId, organizationId: actor.organizationId } });
  if (!serviceCase) throw new CaseFlowMessageError("NOT_FOUND");
  const rows = await db.evidenceFact.findMany({ where: { caseId, organizationId: actor.organizationId }, orderBy: { observedAt: "desc" } });
  const facts: Record<string, unknown> = {};
  for (const row of rows) if (!(row.key in facts)) facts[row.key] = parseCaseFlowJson(row.normalizedValueJson);
  return templates.map((template) => compileMessageTemplate(caseId, planRevision, template, facts));
}

export async function recordMessageCopy(db: Pick<PrismaClient, "auditLog">, actor: CurrentUser, message: CompiledCaseFlowMessage): Promise<CaseFlowMessageCopyReceipt> {
  if (!message.copyAllowed) throw new CaseFlowMessageError("COPY_BLOCKED");
  const copiedAt = new Date().toISOString();
  await recordAuditLog(db as PrismaClient, {
    organizationId: actor.organizationId, actorId: actor.id, action: "case_flow.message.copied",
    entityType: "CompiledMessage", entityId: message.id,
    metadata: { caseId: message.caseId, planRevision: message.planRevision, nodeId: message.nodeId, channel: message.channel, source: message.source, copiedAt, externalWrite: false }
  });
  return { messageId: message.id, caseId: message.caseId, userId: actor.id, planRevision: message.planRevision, copiedAt, externalWrite: false };
}
