import { describe, expect, it } from "vitest";
import type { BrowserTab, TabsAdapter } from "./chrome-tabs-adapter.js";
import { TabRegistry } from "./tab-registry.js";

class FakeTabsAdapter implements TabsAdapter {
  tabs: BrowserTab[] = [];
  opened: string[] = [];
  focused: number[] = [];
  nextId = 1;

  async list() { return [...this.tabs]; }
  async get(tabId: number) { return this.tabs.find((tab) => tab.id === tabId); }
  async open(url: string) {
    this.opened.push(url);
    const tab = { id: this.nextId++, url };
    this.tabs.push(tab);
    return tab;
  }
  async focus(tabId: number) { this.focused.push(tabId); }
  close(tabId: number) { this.tabs = this.tabs.filter((tab) => tab.id !== tabId); }
}

const identity = { browserProfileId: "profile-a", connectorId: "orders", domain: "orders.example.test" };

describe("tab registry", () => {
  it("reuses one tab per profile, connector and domain without URL query matching", async () => {
    const tabs = new FakeTabsAdapter();
    tabs.tabs.push({ id: 8, url: "https://orders.example.test/orders?synthetic=1" });
    const registry = new TabRegistry(tabs);

    const first = await registry.acquire(identity, "https://orders.example.test/");
    const second = await registry.acquire(identity, "https://orders.example.test/another-path");

    expect(first.id).toBe(8);
    expect(second.id).toBe(8);
    expect(tabs.opened).toEqual([]);
    expect(tabs.focused).toEqual([8, 8]);
  });

  it("reopens a tab only after the registered tab is closed", async () => {
    const tabs = new FakeTabsAdapter();
    const registry = new TabRegistry(tabs);

    const first = await registry.acquire(identity, "https://orders.example.test/");
    tabs.close(first.id);
    const reopened = await registry.acquire(identity, "https://orders.example.test/");

    expect(reopened.id).not.toBe(first.id);
    expect(tabs.opened).toHaveLength(2);
  });

  it("keeps profile and connector registrations independent", async () => {
    const tabs = new FakeTabsAdapter();
    const registry = new TabRegistry(tabs);
    const first = await registry.acquire(identity, "https://orders.example.test/");
    const other = await registry.acquire({ ...identity, connectorId: "returns" }, "https://orders.example.test/");

    expect(other.id).toBe(first.id);
    expect(tabs.opened).toHaveLength(1);
  });
});
