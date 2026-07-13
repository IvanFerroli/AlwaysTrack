import type { EvidenceFact } from "@alwaystrack/shared";

export interface PartialSummaryRevision { revision: number; lines: string[]; factIds: string[]; createdAt: string }
export interface PartialSummaryHistory { current?: PartialSummaryRevision; revisions: PartialSummaryRevision[] }

const categories = [
  { label: "Demanda", keys: ["conversation.intentText"] },
  { label: "Pedido", keys: ["order.primaryId", "order.status"] },
  { label: "Pagamento", keys: ["payment.status", "payment.method"] },
  { label: "Logistica", keys: ["logistics.status", "logistics.forecast", "logistics.carrier"] },
  { label: "Divergencia", keys: ["risk.dataMismatch"] },
  { label: "Tratativa", keys: ["treatment.openTickets", "treatment.acareacao"] },
  { label: "Pendencia", keys: ["risk.manualConfirmationRequired"] }
] as const;

export function buildPartialSummary(facts: readonly EvidenceFact[]): { lines: string[]; factIds: string[] } | undefined {
  const selected: EvidenceFact[] = [];
  const lines: string[] = [];
  for (const category of categories) {
    const matches = facts.filter((fact) => (category.keys as readonly string[]).includes(fact.key)).sort((a, b) => b.observedAt.localeCompare(a.observedAt) || a.id.localeCompare(b.id));
    if (!matches.length) continue;
    selected.push(...matches);
    lines.push(`${category.label}: ${matches.map((fact) => display(fact.normalizedValue)).join("; ")}.`);
    if (lines.length === 5) break;
  }
  if (lines.length < 3) return undefined;
  return { lines, factIds: [...new Set(selected.map((fact) => fact.id))] };
}

export function revisePartialSummary(history: PartialSummaryHistory, facts: readonly EvidenceFact[], createdAt: string): PartialSummaryHistory {
  const built = buildPartialSummary(facts);
  if (!built) return history;
  if (history.current && JSON.stringify(history.current.lines) === JSON.stringify(built.lines)) return history;
  const revision = { ...built, revision: (history.current?.revision ?? 0) + 1, createdAt };
  return { current: revision, revisions: [...history.revisions, revision] };
}

function display(value: unknown): string {
  if (Array.isArray(value)) return value.map(display).join(", ");
  if (typeof value === "object" && value !== null) return JSON.stringify(value);
  return String(value);
}
