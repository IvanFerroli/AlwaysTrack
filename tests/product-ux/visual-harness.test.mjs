import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, symlinkSync, unlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import test from "node:test";
import { normalizeBrowserRuntimeMetadata } from "../../.agents/skills/olympus-product-ux/scripts/bootstrap-browser-runtime.mjs";
import {
  ProductUxHarnessError,
  REPO_ROOT,
  artifactDescriptor,
  atomicWriteJson,
  browserRuntimeLibraryPath,
  buildAdvisoryCaptureRecord,
  buildCanonicalManifest,
  canonicalCommandRecord,
  cliFailureResult,
  classifyScenarioOutcome,
  cleanupIsolatedE2e,
  inspectPngFile,
  isolatedEnvironment,
  publicResultCodeForError,
  readScenarioFile,
  redactText,
  resolveAdvisoryOutputDirectory,
  resolveCaptureAnchor,
  resolveFileFixture,
  resolveOutputDirectory,
  runPreflight,
  sanitizeStepForReport,
  sha256File,
  sensitiveFindings,
  splitReportedSteps,
  validateClassification,
  validateAdvisoryCaptureRecord,
  validateEvidencePack,
  validateLoopbackBaseUrl,
  validateScenarioDocument
} from "../../.agents/skills/olympus-product-ux/scripts/visual-harness-lib.mjs";

const fixture = resolve(REPO_ROOT, "tests/product-ux/fixtures/login-scenario.json");
const uploadFixture = resolve(REPO_ROOT, "tests/product-ux/fixtures/wiki-upload-scenario.json");
const uploadFileFixture = resolve(REPO_ROOT, "tests/product-ux/fixtures/files/wiki-attachment.png");
const validatorCli = resolve(REPO_ROOT, ".agents/skills/olympus-product-ux/scripts/validate-evidence.mjs");
const advisoryValidatorCli = resolve(REPO_ROOT, ".agents/skills/olympus-product-ux/scripts/validate-advisory-capture.mjs");
const baselinePng = resolve(REPO_ROOT, "tests/e2e/visual-responsive-web.desktop.spec.ts-snapshots/web-login-1024x768-desktop-linux.png");

function expectCode(operation, code) {
  assert.throws(operation, (error) => error instanceof ProductUxHarnessError && error.code === code);
}

function validScenarioReport(screenshotSha, png) {
  return {
    reportVersion: "1.0.0",
    evidenceId: "PRODUCT-UX-TEST-001",
    taskId: "TASK-AT-999",
    executionId: "EXEC-AT-999-001",
    capturedAt: "2026-08-05T12:00:00.000Z",
    origin: "product-ux-acquired",
    purpose: "observed-current",
    resultCode: "CAPTURED",
    environment: {
      classification: "fake",
      name: "product-ux-isolated-e2e",
      evidenceOrigin: "product-ux-acquired",
      dataOrigin: "synthetic-seed",
      dataFixture: "isolated-e2e-synthetic-seed"
    },
    browser: { name: "chromium", version: "1.2.3", platform: "linux-x64" },
    source: {
      runtime: "scripts/start-e2e.js",
      navigationHelpers: "tests/e2e/helpers.ts",
      visualHelpers: "tests/e2e/visual-responsive.helpers.ts"
    },
    sourceRevision: { commitSha: "a".repeat(40), dirty: false },
    freshness: {
      status: "fresh",
      checkedAt: "2026-08-05T12:00:00.000Z",
      requestedCommitSha: "a".repeat(40),
      capturedCommitSha: "a".repeat(40),
      reasons: []
    },
    retentionPolicy: {
      mode: "transient-execution",
      owner: "EXEC-AT-999-001",
      disposeOn: "execution-closed",
      disposalEvidenceRequired: false
    },
    inspections: [],
    scenarios: [{
      id: "login-desktop",
      surface: "Login Web",
      state: "default",
      purpose: "observed-current",
      actors: ["ANONYMOUS"],
      viewport: { width: 1024, height: 768, deviceScaleFactor: 1, orientation: "landscape" },
      fixedTime: "2026-08-05T12:00:00.000Z",
      expectedTerminalCondition: "heading Entrar is visible",
      setupSteps: [],
      navigationSteps: [{ type: "goto", path: "/" }],
      finalPath: "/",
      screenshot: { path: "screenshots/login-desktop.png", sha256: screenshotSha, ...png, fullPage: false, maskedElements: 0 },
      geometry: { status: "passed", issues: [] },
      accessibility: {
        status: "passed",
        criticalIssueCounts: {},
        ariaSnapshotSha256: "b".repeat(64),
        ariaSnapshotLines: 4,
        rawSnapshotPersisted: false
      },
      runtime: {
        consoleErrorDigests: [],
        pageErrorDigests: [],
        failedRequestDigests: [],
        blockedRequestDigests: [],
        expectedHttpErrorDigests: [],
        unexpectedHttpErrorDigests: [],
        setupErrorDigest: null
      },
      acquisitionStatus: "captured",
      assessmentSignals: {
        status: "clear",
        geometry: "passed",
        accessibility: "passed",
        runtimeFindingCount: 0,
        unexpectedConsoleErrors: 0
      },
      limitations: ["Human PNG inspection remains required."]
    }],
    limitations: ["Fake evidence does not prove production."]
  };
}

