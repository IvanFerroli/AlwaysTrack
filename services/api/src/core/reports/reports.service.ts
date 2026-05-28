import type { Prisma, PrismaClient } from "@prisma/client";
import type { CurrentUser } from "@alwaystrack/shared";

export class ReportError extends Error {
  constructor(public readonly code: "FORBIDDEN" | "INVALID_REPORT") {
    super(code);
  }
}

export interface ReportFilters {
  from?: Date;
  to?: Date;
  unitId?: string;
  sectorId?: string;
  rtId?: string;
  licenseTypeId?: string;
  status?: string;
  channel?: string;
  windowDays?: number;
  page: number;
  pageSize: number;
}

export type ReportKind =
  | "expiredLicenses"
  | "expiringLicenses"
  | "rtSummary"
  | "areaSummary"
  | "pendingDocuments"
  | "rejectedDocuments"
  | "notifications"
  | "regularization";

type ReportRow = Record<string, unknown>;

const csvColumns: Record<ReportKind, Array<{ key: string; header: string }>> = {
  expiredLicenses: [
    { key: "professionalName", header: "Profissional" },
    { key: "unitName", header: "Unidade" },
    { key: "sectorName", header: "Setor" },
    { key: "rtName", header: "RT" },
    { key: "licenseTypeName", header: "Tipo" },
    { key: "number", header: "Numero" },
    { key: "expiresAt", header: "Venceu em" },
    { key: "daysExpired", header: "Dias vencida" },
    { key: "status", header: "Status" },
    { key: "lastNotificationStatus", header: "Ultima notificacao" },
    { key: "lastDocumentStatus", header: "Ultimo documento" }
  ],
  expiringLicenses: [
    { key: "professionalName", header: "Profissional" },
    { key: "unitName", header: "Unidade" },
    { key: "sectorName", header: "Setor" },
    { key: "rtName", header: "RT" },
    { key: "licenseTypeName", header: "Tipo" },
    { key: "number", header: "Numero" },
    { key: "expiresAt", header: "Vence em" },
    { key: "daysRemaining", header: "Dias restantes" },
    { key: "status", header: "Status" },
    { key: "lastNotificationStatus", header: "Ultima notificacao" },
    { key: "lastDocumentStatus", header: "Ultimo documento" }
  ],
  rtSummary: [
    { key: "label", header: "RT" },
    { key: "total", header: "Profissionais" },
    { key: "regular", header: "Regulares" },
    { key: "expiring", header: "A vencer" },
    { key: "expired", header: "Vencidas" },
    { key: "pendingValidation", header: "Validacoes pendentes" },
    { key: "failedNotifications", header: "Falhas notificacao" },
    { key: "pendingPercent", header: "Percentual pendencia" }
  ],
  areaSummary: [
    { key: "label", header: "Unidade / setor" },
    { key: "total", header: "Profissionais" },
    { key: "regular", header: "Regulares" },
    { key: "expiring", header: "A vencer" },
    { key: "expired", header: "Vencidas" },
    { key: "pendingValidation", header: "Validacoes pendentes" },
    { key: "failedNotifications", header: "Falhas notificacao" },
    { key: "pendingPercent", header: "Percentual pendencia" }
  ],
  pendingDocuments: [
    { key: "fileName", header: "Arquivo" },
    { key: "professionalName", header: "Profissional" },
    { key: "unitName", header: "Unidade" },
    { key: "sectorName", header: "Setor" },
    { key: "rtName", header: "RT" },
    { key: "licenseTypeName", header: "Tipo" },
    { key: "licenseStatus", header: "Status licenca" },
    { key: "uploadedAt", header: "Enviado em" },
    { key: "waitingDays", header: "Dias aguardando" }
  ],
  rejectedDocuments: [
    { key: "fileName", header: "Arquivo" },
    { key: "professionalName", header: "Profissional" },
    { key: "unitName", header: "Unidade" },
    { key: "sectorName", header: "Setor" },
    { key: "rtName", header: "RT" },
    { key: "licenseTypeName", header: "Tipo" },
    { key: "licenseStatus", header: "Status licenca" },
    { key: "rejectedAt", header: "Recusado em" },
    { key: "rejectedBy", header: "Recusado por" },
    { key: "rejectionReason", header: "Motivo" }
  ],
  notifications: [
    { key: "professionalName", header: "Profissional" },
    { key: "unitName", header: "Unidade" },
    { key: "sectorName", header: "Setor" },
    { key: "rtName", header: "RT" },
    { key: "licenseTypeName", header: "Tipo" },
    { key: "channel", header: "Canal" },
    { key: "templateKey", header: "Template" },
    { key: "recipient", header: "Destinatario" },
    { key: "status", header: "Status" },
    { key: "scheduledFor", header: "Agendada" },
    { key: "sentAt", header: "Enviada" },
    { key: "errorMessage", header: "Erro" },
    { key: "providerMessageId", header: "Provider ID" }
  ],
  regularization: [
    { key: "professionalName", header: "Profissional" },
    { key: "unitName", header: "Unidade" },
    { key: "sectorName", header: "Setor" },
    { key: "rtName", header: "RT" },
    { key: "licenseTypeName", header: "Tipo" },
    { key: "notificationAt", header: "Notificacao" },
    { key: "notificationStatus", header: "Status notificacao" },
    { key: "uploadedAt", header: "Upload" },
    { key: "validationAt", header: "Validacao" },
    { key: "validationStatus", header: "Status validacao" },
    { key: "validatedBy", header: "Validado por" },
    { key: "totalDays", header: "Dias totais" }
  ]
};

