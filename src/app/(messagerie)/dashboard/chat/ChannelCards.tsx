"use client";

/**
 * Les cartes du canal « Les Jëfs du Kourel », et le lecteur de note vocale.
 *
 * Une carte n'a pas une seule forme : le serveur choisit la variante
 * (`comms/canaux.py`, `composer_carte`) et le client l'habille — photo du
 * Ndiguel, pictogramme de la marque sur fond pastel, palier atteint avec ses
 * confettis, ou le pictogramme de la diaspora. Décision du 2026-10-29 : pas de
 * « format robotique » répété cent fois.
 *
 * Les pictogrammes sont ceux de l'application mobile, copiés dans
 * `public/assets/pictos` (attribution Noun Project dans ce dossier).
 */
import { useEffect, useRef, useState } from "react";
import { HandHeart, Pause, Play } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatTime, initials } from "./format";
import type { JefCard, MessageRow } from "./types";

/** Fond et encre de chaque ton — contrastes vérifiés à 4,5:1 au moins. */
const TONES: Record<NonNullable<JefCard["tone"]>, { bg: string; ink: string; soft: string }> = {
  peach: { bg: "#FFE7D3", ink: "#3A2410", soft: "#6B4A2A" },
  yellow: { bg: "#FFF4BF", ink: "#3A3006", soft: "#5E4F12" },
  teal: { bg: "#DDF4F4", ink: "#10393A", soft: "#2C5A5B" },
  pink: { bg: "#FFE3F2", ink: "#4A1232", soft: "#6E2A50" },
  lilac: { bg: "#ECE6FB", ink: "#2F1966", soft: "#4E2E9E" },
};

function TitleTag({ title }: { title?: string | null }) {
  if (!title) return null;
  return (
    <span className="ms-1 inline-block rounded-[5px] bg-[#EEE9FC] px-1.5 py-px align-[2px] text-[9px] font-extrabold tracking-wide text-[#4E2E9E]">
      {title.toUpperCase()}
    </span>
  );
}

/** Le texte de la carte, avec le nom du donateur en gras quand il est public. */
function CardText({ message, card }: { message: MessageRow; card: JefCard }) {
  const name = card.donor?.name;
  if (!name || !message.content.includes(name)) return <>{message.content}</>;
  const [before, ...rest] = message.content.split(name);
  return (
    <>
      {before}
      <strong className="font-bold">{name}</strong>
      <TitleTag title={card.donor?.title} />
      {rest.join(name)}
    </>
  );
}

