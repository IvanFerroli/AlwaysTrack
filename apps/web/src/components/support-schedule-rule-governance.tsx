import {
  Archive,
  Eye,
  FilePlus2,
  Pencil,
  RefreshCw,
  Save,
  Send
} from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { api } from "../api";
import {
  SUPPORT_SCHEDULE_TIMEZONE,
  shiftSupportScheduleDate,
  supportScheduleDate,
  supportScheduleLocalDateTimeIso,
  supportScheduleLocalDateTimeValue,
  type SupportSchedulePlanningResponse,
  type SupportScheduleRuleDiffSet,
  type SupportScheduleRuleDraft,
  type SupportScheduleRuleDraftResult,
  type SupportScheduleRuleFields,
  type SupportScheduleRulePreview,
  type SupportScheduleRulePublishResult,
  type SupportScheduleRuleValue,
  type SupportScheduleRuleVersion
} from "../support-scheduling";
import { ConfirmButton, OperationalState } from "./operational";

const RULE_PREVIEW_MAX_DAYS = 62;

interface RuleFormState {
  timezone: string;
  effectiveFrom: string;
  effectiveTo: string;
  maxDailyMinutes: string;
  maxWeeklyMinutes: string;
  minimumRestMinutes: string;
  minimumNoticeMinutes: string;
  maxMonthlyExchanges: string;
  autoApproveEligibleSwaps: boolean;
  requireManagerExtraApproval: boolean;
}

interface SupportScheduleRuleGovernanceProps {
  teamId: string;
  teamName?: string;
  planning: SupportSchedulePlanningResponse | null;
  onPlanningChanged: () => Promise<void>;
}

const ruleFieldLabels: Record<string, string> = {
  timezone: "Fuso horário",
  effectiveFrom: "Vigência inicial",
  effectiveTo: "Vigência final",
  maxDailyMinutes: "Máximo diário",
  maxWeeklyMinutes: "Máximo semanal",
  minimumRestMinutes: "Descanso mínimo",
  minimumNoticeMinutes: "Antecedência mínima",
  maxMonthlyExchanges: "Trocas mensais",
  autoApproveEligibleSwaps: "Aprovação automática de trocas",
  requireManagerExtraApproval: "Aprovação gerencial de extras"
};

const draftStatusLabels: Record<string, string> = {
  DRAFT: "Rascunho",
  PUBLISHED: "Publicado",
  ARCHIVED: "Arquivado"
};

function tomorrowDateTime() {
  return `${shiftSupportScheduleDate(supportScheduleDate(), 1)}T00:00`;
}

function emptyRuleForm(timezone = SUPPORT_SCHEDULE_TIMEZONE): RuleFormState {
  return {
    timezone,
    effectiveFrom: tomorrowDateTime(),
    effectiveTo: "",
    maxDailyMinutes: "540",
    maxWeeklyMinutes: "2700",
    minimumRestMinutes: "660",
    minimumNoticeMinutes: "120",
    maxMonthlyExchanges: "8",
    autoApproveEligibleSwaps: true,
    requireManagerExtraApproval: true
  };
}

function newRuleForm(base: SupportScheduleRuleVersion | undefined): RuleFormState {
  if (!base) return emptyRuleForm();
  return {
    timezone: base.timezone,
    effectiveFrom: tomorrowDateTime(),
    effectiveTo: "",
    maxDailyMinutes: String(base.maxDailyMinutes),
    maxWeeklyMinutes: String(base.maxWeeklyMinutes),
    minimumRestMinutes: String(base.minimumRestMinutes),
    minimumNoticeMinutes: String(base.minimumNoticeMinutes),
    maxMonthlyExchanges: String(base.maxMonthlyExchanges),
    autoApproveEligibleSwaps: base.autoApproveEligibleSwaps,
    requireManagerExtraApproval: base.requireManagerExtraApproval
  };
}

function currentRule(rules: SupportScheduleRuleVersion[]) {
  const now = Date.now();
  return rules.find((rule) => {
    const startsAt = new Date(rule.effectiveFrom).getTime();
    const endsAt = rule.effectiveTo ? new Date(rule.effectiveTo).getTime() : Number.POSITIVE_INFINITY;
    return startsAt <= now && endsAt > now;
  }) ?? rules[0];
}

