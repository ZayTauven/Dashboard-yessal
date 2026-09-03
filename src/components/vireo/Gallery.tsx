"use client";

/*
 * ═══════════════════════════════════════════════════════════════════════════
 * Galerie et visionneuse
 * ═══════════════════════════════════════════════════════════════════════════
 * Les images d'un article s'ouvraient dans un nouvel onglet — c'est-à-dire
 * qu'on quittait l'article pour voir sa photo, et qu'il fallait revenir. Pour
 * une galerie de huit clichés d'un Magal, cela fait huit allers-retours, et
 * aucun moyen de passer de l'un à l'autre.
 *
 * La visionneuse reste dans la page : on ouvre, on parcourt aux flèches, on
 * ferme. Le lien vers le fichier d'origine est conservé pour qui veut
 * l'enregistrer.
 *
 * Construite sur Radix Dialog plutôt que sur <Modal> : une photo se regarde sur
 * fond sombre et pleine page, pas dans une carte à en-tête et pied. Le voile et
 * la fermeture au clavier viennent de Radix, le reste est peint ici.
 */

import { useCallback, useEffect, useState } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { ChevronLeft, ChevronRight, ExternalLink, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface GalleryImage {
  id: number | string;
  image: string;
  caption?: string | null;
}

export interface GalleryProps {
  images: GalleryImage[];
  /** Colonnes de la grille de vignettes. */
  columns?: 2 | 3 | 4;
  /** Rendu au-dessus de chaque vignette — le bouton de suppression, en édition. */
  overlay?: (image: GalleryImage) => React.ReactNode;
  className?: string;
}

export function Gallery({
  images,
  columns = 2,
  overlay,
  className,
}: GalleryProps) {
  /* `null` = visionneuse fermée. L'index est aussi l'état d'ouverture : deux
     variables pour une seule chose se désynchronisent tôt ou tard. */
  const [index, setIndex] = useState<number | null>(null);

  const count = images.length;
  const current = index === null ? null : images[index];

  const go = useCallback(
    (delta: number) => {
      setIndex((i) => (i === null ? null : (i + delta + count) % count));
    },
    [count],
  );

  /*
   * Les flèches sont posées ici et non sur le dialogue : Radix rend le contenu
   * dans un portail, et l'événement clavier n'atteint pas forcément un élément
   * focalisé à l'intérieur. Sur `document`, il arrive toujours.
   */
  useEffect(() => {
    if (index === null) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") go(1);
      else if (e.key === "ArrowLeft") go(-1);
    };

    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [index, go]);

  if (count === 0) return null;

  const gridCols =
    columns === 4 ? "grid-cols-4" : columns === 3 ? "grid-cols-3" : "grid-cols-2";

  return (
    <>
      <ul className={cn("ax-thumb-strip grid gap-3", gridCols, className)}>
        {images.map((img, i) => (
          <li key={img.id} className="ax-thumb relative">
            <button
              type="button"
              className="block w-full cursor-zoom-in overflow-hidden rounded-(--ax-radius-sm)"
              onClick={() => setIndex(i)}
              aria-label={
                img.caption
                  ? `Agrandir : ${img.caption}`
                  : `Agrandir l'image ${i + 1} sur ${count}`
              }
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.image}
                alt={img.caption || ""}
                loading="lazy"
                className="aspect-square w-full object-cover transition-transform duration-200 hover:scale-105"
              />
            </button>
            {overlay?.(img)}
          </li>
        ))}
      </ul>

      <DialogPrimitive.Root
        open={index !== null}
        onOpenChange={(open) => !open && setIndex(null)}
      >
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="ax-modal__backdrop" />

          <DialogPrimitive.Content
            className="ax-modal ax-modal--centered flex-col gap-4 p-4 outline-hidden"
            aria-describedby={undefined}
          >
            <DialogPrimitive.Title className="ax-visually-hidden">
              {current?.caption || `Image ${(index ?? 0) + 1} sur ${count}`}
            </DialogPrimitive.Title>

            {/* Barre haute : compteur, original, fermeture. */}
            <div className="flex w-full shrink-0 items-center justify-between gap-3 text-white">
              <span className="font-mono text-sm tabular-nums opacity-80">
                {(index ?? 0) + 1} / {count}
              </span>

              <div className="flex items-center gap-2">
                {current && (
                  <a
                    href={current.image}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ax-btn ax-btn--sm ax-btn--ghost text-white"
                  >
                    <ExternalLink className="ax-btn__icon" size={14} aria-hidden="true" />
                    <span className="ax-btn__label">Ouvrir l&apos;original</span>
                  </a>
                )}
                <DialogPrimitive.Close
                  className="ax-btn ax-btn--icon ax-btn--ghost text-white"
                  aria-label="Fermer"
                >
                  <X aria-hidden="true" />
                </DialogPrimitive.Close>
              </div>
            </div>

            {/* L'image, et les commandes de part et d'autre. */}
            <div className="flex min-h-0 w-full flex-1 items-center gap-2">
              {count > 1 && (
                <button
                  type="button"
                  className="ax-btn ax-btn--icon ax-btn--ghost shrink-0 text-white"
                  onClick={() => go(-1)}
                  aria-label="Image précédente"
                >
                  <ChevronLeft aria-hidden="true" />
                </button>
              )}

              {current && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={current.image}
                  alt={current.caption || ""}
                  className="mx-auto max-h-[75vh] min-h-0 w-auto max-w-full rounded-(--ax-radius-lg) object-contain"
                />
              )}

              {count > 1 && (
                <button
                  type="button"
                  className="ax-btn ax-btn--icon ax-btn--ghost shrink-0 text-white"
                  onClick={() => go(1)}
                  aria-label="Image suivante"
                >
                  <ChevronRight aria-hidden="true" />
                </button>
              )}
            </div>

            {current?.caption && (
              <p className="w-full shrink-0 text-center text-sm text-white/80">
                {current.caption}
              </p>
            )}
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </>
  );
}
