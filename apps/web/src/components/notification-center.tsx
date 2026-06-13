import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { api } from "../api";

interface InAppNotificationItem {
  id: string;
  type: string;
  title: string;
  body?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  href?: string | null;
  readAt?: string | null;
  createdAt: string;
}

interface NotificationGroup {
  type: string;
  total: number;
  unread: number;
}

function formatDateTimeBr(value: string | null | undefined) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
}

export function NotificationCenter({ onNavigate }: { onNavigate: (href?: string | null) => void }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<InAppNotificationItem[]>([]);
  const [groups, setGroups] = useState<NotificationGroup[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [selectedType, setSelectedType] = useState("");

  async function loadNotifications() {
    setLoading(true);
    try {
      const search = new URLSearchParams();
      if (unreadOnly) search.set("unreadOnly", "1");
      if (selectedType) search.set("type", selectedType);
      const query = search.toString();
      const result = await api<{ items: InAppNotificationItem[]; unread: number; groups: NotificationGroup[] }>(
        `/v1/in-app-notifications${query ? `?${query}` : ""}`
      );
      setItems(result.items);
      setGroups(result.groups);
      setUnread(result.unread);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadNotifications();
  }, [unreadOnly, selectedType]);

  async function markRead(item: InAppNotificationItem) {
    if (!item.readAt) {
      await api(`/v1/in-app-notifications/${item.id}/read`, { method: "POST" });
      await loadNotifications();
    }
  }

  async function markAllRead() {
    await api("/v1/in-app-notifications/read-all", { method: "POST" });
    await loadNotifications();
  }

  async function openNotification(item: InAppNotificationItem) {
    await markRead(item);
    setOpen(false);
    onNavigate(item.href);
  }

  return (
    <div className="notification-center">
      <button
        className="notification-trigger secondary"
        type="button"
        onClick={() => {
          setOpen((current) => !current);
          void loadNotifications();
        }}
        title="Notificações"
      >
        <Bell className="icon" aria-hidden="true" strokeWidth={2.25} />
        {unread > 0 ? <span>{unread > 9 ? "9+" : unread}</span> : null}
      </button>
      {open ? (
        <div className="notification-popover">
          <div className="notification-popover-header">
            <span>
              <strong>Notificações</strong>
              <small>{unread} não lida(s)</small>
            </span>
            <button className="link-button" disabled={unread === 0} type="button" onClick={() => void markAllRead()}>
              Marcar lidas
            </button>
          </div>
          <div className="notification-controls">
            <button className={unreadOnly ? "notification-filter active" : "notification-filter"} type="button" onClick={() => setUnreadOnly((current) => !current)}>
              Não lidas
            </button>
            {selectedType ? (
              <button className="notification-filter" type="button" onClick={() => setSelectedType("")}>
                Todos os tipos
              </button>
            ) : null}
          </div>
          {groups.length > 0 ? (
            <div className="notification-groups" aria-label="Tipos de notificações">
              {groups.map((group) => (
                <button
                  className={selectedType === group.type ? "notification-group active" : "notification-group"}
                  key={group.type}
                  type="button"
                  onClick={() => setSelectedType((current) => (current === group.type ? "" : group.type))}
                >
                  <span>{group.type}</span>
                  <strong>{group.unread}/{group.total}</strong>
                </button>
              ))}
            </div>
          ) : null}
          {loading && items.length === 0 ? <p className="muted">Carregando...</p> : null}
          {!loading && items.length === 0 ? <p className="muted">Nenhuma notificação neste filtro</p> : null}
          <div className="notification-list">
            {items.map((item) => (
              <button className={item.readAt ? "notification-item" : "notification-item unread"} key={item.id} type="button" onClick={() => void openNotification(item)}>
                <span>
                  <strong>{item.title}</strong>
                  <small>{formatDateTimeBr(item.createdAt)} / {item.type}</small>
                </span>
                {item.body ? <em>{item.body}</em> : null}
                {item.href ? <small className="notification-target">{item.href}</small> : null}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
