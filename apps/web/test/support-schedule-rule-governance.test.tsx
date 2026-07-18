import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SupportScheduleRuleGovernance } from "../src/components/support-schedule-rule-governance";
import type {
  SupportSchedulePlanningResponse,
  SupportScheduleRuleDraft,
  SupportScheduleRuleFields
} from "../src/support-scheduling";

const apiMock = vi.fn();
vi.mock("../src/api", () => ({ api: (...args: unknown[]) => apiMock(...args) }));

const checksum1 = "a".repeat(64);
const checksum2 = "b".repeat(64);
const checksum3 = "c".repeat(64);

const ruleFields: SupportScheduleRuleFields = {
  timezone: "America/Sao_Paulo",
  maxDailyMinutes: 540,
  maxWeeklyMinutes: 2700,
  minimumRestMinutes: 660,
  minimumNoticeMinutes: 120,
  maxMonthlyExchanges: 8,
  autoApproveEligibleSwaps: true,
  requireManagerExtraApproval: true,
  effectiveFrom: "2026-08-01T03:00:00.000Z",
  effectiveTo: null
};

const existingDraft: SupportScheduleRuleDraft = {
  ...ruleFields,
  id: "draft-existing",
  teamId: "team-1",
  status: "DRAFT",
  revision: 4,
  baseVersionId: "rule-1",
  normalizedPayloadJson: JSON.stringify(ruleFields),
  checksum: "d".repeat(64),
  publishedVersionId: null,
  archivedAt: null,
  updatedAt: "2026-07-18T12:00:00.000Z"
};

const planning: SupportSchedulePlanningResponse = {
  teamId: "team-1",
  rules: [{
    id: "rule-1",
    teamId: "team-1",
    version: 1,
    timezone: ruleFields.timezone,
    maxDailyMinutes: 480,
    maxWeeklyMinutes: 2400,
    minimumRestMinutes: ruleFields.minimumRestMinutes,
    minimumNoticeMinutes: ruleFields.minimumNoticeMinutes,
    maxMonthlyExchanges: ruleFields.maxMonthlyExchanges,
    autoApproveEligibleSwaps: ruleFields.autoApproveEligibleSwaps,
    requireManagerExtraApproval: ruleFields.requireManagerExtraApproval,
    effectiveFrom: "2025-01-01T03:00:00.000Z",
    effectiveTo: null
  }],
  ruleDrafts: [existingDraft],
  archivedRuleVersions: [{
    id: "rule-archived",
    teamId: "team-1",
    version: 0,
    timezone: ruleFields.timezone,
    maxDailyMinutes: 420,
    maxWeeklyMinutes: 2100,
    minimumRestMinutes: ruleFields.minimumRestMinutes,
    minimumNoticeMinutes: ruleFields.minimumNoticeMinutes,
    maxMonthlyExchanges: ruleFields.maxMonthlyExchanges,
    autoApproveEligibleSwaps: false,
    requireManagerExtraApproval: true,
    effectiveFrom: "2024-01-01T03:00:00.000Z",
    effectiveTo: "2025-01-01T03:00:00.000Z"
  }],
  patterns: [],
  assignments: []
};

function draftResult(draft: SupportScheduleRuleDraft) {
  return { draft, payload: ruleFields, checksum: draft.checksum };
}

