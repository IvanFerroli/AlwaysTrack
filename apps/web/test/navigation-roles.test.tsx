import { fireEvent, screen, waitFor } from "@testing-library/react";
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
    expect(navigation).toHaveTextContent("Fluxos");
    expect(navigation).not.toHaveTextContent("CaseFlow Admin");
    expect(navigation).not.toHaveTextContent("Auditoria");

    fireEvent.click(screen.getByRole("button", { name: /Sair/ }));
    const password = await screen.findByLabelText("Senha");
    fireEvent.change(password, { target: { value: "senha-local" } });
    fireEvent.click(screen.getByRole("button", { name: "Entrar com senha" }));

    await waitFor(() => expect(screen.getByRole("navigation", { name: "Navegação principal" })).toHaveTextContent("CaseFlow Admin"));
    fireEvent.click(screen.getAllByRole("button", { name: /CaseFlow Admin/ })[0]);
    expect(await screen.findByText("Administração CaseFlow carregada")).toBeInTheDocument();
  });
});
