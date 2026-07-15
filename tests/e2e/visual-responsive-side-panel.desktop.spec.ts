import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { expect, test, type Page, type Route } from "@playwright/test";
import {
  expectControlsInsideViewport,
  expectNoUnexpectedOverflow,
  expectRegionsNotOverlapping,
  expectVisualBaseline,
  stabilizeVisualPage
} from "./visual-responsive.helpers";

const extensionDist = path.resolve("apps/companion-extension/dist");

const contentTypes: Record<string, string> = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8"
};

async function serveExtensionAsset(route: Route) {
  const pathname = new URL(route.request().url()).pathname === "/" ? "/side-panel/index.html" : new URL(route.request().url()).pathname;
  const relativePath = pathname.replace(/^\/+/, "");
  const filePath = path.resolve(extensionDist, relativePath);
  if (!filePath.startsWith(`${extensionDist}${path.sep}`)) return route.abort("accessdenied");

  try {
    const body = await readFile(filePath);
    await route.fulfill({ body, contentType: contentTypes[path.extname(filePath)] ?? "application/octet-stream" });
  } catch {
    await route.fulfill({ status: 404, body: "Not found" });
  }
}

async function openSidePanel(page: Page, width: number, height: number) {
  await page.setViewportSize({ width, height });
  await page.addInitScript(() => {
    const listeners: Array<(message: unknown) => void> = [];
    Object.defineProperty(window, "chrome", {
      configurable: true,
      value: {
        runtime: {
          onMessage: { addListener: (listener: (message: unknown) => void) => listeners.push(listener) },
          sendMessage: async () => undefined
        }
      }
    });
  });
  await page.route("http://companion.local/**", serveExtensionAsset);
  await page.goto("http://companion.local/");
  await expect(page.getByRole("heading", { name: "Copiloto SAC" })).toBeVisible();
  await expect(page.getByText("Mariana Costa")).toBeVisible();
  await stabilizeVisualPage(page);
}

test.describe("visual responsive Companion side panel", () => {
  test.beforeAll(() => {
    execFileSync("npm", ["run", "build", "--workspace", "@alwaystrack/companion-extension"], {
      cwd: process.cwd(),
      env: process.env,
      stdio: "pipe"
    });
  });

  test("side panel remains operable at Chromium's narrow 320px width", async ({ page }) => {
    await openSidePanel(page, 320, 700);
    await expectNoUnexpectedOverflow(page, ["body", ".shell", ".panel-header", ".workspace-section"]);
    await expectControlsInsideViewport(page, ".shell");
    await expectRegionsNotOverlapping(page, [[".brand-line", ".header-actions"]]);
    await expectVisualBaseline(page, "companion-side-panel-320x700.png", true);
  });

  test("side panel keeps two-column actions at its expanded 600px width", async ({ page }) => {
    await openSidePanel(page, 600, 900);
    await expectNoUnexpectedOverflow(page, ["body", ".shell", ".panel-header", ".workspace-section"]);
    await expectControlsInsideViewport(page, ".shell");
    await expectRegionsNotOverlapping(page, [[".brand-line", ".header-actions"]]);
    await expect(page.locator(".copy-actions")).toHaveCSS("grid-template-columns", /.+ .+/);
    await expectVisualBaseline(page, "companion-side-panel-600x900.png");
  });
});
