import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import {
  cp,
  lstat,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  realpath,
  rename,
  rm,
  stat,
  writeFile
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, relative, resolve, sep } from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const SCHEMA_PATH = "services/api/prisma/schema.prisma";
const PROTOCOL_VERSION = "1";
const DEFAULT_THRESHOLDS = Object.freeze({ rpoMs: 60 * 60 * 1000, rtoMs: 2 * 60 * 60 * 1000 });

export class RecoveryDrillError extends Error {
  constructor(code, message, report = undefined) {
    super(message);
    this.name = "RecoveryDrillError";
    this.code = code;
    this.report = report;
  }
}

export function sha256(content) {
  return createHash("sha256").update(content).digest("hex");
}

async function fileSha256(path) {
  return sha256(await readFile(path));
}

async function listFiles(root, current = root) {
  const entries = await readdir(current, { withFileTypes: true });
  const files = [];
  for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
    const path = join(current, entry.name);
    if (entry.isSymbolicLink()) {
      throw new RecoveryDrillError("UNSAFE_ARTIFACT", `Symbolic links are forbidden in drill resources: ${entry.name}`);
    }
    if (entry.isDirectory()) files.push(...await listFiles(root, path));
    else if (entry.isFile()) files.push(relative(root, path));
  }
  return files;
}

export async function createChecksumManifest(root, metadata = {}) {
  const files = await listFiles(root);
  return {
    schemaVersion: "1.0.0",
    ...metadata,
    files: await Promise.all(files.map(async (path) => ({
      path,
      bytes: (await stat(join(root, path))).size,
      sha256: await fileSha256(join(root, path))
    })))
  };
}

export async function verifyChecksumManifest(root, manifest) {
  const expectedPaths = manifest.files.map((file) => file.path).sort();
  const actualPaths = await listFiles(root);
  if (JSON.stringify(actualPaths) !== JSON.stringify(expectedPaths)) {
    throw new RecoveryDrillError("CHECKSUM_MISMATCH", "Snapshot file inventory differs from its checksum manifest.");
  }
  for (const expected of manifest.files) {
    const path = join(root, expected.path);
    const info = await stat(path);
    const digest = await fileSha256(path);
    if (info.size !== expected.bytes || digest !== expected.sha256) {
      throw new RecoveryDrillError("CHECKSUM_MISMATCH", `Checksum validation failed for ${expected.path}.`);
    }
  }
  return true;
}

export function assertProtocolCompatibility(release, expected = PROTOCOL_VERSION) {
  const versions = [release.protocolVersion, release.compatibility?.companionHost, release.compatibility?.companionExtension];
  if (versions.some((version) => version !== expected)) {
    throw new RecoveryDrillError("PROTOCOL_INCOMPATIBLE", "Companion rollback artifacts do not share the required protocol version.");
  }
}

export async function assertTemporaryRoot(path) {
  const temporaryRoot = await realpath(tmpdir());
  const candidateRoot = await realpath(path);
  if (candidateRoot === temporaryRoot || !candidateRoot.startsWith(`${temporaryRoot}${sep}`)) {
    throw new RecoveryDrillError("UNSAFE_ROOT", "Recovery drills may run only below the operating system temporary directory.");
  }
  const info = await lstat(path);
  if (!info.isDirectory() || info.isSymbolicLink()) {
    throw new RecoveryDrillError("UNSAFE_ROOT", "Recovery drill root must be a real temporary directory.");
  }
  if ((await readdir(path)).length > 0) {
    throw new RecoveryDrillError("UNSAFE_ROOT", "Recovery drill root must be empty before execution.");
  }
}

async function writeJson(path, value) {
  await mkdir(dirname(path), { recursive: true, mode: 0o700 });
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, { encoding: "utf8", mode: 0o600 });
}

async function migrateDatabase(repoRoot, databasePath) {
  const env = { ...process.env, DATABASE_URL: `file:${databasePath}` };
  const { stdout: schemaSql } = await execFileAsync(
    "npx",
    ["prisma", "migrate", "diff", "--from-empty", "--to-schema-datamodel", SCHEMA_PATH, "--script"],
    {
      cwd: repoRoot,
      env,
      maxBuffer: 10 * 1024 * 1024
    }
  );
  const schemaSqlPath = join(dirname(databasePath), "schema.sql");
  await writeFile(schemaSqlPath, schemaSql, { encoding: "utf8", mode: 0o600 });
  await execFileAsync("npx", ["prisma", "db", "execute", "--schema", SCHEMA_PATH, "--file", schemaSqlPath], {
    cwd: repoRoot,
    env,
    maxBuffer: 10 * 1024 * 1024
  });
  await rm(schemaSqlPath, { force: true });
}