function createValidPack() {
  const pack = mkdtempSync(resolve(tmpdir(), "alwaystrack-product-ux-"));
  const screenshots = resolve(pack, "screenshots");
  const reports = resolve(pack, "reports");
  mkdirSync(screenshots);
  mkdirSync(reports);
  const screenshot = resolve(screenshots, "login-desktop.png");
  writeFileSync(screenshot, readFileSync(baselinePng));
  const screenshotArtifact = artifactDescriptor(pack, screenshot, { mediaType: "image/png", role: "screenshot" });
  const reportFile = resolve(reports, "capture-report.json");
  atomicWriteJson(reportFile, validScenarioReport(screenshotArtifact.sha256, inspectPngFile(screenshot)));
  const reportArtifact = artifactDescriptor(pack, reportFile, { mediaType: "application/json", role: "report" });
  const manifest = buildCanonicalManifest({
    evidenceId: "PRODUCT-UX-TEST-001",
    taskId: "TASK-AT-999",
    commit: { sha: "a".repeat(40), dirty: false },
    capturedAt: "2026-08-05T12:00:00.000Z",
    classification: "fake",
    command: {
      command: "node capture.mjs --scenario .tmp/product-ux/scenario.json",
      startedAt: "2026-08-05T11:59:59.000Z",
      finishedAt: "2026-08-05T12:00:00.000Z",
      summary: "Synthetic harness test."
    },
    artifacts: [screenshotArtifact, reportArtifact],
    passed: true,
    scenarioCount: 1,
    failedCount: 0,
    toolVersions: { node: "24.0.0", playwright: "1.60.0", chromium: "1.2.3", platform: "linux-x64", harness: "1.0.0" }
  });
  const manifestFile = resolve(pack, "manifest.json");
  atomicWriteJson(manifestFile, manifest);
  return { pack, screenshot, reportFile, manifestFile };
}

