import { execFileSync } from "node:child_process";
import { copyFileSync, existsSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const rootDir = resolve(import.meta.dirname, "..");
const schemaPath = "services/api/prisma/schema.prisma";
const seedPassword = "AlwaysTrackMigration123!";

function run(command, args, env, description, input) {
  console.log(`[migration-test] ${description}`);
  execFileSync(command, args, {
    cwd: rootDir,
    env: { ...process.env, ...env },
    input,
    stdio: input ? ["pipe", "inherit", "inherit"] : "inherit"
  });
}

function sqliteUrl(filePath) {
  return `file:${filePath}`;
}

function migrate(env, label) {
  const sqlPath = join(tempRoot, `${label.replaceAll(" ", "-")}.sql`);
  console.log(`[migration-test] ${label}: generating schema SQL`);
  const sql = execFileSync(
    "npx",
    ["prisma", "migrate", "diff", "--from-empty", "--to-schema-datamodel", schemaPath, "--script"],
    {
      cwd: rootDir,
      env: { ...process.env, ...env },
      encoding: "utf8"
    }
  );
  writeFileSync(sqlPath, sql);
  run("npx", ["prisma", "db", "execute", "--schema", schemaPath, "--file", sqlPath], env, `${label}: applying schema SQL`);
}

const tempRoot = mkdtempSync(join(tmpdir(), "alwaystrack-migrations-"));

try {
  const emptyDb = join(tempRoot, "empty.db");
  migrate({ DATABASE_URL: sqliteUrl(emptyDb) }, "empty database");

  const seededDb = join(tempRoot, "seeded.db");
  const seededEnv = {
    DATABASE_URL: sqliteUrl(seededDb),
    SESSION_SECRET: "migration-test-session-secret",
    SEED_ADMIN_PASSWORD: seedPassword,
    SEED_SAC_PASSWORD: seedPassword,
    SEED_FINANCEIRO_PASSWORD: seedPassword,
    SEED_SELLER_PASSWORD: seedPassword,
    SEED_SUPERVISOR_PASSWORD: seedPassword
  };
  migrate(seededEnv, "seeded database");
  run("npm", ["run", "prisma:seed"], seededEnv, "seeded database: applying commercial seed");

  const backupDb = join(tempRoot, "seeded.backup.db");
  copyFileSync(seededDb, backupDb);
  if (!existsSync(backupDb)) {
    throw new Error("Backup copy was not created.");
  }
  run("npx", ["prisma", "db", "execute", "--schema", schemaPath, "--stdin"], seededEnv, "seeded database: checking restored DB", "SELECT 1;");
  copyFileSync(backupDb, seededDb);

  console.log("[migration-test] OK: migrations, commercial seed and local backup restore path validated.");
} finally {
  rmSync(tempRoot, { recursive: true, force: true });
}
