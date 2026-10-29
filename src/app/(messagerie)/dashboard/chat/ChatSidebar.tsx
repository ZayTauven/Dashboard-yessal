"use client";

/**
 * La colonne des canaux — façon Discord, validée sur maquette le 2026-10-29.
 *
 *   ← Revenir au tableau de bord
 *   Kourel Yessal                         [écrire · demandes · pilotage · réglages]
 *   CANAUX DU KOUREL   annonces-sangue-bi · jëfs-du-kourel
 *   SALONS             # préparatifs-du-magal …
 *   MESSAGES DIRECTS   visages, présence
 *
 * Les canaux restent en tête quoi qu'il arrive ; salons et directs suivent,
 * chacun trié par activité.
 */
import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowLeft, BellOff, HandHeart, Megaphone, Plus, Search, Settings, Shield, UserCheck } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { initials } from "./format";
import type { ChatRow } from "./types";

export type SidebarPanel = "chats" | "search" | "invites" | "pilotage" | "settings";

function slug(name: string) {
  return name
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-|-$/g, "");
}

function Badge({ count, muted }: { count?: number; muted?: boolean }) {
  if (!count) return null;
  return (
    <span
      className={`flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-extrabold ${
        muted ? "bg-white/20 text-white/80" : "bg-white text-[#2F1966]"
      }`}
      aria-label={`${count} non lu${count > 1 ? "s" : ""}`}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}

export function ChatSidebar({
  chats,
  selectedId,
  panel,
  pendingInvites,
  canPilot,
  canCreateSalon,
  onlineIds,
  onSelect,
  onPanel,
  onCreateSalon,
  children,
}: {
  chats: ChatRow[];
  selectedId: number | null;
  panel: SidebarPanel;
  pendingInvites: number;
  canPilot: boolean;
  canCreateSalon: boolean;
  onlineIds: Set<number>;
  onSelect: (chat: ChatRow) => void;
  onPanel: (panel: SidebarPanel) => void;
  onCreateSalon: () => void;
  /** Le volet ouvert (recherche, demandes, réglages…) remplace les listes. */
  children?: React.ReactNode;
}) {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const match = (c: ChatRow) => !q || c.display_name.toLowerCase().includes(q);

  const channels = useMemo(
    () => chats.filter((c) => c.chat_type === "channel").sort((a) => (a.channel_kind === "guide" ? -1 : 1)),
    [chats],
  );
  const groups = chats.filter((c) => c.chat_type === "group" && match(c));
  const directs = chats.filter((c) => c.chat_type === "direct" && match(c));

  const tools: { panel: SidebarPanel; label: string; icon: React.ReactNode; badge?: number }[] = [
    { panel: "search", label: "Écrire à un membre", icon: <Plus size={17} /> },
    { panel: "invites", label: "Demandes de discussion", icon: <UserCheck size={17} />, badge: pendingInvites },
    ...(canPilot ? [{ panel: "pilotage" as const, label: "Pilotage des échanges", icon: <Shield size={17} /> }] : []),
    { panel: "settings", label: "Réglages de messagerie", icon: <Settings size={17} /> },
  ];

  const row = (chat: ChatRow, icon: React.ReactNode, label: string) => {
    const active = chat.id === selectedId && panel === "chats";
    const unread = chat.unread_count ?? 0;
    return (
      <li key={chat.id}>
        <button
          type="button"
          onClick={() => onSelect(chat)}
          aria-current={active ? "page" : undefined}
          className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm transition-colors ${
            active ? "bg-white/15 text-white" : unread ? "text-white hover:bg-white/10" : "text-[#E1D8F9] hover:bg-white/10"
          }`}
        >
          {icon}
          <span className={`min-w-0 flex-1 truncate ${unread || active ? "font-bold" : "font-medium"}`}>{label}</span>
          {chat.is_muted && <BellOff size={13} className="shrink-0 text-white/50" aria-label="En sourdine" />}
          <Badge count={unread} muted={chat.is_muted} />
        </button>
      </li>
    );
  };

  return (
    <nav aria-label="Canaux et discussions" className="flex h-full min-h-0 flex-col bg-[#2F1966] text-white">
      <div className="space-y-3 px-3 pt-3 pb-2">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-white/15"
        >
          <ArrowLeft size={16} aria-hidden />
          Revenir au tableau de bord
        </Link>

        <div className="flex items-center gap-2.5 px-1">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-[#B79BF3] text-base font-extrabold text-[#2F1966]">
            Y
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[15px] font-extrabold">Kourel Yessal</p>
            <p className="text-[11px] text-[#D7CBF6]">Messagerie</p>
          </div>
        </div>

        <div className="flex items-center gap-1" role="toolbar" aria-label="Actions de la messagerie">
          {tools.map((t) => (
            <button
              key={t.panel}
              type="button"
              onClick={() => onPanel(panel === t.panel ? "chats" : t.panel)}
              aria-pressed={panel === t.panel}
              aria-label={t.label}
              title={t.label}
              className={`relative flex h-9 flex-1 items-center justify-center rounded-lg transition-colors ${
                panel === t.panel ? "bg-white text-[#2F1966]" : "bg-white/10 text-white hover:bg-white/15"
              }`}
            >
              {t.icon}
              {t.badge ? (
                <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#B79BF3] px-1 text-[9px] font-extrabold text-[#2F1966]">
                  {t.badge}
                </span>
              ) : null}
            </button>
          ))}
        </div>
      </div>

      {panel !== "chats" ? (
        <div className="m-2 mt-1 flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl bg-card text-foreground">{children}</div>
      ) : (
        <>
          <div className="px-3 pb-2">
            <label className="flex items-center gap-2 rounded-lg bg-white/10 px-2.5 py-1.5 focus-within:bg-white/15">
              <Search size={14} className="text-[#D7CBF6]" aria-hidden />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Trouver une discussion"
                aria-label="Trouver une discussion"
                className="w-full bg-transparent text-[13px] text-white outline-none placeholder:text-[#D7CBF6]/80"
              />
            </label>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 pb-3">
            {channels.length > 0 && (
              <section aria-labelledby="sec-canaux" className="mb-3">
                <h2 id="sec-canaux" className="px-2.5 pb-1 pt-2 text-[11px] font-bold tracking-wider text-[#B79BF3]">
                  CANAUX DU KOUREL
                </h2>
                <ul>
                  {channels.map((c) =>
                    row(
                      c,
                      c.channel_kind === "guide" ? (
                        <Megaphone size={17} className="shrink-0 text-[#D7CBF6]" aria-hidden />
                      ) : (
                        <HandHeart size={17} className="shrink-0 text-[#D7CBF6]" aria-hidden />
                      ),
                      slug(c.display_name),
                    ),
                  )}
                </ul>
              </section>
            )}

            <section aria-labelledby="sec-salons" className="mb-3">
              <div className="flex items-center justify-between px-2.5 pb-1 pt-2">
                <h2 id="sec-salons" className="text-[11px] font-bold tracking-wider text-[#B79BF3]">
                  SALONS
                </h2>
                {canCreateSalon && (
                  <button
                    type="button"
                    onClick={onCreateSalon}
                    aria-label="Créer un salon"
                    title="Créer un salon"
                    className="rounded p-0.5 text-[#D7CBF6] hover:bg-white/10 hover:text-white"
                  >
                    <Plus size={15} aria-hidden />
                  </button>
                )}
              </div>
              <ul>
                {groups.map((c) =>
                  row(c, <span aria-hidden className="w-[17px] shrink-0 text-center text-base font-bold text-[#B79BF3]">#</span>, slug(c.display_name)),
                )}
                {groups.length === 0 && <li className="px-2.5 py-1.5 text-xs text-[#D7CBF6]/80">Aucun salon.</li>}
              </ul>
            </section>

            <section aria-labelledby="sec-directs">
              <h2 id="sec-directs" className="px-2.5 pb-1 pt-2 text-[11px] font-bold tracking-wider text-[#B79BF3]">
                MESSAGES DIRECTS
              </h2>
              <ul>
                {directs.map((c) =>
                  row(
                    c,
                    <span className="relative shrink-0">
                      <Avatar className="h-7 w-7">
                        {c.avatar ? <AvatarImage src={c.avatar} alt="" /> : null}
                        <AvatarFallback className="bg-[#7954D4] text-[10px] font-bold text-white">{initials(c.display_name)}</AvatarFallback>
                      </Avatar>
                      {c.peer_id && onlineIds.has(c.peer_id) ? (
                        <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#2F1966] bg-[#1F9D55]" aria-label="Dans la conversation" />
                      ) : null}
                    </span>,
                    c.display_name,
                  ),
                )}
                {directs.length === 0 && (
                  <li>
                    <button
                      type="button"
                      onClick={() => onPanel("search")}
                      className="px-2.5 py-1.5 text-left text-xs text-[#D7CBF6] underline-offset-2 hover:underline"
                    >
                      Écrire à un membre de votre Daara
                    </button>
                  </li>
                )}
              </ul>
            </section>
          </div>
        </>
      )}
    </nav>
  );
}
