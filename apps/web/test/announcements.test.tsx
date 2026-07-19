import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { CurrentUser } from "@alwaystrack/shared";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AnnouncementsView } from "../src/views/announcements";
import { expectNoCriticalAccessibilityViolations } from "./accessibility-assertions";

const apiMock = vi.fn();

vi.mock("../src/api", () => ({
  api: (...args: unknown[]) => apiMock(...args),
  uploadOperationalImage: vi.fn()
}));

const users = {
  sac: {
    id: "sac-current",
    name: "Pessoa SAC",
    email: "sac@example.invalid",
    role: "SAC",
    organizationId: "organization-1",
    unitScopeIds: [],
    sectorScopeIds: []
  },
  manager: {
    id: "manager-current",
    name: "Pessoa Gestora",
    email: "manager@example.invalid",
    role: "GESTOR",
    organizationId: "organization-1",
    unitScopeIds: [],
    sectorScopeIds: []
  }
} satisfies Record<string, CurrentUser>;

const otherReceipt = {
  id: "receipt-other",
  userId: "sac-other",
  acknowledgedAt: "2026-07-16T12:00:00.000Z",
  user: { id: "sac-other", name: "Outra pessoa", email: "other@example.invalid", role: "SAC" }
};

function announcement(readReceipts: Array<Record<string, unknown>> = [otherReceipt]) {
  return {
    id: "announcement-1",
    slug: "mudanca-operacional",
    title: "Mudança operacional",
    summary: "Leia antes de iniciar o atendimento.",
    content: "Confirme a leitura deste aviso.",
    contentFormat: "MARKDOWN",
    tags: ["sac"],
    links: [],
    targetRoles: ["SAC"],
    status: "PUBLISHED",
    priority: "HIGH",
    pinned: true,
    requiresAck: true,
    startsAt: null,
    expiresAt: null,
    publishedAt: "2026-07-16T11:00:00.000Z",
    createdAt: "2026-07-16T10:00:00.000Z",
    updatedAt: "2026-07-16T11:00:00.000Z",
    createdBy: { id: "admin-1", name: "Admin", email: "admin@example.invalid", role: "ADMIN" },
    updatedBy: { id: "admin-1", name: "Admin", email: "admin@example.invalid", role: "ADMIN" },
    readReceipts
  };
}

const compliance = {
  audienceCount: 3,
  acknowledgedCount: 1,
  openedCount: 2,
  pendingCount: 2,
  completed: false,
  acknowledgedUsers: [{ id: "sac-other", name: "Outra pessoa", email: "other@example.invalid", role: "SAC" }],
  openedWithoutAckUsers: [{ id: "sac-opened", name: "Pessoa que abriu", email: "opened@example.invalid", role: "SAC" }],
  notOpenedUsers: [{ id: "sac-unopened", name: "Pessoa que não abriu", email: "unopened@example.invalid", role: "SAC" }]
};

const recurringSeries = {
  id: "series-1",
  slug: "plantao-mensal",
  status: "ACTIVE",
  archivedAt: null,
  versions: [{
    id: "version-1",
    version: 1,
    effectiveFromDate: "2099-01-01",
    validFromDate: "2099-01-01",
    validToDate: null,
    recurrenceType: "MONTHLY_DAYS",
    recurrenceDays: [14, 29],
    missingDayPolicy: "SKIP",
    timezone: "America/Sao_Paulo",
    localTime: "09:30",
    durationMinutes: 1440,
    title: "Plantão mensal",
    summary: "Acompanhar a operação.",
    content: "Confira o procedimento do plantão.",
    targetRoles: ["SAC", "GESTOR"],
    priority: "HIGH",
    requiresAck: true
  }],
  occurrences: [{
    id: "occurrence-1",
    localDate: "2099-08-14",
    scheduledFor: "2099-08-14T12:30:00.000Z",
    expiresAt: "2099-08-15T12:30:00.000Z",
    status: "SCHEDULED",
    cancellationReason: null,
    announcement: { id: "announcement-future", slug: "plantao-mensal-20990814-v1", status: "SCHEDULED", publishedAt: null }
  }]
};