function formFromDraft(draft: SupportScheduleRuleDraft): RuleFormState {
  return {
    timezone: draft.timezone,
    effectiveFrom: supportScheduleLocalDateTimeValue(draft.effectiveFrom, draft.timezone),
    effectiveTo: draft.effectiveTo ? supportScheduleLocalDateTimeValue(draft.effectiveTo, draft.timezone) : "",
    maxDailyMinutes: String(draft.maxDailyMinutes),
    maxWeeklyMinutes: String(draft.maxWeeklyMinutes),
    minimumRestMinutes: String(draft.minimumRestMinutes),
    minimumNoticeMinutes: String(draft.minimumNoticeMinutes),
    maxMonthlyExchanges: String(draft.maxMonthlyExchanges),
    autoApproveEligibleSwaps: draft.autoApproveEligibleSwaps,
    requireManagerExtraApproval: draft.requireManagerExtraApproval
  };
}

function payloadFromForm(form: RuleFormState): SupportScheduleRuleFields {
  return {
    timezone: form.timezone,
    effectiveFrom: supportScheduleLocalDateTimeIso(form.effectiveFrom, form.timezone),
    effectiveTo: form.effectiveTo ? supportScheduleLocalDateTimeIso(form.effectiveTo, form.timezone) : null,
    maxDailyMinutes: Number(form.maxDailyMinutes),
    maxWeeklyMinutes: Number(form.maxWeeklyMinutes),
    minimumRestMinutes: Number(form.minimumRestMinutes),
    minimumNoticeMinutes: Number(form.minimumNoticeMinutes),
    maxMonthlyExchanges: Number(form.maxMonthlyExchanges),
    autoApproveEligibleSwaps: form.autoApproveEligibleSwaps,
    requireManagerExtraApproval: form.requireManagerExtraApproval
  };
}

function caughtMessage(caught: unknown, fallback: string) {
  return caught instanceof Error ? caught.message : fallback;
}

function isCasConflict(caught: unknown) {
  const message = caughtMessage(caught, "").toLocaleLowerCase("pt-BR");
  return ["conflit", "conflict", "stale", "revision", "checksum"].some((term) => message.includes(term));
}

function inclusiveDays(from: string, to: string) {
  const start = new Date(`${from}T12:00:00.000Z`).getTime();
  const end = new Date(`${to}T12:00:00.000Z`).getTime();
  return Math.floor((end - start) / 86_400_000) + 1;
}

function previewWindowForDraft(draft: SupportScheduleRuleDraft) {
  const from = supportScheduleLocalDateTimeValue(draft.effectiveFrom, draft.timezone).slice(0, 10);
  let to = shiftSupportScheduleDate(from, 29);
  if (draft.effectiveTo) {
    const effectiveLastInstant = new Date(new Date(draft.effectiveTo).getTime() - 1).toISOString();
    const effectiveTo = supportScheduleLocalDateTimeValue(effectiveLastInstant, draft.timezone).slice(0, 10);
    if (effectiveTo < to) to = effectiveTo;
  }
  return { from, to };
}

function formatRuleValue(value: SupportScheduleRuleValue, key: string) {
  if (value === null) return "Não definido";
  if (typeof value === "boolean") return value ? "Sim" : "Não";
  if ((key === "effectiveFrom" || key === "effectiveTo") && typeof value === "string") {
    return new Date(value).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
  }
  if (typeof value === "number" && key.toLowerCase().includes("minutes")) return `${value} min`;
  return String(value);
}

