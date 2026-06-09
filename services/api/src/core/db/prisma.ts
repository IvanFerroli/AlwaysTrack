import { PrismaClient } from "@prisma/client";
import { loadEnv } from "../../config/env.js";
import { logEvent } from "../diagnostics/logger.js";

process.env.DATABASE_URL ??= "file:./dev.db";

export const prisma = new PrismaClient({
  log: [{ emit: "event", level: "query" }]
});

prisma.$on("query", (event) => {
  const env = loadEnv();
  if (event.duration < (env.prismaSlowQueryMs ?? 200)) return;
  logEvent("warn", "prisma.query.slow", {
    durationMs: event.duration,
    target: event.target,
    query: event.query.replace(/\s+/g, " ").slice(0, 300)
  });
});

export type PrismaTransaction = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];
