import { useEffect, useRef, type RefObject } from "react";

export type DismissibleLayerReason = "escape" | "outside";

interface DismissibleLayerOptions<LayerElement extends HTMLElement, TriggerElement extends HTMLElement> {
  open: boolean;
  layerRef: RefObject<LayerElement | null>;
  triggerRef?: RefObject<TriggerElement | null>;
  initialFocus?: RefObject<HTMLElement | null> | (() => HTMLElement | null);
  onDismiss: (reason: DismissibleLayerReason) => void;
  restoreFocus?: boolean;
}

const layerStack: symbol[] = [];

function registerLayer(id: symbol) {
  const existingIndex = layerStack.indexOf(id);
  if (existingIndex >= 0) layerStack.splice(existingIndex, 1);
  layerStack.push(id);
}

function unregisterLayer(id: symbol) {
  const index = layerStack.lastIndexOf(id);
  if (index >= 0) layerStack.splice(index, 1);
}

function isTopLayer(id: symbol) {
  return layerStack.at(-1) === id;
}

function eventHitsElement(event: Event, element: HTMLElement | null | undefined) {
  if (!element) return false;
  const path = typeof event.composedPath === "function" ? event.composedPath() : [];
  return path.includes(element) || (event.target instanceof Node && element.contains(event.target));
}

function focusTarget(target: HTMLElement | null | undefined) {
  if (!target?.isConnected || target.getAttribute("aria-disabled") === "true") return;
  if ("disabled" in target && Boolean((target as HTMLElement & { disabled?: boolean }).disabled)) return;
  target.focus();
}

export function useDismissibleLayer<LayerElement extends HTMLElement, TriggerElement extends HTMLElement>({
  open,
  layerRef,
  triggerRef,
  initialFocus,
  onDismiss,
  restoreFocus = true
}: DismissibleLayerOptions<LayerElement, TriggerElement>) {
  const idRef = useRef(Symbol("dismissible-layer"));
  const onDismissRef = useRef(onDismiss);
  const initialFocusRef = useRef(initialFocus);
  onDismissRef.current = onDismiss;
  initialFocusRef.current = initialFocus;

  useEffect(() => {
    if (!open) return;

    const id = idRef.current;
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const restoreTarget = triggerRef?.current ?? previouslyFocused;
    registerLayer(id);

    queueMicrotask(() => {
      if (!isTopLayer(id)) return;
      const configuredTarget = initialFocusRef.current;
      const target = typeof configuredTarget === "function" ? configuredTarget() : configuredTarget?.current;
      focusTarget(target);
    });

    function handlePointerDown(event: PointerEvent) {
      if (!isTopLayer(id)) return;
      if (eventHitsElement(event, layerRef.current) || eventHitsElement(event, triggerRef?.current)) return;
      onDismissRef.current("outside");
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape" || !isTopLayer(id)) return;
      event.preventDefault();
      event.stopPropagation();
      onDismissRef.current("escape");
    }

    document.addEventListener("pointerdown", handlePointerDown, true);
    document.addEventListener("keydown", handleKeyDown, true);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown, true);
      document.removeEventListener("keydown", handleKeyDown, true);
      unregisterLayer(id);
      if (restoreFocus) queueMicrotask(() => focusTarget(restoreTarget));
    };
  }, [layerRef, open, restoreFocus, triggerRef]);
}
