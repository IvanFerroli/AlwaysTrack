import { expect, test, type APIResponse, type Playwright } from "@playwright/test";
import { expectOk, loginApi } from "./helpers";

async function roleContext(playwright: Playwright, email: string) {
  const context = await playwright.request.newContext({ baseURL: "http://127.0.0.1:3334" });
  await loginApi(context, email);
  return context;
}

async function expectForbidden(response: APIResponse) {
  expect(response.status()).toBe(403);
  expect(await response.json()).toMatchObject({ ok: false, error: { code: "FORBIDDEN" } });
}

test.describe("Closed beta permission boundaries", () => {
  test("SAC can use knowledge but cannot reach commercial or admin APIs", async ({ playwright }) => {
    const sac = await roleContext(playwright, "sac@example.com");
    try {
      await expectOk(await sac.get("/v1/wiki/pages"));
      await expectOk(await sac.get("/v1/faq/threads"));
      await expectOk(await sac.get("/v1/announcements"));
      await expectOk(await sac.get("/v1/script-library"));
      await expectOk(await sac.get("/v1/service-flows"));

      const personal = await expectOk<{ script: { id: string; title: string; suggestion: null | { status: string } } }>(
        await sac.post("/v1/script-library/personal-scripts", {
          data: {
            title: `E2E Script pessoal ${Date.now()}`,
            channel: "WHATSAPP",
            body: "Ola {nome_cliente}, este e meu script pessoal de homologacao.",
            tags: ["e2e", "beta"],
            flowIds: []
          }
        })
      );
      expect(personal.script.suggestion).toBeNull();
      const suggested = await expectOk<{ script: { id: string; suggestion: { status: string } | null } }>(
        await sac.post(`/v1/script-library/personal-scripts/${personal.script.id}/suggest`)
      );
      expect(suggested.script.suggestion?.status).toBe("SUGGESTED");

      for (const path of [
        "/v1/sales/dashboard",
        "/v1/sales/documents",
        "/v1/sales/ranking",
        "/v1/sales/statements",
        "/v1/sales/campaigns",
        "/v1/users",
        "/v1/organization/settings",
        "/v1/audit-logs"
      ]) {
        await expectForbidden(await sac.get(path));
      }

      await expectForbidden(
        await sac.post("/v1/attachments/operational", {
          params: { surface: "settings" },
          headers: { "content-type": "image/png", "x-file-name": "forbidden.png" },
          data: Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00])
        })
      );

      const search = await expectOk<{ groups: Array<{ key: string }> }>(await sac.get("/v1/search", { params: { q: "danfe" } }));
      expect(search.groups.map((group) => group.key)).not.toEqual(expect.arrayContaining(["notes", "sellers", "campaigns"]));
    } finally {
      await sac.dispose();
    }
  });

  test("seller sees only own commercial scope and cannot review", async ({ playwright }) => {
    const seller = await roleContext(playwright, "vendedor@example.com");
    try {
      const notes = await expectOk<{ items: Array<{ id: string; sellerProfile: { displayName: string } }> }>(
        await seller.get("/v1/sales/documents")
      );
      expect(notes.items.length).toBeGreaterThan(0);
      expect(notes.items.every((item) => item.sellerProfile.displayName === "Vendedor Demo")).toBe(true);

      const ranking = await expectOk<{ items: Array<{ sellerName: string }> }>(await seller.get("/v1/sales/ranking"));
      expect(ranking.items.every((item) => item.sellerName === "Vendedor Demo")).toBe(true);

      const statements = await expectOk<{ consolidations: { bySeller: Array<{ sellerName: string }> } }>(
        await seller.get("/v1/sales/statements")
      );
      expect(statements.consolidations.bySeller.every((item) => item.sellerName === "Vendedor Demo")).toBe(true);

      await expectForbidden(
        await seller.patch(`/v1/sales/documents/${notes.items[0].id}/review`, {
          data: { status: "REJECTED", rejectionReason: "E2E must be forbidden" }
        })
      );
      await expectForbidden(await seller.get("/v1/users"));
      await expectForbidden(await seller.get("/v1/audit-logs"));
    } finally {
      await seller.dispose();
    }
  });

  test("Supervisor monitors without reviewing or managing campaigns", async ({ playwright }) => {
    const supervisor = await roleContext(playwright, "supervisor@example.com");
    try {
      const notes = await expectOk<{ items: Array<{ id: string }> }>(await supervisor.get("/v1/sales/documents"));
      expect(notes.items.length).toBeGreaterThan(0);
      await expectForbidden(
        await supervisor.patch(`/v1/sales/documents/${notes.items[0].id}/review`, {
          data: { status: "REJECTED", rejectionReason: "E2E must be forbidden" }
        })
      );
      await expectForbidden(
        await supervisor.post("/v1/sales/campaigns", {
          data: { name: "Forbidden campaign", startsAt: "2026-06-01", endsAt: "2026-06-30" }
        })
      );
    } finally {
      await supervisor.dispose();
    }
  });

  test("Financeiro reviews notes but cannot manage campaigns", async ({ playwright }) => {
    const financeiro = await roleContext(playwright, "financeiro@example.com");
    try {
      await expectOk(await financeiro.get("/v1/sales/documents"));
      await expectForbidden(
        await financeiro.post("/v1/sales/campaigns", {
          data: { name: "Forbidden campaign", startsAt: "2026-06-01", endsAt: "2026-06-30" }
        })
      );
    } finally {
      await financeiro.dispose();
    }
  });
});
