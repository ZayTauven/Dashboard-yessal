"use client";

/*
 * ═══════════════════════════════════════════════════════════════════════════
 * Journal d'audit
 * ═══════════════════════════════════════════════════════════════════════════
 * Repris du patron `pages/ActivityLog` de Vireo : barre de filtres avec
 * recherche et puces de type d'événement, au-dessus du journal.
 *
 * Vireo présente son journal en frise chronologique (`.ax-timeline`). On a
 * préféré le tableau ici, pour une raison d'usage : on ne vient pas LIRE ce
 * journal, on vient y CHERCHER — qui a supprimé quoi, et quand. Comparer des
 * lignes demande des colonnes alignées ; les puces de filtre, elles, viennent
 * bien du patron.
 *
 * Deux corrections de fond :
 *
 *   · La colonne « Statut » affichait « Succès » en vert ou « Échec » en rouge
 *     selon `log.success`. Or `accounts.AuditLog` n'a AUCUN champ `success`, et
 *     le sérialiseur ne l'expose pas : la valeur était toujours `undefined`,
 *     donc la colonne affichait « Succès » sur chaque ligne, quoi qu'il arrive.
 *     Une colonne qui ne peut dire qu'une seule chose n'informe pas — elle
 *     rassure à tort. Elle laisse la place à `description`, qui existe et
 *     n'était affichée nulle part.
 *
 *   · La page rendait TOUTES les entrées d'un coup, sans recherche, sans
 *     filtre et sans pagination. C'est pourtant la seule page du produit qui
 *     grossit indéfiniment.
 */

import { useMemo } from "react";
import { ScrollText, Search } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { DataTable, type Column } from "@/components/vireo/DataTable";
import { FilterBar } from "@/components/vireo/FilterBar";
import { Pagination } from "@/components/vireo/Pagination";
import { ALL, useCollection } from "@/hooks/useCollection";

export interface AuditLog {
  id: number;
  user?: number | null;
  user_email?: string | null;
  action: string;
  entity?: string | null;
  entity_id?: number | null;
  description?: string | null;
  created_at: string;
}

type SortKey = "date" | "user" | "action" | "entity";

/*
 * Les actions sont des chaînes libres côté Django (`action = CharField`). On ne
 * peut donc pas s'appuyer sur une énumération : on classe par mot-clé contenu,
 * ce que faisait déjà l'ancienne version — mais en tons sémantiques Aurora
 * plutôt qu'en `bg-green-100`, invisible en thème sombre.
 */
const ACTION_TONE: { keyword: string; label: string; cls: string }[] = [
  { keyword: "CREATE", label: "Création", cls: "ax-badge--success" },
  { keyword: "UPDATE", label: "Modification", cls: "ax-badge--info" },
  { keyword: "DELETE", label: "Suppression", cls: "ax-badge--danger" },
  { keyword: "LOGIN", label: "Connexion", cls: "ax-badge--accent" },
  { keyword: "LOGOUT", label: "Déconnexion", cls: "ax-badge--neutral" },
  { keyword: "EXPORT", label: "Export", cls: "ax-badge--warning" },
];

function toneFor(action: string): string {
  const key = (action || "").toUpperCase();
  return (
    ACTION_TONE.find((t) => key.includes(t.keyword))?.cls ?? "ax-badge--neutral"
  );
}

const dateFmt = new Intl.DateTimeFormat("fr-SN", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

function formatDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : dateFmt.format(d);
}