function createValidAdvisoryRecord() {
  const pack = mkdtempSync(resolve(tmpdir(), "alwaystrack-product-ux-advisory-"));
  const screenshots = resolve(pack, "screenshots");
  mkdirSync(screenshots);
  const screenshot = resolve(screenshots, "login-desktop.png");
  writeFileSync(screenshot, readFileSync(baselinePng));
  const screenshotArtifact = artifactDescriptor(pack, screenshot, { mediaType: "image/png", role: "screenshot" });
  const scenarios = validScenarioReport(screenshotArtifact.sha256, inspectPngFile(screenshot)).scenarios;
  const record = buildAdvisoryCaptureRecord({
    requestId: "UXREQ-LOGIN-001",
    capturedAt: "2026-08-05T12:00:00.000Z",
    classification: "fake",
    commit: { sha: "a".repeat(40), dirty: false },
    browserVersion: "1.2.3",
    toolVersions: { node: "24.0.0", playwright: "1.60.0", chromium: "1.2.3", platform: "linux-x64", harness: "1.0.0" },
    command: {
      command: "node capture.mjs --scenario tests/product-ux/fixtures/login-scenario.json --request-id UXREQ-LOGIN-001",
      startedAt: "2026-08-05T11:59:59.000Z",
      finishedAt: "2026-08-05T12:00:00.000Z",
      summary: "Synthetic advisory harness test."
    },
    artifacts: [screenshotArtifact],
    scenarios
  });
  const recordFile = resolve(pack, "advisory-capture-record.json");
  atomicWriteJson(recordFile, record);
  return { pack, screenshot, recordFile };
}

test("expands named scenarios and records only semantic roles", () => {
  const document = readScenarioFile(fixture, REPO_ROOT);
  assert.equal(document.scenarios[0].surface, "Login Web");
  assert.deepEqual(document.scenarios[0].viewport, { width: 1024, height: 768 });
  assert.deepEqual(document.scenarios[0].steps.map((step) => step.type), ["goto", "wait-role"]);
  assert.equal(document.scenarios[0].expectedTerminalCondition, "heading Entrar is visible");
});

test("scenario contract rejects arbitrary execution and sensitive fill values", () => {
  const base = {
    schemaVersion: "1.0.0",
    scenarios: [{ id: "unsafe-scenario", surface: "Unsafe", state: "default", viewport: { width: 1024, height: 768 }, steps: [] }]
  };
  expectCode(() => validateScenarioDocument({
    ...base,
    scenarios: [{ ...base.scenarios[0], steps: [{ type: "evaluate", script: "document.body.innerHTML" }] }]
  }), "UNSAFE_STEP");
  expectCode(() => validateScenarioDocument({
    ...base,
    scenarios: [{
      ...base.scenarios[0],
      steps: [
        { type: "goto", path: "/" },
        { type: "fill-label", label: "Busca", value: "person@example.com" }
      ]
    }]
  }), "SENSITIVE_INPUT");
  expectCode(() => validateScenarioDocument({
    ...base,
    scenarios: [{
      ...base.scenarios[0],
      expectedTerminalCondition: "login page is visible",
      steps: [{ type: "goto", path: "/" }]
    }]
  }), "MISSING_TERMINAL_CONDITION");
});

test("file fixture resolution accepts only the pinned synthetic repo fixture", () => {
  const resolved = resolveFileFixture("wiki-attachment.png");
  assert.deepEqual(
    { name: resolved.name, mediaType: resolved.mediaType, byteLength: resolved.byteLength },
    { name: "wiki-attachment.png", mediaType: "image/png", byteLength: 136 }
  );
  assert.equal(resolved.buffer.length, 136);
  assert.equal(sha256File(uploadFileFixture), "ae52fe47be085f8c08c1975052313f677dbb182ca2a64abc347e7c825c806854");
  expectCode(() => resolveFileFixture("secrets.zip"), "UNSAFE_FILE_FIXTURE");
  expectCode(() => resolveFileFixture("../../../../etc/passwd"), "UNSAFE_FILE_FIXTURE");
  expectCode(() => resolveFileFixture("/etc/passwd"), "UNSAFE_FILE_FIXTURE");
});

