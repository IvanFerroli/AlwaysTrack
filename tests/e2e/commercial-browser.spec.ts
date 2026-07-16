import { expect, test } from "@playwright/test";
import { e2eApiUrl, expectOk, loginAsAdminApi, loginAsAdminPage, openPrimaryNavigationItem } from "./helpers";

test.describe("commercial browser regression flows", () => {
  test("admin uploads and approves a deterministic DANFE XML through the UI", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === "mobile", "Mutating DANFE fixture runs once against the shared E2E database.");
    await loginAsAdminPage(page);

    await openPrimaryNavigationItem(page, /^Vendas/, /^Notas$/);
    await expect(page.getByRole("heading", { name: "Notas" })).toBeVisible();

    await page.locator('input[name="danfe"]').setInputFiles("tests/e2e/fixtures/nfe-e2e.xml");
    await page.getByRole("button", { name: "Enviar nota" }).click();

    const notesPanel = page.locator(".table-panel").filter({ hasText: "DANFEs recebidas" }).first();
    const uploadedRow = notesPanel.getByRole("row", { name: /NF 703444/ });
    await expect(uploadedRow.getByText("PENDING_REVIEW")).toBeVisible();
    await expect(uploadedRow.getByText("703444", { exact: true })).toBeVisible();

    await uploadedRow.getByRole("button", { name: "Aceitar", exact: true }).click();
    await expect(uploadedRow.getByText("APPROVED")).toBeVisible();

    await openPrimaryNavigationItem(page, /^Vendas/, /^Ranking$/);
    await expect(page.getByRole("heading", { name: "Ranking" })).toBeVisible();
    await expect(page.getByRole("cell", { name: "Vendedor Demo", exact: true }).first()).toBeVisible();

    await openPrimaryNavigationItem(page, /^Vendas/, /^Extratos$/);
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

    await expectOk(await request.post(e2eApiUrl("/v1/wiki/pages"), {
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

    await openPrimaryNavigationItem(page, /^SAC/, /^Wiki$/);
    await expect(page.getByRole("heading", { name: "Wiki", exact: true })).toBeVisible();
    await page.locator(".wiki-page-button").filter({ hasText: title }).click();
    await expect(page.getByRole("heading", { name: title, exact: true })).toBeVisible();
    await page.locator(".wiki-edit-form").getByLabel("Titulo").fill(updatedTitle);
    await page.locator(".wiki-edit-form textarea").fill(suggestedContent);
    await page.getByRole("button", { name: "Enviar para aprovacao" }).click();
    await expect(page.getByText(/requisicao|pendente/i).first()).toBeVisible();

    const adminContext = await browser.newContext();
    const adminPage = await adminContext.newPage();
    try {
      await loginAsAdminPage(adminPage);
      await openPrimaryNavigationItem(adminPage, /^SAC/, /^Wiki$/);
      await expect(adminPage.getByRole("heading", { name: "Wiki", exact: true })).toBeVisible();
      await adminPage.getByPlaceholder("Titulo, slug, conteudo ou tag").fill(title);
      await adminPage.getByRole("button", { name: "Filtrar" }).click();
      await adminPage.locator(".wiki-page-button").filter({ hasText: title }).click();
      await expect(adminPage.getByRole("heading", { name: title, exact: true })).toBeVisible();
      await adminPage.locator(".decision-note-field input").fill("Aprovado no fluxo E2E de navegador.");
      const requestRow = adminPage.getByRole("row", { name: new RegExp(title) });
      await requestRow.getByRole("button", { name: "Aprovar", exact: true }).click();
      await expect(adminPage.getByRole("heading", { name: updatedTitle })).toBeVisible();
      await expect(adminPage.getByText("Conteudo aprovado via browser").first()).toBeVisible();
    } finally {
      await adminContext.close();
    }

    await page.reload();
    await expect(page.getByRole("heading", { name: updatedTitle })).toBeVisible();
    await expect(page.getByText("Aprovado no fluxo E2E de navegador.").first()).toBeVisible();
  });

  test("Wiki editor previews unsafe Markdown without executing it on mobile", async ({ page, request }) => {
    await loginAsAdminApi(request);
    const suffix = `${Date.now()}-${test.info().workerIndex}`;
    const title = `E2E Wiki Segura ${suffix}`;
    const unsafeContent = `## Preview seguro\n<script>window.__wikiXss = true</script>\n[link inseguro](javascript:alert(1))`;

    await expectOk(await request.post(e2eApiUrl("/v1/wiki/pages"), {
      data: {
        title,
        slug: `e2e-wiki-segura-${suffix}`,
        content: "## Conteudo inicial\nPagina usada pelo quality gate da Wiki."
      }
    }));

    await page.setViewportSize({ width: 390, height: 844 });
    await loginAsAdminPage(page);
    await openPrimaryNavigationItem(page, /^SAC/, /^Wiki$/);
    await page.locator(".wiki-page-button").filter({ hasText: title }).click();
    await expect(page.getByRole("heading", { name: title, exact: true })).toBeVisible();

    const editForm = page.locator(".wiki-edit-form");
    const editor = editForm.locator(".wiki-editor");
    await expect(editor.getByLabel("Ferramentas de formatacao")).toBeVisible();
    await editor.locator("textarea").fill(unsafeContent);
    await editor.getByRole("tab", { name: "Preview" }).click();

    await expect(editor.getByRole("heading", { name: "Preview seguro" })).toBeVisible();
    await expect(editor.getByText("<script>window.__wikiXss = true</script>")).toBeVisible();
    await expect(editor.getByRole("link", { name: "link inseguro" })).toHaveAttribute("href", "#");
    await expect(editor.locator("script")).toHaveCount(0);
    expect(await page.evaluate(() => (window as Window & { __wikiXss?: boolean }).__wikiXss)).toBeUndefined();

    const toolbarFitsViewport = await editor.getByLabel("Ferramentas de formatacao").evaluate((toolbar) => {
      const viewportWidth = document.documentElement.clientWidth;
      return Array.from(toolbar.querySelectorAll("button")).every((button) => {
        const bounds = button.getBoundingClientRect();
        return bounds.left >= 0 && bounds.right <= viewportWidth;
      });
    });
    expect(toolbarFitsViewport).toBe(true);
  });
});
