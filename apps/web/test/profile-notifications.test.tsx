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

function setupApi() {
  apiMock.mockImplementation((path: string, options?: { method?: string }) => {
    if (path === "/v1/profile") return Promise.resolve({ profile });
    return Promise.reject(new Error(`Unexpected API call: ${options?.method ?? "GET"} ${path}`));
  });
}

describe("ProfileView identity", () => {
  beforeEach(() => setupApi());

  it("loads only profile identity without consulting notifications", async () => {
    render(<ProfileView user={user} onProfileSaved={vi.fn()} />);

    expect(await screen.findByRole("heading", { name: "Dados do perfil" })).toBeInTheDocument();
    expect(screen.getByLabelText("Nome")).toHaveValue(profile.name);
    expect(screen.getByText(profile.email)).toBeInTheDocument();
    expect(screen.getByText(profile.organization.name)).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Histórico" })).not.toBeInTheDocument();
    expect(screen.queryByText("Notificações")).not.toBeInTheDocument();
    expect(apiMock).toHaveBeenCalledTimes(1);
    expect(apiMock).toHaveBeenCalledWith("/v1/profile");
    expect(apiMock.mock.calls.some(([path]) => String(path).includes("in-app-notifications"))).toBe(false);
  });

  it("edits identity and updates the current user", async () => {
    const updatedProfile = {
      ...profile,
      name: "Ana Lima",
      phone: "+55 83 98888-7777",
      avatarUrl: "https://example.com/ana.png"
    };
    apiMock.mockImplementation((path: string, options?: { method?: string }) => {
      if (path === "/v1/profile" && options?.method === "PATCH") return Promise.resolve({ profile: updatedProfile });
      if (path === "/v1/profile") return Promise.resolve({ profile });
      return Promise.reject(new Error(`Unexpected API call: ${options?.method ?? "GET"} ${path}`));
    });
    const userActions = userEvent.setup();
    const onProfileSaved = vi.fn();
    render(<ProfileView user={user} onProfileSaved={onProfileSaved} />);

    const nameInput = await screen.findByLabelText("Nome");
    await userActions.clear(nameInput);
    await userActions.type(nameInput, updatedProfile.name);
    await userActions.type(screen.getByLabelText("Telefone"), updatedProfile.phone);
    await userActions.type(screen.getByLabelText("Avatar URL"), updatedProfile.avatarUrl);
    await userActions.click(screen.getByRole("button", { name: "Salvar perfil" }));

    await waitFor(() => expect(apiMock).toHaveBeenCalledWith("/v1/profile", {
      method: "PATCH",
      body: JSON.stringify({
        name: updatedProfile.name,
        phone: updatedProfile.phone,
        avatarUrl: updatedProfile.avatarUrl
      })
    }));
    expect(await screen.findByText("Perfil atualizado.")).toBeInTheDocument();
    expect(onProfileSaved).toHaveBeenCalledWith({
      ...user,
      name: updatedProfile.name,
      avatarUrl: updatedProfile.avatarUrl
    });
    expect(apiMock.mock.calls.some(([path]) => String(path).includes("in-app-notifications"))).toBe(false);
  });
});
