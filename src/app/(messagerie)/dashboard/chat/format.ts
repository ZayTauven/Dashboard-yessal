import type { MessageRow } from "./types";

/** Le rôle, en clair : « member » n'est pas un mot que l'on montre. */
const ROLE_LABEL: Record<string, string> = {
  admin: "Administrateur",
  chef_daara: "Coordinateur du Daara",
  collector: "Collecteur",
  member: "Talubé",
  tutelle: "Sous tutelle",
};

export function roleLabel(role?: string | null) {
  return role ? (ROLE_LABEL[role] ?? role) : "";
}

export function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

function daysAgo(d: Date) {
  return Math.round((startOfDay(new Date()) - startOfDay(d)) / 86_400_000);
}

export function formatTime(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

function dayLabel(iso: string) {
  const d = new Date(iso);
  const days = daysAgo(d);
  if (days === 0) return "Aujourd'hui";
  if (days === 1) return "Hier";
  const sameYear = d.getFullYear() === new Date().getFullYear();
  return d.toLocaleDateString("fr-FR", {
    weekday: days < 7 ? "long" : undefined,
    day: "numeric",
    month: "long",
    ...(sameYear ? {} : { year: "numeric" }),
  });
}

export function formatFileSize(bytes?: number | null) {
  if (!bytes && bytes !== 0) return "";
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1).replace(".", ",")} Mo`;
}

/** Deux messages du même auteur à moins de cinq minutes forment une grappe. */
const CLUSTER_GAP_MS = 5 * 60 * 1000;

export type ThreadEntry =
  | { kind: "day"; key: string; label: string }
  | { kind: "unread"; key: string; count: number }
  | { kind: "system"; key: string; message: MessageRow }
  | {
      kind: "message";
      key: string;
      message: MessageRow;
      /** Première bulle de la grappe : porte le nom (en salon). */
      first: boolean;
      /** Dernière bulle : porte le visage et l'heure. */
      last: boolean;
    };

/**
 * Le fil, découpé pour l'affichage : séparateurs de jour, repère « non lus »,
 * et grappes. Quatre messages d'affilée de la même personne n'ont pas besoin
 * de quatre portraits ni de quatre heures.
 */
export function buildThread(
  messages: MessageRow[],
  unreadFromId: number | null,
  unreadCount: number,
): ThreadEntry[] {
  const out: ThreadEntry[] = [];
  let lastDay = "";
  for (let i = 0; i < messages.length; i++) {
    const m = messages[i];
    const day = new Date(m.sent_at).toDateString();
    if (day !== lastDay) {
      out.push({ kind: "day", key: `day-${day}`, label: dayLabel(m.sent_at) });
      lastDay = day;
    }
    if (unreadFromId !== null && m.id === unreadFromId && unreadCount > 0) {
      out.push({ kind: "unread", key: "unread", count: unreadCount });
    }
    if (m.message_type === "system") {
      out.push({ kind: "system", key: `sys-${m.id}`, message: m });
      continue;
    }
    const prev = messages[i - 1];
    const next = messages[i + 1];
    const joins = (a?: MessageRow, b?: MessageRow) =>
      !!a &&
      !!b &&
      a.message_type !== "system" &&
      b.message_type !== "system" &&
      a.sender.id === b.sender.id &&
      new Date(a.sent_at).toDateString() === new Date(b.sent_at).toDateString() &&
      Math.abs(new Date(b.sent_at).getTime() - new Date(a.sent_at).getTime()) < CLUSTER_GAP_MS &&
      b.id !== unreadFromId;
    out.push({
      kind: "message",
      key: `msg-${m.id}`,
      message: m,
      first: !joins(prev, m),
      last: !joins(m, next),
    });
  }
  return out;
}

/** Découpe un texte en morceaux pour souligner les « @Prénom » et les liens. */
export function tokenize(text: string): { type: "text" | "mention" | "link"; value: string }[] {
  const parts: { type: "text" | "mention" | "link"; value: string }[] = [];
  const re = /(https?:\/\/[^\s]+)|(@[\p{L}][\p{L}'-]*)/gu;
  let last = 0;
  for (const match of text.matchAll(re)) {
    const idx = match.index ?? 0;
    if (idx > last) parts.push({ type: "text", value: text.slice(last, idx) });
    parts.push({ type: match[1] ? "link" : "mention", value: match[0] });
    last = idx + match[0].length;
  }
  if (last < text.length) parts.push({ type: "text", value: text.slice(last) });
  return parts;
}
