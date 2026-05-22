"use client";

import Link from "next/link";
import { Bell } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { markNotificationRead, type NotificationDto } from "@/app/actions/notifications";

function timeLabel(createdAt?: string) {
  if (!createdAt) return "";
  const d = new Date(createdAt);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function NotificationBell({
  items,
}: {
  items: NotificationDto[];
}) {
  const unreadCount = items.filter((item) => !item.is_read).length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative border-none"
          aria-label="Notifications"
          type="button"
        >
          <Bell className="h-5 w-5 text-muted-foreground hover:text-yessal-violet transition-colors" />
          {unreadCount > 0 ? (
            <span className="absolute top-2 right-2 h-2 w-2 bg-red-500 rounded-full border-2 border-background" />
          ) : null}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="px-3 py-2 border-b" style={{ borderColor: "var(--border)" }}>
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Aperçu
          </p>
        </div>
        <div className="max-h-64 overflow-y-auto">
          {items.length === 0 ? (
            <p className="px-3 py-6 text-sm text-muted-foreground text-center">
              Aucune notification récente.
            </p>
          ) : (
            items.map((notification) => (
              <button
                key={notification.id}
                type="button"
                onClick={() => {
                  if (!notification.is_read) {
                    void markNotificationRead(notification.id, true);
                  }
                }}
                className="w-full px-3 py-2.5 border-b last:border-0 text-left"
                style={{ borderColor: "var(--border)" }}
              >
                <p className="text-sm font-semibold leading-snug line-clamp-2">
                  {notification.title}
                </p>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                  {notification.message}
                </p>
                {notification.created_at ? (
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {timeLabel(notification.created_at)}
                  </p>
                ) : null}
              </button>
            ))
          )}
        </div>
        <div className="p-2 border-t" style={{ borderColor: "var(--border)" }}>
          <Button
            asChild
            variant="outline"
            size="sm"
            className="w-full text-xs font-semibold"
          >
            <Link href="/dashboard/notifications">Toutes les Notifications</Link>
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
