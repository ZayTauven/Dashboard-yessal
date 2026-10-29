"use client";

/**
 * Le fil d'une conversation, en lignes à la Discord (maquette validée le
 * 2026-10-29).
 *
 * — **Les grappes.** Une suite de messages du même auteur ne répète ni son
 *   visage, ni son nom, ni son titre : la première ligne les porte, les
 *   suivantes n'ont que leur texte, et l'heure au survol.
 * — **Le titre du membre** (AMIR, DIEUWRIGNE…) en étiquette à côté du nom.
 * — **Les actions** flottent en haut à droite de la ligne survolée — et
 *   s'ouvrent aussi au clavier (focus) et au toucher.
 * — **Les canaux.** « Les Jëfs du Kourel » montre des cartes composées par le
 *   serveur ; « Annonces de Sangue Bi » montre ses publications en articles.
 *   Dans les deux, on réagit — on ne répond pas.
 * — **Le défilement** ne suit le bas que si l'on y était déjà ; sinon un
 *   bouton compte ce qui est arrivé.
 */
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  ArrowDown,
  Ban,
  CheckCheck,
  Copy,
  Download,
  FileText,
  Loader2,
  Pencil,
  Reply,
  RotateCcw,
  SmilePlus,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { AudioPlayer, JefCardView } from "./ChannelCards";
import { buildThread, formatFileSize, formatTime, initials, roleLabel, tokenize, type ThreadEntry } from "./format";
import type { ChatRow, MessageRow } from "./types";

export const QUICK_REACTIONS = ["👍", "❤️", "🙏", "🤲", "😂", "😮"];

/** En deçà de cette distance du bas, on considère qu'on « suit » le fil. */
const STICKY_PX = 120;

/** Une couleur de nom stable par membre, prise dans la rampe de la marque. */
const NAME_COLORS = ["#4E2E9E", "#1C4E7A", "#1A5C3A", "#8F5F0A", "#6E2A50", "#2F1966"];
const nameColor = (id: number) => NAME_COLORS[Math.abs(id) % NAME_COLORS.length];

type Props = {
  chat: ChatRow;
  messages: MessageRow[];
  currentUserId: number;
  canDeleteAny: boolean;
  typingNames: string[];
  loading: boolean;
  hasMore: boolean;
  loadingOlder: boolean;
  unreadFromId: number | null;
  unreadCount: number;
  onLoadOlder: () => void;
  onReply: (m: MessageRow) => void;
  onReact: (m: MessageRow, emoji: string) => void;
  onDelete: (m: MessageRow) => void;
  onRetry: (m: MessageRow) => void;
  onEdit: (m: MessageRow, text: string) => Promise<boolean>;
  /** Un message à faire clignoter et rejoindre (résultat de recherche). */
  focusId?: number | null;
};