test("set-file-label normalization accepts the contract and reports only safe fields", () => {
  const document = readScenarioFile(uploadFixture, REPO_ROOT);
  const scenario = document.scenarios[0];
  assert.deepEqual(scenario.steps.map((step) => step.type), [
    "login-role",
    "goto",
    "wait-role",
    "set-file-label",
    "click-role",
    "wait-role"
  ]);
  assert.deepEqual(scenario.steps[3], { type: "set-file-label", label: "Imagem", fixture: "wiki-attachment.png", exact: true });
  assert.equal(scenario.expectedTerminalCondition, "img wiki-attachment.png is visible");
  const { setupSteps, navigationSteps } = splitReportedSteps(scenario.steps);
  assert.deepEqual(setupSteps.filter((step) => step.type === "set-file-label"), [
    { type: "set-file-label", label: "Imagem", fixture: "wiki-attachment.png", exact: true }
  ]);
  const reported = JSON.stringify(setupSteps);
  assert.doesNotMatch(reported, /buffer|REPO_ROOT|\/home\/|fixtures\/files/);
  const sanitized = sanitizeStepForReport(scenario.steps[3]);
  assert.deepEqual(Object.keys(sanitized).sort(), ["exact", "fixture", "label", "type"]);
});

test("file step contract rejects non-allowlisted fixtures and step misuse fail-closed", () => {
  const base = {
    schemaVersion: "1.0.0",
    scenarios: [{
      id: "unsafe-upload",
      surface: "Unsafe",
      state: "default",
      viewport: { width: 1024, height: 768 },
      steps: [
        { type: "goto", path: "/" },
        { type: "wait-role", role: "heading", name: "Entrar", exact: true }
      ]
    }]
  };
  const withFileStep = (step) => ({
    ...base,
    scenarios: [{
      ...base.scenarios[0],
      steps: [base.scenarios[0].steps[0], step, base.scenarios[0].steps[1]]
    }]
  });
  expectCode(() => validateScenarioDocument(withFileStep({ type: "set-file-label", label: "Imagem", fixture: "host-file.png" })), "UNSAFE_FILE_FIXTURE");
  expectCode(() => validateScenarioDocument(withFileStep({ type: "set-file-label", label: "Imagem", fixture: "../tests/product-ux/fixtures/files/wiki-attachment.png" })), "UNSAFE_FILE_FIXTURE");
  expectCode(() => validateScenarioDocument(withFileStep({ type: "set-file-label", label: "Imagem", fixture: "wiki-attachment.png", path: "/etc/passwd" })), "UNSUPPORTED_FIELD");
  expectCode(() => validateScenarioDocument(withFileStep({ type: "set-file-label", label: "Imagem" })), "INVALID_STRING");
  expectCode(() => validateScenarioDocument({
    ...base,
    scenarios: [{
      ...base.scenarios[0],
      steps: [
        { type: "set-file-label", label: "Imagem", fixture: "wiki-attachment.png" },
        { type: "wait-role", role: "heading", name: "Entrar", exact: true }
      ]
    }]
  }), "NON_DETERMINISTIC_START");
  expectCode(() => validateScenarioDocument({
    ...base,
    scenarios: [{
      ...base.scenarios[0],
      steps: [{ type: "goto", path: "/" }, { type: "set-file-label", label: "Imagem", fixture: "wiki-attachment.png" }]
    }]
  }), "MISSING_TERMINAL_CONDITION");
});

test("preflight policy stays loopback-only and fake/local", async () => {
  assert.equal(validateLoopbackBaseUrl(), "http://localhost:5174");
  assert.equal(validateClassification("fake"), "fake");
  expectCode(() => validateLoopbackBaseUrl("https://example.com"), "UNSAFE_BASE_URL");
  expectCode(() => validateClassification("live"), "UNSAFE_CLASSIFICATION");
  const result = await runPreflight({
    repoRoot: REPO_ROOT,
    scenarioFile: fixture,
    classification: "fake",
    checkPorts: false,
    browserProbe: async () => ({ name: "chromium", version: "test-browser" })
  });
  assert.equal(result.status, "ready");
  assert.equal(result.scenarios[0].id, "login-desktop");
  assert.deepEqual(result.scenarios[0].roles, []);
});

