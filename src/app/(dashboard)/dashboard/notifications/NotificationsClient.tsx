"use client";

/*
 * ═══════════════════════════════════════════════════════════════════════════
 * Notifications
 * ═══════════════════════════════════════════════════════════════════════════
 * Repris du patron `pages/Notifications` de Vireo : onglets de filtre à
 * compteur, action « tout marquer lu » RÉVERSIBLE, et lignes groupées par
 * période sur le contrat `.ax-list`.
 *
 * Ce que le patron corrige ici :
 *
 *   · « Tout marquer lu » était irréversible. Un clic de trop, et la seule
 *     alerte qu'on n'avait pas encore lue disparaissait sans recours. Vireo
 *     répond par une bande d'annulation ; on la reprend, avec la sauvegarde de
 *     l'état d'avant qui existait déjà dans le code (`snapshot`) mais ne
 *     servait qu'en cas d'erreur réseau.
 *
 *   · Aucun filtre. Sur une boîte à cinquante entrées, retrouver les non lues
 *     demandait de tout parcourir — alors que le compteur de non lues était
 *     affiché juste au-dessus.
 *
 *   · Les lignes étaient des `<div onClick>` : ni focus, ni activation au
 *     clavier, alors que le clic est l'action qui marque comme lu. Ce sont
 *     maintenant des boutons, et seules les non lues sont cliquables — cliquer
 *     une notification déjà lue ne faisait rien tout en affichant un curseur
 *     de pointeur.
 *
 *   · La pastille de non-lu était en `animate-pulse`. Une alerte n'a pas
 *     besoin de clignoter pour se signaler, et le clignotement continu est
 *     précisément ce que `prefers-reduced-motion` demande d'éviter.
 */

import { useMemo, useState, useTransition } from "react";
import { Bell, CheckCircle, Undo2 } from "lucide-react";
import {
  markAllNotificationsRead,
  markNotificationRead,
  type NotificationDto,
} from "@/app/actions/notifications";
import { EmptyState } from "@/components/ui/empty-state";

export type Notification = NotificationDto;

type Filter = "all" | "unread";

function timeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return "—";
  const diffMins = Math.floor((Date.now() - date.getTime()) / 60000);
  if (diffMins < 1) return "À l'instant";
  if (diffMins < 60) return `Il y a ${diffMins} min`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `Il y a ${diffHours} h`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `Il y a ${diffDays} j`;
  return date.toLocaleDateString("fr-SN", { day: "numeric", month: "short" });
}

const GROUPS = ["Aujourd'hui", "Cette semaine", "Plus ancien"] as const;

function groupByDate(items: Notification[]): Record<string, Notification[]> {
  const groups: Record<string, Notification[]> = {
    "Aujourd'hui": [],
    "Cette semaine": [],
    "Plus ancien": [],
  };

  for (const item of items) {
    const d = new Date(item.created_at);
    const diffDays = Math.floor((Date.now() - d.getTime()) / 86_400_000);
    if (diffDays < 1) groups["Aujourd'hui"].push(item);
    else if (diffDays < 7) groups["Cette semaine"].push(item);
    else groups["Plus ancien"].push(item);
  }

  return groups;
}

