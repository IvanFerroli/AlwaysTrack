import type { ConnectorId } from "../case-flow/evidence.js";

export const interventionKinds = ["LOGIN", "CAPTCHA", "TWO_FACTOR", "SELECTOR_DRIFT", "UNEXPECTED_PAGE", "MANUAL_DATA"] as const;
export type InterventionKind = (typeof interventionKinds)[number];

export const interventionActions = ["FOCUS_TAB", "CONTINUE", "SKIP", "MARK_UNAVAILABLE", "USE_MANUAL_INPUT", "OPEN_DIAGNOSTICS"] as const;
export type InterventionAction = (typeof interventionActions)[number];

export interface Intervention {
  id: string;
  connectorId: ConnectorId;
  runId: string;
  kind: InterventionKind;
  message: string;
  allowedActions: InterventionAction[];
  detectedAt: string;
}

export interface PageSnapshot {
  url: string;
  title?: string;
  pageKind?: string;
  visibleSignals: string[];
  capturedAt: string;
}
