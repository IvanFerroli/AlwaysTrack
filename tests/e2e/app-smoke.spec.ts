import { expect, test } from "@playwright/test";
import { loginAsAdminPage } from "./helpers";

test.describe("AlwaysTrack app smoke", () => {
  test("admin can log in and navigate core commercial areas", async ({ page }) => {
    await loginAsAdminPage(page);

    for (const section of ["Notas", "Ranking", "Campanhas", "Extratos", "Avisos", "Fluxos", "Scriptoteca", "Wiki", "FAQ", "Usuários/Times"]) {
      await page.getByRole("link", { name: new RegExp(section) }).first().click();
      await expect(page.getByRole("heading", { name: section })).toBeVisible();
    }

    await page.getByRole("link", { name: /Scriptoteca/ }).first().click();
    await expect(page.getByRole("heading", { name: "Roteiros" })).toBeVisible();
    await expect(page.getByRole("button", { name: /Copiar script|Copiar passo/i }).first()).toBeVisible();
  });
});
