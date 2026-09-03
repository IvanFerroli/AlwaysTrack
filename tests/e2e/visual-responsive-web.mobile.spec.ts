import { expect, test } from "@playwright/test";
import { loginAsAdminPage, loginPage, openPrimaryNavigationItem } from "./helpers";
import {
  expectControlsInsideViewport,
  expectNoUnexpectedOverflow,
  expectRegionsNotOverlapping,
  expectVisualBaseline,
  stabilizeVisualPage
} from "./visual-responsive.helpers";

async function expectMobileShellGeometry(page: import("@playwright/test").Page) {
  await expectNoUnexpectedOverflow(page, ["body", ".app-frame", ".sidebar", ".workspace", ".topbar"]);
  await expectControlsInsideViewport(page);
  await expectRegionsNotOverlapping(page, [[".sidebar", ".workspace"]]);
}

async function openSettings(page: import("@playwright/test").Page) {
  await loginAsAdminPage(page);
  await openPrimaryNavigationItem(page, /^Administração/, /^Configurações$/);
  await expect(page.getByRole("heading", { name: "Configurações administrativas" })).toBeVisible();
  await stabilizeVisualPage(page);
}

async function expectSettingsGeometry(page: import("@playwright/test").Page) {
  await expectMobileShellGeometry(page);
  await expectNoUnexpectedOverflow(page, [
    ".content-stack",
    ".organization-settings-panel",
    ".observability-panel",
    ".permission-matrix-panel"
  ]);
  await expect(page.locator(".permission-matrix-panel > .table-scroll")).toHaveCount(1);
  const scroller = await page.locator(".permission-matrix-panel > .table-scroll").evaluate((element) => {
    const bounds = element.getBoundingClientRect();
    return {
      containsWideTable: element.scrollWidth > element.clientWidth,
      insideViewport: bounds.left >= -1 && bounds.right <= document.documentElement.clientWidth + 1,
      overflowX: getComputedStyle(element).overflowX
    };
  });
  expect(scroller).toEqual({ containsWideTable: true, insideViewport: true, overflowX: "auto" });
}

async function expectSettingsVisualBaseline(page: import("@playwright/test").Page, name: string) {
  await page.addStyleTag({ content: ".topbar { position: static !important; }" });
  await expect(page.locator(".permission-matrix-panel")).toHaveScreenshot(name, {
    animations: "disabled",
    caret: "hide",
    maxDiffPixelRatio: 0.001,
    scale: "css"
  });
}

test.describe("visual responsive web mobile", () => {
  test("login remains usable at a 320px narrow viewport", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 700 });
    await page.goto("/");
    await expect(page.getByRole("button", { name: "Entrar com senha" })).toBeVisible();
    await stabilizeVisualPage(page);
    await expectVisualBaseline(page, "web-login-320x700.png", true);
    await expectNoUnexpectedOverflow(page, ["body", ".auth-page", ".login-panel"]);
    await expectControlsInsideViewport(page);
  });

  test("SAC guided flow stacks without overflow on the field viewport", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await loginPage(page, "sac@example.com");
    await openPrimaryNavigationItem(page, /^SAC/, /^Fluxos$/);
    await expect(page.getByRole("heading", { name: "Fluxos", exact: true })).toBeVisible();
    await stabilizeVisualPage(page);
    await expectMobileShellGeometry(page);
    await expectVisualBaseline(page, "web-sac-flows-390x844.png");
  });

  test("CaseFlow backup controls stack at the narrow management viewport", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await loginAsAdminPage(page);
    await openPrimaryNavigationItem(page, /^Administração/, /^CaseFlow Admin$/);
    // The geometry gate below still reports the sidebar overlap; DOM activation lets the visual baseline capture the blocked panel itself.
    await page.getByRole("tab", { name: "Backup" }).evaluate((tab: HTMLElement) => tab.click());
    await expect(page.getByLabel("Envelope de backup")).toBeVisible();
    await stabilizeVisualPage(page);
    await expectMobileShellGeometry(page);
    await expectNoUnexpectedOverflow(page, [".caseflow-admin", ".caseflow-backup-layout"]);
    await expectVisualBaseline(page, "web-caseflow-backup-360x800.png");
  });

  for (const viewport of [
    { width: 390, height: 844 },
    { width: 320, height: 700 }
  ]) {
    test(`settings contains its permission matrix at ${viewport.width}x${viewport.height}`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await openSettings(page);
      await expectSettingsGeometry(page);
      await expectSettingsVisualBaseline(page, `web-settings-${viewport.width}x${viewport.height}.png`);
    });
  }

  test("settings keeps its desktop layout", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openSettings(page);
    await expectNoUnexpectedOverflow(page, ["body", ".app-frame", ".workspace", ".permission-matrix-panel"]);
    await expectControlsInsideViewport(page);
    await expectSettingsVisualBaseline(page, "web-settings-1440x900.png");
  });
});
