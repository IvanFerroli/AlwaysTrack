import { describe, expect, it, vi } from "vitest";
import { ChromeTabsAdapter } from "./chrome-tabs-adapter.js";

describe("Chrome tabs adapter", () => {
  it("lists tabs without a URL query", async () => {
    const query = vi.fn(async () => [{ id: 4, url: "https://orders.example.test/?fixture=1" }]);
    const adapter = new ChromeTabsAdapter({
      query,
      create: vi.fn(),
      update: vi.fn(),
      get: vi.fn()
    });

    await expect(adapter.list()).resolves.toEqual([{ id: 4, url: "https://orders.example.test/?fixture=1" }]);
    expect(query).toHaveBeenCalledWith({});
  });
});
