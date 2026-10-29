"use client";

/**
 * Le panneau d'informations d'une conversation.
 *
 * L'ancien ne montrait que les membres CONNECTÉS d'un salon — c'est-à-dire,
 * la plupart du temps, personne. On liste désormais tous les membres, ceux
 * qui ont le fil ouvert en tête, et l'on y place les gestes qui manquaient :
 * la sourdine, quitter le salon, y ajouter quelqu'un.
 */
import { useMemo, useState } from "react";
import { Bell, BellOff, Hash, LogOut, Search, UserPlus, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { initials, roleLabel } from "./format";
import type { ChatMember, ChatRow, ManualPickUser } from "./types";

export function ConversationInfo({
  chat,
  members,
  onlineIds,
  currentUserId,
  canManage,
  directoryUsers,
  busy,
  onClose,
  onToggleMute,
  onLeave,
  onAddMembers,
}: {
  chat: ChatRow;
  members: ChatMember[];
  onlineIds: Set<number>;
  currentUserId: number;
  canManage: boolean;
  directoryUsers: ManualPickUser[];
  busy: boolean;
  onClose: () => void;
  onToggleMute: () => void;
  onLeave: () => void;
  onAddMembers: (ids: number[]) => Promise<boolean>;
}) {
  const [adding, setAdding] = useState(false);
  const [picked, setPicked] = useState<number[]>([]);
  const [filter, setFilter] = useState("");
  const isGroup = chat.chat_type === "group";

  const sorted = useMemo(
    () =>
      [...members].sort((a, b) => {
        const oa = onlineIds.has(a.id) ? 0 : 1;
        const ob = onlineIds.has(b.id) ? 0 : 1;
        return oa - ob || a.name.localeCompare(b.name, "fr");
      }),
    [members, onlineIds],
  );

  const memberIds = useMemo(() => new Set(members.map((m) => m.id)), [members]);
  const addable = directoryUsers.filter((u) => {
    if (memberIds.has(u.id) || u.role === "admin") return false;
    const q = filter.trim().toLowerCase();
    return !q || `${u.first_name} ${u.last_name}`.toLowerCase().includes(q);
  });

  const other = !isGroup ? members.find((m) => m.id !== currentUserId) : null;

  return (
    <aside
      className="flex h-full w-full flex-col bg-card lg:w-[300px] lg:border-l"
      aria-label="Informations sur la conversation"
    >
      <div className="flex items-center justify-between border-b px-5 py-4">
        <h3 className="text-sm font-bold">{isGroup ? "Détails du salon" : "Détails"}</h3>
        <button type="button" onClick={onClose} className="ax-btn ax-btn--ghost ax-btn--icon ax-btn--sm" aria-label="Fermer le panneau">
          <X size={16} aria-hidden />
        </button>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
        <div className="flex flex-col items-center gap-3 px-5 py-6 text-center">
          <Avatar className="h-20 w-20">
            {chat.avatar ? <AvatarImage src={chat.avatar} alt="" /> : null}
            <AvatarFallback
              className="text-2xl font-bold"
              style={
                isGroup
                  ? { background: "color-mix(in srgb, var(--ax-accent) 16%, var(--ax-surface))", color: "var(--ax-accent)" }
                  : { background: "var(--ax-accent)", color: "white" }
              }
            >
              {isGroup ? <Hash size={30} aria-hidden /> : initials(chat.display_name)}
            </AvatarFallback>
          </Avatar>
          <div>
            <h4 className="text-base font-bold">{chat.display_name}</h4>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {isGroup
                ? `Salon · ${members.length || chat.members_count || 0} membre${(members.length || chat.members_count || 0) > 1 ? "s" : ""}`
                : [roleLabel(other?.role), other?.daara_name].filter(Boolean).join(" · ") || "Discussion privée"}
            </p>
          </div>

          <div className="mt-1 flex gap-2">
            <button type="button" className="ax-btn ax-btn--outline ax-btn--sm" onClick={onToggleMute} disabled={busy}>
              {chat.is_muted ? <Bell size={14} aria-hidden /> : <BellOff size={14} aria-hidden />}
              <span className="ax-btn__label">{chat.is_muted ? "Réactiver" : "Sourdine"}</span>
            </button>
            {isGroup && canManage && (
              <button type="button" className="ax-btn ax-btn--outline ax-btn--sm" onClick={() => setAdding(true)}>
                <UserPlus size={14} aria-hidden />
                <span className="ax-btn__label">Ajouter</span>
              </button>
            )}
          </div>
          {chat.is_muted && (
            <p className="text-[11px] text-muted-foreground">
              Aucune notification sur votre téléphone pour cette conversation.
            </p>
          )}
        </div>

        {isGroup && (
          <div className="border-t px-3 py-3">
            <p className="px-2 pb-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Membres
              {onlineIds.size > 0 ? ` · ${onlineIds.size} dans le salon` : ""}
            </p>
            <ul className="space-y-0.5">
              {sorted.map((m) => (
                <li key={m.id} className="flex items-center gap-3 rounded-lg px-2 py-1.5">
                  <div className="relative">
                    <Avatar className="h-8 w-8">
                      {m.avatar ? <AvatarImage src={m.avatar} alt="" /> : null}
                      <AvatarFallback className="text-[10px] font-bold text-white" style={{ background: "var(--ax-accent)" }}>
                        {initials(m.name)}
                      </AvatarFallback>
                    </Avatar>
                    {onlineIds.has(m.id) && (
                      <span
                        className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full ring-2 ring-[color:var(--ax-surface)]"
                        style={{ background: "var(--ax-viz-emerald)" }}
                        aria-label="Dans le salon"
                      />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {m.name}
                      {m.id === currentUserId ? <span className="text-muted-foreground font-normal"> (vous)</span> : null}
                    </p>
                    <p className="truncate text-[11px] text-muted-foreground">
                      {[roleLabel(m.role), m.daara_name].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {isGroup && (
          <div className="border-t px-5 py-4">
            <button type="button" className="ax-btn ax-btn--ghost-danger ax-btn--sm w-full" onClick={onLeave} disabled={busy}>
              <LogOut size={14} aria-hidden />
              <span className="ax-btn__label">Quitter le salon</span>
            </button>
          </div>
        )}
      </div>

      <Dialog
        open={adding}
        onOpenChange={(o) => {
          setAdding(o);
          if (!o) {
            setPicked([]);
            setFilter("");
          }
        }}
      >
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Ajouter au salon « {chat.display_name} »</DialogTitle>
          </DialogHeader>
          <div className="ax-field__control">
            <span className="ax-field__affix ax-field__affix--leading">
              <Search aria-hidden="true" />
            </span>
            <input
              className="ax-input ax-input--sm ax-input--with-leading-icon"
              placeholder="Filtrer les membres…"
              aria-label="Filtrer les membres"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
          </div>
          <ScrollArea className="h-64 rounded-xl border p-2">
            {addable.length === 0 ? (
              <p className="py-8 text-center text-xs text-muted-foreground">Tout le monde est déjà dans ce salon.</p>
            ) : (
              <div className="space-y-1">
                {addable.map((u) => (
                  <label key={u.id} className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm hover:bg-muted/50">
                    <Checkbox
                      checked={picked.includes(u.id)}
                      onCheckedChange={() => setPicked((p) => (p.includes(u.id) ? p.filter((x) => x !== u.id) : [...p, u.id]))}
                    />
                    <span className="font-medium">
                      {u.first_name} {u.last_name}
                    </span>
                    <span className="text-[11px] text-muted-foreground">{roleLabel(u.role)}</span>
                  </label>
                ))}
              </div>
            )}
          </ScrollArea>
          <DialogFooter className="gap-2">
            <button type="button" className="ax-btn ax-btn--ghost" onClick={() => setAdding(false)}>
              <span className="ax-btn__label">Annuler</span>
            </button>
            <button
              type="button"
              className="ax-btn ax-btn--primary"
              disabled={picked.length === 0 || busy}
              onClick={async () => {
                if (await onAddMembers(picked)) {
                  setAdding(false);
                  setPicked([]);
                }
              }}
            >
              <span className="ax-btn__label">
                Ajouter{picked.length ? ` (${picked.length})` : ""}
              </span>
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </aside>
  );
}
