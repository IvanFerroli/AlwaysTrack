import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import type { ApiResult, CurrentUser } from "@sylembra/shared";
import "./styles.css";

interface AuditLogItem {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  metadataJson: unknown;
  createdAt: string;
  actor: null | {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

async function api<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    credentials: "include",
    headers: {
      "content-type": "application/json",
      ...options?.headers
    },
    ...options
  });
  const payload = (await response.json()) as ApiResult<T>;
  if (!payload.ok) {
    throw new Error(payload.error.message);
  }
  return payload.data;
}

function LoginForm({ onLogin }: { onLogin: (user: CurrentUser) => void }) {
  const [email, setEmail] = useState("admin@example.com");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const result = await api<{ user: CurrentUser }>("/v1/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password })
      });
      onLogin(result.user);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Falha ao entrar.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <form className="panel login-panel" onSubmit={submit}>
        <div>
          <p className="eyebrow">Acesso administrativo</p>
          <h1>Entrar</h1>
        </div>
        <label>
          Email
          <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" autoComplete="email" />
        </label>
        <label>
          Senha
          <input
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            type="password"
            autoComplete="current-password"
          />
        </label>
        {error ? <p className="error">{error}</p> : null}
        <button disabled={loading}>{loading ? "Entrando..." : "Entrar"}</button>
      </form>
    </main>
  );
}

function AuditPage({ user, onLogout }: { user: CurrentUser; onLogout: () => void }) {
  const [items, setItems] = useState<AuditLogItem[]>([]);
  const [action, setAction] = useState("");
  const [entityType, setEntityType] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    setError(null);
    const search = new URLSearchParams();
    if (action) search.set("action", action);
    if (entityType) search.set("entityType", entityType);
    try {
      const result = await api<{ items: AuditLogItem[] }>(`/v1/audit-logs?${search.toString()}`);
      setItems(result.items);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Falha ao carregar auditoria.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function logout() {
    await api("/v1/auth/logout", { method: "POST" });
    onLogout();
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">{user.role}</p>
          <h1>Auditoria</h1>
        </div>
        <button className="secondary" onClick={logout}>
          Sair
        </button>
      </header>

      <section className="panel filters">
        <label>
          Acao
          <input value={action} onChange={(event) => setAction(event.target.value)} placeholder="auth.login" />
        </label>
        <label>
          Entidade
          <input value={entityType} onChange={(event) => setEntityType(event.target.value)} placeholder="User" />
        </label>
        <button onClick={load}>Filtrar</button>
      </section>

      <section className="panel">
        {error ? <p className="error">{error}</p> : null}
        {loading ? (
          <p>Carregando...</p>
        ) : items.length === 0 ? (
          <p>Nenhum evento encontrado.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th>Acao</th>
                <th>Entidade</th>
                <th>Ator</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>{new Date(item.createdAt).toLocaleString("pt-BR")}</td>
                  <td>{item.action}</td>
                  <td>
                    {item.entityType} / {item.entityId}
                  </td>
                  <td>{item.actor ? `${item.actor.name} (${item.actor.email})` : "Contexto publico"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </main>
  );
}

function App() {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    api<{ user: CurrentUser }>("/v1/auth/me")
      .then((result) => setUser(result.user))
      .catch(() => setUser(null))
      .finally(() => setReady(true));
  }, []);

  if (!ready) {
    return <main className="auth-page">Carregando...</main>;
  }

  return user ? <AuditPage user={user} onLogout={() => setUser(null)} /> : <LoginForm onLogin={setUser} />;
}

createRoot(document.getElementById("root") as HTMLElement).render(
  <StrictMode>
    <App />
  </StrictMode>
);