describe("AnnouncementsView acknowledgement", () => {
  beforeEach(() => {
    apiMock.mockReset();
  });

  it("keeps acknowledgement pending when only another user has confirmed, then reloads the current status", async () => {
    const beforeAck = announcement();
    const afterAck = announcement([
      otherReceipt,
      {
        id: "receipt-current",
        userId: users.sac.id,
        acknowledgedAt: "2026-07-16T12:10:00.000Z"
      }
    ]);

    apiMock.mockImplementation((path: string, init?: RequestInit) => {
      if (path.startsWith("/v1/announcements?")) return Promise.resolve({ items: [beforeAck], total: 1 });
      if (path === `/v1/announcements/${beforeAck.id}/acknowledge` && init?.method === "POST") return Promise.resolve({});
      if (path === `/v1/announcements/by-slug/${beforeAck.slug}`) return Promise.resolve({ announcement: afterAck });
      return Promise.reject(new Error(`Unexpected API call: ${path}`));
    });

    render(<AnnouncementsView user={users.sac} />);

    const acknowledgeButton = await screen.findByRole("button", { name: "Marcar ciência" });
    expect(screen.getByText("Pendente para você")).toBeInTheDocument();
    expect(screen.queryByText("1 registro(s)")).not.toBeInTheDocument();

    await userEvent.click(acknowledgeButton);

    expect(await screen.findByText("Você já marcou ciência")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Marcar ciência" })).not.toBeInTheDocument();
    expect(apiMock).toHaveBeenCalledWith(`/v1/announcements/${beforeAck.id}/acknowledge`, { method: "POST" });
    expect(apiMock).toHaveBeenCalledWith(`/v1/announcements/by-slug/${beforeAck.slug}`);
  });

  it("recognizes a current-user receipt exposed through the nested user id", async () => {
    const currentReceipt = {
      id: "receipt-current",
      acknowledgedAt: "2026-07-16T12:10:00.000Z",
      user: { id: users.sac.id, name: users.sac.name, email: users.sac.email, role: users.sac.role }
    };
    apiMock.mockResolvedValue({ items: [announcement([currentReceipt])], total: 1 });

    render(<AnnouncementsView user={users.sac} />);

    expect(await screen.findByText("Você já marcou ciência")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Marcar ciência" })).not.toBeInTheDocument();
  });

  it("records an opening when the user explicitly selects an announcement from the list", async () => {
    const item = announcement();
    apiMock.mockImplementation((path: string) => {
      if (path.startsWith("/v1/announcements?")) return Promise.resolve({ items: [item], total: 1 });
      if (path === `/v1/announcements/by-slug/${item.slug}`) return Promise.resolve({ announcement: item });
      return Promise.reject(new Error(`Unexpected API call: ${path}`));
    });

    render(<AnnouncementsView user={users.sac} />);
    await userEvent.click(await screen.findByRole("button", { name: /Fixado · Mudança operacional/ }));

    expect(apiMock).toHaveBeenCalledWith(`/v1/announcements/by-slug/${item.slug}`);
    expect(screen.getByRole("button", { name: "Marcar ciência" })).toBeInTheDocument();
  });

  it("shows managers the overall count while keeping their own acknowledgement pending", async () => {
    const item = announcement();
    item.targetRoles = ["SAC", "GESTOR"];
    Object.assign(item, { acknowledgement: compliance });
    apiMock.mockImplementation((path: string) => {
      if (path === "/v1/announcements/series") return Promise.resolve({ items: [], total: 0 });
      return Promise.resolve({ items: [item], total: 1 });
    });

    render(<AnnouncementsView user={users.manager} />);

    expect(await screen.findByRole("button", { name: "Marcar ciência" })).toBeInTheDocument();
    expect(screen.getByText("Pendente para você")).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText("1 registro(s)")).toBeInTheDocument());
    expect(screen.getByText("Outra pessoa")).toBeInTheDocument();
    expect(screen.getByText("Pessoa que abriu")).toBeInTheDocument();
    expect(screen.getByText("Pessoa que não abriu")).toBeInTheDocument();
  });
});

