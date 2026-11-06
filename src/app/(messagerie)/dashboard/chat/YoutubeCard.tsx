"use client";

import { useEffect, useState } from "react";
import { Play } from "lucide-react";

type Infos = { title?: string; author_name?: string };

/*
 * Le titre et la chaîne, gardés le temps de la session : la carte est démontée
 * et remontée en faisant défiler le fil, et YouTube n'a pas à être rappelé.
 */
const cache = new Map<string, Promise<Infos | null>>();

function infosDe(id: string): Promise<Infos | null> {
  let promesse = cache.get(id);
  if (!promesse) {
    const adresse = encodeURIComponent(`https://www.youtube.com/watch?v=${id}`);
    promesse = fetch(`https://www.youtube.com/oembed?format=json&url=${adresse}`)
      .then((res) => (res.ok ? (res.json() as Promise<Infos>) : null))
      .catch(() => null);
    cache.set(id, promesse);
  }
  return promesse;
}

/**
 * Un lien YouTube, en carte. La miniature pèse une quinzaine de Ko et rien ne se
 * lit ici : l'appui ouvre YouTube. Une vidéo privée ou supprimée garde sa carte,
 * simplement sans titre.
 */
export function YoutubeCard({ id, url }: { id: string; url: string }) {
  const [infos, setInfos] = useState<Infos | null>(null);

  useEffect(() => {
    let actif = true;
    infosDe(id).then((resultat) => {
      if (actif) setInfos(resultat);
    });
    return () => {
      actif = false;
    };
  }, [id]);

  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer noopener"
      onClick={(e) => e.stopPropagation()}
      className="mt-1 block max-w-sm overflow-hidden rounded-xl border bg-card transition-colors hover:bg-muted/40"
    >
      <span className="relative block bg-black" style={{ aspectRatio: "16 / 9" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`https://i.ytimg.com/vi/${id}/mqdefault.jpg`} alt="" loading="lazy" className="block h-full w-full object-cover" />
        <span className="absolute left-1/2 top-1/2 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-black/60 text-white">
          <Play size={20} fill="currentColor" aria-hidden />
        </span>
      </span>
      <span className="block p-2.5">
        <span className="block text-sm font-semibold leading-snug text-foreground">{infos?.title || "Vidéo YouTube"}</span>
        <span className="mt-0.5 block text-xs text-muted-foreground">{infos?.author_name ? `YouTube · ${infos.author_name}` : "YouTube"}</span>
      </span>
    </a>
  );
}
