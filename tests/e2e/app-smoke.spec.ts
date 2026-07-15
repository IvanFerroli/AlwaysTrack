import { expect, test } from "@playwright/test";
import { loginAsAdminPage } from "./helpers";

test.describe("AlwaysTrack app smoke", () => {
  test("admin can log in and navigate core commercial areas", async ({ page }) => {
    await loginAsAdminPage(page);
    const navigation = page.getByRole("navigation", { name: "Navegação principal" });

    for (const section of ["Notas", "Ranking", "Campanhas", "Extratos", "Avisos", "Fluxos", "Scriptoteca", "Wiki", "FAQ", "Usuários/Times"]) {
      await navigation.getByRole("button", { name: new RegExp(`^${section}\\b`) }).click();
      await expect(page.getByRole("heading", { name: section, exact: true })).toBeVisible();
    }

    await navigation.getByRole("button", { name: /^Scriptoteca\b/ }).click();
    await expect(page.getByRole("heading", { name: "Roteiros" })).toBeVisible();
    await expect(page.getByRole("button", { name: /Copiar script|Copiar passo/i }).first()).toBeVisible();
  });
});