async function withDatabase(databasePath, callback) {
  const { PrismaClient } = await import("@prisma/client");
  const client = new PrismaClient({ datasourceUrl: `file:${databasePath}` });
  try {
    return await callback(client);
  } finally {
    await client.$disconnect();
  }
}

async function seedRecoveryFixture(databasePath, recoveryPointAt) {
  await withDatabase(databasePath, async (db) => {
    await db.organization.create({ data: { id: "drill-org", name: "Recovery Drill Organization" } });
    await db.user.create({
      data: {
        id: "drill-user",
        organizationId: "drill-org",
        name: "Recovery Operator",
        email: "recovery-operator@example.invalid",
        passwordHash: "synthetic-not-a-credential",
        role: "ADMIN"
      }
    });
    await db.serviceCase.create({
      data: { id: "drill-case", organizationId: "drill-org", createdByUserId: "drill-user", status: "IN_PROGRESS", summary: "Synthetic recovery fixture" }
    });
    await db.serviceCaseSource.create({
      data: {
        id: "drill-source",
        organizationId: "drill-org",
        caseId: "drill-case",
        kind: "LOCAL_FIXTURE",
        sourceReference: "fixture:recovery",
        observedAt: recoveryPointAt
      }
    });
    await db.serviceCase.update({ where: { id: "drill-case" }, data: { primarySourceId: "drill-source" } });
    await db.connectorDefinition.create({
      data: {
        id: "drill-connector",
        organizationId: "drill-org",
        connectorId: "local-recovery-fixture",
        displayName: "Local recovery fixture",
        version: "1.0.0",
        riskLevel: "LOW",
        domainsJson: "[]",
        capabilitiesJson: "[\"READ\"]",
        forbiddenActionsJson: "[\"WRITE\",\"SUBMIT\"]",
        searchKeysJson: "[\"caseId\"]",
        extractedFieldsJson: "[\"status\"]"
      }
    });
    await db.companionInstallation.create({
      data: {
        id: "drill-installation",
        organizationId: "drill-org",
        userId: "drill-user",
        browserProfileId: "temporary-profile",
        extensionInstanceId: "temporary-extension",
        credentialHash: "synthetic-hash",
        status: "ACTIVE"
      }
    });
    await db.connectorRun.create({
      data: {
        id: "drill-run",
        organizationId: "drill-org",
        caseId: "drill-case",
        connectorDefinitionId: "drill-connector",
        installationId: "drill-installation",
        userId: "drill-user",
        browserProfileId: "temporary-profile",
        status: "SUCCEEDED",
        wave: 1,
        finishedAt: recoveryPointAt
      }
    });
    await db.evidenceFact.create({
      data: {
        id: "drill-fact",
        organizationId: "drill-org",
        caseId: "drill-case",
        connectorRunId: "drill-run",
        key: "status",
        valueJson: "\"RECOVERABLE\"",
        normalizedValueJson: "\"RECOVERABLE\"",
        sourceSystem: "LOCAL_FIXTURE",
        sourceReference: "fixture:recovery",
        observedAt: recoveryPointAt,
        confidence: 1,
        freshness: "CURRENT",
        sensitivity: "INTERNAL",
        acquisition: "READ_ONLY"
      }
    });
  });
}

async function validateDatabase(databasePath) {
  return withDatabase(databasePath, async (db) => {
    const integrityRows = await db.$queryRawUnsafe("PRAGMA integrity_check");
    const foreignKeyRows = await db.$queryRawUnsafe("PRAGMA foreign_key_check");
    const [caseCount, sourceCount, runCount, factCount] = await Promise.all([
      db.serviceCase.count({ where: { id: "drill-case", organizationId: "drill-org" } }),
      db.serviceCaseSource.count({ where: { id: "drill-source", caseId: "drill-case" } }),
      db.connectorRun.count({ where: { id: "drill-run", caseId: "drill-case", status: "SUCCEEDED" } }),
      db.evidenceFact.count({ where: { id: "drill-fact", caseId: "drill-case", connectorRunId: "drill-run" } })
    ]);
    const integrity = integrityRows.length === 1 && Object.values(integrityRows[0]).includes("ok");
    const reconciled = [caseCount, sourceCount, runCount, factCount].every((count) => count === 1);
    if (!integrity || foreignKeyRows.length > 0 || !reconciled) {
      throw new RecoveryDrillError("DATABASE_INVALID", "Restored SQLite integrity or CaseFlow relationship reconciliation failed.");
    }
    return { integrity: "ok", foreignKeyViolations: 0, caseCount, sourceCount, runCount, factCount, duplicateActions: 0 };
  });
}