function RuleDiff({ title, diff }: { title: string; diff: SupportScheduleRuleDiffSet }) {
  return (
    <div>
      <div className="support-section-heading">
        <div><h3>{title}</h3></div>
        <span className="support-count">{diff.changedKeys.length} alteração(ões)</span>
      </div>
      {diff.changedKeys.length ? (
        <div className="table-scroll">
          <table aria-label={title}>
            <thead><tr><th scope="col">Campo</th><th scope="col">Antes</th><th scope="col">Depois</th></tr></thead>
            <tbody>{diff.changedKeys.map((key) => {
              const change = diff.changes[key];
              return (
                <tr key={key}>
                  <td>{ruleFieldLabels[key] ?? key}</td>
                  <td>{formatRuleValue(change?.before ?? null, key)}</td>
                  <td>{formatRuleValue(change?.after ?? null, key)}</td>
                </tr>
              );
            })}</tbody>
          </table>
        </div>
      ) : <p>Nenhuma alteração em relação à referência.</p>}
    </div>
  );
}

function draftStatusClass(status: string) {
  if (status === "PUBLISHED") return "active";
  if (status === "DRAFT") return "pending";
  return "closed";
}

export function SupportScheduleRuleGovernance({
  teamId,
  teamName,
  planning,
  onPlanningChanged
}: SupportScheduleRuleGovernanceProps) {
  const [initializedTeamId, setInitializedTeamId] = useState("");
  const [baseVersionId, setBaseVersionId] = useState("");
  const [selectedDraft, setSelectedDraft] = useState<SupportScheduleRuleDraft | null>(null);
  const [draftOverrides, setDraftOverrides] = useState<Record<string, SupportScheduleRuleDraft>>({});
  const [form, setForm] = useState<RuleFormState>(() => emptyRuleForm());
  const [dirty, setDirty] = useState(true);
  const [previewWindow, setPreviewWindow] = useState(() => ({
    from: shiftSupportScheduleDate(supportScheduleDate(), 1),
    to: shiftSupportScheduleDate(supportScheduleDate(), 30)
  }));
  const [preview, setPreview] = useState<SupportScheduleRulePreview | null>(null);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [stale, setStale] = useState(false);

  useEffect(() => {
    if (!planning || initializedTeamId === teamId) return;
    const base = currentRule(planning.rules);
    setInitializedTeamId(teamId);
    setBaseVersionId(base?.id ?? "");
    setSelectedDraft(null);
    setDraftOverrides({});
    setForm(newRuleForm(base));
    setDirty(true);
    setPreview(null);
    setError(null);
    setNotice(null);
    setStale(false);
  }, [initializedTeamId, planning, teamId]);

  const visibleDrafts = useMemo(() => {
    const drafts = new Map((planning?.ruleDrafts ?? []).map((draft) => [draft.id, draft]));
    for (const draft of Object.values(draftOverrides)) drafts.set(draft.id, draft);
    if (selectedDraft) drafts.set(selectedDraft.id, selectedDraft);
    return [...drafts.values()].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
  }, [draftOverrides, planning?.ruleDrafts, selectedDraft]);

  const windowError = useMemo(() => {
    if (!previewWindow.from || !previewWindow.to) return "Informe o início e o fim da janela.";
    const days = inclusiveDays(previewWindow.from, previewWindow.to);
    if (days < 1) return "A data final deve ser igual ou posterior à inicial.";
    if (days > RULE_PREVIEW_MAX_DAYS) return `A janela pode ter no máximo ${RULE_PREVIEW_MAX_DAYS} dias.`;
    if (selectedDraft) {
      const effectiveFrom = supportScheduleLocalDateTimeValue(selectedDraft.effectiveFrom, selectedDraft.timezone).slice(0, 10);
      if (previewWindow.from < effectiveFrom) return "A janela deve começar dentro da vigência do rascunho.";
      if (selectedDraft.effectiveTo) {
        const lastInstant = new Date(new Date(selectedDraft.effectiveTo).getTime() - 1).toISOString();
        const effectiveTo = supportScheduleLocalDateTimeValue(lastInstant, selectedDraft.timezone).slice(0, 10);
        if (previewWindow.to > effectiveTo) return "A janela deve terminar dentro da vigência do rascunho.";
      }
    }
    return null;
  }, [previewWindow, selectedDraft]);

  const previewMatchesDraft = Boolean(
    preview
    && selectedDraft
    && !dirty
    && preview.draftId === selectedDraft.id
    && preview.revision === selectedDraft.revision
    && preview.checksum === selectedDraft.checksum
    && preview.window.from === previewWindow.from
    && preview.window.to === previewWindow.to
  );

  function clearFeedback() {
    setError(null);
    setNotice(null);
    setStale(false);
  }

  function changeForm(patch: Partial<RuleFormState>) {
    setForm((current) => ({ ...current, ...patch }));
    setDirty(true);
    setPreview(null);
    setNotice(null);
  }

  function startNewDraft(versionId = currentRule(planning?.rules ?? [])?.id ?? "") {
    const base = planning?.rules.find((rule) => rule.id === versionId);
    setBaseVersionId(versionId);
    setSelectedDraft(null);
    setForm(newRuleForm(base));
    setDirty(true);
    setPreview(null);
    clearFeedback();
  }

  function editDraft(draft: SupportScheduleRuleDraft) {
    setSelectedDraft(draft);
    setBaseVersionId(draft.baseVersionId ?? "");
    setForm(formFromDraft(draft));
    setPreviewWindow(previewWindowForDraft(draft));
    setDirty(false);
    setPreview(null);
    clearFeedback();
  }

  function changePreviewWindow(patch: Partial<typeof previewWindow>) {
    setPreviewWindow((current) => ({ ...current, ...patch }));
    setPreview(null);
    setNotice(null);
  }

  function handleCasFailure(caught: unknown, fallback: string) {
    setError(caughtMessage(caught, fallback));
    if (isCasConflict(caught)) setStale(true);
  }

  async function saveDraft(event: FormEvent) {
    event.preventDefault();
    clearFeedback();
    setBusyAction("save-draft");
    try {
      const payload = payloadFromForm(form);
      const result = selectedDraft
        ? await api<SupportScheduleRuleDraftResult>(`/v1/support/schedules/rule-drafts/${selectedDraft.id}`, {
          method: "PATCH",
          body: JSON.stringify({ expectedRevision: selectedDraft.revision, ...payload })
        })
        : await api<SupportScheduleRuleDraftResult>("/v1/support/schedules/rule-drafts", {
          method: "POST",
          body: JSON.stringify({ teamId, baseVersionId: baseVersionId || null, ...payload })
        });
      setSelectedDraft(result.draft);
      setDraftOverrides((current) => ({ ...current, [result.draft.id]: result.draft }));
      setBaseVersionId(result.draft.baseVersionId ?? "");
      setForm(formFromDraft(result.draft));
      setPreviewWindow(previewWindowForDraft(result.draft));
      setDirty(false);
      setPreview(null);
      setNotice(`Rascunho salvo na revisão ${result.draft.revision}.`);
      await onPlanningChanged();
    } catch (caught) {
      handleCasFailure(caught, "Não foi possível salvar o rascunho.");
    } finally {
      setBusyAction(null);
    }
  }

  async function generatePreview() {
    if (!selectedDraft || dirty || windowError) return;
    clearFeedback();
    setBusyAction("preview-draft");
    try {
      const result = await api<SupportScheduleRulePreview>(`/v1/support/schedules/rule-drafts/${selectedDraft.id}/preview`, {
        method: "POST",
        body: JSON.stringify({
          expectedRevision: selectedDraft.revision,
          checksum: selectedDraft.checksum,
          from: previewWindow.from,
          to: previewWindow.to
        })
      });
      setPreview(result);
      setNotice("Prévia gerada para a revisão atual.");
    } catch (caught) {
      setPreview(null);
      handleCasFailure(caught, "Não foi possível gerar a prévia.");
    } finally {
      setBusyAction(null);
    }
  }

  async function publishDraft() {
    if (!selectedDraft || !previewMatchesDraft) return;
    clearFeedback();
    setBusyAction("publish-draft");
    try {
      const result = await api<SupportScheduleRulePublishResult>(`/v1/support/schedules/rule-drafts/${selectedDraft.id}/publish`, {
        method: "POST",
        body: JSON.stringify({ expectedRevision: selectedDraft.revision, checksum: selectedDraft.checksum })
      });
      const publishedDraft = result.draft;
      setSelectedDraft(publishedDraft);
      setDraftOverrides((current) => ({ ...current, [publishedDraft.id]: publishedDraft }));
      setPreview(null);
      setDirty(false);
      setNotice(result.idempotent ? "Esta revisão já estava publicada." : `Regra v${result.rule.version} publicada.`);
      await onPlanningChanged();
    } catch (caught) {
      handleCasFailure(caught, "Não foi possível publicar o rascunho.");
    } finally {
      setBusyAction(null);
    }
  }

  async function archiveDraft(draft: SupportScheduleRuleDraft) {
    clearFeedback();
    setBusyAction(`archive-draft-${draft.id}`);
    try {
      const result = await api<SupportScheduleRuleDraftResult>(`/v1/support/schedules/rule-drafts/${draft.id}/archive`, {
        method: "POST",
        body: JSON.stringify({ expectedRevision: draft.revision })
      });
      if (selectedDraft?.id === draft.id) {
        setSelectedDraft(result.draft);
        setForm(formFromDraft(result.draft));
        setPreview(null);
        setDirty(false);
      }
      setDraftOverrides((current) => ({ ...current, [result.draft.id]: result.draft }));
      setNotice("Rascunho arquivado.");
      await onPlanningChanged();
    } catch (caught) {
      handleCasFailure(caught, "Não foi possível arquivar o rascunho.");
    } finally {
      setBusyAction(null);
    }
  }

  async function archiveVersion(rule: SupportScheduleRuleVersion) {
    clearFeedback();
    setBusyAction(`archive-version-${rule.id}`);
    try {
      await api(`/v1/support/schedules/rules/${rule.id}/archive`, { method: "POST", body: "{}" });
      setNotice(`Regra v${rule.version} arquivada.`);
      await onPlanningChanged();
    } catch (caught) {
      setError(caughtMessage(caught, "Não foi possível arquivar a versão."));
    } finally {
      setBusyAction(null);
    }
  }

  async function reloadStalePlanning() {
    setBusyAction("reload-planning");
    await onPlanningChanged();
    setSelectedDraft(null);
    setDraftOverrides({});
    setPreview(null);
    setDirty(true);
    setStale(false);
    setError(null);
    setNotice("Planejamento recarregado. Selecione novamente o rascunho.");
    setBusyAction(null);
  }

  return (
    <>
      <section className="support-form-section support-full-span" aria-labelledby="support-rule-governance-title" aria-busy={busyAction !== null}>
        <div className="support-section-heading">
          <div><p className="eyebrow">Governança de jornada</p><h2 id="support-rule-governance-title">Governança de regras</h2></div>
          <span className="support-count">
            {selectedDraft ? `${draftStatusLabels[selectedDraft.status] ?? selectedDraft.status} · r${selectedDraft.revision}` : teamName}
          </span>
        </div>

        {notice ? <p className="support-notice" role="status">{notice}</p> : null}
        {error ? <p className="error" role="alert">{error}</p> : null}
        {stale ? (
          <div className="support-attention" role="alert">
            <p>Este rascunho mudou em outra sessão. Recarregue o planejamento antes de continuar.</p>
            <button className="secondary small" type="button" disabled={busyAction !== null} onClick={() => void reloadStalePlanning()}>
              <RefreshCw size={14} /> Recarregar planejamento
            </button>
          </div>
        ) : null}

        <form className="support-form-grid support-rule-form" onSubmit={saveDraft}>
          <label className="support-wide-field">Regra base
            <select value={baseVersionId} onChange={(event) => startNewDraft(event.target.value)}>
              <option value="">Sem regra base</option>
              {(planning?.rules ?? []).map((rule) => <option key={rule.id} value={rule.id}>Regra v{rule.version}</option>)}
            </select>
          </label>
          <div className="support-form-actions support-wide-field">
            <button className="secondary" type="button" disabled={busyAction !== null} onClick={() => startNewDraft()}>
              <FilePlus2 size={16} /> Novo rascunho
            </button>
          </div>
          <label className="support-wide-field">Fuso horário<input required value={form.timezone} onChange={(event) => changeForm({ timezone: event.target.value })} /></label>
          <label className="support-wide-field">Vigência a partir de<input required type="datetime-local" value={form.effectiveFrom} onChange={(event) => changeForm({ effectiveFrom: event.target.value })} /></label>
          <label className="support-wide-field">Vigência até<input type="datetime-local" value={form.effectiveTo} onChange={(event) => changeForm({ effectiveTo: event.target.value })} /></label>
          <label>Máximo diário (min)<input required min={60} max={1440} type="number" value={form.maxDailyMinutes} onChange={(event) => changeForm({ maxDailyMinutes: event.target.value })} /></label>
          <label>Máximo semanal (min)<input required min={60} max={10080} type="number" value={form.maxWeeklyMinutes} onChange={(event) => changeForm({ maxWeeklyMinutes: event.target.value })} /></label>
          <label>Descanso mínimo (min)<input required min={0} max={1440} type="number" value={form.minimumRestMinutes} onChange={(event) => changeForm({ minimumRestMinutes: event.target.value })} /></label>
          <label>Antecedência mínima (min)<input required min={0} max={43200} type="number" value={form.minimumNoticeMinutes} onChange={(event) => changeForm({ minimumNoticeMinutes: event.target.value })} /></label>
          <label>Trocas mensais<input required min={0} max={100} type="number" value={form.maxMonthlyExchanges} onChange={(event) => changeForm({ maxMonthlyExchanges: event.target.value })} /></label>
          <label className="support-check"><input type="checkbox" checked={form.autoApproveEligibleSwaps} onChange={(event) => changeForm({ autoApproveEligibleSwaps: event.target.checked })} /> Aprovar trocas elegíveis automaticamente</label>
          <label className="support-check support-wide-field"><input type="checkbox" checked={form.requireManagerExtraApproval} onChange={(event) => changeForm({ requireManagerExtraApproval: event.target.checked })} /> Exigir aprovação para turno extra</label>
          <div className="support-form-actions support-full-span">
            <button type="submit" disabled={busyAction !== null || selectedDraft?.status === "PUBLISHED" || selectedDraft?.status === "ARCHIVED"}>
              <Save size={16} /> Salvar rascunho
            </button>
          </div>
        </form>

        <div className="support-form-grid">
          <label>De<input required type="date" value={previewWindow.from} onChange={(event) => changePreviewWindow({ from: event.target.value })} /></label>
          <label>Até (janela máxima de {RULE_PREVIEW_MAX_DAYS} dias)<input required type="date" value={previewWindow.to} onChange={(event) => changePreviewWindow({ to: event.target.value })} /></label>
          {windowError && selectedDraft ? <p className="error support-full-span" role="alert">{windowError}</p> : null}
          <div className="support-form-actions support-full-span">
            <button className="secondary" type="button" disabled={!selectedDraft || dirty || selectedDraft.status !== "DRAFT" || Boolean(windowError) || busyAction !== null} onClick={() => void generatePreview()}>
              <Eye size={16} /> Gerar prévia da regra
            </button>
            <button type="button" disabled={!previewMatchesDraft || selectedDraft?.status !== "DRAFT" || busyAction !== null} onClick={() => void publishDraft()}>
              <Send size={16} /> Publicar regra
            </button>
          </div>
        </div>

        {preview ? (
          <div className="support-planning-overview">
            <RuleDiff title="Alterações em relação à regra base" diff={preview.diff.base} />
            {preview.diff.latest.versionId !== preview.diff.base.versionId ? (
              <RuleDiff title="Alterações em relação à versão mais recente" diff={preview.diff.latest} />
            ) : null}
            <dl className="support-materialization-summary">
              <div><dt>Candidatos</dt><dd>{preview.materialization.candidates}</dd></div>
              <div><dt>Criados</dt><dd>{preview.materialization.createdCount}</dd></div>
              <div><dt>Reusados</dt><dd>{preview.materialization.reusedCount}</dd></div>
              <div><dt>Conflitos</dt><dd>{preview.materialization.conflicts.length}</dd></div>
            </dl>
            {preview.materialization.conflicts.length ? (
              <details className="support-conflicts">
                <summary>Revisar conflitos da materialização</summary>
                <ul>{preview.materialization.conflicts.map((conflict, index) => (
                  <li key={`${conflict.assignmentId}-${conflict.localDate}-${index}`}>{conflict.localDate} · {conflict.reason}</li>
                ))}</ul>
              </details>
            ) : null}
          </div>
        ) : null}
      </section>

      <section className="support-table-section support-full-span" aria-labelledby="support-rule-drafts-title">
        <div className="support-section-heading">
          <div><p className="eyebrow">Histórico de edição</p><h2 id="support-rule-drafts-title">Rascunhos de regras</h2></div>
          <span className="support-count">{visibleDrafts.length}</span>
        </div>
        {planning ? visibleDrafts.length ? (
          <div className="table-scroll">
            <table aria-label="Rascunhos de regras">
              <thead><tr><th scope="col">Status/revisão</th><th scope="col">Vigência</th><th scope="col">Base</th><th scope="col">Atualização</th><th scope="col">Ações</th></tr></thead>
              <tbody>{visibleDrafts.map((draft) => (
                <tr key={draft.id}>
                  <td><span className={`support-status ${draftStatusClass(draft.status)}`}>{draftStatusLabels[draft.status] ?? draft.status}</span><small>revisão {draft.revision}</small></td>
                  <td>{new Date(draft.effectiveFrom).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: draft.timezone })}</td>
                  <td>{draft.baseVersionId ? `Versão ${planning.rules.find((rule) => rule.id === draft.baseVersionId)?.version ?? draft.baseVersionId}` : "Sem base"}</td>
                  <td>{new Date(draft.updatedAt).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}</td>
                  <td>
                    {draft.status === "DRAFT" ? (
                      <div className="inline-actions">
                        <button className="secondary small" type="button" disabled={busyAction !== null} onClick={() => editDraft(draft)}><Pencil size={14} /> Editar</button>
                        <ConfirmButton confirmLabel="Confirmar arquivamento" disabled={busyAction !== null} onConfirm={() => void archiveDraft(draft)}><Archive size={14} /> Arquivar</ConfirmButton>
                      </div>
                    ) : "-"}
                  </td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        ) : <OperationalState state="empty" title="Nenhum rascunho registrado" /> : <OperationalState state="loading" title="Carregando rascunhos" />}
      </section>

      <section className="support-table-section support-full-span" aria-labelledby="support-rule-versions-title">
        <div className="support-section-heading">
          <div><p className="eyebrow">Histórico publicado</p><h2 id="support-rule-versions-title">Versões de regras</h2></div>
          <span className="support-count">{(planning?.rules.length ?? 0) + (planning?.archivedRuleVersions.length ?? 0)}</span>
        </div>
        {planning ? planning.rules.length || planning.archivedRuleVersions.length ? (
          <div className="table-scroll">
            <table aria-label="Versões de regras">
              <thead><tr><th scope="col">Versão</th><th scope="col">Status</th><th scope="col">Vigência</th><th scope="col">Fuso</th><th scope="col">Ações</th></tr></thead>
              <tbody>
                {planning.rules.map((rule) => (
                  <tr key={rule.id}>
                    <td><strong>v{rule.version}</strong></td>
                    <td><span className="support-status active">Ativa</span></td>
                    <td>{new Date(rule.effectiveFrom).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: rule.timezone })}</td>
                    <td>{rule.timezone}</td>
                    <td>{new Date(rule.effectiveFrom).getTime() > Date.now() ? (
                      <ConfirmButton confirmLabel="Confirmar arquivamento" disabled={busyAction !== null} onConfirm={() => void archiveVersion(rule)}><Archive size={14} /> Arquivar</ConfirmButton>
                    ) : "-"}</td>
                  </tr>
                ))}
                {planning.archivedRuleVersions.map((rule) => (
                  <tr key={rule.id}>
                    <td><strong>v{rule.version}</strong></td>
                    <td><span className="support-status closed">Arquivada</span></td>
                    <td>{new Date(rule.effectiveFrom).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: rule.timezone })}</td>
                    <td>{rule.timezone}</td>
                    <td>-</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <OperationalState state="empty" title="Nenhuma versão publicada" /> : <OperationalState state="loading" title="Carregando versões" />}
      </section>
    </>
  );
}
