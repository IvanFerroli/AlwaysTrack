import { expect, test, type APIRequestContext, type APIResponse, type Playwright } from "@playwright/test";
import { expectOk, loginApi, loginAsAdminApi, seedPassword } from "./helpers";

type CriticalRole = "ADMIN" | "GESTOR" | "SAC" | "FINANCEIRO" | "VENDEDOR" | "SUPERVISOR";
type ServiceCase = { id: string; organizationId: string; status: string; summary: string | null };

const seededAccounts: Record<Exclude<CriticalRole, "GESTOR">, string> = {
  ADMIN: "admin@example.com",
  SAC: "sac@example.com",
  FINANCEIRO: "financeiro@example.com",
  VENDEDOR: "vendedor@example.com",
  SUPERVISOR: "supervisor@example.com"
};

async function expectForbidden(response: APIResponse) {
  expect(response.status()).toBe(403);
  expect(await response.json()).toMatchObject({ ok: false, error: { code: "FORBIDDEN" } });
}

async function createManagerAccount(request: APIRequestContext) {
  await loginAsAdminApi(request);
  const suffix = `${Date.now()}-${test.info().project.name}-${test.info().workerIndex}`;
  const email = `e2e-gestor-${suffix}@example.com`;
  const created = await expectOk<{ user: { id: string } }>(
    await request.post("/v1/users", {
      data: {
        name: `E2E Gestor ${suffix}`,
        email,
        password: seedPassword,
        role: "SAC",
        active: true
      }
    })
  );
  await expectOk(await request.patch(`/v1/users/${created.user.id}`, { data: { role: "GESTOR" } }));
  return email;
}

async function roleContext(playwright: Playwright, request: APIRequestContext, role: CriticalRole) {
  const email = role === "GESTOR" ? await createManagerAccount(request) : seededAccounts[role];
  const context = await playwright.request.newContext({ baseURL: "http://127.0.0.1:3334" });
  await loginApi(context, email);
  return context;
}

test.describe("critical role CaseFlow permission matrix", () => {
  for (const role of ["ADMIN", "GESTOR", "SAC", "FINANCEIRO", "VENDEDOR", "SUPERVISOR"] as const) {
    test(`${role} completes its positive journey and obeys its negative boundary`, async ({ playwright, request }) => {
      const actor = await roleContext(playwright, request, role);
      try {
        const summary = `E2E synthetic ${role} ${Date.now()}-${test.info().workerIndex}`;
        const created = await expectOk<ServiceCase>(
          await actor.post("/v1/case-flow/cases", { data: { summary } })
        );
        expect(created).toMatchObject({ status: "NEW", summary });

        const loaded = await expectOk<ServiceCase>(await actor.get(`/v1/case-flow/cases/${created.id}`));
        expect(loaded).toMatchObject({ id: created.id, organizationId: created.organizationId, summary });
        const response = await actor.get("/v1/case-flow/admin/cases");
        if (role === "ADMIN") {
          const data = await expectOk<{ items: ServiceCase[] }>(response);
          expect(data.items).toEqual(expect.any(Array));

          const invalid = await actor.post("/v1/case-flow/cases", { data: { summary: 42 } });
          expect(invalid.status()).toBe(400);
          expect(await invalid.json()).toMatchObject({ ok: false, error: { code: "INVALID_INPUT" } });
        } else {
          await expectForbidden(response);
        }

        if (role === "GESTOR") {
          const health = await expectOk<{ connectors: unknown[] }>(await actor.get("/v1/case-flow/connectors/health"));
          const success = await expectOk<{ dailyCases: number }>(await actor.get("/v1/case-flow/metrics/success"));
          expect(health.connectors).toEqual(expect.any(Array));
          expect(success.dailyCases).toBeGreaterThanOrEqual(0);
          await expectForbidden(await actor.get("/v1/case-flow/admin/config/export"));
        }

        if (role === "SAC") {
          await expectOk(await actor.get("/v1/service-flows"));
          await expectOk(await actor.get("/v1/script-library"));
          await expectForbidden(await actor.get("/v1/sales/documents"));
          await expectForbidden(await actor.get("/v1/case-flow/connectors/health"));
        }
      } finally {
        await actor.dispose();
      }
    });
  }
});