async function prepareActiveResources(repoRoot, activeRoot, recoveryPointAt) {
  const databasePath = join(activeRoot, "database", "alwaystrack.db");
  await mkdir(dirname(databasePath), { recursive: true, mode: 0o700 });
  await migrateDatabase(repoRoot, databasePath);
  await seedRecoveryFixture(databasePath, recoveryPointAt);

  await writeJson(join(activeRoot, "storage", "caseflow-evidence.json"), {
    classification: "fake",
    caseId: "drill-case",
    runId: "drill-run",
    action: "READ_ONLY"
  });
  await writeJson(join(activeRoot, "config", "caseflow-config.json"), {
    formatVersion: "1.0.0",
    mode: "local-recovery-drill",
    connectorIds: ["local-recovery-fixture"],
    forbiddenActions: ["WRITE", "SUBMIT"]
  });
  await writeJson(join(activeRoot, "companion", "host.json"), { version: "0.1.0", protocolVersion: PROTOCOL_VERSION });
  await writeJson(join(activeRoot, "companion", "extension.json"), { version: "0.1.0", protocolVersion: PROTOCOL_VERSION });
  await writeJson(join(activeRoot, "companion", "release.json"), {
    release: "known-good-local",
    protocolVersion: PROTOCOL_VERSION,
    compatibility: { companionHost: PROTOCOL_VERSION, companionExtension: PROTOCOL_VERSION }
  });
}

async function snapshotResources(activeRoot, backupRoot, metadata) {
  await cp(activeRoot, backupRoot, { recursive: true, errorOnExist: true });
  const manifest = await createChecksumManifest(backupRoot, metadata);
  await writeJson(`${backupRoot}.manifest.json`, manifest);
  return manifest;
}

async function injectIncident(activeRoot) {
  await writeFile(join(activeRoot, "database", "alwaystrack.db"), "corrupted-local-fixture", "utf8");
  await rm(join(activeRoot, "storage"), { recursive: true, force: true });
  await writeJson(join(activeRoot, "config", "caseflow-config.json"), { state: "invalid-incident-state" });
  await writeJson(join(activeRoot, "companion", "release.json"), {
    release: "failed-update",
    protocolVersion: "2",
    compatibility: { companionHost: "2", companionExtension: "1" }
  });
}

async function refreshManifestEntry(backupRoot, manifest, path) {
  const entry = manifest.files.find((file) => file.path === path);
  if (!entry) throw new RecoveryDrillError("FAULT_INJECTION_FAILED", `Missing manifest entry for ${path}.`);
  const absolutePath = join(backupRoot, path);
  entry.bytes = (await stat(absolutePath)).size;
  entry.sha256 = await fileSha256(absolutePath);
}

async function tamperBackup(backupRoot, fault, manifest) {
  if (fault === "checksum") {
    await writeFile(join(backupRoot, "storage", "caseflow-evidence.json"), "tampered", "utf8");
  } else if (fault === "protocol") {
    const relativePath = join("companion", "release.json");
    const releasePath = join(backupRoot, relativePath);
    const release = JSON.parse(await readFile(releasePath, "utf8"));
    release.compatibility.companionExtension = "2";
    await writeJson(releasePath, release);
    await refreshManifestEntry(backupRoot, manifest, relativePath);
  } else if (fault === "database") {
    const relativePath = join("database", "alwaystrack.db");
    await writeFile(join(backupRoot, relativePath), "invalid", "utf8");
    await refreshManifestEntry(backupRoot, manifest, relativePath);
  }
}

function buildReport({ status, startedAt, recoveryPointAt, incidentAt, finishedAt, thresholds, checks, failure }) {
  const rpoMs = incidentAt.getTime() - recoveryPointAt.getTime();
  const rtoMs = finishedAt.getTime() - startedAt.getTime();
  return {
    schemaVersion: "1.0.0",
    drill: "TASK-AT-329",
    status,
    evidenceClassification: "local/fake",
    environment: "isolated-temporary-directory",
    operator: "automated-local-harness",
    startedAt: startedAt.toISOString(),
    recoveryPointAt: recoveryPointAt.toISOString(),
    incidentAt: incidentAt.toISOString(),
    finishedAt: finishedAt.toISOString(),
    metrics: {
      rpoMs,
      rtoMs,
      rpoTargetMs: thresholds.rpoMs,
      rtoTargetMs: thresholds.rtoMs,
      rpoMet: rpoMs <= thresholds.rpoMs,
      rtoMet: rtoMs <= thresholds.rtoMs
    },
    checks,
    failure: failure ? { code: failure.code, message: failure.message } : null,
    productionReadiness: status === "PASSED" ? "LOCAL_ONLY" : "BLOCKED"
  };
}

