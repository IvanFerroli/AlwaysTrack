import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { WikiView } from "../src/views/wiki";

const apiMock = vi.fn();
const uploadWikiImageMock = vi.fn();

vi.mock("../src/api", () => ({
  api: (...args: unknown[]) => apiMock(...args),
  uploadWikiImage: (...args: unknown[]) => uploadWikiImageMock(...args)
}));

const admin = {
  id: "admin-1", name: "Admin Sintético", email: "admin@example.test", role: "ADMIN" as const,
  organizationId: "org-1", unitScopeIds: [], sectorScopeIds: [], avatarUrl: null
};
const sac = { ...admin, id: "sac-1", name: "SAC Sintético", role: "SAC" as const };
const author = { id: "admin-1", name: "Admin Sintético", email: "admin@example.test", role: "ADMIN" };
const summary = {
  id: "page-1", slug: "procedimento-local", title: "Procedimento local", content: "# Processo\nUse #sac com cuidado.",
  contentFormat: "MARKDOWN" as const, tags: ["sac"], version: 2, active: true,
  publishedAt: "2026-07-15T12:00:00.000Z", createdAt: "2026-07-14T12:00:00.000Z",
  updatedAt: new Date().toISOString(), updatedBy: author, editRequests: []
};
const detail = {
  ...summary,
  readReceipts: [{ id: "read-1", lastReadAt: "2026-07-15T12:30:00.000Z", user: author }],
  presences: [{ id: "presence-1", mode: "READING" as const, lastSeenAt: "2026-07-15T12:31:00.000Z", user: author }],
  revisions: [
    { id: "revision-2", version: 2, title: summary.title, content: summary.content, contentFormat: "MARKDOWN" as const, createdAt: summary.updatedAt, author },
    { id: "revision-1", version: 1, title: summary.title, content: "# Processo antigo", contentFormat: "MARKDOWN" as const, createdAt: summary.createdAt, author }
  ],
  editRequests: []
};

function successfulWikiApi(path: string, init?: RequestInit) {
  if (path.startsWith("/v1/wiki/pages?") && !init) return Promise.resolve({ items: [summary], total: 1, page: 1 });
  if (path === "/v1/wiki/pages/page-1" && !init) return Promise.resolve({ page: detail });
  if (path.startsWith("/v1/wiki/edit-requests?")) return Promise.resolve({ items: [], total: 0 });
  if (path.endsWith("/read") || path.endsWith("/presence")) return Promise.resolve({});
  if (path === "/v1/wiki/edit-requests" && init?.method === "POST") return Promise.resolve({ request: { id: "request-1" } });
  if (path === "/v1/wiki/pages/page-1" && init?.method === "PATCH") return Promise.resolve({ page: detail });
  if (path.endsWith("/archive")) return Promise.resolve({ page: { ...detail, active: false } });
  return Promise.resolve({});
}

describe("WikiView", () => {
  beforeEach(() => {
    apiMock.mockReset().mockImplementation(successfulWikiApi);
    uploadWikiImageMock.mockReset().mockResolvedValue("![evidencia sintetica](/uploads/wiki/evidencia.png)");
    window.localStorage.clear();
  });

  it("loads governed content and lets an admin publish, draft and archive", async () => {
    render(<WikiView user={admin} />);

    expect(await screen.findByRole("heading", { name: "Procedimento local" })).toBeInTheDocument();
    expect(screen.getAllByText(/Validada por Admin Sintético/).length).toBeGreaterThan(0);
    expect(screen.getAllByText("#sac").length).toBeGreaterThan(0);

    const editTitle = screen.getAllByLabelText("Titulo").at(-1)!;
    fireEvent.change(editTitle, { target: { value: "Procedimento revisado" } });
    const editors = screen.getAllByLabelText("Conteudo");
    fireEvent.change(editors.at(-1)!, { target: { value: "# Processo\nVersao revisada #sac" } });
    const imageInputs = document.querySelectorAll<HTMLInputElement>('input[type="file"]');
    fireEvent.change(imageInputs[imageInputs.length - 1], {
      target: { files: [new File(["synthetic-image"], "evidencia.png", { type: "image/png" })] }
    });
    await waitFor(() => expect(uploadWikiImageMock).toHaveBeenCalledWith(expect.objectContaining({ name: "evidencia.png" }), "page-1"));
    fireEvent.click(screen.getByRole("button", { name: "Salvar rascunho" }));
    expect(screen.getByText("Rascunho local salvo neste navegador.")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Publicar versao" }));
    await waitFor(() => expect(apiMock).toHaveBeenCalledWith(
      "/v1/wiki/pages/page-1",
      expect.objectContaining({ method: "PATCH", body: expect.stringContaining("Procedimento revisado") })
    ));

    fireEvent.click(screen.getByRole("button", { name: "Arquivar" }));
    await waitFor(() => expect(apiMock).toHaveBeenCalledWith(
      "/v1/wiki/pages/page-1/archive",
      expect.objectContaining({ method: "POST" })
    ));
  });

  it("submits a SAC edit request without exposing admin controls", async () => {
    render(<WikiView user={sac} />);
    expect(await screen.findByRole("heading", { name: "Procedimento local" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Nova pagina" })).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Titulo"), { target: { value: "Sugestão do SAC" } });
    fireEvent.change(screen.getByLabelText("Conteudo"), { target: { value: "Texto sugerido e sanitizado" } });
    fireEvent.click(screen.getByRole("button", { name: "Enviar para aprovacao" }));

    await waitFor(() => expect(apiMock).toHaveBeenCalledWith(
      "/v1/wiki/edit-requests",
      expect.objectContaining({ method: "POST", body: expect.stringContaining("Sugestão do SAC") })
    ));
    expect(screen.queryByRole("button", { name: "Arquivar" })).not.toBeInTheDocument();
  });

  it("shows a stable error and empty reader when the API fails", async () => {
    apiMock.mockRejectedValue(new Error("Wiki sintética indisponível"));
    render(<WikiView user={sac} />);

    expect(await screen.findByText("Falha na wiki")).toBeInTheDocument();
    expect(screen.getByText("Wiki sintética indisponível")).toBeInTheDocument();
    expect(screen.getByText("Nenhuma pagina publicada")).toBeInTheDocument();
    expect(screen.getByText("Selecione uma pagina")).toBeInTheDocument();
  });
});
