export const interventionStates = [
  "BLOCKED_AUTH",
  "BLOCKED_CAPTCHA",
  "BLOCKED_2FA",
  "FAILED_SELECTOR_DRIFT",
  "FAILED_UNEXPECTED_PAGE",
  "FAILED_TIMEOUT"
] as const;

export type InterventionState = (typeof interventionStates)[number];
export type InterventionIntentAction = "FOCUS_TAB" | "CONTINUE" | "SKIP" | "RETRY" | "MARK_UNAVAILABLE" | "USE_MANUAL_INPUT" | "OPEN_DIAGNOSTICS";

export interface InterventionViewState {
  interventionId: string;
  connectorLabel: string;
  state: InterventionState;
}

export interface InterventionIntent {
  type: "INTERVENTION_INTENT";
  payload: {
    interventionId: string;
    action: InterventionIntentAction;
  };
}

interface InterventionPresentation {
  title: string;
  message: string;
  actions: ReadonlyArray<{ action: InterventionIntentAction; label: string }>;
}

const presentations: Record<InterventionState, InterventionPresentation> = {
  BLOCKED_AUTH: {
    title: "Login necessario",
    message: "Faca o login manualmente na aba do sistema. O AlwaysTrack nao solicita nem armazena sua senha.",
    actions: [{ action: "FOCUS_TAB", label: "Ir para aba" }, { action: "CONTINUE", label: "Continuar" }, { action: "MARK_UNAVAILABLE", label: "Marcar indisponivel" }]
  },
  BLOCKED_CAPTCHA: {
    title: "Captcha detectado",
    message: "Resolva o captcha manualmente na aba do sistema e retome a consulta.",
    actions: [{ action: "FOCUS_TAB", label: "Ir para aba" }, { action: "CONTINUE", label: "Continuar" }, { action: "SKIP", label: "Ignorar" }]
  },
  BLOCKED_2FA: {
    title: "Segundo fator necessario",
    message: "Conclua a verificacao manualmente na aba do sistema. Nenhum codigo sera solicitado aqui.",
    actions: [{ action: "FOCUS_TAB", label: "Ir para aba" }, { action: "CONTINUE", label: "Continuar" }, { action: "SKIP", label: "Ignorar" }]
  },
  FAILED_SELECTOR_DRIFT: {
    title: "Tela alterada",
    message: "A tela esperada mudou e a consulta foi interrompida sem alterar dados.",
    actions: [{ action: "RETRY", label: "Repetir" }, { action: "USE_MANUAL_INPUT", label: "Usar entrada manual" }, { action: "OPEN_DIAGNOSTICS", label: "Abrir diagnostico" }]
  },
  FAILED_UNEXPECTED_PAGE: {
    title: "Pagina inesperada",
    message: "A consulta encontrou uma pagina diferente da esperada e foi pausada.",
    actions: [{ action: "FOCUS_TAB", label: "Ir para aba" }, { action: "RETRY", label: "Repetir" }, { action: "OPEN_DIAGNOSTICS", label: "Abrir diagnostico" }]
  },
  FAILED_TIMEOUT: {
    title: "Tempo de consulta esgotado",
    message: "O sistema demorou mais que o esperado. Os demais resultados continuam disponiveis.",
    actions: [{ action: "RETRY", label: "Repetir" }, { action: "SKIP", label: "Ignorar" }, { action: "USE_MANUAL_INPUT", label: "Usar entrada manual" }]
  }
};

export function getInterventionPresentation(state: InterventionState): InterventionPresentation {
  return presentations[state];
}

export function createInterventionIntent(interventionId: string, action: InterventionIntentAction): InterventionIntent {
  return { type: "INTERVENTION_INTENT", payload: { interventionId, action } };
}

export function isInterventionViewState(value: unknown): value is InterventionViewState {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<InterventionViewState>;
  return typeof candidate.interventionId === "string"
    && typeof candidate.connectorLabel === "string"
    && interventionStates.includes(candidate.state as InterventionState);
}
