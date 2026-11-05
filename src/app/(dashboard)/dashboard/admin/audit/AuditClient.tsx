"use client";

/*
 * ═══════════════════════════════════════════════════════════════════════════
 * Journal d'audit
 * ═══════════════════════════════════════════════════════════════════════════
 * On ne vient pas LIRE ce journal, on vient y CHERCHER : qui a supprimé quoi, et
 * quand. D'où le tableau plutôt que la frise du patron `ActivityLog` de Vireo.
 *
 * Le texte des lignes vient de Django (`accounts/services/audit_presentation.py`) :
 * lui seul peut relier `/api/users/12/` au nom du membre. L'écran ne reçoit plus
 * à traduire que les domaines et les dates, et garde la requête brute dans le
 * détail de chaque ligne, pour qui doit la vérifier.
 *
 * La couleur est réservée à ce qui demande attention (suppression, blocage,
 * annulation), et portée par la ligne : teinter aussi chaque domaine rendrait
 * ce signal invisible.
 *
 * Les heures sont celles de Dakar, explicitement. Un fuseau laissé au navigateur
 * ferait diverger le rendu serveur et le rendu client chez un administrateur de
 * la diaspora, et surtout deux administrateurs ne liraient pas la même heure
 * pour le même acte.
 */

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ChevronRight,
  Layers,
  MessagesSquare,
  Megaphone,
  Newspaper,
  Network,
  ScrollText,
  Search,
  Settings2,
  Users,
  Wallet,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { Avatar } from "@/components/vireo/Avatar";
import { DataTable, type Column } from "@/components/vireo/DataTable";
import { FilterBar } from "@/components/vireo/FilterBar";
import { Modal } from "@/components/vireo/Modal";
import { Pagination } from "@/components/vireo/Pagination";
import { ALL, useCollection } from "@/hooks/useCollection";

export interface AuditLog {
  id: number;
  user?: number | null;
  actor_name?: string | null;
  actor_contact?: string | null;
  action: string;
  label: string;
  domain: string;
  routine: boolean;
  tone?: "danger" | "warning" | null;
  target_label?: string | null;
  target_href?: string | null;
  detail?: string | null;
  metadata?: Record<string, unknown> | null;
  created_at: string;
}

type SortKey = "date" | "actor" | "label";

const DOMAINS: { key: string; label: string; icon: LucideIcon }[] = [
  { key: "argent", label: "Argent", icon: Wallet },
  { key: "membres", label: "Membres", icon: Users },
  { key: "ndiguels", label: "Ndiguels", icon: Megaphone },
  { key: "actualites", label: "Actualités", icon: Newspaper },
  { key: "organisation", label: "Organisation", icon: Network },
  { key: "reglages", label: "Réglages", icon: Settings2 },
  { key: "messagerie", label: "Messagerie", icon: MessagesSquare },
  { key: "autre", label: "Autre", icon: Layers },
];

const domainOf = (key: string) =>
  DOMAINS.find((d) => d.key === key) ?? DOMAINS[DOMAINS.length - 1];

/* Un auteur absent n'est pas « le système » : tout acte journalisé a un auteur
   connecté, et le lien ne se vide que lorsque son compte est supprimé. */
const DELETED_ACTOR = "Compte supprimé";
const DELETED_ACTOR_KEY = "deleted";

const actorKey = (l: AuditLog) => (l.user ? String(l.user) : DELETED_ACTOR_KEY);
const actorName = (l: AuditLog) => l.actor_name || DELETED_ACTOR;

const TIME_ZONE = "Africa/Dakar";
const DAY_MS = 86_400_000;

/* `en-CA` écrit AAAA-MM-JJ : ces clés se comparent comme de simples chaînes. */
const dayKeyFmt = new Intl.DateTimeFormat("en-CA", {
  timeZone: TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});
const timeFmt = new Intl.DateTimeFormat("fr-SN", {
  timeZone: TIME_ZONE,
  hour: "2-digit",
  minute: "2-digit",
});
const dayFmt = new Intl.DateTimeFormat("fr-SN", {
  timeZone: TIME_ZONE,
  day: "numeric",
  month: "short",
  year: "numeric",
});
const fullFmt = new Intl.DateTimeFormat("fr-SN", {
  timeZone: TIME_ZONE,
  dateStyle: "full",
  timeStyle: "medium",
});

