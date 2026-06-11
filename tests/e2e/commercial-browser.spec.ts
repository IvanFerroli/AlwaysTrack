import { expect, test } from "@playwright/test";
import { expectOk, loginAsAdminApi, loginAsAdminPage } from "./helpers";

test.describe("commercial browser regression flows", () => {
  test("admin uploads and approves a deterministic DANFE XML through the UI", async ({ page }) => {
    await loginAsAdminPage(page);

    await page.getByRole("link", { name: /Notas/ }).first().click();
    await expect(page.getByRole("heading", { name: "Notas" })).toBeVisible();

    await page.locator('input[name="danfe"]').setInputFiles("tests/e2e/fixtures/nfe-e2e.xml");
    await page.getByRole("button", { name: "Enviar nota" }).click();

    const notesPanel = page.locator(".table-panel").filter({ hasText: "DANFEs recebidas" }).first();
    await expect(notesPanel.getByText("PENDING_REVIEW").first()).toBeVisible();
    await expect(notesPanel.getByText("703.444").first()).toBeVisible();

    await notesPanel.getByRole("button", { name: "Aceitar" }).first().click();
    await expect(notesPanel.getByText("APPROVED").first()).toBeVisible();

    await page.getByRole("link", { name: /Ranking/ }).first().click();
    await expect(page.getByRole("heading", { name: "Ranking" })).toBeVisible();
    await expect(page.getByText("Vendedor Demo").first()).toBeVisible();

    await page.getByRole("link", { name: /Extratos/ }).first().click();
    await expect(page.getByRole("heading", { name: "Extratos" })).toBeVisible();
    await expect(page.getByText("R$ 194,53").first()).toBeVisible();
  });

  test("non-admin suggests a Wiki edit and admin approves it with a decision comment", async ({ browser, page, request }) => {
    await loginAsAdminApi(request);
    const suffix = `${Date.now()}-${test.info().workerIndex}`;
    const title = `E2E Wiki Browser ${suffix}`;
    const updatedTitle = `${title} revisada`;
    const publishedContent = `## Base ${suffix}\nConteudo inicial #e2e`;
    const suggestedContent = `## Base ${suffix}\nConteudo aprovado via browser #e2e`;

    await expectOk(await request.post("/v1/wiki/pages", {
      data: {
        title,
        slug: `e2e-wiki-browser-${suffix}`,
        content: publishedContent
      }
    }));

    await page.goto("/");
    await page.getByLabel("Email").fill("vendedor@example.com");
    await page.getByLabel("Senha").fill("AlwaysTrackE2E123!");
    await page.getByRole("button", { name: "Entrar com senha" }).click();
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();

    await page.getByRole("link", { name: /Wiki/ }).first().click();
    await expect(page.getByRole("heading", { name: "Wiki" })).toBeVisible();
    await page.getByRole("button", { name: new RegExp(title) }).click();
    await page.locator(".wiki-edit-form").getByLabel("Titulo").fill(updatedTitle);
    await page.locator(".wiki-edit-form textarea").fill(suggestedContent);
    await page.getByRole("button", { name: "Enviar para aprovacao" }).click();
    await expect(page.getByText(/requisicao|pendente/i).first()).toBeVisible();

    const adminContext = await browser.newContext();
    const adminPage = await adminContext.newPage();
    try {
      await loginAsAdminPage(adminPage);
      await adminPage.getByRole("link", { name: /Wiki/ }).first().click();
      await expect(adminPage.getByRole("heading", { name: "Wiki" })).toBeVisible();
      await adminPage.getByLabel("Busca").fill(title);
      await adminPage.getByRole("button", { name: "Filtrar" }).click();
      await adminPage.getByRole("button", { name: new RegExp(title) }).click();
      await adminPage.getByLabel("Nota da decisao").fill("Aprovado no fluxo E2E de navegador.");
      await adminPage.getByRole("button", { name: "Aprovar" }).first().click();
      await expect(adminPage.getByRole("heading", { name: updatedTitle })).toBeVisible();
      await expect(adminPage.getByText("Conteudo aprovado via browser").first()).toBeVisible();
      await expect(adminPage.getByText("Aprovado no fluxo E2E de navegador.").first()).toBeVisible();
    } finally {
      await adminContext.close();
    }
  });
});