export function MessageThread({
  chat,
  messages,
  currentUserId,
  canDeleteAny,
  typingNames,
  loading,
  hasMore,
  loadingOlder,
  unreadFromId,
  unreadCount,
  onLoadOlder,
  onReply,
  onReact,
  onDelete,
  onRetry,
  onEdit,
  focusId,
}: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const atBottomRef = useRef(true);
  const prevHeightRef = useRef(0);
  const prevFirstIdRef = useRef<number | null>(null);
  const prevCountRef = useRef(0);
  const [missed, setMissed] = useState(0);
  const [away, setAway] = useState(false);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [flashId, setFlashId] = useState<number | null>(null);
  const [lightbox, setLightbox] = useState<MessageRow | null>(null);

  const isChannel = chat.chat_type === "channel";
  const isDirect = chat.chat_type === "direct";

  const entries = useMemo(
    () => buildThread(messages, unreadFromId, unreadCount),
    [messages, unreadFromId, unreadCount],
  );

  /* Le dernier de MES messages que l'autre a lu — c'est sous lui que « Vu » s'affiche. */
  const peerReadAt = chat.peer_last_read_at ?? null;
  const seenId = useMemo(() => {
    if (!isDirect || !peerReadAt) return null;
    const limit = new Date(peerReadAt).getTime();
    let found: number | null = null;
    for (const m of messages) {
      if (m.sender.id === currentUserId && !m.local && new Date(m.sent_at).getTime() <= limit) found = m.id;
    }
    return found;
  }, [messages, isDirect, peerReadAt, currentUserId]);

  useEffect(() => {
    atBottomRef.current = true;
    prevFirstIdRef.current = null;
    prevCountRef.current = 0;
    setMissed(0);
    setAway(false);
    setActiveId(null);
    setEditingId(null);
  }, [chat.id]);

  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const firstId = messages[0]?.id ?? null;
    const prepended =
      prevFirstIdRef.current !== null && firstId !== prevFirstIdRef.current && messages.length > prevCountRef.current;

    if (prepended) {
      el.scrollTop = el.scrollHeight - prevHeightRef.current + el.scrollTop;
    } else if (atBottomRef.current) {
      el.scrollTop = el.scrollHeight;
    } else if (messages.length > prevCountRef.current) {
      const arrived = messages.slice(prevCountRef.current);
      if (arrived.some((m) => m.sender.id === currentUserId && m.local)) {
        el.scrollTop = el.scrollHeight;
      } else {
        const fromOthers = arrived.filter((m) => m.sender.id !== currentUserId).length;
        if (fromOthers) setMissed((n) => n + fromOthers);
      }
    }
    prevHeightRef.current = el.scrollHeight;
    prevFirstIdRef.current = firstId;
    prevCountRef.current = messages.length;
  }, [messages, currentUserId]);

  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (el && atBottomRef.current) el.scrollTop = el.scrollHeight;
  }, [typingNames.length]);

  const onScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
    atBottomRef.current = distance < STICKY_PX;
    setAway(distance > STICKY_PX * 4);
    if (atBottomRef.current) setMissed(0);
    if (el.scrollTop < 80 && hasMore && !loadingOlder) {
      prevHeightRef.current = el.scrollHeight;
      onLoadOlder();
    }
  }, [hasMore, loadingOlder, onLoadOlder]);

  const jumpToBottom = () => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    setMissed(0);
  };

  const jumpTo = useCallback((id: number) => {
    const node = scrollRef.current?.querySelector(`[data-msg="${id}"]`);
    if (!node) {
      toast.info("Ce message est plus haut dans l'historique.", {
        description: "Remontez le fil pour charger les messages précédents.",
      });
      return;
    }
    node.scrollIntoView({ behavior: "smooth", block: "center" });
    setFlashId(id);
    window.setTimeout(() => setFlashId(null), 1400);
  }, []);

  useEffect(() => {
    if (focusId) jumpTo(focusId);
  }, [focusId, jumpTo]);

  return (
    <div className="relative min-h-0 flex-1">
      <div
        ref={scrollRef}
        onScroll={onScroll}
        className={`h-full overflow-y-auto ${isChannel ? "bg-[#F7F7F5] dark:bg-background" : "bg-card"}`}
        role="log"
        aria-live="polite"
        aria-relevant="additions"
        aria-label="Messages de la conversation"
      >
        {loading ? (
          <ThreadSkeleton />
        ) : (
          <div className={`mx-auto pb-4 ${isChannel ? "max-w-2xl px-4" : "max-w-5xl"}`}>
            {hasMore && (
              <div className="flex justify-center py-3">
                <button type="button" className="ax-btn ax-btn--ghost ax-btn--sm" onClick={onLoadOlder} disabled={loadingOlder}>
                  {loadingOlder ? <Loader2 size={14} className="animate-spin" aria-hidden /> : null}
                  <span className="ax-btn__label">{loadingOlder ? "Chargement…" : "Messages précédents"}</span>
                </button>
              </div>
            )}

            {!hasMore && messages.length > 0 && <ThreadIntro chat={chat} />}

            {messages.length === 0 && <ThreadIntro chat={chat} empty />}

            {entries.map((entry) =>
              entry.kind === "message" && isChannel ? (
                <ChannelPost
                  key={entry.key}
                  message={entry.message}
                  chat={chat}
                  currentUserId={currentUserId}
                  canDeleteAny={canDeleteAny}
                  flashing={flashId === entry.message.id}
                  onReact={onReact}
                  onDelete={onDelete}
                  onOpenImage={setLightbox}
                />
              ) : (
                <ThreadItem
                  key={entry.key}
                  entry={entry}
                  isChannel={isChannel}
                  currentUserId={currentUserId}
                  canDeleteAny={canDeleteAny}
                  seen={entry.kind === "message" && entry.message.id === seenId}
                  active={entry.kind === "message" && activeId === entry.message.id}
                  editing={entry.kind === "message" && editingId === entry.message.id}
                  flashing={entry.kind === "message" && flashId === entry.message.id}
                  onActivate={(id) => setActiveId((cur) => (cur === id ? null : id))}
                  onStartEdit={setEditingId}
                  onSubmitEdit={async (m, text) => {
                    if (await onEdit(m, text)) setEditingId(null);
                  }}
                  onCancelEdit={() => setEditingId(null)}
                  onReply={onReply}
                  onReact={onReact}
                  onDelete={onDelete}
                  onRetry={onRetry}
                  onJump={jumpTo}
                  onOpenImage={setLightbox}
                />
              ),
            )}

            {typingNames.length > 0 && (
              <div className="flex items-center gap-2 px-5 pt-2" aria-live="polite">
                <span className="yc-typing inline-flex items-center gap-1 rounded-full bg-muted px-3 py-2">
                  <span />
                  <span />
                  <span />
                </span>
                <span className="text-xs text-muted-foreground">
                  {typingNames.length === 1 ? `${typingNames[0]} écrit…` : `${typingNames.slice(0, 2).join(" et ")} écrivent…`}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {missed > 0 || away ? (
        <button
          type="button"
          onClick={jumpToBottom}
          className="yc-enter absolute bottom-4 right-5 flex items-center gap-2 rounded-full border bg-card px-3 py-2 text-xs font-semibold shadow-md transition-colors hover:bg-muted"
          aria-label={missed > 0 ? `${missed} nouveaux messages, aller en bas` : "Aller au dernier message"}
        >
          <ArrowDown size={14} aria-hidden />
          {missed > 0 ? `${missed} nouveau${missed > 1 ? "x" : ""}` : null}
        </button>
      ) : null}

      <Dialog open={!!lightbox} onOpenChange={(o) => !o && setLightbox(null)}>
        <DialogContent className="max-w-4xl bg-card p-2 sm:p-3">
          <DialogTitle className="sr-only">{lightbox?.file_name || "Image"}</DialogTitle>
          {lightbox?.file_url && (
            <div className="flex flex-col gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={lightbox.file_url} alt={lightbox.content || lightbox.file_name || "Image partagée"} className="max-h-[75vh] w-full rounded-lg object-contain" />
              <div className="flex items-center justify-between gap-3 px-1">
                <span className="truncate text-xs text-muted-foreground">
                  {lightbox.sender.name} · {formatTime(lightbox.sent_at)}
                </span>
                <a href={lightbox.file_url} download className="ax-btn ax-btn--outline ax-btn--sm">
                  <Download size={14} aria-hidden />
                  <span className="ax-btn__label">Télécharger</span>
                </a>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

/** L'en-tête du fil, quand on est remonté à son tout début (ou qu'il est vide). */
function ThreadIntro({ chat, empty = false }: { chat: ChatRow; empty?: boolean }) {
  const title =
    chat.chat_type === "channel" ? chat.display_name : chat.chat_type === "group" ? `Bienvenue dans #${chat.display_name}` : chat.display_name;
  const body =
    chat.chat_type === "channel"
      ? chat.description || "Un canal du Kourel."
      : chat.chat_type === "group"
        ? empty
          ? "Lancez la discussion : un mot d'accueil suffit souvent à délier les langues."
          : "C'est le tout début de ce salon."
        : empty
          ? "Écrivez le premier message — une salutation, une question, un rappel."
          : "C'est le tout début de votre discussion.";
  return (
    <div className="px-5 pb-2 pt-8">
      <p className="text-2xl font-extrabold tracking-tight">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{body}</p>
      <div className="mt-5 h-px bg-border" />
    </div>
  );
}

function ThreadSkeleton() {
  return (
    <div className="mx-auto max-w-5xl space-y-5 px-5 py-6" aria-hidden>
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="flex gap-3">
          <div className="h-10 w-10 shrink-0 animate-pulse rounded-full bg-muted" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-40 animate-pulse rounded bg-muted" />
            <div className="h-4 animate-pulse rounded bg-muted" style={{ width: `${55 + i * 9}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function Reactions({
  message,
  onReact,
  light = false,
}: {
  message: MessageRow;
  onReact: (m: MessageRow, emoji: string) => void;
  light?: boolean;
}) {
  const reactions = message.reactions ?? [];
  return (
    <div className="flex flex-wrap items-center gap-1">
      {reactions.map((r) => (
        <button
          key={r.emoji}
          type="button"
          onClick={() => onReact(message, r.emoji)}
          aria-pressed={r.reacted_by_me}
          aria-label={`${r.emoji} ${r.count} — ${r.reacted_by_me ? "retirer ma réaction" : "réagir aussi"}`}
          className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[13px] transition-transform hover:scale-105 ${
            r.reacted_by_me
              ? "border-[#B79BF3] bg-[#EEE9FC] text-[#2F1966]"
              : light
                ? "border-white/20 bg-white/15"
                : "border-border bg-card"
          }`}
        >
          <span>{r.emoji}</span>
          <span className="text-[11px] font-bold">{r.count}</span>
        </button>
      ))}
      <ReactPicker onPick={(e) => onReact(message, e)} light={light} inline />
    </div>
  );
}

/** Une publication d'un canal : carte de Jëf, ou annonce du guide en article. */
function ChannelPost({
  message: m,
  chat,
  currentUserId,
  canDeleteAny,
  flashing,
  onReact,
  onDelete,
  onOpenImage,
}: {
  message: MessageRow;
  chat: ChatRow;
  currentUserId: number;
  canDeleteAny: boolean;
  flashing: boolean;
  onReact: (m: MessageRow, emoji: string) => void;
  onDelete: (m: MessageRow) => void;
  onOpenImage: (m: MessageRow) => void;
}) {
  const canDelete = !m.is_deleted && !m.local && (m.sender.id === currentUserId || canDeleteAny);

  if (m.message_type === "card" && m.payload?.kind === "jef") {
    return (
      <div data-msg={m.id} className={`mt-3 ${flashing ? "yc-flash" : ""}`}>
        <JefCardView message={m}>
          <Reactions message={m} onReact={onReact} light={m.payload.variant === "palier"} />
        </JefCardView>
      </div>
    );
  }

  const image = m.file_kind === "image" && m.file_url && !m.is_deleted;
  return (
    <article data-msg={m.id} className={`group relative mt-3 overflow-hidden rounded-2xl border bg-card ${flashing ? "yc-flash" : ""}`}>
      {image ? (
        <button type="button" className="block w-full" onClick={() => onOpenImage(m)} aria-label="Agrandir l'image">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={m.file_url!} alt={m.content || "Illustration de l'annonce"} className="max-h-80 w-full object-cover" loading="lazy" />
        </button>
      ) : null}
      <div className="p-4">
        <div className="mb-2 flex items-center gap-2">
          <Avatar className="h-8 w-8">
            {m.sender.avatar ? <AvatarImage src={m.sender.avatar} alt="" /> : null}
            <AvatarFallback className="bg-[#2F1966] text-[11px] font-bold text-white">{initials(m.sender.name)}</AvatarFallback>
          </Avatar>
          <span className="text-sm font-bold text-[#2F1966] dark:text-[#D7CBF6]">{chat.channel_kind === "guide" ? "Sangue Bi" : m.sender.name}</span>
          <span className="text-xs text-muted-foreground">{formatTime(m.sent_at)}</span>
        </div>
        {m.is_deleted ? (
          <p className="inline-flex items-center gap-1.5 text-sm italic text-muted-foreground">
            <Ban size={13} aria-hidden /> Publication retirée
          </p>
        ) : (
          <>
            {m.file_kind === "audio" && m.file_url ? (
              <div className="mb-2 rounded-xl bg-[#F4F1FB] p-3 dark:bg-muted"><AudioPlayer src={m.file_url} /></div>
            ) : m.file_kind === "document" && m.file_url ? (
              <DocumentCard m={m} />
            ) : null}
            {m.content && m.content !== m.file_name ? (
              <p className="whitespace-pre-wrap text-[15px] leading-relaxed">{m.content}</p>
            ) : null}
          </>
        )}
        <div className="mt-3 flex items-center justify-between gap-2">
          {!m.is_deleted ? <Reactions message={m} onReact={onReact} /> : <span />}
          {canDelete && (
            <button
              type="button"
              onClick={() => onDelete(m)}
              className="rounded-md p-1.5 text-muted-foreground opacity-0 transition-opacity hover:text-[color:var(--ax-viz-red)] focus:opacity-100 group-hover:opacity-100"
              aria-label="Retirer la publication"
            >
              <Trash2 size={15} aria-hidden />
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

function DocumentCard({ m }: { m: MessageRow }) {
  const ext = (m.file_name ?? m.local?.file?.name ?? "").split(".").pop()?.toUpperCase().slice(0, 4) || "DOC";
  return (
    <a
      href={m.file_url ?? undefined}
      target="_blank"
      rel="noreferrer"
      className="mt-1 flex max-w-sm items-center gap-3 rounded-xl border bg-[#F4F1FB] p-2.5 pe-4 transition-colors hover:bg-[#ECE6FB] dark:bg-muted"
    >
      <span className={`flex h-11 w-10 shrink-0 items-center justify-center rounded-md text-[10px] font-extrabold text-white ${ext === "PDF" ? "bg-[#A62B2B]" : "bg-[#4E2E9E]"}`}>
        {ext}
      </span>
      <span className="min-w-0">
        <span className="block max-w-[240px] truncate text-sm font-semibold">{m.file_name || m.local?.file?.name || "Document"}</span>
        <span className="block text-xs text-muted-foreground">{formatFileSize(m.file_size ?? m.local?.file?.size)} · Ouvrir</span>
      </span>
      <FileText size={18} className="ms-auto shrink-0 text-[#4E2E9E]" aria-hidden />
    </a>
  );
}

function ThreadItem({
  entry,
  isChannel,
  currentUserId,
  canDeleteAny,
  seen,
  active,
  editing,
  flashing,
  onActivate,
  onStartEdit,
  onSubmitEdit,
  onCancelEdit,
  onReply,
  onReact,
  onDelete,
  onRetry,
  onJump,
  onOpenImage,
}: {
  entry: ThreadEntry;
  isChannel: boolean;
  currentUserId: number;
  canDeleteAny: boolean;
  seen: boolean;
  active: boolean;
  editing: boolean;
  flashing: boolean;
  onActivate: (id: number) => void;
  onStartEdit: (id: number) => void;
  onSubmitEdit: (m: MessageRow, text: string) => void;
  onCancelEdit: () => void;
  onReply: (m: MessageRow) => void;
  onReact: (m: MessageRow, emoji: string) => void;
  onDelete: (m: MessageRow) => void;
  onRetry: (m: MessageRow) => void;
  onJump: (id: number) => void;
  onOpenImage: (m: MessageRow) => void;
}) {
  if (entry.kind === "day") {
    return (
      <div className="flex items-center gap-3 px-5 py-3" role="separator">
        <div className="h-px flex-1 bg-border" />
        <span className="text-[11px] font-semibold text-muted-foreground first-letter:uppercase">{entry.label}</span>
        <div className="h-px flex-1 bg-border" />
      </div>
    );
  }
  if (entry.kind === "unread") {
    return (
      <div className="flex items-center gap-3 px-5 py-2" role="separator">
        <div className="h-px flex-1 bg-[#A62B2B]/60" />
        <span className="rounded bg-[#A62B2B] px-1.5 py-0.5 text-[10px] font-bold uppercase text-white">
          {entry.count} non lu{entry.count > 1 ? "s" : ""}
        </span>
      </div>
    );
  }
  if (entry.kind === "system") {
    return (
      <p className="px-5 py-1.5 text-center text-xs text-muted-foreground">{entry.message.content}</p>
    );
  }

  const { message: m, first } = entry;
  const mine = m.sender.id === currentUserId;
  const canDelete = !m.local && !m.is_deleted && (mine || canDeleteAny);
  const canEdit = mine && !m.local && !m.is_deleted && m.message_type === "text";
  const isImage = m.file_kind === "image" || (m.message_type === "file" && m.file_is_image);
  const imageSrc = m.local?.previewUrl || m.file_url;
  const staff = m.sender.role === "admin" || m.sender.role === "chef_daara";

  return (
    <div
      data-msg={m.id}
      className={`yc-row group relative flex gap-3 px-5 py-0.5 transition-colors hover:bg-muted/40 ${first ? "mt-3 pt-1" : ""} ${
        active ? "is-active bg-muted/40" : ""
      } ${flashing ? "yc-flash" : ""} ${m.local ? "yc-enter" : ""}`}
      onClick={() => !m.is_deleted && !editing && onActivate(m.id)}
    >
      <div className="w-10 shrink-0">
        {first ? (
          <Avatar className="h-10 w-10">
            {m.sender.avatar ? <AvatarImage src={m.sender.avatar} alt="" /> : null}
            <AvatarFallback className="text-xs font-bold text-white" style={{ background: nameColor(m.sender.id) }}>
              {initials(m.sender.name)}
            </AvatarFallback>
          </Avatar>
        ) : (
          <span className="block pt-1 text-right text-[10px] tabular-nums text-muted-foreground opacity-0 group-hover:opacity-100">
            {formatTime(m.sent_at)}
          </span>
        )}
      </div>

      <div className={`min-w-0 flex-1 ${m.local?.status === "sending" ? "opacity-70" : ""}`}>
        {first && (
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <span className="text-[15px] font-bold" style={{ color: nameColor(m.sender.id) }}>
              {m.sender.name}
            </span>
            {m.sender.title ? (
              <span className="rounded-[5px] bg-[#EEE9FC] px-1.5 py-px text-[10px] font-extrabold tracking-wide text-[#4E2E9E]">
                {m.sender.title.toUpperCase()}
              </span>
            ) : null}
            {staff ? (
              <span className="rounded-[5px] bg-[#2F1966] px-1.5 py-px text-[10px] font-extrabold tracking-wide text-white">
                {roleLabel(m.sender.role).toUpperCase()}
              </span>
            ) : null}
            <span className="text-xs text-muted-foreground">{formatTime(m.sent_at)}</span>
          </div>
        )}

        {m.is_deleted ? (
          <p className="inline-flex items-center gap-1.5 text-sm italic text-muted-foreground">
            <Ban size={13} aria-hidden /> Message supprimé
          </p>
        ) : editing ? (
          <InlineEditor initial={m.content} onSubmit={(t) => onSubmitEdit(m, t)} onCancel={onCancelEdit} />
        ) : (
          <>
            {m.reply_preview && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onJump(m.reply_preview!.id);
                }}
                className="mt-1 flex max-w-xl items-center gap-2 rounded-e-lg border-s-[3px] border-[#B79BF3] bg-[#F4F1FB] px-3 py-1 text-left text-[13px] text-muted-foreground hover:bg-[#ECE6FB] dark:bg-muted"
                aria-label={`Voir le message cité de ${m.reply_preview.sender_name}`}
              >
                <Reply size={13} className="shrink-0 text-[#4E2E9E]" aria-hidden />
                <strong className="shrink-0 font-semibold text-[#4E2E9E]">{m.reply_preview.sender_name}</strong>
                <span className="truncate">{m.reply_preview.content}</span>
              </button>
            )}

            {isImage && imageSrc ? (
              <button
                type="button"
                className="mt-1 block overflow-hidden rounded-xl border"
                onClick={(e) => {
                  e.stopPropagation();
                  if (!m.local) onOpenImage(m);
                }}
                aria-label={`Agrandir l'image ${m.file_name ?? ""}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imageSrc} alt={m.content || m.file_name || "Image partagée"} loading="lazy" className="block max-h-80 max-w-sm object-cover" />
              </button>
            ) : m.file_kind === "audio" && (m.file_url || m.local) ? (
              <div className="mt-1 inline-block rounded-xl bg-[#F4F1FB] px-3 py-2 dark:bg-muted" onClick={(e) => e.stopPropagation()}>
                {m.file_url ? <AudioPlayer src={m.file_url} /> : <span className="text-xs text-muted-foreground">Note vocale en cours d&apos;envoi…</span>}
              </div>
            ) : m.file_kind === "video" && m.file_url ? (
              <video src={m.file_url} controls preload="metadata" className="mt-1 max-h-80 max-w-sm rounded-xl border" onClick={(e) => e.stopPropagation()} />
            ) : m.message_type === "file" ? (
              <DocumentCard m={m} />
            ) : null}

            {m.content && (m.message_type === "text" || m.content !== m.file_name) ? (
              <p className="whitespace-pre-wrap break-words text-[15px] leading-relaxed">
                {tokenize(m.content).map((part, i) =>
                  part.type === "link" ? (
                    <a key={i} href={part.value} target="_blank" rel="noreferrer noopener" className="break-all underline underline-offset-2" onClick={(e) => e.stopPropagation()}>
                      {part.value}
                    </a>
                  ) : part.type === "mention" ? (
                    <span key={i} className="rounded bg-[#EEE9FC] px-0.5 font-semibold text-[#4E2E9E]">
                      {part.value}
                    </span>
                  ) : (
                    <span key={i}>{part.value}</span>
                  ),
                )}
                {m.edited_at ? <span className="ms-1 text-[11px] text-muted-foreground">(modifié)</span> : null}
              </p>
            ) : null}
          </>
        )}

        {m.local?.status === "failed" && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRetry(m);
            }}
            className="mt-1 inline-flex items-center gap-1 text-[12px] font-semibold text-[color:var(--ax-viz-red)] hover:underline"
          >
            <AlertCircle size={12} aria-hidden /> Non envoyé — <RotateCcw size={11} aria-hidden /> Réessayer
          </button>
        )}

        {m.reactions && m.reactions.length > 0 && !m.is_deleted && (
          <div className="mt-1" onClick={(e) => e.stopPropagation()}>
            <Reactions message={m} onReact={onReact} />
          </div>
        )}

        {mine && seen && (
          <span className="mt-0.5 inline-flex items-center gap-1 text-[11px] font-medium text-[#4E2E9E]">
            <CheckCheck size={13} aria-hidden /> Vu
          </span>
        )}
      </div>

      {!m.is_deleted && !m.local && !editing && (
        <div className="yc-row-actions absolute -top-3 right-5 z-10 flex items-center gap-0.5 rounded-lg border bg-card p-0.5 shadow-md">
          <ReactPicker onPick={(emoji) => onReact(m, emoji)} />
          {!isChannel && (
            <ActionBtn label="Répondre" onClick={() => onReply(m)}>
              <Reply size={15} />
            </ActionBtn>
          )}
          {canEdit && (
            <ActionBtn label="Modifier" onClick={() => onStartEdit(m.id)}>
              <Pencil size={15} />
            </ActionBtn>
          )}
          {m.message_type === "text" && (
            <ActionBtn
              label="Copier le texte"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(m.content);
                  toast.success("Texte copié.");
                } catch {
                  toast.error("Copie impossible dans ce navigateur.");
                }
              }}
            >
              <Copy size={15} />
            </ActionBtn>
          )}
          {canDelete && (
            <ActionBtn label="Supprimer" onClick={() => onDelete(m)} danger>
              <Trash2 size={15} />
            </ActionBtn>
          )}
        </div>
      )}
    </div>
  );
}

function InlineEditor({ initial, onSubmit, onCancel }: { initial: string; onSubmit: (t: string) => void; onCancel: () => void }) {
  const [text, setText] = useState(initial);
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.focus();
    el.setSelectionRange(el.value.length, el.value.length);
  }, []);
  return (
    <div className="mt-1" onClick={(e) => e.stopPropagation()}>
      <textarea
        ref={ref}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape") onCancel();
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            if (text.trim()) onSubmit(text.trim());
          }
        }}
        rows={Math.min(6, text.split("\n").length + 1)}
        aria-label="Modifier le message"
        className="w-full resize-none rounded-lg border bg-background px-3 py-2 text-[15px] outline-none focus:border-[color:var(--ax-accent)]"
      />
      <p className="text-[11px] text-muted-foreground">
        Échap pour <button type="button" className="text-[#4E2E9E] hover:underline" onClick={onCancel}>annuler</button> · Entrée pour{" "}
        <button type="button" className="text-[#4E2E9E] hover:underline" onClick={() => text.trim() && onSubmit(text.trim())}>enregistrer</button>
      </p>
    </div>
  );
}

function ActionBtn({ label, onClick, danger, children }: { label: string; onClick: () => void; danger?: boolean; children: React.ReactNode }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={`flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted ${
        danger ? "hover:text-[color:var(--ax-viz-red)]" : "hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

function ReactPicker({ onPick, light = false, inline = false }: { onPick: (emoji: string) => void; light?: boolean; inline?: boolean }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      {inline ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setOpen((o) => !o);
          }}
          aria-label="Ajouter une réaction"
          className={`flex h-[26px] items-center rounded-full border border-dashed px-2 ${light ? "border-white/30 text-white/80" : "border-[#D7CBF6] text-muted-foreground"} hover:bg-muted/40`}
        >
          <SmilePlus size={14} aria-hidden />
        </button>
      ) : (
        <ActionBtn label="Réagir" onClick={() => setOpen((o) => !o)}>
          <SmilePlus size={15} />
        </ActionBtn>
      )}
      {open && (
        <div role="menu" className={`yc-enter absolute z-20 flex gap-0.5 rounded-full border bg-card p-1 text-foreground shadow-lg ${inline ? "bottom-8 left-0" : "right-0 top-9"}`}>
          {QUICK_REACTIONS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              role="menuitem"
              aria-label={`Réagir ${emoji}`}
              onClick={(e) => {
                e.stopPropagation();
                onPick(emoji);
                setOpen(false);
              }}
              className="flex h-8 w-8 items-center justify-center rounded-full text-lg transition-transform hover:scale-125 hover:bg-muted"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