const dayKey = (iso: string | number) => dayKeyFmt.format(new Date(iso));

function whenParts(iso: string, today: string, yesterday: string) {
  const key = dayKey(iso);
  return {
    day:
      key === today
        ? "Aujourd'hui"
        : key === yesterday
          ? "Hier"
          : dayFmt.format(new Date(iso)),
    time: timeFmt.format(new Date(iso)),
  };
}

const PERIODS = [
  { value: ALL, label: "Toute la période" },
  { value: "1", label: "Aujourd'hui" },
  { value: "7", label: "7 derniers jours" },
  { value: "30", label: "30 derniers jours" },
];

function AuditDetail({
  log,
  onClose,
  today,
  yesterday,
}: {
  log: AuditLog | null;
  onClose: () => void;
  today: string;
  yesterday: string;
}) {
  if (!log) return null;

  const domain = domainOf(log.domain);
  const when = whenParts(log.created_at, today, yesterday);
  const status = log.metadata?.status_code;
  const params = log.metadata?.query_params as
    | Record<string, unknown>
    | undefined;
  const hasParams = params && Object.keys(params).length > 0;

  return (
    <Modal
      open
      onOpenChange={(open) => !open && onClose()}
      title={log.label}
      description={`${when.day} à ${when.time}, heure de Dakar`}
      footer={
        <button
          type="button"
          className="ax-btn ax-btn--outline"
          onClick={onClose}
        >
          <span className="ax-btn__label">Fermer</span>
        </button>
      }
    >
      <dl className="flex flex-col gap-3 text-sm">
        <div>
          <dt className="ax-text-muted text-xs">Auteur</dt>
          <dd className="ax-text-strong">
            {actorName(log)}
            {log.actor_contact && (
              <span className="ax-text-muted font-normal">
                {" "}
                · {log.actor_contact}
              </span>
            )}
          </dd>
        </div>

        {log.target_label && (
          <div>
            <dt className="ax-text-muted text-xs">Concerne</dt>
            <dd className="ax-text-strong">
              {log.target_href ? (
                <Link href={log.target_href} className="ax-link">
                  {log.target_label}
                </Link>
              ) : (
                log.target_label
              )}
            </dd>
          </div>
        )}

        {log.detail && (
          <div>
            <dt className="ax-text-muted text-xs">Précisions</dt>
            <dd>{log.detail}</dd>
          </div>
        )}

        <div>
          <dt className="ax-text-muted text-xs">Domaine</dt>
          <dd>
            {domain.label}
            {log.routine ? " · activité courante" : ""}
          </dd>
        </div>

        <div>
          <dt className="ax-text-muted text-xs">Date exacte</dt>
          <dd>{fullFmt.format(new Date(log.created_at))}</dd>
        </div>
      </dl>

      <details className="mt-4 text-sm">
        <summary className="ax-text-muted cursor-pointer">
          Informations techniques
        </summary>
        <dl className="mt-2 flex flex-col gap-2 text-xs">
          <div>
            <dt className="ax-text-muted">Requête enregistrée</dt>
            <dd className="font-mono break-all">{log.action}</dd>
          </div>
          {typeof status === "number" && (
            <div>
              <dt className="ax-text-muted">Réponse du serveur</dt>
              <dd className="font-mono">{status}</dd>
            </div>
          )}
          {hasParams && (
            <div>
              <dt className="ax-text-muted">Paramètres</dt>
              <dd className="font-mono break-all">{JSON.stringify(params)}</dd>
            </div>
          )}
          <div>
            <dt className="ax-text-muted">Entrée du journal</dt>
            <dd className="font-mono">n°{log.id}</dd>
          </div>
        </dl>
      </details>
    </Modal>
  );
}

