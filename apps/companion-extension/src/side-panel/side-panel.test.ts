import { afterEach, describe, expect, it, vi } from "vitest";

class FakeElement extends EventTarget {
  readonly tagName: string;
  readonly children: FakeElement[] = [];
  readonly attributes = new Map<string, string>();
  readonly dataset: Record<string, string> = {};
  readonly style: Record<string, string> = {};
  parentElement: FakeElement | null = null;
  textContent = "";
  className = "";
  id = "";
  type = "";
  value = "";
  hidden = false;
  disabled = false;
  open = false;
  tabIndex = 0;
  isContentEditable = false;
  focused = false;

  constructor(tagName = "div") {
    super();
    this.tagName = tagName.toUpperCase();
  }

  append(...nodes: FakeElement[]): void {
    for (const node of nodes) {
      const appended = node.tagName === "#FRAGMENT" ? [...node.children] : [node];
      for (const child of appended) {
        child.parentElement = this;
        this.children.push(child);
      }
    }
  }

  replaceChildren(...nodes: FakeElement[]): void {
    this.children.splice(0);
    this.append(...nodes);
  }

  setAttribute(name: string, value: string): void {
    this.attributes.set(name, value);
  }

  getAttribute(name: string): string | null {
    return this.attributes.get(name) ?? null;
  }

  focus(): void {
    this.focused = true;
  }
}

class FakeDocument extends EventTarget {
  readonly elements = new Map<string, FakeElement>();

  querySelector<T extends FakeElement>(selector: string): T | null {
    return (selector.startsWith("#") ? this.elements.get(selector.slice(1)) : undefined) as T | undefined ?? null;
  }

  createElement(tagName: string): FakeElement {
    return new FakeElement(tagName);
  }

  createDocumentFragment(): FakeElement {
    return new FakeElement("#fragment");
  }

  mount(id: string, tagName = "div"): FakeElement {
    const element = new FakeElement(tagName);
    element.id = id;
    this.elements.set(id, element);
    return element;
  }
}

function descendants(root: FakeElement): FakeElement[] {
  return root.children.flatMap((child) => [child, ...descendants(child)]);
}

function chromeFixture() {
  const listeners = new Set<(message: unknown) => void>();
  return {
    listeners,
    runtime: {
      onMessage: { addListener: vi.fn((listener: (message: unknown) => void) => listeners.add(listener)) },
      sendMessage: vi.fn(() => Promise.resolve())
    }
  };
}

function documentFixture(): FakeDocument {
  const document = new FakeDocument();
  for (const id of [
    "host-status", "browser-diagnostics", "intervention", "plan-update", "stepper", "copy-actions",
    "case-head", "summary", "connectors", "detected-flows", "possibilities", "refresh-case", "cancel-case"
  ]) document.mount(id, id.includes("case") ? "button" : "div");
  document.mount("shortcut-mode", "select");
  const progress = new FakeElement("div");
  progress.append(document.mount("completion-bar", "span"));
  return document;
}

function keyboard(key: string, options: Partial<KeyboardEvent> = {}): Event {
  const event = new Event("keydown", { cancelable: true });
  Object.defineProperties(event, {
    key: { value: key }, altKey: { value: options.altKey ?? false }, ctrlKey: { value: options.ctrlKey ?? false },
    metaKey: { value: options.metaKey ?? false }, shiftKey: { value: options.shiftKey ?? false }
  });
  return event;
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  vi.resetModules();
});

