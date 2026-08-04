import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readFileSync, unlinkSync, utimesSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { dependenciesAreCurrent, dependencyInstallPlan } from "../../scripts/start-all-bootstrap.js";
import { evidenceOptions } from "../../scripts/start-all-options.mjs";

function dependencyFixture({ installed = false, stale = false } = {}) {
  const root = mkdtempSync(join(tmpdir(), "alwaystrack-bootstrap-"));
  writeFileSync(join(root, "package.json"), "{}\n");
  writeFileSync(join(root, "package-lock.json"), "{}\n");
  if (installed) {
    mkdirSync(join(root, "node_modules"), { recursive: true });
    writeFileSync(join(root, "node_modules/.package-lock.json"), "{}\n");
    for (const packageName of ["typescript", "prisma", "tsx"]) {
      mkdirSync(join(root, "node_modules", packageName), { recursive: true });
      writeFileSync(join(root, "node_modules", packageName, "package.json"), "{}\n");
    }
    if (stale) {
      const old = new Date(Date.now() - 10_000);
      utimesSync(join(root, "node_modules/.package-lock.json"), old, old);
    }
  }
  return root;
}

test("uses npm ci for a clean ZIP before loading project dependencies", () => {
  const root = dependencyFixture();
  assert.equal(dependenciesAreCurrent(root), false);
  assert.deepEqual(dependencyInstallPlan(root), ["ci"]);
});

test("refreshes stale node_modules and leaves current dependencies untouched", () => {
  assert.deepEqual(dependencyInstallPlan(dependencyFixture({ installed: true, stale: true })), ["install"]);
  assert.equal(dependencyInstallPlan(dependencyFixture({ installed: true })), null);
});

test("repairs an incomplete install even when its internal lockfile looks current", () => {
  const root = dependencyFixture({ installed: true });
  unlinkSync(join(root, "node_modules/typescript/package.json"));
  assert.equal(dependenciesAreCurrent(root), false);
  assert.deepEqual(dependencyInstallPlan(root), ["install"]);
});

test("fails clearly when install is skipped in a clean ZIP", () => {
  assert.throws(
    () => dependencyInstallPlan(dependencyFixture(), ["--skip-install"]),
    /Dependencias ausentes ou desatualizadas/
  );
});

test("keeps expensive evidence opt-in for the default demo startup", () => {
  assert.deepEqual(evidenceOptions(), {
    refreshArtifacts: false,
    noPerfSmoke: true,
    noCoverage: true,
    noE2e: true
  });
  assert.deepEqual(evidenceOptions(["--with-evidence"]), {
    refreshArtifacts: false,
    noPerfSmoke: false,
    noCoverage: false,
    noE2e: false
  });
});

test("routes up and setup through the dependency-free bootstrap", () => {
  const pkg = JSON.parse(readFileSync(new URL("../../package.json", import.meta.url), "utf8"));
  assert.equal(pkg.scripts.up, "node scripts/start-all-bootstrap.js");
  assert.match(pkg.scripts.setup, /start-all-bootstrap\.js --setup-only/);
});