export function AuditClient({ logs }: { logs: AuditLog[] }) {
  const [includeRoutine, setIncludeRoutine] = useState(false);
  const [selected, setSelected] = useState<AuditLog | null>(null);

  const [{ today, yesterday, now }] = useState(() => {
    const instant = Date.now();
    return {
      now: instant,
      today: dayKey(instant),
      yesterday: dayKey(instant - DAY_MS),
    };
  });

  const routineCount = useMemo(
    () => logs.filter((l) => l.routine).length,
    [logs],
  );

  const scope = useMemo(
    () => (includeRoutine ? logs : logs.filter((l) => !l.routine)),
    [logs, includeRoutine],
  );

  const searchable = useMemo(
    () => (l: AuditLog) => [
      actorName(l),
      l.actor_contact,
      l.label,
      l.target_label,
      l.detail,
      domainOf(l.domain).label,
    ],
    [],
  );

  const filters = useMemo(
    () => ({
      domain: (l: AuditLog, v: string) => l.domain === v,
      actor: (l: AuditLog, v: string) => actorKey(l) === v,
      period: (l: AuditLog, v: string) =>
        dayKey(l.created_at) >= dayKey(now - (Number(v) - 1) * DAY_MS),
    }),
    [now],
  );

  const sorters = useMemo(
    () => ({
      date: (l: AuditLog) => l.created_at,
      actor: (l: AuditLog) => actorName(l),
      label: (l: AuditLog) => l.label,
    }),
    [],
  );

  const c = useCollection(scope, {
    searchable,
    filters,
    sorters,
    initialSort: { key: "date", dir: "desc" },
    pageSize: 25,
  });

  const domainCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const l of scope) counts[l.domain] = (counts[l.domain] ?? 0) + 1;
    return counts;
  }, [scope]);

  /* Tous les auteurs du journal, pas ceux du filtre courant : masquer
     l'activité courante ne doit pas faire disparaître l'auteur sélectionné. */
  const actors = useMemo(() => {
    const byKey = new Map(logs.map((l) => [actorKey(l), l]));
    const entries = Array.from(byKey, ([value, l]) => ({
      value,
      label: actorName(l),
      contact: l.actor_contact,
    }));

    /* Deux membres peuvent porter le même nom : le contact les départage. */
    const seen = new Map<string, number>();
    for (const e of entries) seen.set(e.label, (seen.get(e.label) ?? 0) + 1);

    return entries
      .map(({ value, label, contact }) => ({
        value,
        label:
          (seen.get(label) ?? 0) > 1 && contact
            ? `${label} (${contact})`
            : label,
      }))
      .sort((a, b) => a.label.localeCompare(b.label, "fr"));
  }, [logs]);

  /* Le domaine ne remet pas à zéro quand son dernier élément sort du périmètre :
     sans ce repli, la puce sélectionnée disparaîtrait et la liste resterait vide. */
  const activeDomain = c.filter("domain");
  const visibleDomains = DOMAINS.filter(
    (d) => domainCounts[d.key] > 0 || d.key === activeDomain,
  );

  const columns = useMemo<Column<AuditLog, SortKey>[]>(
    () => [
      {
        key: "date",
        header: "Quand",
        sortKey: "date",
        width: "7.5rem",
        cell: (l) => {
          const when = whenParts(l.created_at, today, yesterday);
          return (
            <span className="flex flex-col whitespace-nowrap">
              <span className="ax-text-strong text-sm">{when.day}</span>
              <span className="ax-text-muted font-mono tabular text-xs">
                {when.time}
              </span>
            </span>
          );
        },
      },
      {
        key: "label",
        header: "Action",
        sortKey: "label",
        cell: (l) => (
          <span className="flex min-w-0 flex-col gap-0.5">
            <span className="ax-text-strong text-sm">{l.label}</span>
            {l.target_label && (
              <span className="ax-text-muted text-xs break-words">
                {l.target_href ? (
                  <Link href={l.target_href} className="ax-link">
                    {l.target_label}
                  </Link>
                ) : (
                  l.target_label
                )}
              </span>
            )}
            {/* Sur téléphone, la colonne « Qui » disparaît : l'auteur vient ici. */}
            <span className="ax-text-muted text-xs md:hidden">
              par {actorName(l)}
            </span>
          </span>
        ),
      },
      {
        key: "actor",
        header: "Qui",
        sortKey: "actor",
        hideBelow: "md",
        cell: (l) => (
          <span className="flex items-center gap-2 min-w-0">
            <Avatar name={l.actor_name} size="xs" />
            <span className={l.user ? "text-sm" : "ax-text-muted text-sm"}>
              {actorName(l)}
            </span>
          </span>
        ),
      },
      {
        key: "domain",
        header: "Domaine",
        hideBelow: "lg",
        cell: (l) => {
          const domain = domainOf(l.domain);
          const Icon = domain.icon;
          return (
            <span className="ax-text-muted inline-flex items-center gap-1.5 text-xs whitespace-nowrap">
              <Icon size={14} aria-hidden="true" />
              {domain.label}
            </span>
          );
        },
      },
      {
        key: "open",
        header: "Détail",
        headerHidden: true,
        width: "1px",
        cell: (l) => (
          <button
            type="button"
            className="ax-btn ax-btn--ghost ax-btn--sm ax-btn--icon"
            aria-label={`Voir le détail : ${l.label}`}
            onClick={() => setSelected(l)}
          >
            <ChevronRight className="ax-btn__icon" aria-hidden="true" />
          </button>
        ),
      },
    ],
    [today, yesterday],
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="ax-cluster gap-2" role="group" aria-label="Domaine">
        <button
          type="button"
          className={`ax-badge ax-badge--filter ax-badge--pill ${
            activeDomain === ALL ? "is-selected" : ""
          }`}
          aria-pressed={activeDomain === ALL}
          onClick={() => c.setFilter("domain", ALL)}
        >
          Tout
          <span className="ax-badge__icon">{scope.length}</span>
        </button>

        {visibleDomains.map((d) => (
          <button
            key={d.key}
            type="button"
            className={`ax-badge ax-badge--filter ax-badge--pill ${
              activeDomain === d.key ? "is-selected" : ""
            }`}
            aria-pressed={activeDomain === d.key}
            onClick={() => c.setFilter("domain", d.key)}
          >
            {d.label}
            <span className="ax-badge__icon">{domainCounts[d.key] ?? 0}</span>
          </button>
        ))}
      </div>

      <FilterBar
        searchValue={c.search}
        onSearchChange={c.setSearch}
        searchPlaceholder="Nom, action, membre, Ndiguel…"
        resultCount={c.total}
        itemLabel="entrée"
        filters={[
          {
            label: "Auteur",
            value: c.filter("actor"),
            onChange: (v) => c.setFilter("actor", v),
            options: [{ value: ALL, label: "Tous les auteurs" }, ...actors],
          },
          {
            label: "Période",
            value: c.filter("period"),
            onChange: (v) => c.setFilter("period", v),
            options: PERIODS,
          },
        ]}
      />

      {routineCount > 0 && (
        <label className="ax-check text-sm">
          <input
            type="checkbox"
            className="ax-checkbox"
            checked={includeRoutine}
            onChange={(e) => setIncludeRoutine(e.target.checked)}
          />
          <span>
            Afficher aussi l&apos;activité courante{" "}
            <span className="ax-text-muted">
              (messages, réactions, profils : {routineCount})
            </span>
          </span>
        </label>
      )}

      <div className="ax-card">
        <DataTable
          rows={c.rows}
          columns={columns}
          getRowKey={(l) => l.id}
          sort={c.sort}
          onSort={c.toggleSort}
          onRowClick={setSelected}
          compact
          caption="Journal des actions administratives et financières"
          rowTone={(l) => l.tone ?? undefined}
          empty={
            <div className="ax-card__body">
              <EmptyState
                icon={c.isFiltered ? Search : ScrollText}
                tone={c.isFiltered ? "search" : "neutral"}
                title={
                  c.isFiltered
                    ? "Aucune entrée ne correspond"
                    : "Aucune action de gestion enregistrée"
                }
                description={
                  c.isFiltered
                    ? "Élargissez la recherche, la période ou le domaine."
                    : "Les actes de gestion et les mouvements d'argent apparaîtront ici automatiquement."
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

      {/* Ce que le journal ne contient pas compte autant que ce qu'il contient :
          une absence de trace ne doit pas être lue comme une absence d'acte. */}
      <p className="ax-text-muted text-xs">
        Heures de Dakar. Le journal retient les actions abouties : les
        connexions et les tentatives refusées n&apos;y figurent pas.
      </p>

      <AuditDetail
        log={selected}
        onClose={() => setSelected(null)}
        today={today}
        yesterday={yesterday}
      />
    </div>
  );
}