test("output policy permits only ignored evidence paths", () => {
  const output = resolveOutputDirectory({ repoRoot: REPO_ROOT, evidenceId: "PRODUCT-UX-TEST-002" });
  assert.equal(output, resolve(REPO_ROOT, "test-results/product-ux/PRODUCT-UX-TEST-002"));
  expectCode(() => resolveOutputDirectory({
    repoRoot: REPO_ROOT,
    evidenceId: "PRODUCT-UX-TEST-002",
    outputDir: resolve(REPO_ROOT, "docs/product-ux-evidence")
  }), "PATH_OUTSIDE_ROOT");
});

test("capture anchors keep advisory requests mutually exclusive from pipeline identity", () => {
  assert.deepEqual(resolveCaptureAnchor({
    taskId: "TASK-AT-999",
    executionId: "EXEC-AT-999-001",
    evidenceId: "PRODUCT-UX-TEST-001"
  }), {
    mode: "pipeline",
    taskId: "TASK-AT-999",
    executionId: "EXEC-AT-999-001",
    evidenceId: "PRODUCT-UX-TEST-001"
  });
  assert.deepEqual(resolveCaptureAnchor({ requestId: "UXREQ-LOGIN-001" }), {
    mode: "advisory",
    requestId: "UXREQ-LOGIN-001"
  });
  expectCode(() => resolveCaptureAnchor({ requestId: "UXREQ-LOGIN-001", taskId: "TASK-AT-999" }), "AMBIGUOUS_CAPTURE_ANCHOR");
  expectCode(() => resolveCaptureAnchor({ taskId: "TASK-AT-999", executionId: "EXEC-AT-999-001" }), "INCOMPLETE_PIPELINE_ANCHOR");
  expectCode(() => resolveCaptureAnchor(), "MISSING_CAPTURE_ANCHOR");
  expectCode(() => resolveCaptureAnchor({ requestId: "../../unsafe" }), "INVALID_REQUEST_ID");
});

test("advisory output is isolated below its dedicated ignored root", () => {
  const output = resolveAdvisoryOutputDirectory({ repoRoot: REPO_ROOT, requestId: "UXREQ-LOGIN-001" });
  assert.equal(output, resolve(REPO_ROOT, "test-results/product-ux/advisory/UXREQ-LOGIN-001"));
  expectCode(() => resolveAdvisoryOutputDirectory({
    repoRoot: REPO_ROOT,
    requestId: "UXREQ-LOGIN-001",
    outputDir: resolve(REPO_ROOT, "test-results/product-ux/PRODUCT-UX-TEST-001")
  }), "PATH_OUTSIDE_REQUEST");
  expectCode(() => resolveAdvisoryOutputDirectory({
    repoRoot: REPO_ROOT,
    requestId: "UXREQ-LOGIN-001",
    outputDir: resolve(REPO_ROOT, "test-results/product-ux/advisory/UXREQ-OTHER-002")
  }), "PATH_OUTSIDE_REQUEST");
});

test("redaction removes credentials and the scanner rejects raw sensitive material", () => {
  const unsafe = "Authorization: Bearer sample-value person@example.com https://localhost/?token=sample";
  const redacted = redactText(unsafe);
  assert.doesNotMatch(redacted, /person@example\.com|sample-value|token=sample/);
  assert.deepEqual(sensitiveFindings({ summary: redacted }), []);
  assert.ok(sensitiveFindings({ summary: unsafe }).length >= 1);
  assert.ok(sensitiveFindings({ token: "raw-value" }).length >= 1);
});

test("canonical command removes host-specific absolute paths", () => {
  const command = canonicalCommandRecord({
    argv: [process.execPath, resolve(REPO_ROOT, ".agents/skills/olympus-product-ux/scripts/capture.mjs"), "--scenario", fixture],
    startedAt: "2026-08-05T11:59:59.000Z",
    finishedAt: "2026-08-05T12:00:00.000Z"
  });
  assert.match(command.command, /^node \.agents\/skills\/olympus-product-ux\/scripts\/capture\.mjs/);
  assert.doesNotMatch(command.command, /\/home\/|\\Users\\/);
});

