import { expect, test } from "@playwright/test";
import { loginAsAdminPage, loginPage } from "./helpers";
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
    await page.getByRole("navigation", { name: "Navegação principal" }).getByRole("button", { name: /^Fluxos/ }).click();
    await expect(page.getByRole("heading", { name: "Fluxos", exact: true })).toBeVisible();
    await stabilizeVisualPage(page);
    await expectMobileShellGeometry(page);
    await expectVisualBaseline(page, "web-sac-flows-390x844.png");
  });

  test("CaseFlow backup controls stack at the narrow management viewport", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await loginAsAdminPage(page);
    await page.getByRole("navigation", { name: "Navegação principal" }).getByRole("button", { name: /CaseFlow Admin/ }).click();
    // The geometry gate below still reports the sidebar overlap; DOM activation lets the visual baseline capture the blocked panel itself.
    await page.getByRole("tab", { name: "Backup" }).evaluate((tab: HTMLElement) => tab.click());
    await expect(page.getByLabel("Envelope de backup")).toBeVisible();
    await stabilizeVisualPage(page);
    await expectMobileShellGeometry(page);
    await expectNoUnexpectedOverflow(page, [".caseflow-admin", ".caseflow-backup-layout"]);
    await expectVisualBaseline(page, "web-caseflow-backup-360x800.png");
  });
});
