export const snapshotSelectorStrategies = [
  "STABLE_ATTRIBUTE",
  "DATA_ATTRIBUTE",
  "ARIA_LABEL",
  "ACCESSIBLE_ROLE",
  "TEXT",
  "HIERARCHY",
  "CSS_FALLBACK"
] as const;

export type SnapshotSelectorStrategy = (typeof snapshotSelectorStrategies)[number];

export interface SnapshotSelector {
  key: string;
  strategy: SnapshotSelectorStrategy;
  selector: string;
}

export interface SnapshotPolicy {
  version: string;
  selectors: SnapshotSelector[];
  maxTextLength?: number;
}

export interface SnapshotSignal {
  key: string;
  strategy: SnapshotSelectorStrategy;
  text: string;
}

export interface ReadOnlyPageSnapshot {
  url: string;
  title?: string;
  signals: SnapshotSignal[];
  capturedAt: string;
  policyVersion: string;
}

export * from "./action-firewall.js";
