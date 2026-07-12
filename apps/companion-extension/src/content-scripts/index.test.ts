import { describe, expect, it, vi } from "vitest";
import type { SnapshotDocument, SnapshotElement } from "./index.js";
import { captureReadOnlySnapshot } from "./index.js";

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
});