describe("AnnouncementsView publication", () => {
  beforeEach(() => {
    apiMock.mockReset();
  });

  it("clears the previous selection and saves a new draft through the explicit publish endpoint", async () => {
    const existing = announcement();
    const draft = {
      ...announcement([]),
      id: "announcement-new",
      slug: "novo-aviso-operacional",
      title: "Novo aviso operacional",
      summary: null,
      content: "Confira a atualização antes de iniciar.",
      targetRoles: ["SAC"],
      status: "DRAFT",
      priority: "NORMAL",
      pinned: false,
      requiresAck: false,
      publishedAt: null
    };
    const published = { ...draft, status: "PUBLISHED", publishedAt: "2026-07-18T18:00:00.000Z" };
    let publicationCompleted = false;

    apiMock.mockImplementation((path: string, init?: RequestInit) => {
      if (path === "/v1/announcements/series" && !init) return Promise.resolve({ items: [], total: 0 });
      if (path.startsWith("/v1/announcements?") && !init) {
        const items = publicationCompleted ? [published, existing] : [existing];
        return Promise.resolve({ items, total: items.length });
      }
      if (path === "/v1/announcements" && init?.method === "POST") return Promise.resolve({ announcement: draft });
      if (path === `/v1/announcements/${draft.id}/publish` && init?.method === "POST") {
        publicationCompleted = true;
        return Promise.resolve({ announcement: published });
      }
      return Promise.reject(new Error(`Unexpected API call: ${path}`));
    });

    const user = userEvent.setup();
    render(<AnnouncementsView user={users.manager} />);
    expect(await screen.findByRole("heading", { name: existing.title })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Novo aviso" }));
    expect(screen.queryByRole("heading", { name: existing.title })).not.toBeInTheDocument();

    const form = screen.getByRole("heading", { name: "Novo aviso" }).closest("form")!;
    await user.type(within(form).getByLabelText("Titulo"), draft.title);
    await user.type(within(form).getByLabelText("Conteudo"), draft.content);
    await user.click(within(form).getByRole("button", { name: "Salvar e publicar" }));

    await waitFor(() => expect(apiMock).toHaveBeenCalledWith("/v1/announcements", expect.objectContaining({
      method: "POST",
      body: expect.stringContaining('"status":"DRAFT"')
    })));
    expect(apiMock).toHaveBeenCalledWith(`/v1/announcements/${draft.id}/publish`, { method: "POST" });
    expect(await screen.findByRole("heading", { name: draft.title })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Publicar" })).toBeDisabled();
  });

  it("routes recurring occurrences to series governance instead of the standalone editor", async () => {
    const recurringOccurrence = {
      ...announcement(),
      id: "announcement-recurring",
      slug: "plantao-mensal-20990814-v1",
      title: "Plantão mensal de agosto",
      status: "SCHEDULED",
      publishedAt: null,
      startsAt: "2099-08-14T12:30:00.000Z",
      expiresAt: "2099-08-15T12:30:00.000Z",
      occurrence: { id: "occurrence-1", seriesId: "series-1", localDate: "2099-08-14", status: "SCHEDULED" }
    };
    apiMock.mockImplementation((path: string) => {
      if (path.startsWith("/v1/announcements?")) return Promise.resolve({ items: [recurringOccurrence], total: 1 });
      if (path === "/v1/announcements/series") return Promise.resolve({ items: [recurringSeries], total: 1 });
      return Promise.reject(new Error(`Unexpected API call: ${path}`));
    });

    render(<AnnouncementsView user={users.manager} />);

    expect(await screen.findByRole("button", { name: "Gerenciar série" })).toBeInTheDocument();
    expect(screen.getByText("Ocorrência gerenciada pela série")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Publicar" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Editar aviso" })).not.toBeInTheDocument();
  });
});

