"use client";

/*
 * Un mot du lexique, cité au fil du texte.
 *
 * Survol ou focus : la définition courte apparaît. Clic : on va au lexique, à
 * l'ancre du mot. Le second geste compte autant que le premier — sur un
 * téléphone il n'y a pas de survol, et un tapotement doit mener quelque part.
 *
 * Le contenu de l'infobulle est rendu dans le flux, pas dans un portail. Les
 * chapitres ne sont pas dans une modale, donc rien ne rogne — et cela épargne
 * un état de montage, donc une divergence d'hydratation de plus.
 */

import Link from "next/link";
import { useId, useState } from "react";
import { termById } from "@/lib/guide/lexique";

export function Terme({
  mot,
  children,
}: {
  /** Identifiant dans le lexique : "jef", "ndiguel", "daara"… */
  mot: string;
  children?: React.ReactNode;
}) {
  const term = termById(mot);
  const [open, setOpen] = useState(false);
  const id = useId();

  /* Un mot absent du lexique ne doit pas casser la page : il s'affiche
     simplement sans habillage. Le cas arrive en cours d'écriture. */
  if (!term) return <>{children ?? mot}</>;

  return (
    <span className="relative inline-block">
      <Link
        href={`/guide/lexique#${term.id}`}
        className="yg-term"
        aria-describedby={open ? id : undefined}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
      >
        {children ?? term.word}
      </Link>
      {open && (
        <span id={id} role="tooltip" className="yg-term-pop left-0 top-[1.9em]">
          <strong className="yg-term-pop__word">{term.word}</strong>
          {term.short}
        </span>
      )}
    </span>
  );
}