function cleanText(value: unknown) {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function cleanInteger(value: unknown) {
  if (typeof value !== "string") return undefined;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
}

function cleanDate(value: unknown) {
  if (typeof value !== "string" || value.trim() === "") return undefined;
  const parsed = new Date(value.includes("T") ? value : `${value}T00:00:00.000Z`);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

function startOfDay(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function daysBetween(from: Date, to: Date) {
  return Math.max(Math.floor((startOfDay(to).getTime() - startOfDay(from).getTime()) / 86_400_000), 0);
}

export function parseReportFilters(query: Record<string, unknown>): ReportFilters {
  const page = Math.max(cleanInteger(query.page) ?? 1, 1);
  const pageSize = Math.min(Math.max(cleanInteger(query.pageSize) ?? 25, 1), 100);
  return {
    from: cleanDate(query.from),
    to: cleanDate(query.to),
    unitId: cleanText(query.unitId),
    sectorId: cleanText(query.sectorId),
    rtId: cleanText(query.rtId),
    licenseTypeId: cleanText(query.licenseTypeId),
    status: cleanText(query.status),
    channel: cleanText(query.channel),
    windowDays: cleanInteger(query.windowDays),
    page,
    pageSize
  };
}

function scopedProfessionalWhere(actor: CurrentUser, filters: ReportFilters): Prisma.ProfessionalWhereInput {
  const base: Prisma.ProfessionalWhereInput = {
    organizationId: actor.organizationId,
    unitId: filters.unitId,
    sectorId: filters.sectorId,
    responsibleRtId: filters.rtId
  };

  if (actor.role === "ADMIN") return base;
  if (actor.role === "RT") return { ...base, responsibleRtId: actor.id };
  if (actor.role === "SUPERVISOR") {
    return {
      ...base,
      OR: [
        actor.unitScopeIds.length ? { unitId: { in: actor.unitScopeIds } } : { id: "__no_unit_scope__" },
        actor.sectorScopeIds.length ? { sectorId: { in: actor.sectorScopeIds } } : { id: "__no_sector_scope__" }
      ]
    };
  }

  throw new ReportError("FORBIDDEN");
}

function licenseInclude() {
  return {
    licenseType: true,
    professional: {
      include: {
        unit: true,
        sector: true,
        responsibleRt: { select: { id: true, name: true, email: true, role: true } }
      }
    },
    documents: { orderBy: { createdAt: "desc" as const }, take: 1, include: { validatedBy: { select: { id: true, name: true } } } },
    notificationJobs: { orderBy: { scheduledFor: "desc" as const }, take: 1 }
  };
}

function paginate(filters: ReportFilters) {
  return {
    skip: (filters.page - 1) * filters.pageSize,
    take: filters.pageSize
  };
}

async function listLicenseReport(prisma: PrismaClient, actor: CurrentUser, filters: ReportFilters, kind: "expired" | "expiring") {
  const today = startOfDay(new Date());
  const windowDays = filters.windowDays ?? 30;
  const expiresAt =
    kind === "expired"
      ? { lt: today }
      : { gte: filters.from ?? today, lte: filters.to ?? addDays(today, windowDays) };
  const where: Prisma.LicenseWhereInput = {
    professional: scopedProfessionalWhere(actor, filters),
    licenseTypeId: filters.licenseTypeId,
    status: kind === "expired" ? "EXPIRED" : "EXPIRING",
    expiresAt
  };

  const [rows, total] = await prisma.$transaction([
    prisma.license.findMany({
      where,
      include: licenseInclude(),
      orderBy: { expiresAt: "asc" },
      ...paginate(filters)
    }),
    prisma.license.count({ where })
  ]);

  return {
    items: rows.map((license) => {
      const expiresAtDate = license.expiresAt ?? today;
      const lastDocument = license.documents[0] ?? null;
      const lastNotification = license.notificationJobs[0] ?? null;
      return {
        id: license.id,
        professionalName: license.professional.name,
        unitName: license.professional.unit.name,
        sectorName: license.professional.sector.name,
        rtName: license.professional.responsibleRt?.name ?? "Sem RT",
        licenseTypeName: license.licenseType.name,
        number: license.number,
        expiresAt: license.expiresAt,
        status: license.status,
        daysExpired: kind === "expired" ? daysBetween(expiresAtDate, today) : 0,
        daysRemaining: kind === "expiring" ? daysBetween(today, expiresAtDate) : 0,
        lastNotificationAt: lastNotification?.sentAt ?? lastNotification?.scheduledFor ?? null,
        lastNotificationStatus: lastNotification?.status ?? null,
        lastDocumentAt: lastDocument?.createdAt ?? null,
        lastDocumentStatus: lastDocument?.status ?? null
      };
    }),
    page: filters.page,
    pageSize: filters.pageSize,
    total
  };
}

function emptySummary(label: string) {
  return {
    label,
    total: 0,
    regular: 0,
    expiring: 0,
    expired: 0,
    pendingValidation: 0,
    failedNotifications: 0,
    pendingPercent: 0
  };
}

async function listGroupReport(prisma: PrismaClient, actor: CurrentUser, filters: ReportFilters, kind: "rt" | "area") {
  const professionals = await prisma.professional.findMany({
    where: scopedProfessionalWhere(actor, filters),
    include: {
      unit: true,
      sector: true,
      responsibleRt: { select: { id: true, name: true } },
      licenses: true,
      documents: true,
      notificationJobs: true
    },
    orderBy: { name: "asc" }
  });

  const groups = new Map<string, ReturnType<typeof emptySummary>>();
  for (const professional of professionals) {
    const label = kind === "rt" ? professional.responsibleRt?.name ?? "Sem RT" : `${professional.unit.name} / ${professional.sector.name}`;
    const group = groups.get(label) ?? emptySummary(label);
    group.total += 1;
    group.regular += professional.licenses.filter((license) => license.status === "REGULAR").length;
    group.expiring += professional.licenses.filter((license) => license.status === "EXPIRING").length;
    group.expired += professional.licenses.filter((license) => license.status === "EXPIRED").length;
    group.pendingValidation += professional.documents.filter((document) => document.status === "UPLOADED").length;
    group.failedNotifications += professional.notificationJobs.filter((job) => job.status === "FAILED").length;
    groups.set(label, group);
  }

  const allItems = [...groups.values()].map((group) => ({
    ...group,
    pendingPercent: group.total === 0 ? 0 : Math.round(((group.expired + group.pendingValidation) / group.total) * 100)
  }));
  const start = (filters.page - 1) * filters.pageSize;
  return {
    items: allItems.slice(start, start + filters.pageSize),
    page: filters.page,
    pageSize: filters.pageSize,
    total: allItems.length
  };
}

async function listDocumentReport(prisma: PrismaClient, actor: CurrentUser, filters: ReportFilters, status: "UPLOADED" | "REJECTED") {
  const where: Prisma.DocumentWhereInput = {
    professional: scopedProfessionalWhere(actor, filters),
    status,
    license: { licenseTypeId: filters.licenseTypeId },
    createdAt: filters.from || filters.to ? { gte: filters.from, lte: filters.to } : undefined
  };
  const [rows, total] = await prisma.$transaction([
    prisma.document.findMany({
      where,
      include: {
        professional: { include: { unit: true, sector: true, responsibleRt: { select: { id: true, name: true } } } },
        license: { include: { licenseType: true } },
        validatedBy: { select: { id: true, name: true, email: true } }
      },
      orderBy: { createdAt: "desc" },
      ...paginate(filters)
    }),
    prisma.document.count({ where })
  ]);

  return {
    items: rows.map((document) => ({
      id: document.id,
      fileName: document.fileName,
      professionalName: document.professional.name,
      unitName: document.professional.unit.name,
      sectorName: document.professional.sector.name,
      rtName: document.professional.responsibleRt?.name ?? "Sem RT",
      licenseTypeName: document.license.licenseType.name,
      licenseStatus: document.license.status,
      status: document.status,
      uploadedAt: document.createdAt,
      waitingDays: status === "UPLOADED" ? daysBetween(document.createdAt, new Date()) : 0,
      rejectedAt: document.validatedAt,
      rejectionReason: document.rejectionReason,
      rejectedBy: document.validatedBy?.name ?? null
    })),
    page: filters.page,
    pageSize: filters.pageSize,
    total
  };
}

async function listNotificationReport(prisma: PrismaClient, actor: CurrentUser, filters: ReportFilters) {
  const where: Prisma.NotificationJobWhereInput = {
    professional: scopedProfessionalWhere(actor, filters),
    status: filters.status,
    channel: filters.channel,
    license: { licenseTypeId: filters.licenseTypeId },
    scheduledFor: filters.from || filters.to ? { gte: filters.from, lte: filters.to } : undefined
  };
  const [rows, total] = await prisma.$transaction([
    prisma.notificationJob.findMany({
      where,
      include: {
        professional: { include: { unit: true, sector: true, responsibleRt: { select: { id: true, name: true } } } },
        license: { include: { licenseType: true } }
      },
      orderBy: { scheduledFor: "desc" },
      ...paginate(filters)
    }),
    prisma.notificationJob.count({ where })
  ]);

  return {
    items: rows.map((job) => ({
      id: job.id,
      professionalName: job.professional.name,
      unitName: job.professional.unit.name,
      sectorName: job.professional.sector.name,
      rtName: job.professional.responsibleRt?.name ?? "Sem RT",
      licenseTypeName: job.license.licenseType.name,
      channel: job.channel,
      templateKey: job.templateKey,
      recipient: job.recipientPhone ?? job.recipientEmail,
      status: job.status,
      scheduledFor: job.scheduledFor,
      sentAt: job.sentAt,
      deliveredAt: job.deliveredAt,
      readAt: job.readAt,
      failedAt: job.failedAt,
      errorMessage: job.errorMessage,
      providerMessageId: job.providerMessageId
    })),
    page: filters.page,
    pageSize: filters.pageSize,
    total
  };
}

async function listRegularizationReport(prisma: PrismaClient, actor: CurrentUser, filters: ReportFilters) {
  const where: Prisma.DocumentWhereInput = {
    professional: scopedProfessionalWhere(actor, filters),
    license: { licenseTypeId: filters.licenseTypeId },
    createdAt: filters.from || filters.to ? { gte: filters.from, lte: filters.to } : undefined
  };
  const [rows, total] = await prisma.$transaction([
    prisma.document.findMany({
      where,
      include: {
        professional: { include: { unit: true, sector: true, responsibleRt: { select: { id: true, name: true } } } },
        license: { include: { licenseType: true, notificationJobs: { orderBy: { scheduledFor: "desc" }, take: 1 } } },
        validatedBy: { select: { id: true, name: true } }
      },
      orderBy: { createdAt: "desc" },
      ...paginate(filters)
    }),
    prisma.document.count({ where })
  ]);

  return {
    items: rows.map((document) => {
      const notification = document.license.notificationJobs[0] ?? null;
      const startedAt = notification?.scheduledFor ?? document.createdAt;
      const finishedAt = document.validatedAt ?? new Date();
      return {
        id: document.id,
        professionalName: document.professional.name,
        unitName: document.professional.unit.name,
        sectorName: document.professional.sector.name,
        rtName: document.professional.responsibleRt?.name ?? "Sem RT",
        licenseTypeName: document.license.licenseType.name,
        notificationAt: notification?.sentAt ?? notification?.scheduledFor ?? null,
        notificationStatus: notification?.status ?? null,
        uploadedAt: document.createdAt,
        validationAt: document.validatedAt,
        validationStatus: document.status,
        validatedBy: document.validatedBy?.name ?? null,
        totalDays: daysBetween(startedAt, finishedAt)
      };
    }),
    page: filters.page,
    pageSize: filters.pageSize,
    total
  };
}

export async function runReport(prisma: PrismaClient, actor: CurrentUser, kind: ReportKind, filters: ReportFilters) {
  if (kind === "expiredLicenses") return listLicenseReport(prisma, actor, filters, "expired");
  if (kind === "expiringLicenses") return listLicenseReport(prisma, actor, filters, "expiring");
  if (kind === "rtSummary") return listGroupReport(prisma, actor, filters, "rt");
  if (kind === "areaSummary") return listGroupReport(prisma, actor, filters, "area");
  if (kind === "pendingDocuments") return listDocumentReport(prisma, actor, filters, "UPLOADED");
  if (kind === "rejectedDocuments") return listDocumentReport(prisma, actor, filters, "REJECTED");
  if (kind === "notifications") return listNotificationReport(prisma, actor, filters);
  if (kind === "regularization") return listRegularizationReport(prisma, actor, filters);
  throw new ReportError("INVALID_REPORT");
}

function formatCsvValue(value: unknown) {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return value.toISOString();
  return String(value);
}

function escapeCsv(value: unknown) {
  return `"${formatCsvValue(value).replaceAll('"', '""')}"`;
}

export async function exportReportCsv(prisma: PrismaClient, actor: CurrentUser, kind: ReportKind, filters: ReportFilters) {
  const exportFilters = { ...filters, page: 1, pageSize: 5000 };
  const report = await runReport(prisma, actor, kind, exportFilters);
  const columns = csvColumns[kind];
  const header = columns.map((column) => escapeCsv(column.header)).join(",");
  const rows = (report.items as ReportRow[]).map((item) => columns.map((column) => escapeCsv(item[column.key])).join(","));
  return `${[header, ...rows].join("\n")}\n`;
}