describe("side panel MV3 bootstrap", () => {
  it("renders initial state and wires Chrome, DOM, keyboard and preference listeners", async () => {
    const document = documentFixture();
    const chrome = chromeFixture();
    const storage = new Map<string, string>();
    const localStorage = {
      getItem: vi.fn((key: string) => storage.get(key) ?? null),
      setItem: vi.fn((key: string, value: string) => storage.set(key, value))
    };
    vi.stubGlobal("HTMLElement", FakeElement);
    vi.stubGlobal("document", document);
    vi.stubGlobal("chrome", chrome);
    vi.stubGlobal("localStorage", localStorage);
    vi.stubGlobal("navigator", {
      userAgent: "Mozilla/5.0 Chrome/126.0.0.0",
      userAgentData: { brands: [{ brand: "Google Chrome" }] },
      clipboard: { writeText: vi.fn(() => Promise.resolve()) }
    });

    const panel = await import("./side-panel.js");

    expect(document.elements.get("case-head")!.children).toHaveLength(5);
    expect(document.elements.get("completion-bar")!.style.width).toBe("68%");
    expect(document.elements.get("browser-diagnostics")!.textContent).toContain("navegador de referencia");
    expect(document.elements.get("stepper")!.children.length).toBeGreaterThan(0);
    expect(document.elements.get("copy-actions")!.children.length).toBeGreaterThan(0);
    expect(document.elements.get("detected-flows")!.children.length).toBeGreaterThan(0);
    expect(document.elements.get("possibilities")!.children).toHaveLength(3);
    expect(chrome.listeners).toHaveLength(1);

    document.elements.get("refresh-case")!.dispatchEvent(new Event("click"));
    document.elements.get("cancel-case")!.dispatchEvent(new Event("click"));
    const shortcut = keyboard("2");
    document.dispatchEvent(shortcut);
    expect(shortcut.defaultPrevented).toBe(true);
    expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({ type: "CASE_FLOW_REFRESH_REQUESTED" });
    expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({ type: "CASE_FLOW_CANCEL_REQUESTED" });
    expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
      type: "CASE_FLOW_STEP_CHOSEN",
      payload: { stepId: "confirm-logistics", optionId: "forecast-expired" }
    });

    const select = document.elements.get("shortcut-mode")!;
    select.value = "ALT";
    select.dispatchEvent(new Event("change"));
    expect(localStorage.setItem).toHaveBeenCalledWith("alwaystrack.sidePanel.shortcutMode", "ALT");
    document.dispatchEvent(keyboard("1"));
    expect(chrome.runtime.sendMessage).toHaveBeenCalledTimes(3);
    document.dispatchEvent(keyboard("1", { altKey: true }));
    expect(chrome.runtime.sendMessage).toHaveBeenCalledTimes(4);

    const message = [...chrome.listeners][0];
    message({ type: "COMPANION_CONNECTION_STATE", state: "CONNECTED" });
    expect(document.elements.get("host-status")!.textContent).toBe("Companion conectado");
    message({ type: "COMPANION_CONNECTION_STATE", state: "DISCONNECTED" });
    expect(document.elements.get("host-status")!.textContent).toBe("Companion indisponivel");
    message({ type: "BROWSER_DIAGNOSTICS", diagnostics: { browser: "EDGE", support: "SECONDARY", profile: "MISMATCH" } });
    expect(document.elements.get("browser-diagnostics")!.dataset.profile).toBe("MISMATCH");

    const intervention = { interventionId: "intervention-1", connectorLabel: "OMIE", state: "FAILED_TIMEOUT" } as const;
    message({ type: "INTERVENTION_REQUIRED", intervention });
    const interventionRoot = document.elements.get("intervention")!;
    expect(interventionRoot.hidden).toBe(false);
    expect(descendants(interventionRoot).find((element) => element.tagName === "H2")?.focused).toBe(true);
    descendants(interventionRoot).find((element) => element.dataset.action === "RETRY")!.dispatchEvent(new Event("click"));
    expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
      type: "INTERVENTION_INTENT",
      payload: { interventionId: "intervention-1", action: "RETRY" }
    });

    panel.showIntervention({ ...intervention, state: "BLOCKED_AUTH" });
    expect(descendants(interventionRoot).some((element) => element.textContent.includes("Login necessario"))).toBe(true);
  });

  it("applies host panel state updates while keeping a still-valid visible step", async () => {
    const document = documentFixture();
    const chrome = chromeFixture();
    vi.stubGlobal("HTMLElement", FakeElement);
    vi.stubGlobal("document", document);
    vi.stubGlobal("chrome", chrome);
    vi.stubGlobal("localStorage", { getItem: () => "DISABLED", setItem: vi.fn() });
    vi.stubGlobal("navigator", { userAgent: "fixture", clipboard: { writeText: vi.fn() } });
    await import("./side-panel.js");

    [...chrome.listeners][0]({
      type: "CASE_FLOW_PANEL_STATE",
      panel: {
        case: { customer: "Ana", order: "O9", channel: "Chat", caseType: "Troca", risk: "Alto", completion: 120 },
        summary: "Resumo atualizado",
        connectors: [{ label: "Yampi", status: "Concluido" }],
        step: {
          id: "confirm-logistics", position: 3, total: 4, title: "Titulo substituto", instruction: "Instrucao",
          evidence: [], options: [], previousStepAvailable: false
        },
        flows: [], possibilities: [], copyActions: [],
        planUpdate: { revision: 2, kind: "PLAN_UPDATED", recommendationChanged: true, copiedMessageBecameObsolete: true, message: "Plano recomposto" }
      }
    });

    expect(document.elements.get("completion-bar")!.style.width).toBe("100%");
    expect(document.elements.get("summary")!.textContent).toBe("Resumo atualizado");
    expect(document.elements.get("connectors")!.children).toHaveLength(1);
    expect(document.elements.get("plan-update")!.hidden).toBe(false);
    expect(document.elements.get("plan-update")!.dataset.kind).toBe("PLAN_UPDATED");
    expect(descendants(document.elements.get("stepper")!).some((element) => element.textContent === "Confirmar status e previsao")).toBe(true);

    const disabledShortcut = keyboard("1");
    document.dispatchEvent(disabledShortcut);
    expect(disabledShortcut.defaultPrevented).toBe(false);
  });
});
