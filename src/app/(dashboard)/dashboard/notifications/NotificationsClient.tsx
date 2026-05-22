"use client";

import { useState, useTransition } from "react";
import { Bell, CheckCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  markAllNotificationsRead,
  markNotificationRead,
  type NotificationDto,
} from "@/app/actions/notifications";

export type Notification = NotificationDto;

function timeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "À l'instant";
  if (diffMins < 60) return `Il y a ${diffMins} min`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `Il y a ${diffHours}h`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `Il y a ${diffDays}j`;
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

function groupByDate(items: Notification[]): Record<string, Notification[]> {
  const now = new Date();
  const groups: Record<string, Notification[]> = {
    "Aujourd'hui": [],
    "Cette semaine": [],
    "Plus ancien": [],
  };

  items.forEach((item) => {
    const d = new Date(item.created_at);
    const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 1) groups["Aujourd'hui"].push(item);
    else if (diffDays < 7) groups["Cette semaine"].push(item);
    else groups["Plus ancien"].push(item);
  });

  return groups;
}

export function NotificationsClient({
  notifications: initialNotifications,
}: {
  notifications: Notification[];
}) {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [isPending, startTransition] = useTransition();

  const unreadCount = notifications.filter((a) => !a.is_read).length;
  const grouped = groupByDate(notifications);

  const markRead = (id: number) => {
    setNotifications((prev) =>
      prev.map((item) => (item.id === id ? { ...item, is_read: true } : item)),
    );
    startTransition(async () => {
      const res = await markNotificationRead(id, true);
      if (res.error) {
        setNotifications((prev) =>
          prev.map((item) => (item.id === id ? { ...item, is_read: false } : item)),
        );
      }
    });
  };

  const markAllRead = () => {
    const snapshot = notifications;
    setNotifications((prev) => prev.map((item) => ({ ...item, is_read: true })));
    startTransition(async () => {
      const res = await markAllNotificationsRead();
      if (res.error) {
        setNotifications(snapshot);
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <div className="ml-auto flex items-center gap-2">
          {unreadCount > 0 ? (
            <Badge className="bg-yessal-violet/10 text-yessal-violet border-none font-bold text-[11px]">
              {unreadCount} non lue{unreadCount > 1 ? "s" : ""}
            </Badge>
          ) : null}
          <Button
            variant="outline"
            size="sm"
            onClick={markAllRead}
            disabled={isPending || unreadCount === 0}
            className="h-8 text-[11px] uppercase font-bold tracking-wider border-none bg-muted/60 hover:bg-muted"
          >
            <CheckCircle size={13} className="mr-1.5" />
            Tout marquer lu
          </Button>
        </div>
      </div>

      {notifications.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-20 text-center">
          <div className="w-16 h-16 rounded-full bg-muted/40 flex items-center justify-center">
            <Bell size={28} className="text-muted-foreground/40" />
          </div>
          <p className="text-muted-foreground text-sm font-medium">
            Aucune notification pour l&apos;instant.
          </p>
        </div>
      ) : null}

      {Object.entries(grouped).map(([label, items]) => {
        if (items.length === 0) return null;
        return (
          <div key={label} className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                {label}
              </span>
              <div className="flex-1 h-px bg-border" />
            </div>

            {items.map((notification) => (
              <div
                key={notification.id}
                onClick={() => {
                  if (!notification.is_read) markRead(notification.id);
                }}
                className={`relative p-5 rounded-2xl border flex gap-4 cursor-pointer transition-all hover:shadow-md overflow-hidden group ${
                  !notification.is_read
                    ? "bg-card shadow-sm border-l-0"
                    : "bg-muted/20 opacity-70"
                }`}
                style={{ borderColor: "var(--border)" }}
              >
                <div
                  className="absolute left-0 top-0 w-1 h-full"
                  style={{ background: "var(--primary)" }}
                />

                <div className="p-3 rounded-full h-fit mt-0.5 flex-shrink-0 bg-yessal-violet/10 text-yessal-violet">
                  <Bell size={18} />
                </div>

                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <p
                      className={`font-bold text-sm ${
                        !notification.is_read ? "text-foreground" : "text-muted-foreground"
                      }`}
                    >
                      {notification.title}
                    </p>
                    <span className="text-[10px] text-muted-foreground font-semibold whitespace-nowrap flex-shrink-0">
                      {timeAgo(notification.created_at)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">{notification.message}</p>
                  {!notification.is_read ? (
                    <div className="pt-1">
                      <Badge className="text-[9px] uppercase font-black tracking-widest bg-yessal-violet/10 text-yessal-violet border-none px-2 h-5">
                        Nouveau
                      </Badge>
                    </div>
                  ) : null}
                </div>

                {!notification.is_read ? (
                  <div
                    className="w-2.5 h-2.5 rounded-full self-center flex-shrink-0 animate-pulse"
                    style={{ background: "var(--primary)" }}
                  />
                ) : null}
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}
