import { describe, expect, it } from "vitest";
import { reconnectDelay } from "./connection-state.js";

describe("protocol connection policy", () => {
  it("backs off with a bounded delay", () => {
    expect(reconnectDelay(0, () => 0)).toBe(500);
    expect(reconnectDelay(10, () => 0)).toBe(15_000);
  });
});