test("browser runtime path is explicit or resolved from a durable ignored cache", () => {
  const directory = mkdtempSync(resolve(tmpdir(), "alwaystrack-product-ux-browser-libs-"));
  assert.equal(browserRuntimeLibraryPath({ source: { PRODUCT_UX_BROWSER_LIB_PATH: directory } }), directory);
  assert.equal(isolatedEnvironment({ PATH: process.env.PATH, PRODUCT_UX_BROWSER_LIB_PATH: directory }).LD_LIBRARY_PATH, directory);
  expectCode(() => browserRuntimeLibraryPath({ source: { PRODUCT_UX_BROWSER_LIB_PATH: "relative/path" } }), "INVALID_BROWSER_LIB_PATH");
});

test("browser bootstrap metadata exposes canonical package values", () => {
  const metadata = normalizeBrowserRuntimeMetadata({
    schemaVersion: "1.0.0",
    packages: [
      { name: "Package: libnspr4", version: "Version: 4.35", architecture: "Architecture: amd64" },
      { name: "libnss3", version: "3.98", architecture: "amd64" }
    ]
  });
  assert.deepEqual(metadata.packages, [
    { name: "libnspr4", version: "4.35", architecture: "amd64" },
    { name: "libnss3", version: "3.98", architecture: "amd64" }
  ]);
});

test("low-level failures map to the public visual evidence result contract", () => {
  const browserError = new ProductUxHarnessError("missing shared library libnspr4.so", "BROWSER_UNAVAILABLE");
  const sensitiveError = new ProductUxHarnessError("unsafe person@example.com", "SENSITIVE_EVIDENCE");
  const checksumError = new ProductUxHarnessError("checksum mismatch", "CHECKSUM_MISMATCH");
  assert.equal(publicResultCodeForError(browserError), "VISUAL_ACQUISITION_BLOCKED");
  assert.equal(publicResultCodeForError(sensitiveError), "SENSITIVE_ARTIFACT_REJECTED");
  assert.equal(publicResultCodeForError(checksumError, { reusingEvidence: true }), "STALE_EVIDENCE");
  const failure = cliFailureResult(sensitiveError);
  assert.equal(failure.status, "SENSITIVE_ARTIFACT_REJECTED");
  assert.doesNotMatch(failure.message, /person@example\.com/);
});

test("assessment findings do not invalidate a successful acquisition", () => {
  const outcome = classifyScenarioOutcome({
    screenshotPresent: true,
    geometry: { status: "failed", issues: [{ check: "overflow", digest: "a".repeat(64) }] },
    accessibility: { status: "failed", criticalIssueCounts: { "unnamed-interactive": 1 } },
    runtime: {
      consoleErrorDigests: [],
      pageErrorDigests: ["b".repeat(64)],
      failedRequestDigests: [],
      blockedRequestDigests: [],
      expectedHttpErrorDigests: [],
      unexpectedHttpErrorDigests: [],
      setupErrorDigest: null
    }
  });
  assert.equal(outcome.acquisitionStatus, "captured");
  assert.equal(outcome.assessmentSignals.status, "findings");
});

test("canonical UX evidence validates through library and CLI", () => {
  const { manifestFile } = createValidPack();
  const result = validateEvidencePack(manifestFile);
  assert.deepEqual(result, {
    status: "valid",
    evidenceId: "PRODUCT-UX-TEST-001",
    taskId: "TASK-AT-999",
    classification: "fake",
    result: "passed",
    artifacts: 2,
    scenarios: 1,
    assessmentFindings: 0,
    resultCode: "CAPTURED"
  });
  const output = JSON.parse(execFileSync(process.execPath, [validatorCli, "--manifest", manifestFile], { encoding: "utf8" }));
  assert.equal(output.status, "valid");
});

