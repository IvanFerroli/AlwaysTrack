import { expect, test } from "@playwright/test";
import { expectOk, loginApi, loginAsAdminApi, type ManagedUser } from "./helpers";

type FaqThread = {
  id: string;
  title: string;
  status: string;
  wikiPage?: {
    id: string;
    slug: string;
    title: string;
  } | null;
  comments?: Array<{ id: string; body: string }>;
  reactions?: Array<{ id: string; type: string }>;
};

type WikiPage = {
  id: string;
  slug: string;
  title: string;
};

type InAppNotification = {
  id: string;
  type: string;
  title: string;
  entityId: string | null;
  readAt: string | null;
};

type ScriptCategory = {
  id: string;
  name: string;
};

type OperationalScript = {
  id: string;
  title: string;
  usageCount: number;
};

type ScriptPack = {
  id: string;
  title: string;
  summary: string | null;
  items: Array<{ script: OperationalScript; order: number }>;
};

test.describe("AlwaysTrack API e2e regression flows", () => {
  test("FAQ thread can be commented, reacted, promoted to Wiki and notify the author", async ({ request, playwright }) => {
    await loginAsAdminApi(request);
    const suffix = `${Date.now()}-${test.info().workerIndex}`;
    const title = `E2E FAQ ${suffix}`;
    const vendorEmail = `e2e-vendedor-${suffix}@example.com`;
    const vendorPassword = "AlwaysTrackUser123!";

    await expectOk<{ user: ManagedUser }>(
      await request.post("/v1/users", {
        data: {
          name: `E2E Vendedor ${suffix}`,
          email: vendorEmail,
          password: vendorPassword,
          role: "VENDEDOR",
          sellerCode: `e2e-${suffix}`,
          sellerDisplayName: `E2E Vendedor ${suffix}`,
          active: true
        }
      })
    );

    const vendorRequest = await playwright.request.newContext({ baseURL: "http://127.0.0.1:3334" });
    try {
      await loginApi(vendorRequest, vendorEmail, vendorPassword);

      const created = await expectOk<{ thread: FaqThread }>(
        await vendorRequest.post("/v1/faq/threads", {
          data: {
            title,
            body: "Como validar a promocao da FAQ para Wiki?"
          }
        })
      );

      expect(created.thread.title).toBe(title);

      const commented = await expectOk<{ thread: FaqThread }>(
        await request.post(`/v1/faq/threads/${created.thread.id}/comments`, {
          data: { body: "Comentario operacional para manter historico da decisao." }
        })
      );
      expect(commented.thread.comments?.some((comment) => comment.body.includes("Comentario operacional"))).toBe(true);

      const reacted = await expectOk<{ thread: FaqThread }>(
        await request.post(`/v1/faq/threads/${created.thread.id}/reactions`, {
          data: {
            targetType: "THREAD",
            targetId: created.thread.id,
            type: "HELPFUL",
            active: true
          }
        })
      );
      expect(reacted.thread.reactions?.some((reaction) => reaction.type === "HELPFUL")).toBe(true);

      const promoted = await expectOk<{ thread: FaqThread }>(
        await request.post(`/v1/faq/threads/${created.thread.id}/promote-to-wiki`)
      );
      expect(promoted.thread.status).toBe("RESOLVED");
      expect(promoted.thread.wikiPage?.slug).toBeTruthy();

      const slug = promoted.thread.wikiPage?.slug ?? "";
      const wikiBySlug = await expectOk<{ page: WikiPage }>(await request.get(`/v1/wiki/pages/by-slug/${slug}`));
      expect(wikiBySlug.page.title).toBe(title);

      const wikiList = await expectOk<{ items: WikiPage[]; total: number }>(
        await request.get("/v1/wiki/pages", { params: { query: title } })
      );
      expect(wikiList.items.some((page) => page.slug === slug)).toBe(true);

      const notifications = await expectOk<{ items: InAppNotification[]; unread: number }>(
        await vendorRequest.get("/v1/in-app-notifications")
      );
      const promotionNotice = notifications.items.find(
        (item) => item.entityId === created.thread.id && item.type === "faq.thread.promoted_to_wiki"
      );
      expect(promotionNotice).toBeTruthy();

      if (promotionNotice) {
        const readOne = await expectOk<{ notification: InAppNotification }>(
          await vendorRequest.post(`/v1/in-app-notifications/${promotionNotice.id}/read`)
        );
        expect(readOne.notification.readAt).toBeTruthy();
      }

      const readAll = await expectOk<{ updated: number }>(await vendorRequest.post("/v1/in-app-notifications/read-all"));
      expect(readAll.updated).toBeGreaterThanOrEqual(0);
    } finally {
      await vendorRequest.dispose();
    }
  });

  test("admin can create and list a commercial SAC user without exposing password hash", async ({ request }) => {
    await loginAsAdminApi(request);
    const suffix = `${Date.now()}-${test.info().workerIndex}`;
    const email = `e2e-sac-${suffix}@example.com`;

    const created = await expectOk<{ user: ManagedUser }>(
      await request.post("/v1/users", {
        data: {
          name: `E2E SAC ${suffix}`,
          email,
          password: "AlwaysTrackUser123!",
          role: "SAC",
          active: true
        }
      })
    );

    expect(created.user.email).toBe(email);
    expect(created.user.role).toBe("SAC");
    expect(created.user.passwordHash).toBeUndefined();

    const listed = await expectOk<{ users: ManagedUser[] }>(await request.get("/v1/users"));
    const listedUser = listed.users.find((user) => user.email === email);
    expect(listedUser).toBeTruthy();
    expect(listedUser?.passwordHash).toBeUndefined();
  });

  test("admin can create, reorder and use Scriptoteca packs", async ({ request }) => {
    await loginAsAdminApi(request);
    const suffix = `${Date.now()}-${test.info().workerIndex}`;

    const categoryResult = await expectOk<{ category: ScriptCategory }>(
      await request.post("/v1/script-library/categories", {
        data: {
          name: `E2E Roteiros ${suffix}`,
          slug: `e2e-roteiros-${suffix}`,
          description: "Categoria temporaria para regressao de pacotes."
        }
      })
    );

    const firstScript = await expectOk<{ script: OperationalScript }>(
      await request.post("/v1/script-library/scripts", {
        data: {
          categoryId: categoryResult.category.id,
          title: `E2E Saudacao ${suffix}`,
          channel: "WHATSAPP",
          body: "Ola {nome_cliente}, vamos conferir seu atendimento.",
          tags: ["e2e", "pacote"],
          status: "VALIDATED"
        }
      })
    );

    const secondScript = await expectOk<{ script: OperationalScript }>(
      await request.post("/v1/script-library/scripts", {
        data: {
          categoryId: categoryResult.category.id,
          title: `E2E Fechamento ${suffix}`,
          channel: "WHATSAPP",
          body: "Fechamos por aqui, {nome_cliente}.",
          tags: ["e2e", "pacote"],
          status: "VALIDATED"
        }
      })
    );

    const createdPack = await expectOk<{ pack: ScriptPack }>(
      await request.post("/v1/script-library/packs", {
        data: {
          categoryId: categoryResult.category.id,
          title: `E2E Pacote ${suffix}`,
          summary: "Roteiro criado por regressao API.",
          tags: ["e2e", "pacote"],
          status: "ACTIVE",
          scriptIds: [firstScript.script.id, secondScript.script.id]
        }
      })
    );
    expect(createdPack.pack.items.map((item) => item.script.id)).toEqual([firstScript.script.id, secondScript.script.id]);

    const updatedPack = await expectOk<{ pack: ScriptPack }>(
      await request.patch(`/v1/script-library/packs/${createdPack.pack.id}`, {
        data: {
          categoryId: categoryResult.category.id,
          title: `E2E Pacote ${suffix}`,
          summary: "Roteiro reordenado por regressao API.",
          tags: ["e2e", "pacote", "reordenado"],
          status: "ACTIVE",
          scriptIds: [secondScript.script.id, firstScript.script.id]
        }
      })
    );
    expect(updatedPack.pack.items.map((item) => item.script.id)).toEqual([secondScript.script.id, firstScript.script.id]);

    const listed = await expectOk<{ packs: ScriptPack[] }>(
      await request.get("/v1/script-library", { params: { query: `E2E Pacote ${suffix}` } })
    );
    expect(listed.packs.some((pack) => pack.id === createdPack.pack.id)).toBe(true);

    const copied = await expectOk<{ script: OperationalScript }>(
      await request.post(`/v1/script-library/scripts/${secondScript.script.id}/copy`, {
        data: {
          renderedText: "Fechamos por aqui, Maria.",
          placeholders: { nome_cliente: "Maria" }
        }
      })
    );
    expect(copied.script.usageCount).toBeGreaterThanOrEqual(secondScript.script.usageCount + 1);
  });
});
