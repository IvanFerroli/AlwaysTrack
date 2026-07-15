import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import test from "node:test";

import {
  RecoveryDrillError,
  assertProtocolCompatibility,
  assertTemporaryRoot,
  createChecksumManifest,
  runRecoveryDrill,
  verifyChecksumManifest
} from "../../scripts/recovery/restore-drill-core.mjs";

const repoRoot = resolve(import.meta.dirname, "../..");

test("checksum manifest detects changed and additional files", async (t) => {
  const root = await mkdtemp(join(tmpdir(), "restore-checksum-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  await writeFile(join(root, "fixture.json"), "{}\n");
  const manifest = await createChecksumManifest(root);
  await verifyChecksumManifest(root, manifest);

  await writeFile(join(root, "fixture.json"), "tampered\n");
  await assert.rejects(() => verifyChecksumManifest(root, manifest), { code: "CHECKSUM_MISMATCH" });
  await writeFile(join(root, "fixture.json"), "{}\n");
  await writeFile(join(root, "unexpected.json"), "{}\n");
  await assert.rejects(() => verifyChecksumManifest(root, manifest), { code: "CHECKSUM_MISMATCH" });
});

test("protocol compatibility fails closed", () => {
  assert.throws(
    () => assertProtocolCompatibility({ protocolVersion: "1", compatibility: { companionHost: "1", companionExtension: "2" } }),
    { code: "PROTOCOL_INCOMPATIBLE" }
  );
});

test("drill refuses a work root outside the operating system temporary directory", async () => {
  await assert.rejects(() => assertTemporaryRoot(repoRoot), { code: "UNSAFE_ROOT" });
  await assert.rejects(() => assertTemporaryRoot(tmpdir()), { code: "UNSAFE_ROOT" });
});

test("drill refuses a non-empty temporary work root", async (t) => {
  const root = await mkdtemp(join(tmpdir(), "restore-nonempty-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  await writeFile(join(root, "existing"), "do-not-touch");
  await assert.rejects(() => assertTemporaryRoot(root), { code: "UNSAFE_ROOT" });
});

test("coordinated local restore reconciles SQLite, files, config and Companion rollback", { timeout: 60_000 }, async () => {
  const report = await runRecoveryDrill({ repoRoot });
  assert.equal(report.status, "PASSED");
  assert.equal(report.evidenceClassification, "local/fake");
  assert.equal(report.productionReadiness, "LOCAL_ONLY");
  assert.equal(report.checks.snapshotChecksum, true);
  assert.deepEqual(report.checks.sqlite, {
    integrity: "ok",
    foreignKeyViolations: 0,
    caseCount: 1,
    sourceCount: 1,
    runCount: 1,
    factCount: 1,
    duplicateActions: 0
  });
  assert.equal(report.checks.storage, true);
  assert.equal(report.checks.config, true);
  assert.equal(report.checks.companionRollback, true);
  assert.equal(report.checks.promoted, true);
  assert.equal(report.metrics.rpoMet, true);
  assert.equal(report.metrics.rtoMet, true);
});

test("checksum corruption blocks restore before promotion", { timeout: 60_000 }, async () => {
  await assert.rejects(
    () => runRecoveryDrill({ repoRoot, fault: "checksum" }),
    (error) => {
      assert.ok(error instanceof RecoveryDrillError);
      assert.equal(error.code, "CHECKSUM_MISMATCH");
      assert.equal(error.report.status, "FAILED");
      assert.equal(error.report.productionReadiness, "BLOCKED");
      assert.equal(error.report.checks.promoted, false);
      return true;
    }
  );
});

test("checksum-valid but incompatible Companion rollback blocks promotion", { timeout: 60_000 }, async () => {
  await assert.rejects(
    () => runRecoveryDrill({ repoRoot, fault: "protocol" }),
    (error) => {
      assert.equal(error.code, "PROTOCOL_INCOMPATIBLE");
      assert.equal(error.report.checks.snapshotChecksum, true);
      assert.equal(error.report.checks.companionRollback, false);
      assert.equal(error.report.checks.promoted, false);
      assert.equal(error.report.productionReadiness, "BLOCKED");
      return true;
    }
  );
});

test("missed recovery objective blocks promotion", { timeout: 60_000 }, async () => {
  const instant = new Date("2026-07-15T12:00:00.000Z");
  await assert.rejects(
    () => runRecoveryDrill({
      repoRoot,
      now: () => instant,
      recoveryPointAt: new Date(instant.getTime() - 1_001),
      incidentAt: instant,
      thresholds: { rpoMs: 1_000, rtoMs: 1_000 }
    }),
    (error) => {
      assert.equal(error.code, "RECOVERY_OBJECTIVE_MISSED");
      assert.equal(error.report.metrics.rpoMet, false);
      assert.equal(error.report.checks.promoted, false);
      assert.equal(error.report.productionReadiness, "BLOCKED");
      return true;
    }
  );
});

test("caller-owned temporary root remains inspectable after a failed drill", { timeout: 60_000 }, async () => {
  const parent = await mkdtemp(join(tmpdir(), "restore-cleanup-"));
  const root = join(parent, "owned-root");
  await mkdir(root);
  try {
    await assert.rejects(() => runRecoveryDrill({ repoRoot, workRoot: root, fault: "database" }));
    const report = JSON.parse(await readFile(join(root, "backup", "coordinated-snapshot.manifest.json"), "utf8"));
    assert.equal(report.classification, "local/fake");
  } finally {
    await rm(parent, { recursive: true, force: true });
  }
});
