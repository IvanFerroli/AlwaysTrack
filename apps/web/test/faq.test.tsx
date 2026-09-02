import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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
const nextLinkedThread = thread("thread-100", "Segunda pergunta encontrada pelo link");

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

  it("lets successive deep links override visual filters while the view stays mounted", async () => {
    const userEventDriver = userEvent.setup();
    apiMock.mockImplementation((path: string) => {
      const params = new URL(path, "https://example.invalid").searchParams;
      if (params.get("threadId") === linkedThread.id) return Promise.resolve({ items: [linkedThread], total: 1, page: 1 });
      if (params.get("threadId") === nextLinkedThread.id) return Promise.resolve({ items: [nextLinkedThread], total: 1, page: 1 });
      return Promise.resolve({ items: [firstThread], total: 1, page: 1 });
    });
    const view = render(<FaqThreadsView user={user} />);
    await screen.findByRole("heading", { name: firstThread.title });

    const searchInput = screen.getByPlaceholderText("Pergunta, resposta ou autor");
    const statusSelect = screen.getByRole("option", { name: "Resolvida" }).closest("select")!;
    await userEventDriver.type(searchInput, "não encontra o alvo");
    await userEventDriver.selectOptions(statusSelect, "RESOLVED");
    view.rerender(<FaqThreadsView user={user} initialThreadId={linkedThread.id} />);

    expect(await screen.findByRole("heading", { name: linkedThread.title })).toBeInTheDocument();
    expect(searchInput).toHaveValue("");
    expect(statusSelect).toHaveValue("");
    const firstTargetRequest = String(apiMock.mock.calls.find(([path]) => String(path).includes(`threadId=${linkedThread.id}`))?.[0]);
    expect(firstTargetRequest).not.toContain("query=");
    expect(firstTargetRequest).not.toContain("status=");

    view.rerender(<FaqThreadsView user={user} initialThreadId={nextLinkedThread.id} />);
    expect(await screen.findByRole("heading", { name: nextLinkedThread.title })).toBeInTheDocument();
    const target = document.getElementById(`faq-thread-${encodeURIComponent(nextLinkedThread.id)}`)!;
    await waitFor(() => expect(target).toHaveFocus());
  });
});
