import { expect, test, type APIResponse, type APIRequestContext } from "@playwright/test";

const seedPassword = "AlwaysTrackE2E123!";

type ApiEnvelope<T> = {
  ok: boolean;
  data: T;
};

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

type ManagedUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  active: boolean;
  passwordHash?: string;
};

type InAppNotification = {
  id: string;
  type: string;
  title: string;
  entityId: string | null;
  readAt: string | null;
};

async function expectOk<T>(response: APIResponse): Promise<T> {
  expect(response.ok(), await response.text()).toBeTruthy();
  const payload = (await response.json()) as ApiEnvelope<T>;
  expect(payload.ok).toBe(true);
  return payload.data;
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function login(request: APIRequestContext, email: string, password: string) {
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

async function loginAsAdmin(request: APIRequestContext) {
  await login(request, "admin@example.com", seedPassword);
}

test.describe("AlwaysTrack API e2e regression flows", () => {
  test("FAQ thread can be commented, reacted, promoted to Wiki and notify the author", async ({ request, playwright }) => {
    await loginAsAdmin(request);
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
      await login(vendorRequest, vendorEmail, vendorPassword);

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
    await loginAsAdmin(request);
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
});