export async function runRecoveryDrill(options = {}) {
  const repoRoot = resolve(options.repoRoot ?? resolve(import.meta.dirname, "../.."));
  const thresholds = { ...DEFAULT_THRESHOLDS, ...options.thresholds };
  const createdRoot = !options.workRoot;
  const workRoot = options.workRoot
    ? resolve(options.workRoot)
    : await mkdtemp(join(tmpdir(), "alwaystrack-restore-drill-"));
  await assertTemporaryRoot(workRoot);

  const now = options.now ?? (() => new Date());
  const startedAt = now();
  const recoveryPointAt = options.recoveryPointAt ?? new Date(startedAt.getTime() - 5 * 60 * 1000);
  const incidentAt = options.incidentAt ?? startedAt;
  const activeRoot = join(workRoot, "active");
  const backupRoot = join(workRoot, "backup", "coordinated-snapshot");
  const restoredRoot = join(workRoot, "restored", "candidate");
  const promotedRoot = join(workRoot, "promoted");
  const checks = { snapshotChecksum: false, sqlite: null, storage: false, config: false, companionRollback: false, promoted: false };
  let report;

  try {
    await prepareActiveResources(repoRoot, activeRoot, recoveryPointAt);
    const manifest = await snapshotResources(activeRoot, backupRoot, {
      backupId: "local-fake-coordinated-snapshot",
      recoveryPointAt: recoveryPointAt.toISOString(),
      classification: "local/fake"
    });
    await injectIncident(activeRoot);
    await tamperBackup(backupRoot, options.fault, manifest);

    await verifyChecksumManifest(backupRoot, manifest);
    checks.snapshotChecksum = true;
    await cp(backupRoot, restoredRoot, { recursive: true, errorOnExist: true });
    await verifyChecksumManifest(restoredRoot, manifest);

    const release = JSON.parse(await readFile(join(restoredRoot, "companion", "release.json"), "utf8"));
    assertProtocolCompatibility(release);
    checks.companionRollback = true;
    checks.sqlite = await validateDatabase(join(restoredRoot, "database", "alwaystrack.db"));

    const storage = JSON.parse(await readFile(join(restoredRoot, "storage", "caseflow-evidence.json"), "utf8"));
    checks.storage = storage.classification === "fake" && storage.caseId === "drill-case" && storage.runId === "drill-run";
    const config = JSON.parse(await readFile(join(restoredRoot, "config", "caseflow-config.json"), "utf8"));
    checks.config = config.mode === "local-recovery-drill" && config.forbiddenActions.includes("SUBMIT");
    if (!checks.storage || !checks.config) {
      throw new RecoveryDrillError("RECONCILIATION_FAILED", "Restored storage or configuration did not reconcile with the snapshot.");
    }

    const recoveryCompletedAt = now();
    const candidateReport = buildReport({ status: "PASSED", startedAt, recoveryPointAt, incidentAt, finishedAt: recoveryCompletedAt, thresholds, checks });
    if (!candidateReport.metrics.rpoMet || !candidateReport.metrics.rtoMet) {
      throw new RecoveryDrillError("RECOVERY_OBJECTIVE_MISSED", "Observed RPO or RTO exceeded its configured objective.");
    }

    await mkdir(dirname(promotedRoot), { recursive: true, mode: 0o700 });
    await rename(restoredRoot, promotedRoot);
    checks.promoted = true;
    report = buildReport({ status: "PASSED", startedAt, recoveryPointAt, incidentAt, finishedAt: recoveryCompletedAt, thresholds, checks });
    return report;
  } catch (cause) {
    const error = cause instanceof RecoveryDrillError
      ? cause
      : new RecoveryDrillError("DRILL_FAILED", "Unexpected local drill failure; inspect the local command output.");
    report = buildReport({ status: "FAILED", startedAt, recoveryPointAt, incidentAt, finishedAt: now(), thresholds, checks, failure: error });
    error.report = report;
    throw error;
  } finally {
    if (createdRoot && !options.keepTemporary) await rm(workRoot, { recursive: true, force: true });
  }
}
