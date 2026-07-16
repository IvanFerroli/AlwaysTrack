import { expect, test } from "@playwright/test";
import { loginAsAdminPage, openPrimaryNavigationItem } from "./helpers";
import {
  expectControlsInsideViewport,
  expectNoUnexpectedOverflow,
  expectRegionsNotOverlapping,
  expectVisualBaseline,
  stabilizeVisualPage
} from "./visual-responsive.helpers";

const visualShellSelectors = ["body", ".app-frame", ".workspace", ".topbar"] as const;

async function expectDesktopShellGeometry(page: import("@playwright/test").Page) {
  await expectNoUnexpectedOverflow(page, visualShellSelectors);
  await expectControlsInsideViewport(page);
  await expectRegionsNotOverlapping(page, [[".sidebar", ".workspace"]]);
}

test.describe("visual responsive web desktop", () => {
  test("login remains stable at the minimum supported desktop viewport", async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Entrar" })).toBeVisible();
    await stabilizeVisualPage(page);
    await expectVisualBaseline(page, "web-login-1024x768.png");
    await expectNoUnexpectedOverflow(page, ["body", ".auth-page", ".login-panel"]);
    await expectControlsInsideViewport(page);
  });

  test("CaseFlow administration preserves navigation, tabs and connector table", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await loginAsAdminPage(page);
    await openPrimaryNavigationItem(page, /^Administração/, /^CaseFlow Admin$/);
    await expect(page.getByRole("heading", { name: "CaseFlow Admin", exact: true })).toBeVisible();
    await page.getByRole("tab", { name: "Conectores" }).click();
    await expect(page.getByRole("table", { name: "Conectores CaseFlow" })).toBeVisible();
    await stabilizeVisualPage(page);
    await expectDesktopShellGeometry(page);
    await expectVisualBaseline(page, "web-caseflow-connectors-1440x900.png");
  });

  test("collapsed desktop navigation does not shift or cover the workspace", async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 });
    await loginAsAdminPage(page);
    await openPrimaryNavigationItem(page, /^Administração/, /^CaseFlow Admin$/);
    await page.getByRole("tab", { name: "Conectores" }).click();
    await expect(page.getByRole("table", { name: "Conectores CaseFlow" })).toBeVisible();
    await page.getByRole("button", { name: "Recolher menu lateral" }).click();
    await expect(page.getByRole("button", { name: "Expandir menu lateral" })).toBeVisible();
    await stabilizeVisualPage(page);
    await expect(page.locator(".app-frame")).toHaveClass(/sidebar-collapsed/);
    await expectDesktopShellGeometry(page);
    await expectVisualBaseline(page, "web-navigation-collapsed-1024x768.png");
  });
});
