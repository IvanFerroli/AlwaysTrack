import { access, readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const sourceManifest = JSON.parse(await readFile(resolve(root, "manifest.json"), "utf8"));
const builtManifest = JSON.parse(await readFile(resolve(root, "dist/manifest.json"), "utf8"));

if (JSON.stringify(sourceManifest) !== JSON.stringify(builtManifest)) {
  throw new Error("Built manifest differs from source manifest");
}
if (builtManifest.host_permissions || JSON.stringify(builtManifest.permissions) !== JSON.stringify(["sidePanel", "tabs"])) {
  throw new Error("Built manifest has unexpected permissions");
}

await access(resolve(root, "dist", builtManifest.background.service_worker));
await access(resolve(root, "dist", builtManifest.side_panel.default_path));
console.log("MV3 build package validated");
