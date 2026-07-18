import { expect, test } from "@playwright/test";
import { loginAsAdminPage, loginPage, openPrimaryNavigationItem } from "./helpers";

test.describe("SAC scheduling browser flow", () => {
  test("SAC sees only the personal calendar, extras and exchanges", async ({ page }) => {
    await loginPage(page, "sac@example.com");
    await openPrimaryNavigationItem(page, /^SAC/, /^Escalas$/);

    await expect(page.getByRole("heading", { name: "Escalas", exact: true })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Minha semana" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Turnos da semana" })).toBeVisible();
    await expect(page.getByText("Turno-base").first()).toBeVisible();
    await expect(page.getByRole("tab", { name: "Extras" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Trocas" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Planejamento" })).toHaveCount(0);
  });

  test("manager selects a team explicitly and sees persisted planning", async ({ page }) => {
    await loginAsAdminPage(page);
    await openPrimaryNavigationItem(page, /^SAC/, /^Escalas$/);

    await expect(page.getByText("Nenhuma equipe é selecionada automaticamente.")).toBeVisible();
    await page.getByLabel("Equipe").selectOption({ index: 1 });
    await expect(page.getByRole("heading", { name: "Cobertura semanal" })).toBeVisible();
    await expect(page.getByRole("figure", { name: "Gráfico da cobertura semanal por horário" })).toBeVisible();

    await page.getByRole("tab", { name: "Planejamento" }).click();
    await expect(page.getByRole("heading", { name: "Planejamento vigente e futuro" })).toBeVisible();
    await expect(page.getByRole("table", { name: "Padrões de turno persistidos" })).toContainText("Turno da manhã");
    await expect(page.getByRole("table", { name: "Padrões de turno persistidos" })).toContainText("Turno da tarde");
  });
});
