"use client";

/**
 * La liste des conversations.
 *
 * Planche Fundio « Chats » et brief §4.3 (écran 8) : des pilules de filtre
 * au-dessus d'une liste unique triée par récence. Le serveur trie déjà
 * (`last_activity`) ; on retrie ici après chaque événement temps réel.
 */
import { useMemo, useState } from "react";
import { BellOff, Hash, Plus, Search, Users } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatListStamp, initials } from "./format";
import type { ChatRow } from "./types";

type Filter = "all" | "unread" | "group" | "direct";

const FILTERS: { value: Filter; label: string }[] = [
  { value: "all", label: "Tous" },
  { value: "unread", label: "Non lus" },
  { value: "group", label: "Salons" },
  { value: "direct", label: "Directs" },
];

export function sortByActivity(rows: ChatRow[]) {
  const at = (c: ChatRow) => new Date(c.last_message?.sent_at || c.last_activity_at || 0).getTime();
  return [...rows].sort((a, b) => at(b) - at(a));
}

export function ConversationList({
  chats,
  selectedId,
  typingByChat,
  canCreateSalon,
  onSelect,
  onCreateSalon,
  onFindMember,
}: {
  chats: ChatRow[];
  selectedId: number | null;
  typingByChat: Record<number, boolean>;
  canCreateSalon: boolean;
  onSelect: (chat: ChatRow) => void;
  onCreateSalon: () => void;
  onFindMember: () => void;
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const counts = useMemo(
    () => ({
      unread: chats.filter((c) => (c.unread_count ?? 0) > 0).length,
    }),
    [chats],
  );

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return chats.filter((c) => {
      if (q && !c.display_name.toLowerCase().includes(q)) return false;
      if (filter === "unread") return (c.unread_count ?? 0) > 0;
      if (filter === "group") return c.chat_type === "group";
      if (filter === "direct") return c.chat_type === "direct";
      return true;
    });
  }, [chats, query, filter]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="space-y-3 border-b px-4 pt-4 pb-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-base font-bold tracking-tight">Discussions</h2>
          <button
            type="button"
            className="ax-btn ax-btn--primary ax-btn--sm"
            onClick={canCreateSalon ? onCreateSalon : onFindMember}
            title={canCreateSalon ? "Créer un salon" : "Écrire à un membre"}
          >
            <Plus size={14} aria-hidden />
            <span className="ax-btn__label">{canCreateSalon ? "Salon" : "Nouveau"}</span>
          </button>
        </div>
        <div className="ax-field__control">
          <span className="ax-field__affix ax-field__affix--leading">
            <Search aria-hidden="true" />
          </span>
          <input
            type="search"
            className="ax-input ax-input--sm ax-input--with-leading-icon"
            placeholder="Rechercher une conversation…"
            aria-label="Rechercher une conversation"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-1.5 overflow-x-auto -mx-1 px-1 pb-0.5" role="tablist" aria-label="Filtrer les conversations">
          {FILTERS.map((f) => {
            const active = filter === f.value;
            return (
              <button
                key={f.value}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setFilter(f.value)}
                className={`shrink-0 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                  active ? "text-white border-transparent" : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                }`}
                style={active ? { background: "var(--ax-accent)" } : undefined}
              >
                {f.label}
                {f.value === "unread" && counts.unread > 0 ? (
                  <span className={`ms-1.5 font-bold ${active ? "" : "text-[color:var(--ax-accent)]"}`}>{counts.unread}</span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
        <ul className="py-1.5" aria-label="Conversations">
          {visible.map((chat) => {
            const selected = selectedId === chat.id;
            const unread = chat.unread_count ?? 0;
            const typing = typingByChat[chat.id];
            const last = chat.last_message;
            /* Une note système (« X a rejoint ») n'est la parole de personne : pas d'auteur devant. */
            const prefix =
              !last || last.message_type === "system"
                ? ""
                : last.is_mine
                  ? "Vous : "
                  : chat.chat_type === "group"
                    ? `${last.sender_name.split(" ")[0]} : `
                    : "";
            return (
              <li key={chat.id}>
                <button
                  type="button"
                  onClick={() => onSelect(chat)}
                  aria-current={selected ? "true" : undefined}
                  className={`mx-2 my-0.5 flex w-[calc(100%-1rem)] items-center gap-3 rounded-xl px-2.5 py-2.5 text-left transition-colors ${
                    selected ? "" : "hover:bg-muted/50"
                  }`}
                  style={selected ? { background: "color-mix(in srgb, var(--ax-accent) 11%, transparent)" } : undefined}
                >
                  <div className="relative shrink-0">
                    <Avatar className="h-11 w-11">
                      {chat.avatar ? <AvatarImage src={chat.avatar} alt="" /> : null}
                      <AvatarFallback
                        className="text-sm font-bold"
                        style={
                          chat.chat_type === "group"
                            ? { background: "color-mix(in srgb, var(--ax-accent) 16%, var(--ax-surface))", color: "var(--ax-accent)" }
                            : { background: "var(--ax-accent)", color: "white" }
                        }
                      >
                        {chat.chat_type === "group" ? <Hash size={18} aria-hidden /> : initials(chat.display_name)}
                      </AvatarFallback>
                    </Avatar>
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className={`truncate text-sm ${unread ? "font-bold" : "font-semibold"}`}>{chat.display_name}</span>
                      <span
                        className={`shrink-0 text-[11px] ${unread ? "font-semibold" : "text-muted-foreground"}`}
                        style={unread ? { color: "var(--ax-accent)" } : undefined}
                      >
                        {formatListStamp(last?.sent_at || chat.last_activity_at)}
                      </span>
                    </div>
                    <div className="mt-0.5 flex items-center justify-between gap-2">
                      <p className={`truncate text-xs ${unread ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                        {typing ? (
                          <span className="italic" style={{ color: "var(--ax-accent)" }}>
                            écrit…
                          </span>
                        ) : last ? (
                          <>
                            {prefix}
                            {last.content}
                          </>
                        ) : (
                          <span className="italic">
                            {chat.chat_type === "group" ? `${chat.members_count ?? 0} membres · aucun message` : "Aucun message"}
                          </span>
                        )}
                      </p>
                      <span className="flex shrink-0 items-center gap-1">
                        {chat.is_muted && <BellOff size={12} className="text-muted-foreground" aria-label="En sourdine" />}
                        {unread > 0 && (
                          <span
                            className="flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold text-white"
                            style={{ background: chat.is_muted ? "var(--ax-text-subtle)" : "var(--ax-accent)" }}
                            aria-label={`${unread} non lu${unread > 1 ? "s" : ""}`}
                          >
                            {unread > 99 ? "99+" : unread}
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>

        {visible.length === 0 && (
          <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
            <span
              className="flex h-12 w-12 items-center justify-center rounded-2xl"
              style={{ background: "color-mix(in srgb, var(--ax-accent) 12%, transparent)" }}
            >
              <Users size={22} style={{ color: "var(--ax-accent)" }} aria-hidden />
            </span>
            <p className="text-sm font-semibold">
              {chats.length === 0 ? "Aucune discussion pour l'instant" : "Rien ne correspond"}
            </p>
            <p className="text-xs text-muted-foreground">
              {chats.length === 0
                ? "Trouvez un membre de votre Daara et envoyez-lui une demande de discussion."
                : "Essayez un autre filtre ou un autre nom."}
            </p>
            {chats.length === 0 && (
              <button type="button" className="ax-btn ax-btn--outline ax-btn--sm" onClick={onFindMember}>
                <span className="ax-btn__label">Trouver un membre</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
