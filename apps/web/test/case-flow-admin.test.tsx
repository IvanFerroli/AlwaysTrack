import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CaseFlowAdminView } from "../src/views/case-flow/admin";

const apiMock = vi.fn();

vi.mock("../src/api", () => ({ api: (...args: unknown[]) => apiMock(...args) }));

function successfulResponse(path: string) {
  if (path === "/v1/case-flow/admin/cases") {
    return { items: [{ id: "case-1", status: "OPEN", summary: null, updatedAt: "2026-07-15T12:00:00.000Z", conflicts: [{ status: "OPEN" }], connectorRuns: [] }] };
  }
  if (path === "/v1/case-flow/admin/rules") return { latest: [] };
  if (path === "/v1/case-flow/admin/connectors") {
    return [{ id: "connector-1", connectorId: "tracking", displayName: "Rastreio", version: "1", riskLevel: "LOW", enabled: true, lastValidatedAt: null, health: null, domains: [], capabilities: [] }];
  }
  return {};
}

describe("CaseFlowAdminView", () => {
  beforeEach(() => {
    apiMock.mockImplementation((path: string) => Promise.resolve(successfulResponse(path)));
  });

  it("loads redacted history and updates connector health through the admin flow", async () => {
    const user = userEvent.setup();
    render(<CaseFlowAdminView />);

    expect(await screen.findByText("case-1")).toBeInTheDocument();
    expect(screen.getByText("Sem resumo")).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "Conectores" }));
    await user.selectOptions(screen.getByRole("combobox", { name: "Estado de Rastreio" }), "HEALTHY");

    await waitFor(() => expect(apiMock).toHaveBeenCalledWith(
      "/v1/case-flow/admin/connectors/connector-1",
      { method: "PATCH", body: JSON.stringify({ healthState: "HEALTHY", validated: true }) }
    ));
    expect(apiMock.mock.calls.filter(([path]) => path === "/v1/case-flow/admin/cases")).toHaveLength(2);
  });

  it("shows an accessible error when the admin APIs fail", async () => {
    apiMock.mockRejectedValue(new Error("CaseFlow indisponível."));
    render(<CaseFlowAdminView />);

    expect(await screen.findByText("CaseFlow indisponível.")).toBeInTheDocument();
    expect(screen.getByText("CaseFlow indisponível.").closest("p")).toHaveClass("error");
  });
});
