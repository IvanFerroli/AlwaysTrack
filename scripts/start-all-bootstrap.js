import { spawnSync } from "node:child_process";
import { existsSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const defaultRootDir = resolve(import.meta.dirname, "..");

function newestSourceMtime(rootDir) {
  return Math.max(
    statSync(resolve(rootDir, "package.json")).mtimeMs,
    statSync(resolve(rootDir, "package-lock.json")).mtimeMs
  );
}

export function dependenciesAreCurrent(rootDir = defaultRootDir) {
  const installedLock = resolve(rootDir, "node_modules/.package-lock.json");
  const requiredPackages = [
    resolve(rootDir, "node_modules/typescript/package.json"),
    resolve(rootDir, "node_modules/prisma/package.json"),
    resolve(rootDir, "node_modules/tsx/package.json")
  ];
  if (!existsSync(installedLock) || requiredPackages.some((packagePath) => !existsSync(packagePath))) return false;
  return statSync(installedLock).mtimeMs >= newestSourceMtime(rootDir);
}

export function dependencyInstallPlan(rootDir = defaultRootDir, argv = []) {
  if (dependenciesAreCurrent(rootDir)) return null;
  if (argv.includes("--skip-install") || argv.includes("--no-install")) {
    throw new Error("Dependencias ausentes ou desatualizadas. Remova --skip-install ou rode npm install.");
  }
  return existsSync(resolve(rootDir, "node_modules")) ? ["install"] : ["ci"];
}

function assertSupportedNode() {
  const major = Number(process.versions.node.split(".")[0]);
  if (!Number.isInteger(major) || major < 22) {
    throw new Error(`Node.js 22+ e obrigatorio; versao atual: ${process.versions.node}.`);
  }
}

export async function bootstrapStartAll({ rootDir = defaultRootDir, argv = process.argv.slice(2) } = {}) {
  assertSupportedNode();
  const installArgs = dependencyInstallPlan(rootDir, argv);
  if (installArgs) {
    const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
    console.log(`\n[AlwaysTrack Bootstrap] Preparando dependencias com npm ${installArgs.join(" ")}...`);
    const result = spawnSync(npmCommand, installArgs, {
      cwd: rootDir,
      env: process.env,
      stdio: "inherit"
    });
    if (result.error) throw result.error;
    if (result.status !== 0) throw new Error(`npm ${installArgs.join(" ")} falhou com codigo ${result.status}.`);
  }

  await import(pathToFileURL(resolve(rootDir, "scripts/start-all.js")).href);
}

const entrypoint = process.argv[1] ? resolve(process.argv[1]) : "";
if (entrypoint && entrypoint === fileURLToPath(import.meta.url)) {
  bootstrapStartAll().catch((error) => {
    console.error(`\n[AlwaysTrack Bootstrap] Erro: ${error instanceof Error ? error.message : error}`);
    process.exitCode = 1;
  });
}
