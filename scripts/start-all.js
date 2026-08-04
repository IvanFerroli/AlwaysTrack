import { exec, spawn } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  artifactsAreFresh,
  browserUrlsToOpen,
  buildWorkbenchHtml,
  createWorkbenchServer,
  latestFile,
  openBrowserUrls,
  presentationUrls
} from "./local-workbench.mjs";
import { evidenceOptions } from "./start-all-options.mjs";

const rootDir = resolve(import.meta.dirname, "..");
const schemaPath = "services/api/prisma/schema.prisma";
const devDatabasePath = "services/api/prisma/dev.db";
const fullSchemaSqlPath = ".tmp-alwaystrack-dev-schema.sql";
const incrementalSchemaSqlPath = ".tmp-alwaystrack-dev-migration.sql";
const localWorkbenchPath = "docs/generated/local-workbench/index.html";
const setupOnly = process.argv.includes("--setup-only");
const noStudio = process.argv.includes("--no-studio");
const noDocs = process.argv.includes("--no-docs");
const noOpen = process.argv.includes("--no-open");
const skipInstall = process.argv.includes("--skip-install") || process.argv.includes("--no-install");
const { noPerfSmoke, noCoverage, noE2e, refreshArtifacts } = evidenceOptions(process.argv.slice(2));
const noSmartScript = process.argv.includes("--no-smartscript");
const noSmartScriptDemo = process.argv.includes("--no-smartscript-demo");
const hubOnly = process.argv.includes("--hub-only");
const openAll = process.argv.includes("--open-all");
const allowRemoteDatabase = process.argv.includes("--allow-remote-database");
const defaultDatabaseUrl = "file:./dev.db";
const devSeedPassword = "AlwaysTrackDev123!";
function envOrDefault(name, fallback) {
  const value = process.env[name];
  return typeof value === "string" && value.trim() ? value : fallback;
}

