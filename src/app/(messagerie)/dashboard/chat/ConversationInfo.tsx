"use client";

/**
 * Le panneau de droite : qui est là, et les gestes sur la conversation.
 *
 * Comme sur la maquette validée le 2026-10-29, les membres sont rangés par
 * TITRE (AMIR, DIEUWRIGNE…) — la manière dont le Kourel se reconnaît — avec
 * la coordination en tête. Dans un canal, on ne liste pas tout le Kourel : on
 * montre ses auteurs, et l'administrateur les désigne d'ici.
 */
import { useMemo, useState } from "react";
import { Bell, BellOff, HandHeart, Hash, LogOut, Megaphone, PenLine, Search, UserMinus, UserPlus, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { initials, roleLabel } from "./format";
import type { ChatMember, ChatRow, ManualPickUser } from "./types";

const STAFF = new Set(["admin", "chef_daara"]);

export function ConversationInfo({
  chat,
  members,
  onlineIds,
  currentUserId,
  canManage,
  isAdmin,
  directoryUsers,
  busy,
  onClose,
  onToggleMute,
  onLeave,
  onAddMembers,
  onSetAuthor,
}: {
  chat: ChatRow;
  members: ChatMember[];
  onlineIds: Set<number>;
  currentUserId: number;
  canManage: boolean;
  isAdmin: boolean;
  directoryUsers: ManualPickUser[];
  busy: boolean;
  onClose: () => void;
  onToggleMute: () => void;
  onLeave: () => void;
  onAddMembers: (ids: number[]) => Promise<boolean>;
  onSetAuthor: (userId: number, canPost: boolean) => Promise<boolean>;
}) {
  const [picking, setPicking] = useState<"members" | "author" | null>(null);
  const [picked, setPicked] = useState<number[]>([]);
  const [filter, setFilter] = useState("");
  const isGroup = chat.chat_type === "group";
  const isChannel = chat.chat_type === "channel";
  const isGuide = isChannel && chat.channel_kind === "guide";

  /* Coordination d'abord, puis un groupe par titre, puis les membres sans titre. */
  const sections = useMemo(() => {
    const byKey = new Map<string, ChatMember[]>();
    for (const m of members) {
      const key = STAFF.has(m.role ?? "") ? "0|Coordination" : m.title ? `1|${m.title.toUpperCase()}` : "2|Membres";
      byKey.set(key, [...(byKey.get(key) ?? []), m]);
    }
    return [...byKey.entries()]
      .sort(([a], [b]) => a.localeCompare(b, "fr"))
      .map(([key, list]) => ({
        label: key.split("|")[1],
        list: list.sort((a, b) => Number(onlineIds.has(b.id)) - Number(onlineIds.has(a.id)) || a.name.localeCompare(b.name, "fr")),
      }));
  }, [members, onlineIds]);

  const memberIds = useMemo(() => new Set(members.map((m) => m.id)), [members]);
  const pickable = directoryUsers.filter((u) => {
    if (memberIds.has(u.id)) return false;
    if (picking === "members" && u.role === "admin") return false;
    const q = filter.trim().toLowerCase();
    return !q || `${u.first_name} ${u.last_name}`.toLowerCase().includes(q);
  });
  const other = chat.chat_type === "direct" ? members.find((m) => m.id !== currentUserId) : null;

  const closePicker = () => {
    setPicking(null);
    setPicked([]);
    setFilter("");
  };

  return (
    <aside className="flex h-full w-full flex-col border-l bg-[#FBFAF8] dark:bg-card xl:w-[280px]" aria-label="Informations sur la conversation">
      <div className="flex items-center justify-between px-4 py-3">
        <h3 className="text-sm font-bold">{isChannel ? "À propos du canal" : isGroup ? "Membres du salon" : "Détails"}</h3>
        <button type="button" onClick={onClose} className="ax-btn ax-btn--ghost ax-btn--icon ax-btn--sm" aria-label="Fermer le panneau">
          <X size={16} aria-hidden />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <div className="flex flex-col items-center gap-2 px-4 pb-4 pt-2 text-center">
          <Avatar className="h-16 w-16">
            {chat.avatar ? <AvatarImage src={chat.avatar} alt="" /> : null}
            <AvatarFallback className={isChannel || isGroup ? "bg-[#EEE9FC] text-[#4E2E9E]" : "bg-[#7954D4] text-xl font-bold text-white"}>
              {isGuide ? <Megaphone size={26} aria-hidden /> : isChannel ? <HandHeart size={26} aria-hidden /> : isGroup ? <Hash size={26} aria-hidden /> : initials(chat.display_name)}
            </AvatarFallback>
          </Avatar>
          <p className="text-base font-bold">{chat.display_name}</p>
          <p className="text-xs text-muted-foreground">
            {isChannel
              ? chat.description || "Canal du Kourel"
              : isGroup
                ? `Salon · ${members.length || chat.members_count || 0} membre${(members.length || chat.members_count || 0) > 1 ? "s" : ""}`
                : [other?.title, roleLabel(other?.role), other?.daara_name].filter(Boolean).join(" · ") || "Discussion privée"}
          </p>

          <div className="mt-1 flex flex-wrap justify-center gap-2">
            <button type="button" className="ax-btn ax-btn--outline ax-btn--sm" onClick={onToggleMute} disabled={busy}>
              {chat.is_muted ? <Bell size={14} aria-hidden /> : <BellOff size={14} aria-hidden />}
              <span className="ax-btn__label">{chat.is_muted ? "Réactiver" : "Sourdine"}</span>
            </button>
            {isGroup && canManage && (
              <button type="button" className="ax-btn ax-btn--outline ax-btn--sm" onClick={() => setPicking("members")}>
                <UserPlus size={14} aria-hidden />
                <span className="ax-btn__label">Ajouter</span>
              </button>
            )}
            {isGuide && isAdmin && (
              <button type="button" className="ax-btn ax-btn--outline ax-btn--sm" onClick={() => setPicking("author")}>
                <PenLine size={14} aria-hidden />
                <span className="ax-btn__label">Désigner un auteur</span>
              </button>
            )}
          </div>
          {chat.is_muted && <p className="text-[11px] text-muted-foreground">Aucune notification pour ce fil.</p>}
        </div>

        {isChannel ? (
          <div className="border-t px-3 py-3">
            <p className="px-2 pb-2 text-[11px] font-bold tracking-wider text-muted-foreground">
              {isGuide ? `AUTEURS — ${members.length}` : "QUI PUBLIE ICI"}
            </p>
            {isGuide ? (
              <ul className="space-y-0.5">
                {members.map((m) => (
                  <li key={m.id} className="flex items-center gap-2.5 rounded-lg px-2 py-1.5">
                    <Avatar className="h-8 w-8">
                      {m.avatar ? <AvatarImage src={m.avatar} alt="" /> : null}
                      <AvatarFallback className="bg-[#2F1966] text-[10px] font-bold text-white">{initials(m.name)}</AvatarFallback>
                    </Avatar>
                    <span className="min-w-0 flex-1 truncate text-sm font-medium">{m.name}</span>
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => onSetAuthor(m.id, false)}
                        className="rounded p-1 text-muted-foreground hover:text-[color:var(--ax-viz-red)]"
                        aria-label={`Retirer ${m.name} des auteurs`}
                      >
                        <UserMinus size={15} aria-hidden />
                      </button>
                    )}
                  </li>
                ))}
                {members.length === 0 && <li className="px-2 text-xs text-muted-foreground">Aucun auteur désigné pour l&apos;instant.</li>}
              </ul>
            ) : (
              <p className="px-2 text-xs leading-relaxed text-muted-foreground">
                Personne : chaque Jëf confirmé y apparaît de lui-même. Le nom du donateur n&apos;est affiché que s&apos;il
                l&apos;a choisi, et le montant jamais.
              </p>
            )}
            <p className="px-2 pt-3 text-[11px] text-muted-foreground">Tout le Kourel est abonné à ce canal.</p>
          </div>
        ) : (
          <div className="border-t px-3 py-3">
            {sections.map((s) => (
              <section key={s.label} className="mb-3">
                <p className="px-2 pb-1 text-[11px] font-bold tracking-wider text-muted-foreground">
                  {s.label.toUpperCase()} — {s.list.length}
                </p>
                <ul className="space-y-0.5">
                  {s.list.map((m) => (
                    <li key={m.id} className="flex items-center gap-2.5 rounded-lg px-2 py-1.5">
                      <span className="relative">
                        <Avatar className="h-8 w-8">
                          {m.avatar ? <AvatarImage src={m.avatar} alt="" /> : null}
                          <AvatarFallback className="bg-[#7954D4] text-[10px] font-bold text-white">{initials(m.name)}</AvatarFallback>
                        </Avatar>
                        {onlineIds.has(m.id) && (
                          <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#FBFAF8] bg-[#1F9D55] dark:border-card" aria-label="Dans la conversation" />
                        )}
                      </span>
                      <span className="min-w-0">
                        <span className={`block truncate text-sm ${onlineIds.has(m.id) ? "font-semibold" : "text-muted-foreground"}`}>
                          {m.name}
                          {m.id === currentUserId ? " (vous)" : ""}
                        </span>
                        <span className="block truncate text-[11px] text-muted-foreground">{[roleLabel(m.role), m.daara_name].filter(Boolean).join(" · ")}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}

        {isGroup && (
          <div className="border-t px-4 py-4">
            <button type="button" className="ax-btn ax-btn--ghost-danger ax-btn--sm w-full" onClick={onLeave} disabled={busy}>
              <LogOut size={14} aria-hidden />
              <span className="ax-btn__label">Quitter le salon</span>
            </button>
          </div>
        )}
      </div>

      <Dialog open={!!picking} onOpenChange={(o) => !o && closePicker()}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>{picking === "author" ? "Désigner un auteur du canal" : `Ajouter au salon « ${chat.display_name} »`}</DialogTitle>
          </DialogHeader>
          {picking === "author" && (
            <p className="text-xs text-muted-foreground">
              Un auteur publie dans « {chat.display_name} » ; chaque publication est envoyée en notification à tout le Kourel.
            </p>
          )}
          <div className="ax-field__control">
            <span className="ax-field__affix ax-field__affix--leading">
              <Search aria-hidden="true" />
            </span>
            <input
              className="ax-input ax-input--sm ax-input--with-leading-icon"
              placeholder="Filtrer…"
              aria-label="Filtrer les membres"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
          </div>
          <div className="h-64 overflow-y-auto rounded-xl border p-2">
            {pickable.length === 0 ? (
              <p className="py-8 text-center text-xs text-muted-foreground">Personne à ajouter.</p>
            ) : (
              <div className="space-y-1">
                {pickable.map((u) => (
                  <label key={u.id} className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm hover:bg-muted/50">
                    <Checkbox
                      checked={picked.includes(u.id)}
                      onCheckedChange={() =>
                        setPicked((p) => (picking === "author" ? (p.includes(u.id) ? [] : [u.id]) : p.includes(u.id) ? p.filter((x) => x !== u.id) : [...p, u.id]))
                      }
                    />
                    <span className="font-medium">
                      {u.first_name} {u.last_name}
                    </span>
                    <span className="text-[11px] text-muted-foreground">{roleLabel(u.role)}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
          <DialogFooter className="gap-2">
            <button type="button" className="ax-btn ax-btn--ghost" onClick={closePicker}>
              <span className="ax-btn__label">Annuler</span>
            </button>
            <button
              type="button"
              className="ax-btn ax-btn--primary"
              disabled={picked.length === 0 || busy}
              onClick={async () => {
                const ok = picking === "author" ? await onSetAuthor(picked[0], true) : await onAddMembers(picked);
                if (ok) closePicker();
              }}
            >
              <span className="ax-btn__label">{picking === "author" ? "Désigner" : `Ajouter${picked.length ? ` (${picked.length})` : ""}`}</span>
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </aside>
  );
}
