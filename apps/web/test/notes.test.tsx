import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { CurrentUser } from "@alwaystrack/shared";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SalesDocumentDiagnostics, SalesDocumentItem, SalesDocumentTimeline } from "../src/sales";
import { NotesView } from "../src/views/notes";

const apiMock = vi.fn();

vi.mock("../src/api", () => ({ api: (...args: unknown[]) => apiMock(...args) }));

const users = {
  manager: {
    id: "manager-1",
    name: "Gestora Exemplo",
    email: "gestora@example.invalid",
    role: "GESTOR",
    organizationId: "organization-1",
    unitScopeIds: [],
    sectorScopeIds: []
  },
  seller: {
    id: "seller-user-1",
    name: "Vendedora Exemplo",
    email: "vendedora@example.invalid",
    role: "VENDEDOR",
    organizationId: "organization-1",
    unitScopeIds: [],
    sectorScopeIds: []
  },
  support: {
    id: "support-1",
    name: "Atendimento Exemplo",
    email: "atendimento@example.invalid",
    role: "SAC",
    organizationId: "organization-1",
    unitScopeIds: [],
    sectorScopeIds: []
  }
} satisfies Record<string, CurrentUser>;

const sellerProfile = {
  id: "seller-1",
  displayName: "Vendedora Exemplo",
  code: "SELLER-001",
  salesGroup: { id: "group-1", name: "Equipe Norte" }
};

function documentFixture(overrides: Partial<SalesDocumentItem> = {}): SalesDocumentItem {
  return {
    id: "document-1",
    fileName: "danfe-sanitizada.pdf",
    status: "PENDING_REVIEW",
    accessKey: "00000000000000000000000000000000000000000000",
    invoiceNumber: "1001",
    series: "1",
    issuedAt: "2026-07-14T00:00:00.000Z",
    issuerName: "Fornecedor Exemplo",
    buyerName: "Cliente Exemplo",
    totalAmountCents: 25990,
    extractionConfidence: 0.94,
    rejectionReason: null,
    createdAt: "2026-07-15T09:00:00.000Z",
    sellerProfile,
    items: [
      {
        id: "item-1",
        sku: "SKU-001",
        description: "Produto sanitizado",
        category: "Categoria Exemplo",
        quantity: 2,
        unitAmountCents: 12995,
        totalAmountCents: 25990
      }
    ],
    extractions: [{ id: "extraction-1", provider: "fixture", confidence: 0.94, createdAt: "2026-07-15T09:01:00.000Z" }],
    ...overrides
  };
}

const timelineFixture: SalesDocumentTimeline = {
  document: {
    id: "document-1",
    fileName: "danfe-sanitizada.pdf",
    status: "PENDING_REVIEW",
    invoiceNumber: "1001",
    accessKey: "00000000000000000000000000000000000000000000",
    issuedAt: "2026-07-14T00:00:00.000Z",
    totalAmountCents: 25990,
    sellerProfile
  },
  events: [
    {
      id: "event-1",
      at: "2026-07-15T09:00:00.000Z",
      type: "UPLOAD",
      title: "DANFE recebida",
      detail: "Arquivo sanitizado recebido para análise.",
      actor: { id: "seller-user-1", name: "Vendedora Exemplo", email: "vendedora@example.invalid", role: "VENDEDOR" },
      status: "UPLOADED"
    }
  ],
  total: 1
};

