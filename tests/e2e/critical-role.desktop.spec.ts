import { expect, test, type APIResponse, type Page } from "@playwright/test";
import { e2eApiUrl, expectOk, loginApi, loginPage, openPrimaryNavigationItem, seedPassword } from "./helpers";

const primaryNavigation = (page: Page) => page.getByRole("navigation", { name: "Navegação principal" });
const navButton = (page: Page, name: string | RegExp) => primaryNavigation(page).getByRole("button", { name });

async function expectForbidden(response: APIResponse) {
  expect(response.status()).toBe(403);
  expect(await response.json()).toMatchObject({ ok: false, error: { code: "FORBIDDEN" } });
}

test.describe("critical role desktop browser matrix", () => {
  test("ADMIN manages CaseFlow diagnostics and rejects an invalid restore on desktop", async ({ page }) => {
    await loginPage(page, "admin@example.com");

    let failRulesOnce = true;
    await page.route("**/v1/case-flow/admin/rules", async (route) => {
      if (!failRulesOnce) return route.continue();
      failRulesOnce = false;
      await route.fulfill({
        status: 503,
        contentType: "application/json",
        body: JSON.stringify({ ok: false, error: { code: "E2E_TRANSIENT", message: "Synthetic transient failure." } })
      });
    });
    await openPrimaryNavigationItem(page, /^Administração/, /^CaseFlow Admin$/);
    await expect(page.getByRole("heading", { name: "CaseFlow Admin", exact: true })).toBeVisible();
    await expect(page.getByRole("alert")).toContainText("Synthetic transient failure");
    await page.getByRole("button", { name: "Atualizar dados" }).click();
    await expect(page.getByRole("alert")).toHaveCount(0);
    await expect(page.getByRole("table", { name: "Histórico de casos" })).toBeVisible();
    await page.getByRole("tab", { name: "Regras" }).click();
    await expect(page.getByRole("table", { name: "Regras CaseFlow" })).toBeVisible();
    await page.getByRole("tab", { name: "Conectores" }).click();
    await expect(page.getByRole("table", { name: "Conectores CaseFlow" })).toBeVisible();
    await page.getByRole("tab", { name: "Backup" }).click();
    await page.getByLabel("Envelope de backup").fill("{invalid-json");
    await page.getByRole("button", { name: "Criar novas versões" }).click();
    await expect(page.getByRole("alert")).toBeVisible();

    await openPrimaryNavigationItem(page, /^Administração/, /^Status CaseFlow$/);
    await expect(page.getByRole("heading", { name: "Saúde operacional" })).toBeVisible();
    await expect(page.getByRole("table", { name: "Saúde dos conectores" })).toBeVisible();
    await page.getByRole("tab", { name: "Sucesso" }).click();
    await expect(page.getByRole("table", { name: "Eficiência operacional" })).toBeVisible();
  });

  test("GESTOR monitors CaseFlow but cannot enter admin configuration on desktop", async ({ page, request }) => {
    await loginApi(request, "admin@example.com");
    const suffix = `${Date.now()}-${test.info().workerIndex}`;
    const email = `e2e-browser-gestor-${suffix}@example.com`;
    await expectOk<{ user: { id: string } }>(await request.post(e2eApiUrl("/v1/users"), { data: { name: `E2E Gestor ${suffix}`, email, password: seedPassword, role: "GESTOR", active: true } }));

    await loginPage(page, email);
    await openPrimaryNavigationItem(page, /^Administração/, /^Status CaseFlow$/);
    await expect(page.getByRole("heading", { name: "Saúde operacional" })).toBeVisible();
    await expect(navButton(page, /CaseFlow Admin/)).toHaveCount(0);
    await expectForbidden(await page.request.get("http://localhost:3334/v1/case-flow/admin/cases"));
  });

  test("FINANCEIRO inspects notes but cannot manage campaigns on desktop", async ({ page }) => {
    await loginPage(page, "financeiro@example.com");

    await openPrimaryNavigationItem(page, /^Vendas/, /^Notas$/);
    await expect(page.getByRole("heading", { name: "Notas", exact: true })).toBeVisible();
    await expect(page.getByText("DANFEs recebidas")).toBeVisible();
    await expect(navButton(page, /^Campanhas/)).toBeVisible();
    await expect(navButton(page, /Status CaseFlow/)).toHaveCount(0);
    await expectForbidden(await page.request.post("http://localhost:3334/v1/sales/campaigns", { data: { name: "Forbidden E2E campaign" } }));
  });

  test("SUPERVISOR monitors sales but cannot review or enter CaseFlow management on desktop", async ({ page }) => {
    await loginPage(page, "supervisor@example.com");

    await openPrimaryNavigationItem(page, /^Vendas/, /^Ranking$/);
    await expect(page.getByRole("heading", { name: "Ranking", exact: true })).toBeVisible();
    await expect(page.getByText("Vendedor Demo").first()).toBeVisible();
    const notes = await expectOk<{ items: Array<{ id: string }> }>(await page.request.get("http://localhost:3334/v1/sales/documents"));
    expect(notes.items.length).toBeGreaterThan(0);
    await expectForbidden(await page.request.patch(`http://localhost:3334/v1/sales/documents/${notes.items[0].id}/review`, { data: { status: "REJECTED", rejectionReason: "Synthetic E2E denial" } }));
    await expect(navButton(page, /Status CaseFlow/)).toHaveCount(0);
    await expect(navButton(page, /CaseFlow Admin/)).toHaveCount(0);
  });
});
