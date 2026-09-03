"use client";

/*
 * ═══════════════════════════════════════════════════════════════════════════
 * Sélecteur de Daara
 * ═══════════════════════════════════════════════════════════════════════════
 * Contrat `.ax-combobox` de Vireo, sur les primitives Radix Popover : une liste
 * longue (plusieurs centaines de Daaras), groupée par zone LDD, avec recherche.
 *
 * Le composant existait en DEUX exemplaires — un dans « Utilisateurs et rôles »,
 * un dans « Annonces Hub » — écrits à la main, avec des dimensions différentes
 * (`w-[400px]` ici, `w-[--radix-popover-trigger-width]` là), des libellés
 * d'option divergents (« Global (Aucun Daara) » vs « Toutes les entités ») et,
 * dans un seul des deux, le code de la zone affiché. Une seule version
 * désormais, paramétrée par `neutralLabel`.
 *
 * Détail d'intégration : `.ax-combobox__panel` est `position: absolute` chez
 * Vireo, qui positionne ses panneaux à la main. Radix s'en charge lui-même ;
 * on neutralise donc la règle avec l'utilitaire `static`, qui gagne puisque les
 * feuilles Vireo vivent dans `@layer components`.
 */

import { useMemo, useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export interface DaaraOption {
  id: number | string;
  name?: string | null;
  ldd?: { id?: number | string; code?: string | null; name?: string | null } | null;
}

export interface DaaraComboboxProps {
  daaras: DaaraOption[];
  value: string;
  onChange: (value: string) => void;
  /** Libellé de l'option « aucun Daara ». */
  neutralLabel?: string;
  /** Valeur associée à cette option — "" ou "NONE" selon l'appelant. */
  neutralValue?: string;
  placeholder?: string;
  id?: string;
}

export function DaaraCombobox({
  daaras,
  value,
  onChange,
  neutralLabel = "Aucun Daara",
  neutralValue = "",
  placeholder = "Sélectionner un Daara…",
  id,
}: DaaraComboboxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  /* Groupés par zone, chaque groupe trié par nom : sur une longue liste, c'est
     la zone qu'on repère avant le Daara. */
  const groups = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = daaras.filter(
      (d) =>
        !q ||
        (d.name?.toLowerCase().includes(q) ?? false) ||
        (d.ldd?.name?.toLowerCase().includes(q) ?? false) ||
        (d.ldd?.code?.toLowerCase().includes(q) ?? false),
    );

    const byLdd = new Map<
      string,
      { name: string; code: string; items: DaaraOption[] }
    >();

    for (const d of filtered) {
      const key = String(d.ldd?.id ?? "unknown");
      if (!byLdd.has(key)) {
        byLdd.set(key, {
          name: d.ldd?.name || "Sans zone",
          code: d.ldd?.code || "",
          items: [],
        });
      }
      byLdd.get(key)!.items.push(d);
    }

    for (const g of byLdd.values()) {
      g.items.sort((a, b) => (a.name || "").localeCompare(b.name || "", "fr"));
    }

    return [...byLdd.values()].sort((a, b) =>
      a.name.localeCompare(b.name, "fr"),
    );
  }, [daaras, search]);

  const selected = daaras.find((d) => String(d.id) === value);

  const pick = (next: string) => {
    onChange(next);
    setOpen(false);
    setSearch("");
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <div className="ax-combobox">
        <PopoverTrigger asChild>
          <button
            id={id}
            type="button"
            role="combobox"
            aria-expanded={open}
            className="ax-combobox__trigger"
          >
            <span className="ax-combobox__value">
              {selected ? selected.name : value === neutralValue ? neutralLabel : placeholder}
            </span>
            <ChevronsUpDown className="ax-combobox__caret" aria-hidden="true" />
          </button>
        </PopoverTrigger>

        {/*
          `max-h-none overflow-visible` neutralise le `max-height: 320px` +
          `overflow-y: auto` que Vireo pose sur `.ax-combobox__panel`.

          Ce panneau contient DÉJÀ un conteneur défilant — la liste, plus bas,
          en `max-h-80`. Les deux se superposaient donc, avec la même hauteur :
          deux ascenseurs côte à côte, et une molette qui faisait remonter le
          champ de recherche hors de vue au lieu de faire défiler les options.
          Le panneau ne défile plus ; la recherche reste en tête, seule la liste
          bouge — le comportement attendu d'un combobox.

          `collisionPadding` garde le panneau à l'intérieur de la fenêtre : sans
          lui, ouvert depuis une modale, il en débordait sur la droite.
        */}
        <PopoverContent
          align="start"
          collisionPadding={12}
          /*
            Rendu sur place, jamais portalisé. Un sélecteur de Daara s'ouvre
            aussi bien dans une page que dans une modale, et dans une modale un
            panneau portalisé sort du périmètre que Radix Dialog autorise à
            défiler : la liste devenait immobile. Voir le commentaire de
            `PopoverContent` dans components/ui/popover.tsx.
          */
          portal={false}
          className="ax-combobox__panel static max-h-none w-(--radix-popover-trigger-width) min-w-72 overflow-visible p-0"
        >
          <div className="ax-combobox__search">
            <input
              className="ax-input ax-input--sm"
              placeholder="Rechercher un Daara ou une zone…"
              aria-label="Rechercher un Daara"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* `overscroll-contain` : arrivé en bout de liste, la molette ne
              part pas faire défiler la modale derrière. */}
          <div className="ax-scroll-y max-h-80 overscroll-contain">
            <button
              type="button"
              className="ax-combobox__option"
              onClick={() => pick(neutralValue)}
            >
              <Check
                size={14}
                className={value === neutralValue ? "opacity-100" : "opacity-0"}
                aria-hidden="true"
              />
              {neutralLabel}
            </button>

            {groups.length === 0 ? (
              <p className="ax-combobox__empty">Aucun Daara ne correspond.</p>
            ) : (
              groups.map((g) => (
                <div key={`${g.name}-${g.code}`}>
                  <p className="ax-combobox__group-label flex items-center justify-between gap-2">
                    <span>{g.name}</span>
                    {g.code && (
                      <span className="ax-text-accent font-mono">{g.code}</span>
                    )}
                  </p>
                  {g.items.map((d) => (
                    <button
                      key={d.id}
                      type="button"
                      className="ax-combobox__option"
                      onClick={() => pick(String(d.id))}
                    >
                      <Check
                        size={14}
                        className={
                          value === String(d.id) ? "opacity-100" : "opacity-0"
                        }
                        aria-hidden="true"
                      />
                      {d.name}
                    </button>
                  ))}
                </div>
              ))
            )}
          </div>
        </PopoverContent>
      </div>
    </Popover>
  );
}

export default DaaraCombobox;