describe("SupportScheduleRuleGovernance", () => {
  let createdDraft: SupportScheduleRuleDraft;

  beforeEach(() => {
    createdDraft = {
      ...ruleFields,
      id: "draft-created",
      teamId: "team-1",
      status: "DRAFT",
      revision: 1,
      baseVersionId: "rule-1",
      normalizedPayloadJson: JSON.stringify(ruleFields),
      checksum: checksum1,
      publishedVersionId: null,
      archivedAt: null,
      updatedAt: "2026-07-18T13:00:00.000Z"
    };
    apiMock.mockReset();
    apiMock.mockImplementation((path: string, options?: RequestInit) => {
      const body = options?.body ? JSON.parse(String(options.body)) : {};
      if (path === "/v1/support/schedules/rule-drafts" && options?.method === "POST") {
        createdDraft = { ...createdDraft, ...body, baseVersionId: body.baseVersionId };
        return Promise.resolve(draftResult(createdDraft));
      }
      if (path === `/v1/support/schedules/rule-drafts/${createdDraft.id}` && options?.method === "PATCH") {
        const revision = body.expectedRevision + 1;
        createdDraft = {
          ...createdDraft,
          ...body,
          revision,
          checksum: revision === 2 ? checksum2 : checksum3,
          updatedAt: "2026-07-18T14:00:00.000Z"
        };
        delete (createdDraft as SupportScheduleRuleDraft & { expectedRevision?: number }).expectedRevision;
        return Promise.resolve(draftResult(createdDraft));
      }
      if (path === `/v1/support/schedules/rule-drafts/${createdDraft.id}/preview`) {
        return Promise.resolve({
          draftId: createdDraft.id,
          revision: createdDraft.revision,
          payload: ruleFields,
          normalizedPayloadJson: createdDraft.normalizedPayloadJson,
          checksum: createdDraft.checksum,
          diff: {
            base: {
              versionId: "rule-1",
              changedKeys: ["maxDailyMinutes"],
              changes: { maxDailyMinutes: { before: 480, after: createdDraft.maxDailyMinutes } }
            },
            latest: {
              versionId: "rule-1",
              changedKeys: ["maxDailyMinutes"],
              changes: { maxDailyMinutes: { before: 480, after: createdDraft.maxDailyMinutes } }
            }
          },
          window: { from: body.from, to: body.to, effectiveFrom: "2026-08-01", effectiveTo: null },
          materialization: {
            candidates: 12,
            conflicts: [{ assignmentId: "assignment-1", localDate: "2026-08-03", reason: "Descanso mínimo" }],
            createdCount: 10,
            updatedCount: 0,
            reusedCount: 1,
            preservedCount: 0,
            dryRun: true
          }
        });
      }
      if (path === `/v1/support/schedules/rule-drafts/${createdDraft.id}/publish`) {
        const publishedDraft = {
          ...createdDraft,
          status: "PUBLISHED",
          publishedVersionId: "rule-2"
        };
        return Promise.resolve({
          ...draftResult(publishedDraft),
          rule: { ...planning.rules[0], id: "rule-2", version: 2 },
          snapshot: { ...ruleFields, id: "rule-2", teamId: "team-1", version: 2 },
          idempotent: false
        });
      }
      if (path === `/v1/support/schedules/rule-drafts/${existingDraft.id}/archive`) {
        return Promise.resolve(draftResult({
          ...existingDraft,
          status: "ARCHIVED",
          revision: existingDraft.revision + 1,
          archivedAt: "2026-07-18T15:00:00.000Z"
        }));
      }
      return Promise.resolve({});
    });
  });

  it("runs create, CAS edit, preview, invalidation, publish and archive through governed endpoints", async () => {
    const user = userEvent.setup();
    const onPlanningChanged = vi.fn().mockResolvedValue(undefined);
    render(
      <SupportScheduleRuleGovernance
        teamId="team-1"
        teamName="Atendimento"
        planning={planning}
        onPlanningChanged={onPlanningChanged}
      />
    );

    const publishButton = screen.getByRole("button", { name: "Publicar regra" });
    expect(publishButton).toBeDisabled();
    expect(screen.getByRole("table", { name: "Versões de regras" })).toHaveTextContent("Arquivada");

    await user.click(screen.getByRole("button", { name: "Salvar rascunho" }));
    await waitFor(() => expect(apiMock).toHaveBeenCalledWith(
      "/v1/support/schedules/rule-drafts",
      expect.objectContaining({ method: "POST", body: expect.stringContaining('"baseVersionId":"rule-1"') })
    ));
    expect(screen.getByText("Rascunho · r1")).toBeInTheDocument();
    expect(publishButton).toBeDisabled();

    const maxDaily = screen.getByLabelText("Máximo diário (min)");
    await user.clear(maxDaily);
    await user.type(maxDaily, "600");
    expect(screen.getByRole("button", { name: "Gerar prévia da regra" })).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "Salvar rascunho" }));
    await waitFor(() => expect(apiMock).toHaveBeenCalledWith(
      `/v1/support/schedules/rule-drafts/${createdDraft.id}`,
      expect.objectContaining({ method: "PATCH", body: expect.stringContaining('"expectedRevision":1') })
    ));

    await user.click(screen.getByRole("button", { name: "Gerar prévia da regra" }));
    await waitFor(() => expect(apiMock).toHaveBeenCalledWith(
      `/v1/support/schedules/rule-drafts/${createdDraft.id}/preview`,
      expect.objectContaining({ body: expect.stringContaining(`"checksum":"${checksum2}"`) })
    ));
    expect(screen.getByRole("table", { name: "Alterações em relação à regra base" })).toHaveTextContent("Máximo diário");
    expect(screen.getByText(/Descanso mínimo/, { selector: "li" })).toBeInTheDocument();
    expect(publishButton).toBeEnabled();

    const maxWeekly = screen.getByLabelText("Máximo semanal (min)");
    await user.clear(maxWeekly);
    await user.type(maxWeekly, "3000");
    expect(publishButton).toBeDisabled();
    expect(screen.queryByRole("table", { name: "Alterações em relação à regra base" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Salvar rascunho" }));
    await user.click(screen.getByRole("button", { name: "Gerar prévia da regra" }));
    await waitFor(() => expect(publishButton).toBeEnabled());
    await user.click(publishButton);
    await waitFor(() => expect(apiMock).toHaveBeenCalledWith(
      `/v1/support/schedules/rule-drafts/${createdDraft.id}/publish`,
      { method: "POST", body: JSON.stringify({ expectedRevision: 3, checksum: checksum3 }) }
    ));
    expect(await screen.findByText("Regra v2 publicada.")).toBeInTheDocument();

    const draftsTable = screen.getByRole("table", { name: "Rascunhos de regras" });
    const existingRow = within(draftsTable).getByText("revisão 4").closest("tr")!;
    await user.click(within(existingRow).getByRole("button", { name: "Arquivar" }));
    await user.click(within(existingRow).getByRole("button", { name: "Confirmar arquivamento" }));
    await waitFor(() => expect(apiMock).toHaveBeenCalledWith(
      `/v1/support/schedules/rule-drafts/${existingDraft.id}/archive`,
      { method: "POST", body: JSON.stringify({ expectedRevision: 4 }) }
    ));

    expect(apiMock.mock.calls.some(([path]) => path === "/v1/support/schedules/rules")).toBe(false);
  });

  it("shows a stale warning when a CAS save conflicts", async () => {
    apiMock.mockImplementation((path: string) => {
      if (path === `/v1/support/schedules/rule-drafts/${existingDraft.id}`) {
        return Promise.reject(new Error("A operação conflita com o estado atual da Escala."));
      }
      return Promise.resolve({});
    });
    const user = userEvent.setup();
    render(
      <SupportScheduleRuleGovernance
        teamId="team-1"
        teamName="Atendimento"
        planning={planning}
        onPlanningChanged={vi.fn().mockResolvedValue(undefined)}
      />
    );

    const draftsTable = screen.getByRole("table", { name: "Rascunhos de regras" });
    await user.click(within(draftsTable).getByRole("button", { name: "Editar" }));
    await user.clear(screen.getByLabelText("Máximo diário (min)"));
    await user.type(screen.getByLabelText("Máximo diário (min)"), "600");
    await user.click(screen.getByRole("button", { name: "Salvar rascunho" }));

    expect(await screen.findByText("Este rascunho mudou em outra sessão. Recarregue o planejamento antes de continuar.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Recarregar planejamento" })).toBeInTheDocument();
  });
});
