import type { Prisma, PrismaClient } from "@prisma/client";
import type { CurrentUser } from "@alwaystrack/shared";
import { loadEnv } from "../../config/env.js";
import { recordAuditLog } from "../audit/audit.service.js";

export class FaqError extends Error {
  constructor(public readonly code: "NOT_FOUND" | "INVALID_INPUT" | "FORBIDDEN") {
    super(code);
  }
}

export interface FaqInput {
  category?: string;
  question?: string;
  answer?: string;
  order?: number;
  active?: boolean;
}

export interface FaqFilters {
  organizationId?: string;
  category?: string;
  query?: string;
  activeOnly?: boolean;
}

export interface PublicHelpInput {
  organizationId?: string;
  professionalId?: string;
  licenseId?: string;
  problemType?: string;
  message?: string;
}

function cleanText(value: unknown) {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function cleanBoolean(value: unknown) {
  return typeof value === "boolean" ? value : undefined;
}

function cleanNumber(value: unknown) {
  const parsed = typeof value === "number" ? value : typeof value === "string" ? Number.parseInt(value, 10) : Number.NaN;
  return Number.isInteger(parsed) ? parsed : undefined;
}

function ensureAdmin(actor: CurrentUser) {
  if (actor.role !== "ADMIN") throw new FaqError("FORBIDDEN");
}

export function parseFaqInput(payload: unknown): FaqInput {
  const input = (payload ?? {}) as Record<string, unknown>;
  return {
    category: cleanText(input.category),
    question: cleanText(input.question),
    answer: cleanText(input.answer),
    order: cleanNumber(input.order),
    active: cleanBoolean(input.active)
  };
}

export function parseFaqFilters(query: Record<string, unknown>): FaqFilters {
  return {
    organizationId: cleanText(query.organizationId),
    category: cleanText(query.category),
    query: cleanText(query.query),
    activeOnly: query.activeOnly === "false" ? false : true
  };
}

export function parsePublicHelpInput(payload: unknown): PublicHelpInput {
  const input = (payload ?? {}) as Record<string, unknown>;
  return {
    organizationId: cleanText(input.organizationId),
    professionalId: cleanText(input.professionalId),
    licenseId: cleanText(input.licenseId),
    problemType: cleanText(input.problemType),
    message: cleanText(input.message)
  };
}

function faqWhere(organizationId: string, filters: FaqFilters): Prisma.FaqItemWhereInput {
  return {
    organizationId,
    active: filters.activeOnly ? true : undefined,
    category: filters.category,
    OR: filters.query ? [{ question: { contains: filters.query } }, { answer: { contains: filters.query } }] : undefined
  };
}

export async function listFaqItems(prisma: PrismaClient, actor: CurrentUser, filters: FaqFilters = {}) {
  const organizationId = actor.organizationId;
  const where = faqWhere(organizationId, { ...filters, activeOnly: filters.activeOnly ?? false });
  const [items, total] = await Promise.all([
    prisma.faqItem.findMany({
      where,
      orderBy: [{ active: "desc" }, { category: "asc" }, { order: "asc" }, { question: "asc" }]
    }),
    prisma.faqItem.count({ where })
  ]);
  return { items, total };
}

export async function listPublicFaqItems(prisma: PrismaClient, filters: FaqFilters) {
  if (!filters.organizationId) throw new FaqError("INVALID_INPUT");
  const organization = await prisma.organization.findFirst({ where: { id: filters.organizationId, active: true } });
  if (!organization) throw new FaqError("NOT_FOUND");
  const where = faqWhere(filters.organizationId, { ...filters, activeOnly: true });
  const [items, total] = await Promise.all([
    prisma.faqItem.findMany({
      where,
      select: { id: true, category: true, question: true, answer: true, order: true },
      orderBy: [{ category: "asc" }, { order: "asc" }, { question: "asc" }]
    }),
    prisma.faqItem.count({ where })
  ]);
  return { organization: { id: organization.id, name: organization.name }, items, total };
}

export async function createFaqItem(prisma: PrismaClient, actor: CurrentUser, input: FaqInput) {
  ensureAdmin(actor);
  if (!input.category || !input.question || !input.answer) throw new FaqError("INVALID_INPUT");

  const item = await prisma.faqItem.create({
    data: {
      organizationId: actor.organizationId,
      category: input.category,
      question: input.question,
      answer: input.answer,
      order: input.order ?? 0,
      active: input.active ?? true
    }
  });
  await recordAuditLog(prisma, {
    organizationId: actor.organizationId,
    actorId: actor.id,
    action: "faq.create",
    entityType: "FaqItem",
    entityId: item.id,
    metadata: { category: item.category, question: item.question, active: item.active }
  });
  return item;
}

export async function updateFaqItem(prisma: PrismaClient, actor: CurrentUser, faqItemId: string, input: FaqInput) {
  ensureAdmin(actor);
  const existing = await prisma.faqItem.findFirst({ where: { id: faqItemId, organizationId: actor.organizationId } });
  if (!existing) throw new FaqError("NOT_FOUND");
  if (
    !input.category &&
    !input.question &&
    !input.answer &&
    input.order === undefined &&
    input.active === undefined
  ) {
    throw new FaqError("INVALID_INPUT");
  }

  const item = await prisma.faqItem.update({
    where: { id: faqItemId },
    data: input
  });
  await recordAuditLog(prisma, {
    organizationId: actor.organizationId,
    actorId: actor.id,
    action: input.active === false ? "faq.deactivate" : "faq.update",
    entityType: "FaqItem",
    entityId: item.id,
    metadata: input
  });
  return item;
}

function digitsOnly(value: string | null | undefined) {
  return value?.replace(/\D/g, "") || undefined;
}

function buildWaUrl(phone: string, message: string) {
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

export async function buildPublicHelpLink(prisma: PrismaClient, input: PublicHelpInput) {
  if (!input.organizationId || !input.problemType || !input.message) throw new FaqError("INVALID_INPUT");

  const organization = await prisma.organization.findFirst({ where: { id: input.organizationId, active: true } });
  if (!organization) throw new FaqError("NOT_FOUND");

  const professional = input.professionalId
    ? await prisma.professional.findFirst({
        where: { id: input.professionalId, organizationId: input.organizationId },
        include: {
          responsibleRt: true,
          unit: true,
          sector: true,
          licenses: {
            where: input.licenseId ? { id: input.licenseId } : undefined,
            include: { licenseType: true },
            take: 1
          }
        }
      })
    : null;

  if (input.professionalId && !professional) throw new FaqError("NOT_FOUND");

  const rtPhone = digitsOnly(professional?.responsibleRt?.phone);
  const supervisor = professional
    ? await prisma.user.findFirst({
        where: {
          organizationId: input.organizationId,
          role: "SUPERVISOR",
          active: true,
          OR: [
            { unitScopeJson: { contains: professional.unitId } },
            { sectorScopeJson: { contains: professional.sectorId } }
          ]
        },
        orderBy: { name: "asc" }
      })
    : null;
  const supervisorPhone = digitsOnly(supervisor?.phone);
  const admin = await prisma.user.findFirst({
    where: { organizationId: input.organizationId, role: "ADMIN", active: true, phone: { not: null } },
    orderBy: { name: "asc" }
  });
  const adminPhone = digitsOnly(admin?.phone);
  const fallbackPhone = digitsOnly(loadEnv().supportPhone);
  const phone = rtPhone ?? supervisorPhone ?? adminPhone ?? fallbackPhone;
  if (!phone) throw new FaqError("NOT_FOUND");

  const license = professional?.licenses[0];
  const message = [
    `Ajuda AlwaysTrack - ${input.problemType}`,
    professional ? `Profissional: ${professional.name}` : `Organizacao: ${organization.name}`,
    license ? `Licenca: ${license.licenseType.name}${license.number ? ` / ${license.number}` : ""}` : null,
    `Mensagem: ${input.message}`
  ]
    .filter(Boolean)
    .join("\n");

  return {
    url: buildWaUrl(phone, message),
    recipient: rtPhone ? "RT" : supervisorPhone ? "SUPERVISOR" : adminPhone ? "ADMIN" : "SUPPORT"
  };
}
