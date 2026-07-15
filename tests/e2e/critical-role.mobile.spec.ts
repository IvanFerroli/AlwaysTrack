import { expect, test, type APIResponse, type Page } from "@playwright/test";
import { loginPage } from "./helpers";

const primaryNavigation = (page: Page) => page.getByRole("navigation", { name: "Navegação principal" });
const navButton = (page: Page, name: string | RegExp) => primaryNavigation(page).getByRole("button", { name });

async function expectForbidden(response: APIResponse) {
  expect(response.status()).toBe(403);
  expect(await response.json()).toMatchObject({ ok: false, error: { code: "FORBIDDEN" } });
}

test.describe("critical role mobile browser matrix", () => {
  test("SAC uses guided knowledge without commercial or administrative access on mobile", async ({ page }) => {
    await loginPage(page, "sac@example.com");

    await navButton(page, /^Fluxos/).click();
    await expect(page.getByRole("heading", { name: "Fluxos", exact: true })).toBeVisible();
    await navButton(page, /^Scriptoteca/).click();
    await expect(page.getByRole("heading", { name: "Scriptoteca", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: /Copiar script|Copiar passo/i }).first()).toBeVisible();

    await expect(navButton(page, /^Notas/)).toHaveCount(0);
    await expect(navButton(page, /Saúde CaseFlow/)).toHaveCount(0);
    await expect(navButton(page, /CaseFlow Admin/)).toHaveCount(0);
    await expectForbidden(await page.request.get("http://localhost:3334/v1/sales/documents"));
  });

  test("VENDEDOR sees only the own commercial journey and no management surfaces on mobile", async ({ page }) => {
    await loginPage(page, "vendedor@example.com");

    await navButton(page, /^Notas/).click();
    await expect(page.getByRole("heading", { name: "Notas", exact: true })).toBeVisible();
    await expect(page.getByText("DANFEs recebidas")).toBeVisible();
    await navButton(page, /^Ranking/).click();
    await expect(page.getByRole("heading", { name: "Ranking", exact: true })).toBeVisible();
    await expect(page.getByText("Vendedor Demo").first()).toBeVisible();

    await expect(navButton(page, /Saúde CaseFlow/)).toHaveCount(0);
    await expect(navButton(page, /Usuários\/Times/)).toHaveCount(0);
    await expectForbidden(await page.request.get("http://localhost:3334/v1/users"));
  });
});
