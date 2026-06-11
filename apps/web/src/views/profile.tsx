import { useEffect, useMemo, useState, type FormEvent } from "react";
import type { CurrentUser } from "@alwaystrack/shared";
import { api } from "../api";
import { OperationalFilters, OperationalState } from "../components/operational";

interface ProfileNotificationItem {
  id: string;
  type: string;
  title: string;
  body?: string | null;
  readAt?: string | null;
  createdAt: string;
}

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

function formatDateTimeBr(value: string | null | undefined) {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "-" : date.toLocaleString("pt-BR");
}

export function ProfileView({ user, onProfileSaved }: { user: CurrentUser; onProfileSaved: (user: CurrentUser) => void }) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [notifications, setNotifications] = useState<ProfileNotificationItem[]>([]);
  const [unread, setUnread] = useState(0);
  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState("");
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl ?? "");
  const [notificationState, setNotificationState] = useState("");
  const [notificationType, setNotificationType] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [profileResult, notificationResult] = await Promise.all([
        api<{ profile: UserProfile }>("/v1/profile"),
        api<{ items: ProfileNotificationItem[]; unread: number }>("/v1/in-app-notifications")
      ]);
      setProfile(profileResult.profile);
      setName(profileResult.profile.name);
      setPhone(profileResult.profile.phone ?? "");
      setAvatarUrl(profileResult.profile.avatarUrl ?? "");
      setNotifications(notificationResult.items);
      setUnread(notificationResult.unread);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Falha ao carregar perfil.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const notificationTypes = useMemo(() => [...new Set(notifications.map((item) => item.type))].sort((a, b) => a.localeCompare(b)), [notifications]);
  const visibleNotifications = notifications.filter((item) => {
    const stateOk = notificationState === "unread" ? !item.readAt : notificationState === "read" ? Boolean(item.readAt) : true;
    return stateOk && (notificationType ? item.type === notificationType : true);
  });

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

  async function markNotificationRead(item: ProfileNotificationItem) {
    if (item.readAt) return;
    await api(`/v1/in-app-notifications/${item.id}/read`, { method: "POST" });
    await load();
  }

  async function markAllRead() {
    await api("/v1/in-app-notifications/read-all", { method: "POST" });
    await load();
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

      <OperationalFilters
        fields={[
          { key: "state", label: "Estado", type: "select", value: notificationState, placeholder: "Todas", options: [{ value: "unread", label: "Não lidas" }, { value: "read", label: "Lidas" }], onChange: setNotificationState },
          { key: "type", label: "Tipo", type: "select", value: notificationType, placeholder: "Todos", options: notificationTypes.map((type) => ({ value: type, label: type })), onChange: setNotificationType }
        ]}
        onSubmit={() => undefined}
      />

      <section className="panel table-panel">
        <div className="table-panel-toolbar">
          <div><p className="eyebrow">Notificações</p><h2>Histórico</h2><p className="muted">{unread} não lida(s)</p></div>
          <button className="secondary" disabled={unread === 0} type="button" onClick={() => void markAllRead()}>Marcar todas como lidas</button>
        </div>
        {visibleNotifications.length === 0 ? (
          <OperationalState state="empty" title="Nenhuma notificação encontrada" />
        ) : (
          <div className="profile-notification-list">
            {visibleNotifications.map((item) => (
              <button className={item.readAt ? "profile-notification" : "profile-notification unread"} key={item.id} type="button" onClick={() => void markNotificationRead(item)}>
                <span><strong>{item.title}</strong><small>{formatDateTimeBr(item.createdAt)} / {item.type}</small></span>
                {item.body ? <em>{item.body}</em> : null}
              </button>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