function loadDotEnv(filePath = resolve(rootDir, ".env")) {
  if (!existsSync(filePath)) return;
  for (const line of readFileSync(filePath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const [key, ...rest] = trimmed.split("=");
    if (process.env[key]) continue;
    process.env[key] = rest.join("=").trim().replace(/^['"]|['"]$/g, "");
  }
}

loadDotEnv();

const workbenchPort = Number(envOrDefault("WORKBENCH_PORT", "4173"));
const webPort = Number(envOrDefault("WEB_PORT", "5173"));
const studioPort = Number(envOrDefault("STUDIO_PORT", "5555"));

const env = {
  ...process.env,
  DATABASE_URL: envOrDefault("DATABASE_URL", defaultDatabaseUrl),
  ALWAYSTRACK_API_URL: envOrDefault("ALWAYSTRACK_API_URL", `http://localhost:${envOrDefault("API_PORT", "3333")}`),
  SESSION_SECRET: envOrDefault("SESSION_SECRET", "dev-session-secret"),
  API_PORT: envOrDefault("API_PORT", "3333"),
  SEED_ADMIN_PASSWORD: envOrDefault("SEED_ADMIN_PASSWORD", devSeedPassword),
  SEED_SAC_PASSWORD: envOrDefault("SEED_SAC_PASSWORD", devSeedPassword),
  SEED_FINANCEIRO_PASSWORD: envOrDefault("SEED_FINANCEIRO_PASSWORD", devSeedPassword),
  SEED_SELLER_PASSWORD: envOrDefault("SEED_SELLER_PASSWORD", devSeedPassword),
  SEED_SUPERVISOR_PASSWORD: envOrDefault("SEED_SUPERVISOR_PASSWORD", devSeedPassword),
  SEED_RT_PASSWORD: envOrDefault("SEED_RT_PASSWORD", devSeedPassword),
  ALWAYSTRACK_EMAIL: envOrDefault("ALWAYSTRACK_EMAIL", "sac@example.com"),
  ALWAYSTRACK_PASSWORD: envOrDefault("ALWAYSTRACK_PASSWORD", envOrDefault("SEED_SAC_PASSWORD", devSeedPassword))
};

function shellQuote(value) {
  if (process.platform === "win32") return `"${value.replaceAll('"', '""')}"`;
  return `'${value.replaceAll("'", "'\\''")}'`;
}

function shouldCreateLocalDatabase() {
  return env.DATABASE_URL === defaultDatabaseUrl && !existsSync(resolve(rootDir, devDatabasePath));
}

function migrationDatabaseUrl() {
  if (env.DATABASE_URL === defaultDatabaseUrl) {
    return `file:${resolve(rootDir, devDatabasePath).replaceAll("\\", "/")}`;
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

async function runOptional(command, description) {
  try {
    await run(command, description);
    return true;
  } catch (error) {
    console.warn(`[AlwaysTrack Setup] Aviso: ${error.message}. O hub marcara o artefato como ausente ou desatualizado.`);
    return false;
  }
}

function dependenciesAreCurrent() {
  return artifactsAreFresh(rootDir, ["node_modules/.package-lock.json"], ["package-lock.json", "package.json"]);
}

function docsAreCurrent() {
  return artifactsAreFresh(
    rootDir,
    ["docs/generated/typedoc/index.html"],
    ["typedoc.json", "tsconfig.typedoc.json", "packages/shared/src"]
  );
}

const coverageWorkspaces = [
  "packages/shared",
  "apps/companion-extension",
  "apps/smartscript-companion",
  "apps/web",
  "services/api",
  "services/companion-host"
];

function coverageIsCurrent() {
  return coverageWorkspaces.every((workspace) =>
    artifactsAreFresh(
      rootDir,
      [`${workspace}/coverage/index.html`, `${workspace}/coverage/coverage-summary.json`],
      [`${workspace}/src`, `${workspace}/test`, `${workspace}/vitest.config.ts`, "package-lock.json"]
    )
  );
}

function e2eReportIsCurrent() {
  return artifactsAreFresh(
    rootDir,
    ["playwright-report/index.html"],
    ["playwright.config.ts", "tests/e2e", "apps/web/src", "services/api/src"]
  );
}

function performanceReportIsCurrent() {
  const latest = latestFile(rootDir, "docs/performance/reports", (name) => name.endsWith(".html"));
  if (!latest) return false;
  const relative = latest.slice(rootDir.length + 1);
  return artifactsAreFresh(
    rootDir,
    [relative],
    ["scripts/perf-report.js", "tests/performance/alwaystrack-smoke.yml"],
    24 * 60 * 60 * 1000
  );
}

async function preparePresentationArtifacts() {
  if (!noDocs) {
    if (refreshArtifacts || !docsAreCurrent()) {
      await run("npm run docs:api", "Gerando documentacao TypeDoc");
    } else {
      console.log("\n[AlwaysTrack Setup] TypeDoc ja esta atualizado.");
    }
  }

  if (!noCoverage) {
    if (refreshArtifacts || !coverageIsCurrent()) {
      await runOptional("npm run coverage:html", "Gerando coverage HTML dos seis workspaces");
    } else {
      console.log("\n[AlwaysTrack Setup] Coverage dos seis workspaces ja esta atualizado.");
    }
    await runOptional("npm run coverage:manifest", "Atualizando manifesto comparativo de coverage");
  }

  if (!noE2e) {
    if (refreshArtifacts || !e2eReportIsCurrent()) {
      await runOptional("npm run test:e2e", "Gerando relatorio Playwright navegavel");
    } else {
      console.log("\n[AlwaysTrack Setup] Relatorio Playwright ja esta atualizado.");
    }
  }

  writeLocalWorkbenchPage();
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

const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
const npxCommand = process.platform === "win32" ? "npx.cmd" : "npx";

function runDetached(name, command, args, colorCode) {
  console.log(`\n[AlwaysTrack Setup] Rodando ${name} em background...`);
  return spawnService(name, command, args, colorCode);
}

function writeLocalWorkbenchPage() {
  const outputPath = resolve(rootDir, localWorkbenchPath);
  mkdirSync(resolve(rootDir, "docs/generated/local-workbench"), { recursive: true });
  writeFileSync(outputPath, buildWorkbenchHtml(rootDir, {
    apiPort: env.API_PORT,
    webPort,
    studioPort,
    includeStudio: !noStudio,
    includeDocs: !noDocs,
    includeCoverage: !noCoverage,
    includeE2e: !noE2e,
    includePerformance: !noPerfSmoke
  }));
  return outputPath;
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

async function bootstrapSmartScriptAfterApi() {
  if (noSmartScript) return;
  const ready = await waitForUrl(`http://localhost:${env.API_PORT}/health`, { timeoutMs: 45_000 });
  if (!ready) {
    console.warn("\n[AlwaysTrack Setup] API nao respondeu a tempo; bootstrap SmartScript nao foi executado.");
    return;
  }
  const command = noSmartScriptDemo ? "npm run smartscript:bootstrap -- --no-demo" : "npm run smartscript:bootstrap";
  try {
    await run(command, "Deixando SmartScript pronto para uso");
  } catch (error) {
    console.warn(`\n[AlwaysTrack Setup] SmartScript nao ficou 100% pronto automaticamente: ${error.message}`);
    console.warn("[AlwaysTrack Setup] App continua rodando; confira `npm run smartscript:status`.");
  }
}

async function prepareDatabase() {
  if (!env.DATABASE_URL.startsWith("file:") && !allowRemoteDatabase) {
    throw new Error(
      "DATABASE_URL nao local detectada. Use SQLite local ou confirme conscientemente com --allow-remote-database"
    );
  }
  try {
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
    }

    await run("npm run prisma:seed", "Aplicando seed local");
    await run("npm run job:announcement-scheduler", "Materializando avisos recorrentes locais");
  } finally {
    removeIfExists(fullSchemaSqlPath);
    removeIfExists(incrementalSchemaSqlPath);
  }
}

async function serviceIsReady(url, timeoutMs = 800) {
  return waitForUrl(url, { timeoutMs, intervalMs: 150 });
}

async function ensureService({ name, url, start, processes }) {
  if (await serviceIsReady(url)) {
    console.log(`[AlwaysTrack Setup] Reutilizando ${name} ja saudavel em ${url}.`);
    return false;
  }
  const child = start();
  processes.push(child);
  if (!(await waitForUrl(url, { timeoutMs: 45_000 }))) {
    child.kill("SIGTERM");
    throw new Error(`${name} nao ficou pronto em ${url}; verifique conflito de porta e logs acima`);
  }
  console.log(`[AlwaysTrack Setup] ${name} pronto em ${url}.`);
  return true;
}

async function ensureWorkbench(servers) {
  const markerUrl = `http://127.0.0.1:${workbenchPort}/__alwaystrack_workbench`;
  try {
    const marker = await fetch(markerUrl, { signal: AbortSignal.timeout(800) });
    const body = marker.ok ? await marker.json() : null;
    if (body?.service === "alwaystrack-workbench" && body?.status === "ready") {
      console.log(`[AlwaysTrack Setup] Reutilizando hub ja saudavel em http://localhost:${workbenchPort}.`);
      return;
    }
  } catch {
    // Start a workbench when the marker is absent.
  }
  const { server } = createWorkbenchServer(rootDir, {
    port: workbenchPort,
    apiPort: env.API_PORT,
    webPort,
    studioPort,
    includeStudio: !noStudio,
    includeDocs: !noDocs,
    includeCoverage: !noCoverage,
    includeE2e: !noE2e,
    includePerformance: !noPerfSmoke
  });
  await new Promise((resolvePromise, reject) => {
    server.once("error", reject);
    server.listen(workbenchPort, "127.0.0.1", () => {
      server.off("error", reject);
      resolvePromise();
    });
  });
  servers.push(server);
  console.log(`[AlwaysTrack Setup] Hub pronto em http://localhost:${workbenchPort}.`);
}

function printAndOpenPresentation() {
  const urls = presentationUrls(rootDir, {
    apiPort: env.API_PORT,
    webPort,
    studioPort,
    workbenchPort,
    includeStudio: !noStudio,
    includeDocs: !noDocs,
    includeCoverage: !noCoverage,
    includeE2e: !noE2e,
    includePerformance: !noPerfSmoke
  });
  console.log("\n[AlwaysTrack Setup] Superficies da apresentacao:");
  for (const url of urls) console.log(`- ${url}`);
  if (noOpen) {
    console.log("[AlwaysTrack Setup] Abertura automatica desativada por --no-open.");
    return;
  }
  const selected = browserUrlsToOpen(urls, { openAll, hubOnly });
  console.log(`[AlwaysTrack Setup] Abrindo ${selected.length} aba(s) no navegador${selected.length === 1 ? " (Hub integrado)" : " (--open-all)"}.`);
  openBrowserUrls(selected);
}

function installSignalHandlers(processes, servers) {
  let stopping = false;
  const shutdown = async (signal) => {
    if (stopping) return;
    stopping = true;
    console.log(`\n[AlwaysTrack Setup] ${signal}: encerrando somente servicos desta sessao...`);
    for (const child of processes) child.kill("SIGTERM");
    await Promise.all(servers.map((server) => new Promise((resolvePromise) => {
      server.close(resolvePromise);
      server.closeAllConnections?.();
    })));
    if (!noSmartScript) {
      try {
        await run("npm run smartscript:stop", "Desativando SmartScript Local Companion");
      } catch {
        // Shutdown remains best effort.
      }
    }
    process.exit(0);
  };
  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

async function main() {
  console.log("\n====================================================");
  console.log("ALWAYSTRACK - STARTUP LOCAL");
  console.log("====================================================\n");

  if (!skipInstall && (refreshArtifacts || !dependenciesAreCurrent())) {
    await run("npm install", "Instalando/atualizando dependencias conforme lockfile");
  } else if (!skipInstall) {
    console.log("\n[AlwaysTrack Setup] Dependencias ja estao alinhadas ao lockfile.");
  } else {
    console.log("\n[AlwaysTrack Setup] Pulando npm install por flag --skip-install.");
  }

  await prepareDatabase();
  await preparePresentationArtifacts();

  if (setupOnly) {
    console.log("\n[AlwaysTrack Setup] Setup finalizado sem tocar nos processos em execucao. Use `npm run up` para subir a bancada.");
    return;
  }

  if (!noSmartScript) {
    await run("npm run smartscript:start", "Ativando SmartScript Local Companion");
    await run("npm run smartscript:espanso", "Preparando Espanso para SmartScript");
  } else {
    console.log("\n[AlwaysTrack Setup] SmartScript Local Companion desativado por flag --no-smartscript.");
  }

  console.log("\n[AlwaysTrack Setup] Detectando e iniciando somente servicos ausentes...");
  const processes = [];
  const servers = [];
  installSignalHandlers(processes, servers);
  await ensureService({
    name: "API",
    url: `http://127.0.0.1:${env.API_PORT}/health/ready`,
    start: () => spawnService("api", npmCommand, ["run", "dev:api"], "34"),
    processes
  });
  await ensureService({
    name: "Web",
    url: `http://127.0.0.1:${webPort}`,
    start: () => spawnService("web", npmCommand, ["run", "dev", "--workspace", "@alwaystrack/web", "--", "--port", String(webPort), "--strictPort"], "32"),
    processes
  });
  if (!noStudio) {
    await ensureService({
      name: "Prisma Studio",
      url: `http://127.0.0.1:${studioPort}`,
      start: () => spawnService("studio", npxCommand, ["prisma", "studio", `--schema=${schemaPath}`, "--port", String(studioPort), "--browser", "none"], "35"),
      processes
    });
  }
  await ensureWorkbench(servers);

  await bootstrapSmartScriptAfterApi();
  writeLocalWorkbenchPage();
  printAndOpenPresentation();

  if (!noPerfSmoke && (refreshArtifacts || !performanceReportIsCurrent())) {
    const perf = runDetached(
      "perf",
      "node",
      ["scripts/perf-report.js", "smoke", `--target=http://127.0.0.1:${env.API_PORT}`, "--quiet", "--no-open"],
      "36"
    );
    processes.push(perf);
    perf.on("exit", (code) => {
      if (code === 0) {
        console.log("\n[AlwaysTrack Setup] Smoke de carga local concluido; o hub ja reflete o novo relatorio.");
        writeLocalWorkbenchPage();
        if (!noOpen && openAll && !hubOnly) {
          const latestPerfHtml = latestFile(rootDir, "docs/performance/reports", (name) => name.endsWith(".html"));
          if (latestPerfHtml) {
            const relative = latestPerfHtml.slice(rootDir.length + 1).split("\\").join("/");
            openBrowserUrls([`http://localhost:${workbenchPort}/files/${relative}`]);
          }
        }
      } else {
        console.warn("\n[AlwaysTrack Setup] Smoke de carga local terminou com falha. O app continua rodando.");
      }
    });
  } else if (!noPerfSmoke) {
    console.log("\n[AlwaysTrack Setup] Relatorio de carga das ultimas 24 horas ja esta atualizado.");
  } else {
    console.log("\n[AlwaysTrack Setup] Smoke de carga local desativado por flag --no-perf-smoke.");
  }
}

main().catch((error) => {
  console.error("\n[AlwaysTrack Setup] Erro:", error.message);
  process.exit(1);
});
