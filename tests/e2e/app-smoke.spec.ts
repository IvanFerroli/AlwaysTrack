import { expect, test, type Page } from "@playwright/test";

const seedPassword = "AlwaysTrackE2E123!";

async function loginAsAdmin(page: Page) {
  await page.goto("/");
  await page.getByLabel("Email").fill("admin@example.com");
  await page.getByLabel("Senha").fill(seedPassword);
  await page.getByRole("button", { name: "Entrar com senha" }).click();
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
}

test.describe("AlwaysTrack app smoke", () => {
  test("admin can log in and navigate core commercial areas", async ({ page }) => {
    await loginAsAdmin(page);

    for (const section of ["Notas", "Ranking", "Campanhas", "Extratos", "Wiki", "FAQ", "Usuários/Times"]) {
      await page.getByRole("link", { name: new RegExp(section) }).first().click();
      await expect(page.getByRole("heading", { name: section })).toBeVisible();
    }
  });
});
