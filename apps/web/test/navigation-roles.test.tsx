import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const apiMock = vi.fn();

vi.mock("../src/api", () => ({
  api: (...args: unknown[]) => apiMock(...args),
  apiBaseUrl: "",
  appMode: "local",
  appName: "AlwaysTrack",
  demoMode: false
}));

vi.mock("../src/components/brand", () => ({ BrandMark: () => <span aria-label="AlwaysTrack" /> }));
vi.mock("../src/components/notification-center", () => ({ NotificationCenter: () => null }));
vi.mock("../src/views/dashboard", () => ({ DashboardView: () => <div>Dashboard operacional</div> }));
vi.mock("../src/views/announcements", () => ({ AnnouncementsView: () => <div>Avisos operacionais</div> }));
vi.mock("../src/views/audit", () => ({ AuditView: () => <div>Auditoria administrativa</div> }));
vi.mock("../src/views/campaigns", () => ({ CampaignsView: () => null }));
vi.mock("../src/views/faq", () => ({ FaqThreadsView: () => null }));
vi.mock("../src/views/help", () => ({ HelpView: () => null }));
vi.mock("../src/views/notes", () => ({ NotesView: () => null }));
vi.mock("../src/views/profile", () => ({ ProfileView: () => null }));
vi.mock("../src/views/ranking", () => ({ RankingView: () => null }));
vi.mock("../src/views/script-library", () => ({ ScriptLibraryView: () => null }));
vi.mock("../src/views/service-flows", () => ({ ServiceFlowsView: () => <div>Fluxos de atendimento</div> }));
vi.mock("../src/views/settings", () => ({ SettingsView: () => null }));
vi.mock("../src/views/statements", () => ({ StatementsView: () => null }));
vi.mock("../src/views/support-pauses", () => ({ SupportPausesView: () => <div>Pausas SAC</div> }));
vi.mock("../src/views/support-performance", () => ({ SupportPerformanceView: () => <div>Performance SAC</div> }));
vi.mock("../src/views/support-campaigns", () => ({ SupportCampaignsView: () => <div>Campanhas SAC</div> }));
vi.mock("../src/views/users-teams", () => ({ UsersTeamsView: () => null }));
vi.mock("../src/views/wiki", () => ({ WikiView: () => null }));
vi.mock("../src/views/case-flow/health", () => ({ CaseFlowHealthView: () => null }));
vi.mock("../src/views/case-flow/admin", () => ({ CaseFlowAdminView: () => <div>Administração CaseFlow carregada</div> }));

const sacUser = { id: "user-sac", name: "Pessoa SAC", email: "sac@example.test", role: "SAC", organizationId: "org-1", unitScopeIds: [], sectorScopeIds: [], avatarUrl: null };
const adminUser = { ...sacUser, id: "user-admin", name: "Pessoa Admin", role: "ADMIN" };

describe("role navigation guards", () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="root"></div>';
    apiMock.mockImplementation((path: string) => {
      if (path === "/v1/auth/me") return Promise.resolve({ user: sacUser });
      if (path === "/v1/auth/logout") return Promise.resolve({});
      if (path === "/v1/auth/google/status") return Promise.resolve({ configured: false });
      if (path === "/v1/auth/login") return Promise.resolve({ user: adminUser });
      if (path === "/v1/organization/settings") return Promise.resolve({ organization: { name: "AlwaysTrack", logoUrl: null } });
      if (path === "/v1/search") return Promise.resolve({ groups: [] });
      return Promise.resolve({});
    });
  });

  it("hides admin destinations from SAC and exposes them after an admin login", async () => {
    await import("../src/main");

    const navigation = await screen.findByRole("navigation", { name: "Navegação principal" });
    const primaryNav = within(navigation);
    expect(navigation).toHaveTextContent("SAC");
    expect(navigation).not.toHaveTextContent("Fluxos");
    fireEvent.click(primaryNav.getByRole("button", { name: /^SAC/ }));
    expect(navigation).toHaveTextContent("Fluxos");
    expect(navigation).not.toHaveTextContent("CaseFlow Admin");
    expect(navigation).not.toHaveTextContent("Auditoria");

    fireEvent.click(screen.getByRole("button", { name: /Sair/ }));
    const password = await screen.findByLabelText("Senha");
    fireEvent.change(password, { target: { value: "senha-local" } });
    fireEvent.click(screen.getByRole("button", { name: "Entrar com senha" }));

    await waitFor(() => expect(within(screen.getByRole("navigation", { name: "Navegação principal" })).getByRole("button", { name: /^Administração/ })).toBeInTheDocument());
    const adminNavigation = screen.getByRole("navigation", { name: "Navegação principal" });
    const adminPrimaryNav = within(adminNavigation);
    const topLevel = Array.from(adminNavigation.children).map((element) => element.matches("button") ? element : element.querySelector(":scope > button"));
    expect(topLevel).toHaveLength(5);
    expect(topLevel.map((element) => element?.textContent)).toEqual([
      expect.stringContaining("Dashboard"),
      expect.stringContaining("Perfil"),
      expect.stringContaining("SAC"),
      expect.stringContaining("Administração"),
      expect.stringContaining("Como usar")
    ]);
    fireEvent.click(adminPrimaryNav.getByRole("button", { name: /^SAC/ }));
    expect(screen.getByRole("group", { name: "Opções de SAC" })).toHaveTextContent("Wiki");
    expect(screen.getByRole("group", { name: "Opções de SAC" })).toHaveTextContent("FAQ");
    fireEvent.click(adminPrimaryNav.getByRole("button", { name: /^Administração/ }));
    expect(screen.queryByRole("group", { name: "Opções de SAC" })).not.toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Navegação principal" })).toHaveTextContent("Operação técnica");
    expect(screen.getByRole("navigation", { name: "Navegação principal" })).toHaveTextContent("Status CaseFlow");
    expect(screen.getByRole("navigation", { name: "Navegação principal" })).not.toHaveTextContent("Saúde CaseFlow");
    expect(adminPrimaryNav.getByRole("button", { name: /^Como usar/ })).not.toHaveAttribute("aria-expanded");

    const topNavigation = screen.getByRole("navigation", { name: "Atalhos principais" });
    const topAdmin = within(topNavigation).getByRole("button", { name: /^Administração/ });
    fireEvent.click(topAdmin);
    expect(within(topNavigation).getByRole("group", { name: "Atalhos de Administração" })).toHaveTextContent("CaseFlow Admin");

    fireEvent.click(adminPrimaryNav.getByRole("button", { name: /CaseFlow Admin/ }));
    expect(await screen.findByText("Administração CaseFlow carregada")).toBeInTheDocument();
  });
});
