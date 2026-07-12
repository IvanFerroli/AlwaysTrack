import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

describe("Companion MV3 manifest", () => {
  it("keeps permissions minimal and exposes the side panel shell", async () => {
    const manifest = JSON.parse(await readFile(new URL("../manifest.json", import.meta.url), "utf8")) as {
      manifest_version: number;
      permissions: string[];
      host_permissions?: string[];
      background: { service_worker: string };
      side_panel: { default_path: string };
    };

    expect(manifest.manifest_version).toBe(3);
    expect(manifest.permissions).toEqual(["sidePanel", "tabs"]);
    expect(manifest.host_permissions).toBeUndefined();
    expect(manifest.background.service_worker).toBe("service-worker.js");
    expect(manifest.side_panel.default_path).toBe("side-panel/index.html");
  });
});
