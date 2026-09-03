import { expect, test, type Locator, type Page } from "@playwright/test";
import { e2eApiUrl, expectOk, loginAsAdminApi, loginAsAdminPage, openPrimaryNavigationItem } from "./helpers";

const checklist = "- [x] Conferir cadastro\n- [ ] Enviar retorno\n- Item comum";

async function expectInformativeChecklist(content: Locator, screenshotName: string) {
  const items = content.getByRole("listitem");
  await expect(items).toHaveCount(3);
  await expect(items.nth(0)).toContainText("Concluído. Conferir cadastro");
  await expect(items.nth(0)).toHaveAttribute("data-checked", "true");
  await expect(items.nth(1)).toContainText("Pendente. Enviar retorno");
  await expect(items.nth(1)).toHaveAttribute("data-checked", "false");
  await expect(items.nth(2)).toHaveText("Item comum");
  await expect(content.locator("input[type='checkbox']")).toHaveCount(0);
  await expect(content.locator("button, a[href], input, select, textarea, [tabindex], [role='tab'], [role='menuitem']")).toHaveCount(0);
  const accessibilityTree = await content.ariaSnapshot();
  expect(accessibilityTree).toContain("Concluído. Conferir cadastro");
  expect(accessibilityTree).toContain("Pendente. Enviar retorno");
  expect(accessibilityTree).not.toContain("checkbox");
  await expect(content).toHaveScreenshot(screenshotName, { animations: "disabled", caret: "hide", scale: "css" });
}

async function openSacDestination(page: Page, name: RegExp) {
  await openPrimaryNavigationItem(page, /^SAC/, name);
}

test("shared markdown checklist stays informative in Fluxos, Wiki and FAQ", async ({ page, request }) => {
  await loginAsAdminApi(request);
  const suffix = `${Date.now()}-${test.info().workerIndex}`;
  const flowTitle = `E2E Checklist Fluxo ${suffix}`;
  const wikiTitle = `E2E Checklist Wiki ${suffix}`;
  const faqTitle = `E2E Checklist FAQ ${suffix}`;

  const flow = await expectOk<{ flow: { id: string } }>(await request.post(e2eApiUrl("/v1/service-flows"), {
    data: {
      title: flowTitle,
      slug: `e2e-checklist-flow-${suffix}`,
      content: checklist,
      status: "PUBLISHED",
      steps: []
    }
  }));
  await expectOk(await request.post(e2eApiUrl("/v1/wiki/pages"), {
    data: { title: wikiTitle, slug: `e2e-checklist-wiki-${suffix}`, content: checklist }
  }));
  await expectOk(await request.post(e2eApiUrl("/v1/faq/threads"), {
    data: { title: faqTitle, body: checklist }
  }));

  await loginAsAdminPage(page);

  await openSacDestination(page, /^Fluxos$/);
  await page.getByLabel("Selecionar fluxo").selectOption(flow.flow.id);
  const flowContent = page.locator(".service-flow-runner > .wiki-content");
  await expect(flowContent).toBeVisible();
  await expectInformativeChecklist(flowContent, "task-at-457-flow-checklist.png");

  await openSacDestination(page, /^Wiki$/);
  await page.locator(".wiki-page-button").filter({ hasText: wikiTitle }).click();
  const wikiContent = page.locator(".wiki-reader-panel > .wiki-content");
  await expect(wikiContent).toBeVisible();
  await expectInformativeChecklist(wikiContent, "task-at-457-wiki-checklist.png");

  await openSacDestination(page, /^FAQ$/);
  await page.locator(".wiki-page-button").filter({ hasText: faqTitle }).click();
  const faqContent = page.locator(".wiki-reader-panel > .wiki-content").first();
  await expect(faqContent).toBeVisible();
  await expectInformativeChecklist(faqContent, "task-at-457-faq-checklist.png");
});
