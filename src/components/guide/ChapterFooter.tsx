"use client";

/*
 * Pied de chapitre : la case « lu », puis le chapitre précédent et le suivant.
 *
 * Le marquage est volontairement MANUEL. On aurait pu cocher automatiquement
 * au défilement jusqu'en bas — mais arriver au bas d'une page n'est pas l'avoir
 * lue, et une progression qui se coche toute seule ne veut plus rien dire.
 *
 * Les voisins arrivent en simples chaînes : le manifeste est lisible des deux
 * côtés de la frontière RSC, mais un objet chapitre porte une clé d'icône, et
 * on ne fait traverser que ce qui sert ici.
 */

import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, Circle } from "lucide-react";
import { useReadChapters } from "./reading-state";

export function ChapterFooter({
  slug,
  prev,
  next,
}: {
  slug: string;
  prev: { slug: string; title: string } | null;
  next: { slug: string; title: string } | null;
}) {
  const { read, toggle } = useReadChapters();
  const done = read.includes(slug);

  return (
    <>
      <button
        type="button"
        className={`yg-read-mark${done ? " is-done" : ""}`}
        onClick={() => toggle(slug)}
        aria-pressed={done}
      >
        {done ? (
          <Check size={16} aria-hidden="true" />
        ) : (
          <Circle size={16} aria-hidden="true" />
        )}
        {done ? "Chapitre lu" : "Marquer ce chapitre comme lu"}
      </button>

      <nav className="yg-foot" aria-label="Chapitre précédent et suivant">
        {prev ? (
          <Link href={`/guide/${prev.slug}`} className="yg-foot__link">
            <span className="yg-foot__dir">
              <ArrowLeft size={13} aria-hidden="true" />
              Précédent
            </span>
            <span className="yg-foot__title">{prev.title}</span>
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link
            href={`/guide/${next.slug}`}
            className="yg-foot__link yg-foot__link--next"
          >
            <span className="yg-foot__dir">
              Suivant
              <ArrowRight size={13} aria-hidden="true" />
            </span>
            <span className="yg-foot__title">{next.title}</span>
          </Link>
        ) : (
          <span />
        )}
      </nav>
    </>
  );
}
