import type { ReadOnlyPageSnapshot, SnapshotPolicy, SnapshotSignal } from "../shared/index.js";

const sensitiveSelector = "input, textarea, select, [contenteditable], [data-sensitive], [aria-hidden='true']";
const defaultMaxTextLength = 500;

export interface SnapshotElement {
  textContent: string | null;
  matches(selector: string): boolean;
  closest(selector: string): SnapshotElement | null;
}

export interface SnapshotDocument {
  readonly title: string;
  readonly location: { readonly href: string };
  querySelectorAll(selector: string): Iterable<SnapshotElement>;
}

function normalizedText(element: SnapshotElement, maxLength: number): string | undefined {
  if (element.matches(sensitiveSelector) || element.closest(sensitiveSelector)) return undefined;
  const text = element.textContent?.replace(/\s+/g, " ").trim();
  return text ? text.slice(0, maxLength) : undefined;
}

export function captureReadOnlySnapshot(
  source: SnapshotDocument,
  policy: SnapshotPolicy,
  now: () => Date = () => new Date()
): ReadOnlyPageSnapshot {
  const maxTextLength = Math.max(1, policy.maxTextLength ?? defaultMaxTextLength);
  const signals: SnapshotSignal[] = [];

  for (const definition of policy.selectors) {
    for (const element of source.querySelectorAll(definition.selector)) {
      const text = normalizedText(element, maxTextLength);
      if (text) signals.push({ key: definition.key, strategy: definition.strategy, text });
    }
  }

  return {
    url: (() => { const url = new URL(source.location.href); url.search = ""; url.hash = ""; return url.toString(); })(),
    title: source.title || undefined,
    signals,
    capturedAt: now().toISOString(),
    policyVersion: policy.version
  };
}

export function captureCurrentPage(policy: SnapshotPolicy): ReadOnlyPageSnapshot {
  return captureReadOnlySnapshot(document, policy);
}

interface ContentScriptRuntime {
  onMessage: {
    addListener(listener: (message: unknown, sender: unknown, sendResponse: (response: unknown) => void) => void): void;
  };
}

type SnapshotRequest = { type: "CAPTURE_READ_ONLY_SNAPSHOT"; policy: SnapshotPolicy };

function isSnapshotRequest(message: unknown): message is SnapshotRequest {
  if (!message || typeof message !== "object") return false;
  const candidate = message as Partial<SnapshotRequest>;
  return candidate.type === "CAPTURE_READ_ONLY_SNAPSHOT"
    && typeof candidate.policy?.version === "string"
    && Array.isArray(candidate.policy.selectors);
}

export function registerSnapshotListener(runtime: ContentScriptRuntime): void {
  runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (isSnapshotRequest(message)) sendResponse(captureCurrentPage(message.policy));
  });
}

const extensionRuntime = (globalThis as { chrome?: { runtime?: ContentScriptRuntime } }).chrome?.runtime;
if (extensionRuntime) registerSnapshotListener(extensionRuntime);
