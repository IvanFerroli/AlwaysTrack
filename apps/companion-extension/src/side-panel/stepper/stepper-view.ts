import { createStepBackIntent, createStepChoiceIntent, type GuidedStep, type StepIntent } from "./stepper.js";

function text(tag: keyof HTMLElementTagNameMap, value: string, className?: string): HTMLElement {
  const element = document.createElement(tag);
  element.textContent = value;
  if (className) element.className = className;
  return element;
}

export function renderStepper(container: HTMLElement, step: GuidedStep, emit: (intent: StepIntent) => void): void {
  container.replaceChildren();
  container.setAttribute("aria-labelledby", "current-step-title");

  const heading = text("div", `Passo ${step.position} de ${step.total}`, "section-label");
  const title = text("h2", step.title);
  title.id = "current-step-title";
  const instruction = text("p", step.instruction, "step-instruction");

  const evidence = document.createElement("dl");
  evidence.className = "evidence-list";
  for (const item of step.evidence) evidence.append(text("dt", item.label), text("dd", item.value));

  const content = document.createDocumentFragment();
  content.append(heading, title, instruction, evidence);
  if (step.message) {
    const message = text("blockquote", step.message, "prepared-message");
    message.setAttribute("aria-label", "Mensagem preparada");
    content.append(message);
  }

  const options = document.createElement("div");
  options.className = "step-options";
  options.setAttribute("role", "group");
  options.setAttribute("aria-label", "Opcoes do passo atual");
  step.options.forEach((option, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "choice-button";
    button.dataset.optionIndex = String(index + 1);
    button.append(text("kbd", String(index + 1)), text("span", option.label));
    button.addEventListener("click", () => emit(createStepChoiceIntent(step.id, option.id)));
    options.append(button);
  });

  const back = document.createElement("button");
  back.type = "button";
  back.className = "text-button";
  back.disabled = !step.previousStepAvailable;
  back.textContent = "Voltar ao passo anterior";
  back.addEventListener("click", () => emit(createStepBackIntent(step.id)));
  content.append(options, back);
  container.append(content);
}
