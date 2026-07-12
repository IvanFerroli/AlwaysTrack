import { getPlanUpdateLabel, type PlanUpdate } from "./plan-updates.js";

export function renderPlanUpdate(container: HTMLElement, update?: PlanUpdate): void {
  container.replaceChildren();
  container.hidden = !update;
  if (!update) return;

  const heading = document.createElement("strong");
  heading.textContent = getPlanUpdateLabel(update.kind);
  const message = document.createElement("span");
  message.textContent = update.message;
  container.dataset.kind = update.kind;
  container.append(heading, message);

  if (update.copiedMessageBecameObsolete) {
    const warning = document.createElement("span");
    warning.className = "obsolete-warning";
    warning.textContent = "A mensagem copiada anteriormente ficou obsoleta. Copie a nova versao antes de responder.";
    container.append(warning);
  }
}
