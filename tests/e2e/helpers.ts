import { expect, type APIRequestContext, type APIResponse, type Page } from "@playwright/test";

export const seedPassword = "AlwaysTrackE2E123!";

export type ApiEnvelope<T> = {
  ok: boolean;
  data: T;
};

export type ManagedUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  active: boolean;
  passwordHash?: string;
};

export async function expectOk<T>(response: APIResponse): Promise<T> {
  expect(response.ok(), await response.text()).toBeTruthy();
  const payload = (await response.json()) as ApiEnvelope<T>;
  expect(payload.ok).toBe(true);
  return payload.data;
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function loginApi(request: APIRequestContext, email: string, password = seedPassword) {
  let lastError: unknown;
  for (let attempt = 0; attempt < 20; attempt += 1) {
    try {
      await expectOk<{ user: ManagedUser }>(
        await request.post("/v1/auth/login", {
          data: {
            email,
            password
          }
        })
      );
      return;
    } catch (error) {
      lastError = error;
      if (!(error instanceof Error) || !error.message.includes("ECONNREFUSED")) throw error;
      await wait(250);
    }
  }
  throw lastError;
}

export async function loginAsAdminApi(request: APIRequestContext) {
  await loginApi(request, "admin@example.com");
}

export async function loginPage(page: Page, email: string, password = seedPassword) {
  await page.goto("/");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Senha").fill(password);
  await page.getByRole("button", { name: "Entrar com senha" }).click();
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
}

export async function loginAsAdminPage(page: Page) {
  await loginPage(page, "admin@example.com");
}
