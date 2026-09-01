import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { CurrentUser } from "@alwaystrack/shared";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ScriptLibraryView, scriptLibraryViewHref } from "../src/views/script-library";

const apiMock = vi.fn();
const clipboardWriteMock = vi.fn();

vi.mock("../src/api", () => ({
  api: (...args: unknown[]) => apiMock(...args),
  uploadOperationalImage: vi.fn()
}));

const category = {
  id: "category-delivery",
  slug: "delivery",
  name: "Entrega",
  description: "Orientações de entrega",
  order: 1,
  active: true,
  _count: { scripts: 1 }
};

const script = {
  id: "script-tracking",
  categoryId: category.id,
  wikiPageId: null,
  faqThreadId: null,
  title: "Atualização de rastreio",
  channel: "WHATSAPP",
  body: "Olá, {nome_cliente}. Seu pedido {numero_pedido} está em trânsito.",
  tags: ["entrega", "rastreio"],
  placeholders: ["nome_cliente", "numero_pedido"],
  status: "VALIDATED",
  reviewState: "VALIDATED",
  usageCount: 4,
  copiedAt: null,
  validatedAt: "2026-07-10T12:00:00.000Z",
  reviewDueAt: "2026-10-10T12:00:00.000Z",
  recertifiedAt: null,
  updatedAt: "2026-07-14T12:00:00.000Z",
  category,
  validatedBy: { id: "manager-1", name: "Gestora Exemplo", role: "GESTOR" },
  recertifiedBy: null,
  wikiPage: null,
  faqThread: null,
  revisions: [],
  events: []
};

const suggestion = {
  id: "suggestion-1",
  categoryId: category.id,
  scriptId: script.id,
  title: "Atualização de rastreio revisada",
  channel: "WHATSAPP",
  body: "Olá, {nome_cliente}. Temos uma nova atualização.",
  tags: ["rastreio"],
  status: "SUGGESTED",
  suggestionType: "CHANGE",
  decisionComment: null,
  createdScriptId: null,
  createdAt: "2026-07-15T09:00:00.000Z",
  updatedAt: "2026-07-15T09:00:00.000Z",
  author: { id: "sac-1", name: "Analista Exemplo", role: "SAC" },
  decidedBy: null,
  category: { id: category.id, name: category.name },
  script: {
    id: script.id,
    title: script.title,
    channel: script.channel,
    body: script.body,
    tags: script.tags,
    status: script.status
  }
};

const users = {
  sac: {
    id: "sac-1",
    name: "Analista Exemplo",
    email: "analista@example.invalid",
    role: "SAC",
    organizationId: "organization-1",
    unitScopeIds: [],
    sectorScopeIds: []
  },
  manager: {
    id: "manager-1",
    name: "Gestora Exemplo",
    email: "gestora@example.invalid",
    role: "GESTOR",
    organizationId: "organization-1",
    unitScopeIds: [],
    sectorScopeIds: []
  }
} satisfies Record<string, CurrentUser>;

function libraryResponse(overrides: Record<string, unknown> = {}) {
  return {
    categories: [category],
    scripts: [script],
    packs: [],
    suggestions: [suggestion],
    metrics: {
      mostCopied: [{ id: script.id, title: script.title, usageCount: script.usageCount }],
      neverUsed: 0,
      reviewDue: 0,
      pendingSuggestions: 1,
      zeroSearches: [],
      probableDuplicates: []
    },
    total: 1,
    canManage: false,
    ...overrides
  };
}

function responseFor(path: string) {
  if (path.startsWith("/v1/script-library?")) return libraryResponse();
  if (path === "/v1/wiki/pages?pageSize=100" || path === "/v1/faq/threads?pageSize=100") return { items: [] };
  if (path === "/v1/script-library/suggestions") return { suggestion: { id: "suggestion-created" } };
  if (path === `/v1/script-library/suggestions/${suggestion.id}/decision`) return { suggestion: { ...suggestion, status: "MERGED" } };
  return {};
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((next) => {
    resolve = next;
  });
  return { promise, resolve };
}

