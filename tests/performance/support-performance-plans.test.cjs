const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { resolve } = require("node:path");
const test = require("node:test");
const YAML = require("yaml");

const root = resolve(__dirname, "../..");
const validateArtilleryScript = require(resolve(root, "node_modules/artillery/lib/util/validate-script.js"));
const processor = require("./support-operations.processor.cjs");
const planFiles = [
  "support-operations-read.yml",
  "support-coverage-read.yml",
  "support-materialization-idempotency.yml",
  "support-claim-burst.yml",
  "support-recurrence-idempotency.yml"
];

function hookNames(value) {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function flowHooks(flow) {
  const hooks = [];
  for (const action of flow || []) {
    if (action.function) hooks.push(action.function);
    if (action.loop) hooks.push(...flowHooks(action.loop));
    for (const method of ["get", "post", "put", "patch", "delete"]) {
      const request = action[method];
      if (!request) continue;
      hooks.push(...hookNames(request.beforeRequest), ...hookNames(request.afterResponse));
    }
  }
  return hooks;
}

function allHooks(plan) {
  const hooks = [
    ...flowHooks(plan.before?.flow),
    ...flowHooks(plan.after?.flow)
  ];
  for (const scenario of plan.scenarios || []) {
    hooks.push(
      ...hookNames(scenario.beforeScenario),
      ...hookNames(scenario.afterScenario),
      ...flowHooks(scenario.flow)
    );
  }
  return hooks;
}

function readPlan(file) {
  return YAML.parse(readFileSync(resolve(__dirname, file), "utf8"));
}

for (const file of planFiles) {
  test(`${file} is a guarded, well-formed Artillery plan`, () => {
    const plan = readPlan(file);
    assert.equal(validateArtilleryScript(plan), undefined);
    assert.equal(plan.config.target, "http://127.0.0.1:3333");
    assert.equal(plan.config.processor, "./support-operations.processor.cjs");
    assert.ok(plan.config.http.timeout > 0);
    assert.ok(plan.config.plugins.ensure);
    assert.ok(Number.isFinite(plan.config.ensure.maxErrorRate));
    assert.ok(plan.config.ensure.thresholds.some((entry) => Number.isFinite(entry["http.response_time.p95"])));
    assert.ok(plan.config.ensure.thresholds.some((entry) => Number.isFinite(entry["http.response_time.p99"])));
    for (const phase of plan.config.phases) {
      assert.ok(phase.duration > 0);
      assert.ok(phase.arrivalRate > 0 || phase.arrivalCount > 0);
    }
    for (const hook of allHooks(plan)) assert.equal(typeof processor[hook], "function", `missing processor hook ${hook}`);
  });
}

test("write plans opt in before their mutating flows", () => {
  const materialization = readPlan("support-materialization-idempotency.yml");
  const claims = readPlan("support-claim-burst.yml");
  const recurrence = readPlan("support-recurrence-idempotency.yml");
  assert.equal(materialization.scenarios[0].beforeScenario, "prepareMaterializationScenario");
  assert.equal(claims.before.flow[0].function, "prepareClaimBurstScenario");
  assert.equal(claims.scenarios[0].beforeScenario, "prepareClaimBurstScenario");
  assert.equal(claims.after.flow[0].function, "prepareClaimBurstScenario");
  assert.equal(recurrence.before.flow[0].function, "prepareRecurrenceScenario");
  assert.equal(recurrence.scenarios[0].beforeScenario, "prepareRecurrenceScenario");
  assert.equal(recurrence.after.flow[0].function, "prepareRecurrenceScenario");
});

function runHook(name, context) {
  return new Promise((resolveHook) => processor[name](context, undefined, (error) => resolveHook(error)));
}

test("processor blocks remote targets before authentication", async () => {
  const originalPassword = process.env.SEED_ADMIN_PASSWORD;
  process.env.SEED_ADMIN_PASSWORD = "local-test-only";
  try {
    const error = await runHook("prepareReadScenario", { vars: { target: "https://example.com" } });
    assert.match(error.message, /target must be local/);
  } finally {
    if (originalPassword === undefined) delete process.env.SEED_ADMIN_PASSWORD;
    else process.env.SEED_ADMIN_PASSWORD = originalPassword;
  }
});

test("processor blocks writes in production even with opt in", async () => {
  const original = {
    password: process.env.SEED_ADMIN_PASSWORD,
    allowWrites: process.env.PERF_ALLOW_TEST_WRITES,
    nodeEnv: process.env.NODE_ENV
  };
  process.env.SEED_ADMIN_PASSWORD = "local-test-only";
  process.env.PERF_ALLOW_TEST_WRITES = "true";
  process.env.NODE_ENV = "production";
  try {
    const error = await runHook("prepareClaimBurstScenario", { vars: { target: "http://127.0.0.1:3333" } });
    assert.match(error.message, /disabled when NODE_ENV=production/);
  } finally {
    for (const [key, value] of Object.entries({
      SEED_ADMIN_PASSWORD: original.password,
      PERF_ALLOW_TEST_WRITES: original.allowWrites,
      NODE_ENV: original.nodeEnv
    })) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
});
