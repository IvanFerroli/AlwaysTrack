import { exec, spawn } from "node:child_process";
import { existsSync, readdirSync, readFileSync, rmSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const rootDir = resolve(import.meta.dirname, "..");
const schemaPath = "services/api/prisma/schema.prisma";
const devDatabasePath = "services/api/prisma/dev.db";
const fullSchemaSqlPath = ".tmp-alwaystrack-dev-schema.sql";
const incrementalSchemaSqlPath = ".tmp-alwaystrack-dev-migration.sql";
const setupOnly = process.argv.includes("--setup-only");
const noStudio = process.argv.includes("--no-studio");
const noDocs = process.argv.includes("--no-docs");
const noOpen = process.argv.includes("--no-open");
const skipInstall = process.argv.includes("--skip-install") || process.argv.includes("--no-install");
const noPerfSmoke = process.argv.includes("--no-perf-smoke");
const defaultDatabaseUrl = "file:./dev.db";
const devSeedPassword = "AlwaysTrackDev123!";

const env = {
  ...process.env,
  DATABASE_URL: process.env.DATABASE_URL ?? defaultDatabaseUrl,
  SESSION_SECRET: process.env.SESSION_SECRET ?? "dev-session-secret",
  API_PORT: process.env.API_PORT ?? "3333",
  SEED_ADMIN_PASSWORD: process.env.SEED_ADMIN_PASSWORD ?? devSeedPassword,
  SEED_SAC_PASSWORD: process.env.SEED_SAC_PASSWORD ?? devSeedPassword,
  SEED_FINANCEIRO_PASSWORD: process.env.SEED_FINANCEIRO_PASSWORD ?? devSeedPassword,
  SEED_SELLER_PASSWORD: process.env.SEED_SELLER_PASSWORD ?? devSeedPassword,
  SEED_SUPERVISOR_PASSWORD: process.env.SEED_SUPERVISOR_PASSWORD ?? devSeedPassword,
  SEED_RT_PASSWORD: process.env.SEED_RT_PASSWORD ?? devSeedPassword
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

function runDetached(name, command, args, colorCode) {
  console.log(`\n[AlwaysTrack Setup] Rodando ${name} em background...`);
  return spawnService(name, command, args, colorCode);
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

function openLocalFile(filePath) {
  if (!existsSync(resolve(rootDir, filePath))) return;
  openUrl(pathToFileURL(resolve(rootDir, filePath)).href);
}

function latestFile(dirPath, predicate) {
  const absolute = resolve(rootDir, dirPath);
  if (!existsSync(absolute)) return null;
  return readdirSync(absolute)
    .map((name) => ({ name, path: resolve(absolute, name) }))
    .filter((item) => {
      try {
        return statSync(item.path).isFile() && predicate(item.name);
      } catch {
        return false;
      }
    })
    .sort((left, right) => statSync(right.path).mtimeMs - statSync(left.path).mtimeMs)[0]?.path ?? null;
}

function openGeneratedArtifacts() {
  const files = [
    "docs/generated/typedoc/index.html",
    "docs/testing/strategy.md",
    "docs/testing/playwright-ci.md",
    "docs/architecture/testing-and-docs.md",
    "docs/performance/README.md",
    "docs/performance/report-template.md",
    "docs/security/external-exposure-release-gate.md",
    "docs/operations/backup-restore-runbook.md",
    "docs/operations/security-incident-runbook.md",
    "playwright-report/index.html",
    "test-results/playwright-report/index.html",
    "coverage/index.html",
    "services/api/coverage/index.html",
    "apps/web/coverage/index.html"
  ];

  for (const file of files) {
    openLocalFile(file);
  }

  const latestPerfHtml = latestFile("docs/performance/reports", (name) => name.endsWith(".html"));
  const latestPerfSummary = latestFile("docs/performance/reports", (name) => name.endsWith(".md"));
  if (latestPerfHtml) openUrl(pathToFileURL(latestPerfHtml).href);
  if (latestPerfSummary) openUrl(pathToFileURL(latestPerfSummary).href);
}

async function waitForUrl(url, { timeoutMs = 30_000, intervalMs = 750 } = {}) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(url);
      if (response.ok) return true;
    } catch {
      // Keep waiting while the service boots.
    }
    await new Promise((resolvePromise) => setTimeout(resolvePromise, intervalMs));
  }
  return false;
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

  await run("npm run prisma:seed", "Aplicando seed local");
}

async function main() {
  console.log("\n====================================================");
  console.log("ALWAYSTRACK - STARTUP LOCAL");
  console.log("====================================================\n");

  if (!skipInstall) {
    await run("npm install", "Instalando/atualizando dependencias");
  } else {
    console.log("\n[AlwaysTrack Setup] Pulando npm install por flag --skip-install.");
  }

  await run("fuser -k 3333/tcp 5173/tcp 5555/tcp 2>/dev/null || true", "Limpando portas locais do app");
  await prepareDatabase();
  if (!noDocs) {
    await run("npm run docs:api", "Gerando documentacao TypeDoc de onboarding");
  }

  if (setupOnly) {
    console.log("\n[AlwaysTrack Setup] Setup finalizado. Use `npm run up` para subir API, Web, Prisma Studio e bancada de estudo.");
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
    if (!noDocs) {
      console.log("- TypeDoc: docs/generated/typedoc/index.html");
      console.log("- Testes: docs/testing/strategy.md");
      console.log("- Carga: docs/performance/README.md");
      console.log("- Coverage: coverage/index.html, services/api/coverage/index.html ou apps/web/coverage/index.html quando existirem");
      console.log("- Playwright report: playwright-report/index.html quando existir");
      console.log("- Performance report: docs/performance/reports/*.html quando existir");
    }
    if (!noStudio) {
      console.log("- Prisma Studio: http://localhost:5555");
    }

    if (!noOpen) {
      openUrl("http://localhost:5173");
      openUrl("http://localhost:3333/health");
      if (!noStudio) {
        openUrl("http://localhost:5555");
      }
      if (!noDocs) {
        openGeneratedArtifacts();
      }
    }
  }, 2500);

  if (!noPerfSmoke) {
    waitForUrl("http://localhost:3333/health").then((ready) => {
      if (!ready) {
        console.warn("\n[AlwaysTrack Setup] API nao respondeu a tempo; smoke de carga local nao foi iniciado.");
        return;
      }
      const perf = runDetached("perf", "node", ["scripts/perf-report.js", "smoke", "--target=http://localhost:3333"], "36");
      processes.push(perf);
      perf.on("exit", (code) => {
        if (code === 0) {
          console.log("\n[AlwaysTrack Setup] Smoke de carga local concluido.");
          if (!noOpen && !noDocs) {
            const latestPerfHtml = latestFile("docs/performance/reports", (name) => name.endsWith(".html"));
            const latestPerfSummary = latestFile("docs/performance/reports", (name) => name.endsWith(".md"));
            if (latestPerfHtml) openUrl(pathToFileURL(latestPerfHtml).href);
            if (latestPerfSummary) openUrl(pathToFileURL(latestPerfSummary).href);
          }
        } else {
          console.warn("\n[AlwaysTrack Setup] Smoke de carga local terminou com falha. O app continua rodando.");
        }
      });
    });
  } else {
    console.log("\n[AlwaysTrack Setup] Smoke de carga local desativado por flag --no-perf-smoke.");
  }

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