describe("AnnouncementsView recurring series", () => {
  beforeEach(() => {
    apiMock.mockReset();
  });

  function managerApi(path: string, init?: RequestInit) {
    if (path.startsWith("/v1/announcements?")) return Promise.resolve({ items: [announcement()], total: 1 });
    if (path === "/v1/announcements/series" && !init) return Promise.resolve({ items: [recurringSeries], total: 1 });
    if (path === "/v1/announcements/series" && init?.method === "POST") return Promise.resolve({ series: recurringSeries });
    if (path === "/v1/announcements/materialize" && init?.method === "POST") return Promise.resolve({ created: [], skipped: [] });
    if (path === "/v1/announcements/series/series-1/versions" && init?.method === "POST") return Promise.resolve({ version: recurringSeries.versions[0] });
    if (path === "/v1/announcements/series/series-1/archive" && init?.method === "POST") return Promise.resolve({ series: { ...recurringSeries, status: "ARCHIVED" } });
    if (path === "/v1/announcements/occurrences/occurrence-1/cancel" && init?.method === "POST") return Promise.resolve({ occurrence: { ...recurringSeries.occurrences[0], status: "CANCELLED" } });
    return Promise.reject(new Error(`Unexpected API call: ${path}`));
  }

  it("creates an accessible monthly series with 14/29 and Sao Paulo defaults", async () => {
    apiMock.mockImplementation(managerApi);
    const user = userEvent.setup();
    render(<AnnouncementsView user={users.manager} />);

    expect(await screen.findByRole("table", { name: "Séries de avisos recorrentes" })).toHaveTextContent("Plantão mensal");
    expect(screen.getByText(/fevereiro não tem dia 29/i)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Nova série" }));

    const form = screen.getByRole("heading", { name: "Criar série mensal" }).closest("form")!;
    expect(within(form).getByLabelText("Timezone")).toHaveValue("America/Sao_Paulo");
    expect(within(form).getByLabelText("Dia 14")).toBeChecked();
    expect(within(form).getByLabelText("Dia 29")).toBeChecked();
    await user.type(within(form).getByLabelText("Título"), "Ritual SAC");
    await user.type(within(form).getByLabelText("Conteúdo da série"), "Revisar os indicadores do mês.");
    expectNoCriticalAccessibilityViolations(form);
    await user.click(within(form).getByRole("button", { name: "Criar série" }));

    await waitFor(() => expect(apiMock).toHaveBeenCalledWith("/v1/announcements/series", expect.objectContaining({ method: "POST" })));
    const createCall = apiMock.mock.calls.find(([path, init]) => path === "/v1/announcements/series" && (init as RequestInit | undefined)?.method === "POST");
    const body = JSON.parse((createCall?.[1] as RequestInit).body as string);
    expect(body).toMatchObject({
      title: "Ritual SAC",
      recurrenceDays: [14, 29],
      missingDayPolicy: "SKIP",
      timezone: "America/Sao_Paulo"
    });
    expect(apiMock).toHaveBeenCalledWith("/v1/announcements/materialize", {
      method: "POST",
      body: JSON.stringify({ horizonDays: 62, catchUpDays: 0, publishDue: false })
    });
    expect(await screen.findByRole("status")).toHaveTextContent("Série mensal criada");
  });

  it("creates a future version, cancels one future occurrence with reason and archives the series", async () => {
    apiMock.mockImplementation(managerApi);
    const user = userEvent.setup();
    render(<AnnouncementsView user={users.manager} />);

    const row = (await screen.findByText("Plantão mensal")).closest("tr")!;
    await user.click(within(row).getByRole("button", { name: "Nova versão" }));
    const versionForm = screen.getByRole("heading", { name: "Nova versão de Plantão mensal" }).closest("form")!;
    const effectiveDate = within(versionForm).getByLabelText("Aplicar a partir de");
    await user.clear(effectiveDate);
    await user.type(effectiveDate, "2099-08-01");
    await user.click(within(versionForm).getByRole("button", { name: "Criar versão futura" }));
    await waitFor(() => expect(apiMock).toHaveBeenCalledWith("/v1/announcements/series/series-1/versions", expect.objectContaining({
      method: "POST",
      body: expect.stringContaining('"effectiveFromDate":"2099-08-01"')
    })));

    await user.click(within(row).getByRole("button", { name: "Cancelar ocorrência de 14/08/2099" }));
    const cancelForm = screen.getByRole("heading", { name: "Cancelar ocorrência de 14/08/2099" }).closest("form")!;
    await user.type(within(cancelForm).getByLabelText("Motivo do cancelamento"), "Operação suspensa nesta data");
    await user.click(within(cancelForm).getByRole("button", { name: "Confirmar cancelamento" }));
    await waitFor(() => expect(apiMock).toHaveBeenCalledWith("/v1/announcements/occurrences/occurrence-1/cancel", {
      method: "POST",
      body: JSON.stringify({ reason: "Operação suspensa nesta data" })
    }));

    await user.click(within(row).getByRole("button", { name: "Arquivar série" }));
    await user.click(within(row).getByRole("button", { name: "Confirmar arquivamento" }));
    await waitFor(() => expect(apiMock).toHaveBeenCalledWith("/v1/announcements/series/series-1/archive", expect.objectContaining({ method: "POST" })));
  });

  it("keeps recurring-series errors isolated from the regular announcement reader", async () => {
    apiMock.mockImplementation((path: string) => {
      if (path === "/v1/announcements/series") return Promise.reject(new Error("Recorrências indisponíveis."));
      if (path.startsWith("/v1/announcements?")) return Promise.resolve({ items: [announcement()], total: 1 });
      return Promise.reject(new Error(`Unexpected API call: ${path}`));
    });

    render(<AnnouncementsView user={users.manager} />);
    expect(await screen.findByRole("alert")).toHaveTextContent("Recorrências indisponíveis.");
    expect(screen.getByRole("heading", { name: "Mudança operacional" })).toBeInTheDocument();
  });

  it("does not expose recurrence management or call its endpoint for SAC", async () => {
    apiMock.mockImplementation((path: string) => {
      if (path.startsWith("/v1/announcements?")) return Promise.resolve({ items: [announcement()], total: 1 });
      return Promise.reject(new Error(`Unexpected API call: ${path}`));
    });

    render(<AnnouncementsView user={users.sac} />);
    expect(await screen.findByRole("heading", { name: "Mudança operacional" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Avisos recorrentes" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Nova série" })).not.toBeInTheDocument();
    expect(apiMock.mock.calls.some(([path]) => path === "/v1/announcements/series")).toBe(false);
  });
});