const diagnosticsFixture: SalesDocumentDiagnostics = {
  document: {
    ...timelineFixture.document,
    mimeType: "application/pdf",
    size: 2048,
    series: "1",
    issuerName: "Fornecedor Exemplo",
    buyerName: "Cliente Exemplo",
    rejectionReason: null,
    createdAt: "2026-07-15T09:00:00.000Z",
    reviewedAt: null,
    uploadedBy: { id: "seller-user-1", name: "Vendedora Exemplo", email: "vendedora@example.invalid", role: "VENDEDOR" },
    reviewedBy: null
  },
  operationalStatus: "EXTRACTION_FAILED",
  extraction: {
    id: "extraction-1",
    provider: "fixture",
    confidence: 0.94,
    createdAt: "2026-07-15T09:01:00.000Z",
    fields: {
      accessKey: { value: "00000000000000000000000000000000000000000000", confidence: 0.99 },
      invoiceNumber: { value: "1001", confidence: 0.98 }
    },
    accessKey: "00000000000000000000000000000000000000000000",
    rawTextAvailable: true
  },
  currentItems: documentFixture().items,
  duplicateCandidates: [
    {
      id: "document-duplicate",
      fileName: "outra-danfe.pdf",
      status: "APPROVED",
      invoiceNumber: "999",
      issuedAt: "2026-07-01T00:00:00.000Z",
      createdAt: "2026-07-01T10:00:00.000Z",
      sellerProfile
    }
  ],
  extractionFailures: [
    {
      id: "failure-1",
      createdAt: "2026-07-15T09:02:00.000Z",
      actor: null,
      message: "Leitura automática inconclusiva.",
      metadata: {}
    }
  ]
};

function sellersResponse() {
  return { items: [sellerProfile], total: 1 };
}

function installApi(documents: SalesDocumentItem[] = [documentFixture()]) {
  apiMock.mockImplementation((path: string, options?: RequestInit) => {
    if (path.startsWith("/v1/sales/documents?") && !options) return Promise.resolve({ items: documents, total: documents.length });
    if (path === "/v1/sales/sellers") return Promise.resolve(sellersResponse());
    if (path.endsWith("/timeline")) return Promise.resolve(timelineFixture);
    if (path.endsWith("/diagnostics")) return Promise.resolve(diagnosticsFixture);
    if (path.includes("/analyze")) {
      return Promise.resolve({ document: documentFixture({ status: "PENDING_REVIEW" }), warnings: ["Conferir emitente"], duplicate: true, extraction: { provider: "fixture-ai", model: "safe-model", usedAi: true, itemCount: 1, accessKey: "0000" } });
    }
    if (path.includes("/review") || path.includes("/manual-correction")) return Promise.resolve({ document: documentFixture({ status: "APPROVED" }) });
    if (path.startsWith("/v1/sales/documents?") && options?.method === "POST") return Promise.resolve({ document: documentFixture({ status: "UPLOADED" }) });
    return Promise.resolve({});
  });
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((next) => {
    resolve = next;
  });
  return { promise, resolve };
}