export function NotificationsClient({
  notifications: initialNotifications,
}: {
  notifications: Notification[];
}) {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [filter, setFilter] = useState<Filter>("all");
  const [isPending, startTransition] = useTransition();
  /* Sauvegarde d'avant le « tout marquer lu », qui alimente l'annulation. */
  const [undoSnapshot, setUndoSnapshot] = useState<Notification[] | null>(null);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const visible = useMemo(
    () =>
      filter === "unread"
        ? notifications.filter((n) => !n.is_read)
        : notifications,
    [notifications, filter],
  );

  const grouped = useMemo(() => groupByDate(visible), [visible]);

  const markRead = (id: number) => {
    /* Optimiste : la ligne s'éteint tout de suite, et se rallume si le serveur
       refuse. C'est le bon compromis pour une action aussi anodine. */
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)),
    );
    startTransition(async () => {
      const res = await markNotificationRead(id, true);
      if (res.error) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, is_read: false } : n)),
        );
      }
    });
  };

  const markAllRead = () => {
    const snapshot = notifications;
    setUndoSnapshot(snapshot);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));

    startTransition(async () => {
      const res = await markAllNotificationsRead();
      if (res.error) {
        setNotifications(snapshot);
        setUndoSnapshot(null);
      }
    });
  };

  /*
   * L'annulation rejoue un `markNotificationRead(id, false)` par entrée qui
   * était non lue — le backend n'expose pas d'inverse groupé. On restaure
   * l'affichage d'abord, pour que le retour soit immédiat.
   */
  const undoMarkAll = () => {
    const snapshot = undoSnapshot;
    if (!snapshot) return;

    setNotifications(snapshot);
    setUndoSnapshot(null);

    const toRestore = snapshot.filter((n) => !n.is_read).map((n) => n.id);
    startTransition(async () => {
      await Promise.all(toRestore.map((id) => markNotificationRead(id, false)));
    });
  };

  return (
    <div className="flex flex-col gap-4">
      {/* ── Onglets + action groupée ── */}
      <div className="ax-card ax-card--compact">
        <div className="ax-card__body flex flex-wrap items-center gap-3">
          <div className="ax-tabs ax-tabs--pill">
            <div className="ax-tabs__list" role="tablist">
              <button
                type="button"
                role="tab"
                className="ax-tabs__tab"
                aria-selected={filter === "all"}
                onClick={() => setFilter("all")}
              >
                Toutes
                <span className="ax-tabs__badge ax-badge ax-badge--count ax-badge--sm">
                  {notifications.length}
                </span>
              </button>
              <button
                type="button"
                role="tab"
                className="ax-tabs__tab"
                aria-selected={filter === "unread"}
                onClick={() => setFilter("unread")}
              >
                Non lues
                <span className="ax-tabs__badge ax-badge ax-badge--accent ax-badge--sm">
                  {unreadCount}
                </span>
              </button>
            </div>
          </div>

          <button
            type="button"
            className="ax-btn ax-btn--ghost ax-btn--sm ms-auto"
            onClick={markAllRead}
            disabled={isPending || unreadCount === 0}
          >
            <CheckCircle className="ax-btn__icon" size={14} aria-hidden="true" />
            <span className="ax-btn__label">Tout marquer lu</span>
          </button>
        </div>
      </div>

      {/* ── Bande d'annulation ── */}
      {undoSnapshot && (
        <div className="ax-alert ax-alert--success" role="status">
          <CheckCircle className="ax-alert__icon" aria-hidden="true" />
          <div className="ax-alert__content">
            <p className="ax-alert__message">
              Toutes les notifications ont été marquées comme lues.
            </p>
            <div className="ax-alert__actions">
              <button
                type="button"
                className="ax-btn ax-btn--soft-success ax-btn--sm"
                onClick={undoMarkAll}
              >
                <Undo2 className="ax-btn__icon" size={14} aria-hidden="true" />
                <span className="ax-btn__label">Annuler</span>
              </button>
            </div>
          </div>
          <button
            type="button"
            className="ax-alert__dismiss"
            aria-label="Masquer"
            onClick={() => setUndoSnapshot(null)}
          >
            ×
          </button>
        </div>
      )}

      {/* ── Liste ── */}
      {visible.length === 0 ? (
        <div className="ax-card">
          <div className="ax-card__body">
            <EmptyState
              icon={Bell}
              tone={filter === "unread" ? "success" : "neutral"}
              title={
                filter === "unread"
                  ? "Tout est lu"
                  : "Aucune notification pour l'instant"
              }
              description={
                filter === "unread"
                  ? "Vous n'avez aucune alerte en attente."
                  : "Les alertes concernant vos Jëfs, Ndiguels et fêtes arriveront ici."
              }
              action={
                filter === "unread" ? (
                  <button
                    type="button"
                    className="ax-btn ax-btn--outline"
                    onClick={() => setFilter("all")}
                  >
                    <span className="ax-btn__label">Voir toutes les notifications</span>
                  </button>
                ) : undefined
              }
            />
          </div>
        </div>
      ) : (
        GROUPS.map((label) => {
          const items = grouped[label];
          if (items.length === 0) return null;

          return (
            <section key={label} className="ax-card">
              <div className="ax-card__header">
                <div className="ax-card__titles">
                  <h2 className="ax-eyebrow">{label}</h2>
                </div>
                <span className="ax-badge ax-badge--neutral ax-badge--sm">
                  {items.length}
                </span>
              </div>

              <ul className="ax-list">
                {items.map((n) => {
                  /* Seules les non lues réagissent au clic : une notification
                     déjà lue n'a plus d'action associée. */
                  const Row = n.is_read ? "div" : "button";

                  return (
                    <li key={n.id}>
                      <Row
                        {...(n.is_read
                          ? {}
                          : {
                              type: "button" as const,
                              onClick: () => markRead(n.id),
                              "aria-label": `Marquer « ${n.title} » comme lue`,
                            })}
                        className={`ax-list__row w-full text-start ${
                          n.is_read ? "opacity-70" : ""
                        }`}
                      >
                        <span
                          className={`ax-list__leading ax-avatar ax-avatar--sm ${
                            n.is_read ? "" : "ax-kpi__icon--c1"
                          }`}
                          aria-hidden="true"
                        >
                          <Bell size={15} />
                        </span>

                        <span className="ax-list__content">
                          <span className="ax-list__title">{n.title}</span>
                          <span className="ax-list__meta">{n.message}</span>
                        </span>

                        <span className="ax-list__trailing flex-col items-end gap-1">
                          <span className="ax-text-subtle text-xs whitespace-nowrap">
                            {timeAgo(n.created_at)}
                          </span>
                          {!n.is_read && (
                            <span
                              className="ax-badge-count ax-badge-count--dot"
                              aria-label="Non lue"
                            />
                          )}
                        </span>
                      </Row>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })
      )}
    </div>
  );
}