export function JefCardView({ message, children }: { message: MessageRow; children?: React.ReactNode }) {
  const card = message.payload as JefCard;
  const time = <span className="text-[11px] opacity-70">{formatTime(message.sent_at)}</span>;

  if (card.variant === "palier") {
    return (
      <article className="relative overflow-hidden rounded-2xl bg-[#2F1966] p-4 text-white">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/assets/pictos/confettis.png" alt="" className="pointer-events-none absolute -right-4 -top-3 w-40 opacity-90" />
        <span className="relative inline-block rounded-full bg-[#B79BF3] px-2.5 py-0.5 text-[11px] font-extrabold text-[#2F1966]">
          PALIER ATTEINT
        </span>
        <p className="relative mt-2.5 text-[26px] font-extrabold tracking-tight">{card.milestone}e Jëf</p>
        <p className="relative text-sm text-[#E1D8F9]">pour {card.campaign_name}. Alhamdoulillah !</p>
        <div className="relative mt-3 flex items-center justify-between gap-2">{children}{time}</div>
      </article>
    );
  }

  if (card.variant === "photo" && card.photo_url) {
    return (
      <article className="overflow-hidden rounded-2xl border bg-card">
        <div className="relative h-32">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={card.photo_url} alt={`Ndiguel ${card.campaign_name}`} className="h-32 w-full object-cover" loading="lazy" />
          <span className="absolute left-2.5 top-2.5 rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-[#2F1966]">
            Ndiguel · {card.campaign_name}
          </span>
        </div>
        <div className="flex gap-2.5 p-3">
          <Avatar className="h-9 w-9 shrink-0">
            {card.donor?.avatar ? <AvatarImage src={card.donor.avatar} alt="" /> : null}
            <AvatarFallback className={card.donor ? "bg-[#7954D4] text-xs font-bold text-white" : "bg-[#EEE9FC] text-[#4E2E9E]"}>
              {/* Un donateur discret n'a pas de visage : on ne lui prête pas celui du compte système. */}
              {card.donor ? initials(card.donor.name) : <HandHeart size={16} aria-hidden />}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="text-sm leading-snug"><CardText message={message} card={card} /></p>
            <div className="mt-2 flex items-center justify-between gap-2">{children}{time}</div>
          </div>
        </div>
      </article>
    );
  }

  const tone = TONES[card.tone ?? (card.variant === "diaspora" ? "teal" : "lilac")] ?? TONES.lilac;
  return (
    <article className="flex items-center gap-3.5 rounded-2xl p-3" style={{ background: tone.bg, color: tone.ink }}>
      <span className="flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-[18px] bg-white">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`/assets/pictos/${card.picto ?? "generosite"}.png`} alt="" className="h-[52px] w-[52px]" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm leading-snug"><CardText message={message} card={card} /></p>
        <div className="mt-2 flex items-center justify-between gap-2" style={{ color: tone.soft }}>
          {children}
          {time}
        </div>
      </div>
    </article>
  );
}

/** Une note vocale : lecture, progression, durée. */
export function AudioPlayer({ src, mine = false }: { src: string; mine?: boolean }) {
  const ref = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const a = ref.current;
    if (!a) return;
    const onTime = () => setProgress(a.duration ? a.currentTime / a.duration : 0);
    const onMeta = () => setDuration(Number.isFinite(a.duration) ? a.duration : 0);
    const onEnd = () => {
      setPlaying(false);
      setProgress(0);
    };
    a.addEventListener("timeupdate", onTime);
    a.addEventListener("loadedmetadata", onMeta);
    a.addEventListener("ended", onEnd);
    return () => {
      a.removeEventListener("timeupdate", onTime);
      a.removeEventListener("loadedmetadata", onMeta);
      a.removeEventListener("ended", onEnd);
    };
  }, []);

  const toggle = () => {
    const a = ref.current;
    if (!a) return;
    if (playing) a.pause();
    else void a.play();
    setPlaying(!playing);
  };

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
  /* Une forme d'onde stable par fichier : décorative, elle ne mesure rien. */
  const bars = Array.from({ length: 28 }, (_, i) => 6 + ((src.charCodeAt(i % src.length) * (i + 3)) % 20));

  return (
    <div className="flex min-w-[220px] max-w-[320px] items-center gap-3">
      <audio ref={ref} src={src} preload="metadata" />
      <button
        type="button"
        onClick={toggle}
        aria-label={playing ? "Mettre en pause la note vocale" : "Écouter la note vocale"}
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${mine ? "bg-white text-[#4E2E9E]" : "bg-[#4E2E9E] text-white"}`}
      >
        {playing ? <Pause size={15} aria-hidden /> : <Play size={15} className="ms-0.5" aria-hidden />}
      </button>
      <div className="flex h-7 flex-1 items-center gap-[2px]" aria-hidden>
        {bars.map((h, i) => (
          <span
            key={i}
            className="w-[3px] rounded-full"
            style={{
              height: h,
              background: i / bars.length <= progress ? (mine ? "#FFFFFF" : "#4E2E9E") : mine ? "rgba(255,255,255,0.45)" : "#B79BF3",
            }}
          />
        ))}
      </div>
      <span className="w-9 shrink-0 text-right text-[11px] tabular-nums opacity-80">{fmt(duration)}</span>
    </div>
  );
}
