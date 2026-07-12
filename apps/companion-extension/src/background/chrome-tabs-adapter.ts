export interface BrowserTab {
  id: number;
  url?: string;
}

export interface CreateTabOptions {
  url: string;
  active: boolean;
}

export interface TabsApi {
  query(queryInfo: Record<string, never>): Promise<Array<{ id?: number; url?: string }>>;
  create(options: CreateTabOptions): Promise<{ id?: number; url?: string }>;
  update(tabId: number, options: { active: true }): Promise<unknown>;
  get(tabId: number): Promise<{ id?: number; url?: string }>;
}

export interface TabsAdapter {
  list(): Promise<BrowserTab[]>;
  get(tabId: number): Promise<BrowserTab | undefined>;
  open(url: string): Promise<BrowserTab>;
  focus(tabId: number): Promise<void>;
}

function validTab(tab: { id?: number; url?: string }): BrowserTab | undefined {
  return tab.id === undefined ? undefined : { id: tab.id, url: tab.url };
}

export class ChromeTabsAdapter implements TabsAdapter {
  constructor(private readonly tabs: TabsApi) {}

  async list(): Promise<BrowserTab[]> {
    return (await this.tabs.query({})).map(validTab).filter((tab): tab is BrowserTab => tab !== undefined);
  }

  async get(tabId: number): Promise<BrowserTab | undefined> {
    try {
      return validTab(await this.tabs.get(tabId));
    } catch {
      return undefined;
    }
  }

  async open(url: string): Promise<BrowserTab> {
    const tab = validTab(await this.tabs.create({ url, active: true }));
    if (!tab) throw new Error("Chrome did not return a tab id");
    return tab;
  }

  async focus(tabId: number): Promise<void> {
    await this.tabs.update(tabId, { active: true });
  }
}
