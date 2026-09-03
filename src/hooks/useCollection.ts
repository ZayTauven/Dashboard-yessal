"use client";

/*
 * ═══════════════════════════════════════════════════════════════════════════
 * useCollection — recherche, filtres, tri, pagination
 * ═══════════════════════════════════════════════════════════════════════════
 * Chaque écran de liste réécrivait la même mécanique : deux ou trois `useState`,
 * un `useMemo` de filtrage, un `Math.ceil` de pagination, un `slice`. Environ
 * soixante lignes par écran, recopiées onze fois — avec à chaque fois les mêmes
 * deux bugs :
 *
 *   · on restait sur la page 5 après avoir tapé dans la recherche, donc on
 *     voyait une liste vide alors qu'il y avait des résultats ;
 *   · le tri portait sur la page affichée et non sur l'ensemble, donc
 *     « trier par montant décroissant » réordonnait dix lignes sur quatre cents.
 *
 * Les deux sont corrigés ici, une fois. L'ordre des opérations est celui qu'on
 * attend : filtrer → trier → paginer.
 */

import { useCallback, useMemo, useState } from "react";

export type SortDir = "asc" | "desc";

export interface SortState<K extends string = string> {
  key: K;
  dir: SortDir;
}

/** Valeur d'un select signifiant « pas de filtre ». */
export const ALL = "all";

export interface CollectionOptions<T, FK extends string, SK extends string> {
  /** Champs balayés par la recherche plein texte. */
  searchable?: (row: T) => Array<string | number | null | undefined>;
  /** Prédicats de filtre, un par select. Non appelés sur la valeur neutre. */
  filters?: Record<FK, (row: T, value: string) => boolean>;
  /** Accesseurs de tri, un par colonne triable. */
  sorters?: Record<SK, (row: T) => string | number | null | undefined>;
  /*
   * `NoInfer` : ces deux champs CONSOMMENT les clés, ils ne les déclarent pas.
   * Sans lui, `initialSort: { key: "date" }` suffisait à figer SK sur la seule
   * valeur "date", et les autres colonnes triables devenaient inassignables.
   */
  initialSort?: SortState<NoInfer<SK>>;
  initialFilters?: Partial<Record<NoInfer<FK>, string>>;
  pageSize?: number;
}

const collator = new Intl.Collator("fr", { numeric: true, sensitivity: "base" });

function compare(
  a: string | number | null | undefined,
  b: string | number | null | undefined,
): number {
  /* Les valeurs manquantes tombent toujours en fin de liste, quel que soit le
     sens du tri : une ligne sans date n'est ni « la plus récente » ni « la plus
     ancienne », elle est juste incomplète. */
  const aEmpty = a === null || a === undefined || a === "";
  const bEmpty = b === null || b === undefined || b === "";
  if (aEmpty && bEmpty) return 0;
  if (aEmpty) return 1;
  if (bEmpty) return -1;

  if (typeof a === "number" && typeof b === "number") return a - b;
  return collator.compare(String(a), String(b));
}

export function useCollection<T, FK extends string, SK extends string>(
  rows: readonly T[],
  options: CollectionOptions<T, FK, SK> = {},
) {
  const {
    searchable,
    filters,
    sorters,
    initialSort,
    initialFilters,
    pageSize = 10,
  } = options;

  const [search, setSearchRaw] = useState("");
  const [filterValues, setFilterValues] = useState<Record<string, string>>(
    () => {
      const base: Record<string, string> = {};
      for (const k of Object.keys(filters ?? {})) base[k] = ALL;
      return { ...base, ...(initialFilters ?? {}) };
    },
  );
  const [sort, setSort] = useState<SortState<SK> | null>(initialSort ?? null);
  const [page, setPageRaw] = useState(1);

  /* Toute modification du périmètre ramène en page 1 — sinon on atterrit sur
     une page qui n'existe plus. */
  const setSearch = useCallback((value: string) => {
    setSearchRaw(value);
    setPageRaw(1);
  }, []);

  const setFilter = useCallback((key: FK, value: string) => {
    setFilterValues((prev) => ({ ...prev, [key]: value }));
    setPageRaw(1);
  }, []);

  const resetFilters = useCallback(() => {
    setSearchRaw("");
    setFilterValues((prev) => {
      const next: Record<string, string> = {};
      for (const k of Object.keys(prev)) next[k] = ALL;
      return next;
    });
    setPageRaw(1);
  }, []);

  /** Bascule asc → desc → asc sur la colonne demandée. */
  const toggleSort = useCallback((key: SK) => {
    setSort((prev) =>
      prev?.key === key
        ? { key, dir: prev.dir === "asc" ? "desc" : "asc" }
        : { key, dir: "asc" },
    );
    setPageRaw(1);
  }, []);

  /* ── Filtrage ── */
  const matched = useMemo(() => {
    const q = search.trim().toLowerCase();

    return rows.filter((row) => {
      if (q && searchable) {
        const hit = searchable(row).some((field) =>
          field === null || field === undefined
            ? false
            : String(field).toLowerCase().includes(q),
        );
        if (!hit) return false;
      }

      if (filters) {
        for (const key of Object.keys(filters) as FK[]) {
          const value = filterValues[key];
          if (!value || value === ALL) continue;
          if (!filters[key](row, value)) return false;
        }
      }

      return true;
    });
  }, [rows, search, searchable, filters, filterValues]);

  /* ── Tri — sur l'ensemble filtré, jamais sur la page seule ── */
  const sorted = useMemo(() => {
    if (!sort || !sorters?.[sort.key]) return matched;
    const accessor = sorters[sort.key];
    const factor = sort.dir === "asc" ? 1 : -1;

    /* `matched` vient d'un filter() : la copie est déjà propre, mais on ne
       trie jamais en place un tableau mémoïsé. */
    return [...matched].sort((a, b) => factor * compare(accessor(a), accessor(b)));
  }, [matched, sort, sorters]);

  /* ── Pagination ── */
  const total = sorted.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  /* Clamp défensif : une suppression peut vider la dernière page sans qu'aucun
     setter ne soit passé par ici. */
  const safePage = Math.min(page, totalPages);

  const visible = useMemo(
    () => sorted.slice((safePage - 1) * pageSize, safePage * pageSize),
    [sorted, safePage, pageSize],
  );

  const isFiltered =
    search.trim() !== "" ||
    Object.values(filterValues).some((v) => v && v !== ALL);

  return {
    /* recherche */
    search,
    setSearch,
    /* filtres */
    filterValues: filterValues as Record<FK, string>,
    filter: (key: FK) => filterValues[key] ?? ALL,
    setFilter,
    resetFilters,
    isFiltered,
    /* tri */
    sort,
    setSort,
    toggleSort,
    /* pagination */
    page: safePage,
    setPage: setPageRaw,
    totalPages,
    pageSize,
    /* données */
    rows: visible,
    matched: sorted,
    total,
  };
}

export default useCollection;
