"use client";

/*
 * ═══════════════════════════════════════════════════════════════════════════
 * Barre de filtres
 * ═══════════════════════════════════════════════════════════════════════════
 * Onze écrans de liste réécrivaient la même barre — et onze fois différemment :
 * hauteurs de champ de 36 à 44 px, fond tantôt `bg-muted/20` tantôt `bg-card`,
 * anneau de focus codé en dur sur `--yessal-violet` (donc insensible à
 * l'accent choisi), et le compteur de résultats présent une fois sur trois.
 *
 * Une seule barre désormais, bâtie sur les contrats `.ax-input` / `.ax-select`.
 * Elle apporte trois choses que les versions maison n'avaient pas :
 *
 *   · un bouton d'effacement dans le champ de recherche — indispensable au
 *     doigt, où sélectionner-puis-supprimer est pénible ;
 *   · un compteur de résultats systématique, seul retour visible quand un
 *     filtre ne renvoie rien ;
 *   · une remise à zéro globale, qui n'existait nulle part : l'utilisateur
 *     devait reposer chaque select sur « Tous » un par un.
 */

import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

const nf = new Intl.NumberFormat("fr-SN");

export interface FilterOption {
  value: string;
  label: string;
}

export interface FilterSpec {
  /** Libellé accessible — masqué visuellement, le select étant explicite. */
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: FilterOption[];
  /** Valeur signifiant « pas de filtre ». Défaut : "all". */
  neutralValue?: string;
}

export interface FilterBarProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  filters?: FilterSpec[];
  /** Boutons alignés à droite : export, création… */
  actions?: React.ReactNode;
  /** Nombre de résultats après filtrage. */
  resultCount?: number;
  /** Nom de l'objet compté, au singulier : « membre », « Jëf »… */
  itemLabel?: string;
  className?: string;
}

export function FilterBar({
  searchValue,
  onSearchChange,
  searchPlaceholder = "Rechercher…",
  filters = [],
  actions,
  resultCount,
  itemLabel = "résultat",
  className,
}: FilterBarProps) {
  const activeFilters = filters.filter(
    (f) => f.value !== (f.neutralValue ?? "all"),
  );
  const isFiltered = searchValue.trim() !== "" || activeFilters.length > 0;

  const resetAll = () => {
    onSearchChange("");
    filters.forEach((f) => f.onChange(f.neutralValue ?? "all"));
  };

  return (
    <div className={cn("ax-card ax-card--compact", className)}>
      <div className="ax-card__body flex flex-col gap-3">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          {/* Recherche — prend toute la largeur disponible. */}
          <div className="ax-field__control flex-1 min-w-0">
            <span className="ax-field__affix ax-field__affix--leading">
              <Search aria-hidden="true" />
            </span>
            <input
              type="search"
              className="ax-input ax-input--with-leading-icon ax-input--with-trailing"
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              aria-label={searchPlaceholder}
            />
            {searchValue && (
              <button
                type="button"
                className="ax-field__affix ax-field__affix--trailing ax-field__affix--button"
                onClick={() => onSearchChange("")}
                aria-label="Effacer la recherche"
              >
                <X aria-hidden="true" />
              </button>
            )}
          </div>

          {/* Filtres — en grille sur mobile pour éviter les selects écrasés. */}
          {filters.length > 0 && (
            <div className="grid grid-cols-2 gap-2 md:flex md:flex-wrap md:items-center">
              {filters.map((f) => (
                <select
                  key={f.label}
                  className="ax-select md:w-auto"
                  value={f.value}
                  onChange={(e) => f.onChange(e.target.value)}
                  aria-label={f.label}
                >
                  {f.options.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              ))}
            </div>
          )}

          {actions && (
            <div className="flex items-center gap-2 md:ms-auto">{actions}</div>
          )}
        </div>

        {/*
          Ligne de état — n'apparaît que si elle a quelque chose à dire.
          Afficher « 412 résultats » sur une liste jamais filtrée est du bruit ;
          l'afficher dès qu'un filtre mord est une confirmation utile.
        */}
        {(isFiltered || typeof resultCount === "number") && (
          <div className="flex flex-wrap items-center gap-2">
            {typeof resultCount === "number" && (
              <span className="ax-text-muted text-sm">
                <span className="font-mono tabular ax-text-strong">
                  {nf.format(resultCount)}
                </span>{" "}
                {itemLabel}
                {resultCount > 1 ? "s" : ""}
              </span>
            )}

            {isFiltered && (
              <button
                type="button"
                className="ax-btn ax-btn--ghost ax-btn--sm ms-auto"
                onClick={resetAll}
              >
                <X className="ax-btn__icon" size={14} aria-hidden="true" />
                <span className="ax-btn__label">Réinitialiser</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default FilterBar;