test("advisory capture validates without pipeline identity or canonical manifest", () => {
  const advisory = createValidAdvisoryRecord();
  const record = JSON.parse(readFileSync(advisory.recordFile, "utf8"));
  assert.equal(record.resultCode, "ADVISORY_CAPTURED");
  assert.equal(record.usagePolicy.scope, "same-request-only");
  assert.equal(record.usagePolicy.promotable, false);
  assert.equal(record.usagePolicy.reusable, false);
  for (const forbidden of ["taskId", "executionId", "evidenceId", "manifest", "gateClosure", "approval"]) assert.equal(forbidden in record, false);
  assert.equal(existsSync(resolve(advisory.pack, "manifest.json")), false);
  const result = validateAdvisoryCaptureRecord(advisory.recordFile, { requestId: "UXREQ-LOGIN-001" });
  assert.deepEqual(result, {
    status: "valid-advisory-record",
    requestId: "UXREQ-LOGIN-001",
    pipelineMode: "advisory-audit",
    resultCode: "ADVISORY_CAPTURED",
    classification: "fake",
    scenarios: 1,
    artifacts: 1,
    assessmentFindings: 0,
    reusable: false,
    promotable: false
  });
  const output = JSON.parse(execFileSync(process.execPath, [advisoryValidatorCli, "--record", advisory.recordFile, "--request-id", "UXREQ-LOGIN-001"], { encoding: "utf8" }));
  assert.equal(output.status, "valid-advisory-record");
  const reuse = spawnSync(process.execPath, [advisoryValidatorCli, "--record", advisory.recordFile, "--request-id", "UXREQ-LOGIN-001", "--reuse"], { encoding: "utf8" });
  assert.equal(reuse.status, 1);
  assert.equal(JSON.parse(reuse.stderr).reasonCode, "ADVISORY_REUSE_FORBIDDEN");
});

test("advisory assessment findings remain consultative without blocking acquisition", () => {
  const advisory = createValidAdvisoryRecord();
  const record = JSON.parse(readFileSync(advisory.recordFile, "utf8"));
  record.scenarios[0].geometry = { status: "failed", issues: [{ check: "overflow", digest: "d".repeat(64) }] };
  record.scenarios[0].assessmentSignals = {
    status: "findings",
    geometry: "failed",
    accessibility: "passed",
    runtimeFindingCount: 0,
    unexpectedConsoleErrors: 0
  };
  atomicWriteJson(advisory.recordFile, record);
  const result = validateAdvisoryCaptureRecord(advisory.recordFile, { requestId: "UXREQ-LOGIN-001" });
  assert.equal(result.resultCode, "ADVISORY_CAPTURED");
  assert.equal(result.assessmentFindings, 1);
});

test("a package with assessment findings remains a valid captured acquisition", () => {
  const findingPack = createValidPack();
  const report = JSON.parse(readFileSync(findingPack.reportFile, "utf8"));
  report.scenarios[0].geometry = { status: "failed", issues: [{ check: "overflow", digest: "c".repeat(64) }] };
  report.scenarios[0].assessmentSignals = {
    status: "findings",
    geometry: "failed",
    accessibility: "passed",
    runtimeFindingCount: 0,
    unexpectedConsoleErrors: 0
  };
  atomicWriteJson(findingPack.reportFile, report);
  const manifest = JSON.parse(readFileSync(findingPack.manifestFile, "utf8"));
  manifest.artifacts.find((artifact) => artifact.role === "report").sha256 = sha256File(findingPack.reportFile);
  atomicWriteJson(findingPack.manifestFile, manifest);
  const result = validateEvidencePack(findingPack.manifestFile);
  assert.equal(result.result, "passed");
  assert.equal(result.resultCode, "CAPTURED");
  assert.equal(result.assessmentFindings, 1);
});

test("cleanup removes only the owned isolated E2E workspace", () => {
  const fakeRepo = mkdtempSync(resolve(tmpdir(), "alwaystrack-product-ux-cleanup-"));
  const owned = resolve(fakeRepo, ".tmp/e2e");
  mkdirSync(owned, { recursive: true });
  writeFileSync(resolve(owned, "owned.txt"), "synthetic");
  assert.equal(cleanupIsolatedE2e(fakeRepo), true);
  assert.equal(existsSync(owned), false);
});

