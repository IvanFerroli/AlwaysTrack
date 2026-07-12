import { diagnoseCurrentBrowser, type BrowserDiagnostics } from "../background/browser-diagnostics.js";
import { isInterventionViewState, type InterventionViewState } from "./interventions/intervention.js";
import { renderIntervention } from "./interventions/intervention-view.js";

const hostStatus = document.querySelector<HTMLElement>("#host-status");
const diagnosticsElement = document.querySelector<HTMLElement>("#browser-diagnostics");
const interventionElement = document.querySelector<HTMLElement>("#intervention");
if (hostStatus) hostStatus.textContent = "Companion indisponivel";

function renderDiagnostics(diagnostics: BrowserDiagnostics): void {
  if (!diagnosticsElement) return;
  const browserLabel = diagnostics.browser === "CHROME" ? "Chrome" : diagnostics.browser === "EDGE" ? "Edge" : "Navegador nao identificado";
  const supportLabel = diagnostics.support === "REFERENCE" ? "navegador de referencia" : diagnostics.support === "SECONDARY" ? "compatibilidade secundaria" : "compatibilidade nao confirmada";
  const profileLabel = diagnostics.profile === "PAIRED" ? "Perfil de trabalho pareado" : diagnostics.profile === "MISMATCH" ? "Perfil diferente do pareado" : "Perfil de trabalho nao confirmado";
  diagnosticsElement.textContent = `${browserLabel}: ${supportLabel}. ${profileLabel}.`;
  diagnosticsElement.dataset.profile = diagnostics.profile;
}

renderDiagnostics(diagnoseCurrentBrowser());

chrome.runtime.onMessage.addListener((message) => {
  const candidate = message as { type?: string; state?: string; intervention?: unknown; diagnostics?: BrowserDiagnostics };
  if (candidate.type === "COMPANION_CONNECTION_STATE" && hostStatus) {
    hostStatus.textContent = candidate.state === "CONNECTED" ? "Companion conectado" : "Companion indisponivel";
  }
  if (candidate.type === "BROWSER_DIAGNOSTICS" && candidate.diagnostics) renderDiagnostics(candidate.diagnostics);
  if (candidate.type === "INTERVENTION_REQUIRED" && isInterventionViewState(candidate.intervention) && interventionElement) {
    renderIntervention(interventionElement, candidate.intervention, (intent) => void chrome.runtime.sendMessage(intent));
  }
});

export function showIntervention(state: InterventionViewState): void {
  if (interventionElement) renderIntervention(interventionElement, state, (intent) => void chrome.runtime.sendMessage(intent));
}

export {};
