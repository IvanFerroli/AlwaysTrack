import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { CurrentUser } from "@alwaystrack/shared";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SupportPausesView } from "../src/views/support-pauses";
import { expectNoCriticalAccessibilityViolations } from "./accessibility-assertions";

const apiMock = vi.fn();
vi.mock("../src/api", () => ({ api: (...args: unknown[]) => apiMock(...args) }));

const sac: CurrentUser = {
  id: "sac-1", name: "Ana", email: "ana@example.com", role: "SAC", organizationId: "org-1", unitScopeIds: [], sectorScopeIds: []
};
const manager: CurrentUser = { ...sac, id: "manager-1", name: "Gestora", role: "GESTOR" };

const agentAna = { id: "sac-1", name: "Ana", email: "ana@example.com" };
const agentBruno = { id: "sac-2", name: "Bruno", email: "bruno@example.com" };
const baseSlot = {
  organizationId: "org-1", label: "Pausa", capacity: 2, active: true, bookedCount: 1, remainingCapacity: 1
};
const bookingAna = { id: "booking-a", slotId: "slot-a", userId: "sac-1", status: "BOOKED", user: agentAna };
const bookingBruno = { id: "booking-b", slotId: "slot-b", userId: "sac-2", status: "BOOKED", user: agentBruno };
const slotA = { ...baseSlot, id: "slot-a", label: "Almoço", startsAt: "2026-07-17T15:00:00.000Z", endsAt: "2026-07-17T15:15:00.000Z", bookings: [bookingAna], myBooking: bookingAna };
const slotB = { ...baseSlot, id: "slot-b", label: "Café", startsAt: "2026-07-17T15:30:00.000Z", endsAt: "2026-07-17T15:45:00.000Z", bookings: [bookingBruno], myBooking: null };

const pauseResponse = {
  date: "2026-07-17",
  canManage: false,
  teams: [],
  selectedTeamId: null,
  membershipMode: "ROLE_FALLBACK",
  policy: { id: "policy-1", organizationId: "org-1", timezone: "America/Sao_Paulo", minimumCoverage: 2, slotMinutes: 15, active: true },
  agents: [agentAna, agentBruno, { id: "sac-3", name: "Carla", email: "carla@example.com" }],
  summary: { activeAgents: 3, minimumCoverage: 2, bookedPauses: 2, criticalIntervals: 1 },
  timeline: [{ startsAt: "2026-07-17T15:00:00.000Z", endsAt: "2026-07-17T15:15:00.000Z", pausedCount: 1, availableCount: 2, critical: true }],
  slots: [slotA, slotB],
  swaps: [
    {
      id: "swap-1", status: "PENDING", note: "Consulta médica", requestedById: "sac-2", requestedBy: agentBruno, decidedBy: null,
      requesterBooking: { ...bookingBruno, slot: slotB }, targetBooking: { ...bookingAna, slot: slotA },
      expiresAt: "2026-07-17T15:00:00.000Z", createdAt: "2026-07-17T10:00:00.000Z", updatedAt: "2026-07-17T10:00:00.000Z"
    },
    {
      id: "swap-2", status: "PENDING", note: null, requestedById: "sac-1", requestedBy: agentAna, decidedBy: null,
      requesterBooking: { ...bookingAna, slot: slotA }, targetBooking: { ...bookingBruno, slot: slotB },
      expiresAt: "2026-07-17T15:00:00.000Z", createdAt: "2026-07-17T10:05:00.000Z", updatedAt: "2026-07-17T10:05:00.000Z"
    }
  ]
};

