import { diagnoseCurrentBrowser, type BrowserDiagnostics } from "../background/browser-diagnostics.js";
import { renderCopyActions } from "./actions/copy-actions-view.js";
import type { CopyAction, CopyActionIntent } from "./actions/copy-actions.js";
import { isEditableTarget, shortcutOptionIndex, shortcutStorageKey, type ShortcutMode } from "./actions/shortcuts.js";
import { renderDetectedFlows } from "./detected-flows/detected-flows-view.js";
import type { DetectedFlow, FlowOverrideIntent } from "./detected-flows/detected-flows.js";
import { isInterventionViewState, type InterventionIntent, type InterventionViewState } from "./interventions/intervention.js";
import { renderIntervention } from "./interventions/intervention-view.js";
import { renderPlanUpdate } from "./plan-updates/plan-updates-view.js";
import { shouldKeepVisibleStep, type PlanUpdate } from "./plan-updates/plan-updates.js";
import { renderPossibilities } from "./possibilities/possibilities-view.js";
import type { Possibility } from "./possibilities/possibilities.js";
import { renderStepper } from "./stepper/stepper-view.js";
import type { GuidedStep, StepIntent } from "./stepper/stepper.js";

interface SidePanelState {
  case: { customer: string; order: string; channel: string; caseType: string; risk: string; completion: number };
  summary: string;
  connectors: Array<{ label: string; status: string }>;
  step: GuidedStep;
  flows: DetectedFlow[];
  possibilities: Possibility[];
  copyActions: CopyAction[];
  planUpdate?: PlanUpdate;
}

type PanelIntent = StepIntent | FlowOverrideIntent | CopyActionIntent | InterventionIntent | { type: "CASE_FLOW_REFRESH_REQUESTED" | "CASE_FLOW_CANCEL_REQUESTED" };

const demoState: SidePanelState = {
  case: { customer: "Mariana Costa", order: "O123456", channel: "WhatsApp", caseType: "Posicao de pedido", risk: "Medio", completion: 68 },
  summary: "Cliente solicita posicao do pedido. Pagamento aprovado e envio localizado. A consulta fiscal continua em andamento.",
  connectors: [{ label: "AlwaysChat", status: "Concluido" }, { label: "Rastreio", status: "Concluido" }, { label: "Yampi", status: "Consultando" }, { label: "OMIE", status: "Parcial" }],
  step: {
    id: "confirm-logistics", position: 2, total: 4, title: "Confirmar status e previsao",
    instruction: "O envio foi localizado. Confirme a situacao com o cliente antes de orientar o proximo movimento.",
    evidence: [{ label: "Status", value: "Em transporte" }, { label: "Previsao", value: "14/07" }, { label: "Transportadora", value: "Loggi" }],
    message: "Localizei seu pedido em transporte, com previsao de entrega para 14/07. Vou acompanhar a atualizacao com voce.",
    options: [{ id: "within-forecast", label: "Cliente aceita aguardar a previsao" }, { id: "forecast-expired", label: "A previsao ja venceu" }, { id: "tracking-conflict", label: "O rastreio esta divergente" }],
    previousStepAvailable: true
  },
  flows: [
    { id: "order-position", label: "Posicao de pedido", confidence: 0.92, role: "PRIMARY", matchedRules: ["pedido localizado", "envio ativo"], supportingFacts: [{ id: "f1", label: "Pagamento aprovado" }, { id: "f2", label: "Rastreio ativo" }], risk: "LOW" },
    { id: "logistics-delay", label: "Atraso logistico", confidence: 0.54, role: "SECONDARY", matchedRules: ["consulta de previsao"], supportingFacts: [{ id: "f2", label: "Rastreio ativo" }], risk: "MEDIUM" }
  ],
  possibilities: [
    { id: "on-time", title: "Entrega dentro da previsao", condition: "Previsao ainda valida", action: "Orientar acompanhamento", message: "Informar data e manter acompanhamento", risk: "LOW", state: "AVAILABLE" },
    { id: "late", title: "Previsao vencida", condition: "Data de entrega passou", action: "Abrir triagem de atraso", message: "Reconhecer atraso sem prometer nova data", dependency: "Confirmar data atual", risk: "MEDIUM", state: "UNKNOWN" },
    { id: "conflict", title: "Divergencia no rastreio", condition: "Fontes apresentam estados diferentes", action: "Resolver a divergencia", message: "Bloqueada ate confirmar a fonte correta", dependency: "Revisar evidencias", risk: "HIGH", state: "CONFLICTING" }
  ],
  copyActions: [
    { id: "message-2", kind: "MESSAGE", label: "Copiar mensagem", content: "Localizei seu pedido em transporte, com previsao de entrega para 14/07. Vou acompanhar a atualizacao com voce." },
    { id: "whisper-2", kind: "WHISPER", label: "Copiar sussurro", content: "Pedido em transporte; previsao 14/07; confirmar aceite do cliente." },
    { id: "slack-2", kind: "SLACK_DRAFT", label: "Copiar rascunho Slack", content: "Pedido O123456 em transporte. Aguardando confirmacao do cliente." },
    { id: "checklist-2", kind: "CHECKLIST", label: "Copiar checklist", content: "- Confirmar previsao\n- Registrar retorno do cliente\n- Revisar rastreio" }
  ]
};

const byId = <T extends HTMLElement>(id: string): T | null => document.querySelector<T>(`#${id}`);
const hostStatus = byId<HTMLElement>("host-status");
const diagnosticsElement = byId<HTMLElement>("browser-diagnostics");
const interventionElement = byId<HTMLElement>("intervention");
const shortcutSelect = byId<HTMLSelectElement>("shortcut-mode");
let currentState = demoState;

