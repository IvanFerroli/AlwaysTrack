import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { CurrentUser } from "@alwaystrack/shared";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ProfileView } from "../src/views/profile";

const apiMock = vi.fn();
vi.mock("../src/api", () => ({ api: (...args: unknown[]) => apiMock(...args) }));

const user: CurrentUser = {
  id: "sac-1",
  name: "Ana Souza",
  email: "ana@example.com",
  role: "SAC",
  organizationId: "org-1",
  unitScopeIds: [],
  sectorScopeIds: []
};

const profile = {
  id: user.id,
  name: user.name,
  email: user.email,
  avatarUrl: null,
  role: user.role,
  phone: null,
  organization: { id: "org-1", name: "AlwaysTrack" },
  sellerProfile: null,
  supervisedSalesGroups: [],
  googleConnection: null
};

const scheduleNotification = {
  id: "notice-schedule",
  type: "support_schedule.published",
  title: "Sua escala foi publicada",
  body: "Confira os horários de amanhã.",
  href: "/escalas?date=2026-07-18&teamId=team-1",
  readAt: null,
  createdAt: "2026-07-17T13:00:00.000Z"
};

const scheduleTarget = {
  type: "SUPPORT_SCHEDULE",
  status: "AVAILABLE",
  params: { date: "2026-07-18", teamId: "team-1" },
  href: "/escalas?date=2026-07-18&teamId=team-1",
  fallbackHref: "/escalas"
};

function setupApi(items = [scheduleNotification], resolvedTarget: Record<string, unknown> = scheduleTarget) {
  apiMock.mockImplementation((path: string) => {
    if (path === "/v1/profile") return Promise.resolve({ profile });
    if (path === "/v1/in-app-notifications") return Promise.resolve({ items, unread: items.filter((item) => !item.readAt).length });
    if (path.endsWith("/resolve")) return Promise.resolve({ target: resolvedTarget });
    return Promise.resolve({});
  });
}

describe("ProfileView notification history", () => {
  beforeEach(() => setupApi());

  it("keeps history filters and opens a notification instead of only marking it read", async () => {
    const userActions = userEvent.setup();
    const onNavigate = vi.fn();
    render(<ProfileView user={user} onProfileSaved={vi.fn()} onNavigate={onNavigate} />);

    expect(await screen.findByRole("heading", { name: "Histórico" })).toBeInTheDocument();
    expect(screen.getByLabelText("Estado")).toBeInTheDocument();
    expect(screen.getByLabelText("Tipo")).toBeInTheDocument();
    expect(screen.queryByText(/preferência/i)).not.toBeInTheDocument();

    await userActions.click(screen.getByRole("button", { name: /Sua escala foi publicada/ }));

    await waitFor(() => expect(apiMock).toHaveBeenCalledWith("/v1/in-app-notifications/notice-schedule/resolve", { method: "POST" }));
    await waitFor(() => expect(apiMock).toHaveBeenCalledWith("/v1/in-app-notifications/notice-schedule/read", { method: "POST" }));
    expect(onNavigate).toHaveBeenCalledWith(
      scheduleNotification.href,
      expect.objectContaining({
        state: "READY",
        view: "supportSchedules",
        intent: expect.objectContaining({ supportSchedules: expect.objectContaining({ date: "2026-07-18", teamId: "team-1" }) })
      })
    );
    expect(window.location.pathname).toBe("/escalas");
    expect(window.location.search).toBe("?date=2026-07-18&teamId=team-1");
  });

  it("retains an unavailable historical item without reading or navigating", async () => {
    const unavailable = {
      ...scheduleNotification,
      id: "notice-missing",
      title: "Alvo removido",
      type: "legacy.unknown",
      href: "/fora-do-catalogo"
    };
    setupApi([unavailable], { type: null, status: "FORBIDDEN_OR_MISSING", params: {}, href: null, fallbackHref: null });
    const userActions = userEvent.setup();
    const onNavigate = vi.fn();
    render(<ProfileView user={user} onProfileSaved={vi.fn()} onNavigate={onNavigate} />);

    expect(await screen.findByText("Alvo indisponível")).toBeInTheDocument();
    await userActions.click(screen.getByRole("button", { name: /Alvo removido/ }));

    expect(await screen.findByText("Este conteúdo não está disponível para sua conta.")).toBeInTheDocument();
    expect(onNavigate).not.toHaveBeenCalled();
    expect(apiMock).not.toHaveBeenCalledWith("/v1/in-app-notifications/notice-missing/read", { method: "POST" });
  });

  it("keeps profile history unread when backend resolution fails", async () => {
    setupApi();
    apiMock.mockImplementation((path: string) => {
      if (path === "/v1/profile") return Promise.resolve({ profile });
      if (path === "/v1/in-app-notifications") return Promise.resolve({ items: [scheduleNotification], unread: 1 });
      if (path.endsWith("/resolve")) return Promise.reject(new Error("Resolver indisponível"));
      return Promise.resolve({});
    });
    const userActions = userEvent.setup();
    const onNavigate = vi.fn();
    render(<ProfileView user={user} onProfileSaved={vi.fn()} onNavigate={onNavigate} />);

    await userActions.click(await screen.findByRole("button", { name: /Sua escala foi publicada/ }));

    expect(await screen.findByText("Resolver indisponível")).toBeInTheDocument();
    expect(onNavigate).not.toHaveBeenCalled();
    expect(apiMock).not.toHaveBeenCalledWith("/v1/in-app-notifications/notice-schedule/read", { method: "POST" });
  });
});
