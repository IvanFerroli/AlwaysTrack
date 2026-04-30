import type { PrismaClient } from "@prisma/client";
import { createHash } from "node:crypto";
import { licenseStatuses, type CurrentUser, type LicenseStatus } from "@sylembra/shared";
import { recordAuditLog } from "../audit/audit.service.js";
import { calculateLicenseStatus } from "../licenses/status.js";

export class ImportError extends Error {
  constructor(public readonly code: "FORBIDDEN" | "INVALID_INPUT" | "HAS_ERRORS") {
    super(code);
  }
}

const headers = [
  "professional_name",
  "cpf",
  "email",
  "phone",
  "position",
  "unit_name",
  "sector_name",
  "rt_email",
  "license_type",
  "license_number",
  "issuer",
  "uf",
  "issued_at",
  "expires_at",
  "status",
  "notes"
] as const;

type Header = (typeof headers)[number];

interface ImportRow {
  line: number;
  values: Record<Header, string>;
}

export interface ImportRowResult {
  line: number;
  professionalName: string;
  cpf: string;
  licenseType: string;
  licenseNumber: string | null;
  action: "create" | "update" | "error";
  professionalAction: "create" | "update" | "error";
  licenseAction: "create" | "update" | "error";
  errors: string[];
}

export interface ImportValidationResult {
  totalRows: number;
  validRows: number;
  errorRows: number;
  willCreateProfessionals: number;
  willUpdateProfessionals: number;
  willCreateLicenses: number;
  willUpdateLicenses: number;
  rows: ImportRowResult[];
}

export const professionalsLicensesCsvTemplate = `${headers.join(",")}
Maria Exemplo,12345678901,maria@example.com,11999999999,Enfermeira,RH-GERAL,GOVERNANCA,rt@example.com,Registro profissional demo,COREN-123,COREN,SP,2024-01-10,2026-01-10,,Carga inicial
`;

function ensureAdmin(actor: CurrentUser) {
  if (actor.role !== "ADMIN") throw new ImportError("FORBIDDEN");
}

function clean(value: string | undefined) {
  return (value ?? "").trim();
}

function normalizeCpf(value: string) {
  return value.replace(/\D/g, "");
}

function normalizeEmail(value: string) {
  return clean(value).toLowerCase();
}

