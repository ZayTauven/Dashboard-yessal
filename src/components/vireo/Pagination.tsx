"use client";

/*
 * ═══════════════════════════════════════════════════════════════════════════
 * Pagination
 * ═══════════════════════════════════════════════════════════════════════════
 * Contrat `.ax-pagination` de Vireo. Trois écrans paginaient jusqu'ici avec
 * deux boutons « Précédent / Suivant » et un « Page 2 sur 7 » : impossible de
 * sauter à la fin d'une liste de 400 membres sans cliquer vingt fois.
 *
 * La fenêtre glissante affiche au plus sept jetons — premier, dernier, la page
 * courante et ses voisines, des ellipses pour le reste. Au-delà, les jetons
 * deviennent illisibles sur mobile et n'aident plus personne.
 *
 * Le résumé « 21–30 sur 412 » est affiché par défaut : sur une liste filtrée,
 * c'est souvent la seule confirmation que le filtre a bien mordu.
 */

import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const nf = new Intl.NumberFormat("fr-SN");

export interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  /** Total d'éléments filtrés — active le résumé « 21–30 sur 412 ». */
  totalItems?: number;
  pageSize?: number;
  /** Nom de l'objet compté, au pluriel : « membres », « Jëfs »… */
  itemLabel?: string;
  className?: string;
}

/**
 * Fenêtre de pagination : [1, …, 4, 5, 6, …, 42].
 * `null` marque une ellipse.
 */
function windowOf(page: number, total: number): (number | null)[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const out: (number | null)[] = [1];
  const start = Math.max(2, page - 1);
  const end = Math.min(total - 1, page + 1);

  if (start > 2) out.push(null);
  for (let i = start; i <= end; i++) out.push(i);
  if (end < total - 1) out.push(null);

  out.push(total);
  return out;
}

export function Pagination({
  page,
  totalPages,
  onPageChange,
  totalItems,
  pageSize = 10,
  itemLabel = "éléments",
  className,
}: PaginationProps) {
  /* Une seule page ne se pagine pas : la barre disparaît au lieu d'afficher
     un « 1 » inerte entre deux flèches grisées. */
  if (totalPages <= 1) return null;

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, totalItems ?? page * pageSize);

  return (
    <nav
      className={cn("ax-pagination", className)}
      role="navigation"
      aria-label="Pagination"
    >
      {typeof totalItems === "number" && (
        <p className="ax-pagination__summary">
          <span className="font-mono tabular">
            {nf.format(from)}–{nf.format(to)}
          </span>{" "}
          sur <span className="font-mono tabular">{nf.format(totalItems)}</span>{" "}
          {itemLabel}
        </p>
      )}

      <div className="ax-spacer" />

      <button
        type="button"
        className="ax-pagination__prev"
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        aria-label="Page précédente"
      >
        <ChevronLeft aria-hidden="true" />
      </button>

      <ul className="ax-pagination__pages">
        {windowOf(page, totalPages).map((p, i) =>
          p === null ? (
            <li key={`gap-${i}`} className="ax-pagination__ellipsis" aria-hidden="true">
              …
            </li>
          ) : (
            <li key={p}>
              <button
                type="button"
                className="ax-pagination__page"
                aria-current={p === page ? "page" : undefined}
                aria-label={`Page ${p}`}
                onClick={() => onPageChange(p)}
              >
                {p}
              </button>
            </li>
          ),
        )}
      </ul>

      <button
        type="button"
        className="ax-pagination__next"
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        aria-label="Page suivante"
      >
        <ChevronRight aria-hidden="true" />
      </button>
    </nav>
  );
}

export default Pagination;
