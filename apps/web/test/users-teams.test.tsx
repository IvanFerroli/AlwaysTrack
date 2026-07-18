import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { UsersTeamsView } from "../src/views/users-teams";

const apiMock = vi.fn();
vi.mock("../src/api", () => ({ api: (...args: unknown[]) => apiMock(...args) }));

const teams = [
  { id: "team-1", name: "SAC Atendimento", active: true },
  { id: "team-2", name: "SAC Retenção", active: true }
];

const users = [
  {
    id: "sac-1",
    name: "Ana SAC",
    email: "ana@example.test",
    role: "SAC",
    phone: null,
    active: true,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-07-17T00:00:00.000Z",
    supportTeamMemberships: [
      { id: "membership-2", teamId: "team-1", validFrom: "2026-06-01T03:00:00.000Z", validTo: null, team: teams[0] },
      { id: "membership-1", teamId: "team-2", validFrom: "2026-01-01T03:00:00.000Z", validTo: "2026-06-01T03:00:00.000Z", team: teams[1] }
    ]
  },
  {
    id: "seller-legacy",
    name: "Venda Histórica",
    email: "venda@example.test",
    role: "VENDEDOR",
    phone: null,
    active: false,
    createdAt: "2025-01-01T00:00:00.000Z",
    updatedAt: "2026-07-17T00:00:00.000Z",
    supportTeamMemberships: []
  }
];

function installApi() {
  apiMock.mockImplementation((path: string, options?: RequestInit) => {
    if (path === "/v1/users" && !options) return Promise.resolve({ users });
    if (path === "/v1/users/operational-options") return Promise.resolve({ supportTeams: teams });
    if (path === "/v1/users" && options?.method === "POST") return Promise.resolve({ user: users[0] });
    if (path.startsWith("/v1/users/") && options?.method === "PATCH") return Promise.resolve({ user: users[0] });
    return Promise.reject(new Error(`Unexpected users request: ${path}`));
  });
}

describe("UsersTeamsView SAC operations", () => {
  beforeEach(() => {
    apiMock.mockReset();
    installApi();
  });

  it("creates only operational users and requires a team for SAC", async () => {
    const user = userEvent.setup();
    render(<UsersTeamsView />);

    expect(await screen.findByText("Operação e acessos legados")).toBeInTheDocument();
    expect(screen.getAllByText("SAC Atendimento").length).toBeGreaterThan(0);
    expect(screen.getAllByText("VENDEDOR (legado)").length).toBeGreaterThan(0);

    const form = screen.getByRole("heading", { name: "Criar usuário operacional" }).closest("form");
    expect(form).not.toBeNull();
    const createForm = within(form as HTMLFormElement);
    expect(createForm.queryByRole("option", { name: /VENDEDOR/ })).not.toBeInTheDocument();
    await user.type(createForm.getByLabelText("Nome"), "Carla SAC");
    await user.type(createForm.getByLabelText("Email"), "carla@example.test");
    await user.type(createForm.getByLabelText("Senha inicial"), "Rastro#2026");
    await user.selectOptions(createForm.getByLabelText("Time SAC"), "team-2");
    await user.click(createForm.getByRole("button", { name: "Criar usuário" }));

    expect(apiMock).toHaveBeenCalledWith("/v1/users", expect.objectContaining({
      method: "POST",
      body: JSON.stringify({
        name: "Carla SAC",
        email: "carla@example.test",
        phone: null,
        password: "Rastro#2026",
        role: "SAC",
        supportTeamId: "team-2"
      })
    }));
  });

  it("shows dated membership history and sends an explicit team change", async () => {
    const user = userEvent.setup();
    render(<UsersTeamsView />);
    const row = (await screen.findByText(/Ana SAC/)).closest("tr");
    expect(row).not.toBeNull();
    await user.click(within(row as HTMLTableRowElement).getByRole("button", { name: "Editar" }));

    expect(screen.getByText("Histórico de times")).toBeInTheDocument();
    expect(screen.getByText(/SAC Retenção:/)).toBeInTheDocument();
    const editForm = screen.getByRole("heading", { name: "Editar usuário" }).closest("form");
    expect(editForm).not.toBeNull();
    await user.selectOptions(within(editForm as HTMLFormElement).getByLabelText("Time SAC"), "team-2");
    await user.click(within(editForm as HTMLFormElement).getByRole("button", { name: "Salvar usuário" }));

    const updateCall = apiMock.mock.calls.find(([path, options]) => path === "/v1/users/sac-1" && (options as RequestInit)?.method === "PATCH");
    expect(updateCall).toBeDefined();
    expect(JSON.parse((updateCall?.[1] as RequestInit).body as string)).toMatchObject({ role: "SAC", supportTeamId: "team-2" });
  });
});
