"use client";

/**
 * Le fil d'une conversation.
 *
 * ── Ce qui change par rapport à l'ancien fil ────────────────────────────────
 *
 * — **Les grappes.** Une suite de messages du même auteur ne répète ni son
 *   visage, ni son nom, ni l'heure : c'est la dernière bulle qui les porte.
 * — **Les actions au clavier et au toucher.** Elles n'apparaissaient qu'au
 *   survol de la souris : sur une tablette, on ne pouvait ni répondre ni
 *   réagir. Elles s'ouvrent aussi au focus et au toucher de la bulle.
 * — **La citation** vient du serveur (`reply_preview`) et mène au message
 *   d'origine, qui clignote une seconde.
 * — **Le défilement.** L'ancien fil se recalait en bas à CHAQUE changement :
 *   impossible de relire l'historique pendant qu'un salon parlait. Il ne
 *   suit désormais que si l'on était déjà en bas ; sinon un bouton compte
 *   ce qui est arrivé.
 */
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  ArrowDown,
  Ban,
  Check,
  CheckCheck,
  Copy,
  Download,
  FileText,
  Loader2,
  Reply,
  RotateCcw,
  SmilePlus,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
  buildThread,
  formatFileSize,
  formatTime,
  initials,
  tokenize,
  type ThreadEntry,
} from "./format";
import type { MessageRow } from "./types";

export const QUICK_REACTIONS = ["👍", "❤️", "🙏", "😂", "😮", "😢"];

/** En deçà de cette distance du bas, on considère qu'on « suit » le fil. */
const STICKY_PX = 120;

type Props = {
  chatId: number;
  messages: MessageRow[];
  currentUserId: number;
  isGroup: boolean;
  canDeleteAny: boolean;
  peerLastReadAt?: string | null;
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
};

