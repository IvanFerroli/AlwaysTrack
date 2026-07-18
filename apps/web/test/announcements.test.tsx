import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { CurrentUser } from "@alwaystrack/shared";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AnnouncementsView } from "../src/views/announcements";

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
    apiMock.mockResolvedValue({ items: [item], total: 1 });

    render(<AnnouncementsView user={users.manager} />);

    expect(await screen.findByRole("button", { name: "Marcar ciência" })).toBeInTheDocument();
    expect(screen.getByText("Pendente para você")).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText("1 registro(s)")).toBeInTheDocument());
    expect(screen.getByText("Outra pessoa")).toBeInTheDocument();
    expect(screen.getByText("Pessoa que abriu")).toBeInTheDocument();
    expect(screen.getByText("Pessoa que não abriu")).toBeInTheDocument();
  });
});
