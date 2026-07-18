import { expect, test } from "@playwright/test";
import { loginPage, openPrimaryNavigationItem } from "./helpers";

test.describe("SAC operations mobile browser matrix", () => {
  test("SAC opens the personal calendar and pauses without management controls", async ({ page }) => {
    await loginPage(page, "sac@example.com");

    await openPrimaryNavigationItem(page, /^SAC/, /^Escalas$/);
    await expect(page.getByRole("heading", { name: "Escalas", exact: true })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Minha semana" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Turnos da semana" })).toBeVisible();
    await expect(page.getByLabel("Equipe", { exact: true })).toHaveCount(0);
    await expect(page.getByLabel("Atendente", { exact: true })).toHaveCount(0);
    await expect(page.getByRole("tab", { name: "Cobertura" })).toHaveCount(0);
    await expect(page.getByRole("tab", { name: "Planejamento" })).toHaveCount(0);

    await openPrimaryNavigationItem(page, /^SAC/, /^Pausas$/);
    await expect(page.getByRole("heading", { name: "Pausas e cobertura" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Agenda" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Timeline de pausas" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Slots do dia" })).toBeVisible();
    await expect(page.getByLabel("Equipe", { exact: true })).toHaveCount(0);
    await expect(page.getByRole("tab", { name: "Configuração" })).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "Política de pausas" })).toHaveCount(0);
  });

  test("SAC reads performance and campaigns without write actions", async ({ page }) => {
    await loginPage(page, "sac@example.com");

    await openPrimaryNavigationItem(page, /^SAC/, /^Performance$/);
    await expect(page.getByRole("heading", { name: "Desempenho", exact: true })).toBeVisible();
    const performanceTable = page.getByRole("table", { name: "Histórico de indicadores SAC" });
    await expect(performanceTable).toBeVisible();
    await expect(performanceTable).toContainText("CSAT");
    await expect(performanceTable.getByRole("columnheader", { name: "Ações" })).toHaveCount(0);
    await expect(page.getByRole("tab", { name: "Lançamentos" })).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "Criar rascunho" })).toHaveCount(0);

    await openPrimaryNavigationItem(page, /^SAC/, /^Campanhas$/);
    await expect(page.getByRole("heading", { name: "Campanhas", exact: true })).toBeVisible();
    const campaignsTable = page.getByRole("table", { name: "Campanhas SAC" });
    await expect(campaignsTable).toBeVisible();
    await expect(campaignsTable).toContainText("CSAT acima de 92");
    await expect(campaignsTable.getByRole("columnheader", { name: "Ações" })).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "Criar campanha" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: /Publicar|Pausar|Encerrar/ })).toHaveCount(0);
  });
});
