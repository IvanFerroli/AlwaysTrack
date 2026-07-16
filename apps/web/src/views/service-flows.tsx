import { Check, Clipboard, GitBranch, Plus, RotateCcw } from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { commercialManagerRoles, type CurrentUser } from "@alwaystrack/shared";
import { api, uploadOperationalImage } from "../api";
import { MarkdownContent, MarkdownEditor } from "../components/markdown-editor";
import { OperationalFilters, OperationalState } from "../components/operational";
import { formatDateBr } from "../sales";

interface FlowScript {
  id: string;
  title: string;
  channel: string;
  body: string;
  tags?: string[];
  placeholders?: string[];
  status: string;
  usageCount: number;
}

interface ServiceFlowStepScript {
  id: string;
  script: FlowScript;
}

interface ServiceFlowStep {
  id: string;
  title: string;
  body: string | null;
  kind: string;
  decision?: Record<string, unknown> | null;
  order: number;
  required: boolean;
  collapsed: boolean;
  scripts: ServiceFlowStepScript[];
}

interface ServiceFlowItem {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  content: string | null;
  tags?: string[];
  status: string;
  priority: number;
  version: number;
  reviewComment: string | null;
  reviewDueAt: string | null;
  reviewedAt: string | null;
  reviewedBy: { id: string; name: string; role: string } | null;
  wikiPage: { id: string; slug: string; title: string } | null;
  steps: ServiceFlowStep[];
  revisions?: Array<{ id: string; version: number; title: string; status: string; comment: string | null; createdAt: string; author: { id: string; name: string; role: string } }>;
}

interface ScriptLibraryResponse {
  scripts: FlowScript[];
}

interface PersonalScriptItem {
  id: string;
  title: string;
  channel: string;
  body: string;
  tags?: string[];
  placeholders?: string[];
  suggestedAt: string | null;
  flows: Array<{ id: string; slug: string; title: string; status: string }>;
  suggestion: { id: string; status: string; createdScriptId: string | null } | null;
}

interface PersonalScriptsResponse {
  items: PersonalScriptItem[];
}

interface ServiceFlowsResponse {
  items: ServiceFlowItem[];
  canManage: boolean;
}

interface ServiceFlowMetrics {
  summary: { totalFlows: number; publishedFlows: number; reviewDue: number; openSessions: number };
  mostUsedFlows: Array<{ flowId: string; title: string; sessions: number }>;
  stepBottlenecks: Array<{ stepId: string; stepTitle: string; flowTitle: string; status: string; count: number }>;
  topScriptsByFlow: Array<{ id: string; title: string; count: number }>;
  zeroSearches: Array<{ id: string; query: string | null; filtersJson: string | null; createdAt: string }>;
}

interface ServiceFlowSession {
  id: string;
  status: string;
  startedAt: string;
  completedAt: string | null;
  flow: { id: string; slug: string; title: string };
  version?: { id: string; version: number; title: string; publishedAt: string } | null;
  caseData?: Record<string, string>;
  report?: string;
  steps: Array<{
    id: string;
    stepId: string | null;
    nodeKey?: string | null;
    nodeSnapshotJson?: string | null;
    status: string;
    decision: string | null;
    note: string | null;
    completedAt: string | null;
    step: { id: string; title: string; order: number; required: boolean } | null;
  }>;
}

type RewindStrategy = "DISCARD_FOLLOWING" | "RECONFIRM_FOLLOWING";

interface FlowDecisionOption {
  label: string;
  target?: string;
}

const flowStatuses = [
  { value: "PUBLISHED", label: "Publicado" },
  { value: "DRAFT", label: "Rascunho" },
  { value: "ARCHIVED", label: "Arquivado" }
];

const stepKinds = [
  { value: "MANUAL", label: "Manual" },
  { value: "YES_NO", label: "Sim/Não" },
  { value: "CHECKLIST", label: "Checklist" },
  { value: "DECISION", label: "Decisão" }
];

interface StepDraft {
  title: string;
  body: string;
  kind: string;
  scriptIds: string[];
  yesLabel: string;
  noLabel: string;
  options: string;
}

function emptyStepDraft(): StepDraft {
  return { title: "", body: "", kind: "MANUAL", scriptIds: [], yesLabel: "", noLabel: "", options: "" };
}

