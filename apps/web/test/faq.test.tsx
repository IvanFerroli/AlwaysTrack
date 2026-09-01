import { render, screen, waitFor } from "@testing-library/react";
import type { CurrentUser } from "@alwaystrack/shared";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { FaqThreadsView } from "../src/views/faq";

const apiMock = vi.fn();

vi.mock("../src/api", () => ({
  api: (...args: unknown[]) => apiMock(...args),
  uploadOperationalImage: vi.fn()
}));

const user: CurrentUser = {
  id: "sac-1",
  name: "Analista Exemplo",
  email: "analista@example.invalid",
  role: "SAC",
  organizationId: "organization-1",
  unitScopeIds: [],
  sectorScopeIds: []
};

function thread(id: string, title: string) {
  return {
    id,
    title,
    body: "Contexto da pergunta",
    tags: ["processo"],
    status: "OPEN",
    createdAt: "2026-07-15T09:00:00.000Z",
    updatedAt: "2026-07-15T09:00:00.000Z",
    promotedAt: null,
    author: { id: "sac-1", name: "Analista Exemplo", email: "analista@example.invalid", role: "SAC" },
    wikiPage: null,
    comments: [],
    reactions: []
  };
}

const firstThread = thread("thread-1", "Pergunta mais recente");
const linkedThread = thread("thread-99", "Pergunta encontrada pelo link");

describe("FaqThreadsView", () => {
  beforeEach(() => {
    apiMock.mockReset();
    Object.defineProperty(HTMLElement.prototype, "scrollIntoView", { configurable: true, value: vi.fn() });
  });

  it("looks up, selects and focuses a thread requested by a deep link", async () => {
    apiMock.mockImplementation((path: string) => {
      const params = new URL(path, "https://example.invalid").searchParams;
      return Promise.resolve(params.get("threadId") === linkedThread.id
        ? { items: [linkedThread], total: 1, page: 1 }
        : { items: [firstThread], total: 1, page: 1 });
    });

    render(<FaqThreadsView user={user} initialThreadId={linkedThread.id} />);

    expect(await screen.findByRole("heading", { name: linkedThread.title })).toBeInTheDocument();
    const target = document.getElementById(`faq-thread-${encodeURIComponent(linkedThread.id)}`)!;
    await waitFor(() => expect(target).toHaveFocus());
    expect(apiMock).toHaveBeenCalledWith(expect.stringContaining(`threadId=${linkedThread.id}`));
  });

  it("falls back to the regular tenant-scoped list when the target is unavailable", async () => {
    apiMock.mockImplementation((path: string) => {
      const params = new URL(path, "https://example.invalid").searchParams;
      return Promise.resolve(params.has("threadId")
        ? { items: [], total: 0, page: 1 }
        : { items: [firstThread], total: 1, page: 1 });
    });

    render(<FaqThreadsView user={user} initialThreadId="thread-forbidden" />);

    expect(await screen.findByRole("heading", { name: firstThread.title })).toBeInTheDocument();
    await waitFor(() => expect(apiMock).toHaveBeenCalledTimes(2));
    expect(apiMock.mock.calls[0]?.[0]).toContain("threadId=thread-forbidden");
    expect(apiMock.mock.calls[1]?.[0]).not.toContain("threadId");
  });
});