test("evidence validation rejects a corrupt PNG even when its checksum is updated", () => {
  const corrupt = createValidPack();
  writeFileSync(corrupt.screenshot, Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(2048)]));
  const manifest = JSON.parse(readFileSync(corrupt.manifestFile, "utf8"));
  manifest.artifacts.find((artifact) => artifact.role === "screenshot").sha256 = sha256File(corrupt.screenshot);
  atomicWriteJson(corrupt.manifestFile, manifest);
  expectCode(() => validateEvidencePack(corrupt.manifestFile), "INVALID_PNG");
});

test("evidence validation fails closed on tampering and self-approved gate closure", () => {
  const tampered = createValidPack();
  writeFileSync(tampered.screenshot, "tampered");
  expectCode(() => validateEvidencePack(tampered.manifestFile), "CHECKSUM_MISMATCH");

  const selfApproved = createValidPack();
  const manifest = JSON.parse(readFileSync(selfApproved.manifestFile, "utf8"));
  manifest.gateClosure = { gate: "ux", decision: "go" };
  atomicWriteJson(selfApproved.manifestFile, manifest);
  expectCode(() => validateEvidencePack(selfApproved.manifestFile), "UNSAFE_GATE_CLOSURE");
});

test("advisory validation rejects pipeline identity, promotion, reuse and sensitive content", () => {
  const identified = createValidAdvisoryRecord();
  const identifiedRecord = JSON.parse(readFileSync(identified.recordFile, "utf8"));
  identifiedRecord.taskId = "TASK-AT-999";
  identifiedRecord.executionId = "EXEC-AT-999-001";
  identifiedRecord.evidenceId = "PRODUCT-UX-TEST-001";
  atomicWriteJson(identified.recordFile, identifiedRecord);
  expectCode(() => validateAdvisoryCaptureRecord(identified.recordFile), "UNSUPPORTED_FIELD");

  const promoted = createValidAdvisoryRecord();
  const promotedRecord = JSON.parse(readFileSync(promoted.recordFile, "utf8"));
  promotedRecord.usagePolicy.promotable = true;
  atomicWriteJson(promoted.recordFile, promotedRecord);
  expectCode(() => validateAdvisoryCaptureRecord(promoted.recordFile), "ADVISORY_REUSE_FORBIDDEN");

  const staleScope = createValidAdvisoryRecord();
  expectCode(() => validateAdvisoryCaptureRecord(staleScope.recordFile, { requestId: "UXREQ-OTHER-002" }), "ADVISORY_REQUEST_MISMATCH");

  const sensitive = createValidAdvisoryRecord();
  const sensitiveRecord = JSON.parse(readFileSync(sensitive.recordFile, "utf8"));
  sensitiveRecord.limitations.push("Unexpected person@example.com value.");
  atomicWriteJson(sensitive.recordFile, sensitiveRecord);
  expectCode(() => validateAdvisoryCaptureRecord(sensitive.recordFile), "SENSITIVE_INPUT");
});

test("advisory validation rejects canonical manifests, tampered PNGs and symlinks", () => {
  const withManifest = createValidAdvisoryRecord();
  atomicWriteJson(resolve(withManifest.pack, "manifest.json"), { forbidden: true });
  expectCode(() => validateAdvisoryCaptureRecord(withManifest.recordFile), "ADVISORY_MANIFEST_FORBIDDEN");

  const tampered = createValidAdvisoryRecord();
  writeFileSync(tampered.screenshot, "tampered");
  expectCode(() => validateAdvisoryCaptureRecord(tampered.recordFile), "CHECKSUM_MISMATCH");

  const linked = createValidAdvisoryRecord();
  unlinkSync(linked.screenshot);
  symlinkSync(baselinePng, linked.screenshot);
  expectCode(() => validateAdvisoryCaptureRecord(linked.recordFile), "SYMLINK_REJECTED");
});
