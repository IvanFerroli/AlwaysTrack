import { PrismaClient } from "@prisma/client";

process.env.DATABASE_URL ??= "file:./dev.db";

export const prisma = new PrismaClient();

export type PrismaTransaction = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];
