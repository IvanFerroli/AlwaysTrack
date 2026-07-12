import { copyFile, mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
  root: resolve(import.meta.dirname, "src"),
  plugins: [{
    name: "copy-mv3-manifest",
    async closeBundle() {
      await mkdir(resolve(import.meta.dirname, "dist"), { recursive: true });
      await copyFile(resolve(import.meta.dirname, "manifest.json"), resolve(import.meta.dirname, "dist/manifest.json"));
    }
  }],
  build: {
    rollupOptions: {
      input: {
        "service-worker": resolve(import.meta.dirname, "src/background/service-worker.ts"),
        "content-scripts/index": resolve(import.meta.dirname, "src/content-scripts/index.ts"),
        "side-panel/index": resolve(import.meta.dirname, "src/side-panel/index.html")
      },
      output: { entryFileNames: "[name].js", chunkFileNames: "chunks/[name]-[hash].js", assetFileNames: "assets/[name]-[hash][extname]" }
    },
    outDir: resolve(import.meta.dirname, "dist"),
    emptyOutDir: true
  }
});
