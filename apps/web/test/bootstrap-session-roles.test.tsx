import { act, fireEvent, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const apiMock = vi.fn();

vi.mock("../src/api", () => ({
  api: (...args: unknown[]) => apiMock(...args),
  apiBaseUrl: "",
  appMode: "local",
  appName: "AlwaysTrack",
  demoMode: false
}));

vi.mock("../src/components/brand", () => ({ BrandMark: ({ alt }: { alt?: string }) => <span aria-label={alt || "AlwaysTrack"} /> }));
vi.mock("../src/components/notification-center", () => ({ NotificationCenter: () => null }));
vi.mock("../src/views/dashboard", () => ({ DashboardView: () => <div>Dashboard operacional</div> }));
vi.mock("../src/views/announcements", () => ({ AnnouncementsView: () => <div>Avisos operacionais</div> }));
vi.mock("../src/views/audit", () => ({ AuditView: () => <div>Auditoria administrativa</div> }));
vi.mock("../src/views/campaigns", () => ({ CampaignsView: () => <div>Campanhas operacionais</div> }));
vi.mock("../src/views/faq", () => ({ FaqThreadsView: () => <div>FAQ operacional</div> }));
vi.mock("../src/views/help", () => ({ HelpView: () => <div id="visao-geral">Ajuda operacional</div> }));
vi.mock("../src/views/notes", () => ({ NotesView: () => <div>Notas operacionais</div> }));
vi.mock("../src/views/profile", () => ({ ProfileView: () => <div>Perfil operacional</div> }));
vi.mock("../src/views/ranking", () => ({ RankingView: () => <div>Ranking operacional</div> }));
vi.mock("../src/views/script-library", () => ({ ScriptLibraryView: () => <div>Scriptoteca operacional</div> }));
vi.mock("../src/views/service-flows", () => ({ ServiceFlowsView: () => <div>Fluxos operacionais</div> }));
vi.mock("../src/views/settings", () => ({ SettingsView: () => <div>Configurações operacionais</div> }));
vi.mock("../src/views/statements", () => ({ StatementsView: () => <div>Extratos operacionais</div> }));
vi.mock("../src/views/support-pauses", () => ({
  SupportPausesView: ({ initialIntent }: { initialIntent?: Record<string, string> }) => (
    <div>Pausas SAC operacional<output data-testid="support-pauses-intent">{JSON.stringify(initialIntent ?? {})}</output></div>
  )
}));
vi.mock("../src/views/support-performance", () => ({ SupportPerformanceView: () => <div>Performance SAC operacional</div> }));
vi.mock("../src/views/support-campaigns", () => ({ SupportCampaignsView: () => <div>Campanhas SAC operacionais</div> }));
vi.mock("../src/views/users-teams", () => ({ UsersTeamsView: () => <div>Usuários operacionais</div> }));
vi.mock("../src/views/wiki", () => ({ WikiView: () => <div>Wiki operacional</div> }));
vi.mock("../src/views/case-flow/health", () => ({ CaseFlowHealthView: () => <div>Saúde CaseFlow operacional</div> }));
vi.mock("../src/views/case-flow/admin", () => ({ CaseFlowAdminView: () => <div>CaseFlow Admin operacional</div> }));

type Role = "ADMIN" | "SAC" | "FINANCEIRO" | "VENDEDOR" | "SUPERVISOR" | "RT";

function userFor(role: Role) {
  return {
    id: `user-${role.toLowerCase()}`,
    name: `Pessoa ${role}`,
    email: `${role.toLowerCase()}@example.test`,
    role,
    organizationId: "org-1",
    unitScopeIds: [],
    sectorScopeIds: [],
    avatarUrl: null
  };
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

async function loginAs(role: Role, fail = false) {
  fireEvent.change(screen.getByLabelText("Email"), { target: { value: `${role.toLowerCase()}@example.test` } });
  fireEvent.change(screen.getByLabelText("Senha"), { target: { value: "senha-local" } });
  apiMock.mockImplementationOnce(() => fail
    ? Promise.reject(new Error("Credenciais sintéticas inválidas"))
    : Promise.resolve({ user: userFor(role) }));
  fireEvent.click(screen.getByRole("button", { name: "Entrar com senha" }));
}

describe("Web bootstrap, session and role matrix", () => {
  beforeEach(() => {
    vi.resetModules();
    document.body.innerHTML = '<div id="root"></div>';
    apiMock.mockReset();
  });

  it("covers loading, expired session, retry, every operational role and guarded navigation", async () => {
    const session = deferred<{ user: ReturnType<typeof userFor> }>();
    void session.promise.catch(() => undefined);
    apiMock.mockImplementation((path: string) => {
      if (path === "/v1/auth/me") return session.promise;
      if (path === "/v1/auth/google/status") return Promise.reject(new Error("Google indisponível"));
      if (path === "/v1/auth/logout") return Promise.resolve({});
      if (path === "/v1/organization/settings") {
        return Promise.resolve({ organization: { name: "AlwaysTrack QA", logoUrl: null } });
      }
      if (path.startsWith("/v1/search")) return Promise.resolve({ groups: [] });
      return Promise.resolve({});
    });

    await import("../src/main");
    expect(await screen.findByText("Carregando...")).toBeInTheDocument();

    await act(async () => {
      session.reject(new Error("Sessão expirada"));
      await Promise.resolve();
    });
    expect(await screen.findByRole("heading", { name: "Entrar" })).toHaveClass("sr-only");
    expect(screen.queryByText("Acesso operacional para notas, ranking, campanhas e extratos comerciais.")).not.toBeInTheDocument();
    const passwordLogin = screen.getByRole("button", { name: "Entrar com senha" });
    const googleLogin = screen.getByRole("button", { name: "Entrar com Google" });
    expect(passwordLogin.compareDocumentPosition(googleLogin) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(googleLogin).toBeDisabled();

    await loginAs("ADMIN", true);
    expect(await screen.findByText("Credenciais sintéticas inválidas")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Entrar com senha" })).toBeEnabled();

    const expectations: Array<{ role: Role; visible: string; group?: string; forbidden?: string[] }> = [
      { role: "ADMIN", visible: "CaseFlow Admin", group: "Administração" },
      { role: "SAC", visible: "Scriptoteca", group: "SAC", forbidden: ["Administração", "Vendas"] },
      { role: "FINANCEIRO", visible: "Perfil", forbidden: ["SAC", "Administração", "Vendas"] },
      { role: "VENDEDOR", visible: "Perfil", forbidden: ["SAC", "Administração", "Vendas"] },
      { role: "SUPERVISOR", visible: "Perfil", forbidden: ["SAC", "Administração", "Vendas"] },
      { role: "RT", visible: "Como usar", forbidden: ["CaseFlow Admin", "SAC", "Vendas"] }
    ];

    for (const { role, visible, group, forbidden } of expectations) {
      await loginAs(role);
      const navigation = await screen.findByRole("navigation", { name: "Navegação principal" });
      const primaryNav = within(navigation);
      if (group) {
        const groupButton = primaryNav.getByRole("button", { name: new RegExp(`^${group}`) });
        if (groupButton.getAttribute("aria-expanded") !== "true") fireEvent.click(groupButton);
      }
      expect(navigation).toHaveTextContent(visible);
      for (const hiddenLabel of forbidden ?? []) expect(navigation).not.toHaveTextContent(hiddenLabel);
      expect(screen.getByText("AlwaysTrack", { selector: ".brand strong" })).toBeInTheDocument();
      expect(screen.queryByText("AlwaysTrack QA")).not.toBeInTheDocument();
      expect(document.querySelector(".brand small")).not.toBeInTheDocument();
      expect(screen.getByText(role, { selector: ".eyebrow" })).toBeInTheDocument();

      const destination = primaryNav.getByRole("button", { name: group ? new RegExp(`^${visible}$`) : new RegExp(`^${visible}`) });
      fireEvent.click(destination);
      expect(screen.getByRole("main")).not.toBeEmptyDOMElement();

      fireEvent.click(screen.getByRole("button", { name: /Recolher menu lateral/ }));
      expect(screen.getByRole("button", { name: /Expandir menu lateral/ })).toBeInTheDocument();

      fireEvent.click(screen.getByRole("button", { name: /Sair/ }));
      await screen.findByRole("heading", { name: "Entrar" });
    }
  });

  it("uses search fallback, escape, help events and safe route transitions", async () => {
    apiMock.mockImplementation((path: string) => {
      if (path === "/v1/auth/me") return Promise.resolve({ user: userFor("ADMIN") });
      if (path === "/v1/organization/settings") return Promise.reject(new Error("Configuração indisponível"));
      if (path.startsWith("/v1/search")) return Promise.resolve({ groups: [] });
      if (path === "/v1/auth/logout") return Promise.resolve({});
      return Promise.resolve({ configured: false });
    });

    await import("../src/main");
    await screen.findByRole("navigation", { name: "Navegação principal" });

    const search = screen.getByRole("textbox", { name: "Busca global" });
    fireEvent.change(search, { target: { value: "ca" } });
    fireEvent.focus(search);
    await waitFor(() => expect(apiMock).toHaveBeenCalledWith("/v1/search?q=ca"), { timeout: 1000 });
    expect(await screen.findByText("Nenhum resultado encontrado")).toBeInTheDocument();
    fireEvent.keyDown(search, { key: "Escape" });
    expect(screen.queryByText("Nenhum resultado encontrado")).not.toBeInTheDocument();

    window.dispatchEvent(new CustomEvent("alwaystrack:open-help", { detail: { hash: "#visao-geral" } }));
    expect(await screen.findByText("Ajuda operacional")).toBeInTheDocument();

    const primaryNav = within(screen.getByRole("navigation", { name: "Navegação principal" }));
    const supportGroup = primaryNav.getByRole("button", { name: /^SAC/ });
    if (supportGroup.getAttribute("aria-expanded") !== "true") fireEvent.click(supportGroup);
    fireEvent.click(primaryNav.getByRole("button", { name: /Wiki/ }));
    expect(await screen.findByText("Wiki operacional")).toBeInTheDocument();
    expect(window.location.pathname).toBe("/wiki");

    fireEvent.click(primaryNav.getByRole("button", { name: /Avisos/ }));
    expect(await screen.findByText("Avisos operacionais")).toBeInTheDocument();
    expect(window.location.pathname).toBe("/avisos");
  });

  it("starts directly in an allowed pause deep link and preserves pause route transitions", async () => {
    window.history.replaceState(null, "", "/pausas?date=2026-07-17&bookingId=booking-a&tab=schedule");
    apiMock.mockImplementation((path: string) => {
      if (path === "/v1/auth/me") return Promise.resolve({ user: userFor("SAC") });
      if (path.startsWith("/v1/search")) return Promise.resolve({ groups: [] });
      if (path === "/v1/auth/logout") return Promise.resolve({});
      return Promise.resolve({ configured: false });
    });

    await import("../src/main");
    expect(await screen.findByText("Pausas SAC operacional")).toBeInTheDocument();
    expect(screen.getByTestId("support-pauses-intent")).toHaveTextContent(JSON.stringify({
      date: "2026-07-17",
      bookingId: "booking-a",
      tab: "schedule"
    }));
    expect(`${window.location.pathname}${window.location.search}`).toBe("/pausas?date=2026-07-17&bookingId=booking-a&tab=schedule");

    const navigation = within(screen.getByRole("navigation", { name: "Navegação principal" }));
    fireEvent.click(navigation.getByRole("button", { name: /^Dashboard/ }));
    expect(window.location.pathname).toBe("/");

    const supportGroup = navigation.getByRole("button", { name: /^SAC/ });
    if (supportGroup.getAttribute("aria-expanded") !== "true") fireEvent.click(supportGroup);
    fireEvent.click(navigation.getByRole("button", { name: /^Pausas$/ }));
    expect(window.location.pathname).toBe("/pausas");
  });
});
