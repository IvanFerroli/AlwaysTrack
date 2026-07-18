import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NotificationCenter } from "../src/components/notification-center";
import { expectNoCriticalAccessibilityViolations } from "./accessibility-assertions";

const apiMock = vi.fn();
vi.mock("../src/api", () => ({ api: (...args: unknown[]) => apiMock(...args) }));

const pauseNotification = {
  id: "notice-pause",
  type: "support_pause.swap.request",
  title: "Troca de pausa pendente",
  body: "Bruno solicitou uma troca.",
  href: "/pausas?date=2026-07-18&teamId=team-2&swapId=swap-1&tab=swaps",
  readAt: null,
  createdAt: "2026-07-17T12:00:00.000Z"
};

function notificationResponse(items = [pauseNotification]) {
  return {
    items,
    unread: items.filter((item) => !item.readAt).length,
    groups: [{ type: items[0]?.type ?? "support", unread: items.filter((item) => !item.readAt).length, total: items.length }]
  };
}

describe("NotificationCenter navigation and dismissal", () => {
  beforeEach(() => {
    apiMock.mockImplementation((path: string) => path.startsWith("/v1/in-app-notifications")
      ? Promise.resolve(path.endsWith("/read") ? {} : notificationResponse())
      : Promise.resolve({}));
  });

  it("dismisses on outside pointer interaction and restores trigger focus", async () => {
    const user = userEvent.setup();
    const { container } = render(<div><button type="button">Fora</button><NotificationCenter onNavigate={vi.fn()} /></div>);
    const trigger = await screen.findByRole("button", { name: /Notificações, 1/ });

    await user.click(trigger);
    expect(await screen.findByRole("dialog", { name: "Notificações" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Marcar lidas" })).toHaveFocus();
    expectNoCriticalAccessibilityViolations(container);

    fireEvent.pointerDown(screen.getByRole("button", { name: "Fora" }));
    expect(screen.queryByRole("dialog", { name: "Notificações" })).not.toBeInTheDocument();
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it("marks a resolved item and navigates with href, query and typed intent", async () => {
    const user = userEvent.setup();
    const onNavigate = vi.fn();
    render(<NotificationCenter onNavigate={onNavigate} />);

    await user.click(await screen.findByRole("button", { name: /Notificações, 1/ }));
    await user.click(await screen.findByRole("button", { name: /Troca de pausa pendente/ }));

    await waitFor(() => expect(apiMock).toHaveBeenCalledWith("/v1/in-app-notifications/notice-pause/read", { method: "POST" }));
    expect(onNavigate).toHaveBeenCalledWith(
      pauseNotification.href,
      expect.objectContaining({
        state: "READY",
        view: "supportPauses",
        intent: expect.objectContaining({ supportPauses: expect.objectContaining({ date: "2026-07-18", teamId: "team-2", swapId: "swap-1", tab: "swaps" }) })
      })
    );
    expect(window.location.pathname).toBe("/pausas");
    expect(window.location.search).toBe("?date=2026-07-18&teamId=team-2&swapId=swap-1&tab=swaps");
    expect(screen.queryByText(pauseNotification.href)).not.toBeInTheDocument();
  });

  it("keeps an unsafe unavailable item visible without marking or navigating", async () => {
    const unavailable = {
      ...pauseNotification,
      id: "notice-unsafe",
      title: "Conteúdo antigo",
      type: "legacy.unknown",
      href: "https://example.test/segredo"
    };
    apiMock.mockImplementation((path: string) => path === "/v1/in-app-notifications"
      ? Promise.resolve(notificationResponse([unavailable]))
      : Promise.resolve({}));
    const user = userEvent.setup();
    const onNavigate = vi.fn();
    render(<NotificationCenter onNavigate={onNavigate} />);

    await user.click(await screen.findByRole("button", { name: /Notificações, 1/ }));
    expect(screen.getByText("Alvo indisponível")).toBeInTheDocument();
    expect(screen.queryByText(unavailable.href)).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Conteúdo antigo/ }));

    expect(await screen.findByText("Este conteúdo não está disponível para sua conta.")).toBeInTheDocument();
    expect(onNavigate).not.toHaveBeenCalled();
    expect(apiMock).not.toHaveBeenCalledWith("/v1/in-app-notifications/notice-unsafe/read", { method: "POST" });
  });
});
