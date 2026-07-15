#!/usr/bin/env node
import { runRecoveryDrill } from "./restore-drill-core.mjs";

const args = new Set(process.argv.slice(2));
const allowed = new Set(["--keep-temporary"]);
const unknown = [...args].filter((arg) => !allowed.has(arg));
if (unknown.length > 0) {
  console.error(`Unknown argument(s): ${unknown.join(", ")}`);
  process.exit(2);
}

try {
  const report = await runRecoveryDrill({ keepTemporary: args.has("--keep-temporary") });
  console.log(JSON.stringify(report, null, 2));
} catch (error) {
  console.error(JSON.stringify(error.report ?? { status: "FAILED", failure: { code: error.code ?? "DRILL_FAILED" } }, null, 2));
  process.exit(1);
}