export function AuditClient({ logs }: { logs: AuditLog[] }) {
  const searchable = useMemo(
    () => (l: AuditLog) => [l.user_email, l.action, l.entity, l.description],
    [],
  );

  const filters = useMemo(
    () => ({
      /* Filtre par mot-clé contenu, pas par égalité : `action` est libre. */
      kind: (l: AuditLog, v: string) =>
        (l.action || "").toUpperCase().includes(v),
      entity: (l: AuditLog, v: string) => (l.entity || "") === v,
    }),
    [],
  );

  const sorters = useMemo(
    () => ({
      date: (l: AuditLog) => l.created_at,
      user: (l: AuditLog) => l.user_email ?? "",
      action: (l: AuditLog) => l.action,
      entity: (l: AuditLog) => l.entity ?? "",
    }),
    [],
  );

  const c = useCollection(logs, {
    searchable,
    filters,
    sorters,
    initialSort: { key: "date", dir: "desc" },
    pageSize: 25,
  });

  /* Compteurs par type — calculés sur l'ensemble, pour que chaque puce annonce
     ce qu'elle contient et non ce que le filtre courant laisse passer. */
  const kindCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const t of ACTION_TONE) {
      counts[t.keyword] = logs.filter((l) =>
        (l.action || "").toUpperCase().includes(t.keyword),
      ).length;
    }
    return counts;
  }, [logs]);

  /* Entités réellement présentes — inutile de proposer un filtre sur une
     entité dont le journal ne contient aucune trace. */
  const entities = useMemo(
    () =>
      Array.from(new Set(logs.map((l) => l.entity).filter(Boolean))) as string[],
    [logs],
  );

  const columns = useMemo<Column<AuditLog, SortKey>[]>(
    () => [
      {
        key: "date",
        header: "Date et heure",
        sortKey: "date",
        cell: (l) => (
          <span className="font-mono tabular text-xs">
            {formatDate(l.created_at)}
          </span>
        ),
      },
      {
        key: "user",
        header: "Utilisateur",
        sortKey: "user",
        cell: (l) =>
          l.user_email || <span className="ax-text-subtle">Système</span>,
      },
      {
        key: "action",
        header: "Action",
        sortKey: "action",
        cell: (l) => (
          <span className={`ax-badge ax-badge--sm ${toneFor(l.action)}`}>
            {l.action}
          </span>
        ),
      },
      {
        key: "entity",
        header: "Entité",
        sortKey: "entity",
        hideBelow: "md",
        cell: (l) =>
          l.entity ? (
            <span className="ax-badge ax-badge--outline ax-badge--sm">
              {l.entity}
              {l.entity_id ? ` #${l.entity_id}` : ""}
            </span>
          ) : (
            <span className="ax-text-subtle">—</span>
          ),
      },
      {
        key: "description",
        header: "Détail",
        hideBelow: "lg",
        cell: (l) => (
          <span className="ax-text-muted ax-clamp-2 text-xs">
            {l.description || "—"}
          </span>
        ),
      },
    ],
    [],
  );

  return (
    <div className="flex flex-col gap-4">
      {/* Puces de type d'événement — reprises du patron Vireo. */}
      <div className="ax-cluster gap-2" role="group" aria-label="Type d'événement">
        <button
          type="button"
          className={`ax-badge ax-badge--filter ax-badge--pill ${
            c.filter("kind") === ALL ? "is-selected" : ""
          }`}
          aria-pressed={c.filter("kind") === ALL}
          onClick={() => c.setFilter("kind", ALL)}
        >
          Tous
          <span className="ax-badge__icon">{logs.length}</span>
        </button>

        {ACTION_TONE.filter((t) => kindCounts[t.keyword] > 0).map((t) => (
          <button
            key={t.keyword}
            type="button"
            className={`ax-badge ax-badge--filter ax-badge--pill ${
              c.filter("kind") === t.keyword ? "is-selected" : ""
            }`}
            aria-pressed={c.filter("kind") === t.keyword}
            onClick={() => c.setFilter("kind", t.keyword)}
          >
            {t.label}
            <span className="ax-badge__icon">{kindCounts[t.keyword]}</span>
          </button>
        ))}
      </div>

      <FilterBar
        searchValue={c.search}
        onSearchChange={c.setSearch}
        searchPlaceholder="Utilisateur, action, entité ou détail…"
        resultCount={c.total}
        itemLabel="entrée"
        filters={
          entities.length > 1
            ? [
                {
                  label: "Entité concernée",
                  value: c.filter("entity"),
                  onChange: (v) => c.setFilter("entity", v),
                  options: [
                    { value: ALL, label: "Toutes les entités" },
                    ...entities.map((e) => ({ value: e, label: e })),
                  ],
                },
              ]
            : []
        }
      />

      <div className="ax-card">
        <DataTable
          rows={c.rows}
          columns={columns}
          getRowKey={(l) => l.id}
          sort={c.sort}
          onSort={c.toggleSort}
          compact
          caption="Journal des actions administratives et financières"
          rowTone={(l) =>
            (l.action || "").toUpperCase().includes("DELETE")
              ? "danger"
              : undefined
          }
          empty={
            <div className="ax-card__body">
              <EmptyState
                icon={c.isFiltered ? Search : ScrollText}
                tone={c.isFiltered ? "search" : "neutral"}
                title={
                  c.isFiltered
                    ? "Aucune entrée ne correspond"
                    : "Aucune activité enregistrée"
                }
                description={
                  c.isFiltered
                    ? "Élargissez la recherche ou changez de type d'événement."
                    : "Les actions administratives et financières apparaîtront ici automatiquement."
                }
                action={
                  c.isFiltered ? (
                    <button
                      type="button"
                      className="ax-btn ax-btn--outline"
                      onClick={c.resetFilters}
                    >
                      <span className="ax-btn__label">
                        Réinitialiser les filtres
                      </span>
                    </button>
                  ) : undefined
                }
              />
            </div>
          }
        />
      </div>

      <Pagination
        page={c.page}
        totalPages={c.totalPages}
        onPageChange={c.setPage}
        totalItems={c.total}
        pageSize={c.pageSize}
        itemLabel="entrées"
      />
    </div>
  );
}
