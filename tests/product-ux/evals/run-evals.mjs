#!/usr/bin/env node

import { parseArgs } from "node:util";

import { ProductUxEvalError, evaluateSuite, loadJson } from "./evaluator.mjs";

function usage() {
  return `Usage:
  node tests/product-ux/evals/run-evals.mjs --cases <suite.json> --observations <set.json>

The runner scores typed outcomes, evidence-to-claim relations, target completeness,
observable side effects, privacy and ownership boundaries. It does not grade prose
length or search for required keywords. A blocking violation always returns NO-GO.
`;
}

function main(argv = process.argv.slice(2)) {
  const { values } = parseArgs({
    args: argv,
    strict: true,
    allowPositionals: false,
    options: {
      cases: { type: "string" },
      observations: { type: "string" },
      help: { type: "boolean", default: false }
    }
  });
  if (values.help) {
    process.stdout.write(usage());
    return 0;
  }
  if (!values.cases || !values.observations) throw new ProductUxEvalError("--cases and --observations are required.", "MISSING_ARGUMENT");
  const report = evaluateSuite(loadJson(values.cases), loadJson(values.observations));
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  return report.gate === "GO" ? 0 : 1;
}

try {
  process.exitCode = main();
} catch (error) {
  const code = error instanceof ProductUxEvalError ? error.code : "UNEXPECTED_ERROR";
  process.stderr.write(`${code}: ${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 2;
}
