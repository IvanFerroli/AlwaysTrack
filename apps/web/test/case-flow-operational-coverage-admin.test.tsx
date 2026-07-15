import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CaseFlowAdminView } from "../src/views/case-flow/admin";

const apiMock = vi.fn();

vi.mock("../src/api", () => ({ api: (...args: unknown[]) => apiMock(...args) }));

const cases = {
  items: [
    {
      id: "case-complete",
      status: "RESOLVED",
      summary: "Cliente sem acesso",
      updatedAt: "2026-07-15T12:00:00.000Z",
      conflicts: [{ status: "OPEN" }, { status: "OPEN" }, { status: "CLOSED" }],
      connectorRuns: [{ status: "SUCCEEDED" }, { status: "FAILED" }]
    }
  ]
};

const rules = {
  latest: [
    { id: "rule-1", code: "ACCESS", version: 3, active: true, priority: 10, flowId: "flow-access" },
    { id: "rule-2", code: "BILLING", version: 1, active: false, priority: 20, flowId: "flow-billing" }
  ]
};

const connectors = [
  {
    id: "connector-1",
    connectorId: "tracking",
    displayName: "Rastreio",
    version: "2.1.0",
    riskLevel: "MEDIUM",
    enabled: true,
    lastValidatedAt: "2026-07-15T11:00:00.000Z",
    health: { state: "HEALTHY", checkedAt: "2026-07-15T11:00:00.000Z" },
    domains: [],
    capabilities: []
  }
];

function adminResponse(path: string) {
  if (path.endsWith("/cases")) return Promise.resolve(cases);
  if (path.endsWith("/rules")) return Promise.resolve(rules);
  if (path.endsWith("/connectors")) return Promise.resolve(connectors);
  return Promise.resolve({});
}

