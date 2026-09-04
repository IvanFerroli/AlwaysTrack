import { expect, test, type Locator, type Page } from "@playwright/test";
import { loginAsAdminPage, openPrimaryNavigationItem } from "./helpers";

async function dataTransferWithFiles(page: Page, files: Array<{ name: string; type: string }>) {
  return page.evaluateHandle((entries) => {
    const transfer = new DataTransfer();
    for (const entry of entries) {
      transfer.items.add(new File(["task-at-466-image"], entry.name, { type: entry.type }));
    }
    return transfer;
  }, files);
}

async function openWikiCreateEditor(page: Page) {
  await loginAsAdminPage(page);
  await openPrimaryNavigationItem(page, /^SAC/, /^Wiki$/);
  await expect(page.getByRole("heading", { name: "Wiki", exact: true })).toBeVisible();
  return page.locator(".wiki-editor").first();
}

async function dispatchFileDrag(target: Locator, dataTransfer: Awaited<ReturnType<typeof dataTransferWithFiles>>) {
  await target.dispatchEvent("dragenter", { dataTransfer });
  await target.dispatchEvent("dragover", { dataTransfer });
}

test("TASK-AT-466 oferece drop no desktop e picker universal no mobile", async ({ page }, testInfo) => {
  const editor = await openWikiCreateEditor(page);
  const dropTarget = editor.locator(".wiki-editor-image-drop");
  const picker = editor.getByRole("button", { name: "Imagem" });

  await expect(picker).toBeVisible();
  if (testInfo.project.name === "mobile") {
    await expect(dropTarget).toBeHidden();
    await expect(editor).toHaveScreenshot("task-at-466-mobile-picker-fallback.png", {
      animations: "disabled",
      caret: "hide",
      scale: "css"
    });
    return;
  }

  await expect(dropTarget).toBeVisible();
  await expect(dropTarget).toContainText("Arraste e solte uma imagem PNG, JPG ou WebP");

  const uploadRequests: string[] = [];
  await page.route("**/v1/wiki/attachments?*", async (route) => {
    uploadRequests.push((await route.request().headerValue("x-file-name")) ?? "");
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        ok: true,
        data: { attachment: { id: "task-at-466", fileName: "evidencia.png", markdownUrl: "/v1/wiki/attachments/task-at-466" } }
      })
    });
  });

  const validTransfer = await dataTransferWithFiles(page, [{ name: "evidencia.png", type: "image/png" }]);
  await dispatchFileDrag(dropTarget, validTransfer);
  await expect(dropTarget).toHaveClass(/is-drag-over/);
  await expect(dropTarget).toContainText("Solte a imagem aqui");
  await expect(editor).toHaveScreenshot("task-at-466-desktop-drag-over.png", {
    animations: "disabled",
    caret: "hide",
    scale: "css"
  });

  await dropTarget.dispatchEvent("drop", { dataTransfer: validTransfer });
  await expect(editor.getByRole("textbox", { name: "Conteudo" })).toHaveValue(
    "![evidencia.png](http://localhost:3334/v1/wiki/attachments/task-at-466)"
  );
  expect(uploadRequests).toEqual(["evidencia.png"]);

  const multipleTransfer = await dataTransferWithFiles(page, [
    { name: "uma.png", type: "image/png" },
    { name: "duas.webp", type: "image/webp" }
  ]);
  await dropTarget.dispatchEvent("drop", { dataTransfer: multipleTransfer });
  await expect(editor.getByRole("alert")).toContainText("Solte apenas uma imagem por vez");
  expect(uploadRequests).toEqual(["evidencia.png"]);
});