export function MessageThread({
  chatId,
  messages,
  currentUserId,
  isGroup,
  canDeleteAny,
  peerLastReadAt,
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
}: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const atBottomRef = useRef(true);
  const prevHeightRef = useRef(0);
  const prevFirstIdRef = useRef<number | null>(null);
  const prevCountRef = useRef(0);
  const [missed, setMissed] = useState(0);
  const [away, setAway] = useState(false);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [flashId, setFlashId] = useState<number | null>(null);
  const [lightbox, setLightbox] = useState<MessageRow | null>(null);

  const entries = useMemo(
    () => buildThread(messages, unreadFromId, unreadCount),
    [messages, unreadFromId, unreadCount],
  );

  /* Le dernier de MES messages que l'autre a lu — c'est sous lui que « Vu » s'affiche. */
  const seenId = useMemo(() => {
    if (isGroup || !peerLastReadAt) return null;
    const limit = new Date(peerLastReadAt).getTime();
    let found: number | null = null;
    for (const m of messages) {
      if (m.sender.id === currentUserId && !m.local && new Date(m.sent_at).getTime() <= limit) found = m.id;
    }
    return found;
  }, [messages, isGroup, peerLastReadAt, currentUserId]);

  const lastMineId = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      const m = messages[i];
      if (m.message_type !== "system" && m.sender.id === currentUserId) return m.id;
    }
    return null;
  }, [messages, currentUserId]);

  /* Changement de conversation : on repart du bas. */
  useEffect(() => {
    atBottomRef.current = true;
    prevFirstIdRef.current = null;
    prevCountRef.current = 0;
    setMissed(0);
    setAway(false);
    setActiveId(null);
  }, [chatId]);

  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const firstId = messages[0]?.id ?? null;
    const prepended =
      prevFirstIdRef.current !== null && firstId !== prevFirstIdRef.current && messages.length > prevCountRef.current;

    if (prepended) {
      // Historique chargé au-dessus : on garde sous les yeux ce qu'on lisait.
      el.scrollTop = el.scrollHeight - prevHeightRef.current + el.scrollTop;
    } else if (atBottomRef.current) {
      el.scrollTop = el.scrollHeight;
    } else if (messages.length > prevCountRef.current) {
      const arrived = messages.slice(prevCountRef.current);
      const fromOthers = arrived.filter((m) => m.sender.id !== currentUserId).length;
      // Mon propre envoi me ramène toujours en bas.
      if (arrived.some((m) => m.sender.id === currentUserId && m.local)) {
        el.scrollTop = el.scrollHeight;
      } else if (fromOthers) {
        setMissed((n) => n + fromOthers);
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
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < STICKY_PX;
    atBottomRef.current = atBottom;
    // Bien plus haut que le seuil de suivi : on propose de redescendre.
    setAway(el.scrollHeight - el.scrollTop - el.clientHeight > STICKY_PX * 4);
    if (atBottom) setMissed(0);
    if (el.scrollTop < 80 && hasMore && !loadingOlder) {
      prevHeightRef.current = el.scrollHeight;
      onLoadOlder();
    }
  }, [hasMore, loadingOlder, onLoadOlder]);

  const jumpToBottom = () => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    setMissed(0);
  };

  const jumpTo = (id: number) => {
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
  };

  return (
    <div className="relative flex-1 min-h-0">
      <div
        ref={scrollRef}
        onScroll={onScroll}
        className="yc-thread h-full overflow-y-auto px-3 sm:px-6 py-4"
        role="log"
        aria-live="polite"
        aria-relevant="additions"
        aria-label="Messages de la conversation"
      >
        {loading ? (
          <ThreadSkeleton />
        ) : (
          <div className="mx-auto max-w-3xl">
            {hasMore && (
              <div className="flex justify-center py-2">
                <button
                  type="button"
                  className="ax-btn ax-btn--ghost ax-btn--sm"
                  onClick={onLoadOlder}
                  disabled={loadingOlder}
                >
                  {loadingOlder ? <Loader2 size={14} className="animate-spin" aria-hidden /> : null}
                  <span className="ax-btn__label">
                    {loadingOlder ? "Chargement…" : "Messages précédents"}
                  </span>
                </button>
              </div>
            )}

            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center text-center py-16 gap-2">
                <div className="text-3xl" aria-hidden>
                  👋
                </div>
                <p className="text-sm font-semibold">Le fil est vide.</p>
                <p className="text-xs text-muted-foreground max-w-xs">
                  {isGroup
                    ? "Lancez la discussion : un mot d'accueil suffit souvent à délier les langues."
                    : "Écrivez le premier message — une salutation, une question, un rappel."}
                </p>
              </div>
            )}

            {entries.map((entry) => (
              <ThreadItem
                key={entry.key}
                entry={entry}
                currentUserId={currentUserId}
                isGroup={isGroup}
                canDeleteAny={canDeleteAny}
                seen={entry.kind === "message" && entry.message.id === seenId}
                sentNotSeen={
                  entry.kind === "message" &&
                  !isGroup &&
                  entry.message.id === lastMineId &&
                  seenId !== lastMineId &&
                  !entry.message.local
                }
                active={entry.kind === "message" && activeId === entry.message.id}
                flashing={entry.kind === "message" && flashId === entry.message.id}
                onActivate={(id) => setActiveId((cur) => (cur === id ? null : id))}
                onReply={onReply}
                onReact={onReact}
                onDelete={onDelete}
                onRetry={onRetry}
                onJump={jumpTo}
                onOpenImage={setLightbox}
              />
            ))}

            {typingNames.length > 0 && (
              <div className="flex items-center gap-2 mt-3 ps-10" aria-live="polite">
                <span className="yc-typing inline-flex items-center gap-1 rounded-full border bg-card px-3 py-2">
                  <span />
                  <span />
                  <span />
                </span>
                <span className="text-xs text-muted-foreground">
                  {typingNames.length === 1
                    ? `${typingNames[0]} écrit…`
                    : `${typingNames.slice(0, 2).join(" et ")} écrivent…`}
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
          className="yc-enter absolute bottom-4 right-4 sm:right-6 flex items-center gap-2 rounded-full border bg-card px-3 py-2 text-xs font-semibold shadow-md hover:bg-muted transition-colors"
          aria-label={missed > 0 ? `${missed} nouveaux messages, aller en bas` : "Aller au dernier message"}
        >
          <ArrowDown size={14} aria-hidden />
          {missed > 0 ? `${missed} nouveau${missed > 1 ? "x" : ""}` : null}
        </button>
      ) : null}

      <Dialog open={!!lightbox} onOpenChange={(o) => !o && setLightbox(null)}>
        <DialogContent className="max-w-4xl p-2 sm:p-3 bg-card">
          <DialogTitle className="sr-only">{lightbox?.file_name || "Image"}</DialogTitle>
          {lightbox?.file_url && (
            <div className="flex flex-col gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={lightbox.file_url}
                alt={lightbox.content || lightbox.file_name || "Image partagée"}
                className="max-h-[75vh] w-full object-contain rounded-lg"
              />
              <div className="flex items-center justify-between gap-3 px-1">
                <span className="text-xs text-muted-foreground truncate">
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

function ThreadSkeleton() {
  const rows = [
    { mine: false, w: "62%" },
    { mine: true, w: "40%" },
    { mine: false, w: "48%" },
    { mine: true, w: "56%" },
  ];
  return (
    <div className="mx-auto max-w-3xl space-y-4 py-4" aria-hidden>
      {rows.map((r, i) => (
        <div key={i} className={`flex ${r.mine ? "justify-end" : "justify-start gap-2"}`}>
          {!r.mine && <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />}
          <div className="h-11 rounded-2xl bg-muted animate-pulse" style={{ width: r.w }} />
        </div>
      ))}
    </div>
  );
}

function ThreadItem({
  entry,
  currentUserId,
  isGroup,
  canDeleteAny,
  seen,
  sentNotSeen,
  active,
  flashing,
  onActivate,
  onReply,
  onReact,
  onDelete,
  onRetry,
  onJump,
  onOpenImage,
}: {
  entry: ThreadEntry;
  currentUserId: number;
  isGroup: boolean;
  canDeleteAny: boolean;
  seen: boolean;
  sentNotSeen: boolean;
  active: boolean;
  flashing: boolean;
  onActivate: (id: number) => void;
  onReply: (m: MessageRow) => void;
  onReact: (m: MessageRow, emoji: string) => void;
  onDelete: (m: MessageRow) => void;
  onRetry: (m: MessageRow) => void;
  onJump: (id: number) => void;
  onOpenImage: (m: MessageRow) => void;
}) {
  if (entry.kind === "day") {
    return (
      <div className="flex justify-center py-3">
        <span className="rounded-full border bg-card px-3 py-1 text-[11px] font-semibold text-muted-foreground shadow-sm first-letter:uppercase">
          {entry.label}
        </span>
      </div>
    );
  }
  if (entry.kind === "unread") {
    return (
      <div className="flex items-center gap-3 my-3" role="separator">
        <div className="flex-1 h-px" style={{ background: "var(--ax-accent)" }} />
        <span className="text-[11px] font-bold uppercase tracking-wide" style={{ color: "var(--ax-accent)" }}>
          {entry.count} non lu{entry.count > 1 ? "s" : ""}
        </span>
        <div className="flex-1 h-px" style={{ background: "var(--ax-accent)" }} />
      </div>
    );
  }
  if (entry.kind === "system") {
    return (
      <div className="flex justify-center my-3">
        <span className="max-w-[80%] text-center rounded-full bg-muted px-3 py-1 text-[11px] font-medium text-muted-foreground">
          {entry.message.content}
        </span>
      </div>
    );
  }

  const { message: m, first, last } = entry;
  const mine = m.sender.id === currentUserId;
  const canDelete = !m.local && !m.is_deleted && (mine || canDeleteAny);
  const isImage = m.message_type === "file" && m.file_is_image && !m.is_deleted;
  const imageSrc = m.local?.previewUrl || m.file_url;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(m.content);
      toast.success("Texte copié.");
    } catch {
      toast.error("Copie impossible dans ce navigateur.");
    }
  };

  return (
    <div
      data-msg={m.id}
      className={`yc-row group flex gap-2 ${mine ? "justify-end" : "justify-start"} ${first ? "mt-3" : "mt-0.5"} ${
        active ? "is-active" : ""
      } ${flashing ? "yc-flash" : ""} ${m.local ? "yc-enter" : ""}`}
    >
      {!mine && (
        <div className="w-8 shrink-0 self-end">
          {last && (
            <Avatar className="h-8 w-8">
              {m.sender.avatar ? <AvatarImage src={m.sender.avatar} alt="" /> : null}
              <AvatarFallback className="text-[10px] font-bold text-white" style={{ background: "var(--ax-accent)" }}>
                {initials(m.sender.name)}
              </AvatarFallback>
            </Avatar>
          )}
        </div>
      )}

      <div className={`flex max-w-[78%] sm:max-w-[70%] flex-col ${mine ? "items-end" : "items-start"}`}>
        {!mine && isGroup && first && (
          <span className="mb-1 ms-3 text-[11px] font-semibold" style={{ color: "var(--ax-accent)" }}>
            {m.sender.name}
          </span>
        )}

        {/* Les actions flottent AU-DESSUS de la bulle : dans le flux, même
            invisibles, elles lui volaient 120 px de largeur sur téléphone. */}
        <div className="relative">
          {/* La bulle se touche pour révéler ses actions — le survol n'existe pas sur tablette. */}
          <div
            className={`yc-bubble ${mine ? "yc-bubble--mine" : "yc-bubble--theirs"} ${first ? "yc-bubble--first" : ""} ${
              m.is_deleted ? "yc-bubble--deleted" : ""
            } ${isImage ? "yc-bubble--media" : ""} ${m.local?.status === "sending" ? "opacity-70" : ""}`}
            onClick={() => !m.is_deleted && onActivate(m.id)}
          >
            {m.is_deleted ? (
              <span className="inline-flex items-center gap-1.5 text-xs">
                <Ban size={13} aria-hidden /> Message supprimé
              </span>
            ) : (
              <>
                {m.reply_preview && (
                  <button
                    type="button"
                    className="yc-quote"
                    onClick={(e) => {
                      e.stopPropagation();
                      onJump(m.reply_preview!.id);
                    }}
                    aria-label={`Voir le message cité de ${m.reply_preview.sender_name}`}
                  >
                    <span className="block font-semibold" style={{ color: "var(--ax-accent)" }}>
                      {m.reply_preview.sender_name}
                    </span>
                    <span className="block text-muted-foreground line-clamp-2">{m.reply_preview.content}</span>
                  </button>
                )}

                {isImage && imageSrc ? (
                  <button
                    type="button"
                    className="block overflow-hidden rounded-[14px]"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!m.local) onOpenImage(m);
                    }}
                    aria-label={`Agrandir l'image ${m.file_name ?? ""}`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imageSrc}
                      alt={m.content || m.file_name || "Image partagée"}
                      loading="lazy"
                      className="block max-h-72 w-auto max-w-full min-w-[160px] object-cover"
                    />
                  </button>
                ) : m.message_type === "file" ? (
                  <a
                    href={m.file_url ?? undefined}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-3 rounded-xl border bg-card/60 p-2.5 pe-4 hover:bg-card transition-colors"
                  >
                    <span
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                      style={{ background: "color-mix(in srgb, var(--ax-accent) 14%, transparent)" }}
                    >
                      <FileText size={18} style={{ color: "var(--ax-accent)" }} aria-hidden />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-xs font-semibold truncate max-w-[220px]">
                        {m.file_name || m.local?.file?.name || "Document"}
                      </span>
                      <span className="block text-[11px] text-muted-foreground">
                        {formatFileSize(m.file_size ?? m.local?.file?.size)} · Ouvrir
                      </span>
                    </span>
                  </a>
                ) : null}

                {m.content && (m.message_type === "text" || m.content !== m.file_name) ? (
                  <p className={`whitespace-pre-wrap ${isImage ? "px-2 pt-1.5 pb-0.5" : ""} ${m.message_type === "file" && !isImage ? "mt-1.5" : ""}`}>
                    {tokenize(m.content).map((part, i) =>
                      part.type === "link" ? (
                        <a
                          key={i}
                          href={part.value}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="underline underline-offset-2 break-all"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {part.value}
                        </a>
                      ) : part.type === "mention" ? (
                        <span key={i} className="yc-mention">
                          {part.value}
                        </span>
                      ) : (
                        <span key={i}>{part.value}</span>
                      ),
                    )}
                  </p>
                ) : null}
              </>
            )}

            {last && (
              <span
                className={`mt-0.5 flex items-center justify-end gap-1 text-[10px] text-muted-foreground ${
                  isImage ? "px-2 pb-1" : ""
                }`}
              >
                {formatTime(m.sent_at)}
                {mine && !m.is_deleted ? (
                  m.local?.status === "sending" ? (
                    <Loader2 size={11} className="animate-spin" aria-label="Envoi en cours" />
                  ) : m.local?.status === "failed" ? null : seen ? (
                    <CheckCheck size={12} style={{ color: "var(--ax-accent)" }} aria-label="Lu" />
                  ) : (
                    <Check size={12} aria-label="Envoyé" />
                  )
                ) : null}
              </span>
            )}
          </div>

          {!m.is_deleted && !m.local && (
            <div
              className={`yc-row-actions absolute -top-4 z-10 flex items-center gap-0.5 rounded-full border bg-card p-0.5 shadow-md ${
                mine ? "right-2" : "left-2"
              }`}
            >
              <ReactPicker align={mine ? "end" : "start"} onPick={(emoji) => onReact(m, emoji)} />
              <ActionBtn label="Répondre" onClick={() => onReply(m)}>
                <Reply size={14} />
              </ActionBtn>
              {m.message_type === "text" && (
                <ActionBtn label="Copier le texte" onClick={copy}>
                  <Copy size={14} />
                </ActionBtn>
              )}
              {canDelete && (
                <ActionBtn label="Supprimer" onClick={() => onDelete(m)} danger>
                  <Trash2 size={14} />
                </ActionBtn>
              )}
            </div>
          )}
        </div>

        {m.local?.status === "failed" && (
          <button
            type="button"
            onClick={() => onRetry(m)}
            className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-[color:var(--ax-viz-red)] hover:underline"
          >
            <AlertCircle size={12} aria-hidden /> Non envoyé — <RotateCcw size={11} aria-hidden /> Réessayer
          </button>
        )}

        {m.reactions && m.reactions.length > 0 && !m.is_deleted && (
          <div className={`-mt-1.5 flex flex-wrap gap-1 ${mine ? "me-2 justify-end" : "ms-2"} relative z-[1]`}>
            {m.reactions.map((r) => (
              <button
                key={r.emoji}
                type="button"
                onClick={() => onReact(m, r.emoji)}
                aria-pressed={r.reacted_by_me}
                aria-label={`${r.emoji} ${r.count} — ${r.reacted_by_me ? "retirer ma réaction" : "réagir aussi"}`}
                className={`inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-xs shadow-sm transition-transform hover:scale-105 ${
                  r.reacted_by_me ? "bg-[color:color-mix(in_srgb,var(--ax-accent)_14%,var(--ax-surface))]" : "bg-card"
                }`}
                style={r.reacted_by_me ? { borderColor: "var(--ax-accent)" } : undefined}
              >
                <span>{r.emoji}</span>
                {r.count > 1 && <span className="text-[10px] font-semibold text-muted-foreground">{r.count}</span>}
              </button>
            ))}
          </div>
        )}

        {mine && seen && !isGroup && (
          <span className="mt-0.5 me-1 text-[10px] font-medium" style={{ color: "var(--ax-accent)" }}>
            Vu
          </span>
        )}
        {mine && sentNotSeen && !seen && (
          <span className="mt-0.5 me-1 text-[10px] text-muted-foreground">Envoyé</span>
        )}
      </div>
    </div>
  );
}

function ActionBtn({
  label,
  onClick,
  danger,
  children,
}: {
  label: string;
  onClick: () => void;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={`flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted ${
        danger ? "hover:text-[color:var(--ax-viz-red)]" : "hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

function ReactPicker({ onPick, align }: { onPick: (emoji: string) => void; align: "start" | "end" }) {
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
      <ActionBtn label="Réagir" onClick={() => setOpen((o) => !o)}>
        <SmilePlus size={14} />
      </ActionBtn>
      {open && (
        <div
          role="menu"
          className={`absolute top-9 ${align === "end" ? "right-0" : "left-0"} z-20 flex gap-0.5 rounded-full border bg-card p-1 shadow-lg yc-enter`}
        >
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
