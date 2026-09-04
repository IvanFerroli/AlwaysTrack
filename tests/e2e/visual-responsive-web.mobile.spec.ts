import { expect, test } from "@playwright/test";
import { loginAsAdminPage, loginPage, openPrimaryNavigationItem, primaryNavigation } from "./helpers";
import {
  expectControlsInsideViewport,
  expectMobileFirstViewportContent,
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

// Focal assert for TASK-AT-462: the top-nav group chips are the elements that clipped at
// ~360px ("Administração" shrunk below its nowrap content and spilled past the topbar).
// Each chip must contain its own content instead of painting over neighbors.
async function expectTopNavChipsContained(page: import("@playwright/test").Page) {
  const failures = await page.evaluate(() => {
    const tolerance = 1;
    return Array.from(document.querySelectorAll<HTMLElement>(".top-nav button"))
      .filter((chip) => {
        const style = getComputedStyle(chip);
        return style.display !== "none" && style.visibility !== "hidden" && chip.clientWidth > 0;
      })
      .flatMap((chip) => {
        const label = chip.textContent?.trim() ?? chip.tagName;
        return chip.scrollWidth > chip.clientWidth + tolerance
          ? [`top-nav chip "${label}": content ${chip.scrollWidth}px > box ${chip.clientWidth}px`]
          : [];
      });
  });

  expect(failures, "Top navigation chip content clipped").toEqual([]);
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
    await expectTopNavChipsContained(page);
    await expectVisualBaseline(page, "web-sac-flows-390x844.png");
  });

  test("keeps SAC's first viewport free of the expanded nav tree after selecting Fluxos, and reopens the group with aria-current", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await loginPage(page, "sac@example.com");
    await openPrimaryNavigationItem(page, /^SAC/, /^Fluxos$/);
    await expect(page.getByRole("heading", { name: "Fluxos", exact: true })).toBeVisible();
    await stabilizeVisualPage(page);
    await expectMobileShellGeometry(page);
    await expectTopNavChipsContained(page);
    await expectMobileFirstViewportContent(page, { firstBlockSelector: ".operational-filters" });

    const toggle = primaryNavigation(page).getByRole("button", { name: /^SAC/ });
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await expect(toggle).toHaveClass(/active/);
    await expect(page.getByRole("group", { name: "Opções de SAC" })).toHaveCount(0);

    // Touch/click reopens the group and keeps the active child identifiable.
    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
    await expect(primaryNavigation(page).getByRole("button", { name: /^Fluxos/ })).toHaveAttribute("aria-current", "page");

    // Keyboard activation (Enter, then Space) toggles the group the same way as touch.
    await toggle.focus();
    await page.keyboard.press("Enter");
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await page.keyboard.press("Space");
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
  });

  test("keeps Administração's first viewport free of the expanded nav tree after selecting Usuários/Times", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await loginAsAdminPage(page);
    await openPrimaryNavigationItem(page, /^Administração/, /^Usuários\/Times$/);
    await expect(page.getByRole("heading", { name: "Usuários/Times", exact: true })).toBeVisible();
    await stabilizeVisualPage(page);
    await expectMobileShellGeometry(page);
    await expectTopNavChipsContained(page);
    await expectMobileFirstViewportContent(page, { firstBlockSelector: ".operational-filters" });

    const toggle = primaryNavigation(page).getByRole("button", { name: /^Administração/ });
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await expect(toggle).toHaveClass(/active/);

    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
    await expect(primaryNavigation(page).getByRole("button", { name: /^Usuários\/Times/ })).toHaveAttribute("aria-current", "page");
  });

  test("SAC Fluxos keeps the collapsed nav tree free of overflow at the narrower 320x700 field viewport", async ({ page }) => {
    // Smoke coverage for acceptance criterion 5 (no overflow/overlap at 320x700). The sidebar
    // nav-tree stays compact here too (same collapse-on-select fix as 390x844); first-viewport
    // *content* is not asserted at this narrower width because the topbar's own top-nav/account
    // row wraps onto multiple lines independently of the nav-group fix — see the task closure for
    // that pre-existing, out-of-scope residual.
    await page.setViewportSize({ width: 320, height: 700 });
    await loginPage(page, "sac@example.com");
    await openPrimaryNavigationItem(page, /^SAC/, /^Fluxos$/);
    await expect(page.getByRole("heading", { name: "Fluxos", exact: true })).toBeVisible();
    await stabilizeVisualPage(page);
    await expectMobileShellGeometry(page);
    await expectTopNavChipsContained(page);

    // The nav-group collapse itself (this task's actual scope) holds at 320px too: no expanded
    // submenu role in the tree, and the sidebar stays compact instead of consuming the viewport.
    await expect(page.getByRole("group", { name: "Opções de SAC" })).toHaveCount(0);
    const sidebarHeight = await page.locator(".sidebar").evaluate((element) => element.getBoundingClientRect().height);
    expect(sidebarHeight, "sidebar should stay compact (collapsed nav-group) at 320x700").toBeLessThan(320);
  });

  test("CaseFlow backup controls stack at the narrow management viewport", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await loginAsAdminPage(page);
    await openPrimaryNavigationItem(page, /^Administração/, /^CaseFlow Admin$/);
    await page.getByRole("tab", { name: "Backup" }).evaluate((tab: HTMLElement) => tab.click());
    await expect(page.getByLabel("Envelope de backup")).toBeVisible();
    await stabilizeVisualPage(page);
    await expectMobileShellGeometry(page);
    await expectNoUnexpectedOverflow(page, [".caseflow-admin", ".caseflow-backup-layout"]);
    await expectTopNavChipsContained(page);
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

  test("keeps the desktop active-group-expanded navigation baseline after selecting a child", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await loginPage(page, "sac@example.com");
    await openPrimaryNavigationItem(page, /^SAC/, /^Fluxos$/);
    await expect(page.getByRole("heading", { name: "Fluxos", exact: true })).toBeVisible();

    const toggle = primaryNavigation(page).getByRole("button", { name: /^SAC/ });
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
    await expect(primaryNavigation(page).getByRole("button", { name: /^Fluxos/ })).toHaveAttribute("aria-current", "page");
  });
});
