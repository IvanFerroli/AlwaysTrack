import { readFileSync } from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const specPath = path.join(root, "docs/api/openapi.v1.yaml");
const appPath = path.join(root, "services/api/src/app.ts");
const document = JSON.parse(readFileSync(specPath, "utf8"));
const appSource = readFileSync(appPath, "utf8");
const methods = new Set(["get", "post", "patch", "put", "delete"]);
const errors = [];
const ids = new Set();

for (const [openApiPath, pathItem] of Object.entries(document.paths ?? {})) {
  for (const [method, operation] of Object.entries(pathItem)) {
    if (!methods.has(method) || operation["x-alwaystrack-tier"] !== "P0") continue;
    const label = `${method.toUpperCase()} ${openApiPath}`;
    const expressPath = openApiPath.replace(/\{([^}]+)\}/g, ":$1");
    const declaration = new RegExp(`app\\.${method}\\(\\s*["']${expressPath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}["']`);
    if (!declaration.test(appSource)) errors.push(`${label}: missing from services/api/src/app.ts`);
    if (!operation.operationId || ids.has(operation.operationId)) errors.push(`${label}: operationId is missing or duplicated`);
    ids.add(operation.operationId);
    const status = String(operation["x-success-status"] ?? "");
    if (!operation.responses?.[status] || !/^2\d\d$/.test(status)) errors.push(`${label}: success status is not documented`);
    if (typeof operation["x-rate-limited"] !== "boolean") errors.push(`${label}: x-rate-limited is missing`);
    if (operation["x-rate-limited"] && !operation.responses?.["429"]) errors.push(`${label}: 429 is not documented`);
  }
}

if (errors.length) {
  console.error(`OpenAPI contract validation failed:\n- ${errors.join("\n- ")}`);
  process.exit(1);
}
console.log(`OpenAPI contract valid: ${ids.size} P0 operations match app.ts.`);
