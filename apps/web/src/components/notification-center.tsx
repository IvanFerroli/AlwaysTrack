import { useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";
import { api } from "../api";
import {
  resolveNotificationNavigation,
  type NotificationNavigate,
  type NotificationNavigationSource,
  type NotificationTarget
} from "../notification-navigation";
import { useDismissibleLayer } from "./dismissible-layer";

interface InAppNotificationItem extends NotificationNavigationSource {
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

export function NotificationCenter({ onNavigate }: { onNavigate: NotificationNavigate }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<InAppNotificationItem[]>([]);
  const [groups, setGroups] = useState<NotificationGroup[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [selectedType, setSelectedType] = useState("");
  const [navigationMessage, setNavigationMessage] = useState<string | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  useDismissibleLayer({
    open,
    layerRef: popoverRef,
    triggerRef,
    initialFocus: () => popoverRef.current?.querySelector<HTMLElement>("button:not(:disabled)") ?? null,
    onDismiss: () => setOpen(false)
  });

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
      setNavigationMessage(null);
    } catch (caught) {
      setNavigationMessage(caught instanceof Error ? caught.message : "Não foi possível carregar as notificações.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadNotifications();
  }, [unreadOnly, selectedType]);

  async function markRead(item: InAppNotificationItem) {
    if (item.readAt) return;
    await api(`/v1/in-app-notifications/${item.id}/read`, { method: "POST" });
    const readAt = new Date().toISOString();
    setItems((current) => unreadOnly
      ? current.filter((candidate) => candidate.id !== item.id)
      : current.map((candidate) => candidate.id === item.id ? { ...candidate, readAt } : candidate));
    setUnread((current) => Math.max(current - 1, 0));
    setGroups((current) => current.map((group) => group.type === item.type ? { ...group, unread: Math.max(group.unread - 1, 0) } : group));
  }

  async function markAllRead() {
    try {
      await api("/v1/in-app-notifications/read-all", { method: "POST" });
      const readAt = new Date().toISOString();
      setItems((current) => unreadOnly ? [] : current.map((item) => ({ ...item, readAt: item.readAt ?? readAt })));
      setUnread(0);
      setGroups((current) => current.map((group) => ({ ...group, unread: 0 })));
    } catch (caught) {
      setNavigationMessage(caught instanceof Error ? caught.message : "Não foi possível marcar as notificações como lidas.");
    }
  }

  async function openNotification(item: InAppNotificationItem) {
    let resolved: { target: NotificationTarget };
    try {
      resolved = await api<{ target: NotificationTarget }>(`/v1/in-app-notifications/${item.id}/resolve`, { method: "POST" });
    } catch (caught) {
      setNavigationMessage(caught instanceof Error ? caught.message : "Não foi possível resolver esta notificação.");
      return;
    }
    const navigation = resolveNotificationNavigation({ target: resolved.target });
    if (navigation.state === "UNAVAILABLE" || !navigation.href) {
      setNavigationMessage(navigation.message);
      return;
    }
    try {
      await markRead(item);
    } catch (caught) {
      setNavigationMessage(caught instanceof Error ? caught.message : "Não foi possível atualizar esta notificação.");
      return;
    }
    setOpen(false);
    window.history.replaceState(null, "", navigation.href);
    onNavigate(navigation.href, navigation);
  }

  return (
    <div className="notification-center">
      <button
        ref={triggerRef}
        className="notification-trigger secondary"
        type="button"
        onClick={() => {
          setOpen((current) => !current);
          void loadNotifications();
        }}
        title="Notificações"
        aria-label={unread > 0 ? `Notificações, ${unread} não lida(s)` : "Notificações"}
        aria-controls="notification-popover"
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <Bell className="icon" aria-hidden="true" strokeWidth={2.25} />
        {unread > 0 ? <span>{unread > 9 ? "9+" : unread}</span> : null}
      </button>
      {open ? (
        <div
          ref={popoverRef}
          id="notification-popover"
          className="notification-popover"
          role="dialog"
          aria-labelledby="notification-popover-title"
        >
          <div className="notification-popover-header">
            <span>
              <strong id="notification-popover-title">Notificações</strong>
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
          {navigationMessage ? <p className="muted" role="status">{navigationMessage}</p> : null}
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
            {items.map((item) => {
              const navigation = resolveNotificationNavigation(item);
              return (
                <button className={item.readAt ? "notification-item" : "notification-item unread"} key={item.id} type="button" onClick={() => void openNotification(item)}>
                  <span>
                    <strong>{item.title}</strong>
                    <small>{formatDateTimeBr(item.createdAt)} / {item.type}</small>
                  </span>
                  {item.body ? <em>{item.body}</em> : null}
                  {navigation.state === "UNAVAILABLE" ? <small className="notification-target">Alvo indisponível</small> : null}
                  {navigation.state === "FALLBACK" ? <small className="notification-target">Visão relacionada disponível</small> : null}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
