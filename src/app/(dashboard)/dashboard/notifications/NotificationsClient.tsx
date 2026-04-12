"use client";

import { useState } from "react";
import { Bell, Info, AlertTriangle, CheckCircle, AlertCircle, Filter } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type UrgencyType = "critical" | "warning" | "info";
type FilterType = "all" | UrgencyType;

interface Announcement {
  id: number;
  title: string;
  content: string;
  urgency: UrgencyType;
  target: string;
  created_at: string;
}

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

function groupByDate(items: Announcement[]): Record<string, Announcement[]> {
  const now = new Date();
  const groups: Record<string, Announcement[]> = {
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

const urgencyConfig = {
  critical: {
    icon: AlertCircle,
    bg: "bg-red-100 dark:bg-red-900/30",
    text: "text-red-600",
    bar: "bg-red-500",
    label: "Critique",
  },
  warning: {
    icon: AlertTriangle,
    bg: "bg-orange-100 dark:bg-orange-900/30",
    text: "text-orange-500",
    bar: "bg-orange-400",
    label: "Attention",
  },
  info: {
    icon: Info,
    bg: "bg-blue-100 dark:bg-blue-900/30",
    text: "text-blue-500",
    bar: "bg-blue-400",
    label: "Info",
  },
};

export function NotificationsClient({ announcements }: { announcements: Announcement[] }) {
  const [readIds, setReadIds] = useState<Set<number>>(new Set());
  const [filter, setFilter] = useState<FilterType>("all");

  const markAllRead = () => setReadIds(new Set(announcements.map((a) => a.id)));
  const markRead = (id: number) => setReadIds((prev) => new Set([...prev, id]));
  const isRead = (id: number) => readIds.has(id);

  const filtered = filter === "all" ? announcements : announcements.filter((a) => a.urgency === filter);
  const unreadCount = announcements.filter((a) => !isRead(a.id)).length;
  const grouped = groupByDate(filtered);

  return (
    <div className="space-y-6">
      {/* Header actions */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Filter chips */}
        <div className="flex items-center gap-2 bg-muted/40 rounded-xl p-1">
          {(["all", "critical", "warning", "info"] as FilterType[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded-lg text-[11px] font-bold uppercase tracking-widest transition-all ${
                filter === f
                  ? "bg-card shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {f === "all" ? "Toutes" : urgencyConfig[f].label}
            </button>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-2">
          {unreadCount > 0 && (
            <Badge className="bg-yessal-green/10 text-yessal-green border-none font-bold text-[11px]">
              {unreadCount} non lue{unreadCount > 1 ? "s" : ""}
            </Badge>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={markAllRead}
            className="h-8 text-[11px] uppercase font-bold tracking-wider border-none bg-muted/60 hover:bg-muted"
          >
            <CheckCircle size={13} className="mr-1.5" />
            Tout marquer lu
          </Button>
        </div>
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="flex flex-col items-center gap-4 py-20 text-center">
          <div className="w-16 h-16 rounded-full bg-muted/40 flex items-center justify-center">
            <Bell size={28} className="text-muted-foreground/40" />
          </div>
          <p className="text-muted-foreground text-sm font-medium">Aucune notification pour l'instant.</p>
        </div>
      )}

      {/* Grouped notifications */}
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

            {items.map((ann) => {
              const config = urgencyConfig[ann.urgency] || urgencyConfig.info;
              const Icon = config.icon;
              const read = isRead(ann.id);

              return (
                <div
                  key={ann.id}
                  onClick={() => markRead(ann.id)}
                  className={`relative p-5 rounded-2xl border flex gap-4 cursor-pointer transition-all hover:shadow-md overflow-hidden group ${
                    !read
                      ? "bg-card shadow-sm border-l-0"
                      : "bg-muted/20 opacity-70"
                  }`}
                  style={{ borderColor: "var(--border)" }}
                >
                  {/* Urgency bar */}
                  <div className={`absolute left-0 top-0 w-1 h-full ${config.bar}`} />

                  {/* Icon */}
                  <div className={`p-3 rounded-full h-fit mt-0.5 flex-shrink-0 ${config.bg} ${config.text}`}>
                    <Icon size={18} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`font-bold text-sm ${!read ? "text-foreground" : "text-muted-foreground"}`}>
                        {ann.title}
                      </p>
                      <span className="text-[10px] text-muted-foreground font-semibold whitespace-nowrap flex-shrink-0">
                        {timeAgo(ann.created_at)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">{ann.content}</p>
                    <div className="flex items-center gap-2 pt-1">
                      <Badge
                        variant="outline"
                        className="text-[9px] uppercase font-black tracking-widest border-none bg-muted/40 px-2 h-5"
                      >
                        {ann.target === "global" ? "🌍 National" : "🕌 Daara"}
                      </Badge>
                      {!read && (
                        <Badge className="text-[9px] uppercase font-black tracking-widest bg-yessal-green/10 text-yessal-green border-none px-2 h-5">
                          Nouveau
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Unread dot */}
                  {!read && (
                    <div
                      className="w-2.5 h-2.5 rounded-full self-center flex-shrink-0 animate-pulse"
                      style={{ background: "var(--yessal-green)" }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