function parseTags(value: string) {
  return [...new Set(value.split(",").map((tag) => tag.trim().replace(/^#/, "").toLowerCase()).filter(Boolean))].sort();
}

function renderScript(body: string, values: Record<string, string>) {
  return body.replace(/\{([a-zA-Z0-9_.-]+)\}/g, (_, key: string) => values[key] || `{${key}}`);
}

function optionsFromDecision(decision: Record<string, unknown> | null | undefined): FlowDecisionOption[] {
  if (!decision) return [];
  if (Array.isArray(decision.options)) return decision.options.flatMap((item) => {
    if (typeof item === "string") return [{ label: item }];
    if (!item || typeof item !== "object") return [];
    const option = item as Record<string, unknown>;
    return typeof option.label === "string"
      ? [{ label: option.label, ...(typeof option.target === "string" ? { target: option.target } : {}) }]
      : [];
  });
  return Object.entries(decision)
    .filter(([key]) => key !== "nodeKey")
    .map(([key, value]) => ({ label: `${key}: ${String(value)}` }));
}

function nodeKeyFromStep(step: ServiceFlowStep) {
  return typeof step.decision?.nodeKey === "string" ? step.decision.nodeKey : null;
}

function isCompletedTerminalStep(step: ServiceFlowSession["steps"][number]) {
  if (step.status !== "DONE" || !step.nodeSnapshotJson) return false;
  try {
    const snapshot = JSON.parse(step.nodeSnapshotJson) as { terminal?: unknown };
    return snapshot.terminal === true;
  } catch {
    return false;
  }
}

function sessionStepKey(step: ServiceFlowSession["steps"][number]) {
  return step.stepId ?? step.nodeKey;
}

function placeholdersFor(script: Pick<FlowScript, "placeholders">, values: Record<string, string>) {
  const aliases: Record<string, string> = {
    nome_cliente: "customer.name",
    codigo_reversa: "treatment.reverseCode",
    previsao_entrega: "logistics.forecast",
    novo_pedido: "order.manualId",
    modo_de_uso: "custom.alwaysfit.product.recommended.usage"
  };
  return Object.fromEntries((script.placeholders ?? []).map((placeholder) => [placeholder, values[placeholder] ?? values[aliases[placeholder]] ?? ""]));
}

function factsFromSnapshot(value: string | null | undefined) {
  if (!value) return { required: [] as string[], optional: [] as string[], type: null as string | null };
  try {
    const snapshot = JSON.parse(value) as { requiredFacts?: unknown; requiredFactsJson?: unknown; optionalFacts?: unknown; optionalFactsJson?: unknown; type?: unknown };
    const parseFacts = (direct: unknown, serialized: unknown) => {
      if (Array.isArray(direct)) return direct.filter((item): item is string => typeof item === "string");
      if (typeof serialized !== "string") return [];
      try {
        const parsed = JSON.parse(serialized) as unknown;
        return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
      } catch {
        return [];
      }
    };
    return {
      required: parseFacts(snapshot.requiredFacts, snapshot.requiredFactsJson),
      optional: parseFacts(snapshot.optionalFacts, snapshot.optionalFactsJson),
      type: typeof snapshot.type === "string" ? snapshot.type : null
    };
  } catch {
    return { required: [], optional: [], type: null };
  }
}

const caseFieldLabels: Record<string, string> = {
  "conversation.intentText": "Relato inicial",
  "customer.name": "Nome do cliente",
  "customer.cpf": "CPF do cliente",
  "customer.email": "E-mail do cliente",
  "customer.phone": "Telefone do cliente",
  "order.primaryId": "Pedido relacionado",
  "order.manualId": "Novo pedido da troca",
  "order.products": "Produtos do pedido",
  "logistics.deliveredAt": "Data de recebimento",
  "logistics.returnState": "Situação da postagem",
  "logistics.forecast": "Previsão de entrega",
  "payment.method": "Forma de pagamento original",
  "payment.pix": "Dados Pix",
  "treatment.reverseCode": "Código da logística reversa",
  "custom.alwaysfit.health.symptom.started": "Início do mal-estar",
  "custom.alwaysfit.health.related.products": "Produtos relacionados ao mal-estar",
  "custom.alwaysfit.health.usage": "Forma e período de uso",
  "custom.alwaysfit.health.concomitant.products": "Medicamentos ou suplementos simultâneos",
  "custom.alwaysfit.product.recommended.usage": "Forma de uso recomendada",
  "custom.alwaysfit.health.symptom.persistent": "O mal-estar permanece?",
  "custom.alwaysfit.treatment.unusable.scope": "Escopo que não poderá mais ser usado",
  "custom.alwaysfit.return.open.items": "Itens abertos",
  "custom.alwaysfit.return.sealed.items": "Itens lacrados",
  "custom.alwaysfit.return.returned.sealed.items": "Lacrados que serão devolvidos",
  "custom.alwaysfit.return.retained.sealed.items": "Lacrados que ficarão com o cliente",
  "custom.alwaysfit.return.declared.value": "Valor declarado na reversa",
  "custom.alwaysfit.treatment.solution": "Solução escolhida",
  "custom.alwaysfit.financial.paid.affected.value": "Valor pago pelo escopo afetado",
  "custom.alwaysfit.financial.retained.sealed.value": "Valor dos lacrados retidos",
  "custom.alwaysfit.financial.available.balance": "Saldo disponível",
  "custom.alwaysfit.financial.refund.amount": "Valor do estorno",
  "custom.alwaysfit.treatment.slack.refund.link": "Link do pedido de estorno no Slack",
  "custom.alwaysfit.exchange.items": "Itens da troca",
  "custom.alwaysfit.exchange.stock.available": "Disponibilidade da composição",
  "custom.alwaysfit.exchange.value": "Valor da troca",
  "custom.alwaysfit.exchange.difference": "Diferença da troca",
  "custom.alwaysfit.payment.difference.status": "Situação do pagamento da diferença",
  "custom.alwaysfit.financial.remaining.refund": "Diferença restante para estorno"
};

function humanizeCaseField(key: string) {
  return caseFieldLabels[key] ?? key.replace(/[._-]+/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function focusServiceFlowStep(nodeKey: string | null | undefined) {
  if (!nodeKey) return;
  window.setTimeout(() => {
    const element = document.getElementById(`service-flow-${nodeKey}`);
    element?.focus({ preventScroll: true });
    if (element && typeof element.scrollIntoView === "function") {
      element.scrollIntoView({
        behavior: window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
        block: "center"
      });
    }
  }, 0);
}

function decisionPayload(step: StepDraft) {
  if (step.kind === "YES_NO") {
    return {
      yes: step.yesLabel || "Seguir para a próxima etapa.",
      no: step.noLabel || "Revisar manualmente antes de seguir."
    };
  }
  if (step.kind === "DECISION" || step.kind === "CHECKLIST") {
    const options = parseTags(step.options).map((item) => item.replace(/-/g, " "));
    return options.length ? { options } : null;
  }
  return null;
}

function wordsFor(value: string) {
  return new Set(
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((item) => item.length >= 3)
  );
}

export function ServiceFlowsView({ user }: { user: CurrentUser }) {
  const [flows, setFlows] = useState<ServiceFlowItem[]>([]);
  const [scripts, setScripts] = useState<FlowScript[]>([]);
  const [personalScripts, setPersonalScripts] = useState<PersonalScriptItem[]>([]);
  const [metrics, setMetrics] = useState<ServiceFlowMetrics | null>(null);
  const [selectedId, setSelectedId] = useState("");
  const [flowPickerQuery, setFlowPickerQuery] = useState("");
  const [query, setQuery] = useState("");
  const [tag, setTag] = useState("");
  const [status, setStatus] = useState("");
  const [openSteps, setOpenSteps] = useState<Record<string, boolean>>({});
  const [activeSession, setActiveSession] = useState<ServiceFlowSession | null>(null);
  const [caseData, setCaseData] = useState<Record<string, string>>({});
  const [caseDataDirty, setCaseDataDirty] = useState(false);
  const [caseDataFeedback, setCaseDataFeedback] = useState("");
  const [stepNotes, setStepNotes] = useState<Record<string, string>>({});
  const [stepDecisions, setStepDecisions] = useState<Record<string, string>>({});
  const [rewindTarget, setRewindTarget] = useState<ServiceFlowStep | null>(null);
  const [copyFeedback, setCopyFeedback] = useState("");
  const [flowDraft, setFlowDraft] = useState({ title: "", summary: "", content: "", tags: "", status: "PUBLISHED" });
  const [governanceDraft, setGovernanceDraft] = useState({ comment: "", reviewDueAt: "" });
  const [personalDraft, setPersonalDraft] = useState({ title: "", channel: "WHATSAPP", body: "", tags: "", flowIds: [] as string[] });
  const [stepDrafts, setStepDrafts] = useState<StepDraft[]>([emptyStepDraft()]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canManage = (commercialManagerRoles as readonly string[]).includes(user.role);
  const selected = flows.find((flow) => flow.id === selectedId) ?? flows[0] ?? null;
  const tags = useMemo(() => [...new Set(flows.flatMap((flow) => flow.tags ?? []))].sort(), [flows]);
  const selectableFlows = useMemo(() => {
    const needle = flowPickerQuery.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
    if (!needle) return flows;
    return flows.filter((flow) => `${flow.title} ${flow.summary ?? ""} ${flow.tags?.join(" ") ?? ""}`.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().includes(needle));
  }, [flowPickerQuery, flows]);
  const visiblePersonalScripts = useMemo(() => personalScripts.filter((script) => !selected || script.flows.length === 0 || script.flows.some((flow) => flow.id === selected.id)), [personalScripts, selected]);
  const caseFields = useMemo(() => {
    const required = new Set(activeSession?.steps.flatMap((step) => factsFromSnapshot(step.nodeSnapshotJson).required) ?? []);
    const optional = new Set(activeSession?.steps.flatMap((step) => factsFromSnapshot(step.nodeSnapshotJson).optional) ?? []);
    const aliases: Record<string, string> = {
      nome_cliente: "customer.name",
      codigo_reversa: "treatment.reverseCode",
      previsao_entrega: "logistics.forecast",
      novo_pedido: "order.manualId",
      modo_de_uso: "custom.alwaysfit.product.recommended.usage"
    };
    const placeholders = [
      ...(selected?.steps.flatMap((step) => step.scripts.flatMap(({ script }) => script.placeholders ?? [])) ?? []),
      ...visiblePersonalScripts.flatMap((script) => script.placeholders ?? [])
    ].map((key) => aliases[key] ?? key);
    return [...new Set([...required, ...optional, ...placeholders])]
      .map((key) => ({ key, label: humanizeCaseField(key), required: required.has(key) }))
      .sort((left, right) => Number(right.required) - Number(left.required) || left.label.localeCompare(right.label, "pt-BR"));
  }, [activeSession, selected, visiblePersonalScripts]);
  const visibleSteps = useMemo(() => {
    if (!selected || !activeSession) return selected?.steps ?? [];
    return selected.steps.filter((step) => activeSession.steps.some((sessionStep) =>
      sessionStep.stepId === step.id || sessionStep.nodeKey === nodeKeyFromStep(step)
    ));
  }, [activeSession, selected]);
  const canCompleteSession = activeSession ? activeSession.version
    ? activeSession.steps.some(isCompletedTerminalStep)
      && !activeSession.steps.some((step) => step.status === "PENDING" || step.status === "RECONFIRMATION_REQUIRED")
    : !activeSession.steps.some((step) => step.status === "RECONFIRMATION_REQUIRED" || (step.status === "PENDING" && step.step?.required))
    : false;

  async function load(nextSelectedId = selectedId) {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    if (query) params.set("query", query);
    if (tag) params.set("tag", tag);
    if (status) params.set("status", status);
    try {
      const [flowResult, scriptResult] = await Promise.all([
        api<ServiceFlowsResponse>(`/v1/service-flows?${params.toString()}`),
        api<ScriptLibraryResponse>("/v1/script-library")
      ]);
      const personalResult = await api<PersonalScriptsResponse>("/v1/script-library/personal-scripts").catch(() => ({ items: [] }));
      setFlows(flowResult.items);
      setScripts(scriptResult.scripts.filter((script) => script.status !== "OBSOLETE"));
      setPersonalScripts(personalResult.items);
      const next = nextSelectedId && flowResult.items.some((flow) => flow.id === nextSelectedId) ? nextSelectedId : flowResult.items[0]?.id ?? "";
      setSelectedId(next);
      setOpenSteps(Object.fromEntries((flowResult.items.find((flow) => flow.id === next)?.steps ?? flowResult.items[0]?.steps ?? []).map((step, index) => [step.id, index === 0])));
      if (canManage) {
        const metricResult = await api<ServiceFlowMetrics>("/v1/service-flows/metrics/summary").catch(() => null);
        setMetrics(metricResult);
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Falha ao carregar fluxos.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load("");
  }, [tag, status]);

  useEffect(() => {
    setActiveSession(null);
    setCaseData({});
    setCaseDataDirty(false);
    setCaseDataFeedback("");
    setStepNotes({});
    setStepDecisions({});
    setRewindTarget(null);
    setPersonalDraft((current) => ({ ...current, flowIds: selectedId ? [selectedId] : [] }));
  }, [selectedId]);

  async function copyScript(script: FlowScript) {
    const scriptValues = placeholdersFor(script, caseData);
    const rendered = renderScript(script.body, scriptValues);
    try {
      await navigator.clipboard.writeText(rendered);
      setCopyFeedback(script.id);
    } catch {
      setCopyFeedback("");
    }
    await api(`/v1/script-library/scripts/${script.id}/copy`, {
      method: "POST",
      body: JSON.stringify({ renderedText: rendered, placeholders: scriptValues, serviceFlowSessionId: activeSession?.id ?? null })
    }).catch(() => null);
    window.setTimeout(() => setCopyFeedback(""), 1600);
  }

  async function copyPersonalScript(script: PersonalScriptItem) {
    const key = `personal:${script.id}`;
    const rendered = renderScript(script.body, placeholdersFor(script, caseData));
    try {
      await navigator.clipboard.writeText(rendered);
      setCopyFeedback(key);
    } catch {
      setCopyFeedback("");
    }
    window.setTimeout(() => setCopyFeedback(""), 1600);
  }

  async function startSession() {
    if (!selected) return;
    setSaving(true);
    setError(null);
    try {
      const result = await api<{ session: ServiceFlowSession }>(`/v1/service-flows/${selected.id}/sessions`, { method: "POST" });
      setActiveSession(result.session);
      setCaseData(result.session.caseData ?? {});
      setCaseDataDirty(false);
      setCaseDataFeedback("");
      const selectedSteps = selected.steps;
      const stateKey = (sessionStep: ServiceFlowSession["steps"][number]) => sessionStep.stepId
        ?? selectedSteps.find((step) => nodeKeyFromStep(step) === sessionStep.nodeKey)?.id
        ?? sessionStep.nodeKey;
      setStepNotes(Object.fromEntries(result.session.steps.flatMap((step) => {
        const key = stateKey(step);
        return key ? [[key, step.note ?? ""]] : [];
      })));
      setStepDecisions(Object.fromEntries(result.session.steps.flatMap((step) => {
        const key = stateKey(step);
        return key ? [[key, step.decision ?? ""]] : [];
      })));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Falha ao iniciar atendimento.");
    } finally {
      setSaving(false);
    }
  }

  async function saveCaseData() {
    if (!activeSession) return;
    setSaving(true);
    setError(null);
    try {
      const result = await api<{ session: ServiceFlowSession }>(`/v1/service-flow-sessions/${activeSession.id}/case-data`, {
        method: "PATCH",
        body: JSON.stringify({ values: caseData })
      });
      setActiveSession(result.session);
      setCaseData(result.session.caseData ?? {});
      setCaseDataDirty(false);
      setCaseDataFeedback("Dados salvos");
      window.setTimeout(() => setCaseDataFeedback(""), 1800);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Falha ao salvar dados do atendimento.");
    } finally {
      setSaving(false);
    }
  }

  async function rewindSessionStep(strategy: RewindStrategy) {
    if (!activeSession || !rewindTarget) return;
    const sessionStep = activeSession.steps.find((item) => item.stepId === rewindTarget.id || item.nodeKey === nodeKeyFromStep(rewindTarget));
    const routeKey = sessionStep ? sessionStepKey(sessionStep) : null;
    if (!routeKey) return;
    setSaving(true);
    setError(null);
    try {
      const result = await api<{ session: ServiceFlowSession }>(`/v1/service-flow-sessions/${activeSession.id}/steps/${routeKey}/rewind`, {
        method: "POST",
        body: JSON.stringify({ strategy })
      });
      setActiveSession(result.session);
      setStepNotes((current) => ({ ...current, [rewindTarget.id]: sessionStep?.note ?? "" }));
      setStepDecisions((current) => ({ ...current, [rewindTarget.id]: sessionStep?.decision ?? "" }));
      setOpenSteps((current) => ({ ...current, [rewindTarget.id]: true }));
      setRewindTarget(null);
      focusServiceFlowStep(nodeKeyFromStep(rewindTarget) ?? rewindTarget.id);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Falha ao retomar etapa.");
    } finally {
      setSaving(false);
    }
  }

  async function saveSessionStep(step: ServiceFlowStep, statusValue: "DONE" | "SKIPPED" | "PENDING", selectedDecision?: FlowDecisionOption) {
    if (!activeSession) return;
    const sessionStep = activeSession.steps.find((item) => item.stepId === step.id || item.nodeKey === nodeKeyFromStep(step));
    const routeKey = sessionStep?.nodeKey ?? sessionStep?.stepId ?? step.id;
    const decision = selectedDecision?.label ?? stepDecisions[step.id] ?? "";
    if (selectedDecision) setStepDecisions((current) => ({ ...current, [step.id]: selectedDecision.label }));
    setSaving(true);
    setError(null);
    try {
      if (caseDataDirty) {
        const saved = await api<{ session: ServiceFlowSession }>(`/v1/service-flow-sessions/${activeSession.id}/case-data`, {
          method: "PATCH",
          body: JSON.stringify({ values: caseData })
        });
        setActiveSession(saved.session);
        setCaseData(saved.session.caseData ?? caseData);
        setCaseDataDirty(false);
      }
      const result = await api<{ session: ServiceFlowSession }>(`/v1/service-flow-sessions/${activeSession.id}/steps/${routeKey}`, {
        method: "POST",
        body: JSON.stringify({ status: statusValue, decision: decision || null, note: stepNotes[step.id] || null })
      });
      setActiveSession(result.session);
      if (statusValue === "DONE" || statusValue === "SKIPPED") {
        const currentIndex = result.session.steps.findIndex((item) => item.stepId === step.id || item.nodeKey === nodeKeyFromStep(step));
        const currentSessionStep = currentIndex >= 0 ? result.session.steps[currentIndex] : null;
        const loopsOnCurrentStep = currentSessionStep?.status === "PENDING" || currentSessionStep?.status === "RECONFIRMATION_REQUIRED";
        const nextSessionStep = loopsOnCurrentStep
          ? currentSessionStep
          : result.session.steps.slice(Math.max(currentIndex + 1, 0)).find((item) => item.status === "PENDING" || item.status === "RECONFIRMATION_REQUIRED");
        const target = nextSessionStep ? selected.steps.find((item) => item.id === nextSessionStep.stepId || nodeKeyFromStep(item) === nextSessionStep.nodeKey) : null;
        setOpenSteps((current) => ({
          ...current,
          [step.id]: loopsOnCurrentStep,
          ...(target ? { [target.id]: true } : {})
        }));
        focusServiceFlowStep(nextSessionStep?.nodeKey ?? target?.id);
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Falha ao registrar etapa.");
    } finally {
      setSaving(false);
    }
  }

  async function completeSession() {
    if (!activeSession) return;
    setSaving(true);
    setError(null);
    try {
      const result = await api<{ session: ServiceFlowSession }>(`/v1/service-flow-sessions/${activeSession.id}/complete`, { method: "POST" });
      setActiveSession(result.session);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Falha ao finalizar atendimento.");
    } finally {
      setSaving(false);
    }
  }

  async function copySessionReport() {
    if (!activeSession?.report) return;
    try {
      await navigator.clipboard.writeText(activeSession.report);
      setCopyFeedback("session-report");
      window.setTimeout(() => setCopyFeedback(""), 1600);
    } catch {
      setCopyFeedback("");
    }
  }

  async function decideFlow(action: "publish" | "archive") {
    if (!selected) return;
    setSaving(true);
    setError(null);
    try {
      const result = await api<{ flow: ServiceFlowItem }>(`/v1/service-flows/${selected.id}/${action}`, {
        method: "POST",
        body: JSON.stringify({ comment: governanceDraft.comment, reviewDueAt: governanceDraft.reviewDueAt || null })
      });
      setGovernanceDraft({ comment: "", reviewDueAt: "" });
      await load(result.flow.id);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Falha na governança do fluxo.");
    } finally {
      setSaving(false);
    }
  }

  async function createPersonalScript(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await api("/v1/script-library/personal-scripts", {
        method: "POST",
        body: JSON.stringify({
          ...personalDraft,
          tags: parseTags(personalDraft.tags),
          flowIds: personalDraft.flowIds
        })
      });
      setPersonalDraft({ title: "", channel: "WHATSAPP", body: "", tags: "", flowIds: selected ? [selected.id] : [] });
      const result = await api<PersonalScriptsResponse>("/v1/script-library/personal-scripts");
      setPersonalScripts(result.items);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Falha ao salvar script pessoal.");
    } finally {
      setSaving(false);
    }
  }

  async function suggestPersonalScript(scriptId: string) {
    setSaving(true);
    setError(null);
    try {
      await api(`/v1/script-library/personal-scripts/${scriptId}/suggest`, { method: "POST" });
      const result = await api<PersonalScriptsResponse>("/v1/script-library/personal-scripts");
      setPersonalScripts(result.items);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Falha ao sugerir script pessoal.");
    } finally {
      setSaving(false);
    }
  }

  function updateStep(index: number, patch: Partial<StepDraft>) {
    setStepDrafts((current) => current.map((step, currentIndex) => currentIndex === index ? { ...step, ...patch } : step));
  }

  function recommendedScriptsFor(step: StepDraft) {
    const flowTagSet = new Set(parseTags(flowDraft.tags));
    const stepWords = wordsFor(`${step.title} ${step.body}`);
    return scripts
      .map((script) => {
        const tagScore = (script.tags ?? []).filter((item) => flowTagSet.has(item) || stepWords.has(item)).length * 3;
        const titleScore = [...stepWords].filter((word) => script.title.toLowerCase().includes(word) || script.body.toLowerCase().includes(word)).length;
        const usageScore = Math.min(script.usageCount, 5) / 5;
        return { script, score: tagScore + titleScore + usageScore };
      })
      .filter((item) => item.score > 0 && !step.scriptIds.includes(item.script.id))
      .sort((left, right) => right.score - left.score)
      .slice(0, 5)
      .map((item) => item.script);
  }

  async function createFlow(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const payload = {
        ...flowDraft,
        tags: parseTags(flowDraft.tags),
        steps: stepDrafts.filter((step) => step.title.trim()).map((step, index) => ({
          title: step.title,
          body: step.body || null,
          kind: step.kind,
          order: index + 1,
          required: index === 0,
          decision: decisionPayload(step),
          scriptIds: step.scriptIds
        }))
      };
      const result = await api<{ flow: ServiceFlowItem }>("/v1/service-flows", { method: "POST", body: JSON.stringify(payload) });
      setFlowDraft({ title: "", summary: "", content: "", tags: "", status: "PUBLISHED" });
      setStepDrafts([emptyStepDraft()]);
      await load(result.flow.id);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Falha ao criar fluxo.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="content-stack service-flow-view">
      <OperationalFilters
        fields={[
          { key: "query", label: "Busca", value: query, placeholder: "Título, texto ou tag", onChange: setQuery },
          { key: "tag", label: "Tag", value: tag, type: "select", placeholder: "Todas", options: tags.map((item) => ({ value: item, label: `#${item}` })), onChange: setTag },
          ...(canManage ? [{ key: "status", label: "Status", value: status, type: "select" as const, placeholder: "Todos", options: flowStatuses, onChange: setStatus }] : [])
        ]}
        onSubmit={() => void load("")}
      />
      {error ? <OperationalState state="error" title="Falha nos fluxos" detail={error} /> : null}
      {canManage && metrics ? (
        <section className="panel service-flow-metrics-panel">
          <div>
            <p className="eyebrow">Governança</p>
            <h2>Uso dos fluxos</h2>
          </div>
          <div className="script-metrics-grid">
            <div className="script-metric-card"><span>Fluxos publicados</span><strong>{metrics.summary.publishedFlows}/{metrics.summary.totalFlows}</strong></div>
            <div className="script-metric-card"><span>Revisão vencida</span><strong>{metrics.summary.reviewDue}</strong></div>
            <div className="script-metric-card"><span>Sessões abertas</span><strong>{metrics.summary.openSessions}</strong></div>
          </div>
          <div className="script-metrics-columns">
            <div className="script-metric-list">
              <h3>Mais usados</h3>
              <div>
                {metrics.mostUsedFlows.map((item) => <span key={item.flowId}><strong>{item.title}</strong><small>{item.sessions} sessão(ões)</small></span>)}
                {metrics.mostUsedFlows.length ? null : <span className="muted">Sem sessões registradas.</span>}
              </div>
            </div>
            <div className="script-metric-list">
              <h3>Etapas com pendência</h3>
              <div>
                {metrics.stepBottlenecks.map((item) => <span key={`${item.stepId}-${item.status}`}><strong>{item.stepTitle}</strong><small>{item.status} / {item.count}</small></span>)}
                {metrics.stepBottlenecks.length ? null : <span className="muted">Sem gargalos recentes.</span>}
              </div>
            </div>
            <div className="script-metric-list">
              <h3>Scripts em fluxo</h3>
              <div>
                {metrics.topScriptsByFlow.map((item) => <span key={item.id}><strong>{item.title}</strong><small>{item.count} cópia(s)</small></span>)}
                {metrics.topScriptsByFlow.length ? null : <span className="muted">Sem cópias vinculadas a fluxo.</span>}
              </div>
            </div>
            <div className="script-metric-list">
              <h3>Buscas sem fluxo</h3>
              <div>
                {metrics.zeroSearches.map((item) => <span key={item.id}><strong>{item.query || "Filtro vazio"}</strong><small>{formatDateBr(item.createdAt)}</small></span>)}
                {metrics.zeroSearches.length ? null : <span className="muted">Sem lacunas de busca.</span>}
              </div>
            </div>
          </div>
        </section>
      ) : null}
      <div className="service-flow-layout">
        <section className="panel table-panel">
          <div className="table-panel-toolbar">
            <div>
              <p className="eyebrow">Fluxos</p>
              <h2>Tipos de atendimento</h2>
            </div>
          </div>
          {loading ? <OperationalState state="loading" title="Carregando fluxos" /> : null}
          <div className="service-flow-picker">
            <label>
              Buscar fluxo
              <input value={flowPickerQuery} onChange={(event) => setFlowPickerQuery(event.target.value)} placeholder="Digite parte do atendimento, tag ou contexto" />
            </label>
            <label>
              Selecionar fluxo
              <select
                value={selected?.id ?? ""}
                onChange={(event) => {
                  const flow = flows.find((item) => item.id === event.target.value);
                  setSelectedId(event.target.value);
                  setOpenSteps(Object.fromEntries((flow?.steps ?? []).map((step, index) => [step.id, index === 0])));
                  setPersonalDraft((current) => ({ ...current, flowIds: event.target.value ? [event.target.value] : [] }));
                }}
              >
                {selectableFlows.map((flow) => <option key={flow.id} value={flow.id}>{flow.title} · {flow.status}</option>)}
              </select>
            </label>
            {selected ? (
              <div className="service-flow-picker-summary">
                <strong>{selected.title}</strong>
                {selected.summary ? <span>{selected.summary}</span> : null}
                <small>{selected.steps.length} etapa(s) · v{selected.version}</small>
              </div>
            ) : null}
            {!loading && flows.length === 0 ? <OperationalState state="empty" title="Nenhum fluxo encontrado" detail="Cadastre um fluxo para guiar atendimentos recorrentes." /> : null}
          </div>
        </section>
        <section className="panel service-flow-runner">
          {selected ? (
            <>
              <div className="detail-header">
                <div>
                  <p className="eyebrow">/{selected.slug}</p>
                  <h2>{selected.title}</h2>
                  <p className="muted">
                    v{selected.version} · {selected.status}
                    {selected.reviewedBy ? ` · validado por ${selected.reviewedBy.name}` : ""}
                    {selected.reviewDueAt ? ` · revisar até ${formatDateBr(selected.reviewDueAt)}` : ""}
                  </p>
                  {selected.summary ? <p className="muted">{selected.summary}</p> : null}
                </div>
                <div className="row-actions">
                  {activeSession ? <span className="status-pill">{activeSession.status === "COMPLETED" ? "Atendimento finalizado" : "Atendimento em andamento"}</span> : null}
                  {selected.wikiPage ? <button className="secondary" type="button" onClick={() => window.location.assign(`/wiki/${selected.wikiPage!.slug}`)}>Abrir Wiki</button> : null}
                  {activeSession?.status === "OPEN" ? <button type="button" disabled={saving || !canCompleteSession} onClick={() => void completeSession()}>Finalizar</button> : <button type="button" disabled={saving} onClick={() => void startSession()}>Iniciar atendimento</button>}
                </div>
              </div>
              {selected.content ? <MarkdownContent content={selected.content} /> : null}
              {canManage ? (
                <div className="service-flow-governance-box">
                  <div>
                    <h3>Governança do fluxo</h3>
                    <p className="muted">{selected.reviewComment || "Sem comentário de aprovação/arquivamento."}</p>
                  </div>
                  <div className="form-grid">
                    <label>Comentário obrigatório<input value={governanceDraft.comment} onChange={(event) => setGovernanceDraft((current) => ({ ...current, comment: event.target.value }))} placeholder="O que mudou ou por que arquivar/publicar?" /></label>
                    <label>Revisar até<input type="date" value={governanceDraft.reviewDueAt} onChange={(event) => setGovernanceDraft((current) => ({ ...current, reviewDueAt: event.target.value }))} /></label>
                  </div>
                  <div className="row-actions">
                    <button type="button" disabled={saving || !governanceDraft.comment.trim()} onClick={() => void decideFlow("publish")}>Publicar versão</button>
                    <button className="secondary" type="button" disabled={saving || !governanceDraft.comment.trim()} onClick={() => void decideFlow("archive")}>Arquivar</button>
                  </div>
                  {selected.revisions?.length ? (
                    <div className="script-history-list">
                      {selected.revisions.map((revision) => (
                        <div className="script-history-item" key={revision.id}>
                          <div>
                            <strong>v{revision.version} / {revision.status}</strong>
                            <span>{revision.author.name} em {formatDateBr(revision.createdAt)}{revision.comment ? ` / ${revision.comment}` : ""}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              ) : null}
              {activeSession ? (
                <section className="service-flow-case-data" aria-labelledby="service-flow-case-data-title">
                  <div className="service-flow-section-heading">
                    <div>
                      <p className="eyebrow">Ficha do atendimento</p>
                      <h3 id="service-flow-case-data-title">Dados compartilhados pelas macros</h3>
                    </div>
                    <div className="row-actions">
                      {caseDataFeedback ? <span className="status-pill">{caseDataFeedback}</span> : null}
                      <button type="button" disabled={saving || !caseDataDirty || activeSession.status === "COMPLETED"} onClick={() => void saveCaseData()}>Salvar dados</button>
                    </div>
                  </div>
                  <div className="service-flow-case-grid">
                    {caseFields.map((field) => (
                      <label key={field.key}>
                        <span>{field.label}{field.required ? <strong aria-label="obrigatório"> *</strong> : null}</span>
                        <input
                          value={caseData[field.key] ?? ""}
                          disabled={activeSession.status === "COMPLETED"}
                          onChange={(event) => {
                            setCaseData((current) => ({ ...current, [field.key]: event.target.value }));
                            setCaseDataDirty(true);
                            setCaseDataFeedback("");
                          }}
                        />
                      </label>
                    ))}
                  </div>
                  {caseFields.length ? null : <p className="muted">Este trecho ainda não exige dados compartilhados.</p>}
                </section>
              ) : null}
              {activeSession?.report ? (
                <section className="service-flow-report" aria-labelledby="service-flow-report-title">
                  <div className="service-flow-section-heading">
                    <div>
                      <p className="eyebrow">Encerramento</p>
                      <h3 id="service-flow-report-title">Resumo para sussurro</h3>
                    </div>
                    <button className={copyFeedback === "session-report" ? "copied" : ""} type="button" onClick={() => void copySessionReport()}>
                      {copyFeedback === "session-report" ? <Check size={18} aria-hidden="true" /> : <Clipboard size={18} aria-hidden="true" />}
                      {copyFeedback === "session-report" ? "Copiado" : "Copiar resumo"}
                    </button>
                  </div>
                  <pre>{activeSession.report}</pre>
                </section>
              ) : null}
              <div className="service-flow-steps">
                {visibleSteps.map((step, index) => {
                  const expanded = openSteps[step.id] ?? index === 0;
                  const nodeKey = nodeKeyFromStep(step);
                  const sessionStep = activeSession?.steps.find((item) => item.stepId === step.id || item.nodeKey === nodeKey);
                  const decisionOptions = optionsFromDecision(step.decision);
                  const snapshot = factsFromSnapshot(sessionStep?.nodeSnapshotJson);
                  const missingRequiredFacts = snapshot.required.filter((key) => !caseData[key]?.trim());
                  const canSkipStep = !activeSession?.version && !step.required && snapshot.type !== "RISK_GATE" && snapshot.required.length === 0;
                  return (
                    <article
                      id={`service-flow-${nodeKey ?? step.id}`}
                      tabIndex={-1}
                      className={`service-flow-step${sessionStep?.status === "DONE" ? " completed" : ""}${sessionStep?.status === "RECONFIRMATION_REQUIRED" ? " reconfirmation-required" : ""}`}
                      key={step.id}
                    >
                      <button className="service-flow-step-header" type="button" onClick={() => setOpenSteps((current) => ({ ...current, [step.id]: !expanded }))}>
                        <span>{index + 1}</span>
                        <strong>{step.title}</strong>
                        <small>{sessionStep ? `${sessionStep.status} · ` : ""}{step.kind}{step.required ? " · obrigatório" : ""}</small>
                      </button>
                      {expanded ? (
                        <div className="service-flow-step-body">
                          {step.body ? <p>{step.body}</p> : null}
                          {missingRequiredFacts.length ? (
                            <div className="service-flow-missing-facts" role="status">
                              <strong>Complete a ficha antes de avançar</strong>
                              <span>{missingRequiredFacts.map(humanizeCaseField).join(" · ")}</span>
                            </div>
                          ) : null}
                          {decisionOptions.length ? (
                            <div className="service-flow-decision">
                              <GitBranch size={16} aria-hidden="true" />
                              {decisionOptions.map((option) => activeSession ? (
                                <button
                                  key={`${option.label}:${option.target ?? "legacy"}`}
                                  type="button"
                                  aria-pressed={stepDecisions[step.id] === option.label}
                                  disabled={saving || activeSession.status === "COMPLETED" || sessionStep?.status === "DONE" || missingRequiredFacts.length > 0}
                                  onClick={() => void saveSessionStep(step, "DONE", option)}
                                >{option.label}</button>
                              ) : <span key={`${option.label}:${option.target ?? "legacy"}`}>{option.label}</span>)}
                            </div>
                          ) : null}
                          {step.scripts.length ? (
                            <div className="service-flow-script-list">
                              {step.scripts.map(({ script }) => (
                                <div className="service-flow-script-card" key={script.id}>
                                  <div>
                                    <strong>{script.title}</strong>
                                    <small>{script.channel} · {script.status} · {script.usageCount} copia(s)</small>
                                  </div>
                                  {script.placeholders?.length ? (
                                    <small className="service-flow-script-ready">
                                      {script.placeholders.every((placeholder) => placeholdersFor(script, caseData)[placeholder])
                                        ? "Macro pronta com os dados da ficha"
                                        : "Complete os campos da ficha para finalizar esta macro"}
                                    </small>
                                  ) : null}
                                  <div className="script-preview">
                                    <MarkdownContent content={renderScript(script.body, placeholdersFor(script, caseData))} />
                                  </div>
                                  <button className={copyFeedback === script.id ? "script-copy-button copied" : "script-copy-button"} type="button" onClick={() => void copyScript(script)} title="Copiar script">
                                    {copyFeedback === script.id ? <Check size={18} aria-hidden="true" /> : <Clipboard size={18} aria-hidden="true" />}
                                    <span className="sr-only">Copiar script</span>
                                  </button>
                                </div>
                              ))}
                            </div>
                          ) : <p className="muted">Sem script relacionado nesta etapa.</p>}
                          {activeSession ? (
                            <div className="service-flow-session-box">
                              <label>
                                Decisão tomada
                                <input value={stepDecisions[step.id] ?? ""} onChange={(event) => setStepDecisions((current) => ({ ...current, [step.id]: event.target.value }))} placeholder="Ex.: reversa, troca, estorno, escalado" />
                              </label>
                              <label>
                                Nota interna
                                <textarea rows={3} value={stepNotes[step.id] ?? ""} onChange={(event) => setStepNotes((current) => ({ ...current, [step.id]: event.target.value }))} placeholder="Registre o contexto para auditoria do atendimento." />
                              </label>
                              <div className="row-actions">
                                {sessionStep && sessionStep.status !== "PENDING" ? (
                                  <button className="secondary" type="button" disabled={saving || activeSession.status === "COMPLETED"} onClick={() => setRewindTarget(step)}>
                                    <RotateCcw size={16} aria-hidden="true" /> Retomar daqui
                                  </button>
                                ) : null}
                                {canSkipStep ? <button className="secondary" type="button" disabled={saving || activeSession.status === "COMPLETED"} onClick={() => void saveSessionStep(step, "SKIPPED")}>Pular</button> : null}
                                <button type="button" disabled={saving || activeSession.status === "COMPLETED" || missingRequiredFacts.length > 0} onClick={() => void saveSessionStep(step, "DONE")}>Concluir etapa</button>
                              </div>
                            </div>
                          ) : null}
                        </div>
                      ) : null}
                    </article>
                  );
                })}
              </div>
              <div className="service-flow-personal-scripts">
                <div>
                  <p className="eyebrow">Privado</p>
                  <h3>Meus scripts</h3>
                  <p className="muted">Textos pessoais aparecem só para você e podem ser sugeridos para virar canon da Scriptoteca.</p>
                </div>
                <div className="service-flow-script-list">
                  {visiblePersonalScripts.map((script) => {
                    const key = `personal:${script.id}`;
                    return (
                      <div className="service-flow-script-card" key={script.id}>
                        <div>
                          <strong>{script.title}</strong>
                          <small>{script.channel} · {script.flows.length ? script.flows.map((flow) => flow.title).join(", ") : "sem fluxo fixo"}</small>
                        </div>
                        {script.placeholders?.length ? (
                          <small className="service-flow-script-ready">
                            {script.placeholders.every((placeholder) => placeholdersFor(script, caseData)[placeholder])
                              ? "Macro pronta com os dados da ficha"
                              : "Complete os campos da ficha para finalizar esta macro"}
                          </small>
                        ) : null}
                        <div className="script-preview">
                          <MarkdownContent content={renderScript(script.body, placeholdersFor(script, caseData))} />
                        </div>
                        <div className="row-actions">
                          <button className={copyFeedback === key ? "script-copy-button copied" : "script-copy-button"} type="button" onClick={() => void copyPersonalScript(script)} title="Copiar script pessoal">
                            {copyFeedback === key ? <Check size={18} aria-hidden="true" /> : <Clipboard size={18} aria-hidden="true" />}
                            <span className="sr-only">Copiar script pessoal</span>
                          </button>
                          <button className="secondary" type="button" disabled={saving || Boolean(script.suggestion)} onClick={() => void suggestPersonalScript(script.id)}>
                            {script.suggestion ? "Sugerido" : "Sugerir canon"}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  {visiblePersonalScripts.length ? null : <p className="muted">Nenhum script pessoal para este fluxo.</p>}
                </div>
                <form className="service-flow-personal-form" onSubmit={createPersonalScript}>
                  <div className="form-grid">
                    <label>Título<input value={personalDraft.title} onChange={(event) => setPersonalDraft((current) => ({ ...current, title: event.target.value }))} /></label>
                    <label>Canal<select value={personalDraft.channel} onChange={(event) => setPersonalDraft((current) => ({ ...current, channel: event.target.value }))}>{["WHATSAPP", "EMAIL", "PHONE", "INSTAGRAM", "INTERNAL"].map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
                    <label>Fluxos relacionados<select multiple value={personalDraft.flowIds} onChange={(event) => setPersonalDraft((current) => ({ ...current, flowIds: Array.from(event.target.selectedOptions).map((option) => option.value) }))}>{flows.map((flow) => <option key={flow.id} value={flow.id}>{flow.title}</option>)}</select></label>
                    <label>Tags<input value={personalDraft.tags} onChange={(event) => setPersonalDraft((current) => ({ ...current, tags: event.target.value }))} placeholder="saude, troca, prazo" /></label>
                  </div>
                  <MarkdownEditor
                    label="Texto pessoal"
                    rows={4}
                    value={personalDraft.body}
                    onChange={(body) => setPersonalDraft((current) => ({ ...current, body }))}
                    onUploadImage={(file) => uploadOperationalImage(file, "service-flow", selected?.id)}
                  />
                  <button disabled={saving || !personalDraft.title.trim() || !personalDraft.body.trim()}>Salvar script pessoal</button>
                </form>
              </div>
            </>
          ) : <OperationalState state="empty" title="Selecione um fluxo" />}
        </section>
      </div>
      {rewindTarget ? (
        <div
          className="service-flow-dialog-backdrop"
          role="presentation"
          onClick={(event) => { if (event.target === event.currentTarget && !saving) setRewindTarget(null); }}
          onKeyDown={(event) => { if (event.key === "Escape" && !saving) setRewindTarget(null); }}
        >
          <section className="service-flow-dialog" role="dialog" aria-modal="true" aria-labelledby="service-flow-rewind-title" onClick={(event) => event.stopPropagation()}>
            <div>
              <p className="eyebrow">Retomar atendimento</p>
              <h2 id="service-flow-rewind-title">{rewindTarget.title}</h2>
              <p className="muted">Escolha como tratar o caminho registrado depois desta etapa.</p>
            </div>
            <button autoFocus type="button" disabled={saving} onClick={() => void rewindSessionStep("RECONFIRM_FOLLOWING")}>
              Editar e reconfirmar caminho
              <small>Preserva decisões e notas posteriores, mas exige uma nova confirmação de cada etapa.</small>
            </button>
            <button className="danger" type="button" disabled={saving} onClick={() => void rewindSessionStep("DISCARD_FOLLOWING")}>
              Descartar etapas seguintes
              <small>Remove o caminho posterior desta execução e permite seguir por uma nova decisão.</small>
            </button>
            <button className="secondary" type="button" disabled={saving} onClick={() => setRewindTarget(null)}>Cancelar</button>
          </section>
        </div>
      ) : null}
      {canManage ? (
        <section className="panel">
          <div>
            <p className="eyebrow">Gestão</p>
            <h2>Novo fluxo de atendimento</h2>
          </div>
          <form className="content-stack" onSubmit={createFlow}>
            <div className="form-grid">
              <label>Título<input value={flowDraft.title} onChange={(event) => setFlowDraft((current) => ({ ...current, title: event.target.value }))} /></label>
              <label>Status<select value={flowDraft.status} onChange={(event) => setFlowDraft((current) => ({ ...current, status: event.target.value }))}>{flowStatuses.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
              <label>Tags<input value={flowDraft.tags} onChange={(event) => setFlowDraft((current) => ({ ...current, tags: event.target.value }))} placeholder="sac, saude, reversa" /></label>
              <label>Resumo<input value={flowDraft.summary} onChange={(event) => setFlowDraft((current) => ({ ...current, summary: event.target.value }))} /></label>
            </div>
            <MarkdownEditor
              label="Conteúdo de apoio"
              rows={5}
              value={flowDraft.content}
              onChange={(content) => setFlowDraft((current) => ({ ...current, content }))}
              onUploadImage={(file) => uploadOperationalImage(file, "service-flow", selected?.id)}
            />
            <div className="service-flow-step-editor">
              {stepDrafts.map((step, index) => (
                <div className="service-flow-step-draft" key={index}>
                  <div className="form-grid">
                    <label>Etapa<input value={step.title} onChange={(event) => updateStep(index, { title: event.target.value })} /></label>
                    <label>Tipo<select value={step.kind} onChange={(event) => updateStep(index, { kind: event.target.value })}>{stepKinds.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
                  </div>
                  <MarkdownEditor
                    label="Orientação da etapa"
                    rows={4}
                    value={step.body}
                    onChange={(body) => updateStep(index, { body })}
                    onUploadImage={(file) => uploadOperationalImage(file, "service-flow", selected?.id)}
                  />
                  {step.kind === "YES_NO" ? (
                    <div className="form-grid">
                      <label>Se sim<input value={step.yesLabel} onChange={(event) => updateStep(index, { yesLabel: event.target.value })} placeholder="Seguir para reversa/troca" /></label>
                      <label>Se não<input value={step.noLabel} onChange={(event) => updateStep(index, { noLabel: event.target.value })} placeholder="Manter orientação ou escalar" /></label>
                    </div>
                  ) : null}
                  {step.kind === "DECISION" || step.kind === "CHECKLIST" ? (
                    <label>Opções<input value={step.options} onChange={(event) => updateStep(index, { options: event.target.value })} placeholder="estorno, troca, escalar supervisor" /></label>
                  ) : null}
                  <label>Scripts relacionados<select multiple value={step.scriptIds} onChange={(event) => updateStep(index, { scriptIds: Array.from(event.target.selectedOptions).map((option) => option.value) })}>{scripts.map((script) => <option key={script.id} value={script.id}>{script.title}</option>)}</select></label>
                  <div className="service-flow-recommendations">
                    <strong>Recomendados</strong>
                    {recommendedScriptsFor(step).map((script) => (
                      <button key={script.id} className="secondary small" type="button" onClick={() => updateStep(index, { scriptIds: [...step.scriptIds, script.id] })}>
                        {script.title}
                      </button>
                    ))}
                    {recommendedScriptsFor(step).length ? null : <span className="muted">Preencha título, orientação ou tags para sugerir scripts.</span>}
                  </div>
                </div>
              ))}
              <button className="secondary" type="button" onClick={() => setStepDrafts((current) => [...current, emptyStepDraft()])}><Plus size={16} aria-hidden="true" /> Adicionar etapa</button>
            </div>
            <button disabled={saving || !flowDraft.title}>Criar fluxo</button>
          </form>
        </section>
      ) : null}
    </div>
  );
}