function parseDate(value: string) {
  const text = clean(value);
  if (!text) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return undefined;
  const date = new Date(`${text}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function parseStatus(value: string) {
  const text = clean(value).toUpperCase();
  if (!text) return undefined;
  return licenseStatuses.includes(text as LicenseStatus) ? (text as LicenseStatus) : null;
}

function parseCsvLine(line: string, delimiter: string) {
  const cells: string[] = [];
  let current = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];
    if (char === '"' && quoted && next === '"') {
      current += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === delimiter && !quoted) {
      cells.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  cells.push(current.trim());
  return cells;
}

function parseCsv(csv: string): ImportRow[] {
  const normalized = csv.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();
  if (!normalized) throw new ImportError("INVALID_INPUT");
  if (normalized.length > 1024 * 1024) throw new ImportError("INVALID_INPUT");

  const lines = normalized.split("\n").filter((line) => line.trim().length > 0);
  const delimiter = (lines[0].match(/;/g)?.length ?? 0) > (lines[0].match(/,/g)?.length ?? 0) ? ";" : ",";
  const headerCells = parseCsvLine(lines[0], delimiter).map((item) => item.trim());
  if (headerCells.join(",") !== headers.join(",")) throw new ImportError("INVALID_INPUT");

  return lines.slice(1).map((line, index) => {
    const cells = parseCsvLine(line, delimiter);
    const values = Object.fromEntries(headers.map((header, cellIndex) => [header, clean(cells[cellIndex])])) as Record<Header, string>;
    return { line: index + 2, values };
  });
}

async function validateRows(prisma: PrismaClient, actor: CurrentUser, rows: ImportRow[]) {
  const [units, sectors, users, licenseTypes, professionals] = await Promise.all([
    prisma.unit.findMany({ where: { organizationId: actor.organizationId, active: true } }),
    prisma.sector.findMany({ where: { unit: { organizationId: actor.organizationId }, active: true } }),
    prisma.user.findMany({ where: { organizationId: actor.organizationId, active: true } }),
    prisma.licenseType.findMany({ where: { organizationId: actor.organizationId, active: true } }),
    prisma.professional.findMany({ where: { organizationId: actor.organizationId } })
  ]);

  const unitsByName = new Map(units.map((unit) => [unit.name.toLowerCase(), unit]));
  const sectorsByUnitAndName = new Map(sectors.map((sector) => [`${sector.unitId}:${sector.name.toLowerCase()}`, sector]));
  const rtsByEmail = new Map(users.filter((user) => user.role === "RT").map((user) => [user.email.toLowerCase(), user]));
  const licenseTypesByName = new Map(licenseTypes.map((licenseType) => [licenseType.name.toLowerCase(), licenseType]));
  const professionalsByCpf = new Map(professionals.filter((professional) => professional.cpf).map((professional) => [professional.cpf as string, professional]));
  const existingLicenses = await prisma.license.findMany({
    where: { professional: { organizationId: actor.organizationId } },
    select: { id: true, professionalId: true, licenseTypeId: true, number: true }
  });
  const licensesByKey = new Map(
    existingLicenses
      .filter((license) => license.number)
      .map((license) => [`${license.professionalId}:${license.licenseTypeId}:${license.number}`, license])
  );

  const seenProfessionalCpfs = new Set<string>();
  const seenLicenses = new Set<string>();
  const results: ImportRowResult[] = [];

  for (const row of rows) {
    const errors: string[] = [];
    const name = clean(row.values.professional_name);
    const cpf = normalizeCpf(row.values.cpf);
    const unit = unitsByName.get(row.values.unit_name.toLowerCase());
    const sector = unit ? sectorsByUnitAndName.get(`${unit.id}:${row.values.sector_name.toLowerCase()}`) : undefined;
    const rtEmail = normalizeEmail(row.values.rt_email);
    const licenseType = licenseTypesByName.get(row.values.license_type.toLowerCase());
    const issuedAt = parseDate(row.values.issued_at);
    const expiresAt = parseDate(row.values.expires_at);
    const status = parseStatus(row.values.status);

    if (!name) errors.push("Nome do profissional é obrigatório.");
    if (!cpf) errors.push("CPF é obrigatório.");
    if (!unit) errors.push("Unidade não encontrada ou inativa.");
    if (unit && !sector) errors.push("Setor não encontrado na unidade informada.");
    if (rtEmail && !rtsByEmail.has(rtEmail)) errors.push("RT não encontrado, inativo ou sem perfil RT.");
    if (!licenseType) errors.push("Tipo de licença não encontrado ou inativo.");
    if (issuedAt === undefined) errors.push("Data de emissão inválida. Use YYYY-MM-DD.");
    if (expiresAt === undefined) errors.push("Data de vencimento inválida. Use YYYY-MM-DD.");
    if (status === null) errors.push("Status inválido.");

    const existingProfessional = cpf ? professionalsByCpf.get(cpf) : undefined;
    const professionalAction = errors.length ? "error" : existingProfessional || seenProfessionalCpfs.has(cpf) ? "update" : "create";
    const professionalId = existingProfessional?.id ?? `new:${cpf}`;
    const licenseKey = licenseType ? `${professionalId}:${licenseType.id}:${clean(row.values.license_number)}` : "";
    if (licenseKey && seenLicenses.has(licenseKey)) errors.push("Licença duplicada na planilha para profissional/tipo/número.");
    if (licenseKey) seenLicenses.add(licenseKey);
    if (cpf) seenProfessionalCpfs.add(cpf);

    const existingLicense = existingProfessional && licenseType && row.values.license_number
      ? licensesByKey.get(`${existingProfessional.id}:${licenseType.id}:${row.values.license_number}`)
      : undefined;

    results.push({
      line: row.line,
      professionalName: name,
      cpf,
      licenseType: row.values.license_type,
      licenseNumber: clean(row.values.license_number) || null,
      action: errors.length ? "error" : existingLicense ? "update" : "create",
      professionalAction,
      licenseAction: errors.length ? "error" : existingLicense ? "update" : "create",
      errors
    });
  }

  return results;
}

function summarize(rows: ImportRowResult[]): ImportValidationResult {
  const validRows = rows.filter((row) => row.errors.length === 0);
  return {
    totalRows: rows.length,
    validRows: validRows.length,
    errorRows: rows.length - validRows.length,
    willCreateProfessionals: validRows.filter((row) => row.professionalAction === "create").length,
    willUpdateProfessionals: validRows.filter((row) => row.professionalAction === "update").length,
    willCreateLicenses: validRows.filter((row) => row.licenseAction === "create").length,
    willUpdateLicenses: validRows.filter((row) => row.licenseAction === "update").length,
    rows
  };
}

export async function validateProfessionalsLicensesCsv(prisma: PrismaClient, actor: CurrentUser, csv: string) {
  ensureAdmin(actor);
  const rows = parseCsv(csv);
  const result = summarize(await validateRows(prisma, actor, rows));
  await recordAuditLog(prisma, {
    organizationId: actor.organizationId,
    actorId: actor.id,
    action: "bulk_import.validate",
    entityType: "BulkImport",
    entityId: createHash("sha256").update(csv).digest("hex").slice(0, 16),
    metadata: { totalRows: result.totalRows, errorRows: result.errorRows }
  });
  return result;
}

export async function commitProfessionalsLicensesCsv(prisma: PrismaClient, actor: CurrentUser, csv: string) {
  ensureAdmin(actor);
  const validation = await validateProfessionalsLicensesCsv(prisma, actor, csv);
  if (validation.errorRows > 0) throw new ImportError("HAS_ERRORS");

  const rows = parseCsv(csv);
  let professionalsCreated = 0;
  let professionalsUpdated = 0;
  let licensesCreated = 0;
  let licensesUpdated = 0;

  await prisma.$transaction(async (tx) => {
    for (const row of rows) {
      const unit = await tx.unit.findFirst({ where: { organizationId: actor.organizationId, name: row.values.unit_name, active: true } });
      const sector = unit
        ? await tx.sector.findFirst({ where: { unitId: unit.id, name: row.values.sector_name, active: true } })
        : null;
      const responsibleRt = row.values.rt_email
        ? await tx.user.findFirst({ where: { organizationId: actor.organizationId, email: normalizeEmail(row.values.rt_email), role: "RT", active: true } })
        : null;
      const licenseType = await tx.licenseType.findFirst({
        where: { organizationId: actor.organizationId, name: row.values.license_type, active: true }
      });
      if (!unit || !sector || !licenseType) throw new ImportError("INVALID_INPUT");

      const cpf = normalizeCpf(row.values.cpf);
      const existingProfessional = await tx.professional.findFirst({ where: { organizationId: actor.organizationId, cpf } });
      const professionalData = {
        unitId: unit.id,
        sectorId: sector.id,
        responsibleRtId: responsibleRt?.id ?? null,
        name: row.values.professional_name,
        email: normalizeEmail(row.values.email) || null,
        phone: row.values.phone || null,
        position: row.values.position || null,
        active: true,
        notes: row.values.notes || null
      };
      const professional = existingProfessional
        ? await tx.professional.update({ where: { id: existingProfessional.id }, data: professionalData })
        : await tx.professional.create({ data: { organizationId: actor.organizationId, cpf, ...professionalData } });
      existingProfessional ? (professionalsUpdated += 1) : (professionalsCreated += 1);

      const existingLicense = row.values.license_number
        ? await tx.license.findFirst({
            where: { professionalId: professional.id, licenseTypeId: licenseType.id, number: row.values.license_number }
          })
        : null;
      const status = parseStatus(row.values.status);
      const issuedAt = parseDate(row.values.issued_at);
      const expiresAt = parseDate(row.values.expires_at);
      const nextStatus = status || calculateLicenseStatus({
        currentStatus: "PENDING_DOCUMENT",
        expiresAt: expiresAt ?? null,
        defaultWarningDays: licenseType.defaultWarningDays,
        documents: [],
        notificationRules: []
      });
      const licenseData = {
        licenseTypeId: licenseType.id,
        number: row.values.license_number || null,
        issuer: row.values.issuer || null,
        uf: row.values.uf ? row.values.uf.toUpperCase() : null,
        issuedAt: issuedAt ?? null,
        expiresAt: expiresAt ?? null,
        status: nextStatus,
        notes: row.values.notes || null,
        validatedById: actor.id,
        lastValidatedAt: new Date()
      };
      if (existingLicense) {
        await tx.license.update({ where: { id: existingLicense.id }, data: licenseData });
        licensesUpdated += 1;
      } else {
        await tx.license.create({ data: { professionalId: professional.id, ...licenseData } });
        licensesCreated += 1;
      }
    }
  });

  await recordAuditLog(prisma, {
    organizationId: actor.organizationId,
    actorId: actor.id,
    action: "bulk_import.commit",
    entityType: "BulkImport",
    entityId: createHash("sha256").update(csv).digest("hex").slice(0, 16),
    metadata: { professionalsCreated, professionalsUpdated, licensesCreated, licensesUpdated }
  });

  return { ...validation, professionalsCreated, professionalsUpdated, licensesCreated, licensesUpdated };
}