describe("ScriptLibraryView", () => {
  beforeEach(() => {
    window.history.replaceState(null, "", "/");
    apiMock.mockReset();
    apiMock.mockImplementation((path: string) => Promise.resolve(responseFor(path)));
    clipboardWriteMock.mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: clipboardWriteMock }
    });
  });

  it("restores shareable navigation state, preserves deep-link params and rejects unauthorized management mode", async () => {
    const user = userEvent.setup();
    window.history.replaceState(null, "", "/scriptoteca?suggestionId=suggestion-1&mode=management&categoryId=category-delivery&scriptId=script-tracking");
    const managerView = render(<ScriptLibraryView
      user={users.manager}
      initialIntent={{ mode: "management", categoryId: category.id, scriptId: script.id, suggestionId: suggestion.id }}
    />);

    expect(await screen.findByRole("button", { name: "Gestão" })).toHaveClass("active");
    await waitFor(() => {
      expect(window.location.pathname).toBe("/scriptoteca");
      expect(window.location.search).toContain("suggestionId=suggestion-1");
      expect(window.location.search).toContain("mode=management");
      expect(window.location.search).toContain(`categoryId=${category.id}`);
      expect(window.location.search).toContain(`scriptId=${script.id}`);
    });
    await user.click(screen.getByRole("button", { name: "Atendimento" }));
    await waitFor(() => expect(window.location.search).toContain("mode=attendance"));
    expect(window.location.search).toContain("suggestionId=suggestion-1");
    managerView.unmount();

    window.history.replaceState(null, "", "/scriptoteca?mode=management");
    render(<ScriptLibraryView user={users.sac} initialIntent={{ mode: "management" }} />);
    expect(await screen.findByRole("button", { name: "Atendimento" })).toHaveClass("active");
    await waitFor(() => expect(window.location.search).toContain("mode=attendance"));
    expect(screen.queryByRole("button", { name: "Gestão" })).not.toBeInTheDocument();

    expect(scriptLibraryViewHref({ mode: "smartscript", smartScriptState: "IN_USE", smartScriptId: "smart-1" }, "?suggestionId=suggestion-1"))
      .toBe("/scriptoteca?suggestionId=suggestion-1&mode=smartscript&smartScriptState=IN_USE&smartScriptId=smart-1");
  });

  it("requests and focuses a deep-linked script even when it is outside the default listing", async () => {
    const linkedScript = { ...script, id: "script-outside-first-100", title: "Script encontrado fora do limite" };
    Object.defineProperty(HTMLElement.prototype, "scrollIntoView", { configurable: true, value: vi.fn() });
    apiMock.mockImplementation((path: string) => {
      if (path.startsWith("/v1/script-library?")) {
        const params = new URL(path, "https://example.invalid").searchParams;
        return Promise.resolve(params.get("scriptId") === linkedScript.id
          ? libraryResponse({ scripts: [linkedScript], total: 1 })
          : libraryResponse({ scripts: Array.from({ length: 100 }, (_, index) => ({ ...script, id: `script-${index}` })), total: 101 }));
      }
      return Promise.resolve(responseFor(path));
    });

    render(<ScriptLibraryView user={users.sac} initialIntent={{ scriptId: linkedScript.id }} />);

    expect(await screen.findByRole("heading", { name: linkedScript.title })).toBeInTheDocument();
    const target = document.getElementById(`script-library-item-${encodeURIComponent(linkedScript.id)}`)!;
    await waitFor(() => expect(target).toHaveFocus());
    expect(apiMock).toHaveBeenCalledWith(expect.stringContaining(`scriptId=${linkedScript.id}`));
  });

  it("falls back to the regular script list when a linked target is not visible", async () => {
    apiMock.mockImplementation((path: string) => {
      if (path.startsWith("/v1/script-library?")) {
        const params = new URL(path, "https://example.invalid").searchParams;
        return Promise.resolve(params.has("scriptId") ? libraryResponse({ scripts: [], total: 0 }) : libraryResponse());
      }
      return Promise.resolve(responseFor(path));
    });

    render(<ScriptLibraryView user={users.sac} initialIntent={{ scriptId: "script-forbidden" }} />);

    expect(await screen.findByRole("heading", { name: script.title })).toBeInTheDocument();
    await waitFor(() => expect(apiMock.mock.calls.filter(([path]) => String(path).startsWith("/v1/script-library?")).length).toBe(2));
  });

  it("keeps the loading state visible until the sanitized library listing arrives", async () => {
    const request = deferred<ReturnType<typeof libraryResponse>>();
    apiMock.mockImplementation((path: string) => path.startsWith("/v1/script-library?") ? request.promise : Promise.resolve(responseFor(path)));

    render(<ScriptLibraryView user={users.sac} />);

    expect(screen.getByText("Carregando scripts").closest("[role='status']")).toBeInTheDocument();
    request.resolve(libraryResponse());

    expect(await screen.findByRole("heading", { name: script.title })).toBeInTheDocument();
    expect(screen.getByText("WHATSAPP · 4 copia(s)")).toBeInTheDocument();
    expect(screen.queryByText("Carregando scripts")).not.toBeInTheDocument();
  });

  it("submits text, channel and status filters and reloads when category or tag changes", async () => {
    const user = userEvent.setup();
    render(<ScriptLibraryView user={users.sac} />);
    await screen.findByRole("heading", { name: script.title });

    await user.type(screen.getByRole("textbox", { name: "Busca" }), "pedido 123");
    await user.selectOptions(screen.getByRole("combobox", { name: "Canal" }), "WHATSAPP");
    await user.selectOptions(screen.getByRole("combobox", { name: "Status" }), "VALIDATED");
    await user.click(screen.getByRole("button", { name: "Filtrar" }));

    await waitFor(() => expect(apiMock).toHaveBeenCalledWith(
      "/v1/script-library?query=pedido+123&channel=WHATSAPP&status=VALIDATED"
    ));

    await user.click(screen.getByRole("button", { name: "Entrega" }));
    await waitFor(() => expect(apiMock).toHaveBeenCalledWith(expect.stringContaining(`categoryId=${category.id}`)));

    await user.selectOptions(screen.getByRole("combobox", { name: "Tag" }), "rastreio");
    await waitFor(() => expect(apiMock).toHaveBeenCalledWith(expect.stringContaining("tags=rastreio")));
  });

  it("renders placeholders into the channel-safe copy and records the audited usage", async () => {
    const user = userEvent.setup();
    vi.spyOn(navigator.clipboard, "writeText").mockImplementation(clipboardWriteMock);
    render(<ScriptLibraryView user={users.sac} />);
    await screen.findByRole("heading", { name: script.title });

    await user.type(screen.getByRole("textbox", { name: /Nome do cliente/ }), "Maria");
    await user.type(screen.getByRole("textbox", { name: /Número do pedido/ }), "AT-42");
    await user.click(screen.getByRole("button", { name: "Copiar script" }));

    const renderedText = "Olá, Maria. Seu pedido AT-42 está em trânsito.";
    await waitFor(() => expect(clipboardWriteMock).toHaveBeenCalledWith(renderedText));
    expect(apiMock).toHaveBeenCalledWith(
      `/v1/script-library/scripts/${script.id}/copy`,
      {
        method: "POST",
        body: JSON.stringify({
          renderedText,
          placeholders: { nome_cliente: "Maria", numero_pedido: "AT-42" }
        })
      }
    );
    expect(screen.getByRole("button", { name: "Copiado" })).toBeInTheDocument();
  });

  it("keeps management mutations hidden from SAC and lets a manager submit and merge suggestions", async () => {
    const sacRender = render(<ScriptLibraryView user={users.sac} />);
    await screen.findByRole("heading", { name: script.title });
    expect(screen.queryByRole("button", { name: "Gestão" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Validar" })).not.toBeInTheDocument();
    sacRender.unmount();

    const user = userEvent.setup();
    render(<ScriptLibraryView user={users.manager} />);
    await screen.findByRole("heading", { name: script.title });
    await user.click(screen.getByRole("button", { name: "Gestão" }));

    const suggestionPanel = screen.getByRole("heading", { name: "Melhorias de script" }).closest("section");
    expect(suggestionPanel).not.toBeNull();
    const suggestionForm = within(suggestionPanel as HTMLElement);
    await user.type(suggestionForm.getByRole("textbox", { name: "Título" }), "Mensagem de confirmação");
    await user.type(suggestionForm.getByRole("textbox", { name: "Texto sugerido" }), "Pedido confirmado com segurança.");
    await user.type(suggestionForm.getByRole("textbox", { name: "Tags" }), " Pedido, #Confirmação, pedido ");
    await user.click(suggestionForm.getByRole("button", { name: "Enviar sugestão" }));

    await waitFor(() => expect(apiMock.mock.calls.some(([path]) => path === "/v1/script-library/suggestions")).toBe(true));
    const suggestionRequest = apiMock.mock.calls.find(([path]) => path === "/v1/script-library/suggestions");
    expect(suggestionRequest?.[1]).toMatchObject({ method: "POST" });
    expect(JSON.parse((suggestionRequest?.[1] as RequestInit).body as string)).toMatchObject({
      title: "Mensagem de confirmação",
      body: "Pedido confirmado com segurança.",
      tags: ["confirmação", "pedido"]
    });

    await user.type(screen.getByRole("textbox", { name: /^Comentário da decisão/ }), "Revisão aprovada pela gestão.");
    await user.click(screen.getByRole("button", { name: "Mesclar" }));
    const decisionPath = `/v1/script-library/suggestions/${suggestion.id}/decision`;
    await waitFor(() => expect(apiMock.mock.calls.some(([path]) => path === decisionPath)).toBe(true));
    const decisionRequest = apiMock.mock.calls.find(([path]) => path === decisionPath);
    expect(decisionRequest?.[1]).toMatchObject({ method: "POST" });
    expect(JSON.parse((decisionRequest?.[1] as RequestInit).body as string)).toMatchObject({
      decision: "MERGED",
      decisionComment: "Revisão aprovada pela gestão."
    });
  });

  it("shows the HTTP error and retries the listing from the filter action", async () => {
    const user = userEvent.setup();
    let libraryRequests = 0;
    apiMock.mockImplementation((path: string) => {
      if (path.startsWith("/v1/script-library?")) {
        libraryRequests += 1;
        return libraryRequests === 1
          ? Promise.reject(new Error("Scriptoteca temporariamente indisponível."))
          : Promise.resolve(libraryResponse());
      }
      return Promise.resolve(responseFor(path));
    });

    render(<ScriptLibraryView user={users.sac} />);

    expect(await screen.findByRole("alert")).toHaveTextContent("Scriptoteca temporariamente indisponível.");
    await user.click(screen.getByRole("button", { name: "Filtrar" }));

    expect(await screen.findByRole("heading", { name: script.title })).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(libraryRequests).toBe(2);
  });
});
