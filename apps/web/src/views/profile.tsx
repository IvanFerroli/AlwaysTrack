import { useEffect, useState, type FormEvent } from "react";
import type { CurrentUser } from "@alwaystrack/shared";
import { api } from "../api";
import { OperationalState } from "../components/operational";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
  role: CurrentUser["role"];
  phone: string | null;
  organization: { id: string; name: string };
  sellerProfile?: { id: string; code: string; displayName: string; salesGroup: { id: string; name: string } | null } | null;
  supervisedSalesGroups?: Array<{ id: string; name: string; active: boolean }>;
  googleConnection?: { id: string; connectedAt: string } | null;
}

function initialsFor(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "AT";
}

export interface ProfileViewProps {
  user: CurrentUser;
  onProfileSaved: (user: CurrentUser) => void;
}

export function ProfileView({ user, onProfileSaved }: ProfileViewProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState("");
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl ?? "");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const profileResult = await api<{ profile: UserProfile }>("/v1/profile");
      setProfile(profileResult.profile);
      setName(profileResult.profile.name);
      setPhone(profileResult.profile.phone ?? "");
      setAvatarUrl(profileResult.profile.avatarUrl ?? "");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Falha ao carregar perfil.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function saveProfile(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const result = await api<{ profile: UserProfile }>("/v1/profile", {
        method: "PATCH",
        body: JSON.stringify({ name, phone: phone || null, avatarUrl: avatarUrl || null })
      });
      setProfile(result.profile);
      onProfileSaved({ ...user, name: result.profile.name, avatarUrl: result.profile.avatarUrl ?? null });
      setMessage("Perfil atualizado.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Falha ao salvar perfil.");
    } finally {
      setSaving(false);
    }
  }

  if (loading && !profile) return <OperationalState state="loading" title="Carregando perfil" />;

  return (
    <div className="content-stack">
      {error ? <OperationalState state="error" title="Falha no perfil" detail={error} /> : null}
      {message ? <OperationalState state="success" title={message} /> : null}
      <section className="panel profile-header-panel">
        <div className="profile-avatar">
          {profile?.avatarUrl ? <img src={profile.avatarUrl} alt={profile.name} /> : <span>{initialsFor(profile?.name ?? user.name)}</span>}
        </div>
        <div>
          <p className="eyebrow">{profile?.role ?? user.role}</p>
          <h2>{profile?.name ?? user.name}</h2>
          <p className="muted">{profile?.email ?? user.email}</p>
        </div>
        <div className="profile-readonly-grid">
          <span><small>Organização</small><strong>{profile?.organization.name ?? "-"}</strong></span>
          <span><small>Vínculo comercial</small><strong>{profile?.sellerProfile?.displayName ?? profile?.supervisedSalesGroups?.map((group) => group.name).join(", ") ?? "-"}</strong></span>
          <span><small>Login Google</small><strong>{profile?.googleConnection ? "Conectado" : "Não conectado"}</strong></span>
        </div>
      </section>

      <section className="panel form-panel">
        <form onSubmit={saveProfile}>
          <div className="table-panel-toolbar">
            <div><p className="eyebrow">Identidade</p><h2>Dados do perfil</h2></div>
          </div>
          <div className="form-grid">
            <label>Nome<input value={name} onChange={(event) => setName(event.target.value)} /></label>
            <label>Telefone<input value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="+55 83 90000-0000" /></label>
            <div className="full-span">
              <label>Avatar URL<input value={avatarUrl} onChange={(event) => setAvatarUrl(event.target.value)} placeholder="/favicon/favicon-512.png ou https://..." /></label>
            </div>
          </div>
          <div className="form-actions">
            <button disabled={saving || !name.trim()}>Salvar perfil</button>
          </div>
        </form>
      </section>
    </div>
  );
}
