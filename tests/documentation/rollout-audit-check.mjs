import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "../..");
const read = (path) => readFile(resolve(root, path), "utf8");
const failures = [];

for (const task of [302, 303, 304, 305, 306]) {
  const text = await read(`docs/rollout/TASK-AT-${task}-audit.md`);
  if (!text.includes("**NO-GO.**")) failures.push(`AT-${task} must remain NO-GO`);
}

const index = await read("docs/rollout/README.md");
const readiness = await read("docs/rollout/TASK-AT-307-audit.md");
const architecture = await read("docs/architecture/future-agent-readiness.md");

for (const [name, text] of [["index", index], ["AT-307", readiness], ["architecture", architecture]]) {
  if (!/rollout bloqueado/i.test(text)) failures.push(`${name} must block rollout`);
}
if (!index.includes("PENDENTE_LIVE")) failures.push("index must list live pending work");
if (!/fixtures.*nunca contam como (?:evidencia de )?producao/i.test(index)) failures.push("fixtures must not count as production");
if (!/nenhum agente ou executor implementado/i.test(index)) failures.push("index must deny agent implementation");
if (!/Nao existe nem esta autorizado agente, executor generico ou autonomia/i.test(architecture)) {
  failures.push("architecture must deny generic executor and autonomy");
}

if (failures.length) {
  console.error(failures.join("\n"));
  process.exitCode = 1;
} else {
  console.log("Rollout audit documentation invariants: OK");
}
