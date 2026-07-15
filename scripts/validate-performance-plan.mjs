import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import YAML from "yaml";

const root = resolve(import.meta.dirname, "..");
const planPath = resolve(root, "tests/performance/alwaystrack-resilience.yml");
const plan = YAML.parse(readFileSync(planPath, "utf8"));
const requiredProfiles = ["mixed", "stress", "spike", "soak"];
const requiredJourneys = ["CaseFlow", "cache stampede", "queue", "health"];
const errors = [];

for (const profile of requiredProfiles) {
  const phases = plan.config?.environments?.[profile]?.phases;
  if (!Array.isArray(phases) || phases.length === 0) {
    errors.push(`${profile}: at least one phase is required`);
    continue;
  }
  for (const [index, phase] of phases.entries()) {
    if (!Number.isFinite(phase.duration) || phase.duration <= 0) errors.push(`${profile}[${index}]: positive duration is required`);
    if (!Number.isFinite(phase.arrivalRate) || phase.arrivalRate <= 0) errors.push(`${profile}[${index}]: positive arrivalRate is required`);
    if (!phase.name) errors.push(`${profile}[${index}]: phase name is required`);
  }
}

const ensure = plan.config?.ensure;
if (!Number.isFinite(ensure?.maxErrorRate)) errors.push("ensure.maxErrorRate is required");
const thresholds = ensure?.thresholds ?? [];
for (const metric of ["http.response_time.p95", "http.response_time.p99"]) {
  if (!thresholds.some((entry) => Number.isFinite(entry?.[metric]))) errors.push(`${metric}: threshold is required`);
}

const scenarioNames = (plan.scenarios ?? []).map((scenario) => scenario.name ?? "");
for (const journey of requiredJourneys) {
  if (!scenarioNames.some((name) => name.includes(journey))) errors.push(`${journey}: executable scenario is required`);
}
const totalWeight = (plan.scenarios ?? []).reduce((sum, scenario) => sum + (scenario.weight ?? 0), 0);
if (totalWeight !== 100) errors.push(`scenario weights must total 100, received ${totalWeight}`);

if (errors.length) {
  console.error(`Performance plan validation failed:\n- ${errors.join("\n- ")}`);
  process.exit(1);
}

const summary = Object.fromEntries(requiredProfiles.map((profile) => {
  const phases = plan.config.environments[profile].phases;
  return [profile, {
    durationSeconds: phases.reduce((sum, phase) => sum + phase.duration, 0),
    peakArrivalRate: Math.max(...phases.flatMap((phase) => [phase.arrivalRate, phase.rampTo ?? phase.arrivalRate]))
  }];
}));

console.log(`Performance plan valid: ${JSON.stringify(summary)}`);
