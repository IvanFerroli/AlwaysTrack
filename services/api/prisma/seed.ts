import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/core/auth/password.js";

const prisma = new PrismaClient();

async function main() {
  const organization = await prisma.organization.upsert({
    where: { id: "demo-org" },
    update: {},
    create: {
      id: "demo-org",
      name: "Demo Organization"
    }
  });

  await prisma.user.upsert({
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
