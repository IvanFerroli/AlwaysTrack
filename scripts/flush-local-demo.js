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
  console.log("\n[SyLembra Flush] Recriando organizacao minima e admin...");
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

    const counts = {
      organizations: await prisma.organization.count(),
      users: await prisma.user.count(),
      units: await prisma.unit.count(),
      sectors: await prisma.sector.count(),
      professionals: await prisma.professional.count(),
      licenses: await prisma.license.count(),
      documents: await prisma.document.count(),
      notificationJobs: await prisma.notificationJob.count(),
      faqItems: await prisma.faqItem.count(),
      documentAiExtractions: await prisma.documentAiExtraction.count()
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
