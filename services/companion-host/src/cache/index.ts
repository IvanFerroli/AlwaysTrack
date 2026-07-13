export interface ConnectorCacheScope {
  tenantId: string;
  caseId: string;
  connectorId: string;
  browserProfileId: string;
  base: string;
  search: Readonly<Record<string, string>>;
}

export interface CacheHit<T> { value: T; ageMs: number; expiresAt: number; }
interface Entry<T> { value: T; createdAt: number; expiresAt: number; }

function stableSearch(search: Readonly<Record<string, string>>) {
  return Object.entries(search).sort(([a], [b]) => a.localeCompare(b)).map(([key, value]) => `${key}:${value}`).join("|");
}

export function connectorCacheKey(scope: ConnectorCacheScope): string {
  return [scope.tenantId, scope.caseId, scope.connectorId, scope.browserProfileId, scope.base, stableSearch(scope.search)].map(encodeURIComponent).join("/");
}

export class ConnectorResultCache<T> {
  private readonly entries = new Map<string, Entry<T>>();
  constructor(private readonly now: () => number = Date.now) {}
  get(scope: ConnectorCacheScope): CacheHit<T> | undefined {
    const key = connectorCacheKey(scope); const entry = this.entries.get(key); const now = this.now();
    if (!entry || entry.expiresAt <= now) { if (entry) this.entries.delete(key); return undefined; }
    return { value: entry.value, ageMs: now - entry.createdAt, expiresAt: entry.expiresAt };
  }
  set(scope: ConnectorCacheScope, value: T, ttlMs: number): void {
    if (!Number.isSafeInteger(ttlMs) || ttlMs <= 0) throw new Error("Cache TTL must be a positive integer");
    const createdAt = this.now(); this.entries.set(connectorCacheKey(scope), { value, createdAt, expiresAt: createdAt + ttlMs });
  }
  deleteCase(tenantId: string, caseId: string): void {
    const prefix = `${encodeURIComponent(tenantId)}/${encodeURIComponent(caseId)}/`;
    for (const key of this.entries.keys()) if (key.startsWith(prefix)) this.entries.delete(key);
  }
}

export class InFlightDeduplicator<T> {
  private readonly active = new Map<string, Promise<T>>();
  run(scope: ConnectorCacheScope, operation: () => Promise<T>): Promise<T> {
    const key = connectorCacheKey(scope); const existing = this.active.get(key); if (existing) return existing;
    const current = operation().finally(() => { if (this.active.get(key) === current) this.active.delete(key); });
    this.active.set(key, current); return current;
  }
}

export const hostCacheLayerReady = true;
