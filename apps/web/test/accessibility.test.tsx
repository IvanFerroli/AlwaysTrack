import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { NotificationCenter } from "../src/components/notification-center";
import { MarkdownEditor } from "../src/components/markdown-editor";
import { CaseFlowAdminView } from "../src/views/case-flow/admin";
import { keyboardTabIndex } from "../src/accessibility/tabs";
import { contrastRatio, expectNoCriticalAccessibilityViolations } from "./accessibility-assertions";

const apiMock = vi.fn();
vi.mock("../src/api", () => ({ api: (...args: unknown[]) => apiMock(...args) }));

describe("critical accessibility gate", () => {
  it("opens and closes notifications by keyboard while restoring focus", async () => {
    apiMock.mockResolvedValue({
      items: [{ id: "notice-1", type: "CASE", title: "Caso atualizado", createdAt: "2026-07-15T12:00:00.000Z", readAt: null }],
      unread: 1,
      groups: [{ type: "CASE", unread: 1, total: 1 }]
    });
    const user = userEvent.setup();
    const { container } = render(<NotificationCenter onNavigate={vi.fn()} />);
    const trigger = await screen.findByRole("button", { name: /Notificações, 1/ });

    trigger.focus();
    await user.keyboard("{Enter}");
    expect(await screen.findByRole("dialog", { name: "Notificações" })).toBeInTheDocument();
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("button", { name: "Marcar lidas" })).toHaveFocus();
    expectNoCriticalAccessibilityViolations(container);

    await user.keyboard("{Escape}");
    await waitFor(() => expect(trigger).toHaveFocus());
    expect(screen.queryByRole("dialog", { name: "Notificações" })).not.toBeInTheDocument();
  });

  it("provides roving keyboard tabs and named editor panels", async () => {
    const user = userEvent.setup();
    const { container } = render(<MarkdownEditor label="Conteúdo da página" value="## Ajuda" onChange={vi.fn()} />);
    const writeTab = screen.getByRole("tab", { name: "Escrever" });
    writeTab.focus();

    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: "Preview" })).toHaveFocus();
    expect(screen.getByRole("tabpanel")).toHaveTextContent("Ajuda");
    expectNoCriticalAccessibilityViolations(container);
  });

  it("dismisses and navigates the emoji menu while preserving the intended focus", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { container } = render(<MarkdownEditor label="Conteúdo da página" value="## Ajuda" onChange={onChange} />);
    const textarea = screen.getByRole("textbox", { name: "Conteúdo da página" });
    const trigger = screen.getByRole("button", { name: "Emoji" });

    textarea.focus();
    textarea.setSelectionRange(8, 8);
    await user.click(trigger);
    let menuItems = screen.getAllByRole("menuitem");
    expect(trigger).toHaveAttribute("aria-haspopup", "menu");
    await waitFor(() => expect(menuItems[0]).toHaveFocus());

    await user.keyboard("{End}");
    expect(menuItems.at(-1)).toHaveFocus();
    await user.keyboard("{Home}{ArrowUp}");
    expect(menuItems.at(-1)).toHaveFocus();
    await user.keyboard("{Escape}");
    await waitFor(() => expect(trigger).toHaveFocus());
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();

    await user.keyboard("{ArrowDown}");
    await waitFor(() => expect(screen.getAllByRole("menuitem")[0]).toHaveFocus());
    await user.tab();
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    expect(textarea).toHaveFocus();

    await user.click(trigger);
    fireEvent.pointerDown(textarea);
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();

    textarea.focus();
    textarea.setSelectionRange(8, 8);
    await user.click(trigger);
    menuItems = screen.getAllByRole("menuitem");
    await waitFor(() => expect(menuItems[0]).toHaveFocus());
    await user.keyboard("{Enter}");
    expect(onChange).toHaveBeenCalledWith("## Ajuda ✅");
    await waitFor(() => expect(textarea).toHaveFocus());
    expectNoCriticalAccessibilityViolations(container);
  });

  it("navigates CaseFlow tabs with arrows and exposes the active named table", async () => {
    apiMock.mockImplementation((path: string) => Promise.resolve(
      path.endsWith("/cases") ? { items: [{ id: "case-1", status: "OPEN", summary: null, updatedAt: "2026-07-15T12:00:00.000Z", conflicts: [], connectorRuns: [] }] }
        : path.endsWith("/rules") ? { latest: [] }
          : []
    ));
    const user = userEvent.setup();
    const { container } = render(<CaseFlowAdminView />);
    const historyTab = await screen.findByRole("tab", { name: "Histórico" });
    historyTab.focus();

    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: "Regras" })).toHaveFocus();
    await user.keyboard("{End}");
    expect(screen.getByRole("tab", { name: "Backup" })).toHaveFocus();
    await user.keyboard("{Home}");
    expect(screen.getByRole("table", { name: "Histórico de casos" })).toBeInTheDocument();
    expectNoCriticalAccessibilityViolations(container);
  });

  it("keeps keyboard navigation deterministic and critical colors above WCAG AA", () => {
    expect(keyboardTabIndex("ArrowLeft", 0, 4)).toBe(3);
    expect(keyboardTabIndex("ArrowDown", 3, 4)).toBe(0);
    expect(contrastRatio("#ffffff", "#0f3d4c")).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio("#ffffff", "#b42318")).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio("#24343a", "#ffffff")).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio("#0b6bcb", "#ffffff")).toBeGreaterThanOrEqual(3);
  });
});
