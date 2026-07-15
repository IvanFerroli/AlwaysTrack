import { createHash } from "node:crypto";
import { readFileSync, statSync, writeFileSync } from "node:fs";
import { basename, resolve } from "node:path";

const [output = "release-manifest.json", ...inputPaths] = process.argv.slice(2);
if (inputPaths.length === 0) {
  console.error("Usage: node scripts/create-release-manifest.js <output> <artifact...>");
  process.exit(2);
}

const sha256 = (path) => createHash("sha256").update(readFileSync(path)).digest("hex");
const commit = process.env.GITHUB_SHA || process.env.RELEASE_COMMIT;
if (!commit || !/^[0-9a-f]{40}$/i.test(commit)) {
  console.error("GITHUB_SHA or RELEASE_COMMIT must contain the full commit SHA");
  process.exit(2);
}

const artifacts = inputPaths.map((inputPath) => {
  const path = resolve(inputPath);
  const info = statSync(path);
  if (!info.isFile()) throw new Error(`Release artifact is not a file: ${inputPath}`);
  return { name: basename(path), bytes: info.size, sha256: sha256(path) };
}).sort((left, right) => left.name.localeCompare(right.name));

const manifest = {
  schemaVersion: "1.0.0",
  commit: commit.toLowerCase(),
  createdAt: new Date().toISOString(),
  protocolVersion: "1",
  compatibility: {
    companionExtension: "0.1.x",
    companionHost: "0.1.x",
    sharedContract: "0.1.x"
  },
  artifacts
};
writeFileSync(output, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
console.log(`Release manifest written to ${output} with ${artifacts.length} artifact(s).`);