describe("CaseFlowAdminView operational coverage", () => {
  beforeEach(() => {
    apiMock.mockImplementation(adminResponse);
  });

  it("disables refresh while loading and renders an empty operational state", async () => {
    let resolveCases!: (value: { items: never[] }) => void;
    let resolveRules!: (value: { latest: never[] }) => void;
    let resolveConnectors!: (value: never[]) => void;
    apiMock
      .mockImplementationOnce(() => new Promise((resolve) => { resolveCases = resolve; }))
      .mockImplementationOnce(() => new Promise((resolve) => { resolveRules = resolve; }))
      .mockImplementationOnce(() => new Promise((resolve) => { resolveConnectors = resolve; }));
    render(<CaseFlowAdminView />);

    expect(screen.getByRole("button", { name: "Atualizar dados" })).toBeDisabled();
    resolveCases({ items: [] });
    resolveRules({ latest: [] });
    resolveConnectors([]);

    const table = await screen.findByRole("table", { name: "Histórico de casos" });
    expect(within(table).queryAllByRole("row")).toHaveLength(1);
    expect(screen.getByRole("button", { name: "Atualizar dados" })).toBeEnabled();
  });

  it("retries a failed load and exposes complete history and rule states", async () => {
    apiMock.mockRejectedValueOnce(new Error("Admin temporariamente indisponível."));
    const user = userEvent.setup();
    render(<CaseFlowAdminView />);

    expect(await screen.findByRole("alert")).toHaveTextContent("Admin temporariamente indisponível.");
    apiMock.mockImplementation(adminResponse);
    await user.click(screen.getByRole("button", { name: "Atualizar dados" }));

    const history = await screen.findByRole("table", { name: "Histórico de casos" });
    expect(history).toHaveTextContent("Cliente sem acesso");
    expect(history).toHaveTextContent("2");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "Regras" }));
    const ruleTable = screen.getByRole("table", { name: "Regras CaseFlow" });
    expect(ruleTable).toHaveTextContent("ACCESS");
    expect(ruleTable).toHaveTextContent("Ativa");
    expect(ruleTable).toHaveTextContent("Inativa");
  });

  it("surfaces fallback load and degraded connector update failures", async () => {
    apiMock.mockRejectedValueOnce("offline");
    const user = userEvent.setup();
    const first = render(<CaseFlowAdminView />);
    expect(await screen.findByRole("alert")).toHaveTextContent("Falha ao carregar administração CaseFlow.");
    first.unmount();

    apiMock.mockReset();
    apiMock.mockImplementation(adminResponse);
    render(<CaseFlowAdminView />);
    await screen.findByText("case-complete");
    await user.click(screen.getByRole("tab", { name: "Conectores" }));
    apiMock.mockRejectedValueOnce("patch recusado");
    await user.selectOptions(screen.getByRole("combobox", { name: "Estado de Rastreio" }), "DEGRADED");

    expect(await screen.findByRole("alert")).toHaveTextContent("Falha ao atualizar conector.");
    expect(screen.getByRole("combobox", { name: "Estado de Rastreio" })).toBeEnabled();
    expect(apiMock).toHaveBeenCalledWith(
      "/v1/case-flow/admin/connectors/connector-1",
      { method: "PATCH", body: JSON.stringify({ healthState: "DEGRADED", validated: true }) }
    );
  });

  it("exports a redacted JSON envelope and completes an additive restore", async () => {
    const user = userEvent.setup();
    const createObjectURL = vi.fn(() => "blob:caseflow-backup");
    const revokeObjectURL = vi.fn();
    vi.stubGlobal("URL", { ...URL, createObjectURL, revokeObjectURL });
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);
    apiMock.mockImplementation((path: string) => {
      if (path.endsWith("/config/export")) return Promise.resolve({ version: 1, rules: [] });
      if (path.endsWith("/config/restore")) return Promise.resolve({ mode: "ADDITIVE", restoreId: "restore-42" });
      return adminResponse(path);
    });
    render(<CaseFlowAdminView />);
    await screen.findByText("case-complete");
    await user.click(screen.getByRole("tab", { name: "Backup" }));

    await user.click(screen.getByRole("button", { name: "Exportar JSON" }));
    await waitFor(() => expect(createObjectURL).toHaveBeenCalledWith(expect.any(Blob)));
    expect(click).toHaveBeenCalledOnce();
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:caseflow-backup");

    const textarea = screen.getByRole("textbox", { name: "Envelope de backup" });
    const restoreButton = screen.getByRole("button", { name: "Criar novas versões" });
    expect(restoreButton).toBeDisabled();
    fireEvent.change(textarea, { target: { value: JSON.stringify({ version: 1 }) } });
    await user.click(restoreButton);

    expect(await screen.findByRole("status")).toHaveTextContent("Restore additive registrado: restore-42");
    expect(textarea).toHaveValue("");
    expect(apiMock).toHaveBeenCalledWith(
      "/v1/case-flow/admin/config/restore",
      { method: "POST", body: JSON.stringify({ version: 1 }) }
    );
  });

  it("rejects malformed restore input and clears the prior notice", async () => {
    const user = userEvent.setup();
    apiMock.mockImplementation((path: string) => path.endsWith("/config/restore")
      ? Promise.resolve({ mode: "ADDITIVE", restoreId: "restore-first" })
      : adminResponse(path));
    render(<CaseFlowAdminView />);
    await screen.findByText("case-complete");
    await user.click(screen.getByRole("tab", { name: "Backup" }));
    const textarea = screen.getByRole("textbox", { name: "Envelope de backup" });

    fireEvent.change(textarea, { target: { value: "{}" } });
    await user.click(screen.getByRole("button", { name: "Criar novas versões" }));
    expect(await screen.findByRole("status")).toHaveTextContent("restore-first");

    fireEvent.change(textarea, { target: { value: "not-json" } });
    await user.click(screen.getByRole("button", { name: "Criar novas versões" }));
    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Criar novas versões" })).toBeEnabled();
  });
});
