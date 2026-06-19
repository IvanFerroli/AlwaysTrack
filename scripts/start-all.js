import { exec, spawn } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

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
const noPerfSmoke = process.argv.includes("--no-perf-smoke");
const defaultDatabaseUrl = "file:./dev.db";
const devSeedPassword = "AlwaysTrackDev123!";

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

function openIfExists(filePath) {
  openLocalFile(filePath);
}

function fileUrl(filePath) {
  return pathToFileURL(resolve(rootDir, filePath)).href;
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

function recentFiles(dirPath, predicate, limit = 5) {
  const absolute = resolve(rootDir, dirPath);
  if (!existsSync(absolute)) return [];
  return readdirSync(absolute)
    .map((name) => ({ name, path: resolve(absolute, name) }))
    .filter((item) => {
      try {
        return statSync(item.path).isFile() && predicate(item.name);
      } catch {
        return false;
      }
    })
    .sort((left, right) => statSync(right.path).mtimeMs - statSync(left.path).mtimeMs)
    .slice(0, limit);
}

function htmlEscape(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function maybeFileLink(label, filePath) {
  if (!existsSync(resolve(rootDir, filePath))) {
    return `<span class="muted">${htmlEscape(label)} indisponivel</span>`;
  }
  return `<a href="${fileUrl(filePath)}">${htmlEscape(label)}</a>`;
}

function artifactStatus(label, filePath) {
  const absolute = resolve(rootDir, filePath);
  if (!existsSync(absolute)) {
    return `<div class="status missing"><strong>${htmlEscape(label)}</strong><span>Ausente</span><small>${htmlEscape(filePath)}</small></div>`;
  }
  const modifiedAt = statSync(absolute).mtime;
  return `<div class="status ok"><strong>${htmlEscape(label)}</strong><span>Disponivel</span><small>${htmlEscape(modifiedAt.toLocaleString("pt-BR"))}</small>${maybeFileLink("Abrir", filePath)}</div>`;
}

function siblingReportLinks(filePath) {
  const withoutExtension = filePath.replace(/\.[^.]+$/, "");
  return [
    [".html", "HTML"],
    [".md", "Resumo"],
    [".json", "JSON"],
    [".log", "Log"],
    ["-diagnostics-before.json", "Diag antes"],
    ["-diagnostics-after.json", "Diag depois"]
  ]
    .map(([suffix, label]) => {
      const candidate = `${withoutExtension}${suffix}`;
      return existsSync(candidate) ? `<a href="${pathToFileURL(candidate).href}">${htmlEscape(label)}</a>` : "";
    })
    .join("");
}

function performanceHistory() {
  const reports = recentFiles("docs/performance/reports", (name) => name.endsWith(".html") || name.endsWith(".md"), 12);
  const unique = new Map();
  for (const report of reports) {
    const key = report.name.replace(/\.(html|md)$/, "");
    if (!unique.has(key)) unique.set(key, report);
  }
  const rows = [...unique.values()].slice(0, 5);
  if (!rows.length) return `<span class="muted">Nenhum relatorio gerado ainda; o smoke abrira o HTML ao terminar.</span>`;
  return `<div class="report-list">${rows
    .map((report, index) => {
      const modifiedAt = statSync(report.path).mtime.toLocaleString("pt-BR");
      return `<div class="report-row ${index === 0 ? "latest" : ""}"><div><strong>${htmlEscape(index === 0 ? "Atual" : "Historico")}</strong><span>${htmlEscape(report.name.replace(/\.(html|md)$/, ""))}</span><small>${htmlEscape(modifiedAt)}</small></div><div>${siblingReportLinks(report.path)}</div></div>`;
    })
    .join("")}</div>`;
}

function latestPerformanceLinks() {
  const latestPerfHtml = latestFile("docs/performance/reports", (name) => name.endsWith(".html"));
  const latestPerfSummary = latestFile("docs/performance/reports", (name) => name.endsWith(".md"));
  const links = [];
  if (latestPerfHtml) links.push(`<a href="${pathToFileURL(latestPerfHtml).href}">Ultimo relatorio HTML</a>`);
  if (latestPerfSummary) links.push(`<a href="${pathToFileURL(latestPerfSummary).href}">Resumo Markdown</a>`);
  return links.length ? links.join("") : `<span class="muted">Nenhum relatorio gerado ainda; o smoke abrira o HTML ao terminar.</span>`;
}

function writeLocalWorkbenchPage() {
  const outputPath = resolve(rootDir, localWorkbenchPath);
  mkdirSync(resolve(rootDir, "docs/generated/local-workbench"), { recursive: true });
  writeFileSync(
    outputPath,
    `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>AlwaysTrack Local Workbench</title>
  <style>
    :root { color-scheme: light; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color: #102a33; background: #eef5f5; }
    body { margin: 0; padding: 32px; }
    main { max-width: 1120px; margin: 0 auto; }
    header, section { background: #fff; border: 1px solid #d7e3e7; border-radius: 10px; padding: 24px; margin-bottom: 18px; box-shadow: 0 18px 40px rgba(16, 42, 51, 0.08); }
    h1, h2 { margin: 0 0 10px; line-height: 1.1; }
    p { color: #637083; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 14px; }
    .card { border: 1px solid #d7e3e7; border-radius: 8px; padding: 16px; background: #f8fbfb; }
    .status { border: 1px solid #d7e3e7; border-radius: 8px; padding: 14px; background: #f8fbfb; display: grid; gap: 6px; }
    .status span { font-weight: 900; }
    .status.ok span { color: #0b6b4f; }
    .status.missing span { color: #8a5b00; }
    .report-list { display: grid; gap: 10px; }
    .report-row { border: 1px solid #d7e3e7; border-radius: 8px; padding: 14px; background: #f8fbfb; display: flex; justify-content: space-between; gap: 14px; align-items: center; }
    .report-row.latest { border-color: #0b4c5c; box-shadow: inset 4px 0 0 #0b4c5c; }
    .report-row div:first-child { display: grid; gap: 4px; }
    .report-row span, .status small, .report-row small { color: #637083; overflow-wrap: anywhere; }
    a { display: inline-flex; margin: 6px 8px 6px 0; padding: 10px 12px; border-radius: 7px; border: 1px solid #c7d8de; color: #0b4c5c; text-decoration: none; font-weight: 800; background: #fff; }
    a.primary { background: #0b4c5c; color: #fff; border-color: #0b4c5c; }
    .muted { color: #7a8798; display: block; margin-top: 8px; }
    code { background: #edf4f6; padding: 2px 6px; border-radius: 5px; }
  </style>
</head>
<body>
  <main>
    <header>
      <p>AlwaysTrack Local</p>
      <h1>Bancada de estudo e validacao</h1>
      <p>Gerada por <code>npm run up</code> em ${htmlEscape(new Date().toLocaleString("pt-BR"))}. Use esta pagina como hub unico para abrir app, docs, reports e diagnosticos.</p>
      <a class="primary" href="http://localhost:5173">Abrir aplicativo</a>
      <a href="http://localhost:3333/health">API health</a>
      ${noStudio ? "" : '<a href="http://localhost:5555">Prisma Studio</a>'}
    </header>
    <section>
      <h2>Documentacao</h2>
      <div class="grid">
        <div class="card">${maybeFileLink("TypeDoc", "docs/generated/typedoc/index.html")}${maybeFileLink("Arquitetura de testes/docs", "docs/architecture/testing-and-docs.md")}${maybeFileLink("Auditoria recente", "docs/architecture/recent-test-doc-coverage-audit.md")}</div>
        <div class="card">${maybeFileLink("Estrategia de testes", "docs/testing/strategy.md")}${maybeFileLink("Playwright/CI", "docs/testing/playwright-ci.md")}${maybeFileLink("Performance", "docs/performance/README.md")}</div>
        <div class="card">${maybeFileLink("Gate de exposicao externa", "docs/security/external-exposure-release-gate.md")}${maybeFileLink("Backup e restore", "docs/operations/backup-restore-runbook.md")}${maybeFileLink("Incidente de seguranca", "docs/operations/security-incident-runbook.md")}</div>
      </div>
    </section>
    <section>
      <h2>Stress test local</h2>
      <p>O smoke de carga roda em background depois que a API responde. O HTML abaixo abre automaticamente quando o teste termina.</p>
      ${latestPerformanceLinks()}
      <h2>Historico de carga</h2>
      ${performanceHistory()}
    </section>
    <section>
      <h2>Status dos artefatos</h2>
      <div class="grid">
        ${artifactStatus("Playwright report", "playwright-report/index.html")}
        ${artifactStatus("Playwright report alternativo", "test-results/playwright-report/index.html")}
        ${artifactStatus("Coverage raiz", "coverage/index.html")}
        ${artifactStatus("Coverage API", "services/api/coverage/index.html")}
        ${artifactStatus("Coverage Web", "apps/web/coverage/index.html")}
      </div>
    </section>
  </main>
</body>
</html>
`
  );
  return outputPath;
}

function openGeneratedArtifacts() {
  openLocalFile(localWorkbenchPath);
  openIfExists("docs/generated/typedoc/index.html");
  openIfExists("docs/architecture/testing-and-docs.md");
  openIfExists("docs/testing/strategy.md");
  openIfExists("docs/testing/playwright-ci.md");
  openIfExists("docs/performance/README.md");
  openIfExists("docs/security/external-exposure-release-gate.md");
  openIfExists("docs/operations/backup-restore-runbook.md");
  openIfExists("playwright-report/index.html");
  openIfExists("test-results/playwright-report/index.html");
  openIfExists("coverage/index.html");
  openIfExists("services/api/coverage/index.html");
  openIfExists("apps/web/coverage/index.html");
  const latestPerfHtml = latestFile("docs/performance/reports", (name) => name.endsWith(".html"));
  if (latestPerfHtml) openUrl(pathToFileURL(latestPerfHtml).href);
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
    writeLocalWorkbenchPage();
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
      console.log(`- Bancada local: ${localWorkbenchPath}`);
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
      const perf = runDetached("perf", "node", ["scripts/perf-report.js", "smoke", "--target=http://localhost:3333", "--quiet"], "36");
      processes.push(perf);
      perf.on("exit", (code) => {
        if (code === 0) {
          console.log("\n[AlwaysTrack Setup] Smoke de carga local concluido.");
          if (!noOpen && !noDocs) {
            writeLocalWorkbenchPage();
            const latestPerfHtml = latestFile("docs/performance/reports", (name) => name.endsWith(".html"));
            if (latestPerfHtml) openUrl(pathToFileURL(latestPerfHtml).href);
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
