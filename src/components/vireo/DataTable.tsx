"use client";

/*
 * ═══════════════════════════════════════════════════════════════════════════
 * Tableau de données
 * ═══════════════════════════════════════════════════════════════════════════
 * Contrat `.ax-table` de Vireo, en composant générique et typé.
 *
 * Aucun écran n'utilisait le même tableau : trois s'appuyaient sur le `<Table>`
 * de shadcn, les autres empilaient des `<div className="grid grid-cols-…">`.
 * D'où des alignements de colonnes qui se décalaient d'un écran à l'autre, des
 * montants en police proportionnelle (donc des chiffres qui ne s'alignent pas
 * verticalement — inacceptable pour des FCFA), et zéro tri.
 *
 * Trois choix structurants :
 *
 *   · `numeric` bascule la colonne en chiffres tabulaires alignés à droite.
 *     C'est le contrat `.ax-table__td--num`, et c'est ce qui rend une colonne
 *     de montants lisible en diagonale.
 *
 *   · `hideBelow` retire les colonnes secondaires sur petit écran plutôt que
 *     de tout comprimer. Un tableau de sept colonnes sur un téléphone est
 *     illisible ; les quatre qui comptent le sont.
 *
 *   · `rowHref` rend la ligne cliquable SANS casser l'accessibilité : la
 *     première cellule reçoit un vrai lien (cible clavier et lecteur d'écran),
 *     la ligne n'ajoute qu'un raccourci souris. Les clics venant d'un bouton
 *     d'action sont ignorés, sinon « Supprimer » naviguerait avant d'agir.
 */

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronsUpDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SortState } from "@/hooks/useCollection";

export interface Column<T, SK extends string = string> {
  /** Identifiant de colonne — sert de clé React et de clé de tri. */
  key: string;
  header: React.ReactNode;
  cell: (row: T) => React.ReactNode;
  /** Chiffres tabulaires alignés à droite (montants, quantités, dates courtes). */
  numeric?: boolean;
  /** Clé de tri, telle que déclarée dans les `sorters` de useCollection. */
  sortKey?: SK;
  /** Colonne masquée sous ce point de rupture. */
  hideBelow?: "sm" | "md" | "lg";
  /** Largeur fixe, ex. « 1px » pour une colonne d'actions. */
  width?: string;
  /** Retire l'en-tête visible (colonne d'actions) tout en le gardant lisible. */
  headerHidden?: boolean;
  className?: string;
}

const HIDE_CLASS = {
  sm: "hidden sm:table-cell",
  md: "hidden md:table-cell",
  lg: "hidden lg:table-cell",
} as const;

export interface DataTableProps<T, SK extends string = string> {
  rows: readonly T[];
  columns: Column<T, SK>[];
  getRowKey: (row: T) => string | number;
  /** Rend la ligne navigable. */
  rowHref?: (row: T) => string;
  /** Signale les lignes qui demandent attention (rejets, échecs…). */
  rowTone?: (row: T) => "success" | "warning" | "danger" | undefined;
  sort?: SortState<SK> | null;
  onSort?: (key: SK) => void;
  /** Affiché à la place du tableau quand `rows` est vide. */
  empty?: React.ReactNode;
  /** Ligne de totaux. */
  footer?: React.ReactNode;
  /** Résumé lu par les lecteurs d'écran. */
  caption?: string;
  compact?: boolean;
  className?: string;
}

export function DataTable<T, SK extends string = string>({
  rows,
  columns,
  getRowKey,
  rowHref,
  rowTone,
  sort,
  onSort,
  empty,
  footer,
  caption,
  compact = false,
  className,
}: DataTableProps<T, SK>) {
  const router = useRouter();

  if (rows.length === 0 && empty) return <>{empty}</>;

  /*
   * Un clic sur un bouton, un lien ou un champ à l'intérieur de la ligne ne
   * doit pas déclencher la navigation de ligne. On remonte le DOM depuis la
   * cible plutôt que de compter sur stopPropagation dans chaque cellule.
   */
  const isInteractive = (target: EventTarget | null) =>
    target instanceof Element &&
    target.closest("a,button,input,select,textarea,[role='button']") !== null;

  return (
    <div className={cn("ax-table-wrap", className)}>
      <table
        className={cn(
          "ax-table ax-table--hover",
          compact && "ax-table--compact",
        )}
      >
        {caption && <caption className="ax-visually-hidden">{caption}</caption>}

        <thead className="ax-table__head">
          <tr>
            {columns.map((col) => {
              const sortable = Boolean(col.sortKey && onSort);
              const active = sort?.key === col.sortKey;
              const SortIcon = !active
                ? ChevronsUpDown
                : sort?.dir === "asc"
                  ? ChevronUp
                  : ChevronDown;

              return (
                <th
                  key={col.key}
                  scope="col"
                  style={col.width ? { width: col.width } : undefined}
                  aria-sort={
                    active
                      ? sort?.dir === "asc"
                        ? "ascending"
                        : "descending"
                      : undefined
                  }
                  className={cn(
                    "ax-table__th",
                    col.numeric && "ax-table__th--num",
                    sortable && "ax-table__th--sortable",
                    col.hideBelow && HIDE_CLASS[col.hideBelow],
                    col.className,
                  )}
                  onClick={sortable ? () => onSort!(col.sortKey!) : undefined}
                >
                  {col.headerHidden ? (
                    <span className="ax-visually-hidden">{col.header}</span>
                  ) : (
                    <>
                      {col.header}
                      {sortable && (
                        <SortIcon className="ax-table__sort" aria-hidden="true" />
                      )}
                    </>
                  )}
                </th>
              );
            })}
          </tr>
        </thead>

        <tbody>
          {rows.map((row) => {
            const href = rowHref?.(row);
            const tone = rowTone?.(row);

            return (
              <tr
                key={getRowKey(row)}
                className={cn(
                  "ax-table__row",
                  tone && `ax-table__row--${tone}`,
                  href && "cursor-pointer",
                )}
                onClick={
                  href
                    ? (e) => {
                        if (isInteractive(e.target)) return;
                        router.push(href);
                      }
                    : undefined
                }
              >
                {columns.map((col, i) => (
                  <td
                    key={col.key}
                    className={cn(
                      "ax-table__td",
                      col.numeric && "ax-table__td--num",
                      col.hideBelow && HIDE_CLASS[col.hideBelow],
                      col.className,
                    )}
                  >
                    {/* Première cellule : vrai lien, pour le clavier. */}
                    {href && i === 0 ? (
                      <Link href={href} className="ax-link">
                        {col.cell(row)}
                      </Link>
                    ) : (
                      col.cell(row)
                    )}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>

        {footer && <tfoot className="ax-table__foot">{footer}</tfoot>}
      </table>
    </div>
  );
}

export default DataTable;
