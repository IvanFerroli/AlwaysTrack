import { exec, spawn } from "node:child_process";
import { existsSync, readFileSync, rmSync } from "node:fs";
import { resolve } from "node:path";

const rootDir = resolve(import.meta.dirname, "..");
const schemaPath = "services/api/prisma/schema.prisma";
const devDatabasePath = "services/api/prisma/dev.db";
const fullSchemaSqlPath = ".tmp-alwaystrack-dev-schema.sql";
const incrementalSchemaSqlPath = ".tmp-alwaystrack-dev-migration.sql";
const setupOnly = process.argv.includes("--setup-only");
const noStudio = process.argv.includes("--no-studio");
const defaultDatabaseUrl = "file:./dev.db";

const env = {
  ...process.env,
  DATABASE_URL: process.env.DATABASE_URL ?? defaultDatabaseUrl,
  SESSION_SECRET: process.env.SESSION_SECRET ?? "dev-session-secret",
  API_PORT: process.env.API_PORT ?? "3333"
};

function shellQuote(value) {
  return `'${value.replaceAll("'", "'\\''")}'`;
}

function shouldCreateLocalDatabase() {
  return env.DATABASE_URL === defaultDatabaseUrl && !existsSync(resolve(rootDir, devDatabasePath));
}

function migrationDatabaseUrl() {
  if (env.DATABASE_URL === defaultDatabaseUrl) {
    return `file:${resolve(rootDir, devDatabasePath)}`;
  }

  return env.DATABASE_URL;
}

function hasExecutableSql(filePath) {
  if (!existsSync(resolve(rootDir, filePath))) {
    return false;
  }

  const sql = readFileSync(resolve(rootDir, filePath), "utf8")
    .split("\n")
    .filter((line) => !line.trim().startsWith("--"))
    .join("\n")
    .trim();

  return sql.length > 0;
}

function removeIfExists(filePath) {
  rmSync(resolve(rootDir, filePath), { force: true });
}

function run(command, description) {
  return new Promise((resolvePromise, reject) => {
    console.log(`\n[AlwaysTrack Setup] ${description}...`);
    exec(command, { cwd: rootDir, env }, (error, stdout, stderr) => {
      if (stdout.trim()) {
        console.log(stdout.trim());
      }

      if (error) {
        if (stderr.trim()) {
          console.error(stderr.trim());
        }
        reject(new Error(`${description} falhou`));
        return;
      }

      console.log(`[AlwaysTrack Setup] OK: ${description}`);
      resolvePromise(stdout);
    });
  });
}

function spawnService(name, command, args, colorCode) {
  const child = spawn(command, args, {
    cwd: rootDir,
    env,
    shell: false,
    stdio: ["inherit", "pipe", "pipe"]
  });

  const prefix = `\u001b[${colorCode}m[${name}]\u001b[0m`;
  child.stdout.on("data", (chunk) => {
    process.stdout.write(`${prefix} ${chunk}`);
  });
  child.stderr.on("data", (chunk) => {
    process.stderr.write(`${prefix} ${chunk}`);
  });
  child.on("exit", (code) => {
    if (code !== null && code !== 0) {
      console.error(`${prefix} exited with code ${code}`);
    }
  });

  return child;
}

function openUrl(url) {
  const command =
    process.platform === "darwin"
      ? `open ${url}`
      : process.platform === "win32"
        ? `start ${url}`
        : `xdg-open ${url}`;

  exec(command, { cwd: rootDir }, () => {
    // Browser opening is best effort only.
  });
}

async function prepareDatabase() {
  await run(`npx prisma generate --schema ${schemaPath}`, "Gerando Prisma Client");

  if (shouldCreateLocalDatabase()) {
    await run(
      `npx prisma migrate diff --from-empty --to-schema-datamodel ${schemaPath} --script > ${fullSchemaSqlPath}`,
      "Gerando SQL do schema atual"
    );
    await run(
      `npx prisma db execute --schema ${schemaPath} --file ${fullSchemaSqlPath}`,
      "Criando banco SQLite local pelo schema atual"
    );
  } else {
    await run(
      `npx prisma migrate diff --from-url ${shellQuote(migrationDatabaseUrl())} --to-schema-datamodel ${schemaPath} --script > ${incrementalSchemaSqlPath}`,
      "Verificando migrations pendentes"
    );

    if (hasExecutableSql(incrementalSchemaSqlPath)) {
      await run(
        `npx prisma db execute --schema ${schemaPath} --file ${incrementalSchemaSqlPath}`,
        "Aplicando migrations pendentes"
      );
    } else {
      console.log("\n[AlwaysTrack Setup] Banco SQLite local ja esta alinhado ao schema atual.");
    }

    removeIfExists(incrementalSchemaSqlPath);
  }

  await run("npm run prisma:seed", "Aplicando seed demo");
}

async function main() {
  console.log("\n====================================================");
  console.log("ALWAYSTRACK - STARTUP LOCAL");
  console.log("====================================================\n");

  await run("fuser -k 3333/tcp 5173/tcp 5555/tcp 2>/dev/null || true", "Limpando portas locais do app");
  await prepareDatabase();

  if (setupOnly) {
    console.log("\n[AlwaysTrack Setup] Setup finalizado. Use `npm run up` para subir API, Web e Prisma Studio.");
    return;
  }

  console.log("\n[AlwaysTrack Setup] Iniciando servicos...");
  const processes = [
    spawnService("api", "npm", ["run", "dev:api"], "34"),
    spawnService("web", "npm", ["run", "dev:web"], "32")
  ];

  if (!noStudio) {
    processes.push(
      spawnService("studio", "npx", ["prisma", "studio", `--schema=${schemaPath}`, "--browser", "none"], "35")
    );
  }

  setTimeout(() => {
    console.log("\n[AlwaysTrack Setup] URLs:");
    console.log("- Web: http://localhost:5173");
    console.log("- API: http://localhost:3333/health");
    if (!noStudio) {
      console.log("- Prisma Studio: http://localhost:5555");
    }

    if (!process.argv.includes("--no-open")) {
      openUrl("http://localhost:5173");
      if (!noStudio) {
        openUrl("http://localhost:5555");
      }
    }
  }, 2500);

  process.on("SIGINT", () => {
    console.log("\n[AlwaysTrack Setup] Encerrando servicos...");
    for (const child of processes) {
      child.kill("SIGINT");
    }
    process.exit(0);
  });
}

main().catch((error) => {
  console.error("\n[AlwaysTrack Setup] Erro:", error.message);
  process.exit(1);
});
