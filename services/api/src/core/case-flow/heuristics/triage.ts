import type { FlowCandidate, HeuristicResult } from "./engine.js";

export type TriageAnswer = { factKey: string; value: unknown };
export type TriageQuestion = { id: string; factKey: string; prompt: string; candidateFlowIds: string[] };
export type TriageResult = HeuristicResult & { lowConfidence: boolean; originalPrimary: FlowCandidate | null; questions: TriageQuestion[] };

export const DEFAULT_LOW_CONFIDENCE_THRESHOLD = 0.6;
const DEFAULT_PROMPTS: Readonly<Record<string, string>> = {
  "logistics.status": "Qual e o status atual da entrega?",
  "payment.status": "Qual e o status do pagamento?",
  "invoice.status": "Qual e o status da nota fiscal?",
  "logistics.returnState": "Ha uma devolucao ou logistica reversa em andamento?",
  "risk.money": "O caso envolve cobranca, estorno ou outro valor financeiro?"
};

export function applyLowConfidenceTriage(result: HeuristicResult, options: { threshold?: number; triageFlowId?: string; maxCandidates?: number; maxQuestions?: number; prompts?: Readonly<Record<string, string>> } = {}): TriageResult {
  const threshold = options.threshold ?? DEFAULT_LOW_CONFIDENCE_THRESHOLD;
  if (!Number.isFinite(threshold) || threshold < 0 || threshold > 1) throw new RangeError("threshold must be between 0 and 1");
  const lowConfidence = !result.primary || result.primary.confidence < threshold;
  if (!lowConfidence) return { ...result, lowConfidence: false, originalPrimary: result.primary, questions: [] };
  const preserved = result.candidates.slice(0, options.maxCandidates ?? 3);
  const questionKeys = [...new Set(preserved.flatMap((candidate) => candidate.missingFactKeys))];
  const prompts = { ...DEFAULT_PROMPTS, ...options.prompts };
  const questions = questionKeys.slice(0, options.maxQuestions ?? 3).map((factKey) => ({ id: `fact:${factKey}`, factKey, prompt: prompts[factKey] ?? `Qual informacao confirma ${factKey}?`, candidateFlowIds: preserved.filter((candidate) => candidate.missingFactKeys.includes(factKey)).map((candidate) => candidate.flowId) }));
  const triage: FlowCandidate = { flowId: options.triageFlowId ?? "GENERIC_TRIAGE", score: 0, confidence: 1, role: "PRIMARY", matchedRules: [], supportingFactIds: [], missingFactKeys: questionKeys, producedTags: ["LOW_CONFIDENCE"], reasons: ["LOW_CONFIDENCE_TRIAGE"] };
  const alternatives = preserved.map((candidate) => ({ ...candidate, role: "SECONDARY" as const }));
  return { primary: triage, secondary: alternatives, riskGates: result.riskGates, candidates: alternatives, lowConfidence: true, originalPrimary: result.primary, questions };
}

export function triageAnswersToFacts(answers: readonly TriageAnswer[], now = new Date()) {
  return answers.map((answer, index) => ({ id: `triage-answer-${index + 1}`, key: answer.factKey, normalizedValue: answer.value, sourceSystem: "MANUAL", observedAt: now }));
}
