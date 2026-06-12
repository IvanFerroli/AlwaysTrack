import { execFileSync } from "node:child_process";
import { mkdirSync, rmSync } from "node:fs";
import { resolve } from "node:path";

const rootDir = resolve(import.meta.dirname, "..");
const schemaPath = resolve(rootDir, "services/api/prisma/schema.prisma");
const storagePath = resolve(rootDir, ".storage/private");
const databaseUrl = process.env.DATABASE_URL ?? "file:./dev.db";

function assertLocalDemoTarget() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Refusing to reset demo with NODE_ENV=production.");
  }
  if (!databaseUrl.startsWith("file:")) {
    throw new Error(`Refusing to reset non-local DATABASE_URL: ${databaseUrl.replace(/:.+@/, ":***@")}`);
  }
}

function run(command, args, description) {
  console.log(`\n[AlwaysTrack Demo] ${description}...`);
  execFileSync(command, args, {
    cwd: rootDir,
    env: process.env,
    stdio: "inherit"
  });
  console.log(`[AlwaysTrack Demo] OK: ${description}`);
}

function resetStorage() {
  console.log("\n[AlwaysTrack Demo] Limpando storage privado local...");
  rmSync(storagePath, { recursive: true, force: true });
  mkdirSync(storagePath, { recursive: true });
  console.log("[AlwaysTrack Demo] OK: storage privado limpo");
}

assertLocalDemoTarget();

console.log("\n====================================================");
console.log("ALWAYSTRACK - RESET DEMO LOCAL");
console.log("====================================================");
console.log(`DATABASE_URL: ${databaseUrl}`);
console.log("Este comando reseta o banco local e roda o seed comercial completo.");

resetStorage();
run("npx", ["prisma", "migrate", "reset", "--force", "--schema", schemaPath], "Resetando banco e aplicando seed demo");

console.log("\n[AlwaysTrack Demo] Concluido. Use VITE_DEMO_MODE=true no web para exibir o guia visual da demo.");
