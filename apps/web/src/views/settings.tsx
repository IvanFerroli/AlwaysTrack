import { useEffect, useState, type FormEvent } from "react";
import { api } from "../api";
import { BrandMark } from "../components/brand";
import { InfoTip, OperationalState } from "../components/operational";

export interface OrganizationSettingsResponse {
  organization: {
    id: string;
    name: string;
    document: string | null;
    logoUrl: string | null;
    active: boolean;
    updatedAt: string;
    settings: {
      defaultTags: string[];
      dashboardDefaultRange: "7" | "30" | "90";
      dashboardDefaultBucket: "day" | "week" | "month";
    };
  };
  googleLogin: {
    allowedDomains: string[];
    editable: false;
    source: "env";
  };
}

function parseTags(value: string) {
  return [
    ...new Set(
      value
        .split(",")
        .map((tag) => tag.trim().replace(/^#/, "").toLowerCase())
        .filter(Boolean)
    )
  ].sort((left, right) => left.localeCompare(right));
}

export function SettingsView({ onSaved }: { onSaved?: (settings: OrganizationSettingsResponse) => void }) {
  const [settings, setSettings] = useState<OrganizationSettingsResponse | null>(null);
  const [name, setName] = useState("");
  const [document, setDocument] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [defaultTags, setDefaultTags] = useState("");
  const [dashboardDefaultRange, setDashboardDefaultRange] = useState<"7" | "30" | "90">("30");
  const [dashboardDefaultBucket, setDashboardDefaultBucket] = useState<"day" | "week" | "month">("day");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function hydrate(next: OrganizationSettingsResponse) {
    setSettings(next);
    setName(next.organization.name);
    setDocument(next.organization.document ?? "");
    setLogoUrl(next.organization.logoUrl ?? "");
    setDefaultTags(next.organization.settings.defaultTags.join(", "));
    setDashboardDefaultRange(next.organization.settings.dashboardDefaultRange);
    setDashboardDefaultBucket(next.organization.settings.dashboardDefaultBucket);
  }

  async function load() {
    setLoading(true);
    setError(null);
    try {
      hydrate(await api<OrganizationSettingsResponse>("/v1/organization/settings"));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Falha ao carregar configuracoes.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      const result = await api<{ organization: OrganizationSettingsResponse["organization"] }>("/v1/organization/settings", {
        method: "PATCH",
        body: JSON.stringify({
          name,
          document: document || null,
          logoUrl: logoUrl || null,
          defaultTags: parseTags(defaultTags),
          dashboardDefaultRange,
          dashboardDefaultBucket
        })
      });
      const next: OrganizationSettingsResponse = {
        organization: result.organization,
        googleLogin: settings?.googleLogin ?? { allowedDomains: [], editable: false, source: "env" }
      };
      hydrate(next);
      onSaved?.(next);
      setSaved(true);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Falha ao salvar configuracoes.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="content-stack">
      <section className="panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Organização</p>
            <h2>Configurações administrativas</h2>
            <p className="muted">Ajustes seguros do produto interno, sem expor secrets de ambiente.</p>
          </div>
          <BrandMark alt={name || "AlwaysTrack"} src={logoUrl} />
        </div>
        {loading ? <OperationalState state="loading" title="Carregando configurações" /> : null}
        {error ? <OperationalState state="error" title="Falha nas configurações" detail={error} /> : null}
        {!loading ? (
          <form className="content-stack" onSubmit={submit}>
            <div className="form-grid">
              <label>
                <span className="label-row">
                  Nome exibido
                  <InfoTip text="Atualiza o nome mostrado para admins no shell e nas configuracoes." href="#visao-geral" />
                </span>
                <input value={name} onChange={(event) => setName(event.target.value)} required />
              </label>
              <label>
                Documento
                <input value={document} onChange={(event) => setDocument(event.target.value)} placeholder="Opcional" />
              </label>
              <label>
                Logo URL
                <input
                  value={logoUrl}
                  onChange={(event) => setLogoUrl(event.target.value)}
                  placeholder="/favicon/favicon-512.png ou https://..."
                />
              </label>
              <label>
                Tags padrão
                <input value={defaultTags} onChange={(event) => setDefaultTags(event.target.value)} placeholder="vendas, notas, processo" />
              </label>
              <label>
                Range padrão do dashboard
                <select value={dashboardDefaultRange} onChange={(event) => setDashboardDefaultRange(event.target.value as "7" | "30" | "90")}>
                  <option value="7">Últimos 7 dias</option>
                  <option value="30">Últimos 30 dias</option>
                  <option value="90">Últimos 90 dias</option>
                </select>
              </label>
              <label>
                Agrupamento padrão
                <select
                  value={dashboardDefaultBucket}
                  onChange={(event) => setDashboardDefaultBucket(event.target.value as "day" | "week" | "month")}
                >
                  <option value="day">Dia</option>
                  <option value="week">Semana</option>
                  <option value="month">Mês</option>
                </select>
              </label>
            </div>
            <fieldset>
              <legend>Google Login</legend>
              <p className="muted">
                Domínios permitidos são controlados por <code>GOOGLE_LOGIN_ALLOWED_DOMAINS</code> no ambiente para evitar lockout.
              </p>
              <div className="tag-list">
                {(settings?.googleLogin.allowedDomains.length ? settings.googleLogin.allowedDomains : ["nenhum dominio configurado"]).map((domain) => (
                  <span key={domain}>#{domain}</span>
                ))}
              </div>
            </fieldset>
            <div className="form-actions">
              <button disabled={saving || !name.trim()}>{saving ? "Salvando..." : "Salvar configurações"}</button>
              {saved ? <span className="status-ok">Configurações salvas</span> : null}
            </div>
          </form>
        ) : null}
      </section>
    </div>
  );
}
