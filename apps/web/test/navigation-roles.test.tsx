import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

function mockMobileNavViewport() {
  const listeners = new Set<(event: MediaQueryListEvent) => void>();
  const mediaQueryList = {
    matches: true,
    media: "(max-width: 860px)",
    addEventListener: (_type: string, listener: (event: MediaQueryListEvent) => void) => listeners.add(listener),
    removeEventListener: (_type: string, listener: (event: MediaQueryListEvent) => void) => listeners.delete(listener),
    addListener: (listener: (event: MediaQueryListEvent) => void) => listeners.add(listener),
    removeListener: (listener: (event: MediaQueryListEvent) => void) => listeners.delete(listener)
  };
  (window as unknown as { matchMedia: (query: string) => typeof mediaQueryList }).matchMedia = () => mediaQueryList;
}

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
vi.mock("../src/views/support-schedules", () => ({
  SupportSchedulesView: ({ initialIntent }: { initialIntent?: { date?: string; teamId?: string; offerId?: string } }) => (
    <div>Escalas SAC {initialIntent?.date} {initialIntent?.teamId} {initialIntent?.offerId}</div>
  )
}));
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
    vi.resetModules();
    document.body.innerHTML = '<div id="root"></div>';
    window.history.replaceState(null, "", "/");
    apiMock.mockImplementation((path: string) => {
      if (path === "/v1/auth/me") return Promise.resolve({ user: sacUser });
      if (path === "/v1/auth/logout") return Promise.resolve({});
      if (path === "/v1/auth/google/status") return Promise.resolve({ configured: false });
      if (path === "/v1/auth/login") return Promise.resolve({ user: adminUser });
      if (path === "/v1/organization/settings") return Promise.resolve({ organization: { name: "AlwaysTrack", logoUrl: null } });
      if (path.startsWith("/v1/search")) return Promise.resolve({ groups: [] });
      return Promise.resolve({});
    });
  });

  afterEach(() => {
    delete (window as unknown as { matchMedia?: unknown }).matchMedia;
  });

  it("hides admin destinations from SAC and exposes them after an admin login", async () => {
    await import("../src/main");

    const navigation = await screen.findByRole("navigation", { name: "Navegação principal" });
    const primaryNav = within(navigation);
    expect(navigation).toHaveTextContent("SAC");
    expect(navigation).not.toHaveTextContent("Fluxos");
    fireEvent.click(primaryNav.getByRole("button", { name: /^SAC/ }));
    expect(navigation).toHaveTextContent("Fluxos");
    const supportOptions = screen.getByRole("group", { name: "Opções de SAC" });
    expect(supportOptions.textContent?.indexOf("Escalas")).toBeLessThan(supportOptions.textContent?.indexOf("Pausas") ?? -1);
    expect(navigation).not.toHaveTextContent("CaseFlow Admin");
    expect(navigation).not.toHaveTextContent("Auditoria");

    const search = screen.getByLabelText("Busca global");
    fireEvent.change(search, { target: { value: "pa" } });
    expect(await screen.findByText("Nenhum resultado encontrado")).toBeInTheDocument();
    fireEvent.pointerDown(screen.getByRole("heading", { name: "Dashboard" }));
    expect(screen.queryByText("Nenhum resultado encontrado")).not.toBeInTheDocument();

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
    fireEvent.pointerDown(screen.getByRole("heading", { name: "Dashboard" }));
    expect(within(topNavigation).queryByRole("group", { name: "Atalhos de Administração" })).not.toBeInTheDocument();

    fireEvent.click(adminPrimaryNav.getByRole("button", { name: /CaseFlow Admin/ }));
    expect(await screen.findByText("Administração CaseFlow carregada")).toBeInTheDocument();
  });

  it("boots directly into a schedule deep link with its typed intent", async () => {
    window.history.replaceState(null, "", "/escalas?date=2099-07-15&teamId=team-1&offerId=offer-7");
    await import("../src/main");

    expect(await screen.findByText("Escalas SAC 2099-07-15 team-1 offer-7")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Escalas" })).toBeInTheDocument();
    expect(window.location.pathname).toBe("/escalas");
    expect(window.location.search).toContain("offerId=offer-7");
  });

  it("collapses the active group on mobile after selecting a child, keeps it identifiable and reopens with aria-current", async () => {
    mockMobileNavViewport();
    await import("../src/main");

    const navigation = await screen.findByRole("navigation", { name: "Navegação principal" });
    const primaryNav = within(navigation);
    const sacToggle = primaryNav.getByRole("button", { name: /^SAC/ });
    fireEvent.click(sacToggle);
    expect(sacToggle).toHaveAttribute("aria-expanded", "true");
    fireEvent.click(primaryNav.getByRole("button", { name: /^Fluxos/ }));

    // Selecting the child navigates and, on mobile, collapses the submenu so the chosen
    // page's own first viewport is not consumed by the expanded nav tree (UX-002).
    expect(await screen.findByText("Fluxos de atendimento")).toBeInTheDocument();
    expect(sacToggle).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("group", { name: "Opções de SAC" })).not.toBeInTheDocument();
    // The group stays identifiable as active even while collapsed.
    expect(sacToggle).toHaveClass("active");

    // Reopening by touch/keyboard (Enter/Space both dispatch a click on a native button) reveals
    // the active child again with aria-current="page".
    fireEvent.click(sacToggle);
    expect(sacToggle).toHaveAttribute("aria-expanded", "true");
    const reopenedGroup = screen.getByRole("group", { name: "Opções de SAC" });
    expect(within(reopenedGroup).getByRole("button", { name: /^Fluxos/ })).toHaveAttribute("aria-current", "page");
  });

  it("does not auto-expand a directly loaded child's group on mobile, while desktop keeps it expanded", async () => {
    window.history.replaceState(null, "", "/fluxos");
    mockMobileNavViewport();
    await import("../src/main");

    expect(await screen.findByText("Fluxos de atendimento")).toBeInTheDocument();
    const mobileNavigation = screen.getByRole("navigation", { name: "Navegação principal" });
    expect(within(mobileNavigation).queryByRole("group", { name: "Opções de SAC" })).not.toBeInTheDocument();
    expect(within(mobileNavigation).getByRole("button", { name: /^SAC/ })).toHaveAttribute("aria-expanded", "false");

    delete (window as unknown as { matchMedia?: unknown }).matchMedia;
    vi.resetModules();
    document.body.innerHTML = '<div id="root"></div>';
    window.history.replaceState(null, "", "/fluxos");
    await import("../src/main");

    expect(await screen.findByText("Fluxos de atendimento")).toBeInTheDocument();
    const desktopNavigation = screen.getByRole("navigation", { name: "Navegação principal" });
    expect(within(desktopNavigation).getByRole("button", { name: /^SAC/ })).toHaveAttribute("aria-expanded", "true");
    expect(within(desktopNavigation).getByRole("group", { name: "Opções de SAC" })).toHaveTextContent("Fluxos");
  });
});
