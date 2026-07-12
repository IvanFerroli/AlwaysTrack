import { possibilityStatus, visiblePossibilities, type Possibility } from "./possibilities.js";

export function renderPossibilities(container: HTMLElement, possibilities: Possibility[]): void {
  container.replaceChildren();
  for (const possibility of visiblePossibilities(possibilities)) {
    const article = document.createElement("article");
    article.className = `possibility possibility-${possibility.state.toLowerCase()}`;
    const heading = document.createElement("h3");
    heading.textContent = possibility.title;
    const status = document.createElement("span");
    status.className = "possibility-status";
    status.textContent = possibilityStatus(possibility);
    const list = document.createElement("dl");
    const fields: Array<[string, string]> = [
      ["Quando", possibility.condition], ["Proximo movimento", possibility.action],
      ["Mensagem", possibility.message], ["Dependencia", possibility.dependency ?? "Nenhuma"],
      ["Risco", possibility.risk.toLowerCase()]
    ];
    for (const [label, value] of fields) {
      const term = document.createElement("dt"); term.textContent = label;
      const description = document.createElement("dd"); description.textContent = value;
      list.append(term, description);
    }
    article.append(heading, status, list);
    container.append(article);
  }
}
