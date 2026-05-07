import { execFileSync } from "node:child_process";
import { randomBytes, scryptSync } from "node:crypto";
import { mkdirSync, rmSync } from "node:fs";
import { resolve } from "node:path";
import { PrismaClient } from "@prisma/client";

const rootDir = resolve(import.meta.dirname, "..");
const schemaPath = resolve(rootDir, "services/api/prisma/schema.prisma");
const storagePath = resolve(rootDir, ".storage/private");

const adminConfig = {
  organizationName: "SyLembra",
  name: "Ivanilson Ferreira",
  email: "ivanilson.ferreira.mec@gmail.com",
  password: "sla-2026*"
};

const notificationTemplates = [
  {
    key: "license_expiration_notice",
    metaTemplateName: "license_expiration_notice",
    language: "pt_BR",
    bodyPreview:
      "Este é um aviso automático do SyLembra.\nOlá, {{professionalName}}. Identificamos que a licença {{licenseTypeName}}, número {{licenseNumber}}, está com vencimento programado para {{expiresAt}}. Faltam {{daysUntilExpiration}} dias para o vencimento. Em caso de dúvida, entre em contato com o responsável técnico {{responsibleRtName}} para receber orientações sobre a regularização."
  },
  {
    key: "responsible_license_expiration_notice",
    metaTemplateName: "responsible_license_expiration_notice",
    language: "pt_BR",
    bodyPreview:
      "Este é um aviso automático do SyLembra.\nOlá, {{responsibleRtName}}. Identificamos que a profissional {{professionalName}} possui a licença {{licenseTypeName}}, número {{licenseNumber}}, com vencimento programado para {{expiresAt}}. Faltam {{daysUntilExpiration}} dias para o vencimento. Verifique a pendência no sistema e acompanhe a regularização."
  },
  {
    key: "license_expired_notice",
    metaTemplateName: "license_expired_notice",
    language: "pt_BR",
    bodyPreview:
      "Este é um aviso automático do SyLembra.\nOlá, {{professionalName}}. Identificamos que sua licença {{licenseTypeName}}, número {{licenseNumber}}, venceu em {{expiresAt}}. A licença está vencida há {{daysExpired}} dias. Em caso de dúvida, entre em contato com o responsável técnico {{responsibleRtName}} para receber orientações sobre a regularização."
  },
  {
    key: "responsible_license_expired_notice",
    metaTemplateName: "responsible_license_expired_notice",
    language: "pt_BR",
    bodyPreview:
      "Este é um aviso automático do SyLembra.\nOlá, {{responsibleRtName}}. Identificamos que a profissional {{professionalName}} possui a licença {{licenseTypeName}}, número {{licenseNumber}}, vencida desde {{expiresAt}}. A licença está vencida há {{daysExpired}} dias. Verifique a pendência no sistema e acompanhe a regularização."
  }
];

const notificationRules = [
  { templateKey: "license_expiration_notice", daysBeforeExpiration: 30, repeatAfterExpiredDays: null, notifyProfessional: true, notifyRt: false },
  { templateKey: "license_expiration_notice", daysBeforeExpiration: 15, repeatAfterExpiredDays: null, notifyProfessional: true, notifyRt: false },
  { templateKey: "license_expiration_notice", daysBeforeExpiration: 7, repeatAfterExpiredDays: null, notifyProfessional: true, notifyRt: false },
  { templateKey: "license_expiration_notice", daysBeforeExpiration: 3, repeatAfterExpiredDays: null, notifyProfessional: true, notifyRt: false },
  { templateKey: "responsible_license_expiration_notice", daysBeforeExpiration: 3, repeatAfterExpiredDays: null, notifyProfessional: false, notifyRt: true },
  { templateKey: "license_expiration_notice", daysBeforeExpiration: 0, repeatAfterExpiredDays: null, notifyProfessional: true, notifyRt: false },
  { templateKey: "responsible_license_expiration_notice", daysBeforeExpiration: 0, repeatAfterExpiredDays: null, notifyProfessional: false, notifyRt: true },
  { templateKey: "license_expired_notice", daysBeforeExpiration: null, repeatAfterExpiredDays: 3, notifyProfessional: true, notifyRt: false },
  { templateKey: "responsible_license_expired_notice", daysBeforeExpiration: null, repeatAfterExpiredDays: 3, notifyProfessional: false, notifyRt: true }
];

