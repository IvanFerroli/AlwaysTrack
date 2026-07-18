import { expect, test, type APIRequestContext } from "@playwright/test";
import {
  e2eApiUrl,
  expectOk,
  loginApi,
  loginAsAdminPage,
  loginPage,
  openPrimaryNavigationItem,
  seedPassword
} from "./helpers";

async function createGestorAccount(request: APIRequestContext) {
  await loginApi(request, "admin@example.com");
  const suffix = `${Date.now()}-${test.info().workerIndex}`;
  const email = `e2e-support-gestor-${suffix}@example.com`;
  await expectOk<{ user: { id: string } }>(
    await request.post(e2eApiUrl("/v1/users"), {
      data: {
        name: `E2E Support Gestor ${suffix}`,
        email,
        password: seedPassword,
        role: "GESTOR",
        active: true
      }
    })
  );
  return email;
}

test.describe("SAC operations desktop browser matrix", () => {
  test("GESTOR opens the same explicit team scheduling panel as ADMIN", async ({ page, request }) => {
    const gestorEmail = await createGestorAccount(request);
    await loginPage(page, gestorEmail);
    await openPrimaryNavigationItem(page, /^SAC/, /^Escalas$/);

    await expect(page.getByText("Nenhuma equipe é selecionada automaticamente.")).toBeVisible();
    const team = page.getByLabel("Equipe", { exact: true });
    await team.selectOption({ label: "SAC Atendimento" });
    await expect(page.getByRole("heading", { name: "Cobertura semanal" })).toBeVisible();
    await expect(page.getByRole("figure", { name: "Gráfico da cobertura semanal por horário" })).toBeVisible();
    await expect(page.getByLabel("Atendente", { exact: true })).toBeVisible();

    await page.getByRole("tab", { name: "Planejamento" }).click();
    await expect(page.getByRole("heading", { name: "Planejamento vigente e futuro" })).toBeVisible();
    await expect(page.getByRole("table", { name: "Padrões de turno persistidos" })).toContainText("Turno da manhã");
  });

  test("SAC acknowledges an announcement while ADMIN sees recurrence and named readers", async ({ page }) => {
    await loginPage(page, "sac@example.com");
    await openPrimaryNavigationItem(page, /^SAC/, /^Avisos$/);

    await expect(page.getByRole("heading", { name: "Avisos do dia" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Avisos recorrentes" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Nova série" })).toHaveCount(0);

    await page.getByRole("button", { name: /Conferência obrigatória de DANFE/ }).click();
    await expect(page.getByRole("heading", { name: "Conferência obrigatória de DANFE", exact: true })).toBeVisible();
    await expect(page.getByRole("region", { name: "Acompanhamento da ciência" })).toHaveCount(0);
    await page.getByRole("button", { name: "Marcar ciência" }).click();
    await expect(page.getByText("Você já marcou ciência")).toBeVisible();
    await expect(page.getByRole("button", { name: "Marcar ciência" })).toHaveCount(0);

    await page.getByRole("button", { name: /Sair/ }).click();
    await expect(page.getByLabel("Email")).toBeVisible();
    await loginAsAdminPage(page);
    await openPrimaryNavigationItem(page, /^SAC/, /^Avisos$/);

    await expect(page.getByRole("heading", { name: "Avisos recorrentes" })).toBeVisible();
    const seriesTable = page.getByRole("table", { name: "Séries de avisos recorrentes" });
    await expect(seriesTable).toBeVisible();
    await expect(seriesTable).toContainText("Lembrete de NF");
    await expect(seriesTable).toContainText("Dias 14 e 29");

    await page.getByRole("button", { name: /Conferência obrigatória de DANFE/ }).click();
    const compliance = page.getByRole("region", { name: "Acompanhamento da ciência" });
    await expect(compliance).toBeVisible();
    const acknowledgedReaders = compliance.getByText(/^Cientes \(\d+\)$/).locator("..");
    await expect(acknowledgedReaders.getByText("SAC Demo", { exact: true })).toBeVisible();
  });
});