describe("SupportPausesView", () => {
  beforeEach(() => {
    apiMock.mockImplementation((path: string) => Promise.resolve(path.startsWith("/v1/support/pauses?") ? pauseResponse : {}));
  });

  it("renders an accessible overlap timeline and personal pause actions for SAC", async () => {
    const user = userEvent.setup();
    const { container } = render(<SupportPausesView user={sac} />);

    expect(await screen.findByRole("heading", { name: "Pausas e cobertura" })).toBeInTheDocument();
    expect(screen.getByLabelText(/12:00 a 12:15: 2 disponíveis, 1 em pausa, cobertura crítica/)).toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: "Configuração" })).not.toBeInTheDocument();
    expect(screen.queryByText("Política de pausas")).not.toBeInTheDocument();
    expectNoCriticalAccessibilityViolations(container);

    await user.click(screen.getByRole("button", { name: "Escolher pausa" }));
    await waitFor(() => expect(apiMock).toHaveBeenCalledWith("/v1/support/pauses/slots/slot-b/book", { method: "POST", body: "{}" }));

    await user.click(screen.getByRole("button", { name: "Cancelar pausa" }));
    await user.click(screen.getByRole("button", { name: "Confirmar cancelamento" }));
    await waitFor(() => expect(apiMock).toHaveBeenCalledWith("/v1/support/pauses/bookings/booking-a", { method: "DELETE", body: "{}" }));
  });

  it("lets the target SAC accept a swap without exposing manager mutations", async () => {
    const user = userEvent.setup();
    render(<SupportPausesView user={sac} />);
    await screen.findByRole("heading", { name: "Pausas e cobertura" });

    await user.click(screen.getByRole("tab", { name: "Trocas" }));
    const table = screen.getByRole("table", { name: "Trocas de pausa" });
    expect(within(table).getByText("Consulta médica")).toBeInTheDocument();
    await user.click(within(table).getByRole("button", { name: "Aceitar" }));

    await waitFor(() => expect(apiMock).toHaveBeenCalledWith("/v1/support/pauses/swaps/swap-1/decision", {
      method: "POST",
      body: JSON.stringify({ decision: "ACCEPTED" })
    }));

    await user.click(within(table).getByRole("button", { name: "Cancelar" }));
    await waitFor(() => expect(apiMock).toHaveBeenCalledWith("/v1/support/pauses/swaps/swap-2", { method: "DELETE" }));
  });

  it("exposes policy and slot administration only to managers", async () => {
    const user = userEvent.setup();
    render(<SupportPausesView user={manager} />);
    await screen.findByRole("heading", { name: "Pausas e cobertura" });

    await user.click(screen.getByRole("tab", { name: "Configuração" }));
    const policy = screen.getByRole("heading", { name: "Política de pausas" }).closest("section")!;
    await user.clear(within(policy).getByLabelText("Cobertura mínima"));
    await user.type(within(policy).getByLabelText("Cobertura mínima"), "3");
    await user.click(within(policy).getByRole("button", { name: "Salvar política" }));
    await waitFor(() => expect(apiMock).toHaveBeenCalledWith("/v1/support/pauses/policy", expect.objectContaining({ method: "PUT", body: expect.stringContaining('"minimumCoverage":3') })));

    const slot = screen.getByRole("heading", { name: "Criar slot" }).closest("section")!;
    await user.clear(within(slot).getByLabelText("Identificação"));
    await user.type(within(slot).getByLabelText("Identificação"), "Reforço tarde");
    await user.click(within(slot).getByRole("button", { name: "Criar slot" }));
    await waitFor(() => expect(apiMock).toHaveBeenCalledWith("/v1/support/pauses/slots", expect.objectContaining({ method: "POST", body: expect.stringContaining('"label":"Reforço tarde"') })));

    const override = screen.getByRole("heading", { name: "Autorizar pausa fora da política" }).closest("section")!;
    await user.selectOptions(within(override).getByLabelText("Atendente"), "sac-2");
    await user.selectOptions(within(override).getByLabelText("Slot"), "slot-a");
    await user.type(within(override).getByLabelText("Motivo"), "Cobertura excepcional aprovada");
    await user.click(within(override).getByLabelText("Confirmo o impacto sobre capacidade ou cobertura mínima"));
    await user.click(within(override).getByRole("button", { name: "Registrar exceção" }));
    await waitFor(() => expect(apiMock).toHaveBeenCalledWith("/v1/support/pauses/slots/slot-a/book", {
      method: "POST",
      body: JSON.stringify({
        userId: "sac-2",
        overrideCoverage: true,
        overrideReason: "Cobertura excepcional aprovada",
        confirmImpact: true
      })
    }));
  });
});
