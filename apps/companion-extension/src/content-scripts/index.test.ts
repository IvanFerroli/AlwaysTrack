import { describe, expect, it, vi } from "vitest";
import type { SnapshotDocument, SnapshotElement } from "./index.js";
import { captureReadOnlySnapshot, registerSnapshotListener } from "./index.js";

function element(text: string, sensitive = false): SnapshotElement {
  return {
    textContent: text,
    matches: (selector) => sensitive && selector.includes("input"),
    closest: (selector) => sensitive && selector.includes("input") ? ({} as SnapshotElement) : null
  };
}

describe("read-only content snapshot", () => {
  it("captures only configured selectors and excludes sensitive fields", () => {
    const querySelectorAll = vi.fn((selector: string) => selector === "[data-order-status]"
      ? [element("  Pedido   entregue "), element("senha secreta", true)]
      : []);
    const fixture: SnapshotDocument = {
      title: "Pedido sintetico",
      location: { href: "https://orders.example.test/order/fixture" },
      querySelectorAll
    };

    const snapshot = captureReadOnlySnapshot(fixture, {
      version: "fixture-v1",
      selectors: [{ key: "order_status", strategy: "DATA_ATTRIBUTE", selector: "[data-order-status]" }]
    }, () => new Date("2026-07-12T12:00:00.000Z"));

    expect(snapshot).toEqual({
      url: "https://orders.example.test/order/fixture",
      title: "Pedido sintetico",
      signals: [{ key: "order_status", strategy: "DATA_ATTRIBUTE", text: "Pedido entregue" }],
      capturedAt: "2026-07-12T12:00:00.000Z",
      policyVersion: "fixture-v1"
    });
    expect(querySelectorAll).toHaveBeenCalledTimes(1);
  });

  it("only exposes read operations to the document adapter", () => {
    const fixture: SnapshotDocument = {
      title: "Fixture",
      location: { href: "https://example.test/" },
      querySelectorAll: () => []
    };

    expect(captureReadOnlySnapshot(fixture, { version: "v1", selectors: [] }).signals).toEqual([]);
    expect(Object.keys(fixture).sort()).toEqual(["location", "querySelectorAll", "title"]);
  });

  it("wires the MV3 listener and answers only valid read-only snapshot requests", () => {
    let listener: ((message: unknown, sender: unknown, sendResponse: (response: unknown) => void) => void) | undefined;
    const runtime = {
      onMessage: { addListener: vi.fn((candidate: typeof listener) => { listener = candidate; }) }
    };
    const response = vi.fn();
    const originalDocument = globalThis.document;
    Object.defineProperty(globalThis, "document", {
      configurable: true,
      value: {
        title: "Fixture MV3",
        location: { href: "https://orders.example.test/order/1?secret=removed#fragment" },
        querySelectorAll: () => [element(" Em transporte ")]
      }
    });

    try {
      registerSnapshotListener(runtime);
      expect(runtime.onMessage.addListener).toHaveBeenCalledOnce();
      listener?.({ type: "UNKNOWN" }, {}, response);
      listener?.({ type: "CAPTURE_READ_ONLY_SNAPSHOT", policy: { version: 1, selectors: [] } }, {}, response);
      expect(response).not.toHaveBeenCalled();

      listener?.({
        type: "CAPTURE_READ_ONLY_SNAPSHOT",
        policy: { version: "mv3-test", selectors: [{ key: "status", strategy: "DATA_ATTRIBUTE", selector: "[data-order-status]" }] }
      }, {}, response);
      expect(response).toHaveBeenCalledOnce();
      expect(response.mock.calls[0][0]).toMatchObject({
        url: "https://orders.example.test/order/1",
        title: "Fixture MV3",
        signals: [{ key: "status", strategy: "DATA_ATTRIBUTE", text: "Em transporte" }],
        policyVersion: "mv3-test"
      });
    } finally {
      Object.defineProperty(globalThis, "document", { configurable: true, value: originalDocument });
    }
  });
});
