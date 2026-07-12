export const selectorStrategies = ["STABLE_ATTRIBUTE", "DATA_ATTRIBUTE", "ARIA_LABEL", "ACCESSIBLE_ROLE", "TEXT", "HIERARCHY", "CSS_FALLBACK"] as const;
export type SelectorStrategy = (typeof selectorStrategies)[number];

export interface SelectorDefinition {
  key: string;
  strategy: SelectorStrategy;
  value: string;
}

export interface SelectorPolicy {
  version: string;
  primary: SelectorDefinition[];
  fallback: SelectorDefinition[];
  unexpectedPageSignals: string[];
  lastValidatedAt: string;
}

export interface SanitizedConnectorFixture {
  id: string;
  connectorVersion: string;
  file: string;
  sanitized: true;
  expectedPageKind: string;
  scenarios: string[];
}
