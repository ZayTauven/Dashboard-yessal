"use client";

/**
 * Le composeur.
 *
 * — Un champ qui GRANDIT : l'ancien `<input>` d'une ligne interdisait un
 *   message en plusieurs paragraphes — une liste de courses pour le Magal, un
 *   programme de veillée.
 * — Entrée envoie, Maj+Entrée va à la ligne : la convention de toutes les
 *   messageries web.
 * — `@` en salon propose les membres : c'est la mention qui fait sonner le
 *   téléphone d'un membre dans un grand salon (voir `destinataires_push`).
 * — Un fichier se colle ou se dépose, en plus du trombone.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { FileText, ImageIcon, Lock, Mic, Paperclip, Reply, Send, Square, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { checkFileSize } from "@/components/vireo/FileDrop";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatFileSize, initials } from "./format";
import type { ChatMember, MessageRow } from "./types";

const MAX_HEIGHT = 160;

type Props = {
  placeholder: string;
  disabled?: boolean;
  allowFiles: boolean;
  replyingTo: MessageRow | null;
  onCancelReply: () => void;
  members: ChatMember[];
  currentUserId: number;
  draftKey: string;
  onSend: (text: string, file: File | null) => void;
  onTyping: () => void;
  /** Canal où l'on n'est pas auteur : un bandeau remplace le champ. */
  readOnlyNote?: string | null;
};