function emit(intent: PanelIntent): void {
  void chrome.runtime.sendMessage(intent);
}

function renderDiagnostics(diagnostics: BrowserDiagnostics): void {
  if (!diagnosticsElement) return;
  const browserLabel = diagnostics.browser === "CHROME" ? "Chrome" : diagnostics.browser === "EDGE" ? "Edge" : "Navegador nao identificado";
  const supportLabel = diagnostics.support === "REFERENCE" ? "navegador de referencia" : diagnostics.support === "SECONDARY" ? "compatibilidade secundaria" : "compatibilidade nao confirmada";
  const profileLabel = diagnostics.profile === "PAIRED" ? "Perfil de trabalho pareado" : diagnostics.profile === "MISMATCH" ? "Perfil diferente do pareado" : "Perfil de trabalho nao confirmado";
  diagnosticsElement.textContent = `${browserLabel}: ${supportLabel}. ${profileLabel}.`;
  diagnosticsElement.dataset.profile = diagnostics.profile;
}

function renderCase(state: SidePanelState): void {
  const caseHead = byId<HTMLElement>("case-head");
  if (caseHead) {
    caseHead.replaceChildren();
    for (const [label, value] of [["Cliente", state.case.customer], ["Pedido", state.case.order], ["Canal", state.case.channel], ["Tipo", state.case.caseType], ["Risco", state.case.risk]]) {
      const item = document.createElement("div");
      const key = document.createElement("span"); key.textContent = label;
      const content = document.createElement("strong"); content.textContent = value;
      item.append(key, content); caseHead.append(item);
    }
  }
  const completion = byId<HTMLElement>("completion-bar");
  if (completion) {
    completion.style.width = `${Math.max(0, Math.min(100, state.case.completion))}%`;
    completion.parentElement?.setAttribute("aria-valuenow", String(state.case.completion));
  }
}

function renderSupporting(state: SidePanelState): void {
  const summary = byId<HTMLElement>("summary");
  if (summary) summary.textContent = state.summary;
  const connectors = byId<HTMLUListElement>("connectors");
  if (connectors) {
    connectors.replaceChildren();
    for (const connector of state.connectors) {
      const item = document.createElement("li");
      const label = document.createElement("span"); label.textContent = connector.label;
      const status = document.createElement("strong"); status.textContent = connector.status;
      item.append(label, status); connectors.append(item);
    }
  }
}

function renderState(state: SidePanelState): void {
  const keepVisibleStep = state.planUpdate
    ? shouldKeepVisibleStep(state.planUpdate, state.step.id === currentState.step.id)
    : false;
  const visibleState = keepVisibleStep ? { ...state, step: currentState.step } : state;
  currentState = visibleState;
  renderCase(visibleState);
  renderSupporting(visibleState);
  const stepper = byId<HTMLElement>("stepper"); if (stepper) renderStepper(stepper, visibleState.step, emit);
  const actions = byId<HTMLElement>("copy-actions"); if (actions) renderCopyActions(actions, visibleState.copyActions, emit);
  const flows = byId<HTMLElement>("detected-flows"); if (flows) renderDetectedFlows(flows, visibleState.flows, emit);
  const possibilities = byId<HTMLElement>("possibilities"); if (possibilities) renderPossibilities(possibilities, visibleState.possibilities);
  const update = byId<HTMLElement>("plan-update"); if (update) renderPlanUpdate(update, visibleState.planUpdate);
}

function savedShortcutMode(): ShortcutMode {
  const value = localStorage.getItem(shortcutStorageKey);
  return value === "ALT" || value === "DISABLED" ? value : "DIRECT";
}

renderDiagnostics(diagnoseCurrentBrowser());
renderState(demoState);
if (shortcutSelect) {
  shortcutSelect.value = savedShortcutMode();
  shortcutSelect.addEventListener("change", () => localStorage.setItem(shortcutStorageKey, shortcutSelect.value));
}
byId<HTMLButtonElement>("refresh-case")?.addEventListener("click", () => emit({ type: "CASE_FLOW_REFRESH_REQUESTED" }));
byId<HTMLButtonElement>("cancel-case")?.addEventListener("click", () => emit({ type: "CASE_FLOW_CANCEL_REQUESTED" }));

document.addEventListener("keydown", (event) => {
  if (isEditableTarget(event.target)) return;
  const index = shortcutOptionIndex(event, savedShortcutMode());
  const option = index === null ? undefined : currentState.step.options[index];
  if (!option) return;
  event.preventDefault();
  emit({ type: "CASE_FLOW_STEP_CHOSEN", payload: { stepId: currentState.step.id, optionId: option.id } });
});

chrome.runtime.onMessage.addListener((message) => {
  const candidate = message as { type?: string; state?: string; panel?: SidePanelState; intervention?: unknown; diagnostics?: BrowserDiagnostics };
  if (candidate.type === "COMPANION_CONNECTION_STATE" && hostStatus) hostStatus.textContent = candidate.state === "CONNECTED" ? "Companion conectado" : "Companion indisponivel";
  if (candidate.type === "BROWSER_DIAGNOSTICS" && candidate.diagnostics) renderDiagnostics(candidate.diagnostics);
  if (candidate.type === "CASE_FLOW_PANEL_STATE" && candidate.panel) renderState(candidate.panel);
  if (candidate.type === "INTERVENTION_REQUIRED" && isInterventionViewState(candidate.intervention) && interventionElement) renderIntervention(interventionElement, candidate.intervention, emit);
});

export function showIntervention(state: InterventionViewState): void {
  if (interventionElement) renderIntervention(interventionElement, state, emit);
}
