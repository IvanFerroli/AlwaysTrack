import { copyActionContent, type CopyAction, type CopyActionIntent } from "./copy-actions.js";

export function renderCopyActions(container: HTMLElement, actions: CopyAction[], emit: (intent: CopyActionIntent) => void): void {
  container.replaceChildren();
  const status = document.createElement("p");
  status.className = "copy-status";
  status.setAttribute("role", "status");
  status.setAttribute("aria-live", "polite");
  status.setAttribute("aria-atomic", "true");

  const actionList = document.createElement("div");
  actionList.className = "copy-actions";
  for (const action of actions) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "copy-button";
    button.dataset.copyKind = action.kind;
    button.textContent = action.obsolete ? `${action.label} (obsoleta)` : action.label;
    button.disabled = action.obsolete === true;
    button.addEventListener("click", async () => {
      try {
        emit(await copyActionContent(action));
        status.textContent = `${action.label} copiado. Nenhum conteudo foi enviado.`;
      } catch {
        status.textContent = "Nao foi possivel copiar. Verifique a permissao do navegador.";
      }
    });
    actionList.append(button);
  }
  container.append(actionList, status);
}
