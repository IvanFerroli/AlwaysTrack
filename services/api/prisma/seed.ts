import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/core/auth/password.js";

const prisma = new PrismaClient();
const now = new Date();

async function main() {
  const organization = await prisma.organization.upsert({
    where: { id: "demo-org" },
    update: {},
    create: {
      id: "demo-org",
      name: "Demo Organization"
    }
  });

  const admin = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      name: "Admin Demo",
      email: "admin@example.com",
      passwordHash: await hashPassword("admin123"),
      role: "ADMIN",
      organizationId: organization.id
    }
  });

  const unit = await prisma.unit.upsert({
    where: {
      organizationId_name: {
        organizationId: organization.id,
        name: "Unidade Demo"
      }
    },
    update: {},
    create: {
      organizationId: organization.id,
      name: "Unidade Demo"
    }
  });

  const sector = await prisma.sector.upsert({
    where: {
      unitId_name: {
        unitId: unit.id,
        name: "Setor Demo"
      }
    },
    update: {},
    create: {
      unitId: unit.id,
      name: "Setor Demo"
    }
  });

  const licenseType = await prisma.licenseType.upsert({
    where: {
      organizationId_name: {
        organizationId: organization.id,
        name: "Registro profissional demo"
      }
    },
    update: {},
    create: {
      organizationId: organization.id,
      name: "Registro profissional demo",
      description: "Tipo placeholder para desenvolvimento local.",
      defaultWarningDays: "90,60,30"
    }
  });

  const professional = await prisma.professional.upsert({
    where: {
      organizationId_cpf: {
        organizationId: organization.id,
        cpf: "00000000000"
      }
    },
    update: {},
    create: {
      organizationId: organization.id,
      unitId: unit.id,
      sectorId: sector.id,
      responsibleRtId: admin.id,
      name: "Profissional Demo",
      cpf: "00000000000",
      email: "profissional.demo@example.com",
      phone: "+5500000000000",
      position: "Cargo demo"
    }
  });

  await prisma.license.upsert({
    where: {
      professionalId_licenseTypeId_number: {
        professionalId: professional.id,
        licenseTypeId: licenseType.id,
        number: "DEMO-0001"
      }
    },
    update: {},
    create: {
      professionalId: professional.id,
      licenseTypeId: licenseType.id,
      number: "DEMO-0001",
      issuer: "Demo",
      uf: "SP",
      issuedAt: now,
      expiresAt: new Date(now.getFullYear() + 1, now.getMonth(), now.getDate()),
      status: "REGULAR"
    }
  });

  await prisma.notificationTemplate.upsert({
    where: {
      organizationId_key: {
        organizationId: organization.id,
        key: "license-expiration-demo"
      }
    },
    update: {},
    create: {
      organizationId: organization.id,
      key: "license-expiration-demo",
      channel: "WHATSAPP",
      language: "pt_BR",
      bodyPreview: "Placeholder local para aviso de vencimento."
    }
  });

  const existingRule = await prisma.notificationRule.findFirst({
    where: {
      organizationId: organization.id,
      licenseTypeId: licenseType.id,
      channel: "WHATSAPP",
      templateKey: "license-expiration-demo",
      daysBeforeExpiration: 30
    }
  });

  if (!existingRule) {
    await prisma.notificationRule.create({
      data: {
        organizationId: organization.id,
        licenseTypeId: licenseType.id,
        daysBeforeExpiration: 30,
        channel: "WHATSAPP",
        templateKey: "license-expiration-demo",
        notifyProfessional: true,
        notifyRt: true
      }
    });
  }
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