function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = scryptSync(password, salt, 64);
  return `scrypt:${salt}:${derivedKey.toString("hex")}`;
}

function run(command, args, description) {
  console.log(`\n[SyLembra Flush] ${description}...`);
  execFileSync(command, args, {
    cwd: rootDir,
    env: process.env,
    stdio: "inherit"
  });
  console.log(`[SyLembra Flush] OK: ${description}`);
}

function resetStorage() {
  console.log("\n[SyLembra Flush] Limpando storage privado local...");
  rmSync(storagePath, { recursive: true, force: true });
  mkdirSync(storagePath, { recursive: true });
  console.log("[SyLembra Flush] OK: storage privado limpo");
}

async function seedSingleAdmin() {
  console.log("\n[SyLembra Flush] Recriando organizacao minima, admin, templates e regras...");
  const prisma = new PrismaClient();

  try {
    const organization = await prisma.organization.create({
      data: {
        name: adminConfig.organizationName,
        document: null,
        active: true
      }
    });

    await prisma.user.create({
      data: {
        name: adminConfig.name,
        email: adminConfig.email,
        passwordHash: hashPassword(adminConfig.password),
        role: "ADMIN",
        active: true,
        organizationId: organization.id
      }
    });

    await prisma.notificationTemplate.createMany({
      data: notificationTemplates.map((template) => ({
        organizationId: organization.id,
        key: template.key,
        channel: "WHATSAPP",
        metaTemplateName: template.metaTemplateName,
        language: template.language,
        bodyPreview: template.bodyPreview,
        active: true
      }))
    });

    await prisma.notificationRule.createMany({
      data: notificationRules.map((rule) => ({
        organizationId: organization.id,
        licenseTypeId: null,
        channel: "WHATSAPP",
        templateKey: rule.templateKey,
        daysBeforeExpiration: rule.daysBeforeExpiration,
        repeatAfterExpiredDays: rule.repeatAfterExpiredDays,
        notifyProfessional: rule.notifyProfessional,
        notifyRt: rule.notifyRt,
        active: true
      }))
    });

    const counts = {
      organizations: await prisma.organization.count(),
      users: await prisma.user.count(),
      notificationTemplates: await prisma.notificationTemplate.count(),
      notificationRules: await prisma.notificationRule.count(),
      units: await prisma.unit.count(),
      sectors: await prisma.sector.count(),
      professionals: await prisma.professional.count(),
      licenses: await prisma.license.count(),
      documents: await prisma.document.count(),
      notificationJobs: await prisma.notificationJob.count(),
      faqItems: await prisma.faqItem.count(),
      documentAiExtractions: await prisma.documentAiExtraction.count(),
      googleConnections: await prisma.googleConnection.count(),
      googleOauthStates: await prisma.googleOauthState.count()
    };

    console.log("[SyLembra Flush] Estado final:");
    console.log(JSON.stringify(counts, null, 2));
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  console.log("\n====================================================");
  console.log("SYLEMBRA - FLUSH LOCAL DEMO");
  console.log("====================================================");
  console.log(`Admin preservado/recriado: ${adminConfig.email}`);

  run("npx", ["prisma", "migrate", "reset", "--force", "--skip-seed", "--schema", schemaPath], "Resetando banco local");
  resetStorage();
  run("npx", ["prisma", "generate", "--schema", schemaPath], "Gerando Prisma Client");
  await seedSingleAdmin();

  console.log("\n[SyLembra Flush] Concluido. O ambiente local ficou limpo e com um unico admin.");
}

main().catch((error) => {
  console.error("\n[SyLembra Flush] Erro:", error instanceof Error ? error.message : String(error));
  process.exit(1);
});
