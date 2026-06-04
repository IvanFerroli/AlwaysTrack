import { defineConfig, loadEnv, type Plugin, type ResolvedConfig } from "vite";
import react from "@vitejs/plugin-react";

const defaultAppName = "AlwaysTrack";

function resolveAppName(config: ResolvedConfig) {
  const env = loadEnv(config.mode, config.root, "");
  return env.VITE_APP_NAME?.trim() || defaultAppName;
}

function escapeHtml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function siteManifest(appName: string) {
  return JSON.stringify(
    {
      name: appName,
      short_name: appName,
      description: "Operacao comercial para notas, ranking, campanhas, extratos e wiki.",
      start_url: "/",
      scope: "/",
      display: "standalone",
      background_color: "#f4faf9",
      theme_color: "#0f3d4c",
      icons: [
        { src: "/favicon/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
        { src: "/favicon/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
        { src: "/favicon/favicon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
        { src: "/favicon/favicon-512.png", sizes: "512x512", type: "image/png", purpose: "any" }
      ]
    },
    null,
    2
  );
}

function appNamePlugin(): Plugin {
  let appName = defaultAppName;

  return {
    name: "alwaystrack-app-name",
    configResolved(config) {
      appName = resolveAppName(config);
    },
    transformIndexHtml(html) {
      return html.replaceAll("%APP_NAME%", escapeHtml(appName));
    },
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        if (request.url?.split("?")[0] !== "/site.webmanifest") {
          next();
          return;
        }
        response.setHeader("content-type", "application/manifest+json; charset=utf-8");
        response.end(siteManifest(appName));
      });
    },
    generateBundle() {
      this.emitFile({
        type: "asset",
        fileName: "site.webmanifest",
        source: siteManifest(appName)
      });
    }
  };
}

export default defineConfig({
  plugins: [react(), appNamePlugin()],
  server: {
    port: 5173,
    proxy: {
      "/v1": "http://localhost:3333",
      "/health": "http://localhost:3333"
    }
  }
});
