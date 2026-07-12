export type PossibilityState = "AVAILABLE" | "UNKNOWN" | "IMPOSSIBLE" | "CONFLICTING";

export interface Possibility {
  id: string;
  title: string;
  condition: string;
  action: string;
  message: string;
  dependency?: string;
  risk: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  state: PossibilityState;
}

export function visiblePossibilities(possibilities: Possibility[]): Possibility[] {
  return possibilities.filter((possibility) => possibility.state !== "IMPOSSIBLE");
}

export function possibilityStatus(possibility: Possibility): string {
  if (possibility.state === "UNKNOWN") return "Pendente de confirmacao";
  if (possibility.state === "CONFLICTING") return "Bloqueada por conflito";
  return "Disponivel";
}
