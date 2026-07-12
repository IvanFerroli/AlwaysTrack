export type ShortcutMode = "DISABLED" | "DIRECT" | "ALT";

export const shortcutStorageKey = "alwaystrack.sidePanel.shortcutMode";

export function shortcutOptionIndex(event: Pick<KeyboardEvent, "key" | "altKey" | "ctrlKey" | "metaKey" | "shiftKey">, mode: ShortcutMode): number | null {
  if (mode === "DISABLED" || !/^[1-9]$/.test(event.key)) return null;
  if (event.ctrlKey || event.metaKey || event.shiftKey) return null;
  if (mode === "ALT" && !event.altKey) return null;
  if (mode === "DIRECT" && event.altKey) return null;
  return Number(event.key) - 1;
}

export function isEditableTarget(target: EventTarget | null): boolean {
  return target instanceof HTMLElement && (target.isContentEditable || ["INPUT", "SELECT", "TEXTAREA"].includes(target.tagName));
}