describe("NotesView", () => {
  beforeEach(() => {
    installApi();
    Object.defineProperty(window, "scrollTo", { configurable: true, value: vi.fn() });
    Object.defineProperty(window, "requestAnimationFrame", { configurable: true, value: (callback: FrameRequestCallback) => callback(0) });
    Object.defineProperty(HTMLElement.prototype, "scrollIntoView", { configurable: true, value: vi.fn() });
  });

  it("exibe loading, lista sanitizada e consulta novamente ao aplicar e limpar filtros", async () => {
    const pending = deferred<{ items: SalesDocumentItem[]; total: number }>();
    apiMock.mockImplementation((path: string) => {
      if (path.startsWith("/v1/sales/documents?")) return pending.promise;
      if (path === "/v1/sales/sellers") return Promise.resolve(sellersResponse());
      return Promise.resolve({});
    });

    const user = userEvent.setup();
    render(<NotesView user={users.manager} initialFilters={{ status: "PENDING_REVIEW" }} />);

    expect(screen.getByRole("status")).toHaveTextContent("Carregando notas");
    pending.resolve({ items: [documentFixture()], total: 1 });
    expect(await screen.findByText("danfe-sanitizada.pdf")).toBeInTheDocument();
    expect(screen.getByText("1-1 de 1")).toBeInTheDocument();

    const statusFilter = screen.getAllByRole("combobox")[2];
    await user.selectOptions(statusFilter, "APPROVED");
    await waitFor(() => expect(apiMock).toHaveBeenCalledWith(expect.stringContaining("status=APPROVED")));
    await user.click(screen.getByRole("button", { name: "Limpar" }));
    await waitFor(() => expect(apiMock).toHaveBeenCalledWith("/v1/sales/documents?page=1&pageSize=12"));
  });

  it("apresenta estado vazio quando a consulta não retorna notas", async () => {
    installApi([]);
    render(<NotesView user={users.seller} />);

    expect(await screen.findByText("Nenhuma nota enviada")).toBeInTheDocument();
    expect(screen.getByText(/Envie uma DANFE ou limpe os filtros/)).toBeInTheDocument();
  });

  it("envia um File sintético com vendedor e conteúdo corretos", async () => {
    const user = userEvent.setup();
    render(<NotesView user={users.manager} />);
    await screen.findByText("danfe-sanitizada.pdf");
    await waitFor(() => expect(screen.getByRole("button", { name: "Enviar nota" })).toBeEnabled());

    const file = new File(["conteudo sanitizado"], "nota-exemplo.xml", { type: "application/xml" });
    const bytes = new TextEncoder().encode("conteudo sanitizado").buffer;
    Object.defineProperty(file, "arrayBuffer", { configurable: true, value: vi.fn().mockResolvedValue(bytes) });
    const fileInput = document.querySelector<HTMLInputElement>('input[name="danfe"]');
    expect(fileInput).not.toBeNull();
    await user.upload(fileInput!, file);
    vi.spyOn(globalThis, "FormData").mockImplementation(() => ({ get: () => file }) as unknown as FormData);
    await user.click(screen.getByRole("button", { name: "Enviar nota" }));

    await waitFor(() => expect(apiMock).toHaveBeenCalledWith(
      "/v1/sales/documents?fileName=nota-exemplo.xml&sellerProfileId=seller-1",
      expect.objectContaining({ method: "POST", headers: { "content-type": "application/xml" }, body: bytes })
    ));
  });

  it("respeita upload e revisão por papel", async () => {
    const { rerender } = render(<NotesView user={users.support} />);
    await screen.findByText("danfe-sanitizada.pdf");
    expect(screen.queryByRole("heading", { name: "Enviar DANFE" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Aceitar" })).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Selecionar NF 1001/)).not.toBeInTheDocument();

    rerender(<NotesView user={users.seller} />);
    expect(await screen.findByRole("heading", { name: "Enviar DANFE" })).toBeInTheDocument();
    expect(screen.getAllByRole("combobox")).toHaveLength(2);
    expect(screen.queryByRole("button", { name: "Aceitar" })).not.toBeInTheDocument();

    rerender(<NotesView user={users.manager} />);
    expect(await screen.findByRole("button", { name: "Aceitar" })).toBeEnabled();
    expect(screen.getByLabelText("Selecionar NF 1001")).toBeEnabled();
  });

  it("executa extração e revisão autorizada com o rascunho editado", async () => {
    installApi([documentFixture({ status: "UPLOADED" }), documentFixture({ id: "document-review", fileName: "revisao.pdf" })]);
    const user = userEvent.setup();
    render(<NotesView user={users.manager} />);
    await screen.findByText("revisao.pdf");

    await user.click(screen.getByRole("button", { name: "Extrair" }));
    await waitFor(() => expect(apiMock).toHaveBeenCalledWith("/v1/sales/documents/document-1/analyze", { method: "POST" }));
    expect(await screen.findByText("Origem: IA")).toBeInTheDocument();
    expect(screen.getByText("Duplicidade real sinalizada")).toBeInTheDocument();

    const reviewRow = screen.getByText("revisao.pdf").closest("tr");
    expect(reviewRow).not.toBeNull();
    await user.click(within(reviewRow!).getByRole("button", { name: "Aceitar" }));
    await waitFor(() => expect(apiMock).toHaveBeenCalledWith(
      "/v1/sales/documents/document-review/review",
      expect.objectContaining({
        method: "PATCH",
        body: expect.stringContaining('"status":"APPROVED"')
      })
    ));
    const reviewCall = apiMock.mock.calls.find(([path]) => path === "/v1/sales/documents/document-review/review");
    expect(JSON.parse(String(reviewCall?.[1]?.body))).toMatchObject({
      totalAmountCents: 25990,
      items: [{ unitAmountCents: 12995, totalAmountCents: 25990 }]
    });
  });

  it("abre e fecha a timeline rastreável", async () => {
    const user = userEvent.setup();
    render(<NotesView user={users.manager} />);
    const row = (await screen.findByText("danfe-sanitizada.pdf")).closest("tr");
    expect(row).not.toBeNull();

    await user.click(within(row!).getByRole("button", { name: "Timeline" }));
    expect(await screen.findByText("DANFE recebida")).toBeInTheDocument();
    expect(screen.getByText("Arquivo sanitizado recebido para análise.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Fechar timeline" }));
    await waitFor(() => expect(screen.queryByText("DANFE recebida")).not.toBeInTheDocument());
  });

  it("abre diagnóstico e salva correção auditável", async () => {
    const diagnosticsPending = deferred<SalesDocumentDiagnostics>();
    apiMock.mockImplementation((path: string, options?: RequestInit) => {
      if (path.startsWith("/v1/sales/documents?") && !options) return Promise.resolve({ items: [documentFixture()], total: 1 });
      if (path === "/v1/sales/sellers") return Promise.resolve(sellersResponse());
      if (path.endsWith("/diagnostics")) return diagnosticsPending.promise;
      if (path.includes("/manual-correction")) return Promise.resolve({ document: documentFixture({ status: "APPROVED" }) });
      return Promise.resolve({});
    });
    const user = userEvent.setup();
    render(<NotesView user={users.manager} />);
    const row = (await screen.findByText("danfe-sanitizada.pdf")).closest("tr");
    expect(row).not.toBeNull();
    await user.click(within(row!).getByRole("button", { name: "Diagnostico" }));
    await waitFor(() => expect(apiMock).toHaveBeenCalledWith("/v1/sales/documents/document-1/diagnostics"));
    expect(screen.getByText("Carregando diagnostico da DANFE")).toBeInTheDocument();
    await act(async () => diagnosticsPending.resolve(diagnosticsFixture));
    expect(await screen.findByText(/Falha de extração/)).toBeInTheDocument();
    expect(screen.getByText(/Leitura automática inconclusiva\./)).toBeInTheDocument();
    expect(screen.getByText(/999 · Vendedora Exemplo · APPROVED/)).toBeInTheDocument();

    await user.type(screen.getByRole("textbox", { name: /Comentário da correção manual/ }), "Correção conferida pela gestão.");
    await user.click(screen.getByRole("button", { name: "Salvar correção auditável" }));
    await waitFor(() => expect(apiMock).toHaveBeenCalledWith(
      "/v1/sales/documents/document-1/manual-correction",
      expect.objectContaining({ method: "PATCH", body: expect.stringContaining('"correctionNote":"Correção conferida pela gestão."') })
    ));
  });

  it("mostra falha de mutação sem remover nem alterar a nota local", async () => {
    apiMock.mockImplementation((path: string, options?: RequestInit) => {
      if (path.startsWith("/v1/sales/documents?") && !options) return Promise.resolve({ items: [documentFixture()], total: 1 });
      if (path === "/v1/sales/sellers") return Promise.resolve(sellersResponse());
      if (path.endsWith("/review")) return Promise.reject(new Error("Revisão indisponível."));
      return Promise.resolve({});
    });
    const user = userEvent.setup();
    render(<NotesView user={users.manager} />);
    await screen.findByText("danfe-sanitizada.pdf");

    await user.click(screen.getByRole("button", { name: "Negar" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Revisão indisponível.");
    expect(screen.getByText("danfe-sanitizada.pdf")).toBeInTheDocument();
    expect(screen.getAllByText("PENDING_REVIEW").length).toBeGreaterThan(0);
    expect(apiMock.mock.calls.filter(([path]) => String(path).startsWith("/v1/sales/documents?") && !String(path).includes("/review"))).toHaveLength(1);
  });
});
