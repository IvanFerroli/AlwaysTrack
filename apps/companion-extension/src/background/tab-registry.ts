import type { BrowserTab, TabsAdapter } from "./chrome-tabs-adapter.js";

export interface TabIdentity {
  browserProfileId: string;
  connectorId: string;
  domain: string;
}

function normalizedDomain(domain: string): string {
  const hostname = domain.includes("://") ? new URL(domain).hostname : domain;
  return hostname.trim().toLowerCase().replace(/^www\./, "");
}

function tabDomain(tab: BrowserTab): string | undefined {
  if (!tab.url) return undefined;
  try {
    return normalizedDomain(new URL(tab.url).hostname);
  } catch {
    return undefined;
  }
}

function registryKey(identity: TabIdentity): string {
  return `${identity.browserProfileId}\u0000${identity.connectorId}\u0000${normalizedDomain(identity.domain)}`;
}

export class TabRegistry {
  readonly #tabIds = new Map<string, number>();

  constructor(private readonly tabs: TabsAdapter) {}

  async acquire(identity: TabIdentity, openUrl: string): Promise<BrowserTab> {
    const key = registryKey(identity);
    const registeredId = this.#tabIds.get(key);
    if (registeredId !== undefined) {
      const registered = await this.tabs.get(registeredId);
      if (registered && tabDomain(registered) === normalizedDomain(identity.domain)) {
        await this.tabs.focus(registered.id);
        return registered;
      }
      this.#tabIds.delete(key);
    }

    const existing = (await this.tabs.list()).find((tab) => tabDomain(tab) === normalizedDomain(identity.domain));
    const tab = existing ?? await this.tabs.open(openUrl);
    this.#tabIds.set(key, tab.id);
    await this.tabs.focus(tab.id);
    return tab;
  }

  forget(tabId: number): void {
    for (const [key, registeredId] of this.#tabIds) {
      if (registeredId === tabId) this.#tabIds.delete(key);
    }
  }
}
