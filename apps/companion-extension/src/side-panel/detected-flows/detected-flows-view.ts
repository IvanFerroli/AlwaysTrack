import { createFlowOverrideIntent, needsFlowTriage, type DetectedFlow, type FlowOverrideIntent } from "./detected-flows.js";

export function renderDetectedFlows(container: HTMLElement, flows: DetectedFlow[], emit: (intent: FlowOverrideIntent) => void): void {
  container.replaceChildren();
  if (needsFlowTriage(flows)) {
    const alert = document.createElement("p");
    alert.className = "inline-alert";
    alert.textContent = "Confianca baixa. Revise as alternativas antes de continuar.";
    container.append(alert);
  }

  for (const flow of flows) {
    const details = document.createElement("details");
    details.className = `flow-card flow-${flow.role.toLowerCase()}`;
    if (flow.role === "PRIMARY") details.open = true;
    const summary = document.createElement("summary");
    const label = document.createElement("strong");
    label.textContent = flow.label;
    const confidence = document.createElement("span");
    confidence.textContent = `${Math.round(flow.confidence * 100)}%`;
    summary.append(label, confidence);

    const reason = document.createElement("p");
    reason.textContent = flow.matchedRules.length ? `Razoes: ${flow.matchedRules.join(", ")}` : "Sem regra conclusiva.";
    const evidence = document.createElement("p");
    evidence.textContent = flow.supportingFacts.length ? `Evidencias: ${flow.supportingFacts.map((fact) => fact.label).join(", ")}` : "Evidencias insuficientes.";
    const risk = document.createElement("p");
    risk.className = `risk-label risk-${flow.risk.toLowerCase()}`;
    risk.textContent = `Risco ${flow.risk.toLowerCase()}`;
    details.append(summary, reason, evidence, risk);

    if (flow.role === "SECONDARY") {
      const override = document.createElement("button");
      override.type = "button";
      override.className = "secondary-button";
      override.textContent = "Usar este fluxo";
      override.addEventListener("click", () => emit(createFlowOverrideIntent(flow.id)));
      details.append(override);
    }
    container.append(details);
  }
}