export function Composer({
  placeholder,
  disabled,
  allowFiles,
  replyingTo,
  onCancelReply,
  members,
  currentUserId,
  draftKey,
  onSend,
  onTyping,
  readOnlyNote = null,
}: Props) {
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [mention, setMention] = useState<{ query: string; start: number } | null>(null);
  const [mentionIdx, setMentionIdx] = useState(0);
  const areaRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  /* Un brouillon par conversation : changer de fil ne perd pas ce qu'on écrivait. */
  useEffect(() => {
    let saved = "";
    try {
      saved = sessionStorage.getItem(`yc-draft-${draftKey}`) ?? "";
    } catch {
      /* stockage indisponible : on part d'un champ vide */
    }
    setText(saved);
    setFile(null);
    setMention(null);
  }, [draftKey]);

  useEffect(() => {
    try {
      if (text) sessionStorage.setItem(`yc-draft-${draftKey}`, text);
      else sessionStorage.removeItem(`yc-draft-${draftKey}`);
    } catch {
      /* idem */
    }
  }, [text, draftKey]);

  useEffect(() => {
    const el = areaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, MAX_HEIGHT)}px`;
  }, [text]);

  useEffect(() => {
    if (replyingTo) areaRef.current?.focus();
  }, [replyingTo]);

  useEffect(() => {
    if (!file || !file.type.startsWith("image/")) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const candidates = useMemo(() => {
    if (!mention) return [];
    const q = mention.query.toLowerCase();
    return members
      .filter((m) => m.id !== currentUserId && m.name.toLowerCase().includes(q))
      .slice(0, 6);
  }, [mention, members, currentUserId]);

  const pickFile = (f: File | undefined | null) => {
    if (!f) return;
    if (!allowFiles) {
      toast.error("Le partage de fichiers est désactivé pour votre Daara.");
      return;
    }
    const tooBig = checkFileSize(f);
    if (tooBig) {
      toast.error(tooBig);
      return;
    }
    setFile(f);
    areaRef.current?.focus();
  };

  const submit = () => {
    if (disabled) return;
    const body = text.trim();
    if (!body && !file) return;
    onSend(body, file);
    setText("");
    setFile(null);
    setMention(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const insertMention = (member: ChatMember) => {
    if (!mention) return;
    const firstName = member.name.trim().split(/\s+/)[0];
    const el = areaRef.current;
    const caret = el?.selectionStart ?? text.length;
    const next = `${text.slice(0, mention.start)}@${firstName} ${text.slice(caret)}`;
    setText(next);
    setMention(null);
    requestAnimationFrame(() => {
      const pos = mention.start + firstName.length + 2;
      el?.setSelectionRange(pos, pos);
      el?.focus();
    });
  };

  const detectMention = (value: string, caret: number) => {
    if (members.length === 0) return setMention(null);
    const before = value.slice(0, caret);
    const match = before.match(/(^|\s)@([\p{L}'-]*)$/u);
    if (match) {
      setMention({ query: match[2], start: caret - match[2].length - 1 });
      setMentionIdx(0);
    } else {
      setMention(null);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (mention && candidates.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setMentionIdx((i) => (i + 1) % candidates.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setMentionIdx((i) => (i - 1 + candidates.length) % candidates.length);
        return;
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        insertMention(candidates[mentionIdx]);
        return;
      }
      if (e.key === "Escape") {
        setMention(null);
        return;
      }
    }
    if (e.key === "Escape" && replyingTo) {
      onCancelReply();
      return;
    }
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      submit();
    }
  };

  const canSend = !disabled && (text.trim().length > 0 || !!file);
  const voice = useVoiceRecorder((recorded) => onSend("", recorded));

  if (readOnlyNote) {
    return (
      <div className="flex shrink-0 items-center justify-center gap-2 border-t bg-card px-4 py-4 text-sm text-muted-foreground">
        <Lock size={15} aria-hidden />
        {readOnlyNote}
      </div>
    );
  }

  return (
    <div
      className={`relative border-t bg-card px-3 sm:px-4 pt-2.5 pb-3 shrink-0 ${dragging ? "ring-2 ring-inset" : ""}`}
      style={dragging ? ({ "--tw-ring-color": "var(--ax-accent)" } as React.CSSProperties) : undefined}
      onDragOver={(e) => {
        if (!allowFiles) return;
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        pickFile(e.dataTransfer.files?.[0]);
      }}
    >
      <div className="mx-auto max-w-3xl space-y-2">
        {replyingTo && (
          <div
            className="flex items-start gap-2 rounded-xl px-3 py-2 text-xs"
            style={{ background: "color-mix(in srgb, var(--ax-accent) 8%, transparent)", borderInlineStart: "3px solid var(--ax-accent)" }}
          >
            <Reply size={14} className="mt-0.5 shrink-0" style={{ color: "var(--ax-accent)" }} aria-hidden />
            <div className="min-w-0 flex-1">
              <span className="block font-semibold" style={{ color: "var(--ax-accent)" }}>
                Réponse à {replyingTo.sender.id === currentUserId ? "vous-même" : replyingTo.sender.name}
              </span>
              <span className="block truncate text-muted-foreground">
                {replyingTo.message_type === "file" ? `Pièce jointe : ${replyingTo.file_name ?? ""}` : replyingTo.content}
              </span>
            </div>
            <button type="button" onClick={onCancelReply} className="text-muted-foreground hover:text-foreground" aria-label="Annuler la réponse">
              <X size={14} />
            </button>
          </div>
        )}

        {file && (
          <div className="flex items-center gap-3 rounded-xl border bg-muted/40 p-2 text-xs">
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview} alt="" className="h-12 w-12 rounded-lg object-cover" />
            ) : (
              <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-card">
                <FileText size={20} style={{ color: "var(--ax-accent)" }} aria-hidden />
              </span>
            )}
            <div className="min-w-0 flex-1">
              <span className="block font-semibold truncate">{file.name}</span>
              <span className="text-muted-foreground">{formatFileSize(file.size)} · ajoutez une légende si besoin</span>
            </div>
            <button type="button" onClick={() => setFile(null)} className="text-muted-foreground hover:text-foreground" aria-label="Retirer la pièce jointe">
              <X size={14} />
            </button>
          </div>
        )}

        {mention && candidates.length > 0 && (
          <ul
            role="listbox"
            aria-label="Mentionner un membre"
            className="absolute bottom-full left-3 right-3 sm:left-4 sm:right-auto sm:w-72 mb-1 z-20 rounded-xl border bg-card p-1 shadow-lg"
          >
            {candidates.map((m, i) => (
              <li key={m.id} role="option" aria-selected={i === mentionIdx}>
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    insertMention(m);
                  }}
                  className={`flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left text-sm ${i === mentionIdx ? "bg-muted" : "hover:bg-muted/60"}`}
                >
                  <Avatar className="h-7 w-7">
                    {m.avatar ? <AvatarImage src={m.avatar} alt="" /> : null}
                    <AvatarFallback className="text-[10px] font-bold text-white" style={{ background: "var(--ax-accent)" }}>
                      {initials(m.name)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="truncate">{m.name}</span>
                </button>
              </li>
            ))}
          </ul>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
          className="flex items-end gap-2 rounded-[22px] border bg-background px-2 py-1.5 focus-within:border-[color:var(--ax-accent)] transition-colors"
        >
          {allowFiles && (
            <>
              <input
                ref={fileRef}
                type="file"
                className="hidden"
                onChange={(e) => pickFile(e.target.files?.[0])}
              />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                aria-label="Joindre un fichier ou une image"
                title="Joindre un fichier (ou glissez-le ici)"
              >
                {file?.type.startsWith("image/") ? <ImageIcon size={18} /> : <Paperclip size={18} />}
              </button>
            </>
          )}

          <textarea
            ref={areaRef}
            hidden={voice.recording}
            rows={1}
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              detectMention(e.target.value, e.target.selectionStart);
              onTyping();
            }}
            onKeyDown={onKeyDown}
            onPaste={(e) => {
              const pasted = Array.from(e.clipboardData.files)[0];
              if (pasted) {
                e.preventDefault();
                pickFile(pasted);
              }
            }}
            placeholder={placeholder}
            aria-label="Votre message"
            className="flex-1 resize-none bg-transparent py-2 px-1 text-sm leading-relaxed outline-none placeholder:text-muted-foreground max-h-40"
          />

          {voice.recording ? (
            <div className="flex flex-1 items-center gap-2 py-1.5" role="status" aria-live="polite">
              <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-[#A62B2B]" aria-hidden />
              <span className="text-sm font-semibold tabular-nums">{voice.elapsed}</span>
              <span className="text-xs text-muted-foreground">Enregistrement de la note vocale…</span>
              <button type="button" onClick={voice.cancel} className="ms-auto flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-muted" aria-label="Annuler l'enregistrement">
                <Trash2 size={17} aria-hidden />
              </button>
            </div>
          ) : null}

          {!voice.recording && !text.trim() && !file && voice.supported ? (
            <button
              type="button"
              onClick={voice.start}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white transition-transform hover:scale-105"
              style={{ background: "var(--ax-accent)" }}
              aria-label="Enregistrer une note vocale"
              title="Enregistrer une note vocale"
            >
              <Mic size={17} aria-hidden />
            </button>
          ) : voice.recording ? (
            <button
              type="button"
              onClick={voice.stop}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white"
              style={{ background: "var(--ax-accent)" }}
              aria-label="Arrêter et envoyer la note vocale"
              title="Arrêter et envoyer"
            >
              <Square size={14} fill="currentColor" aria-hidden />
            </button>
          ) : (
          <button
            type="submit"
            disabled={!canSend}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white transition-all disabled:opacity-40 enabled:hover:scale-105"
            style={{ background: "var(--ax-accent)" }}
            aria-label="Envoyer le message"
          >
            <Send size={16} aria-hidden />
          </button>
          )}
        </form>
        <p className="hidden sm:block text-[10px] text-muted-foreground text-right pe-2">
          Entrée pour envoyer · Maj+Entrée pour aller à la ligne
          {members.length > 0 ? " · @ pour mentionner" : ""}
        </p>
      </div>
    </div>
  );
}

/**
 * La note vocale, au navigateur : `MediaRecorder` sur le micro. Un clic lance,
 * un clic arrête et envoie, la corbeille annule. Le format est celui que le
 * navigateur sait produire — WebM/Opus (Chrome, Firefox) ou MP4/AAC (Safari) —
 * et Django accepte les deux (`EXTENSIONS_PIECE_JOINTE`).
 */
function useVoiceRecorder(onDone: (file: File) => void) {
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const cancelledRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const supported = typeof window !== "undefined" && typeof window.MediaRecorder !== "undefined" && !!navigator.mediaDevices;

  const cleanup = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    recorderRef.current?.stream.getTracks().forEach((t) => t.stop());
    recorderRef.current = null;
    setRecording(false);
    setSeconds(0);
  };

  useEffect(() => () => cleanup(), []);

  const start = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      cancelledRef.current = false;
      recorder.ondataavailable = (e) => e.data.size && chunksRef.current.push(e.data);
      recorder.onstop = () => {
        const type = recorder.mimeType || "audio/webm";
        const ext = type.includes("mp4") ? "m4a" : type.includes("ogg") ? "ogg" : "webm";
        const blob = new Blob(chunksRef.current, { type });
        if (!cancelledRef.current && blob.size > 0) {
          onDone(new File([blob], `note-vocale-${Date.now()}.${ext}`, { type }));
        }
        cleanup();
      };
      recorderRef.current = recorder;
      recorder.start();
      setRecording(true);
      setSeconds(0);
      timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    } catch {
      toast.error("Micro inaccessible.", { description: "Autorisez le micro pour ce site dans votre navigateur." });
    }
  };

  const stop = () => recorderRef.current?.state === "recording" && recorderRef.current.stop();
  const cancel = () => {
    cancelledRef.current = true;
    stop();
  };

  const elapsed = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
  return { supported, recording, elapsed, start, stop, cancel };
}
