import { createInterventionIntent, getInterventionPresentation, type InterventionIntent, type InterventionViewState } from "./intervention.js";

export function renderIntervention(
  container: HTMLElement,
  state: InterventionViewState,
  emit: (intent: InterventionIntent) => void
): void {
  const presentation = getInterventionPresentation(state.state);
  container.replaceChildren();
  container.hidden = false;

  const heading = document.createElement("h2");
  heading.textContent = `${state.connectorLabel}: ${presentation.title}`;
  const message = document.createElement("p");
  message.textContent = presentation.message;
  const actions = document.createElement("div");
  actions.className = "intervention-actions";

  for (const item of presentation.actions) {
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.action = item.action;
    button.textContent = item.label;
    button.addEventListener("click", () => emit(createInterventionIntent(state.interventionId, item.action)));
    actions.append(button);
  }

  container.append(heading, message, actions);
}
