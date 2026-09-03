"use client";

/*
 * ═══════════════════════════════════════════════════════════════════════════
 * Validation des comptes
 * ═══════════════════════════════════════════════════════════════════════════
 * File d'attente d'administration : on y vient pour TRAITER, pas pour
 * consulter. La reprise suit ce que fait l'écran, pas ce qu'il montrait.
 *
 *   · Le filtre par défaut est « En attente ». C'est la seule raison d'ouvrir
 *     cette page ; l'ancienne version affichait tout le monde, comptes déjà
 *     validés compris, et il fallait chercher les demandes au milieu.
 *
 *   · Les compteurs deviennent des onglets cliquables. Ils étaient déjà
 *     calculés et affichés — mais purement décoratifs, alors qu'ils désignent
 *     exactement les trois sous-ensembles qu'on veut voir.
 *
 *   · Les boutons d'action étaient peints en `bg-green-50 text-green-600` et
 *     `bg-red-50 text-red-600` : invisibles en thème sombre. Ils passent sur
 *     `.ax-btn--soft-success` / `.ax-btn--soft-danger`.
 *
 *   · Le statut avait son propre vocabulaire (« Activé », « Bloqué ») ; il
 *     passe par <StatusBadge domain="user">, comme partout ailleurs.
 *
 * L'action reste optimiste — la ligne change d'état sans attendre le serveur —
 * mais elle REVIENT en arrière si l'appel échoue, ce que l'ancienne version ne
 * faisait pas : en cas d'erreur réseau, l'écran affirmait une validation qui
 * n'avait pas eu lieu.
 */

import { useMemo, useState, useTransition } from "react";
import { Search, UserCheck, UserX, Users } from "lucide-react";
import { toast } from "sonner";
import { updateUserStatus } from "@/app/actions/users";
import { EmptyState } from "@/components/ui/empty-state";
import { roleLabel } from "@/lib/roles";
import { Avatar } from "@/components/vireo/Avatar";
import { DataTable, type Column } from "@/components/vireo/DataTable";
import { FilterBar } from "@/components/vireo/FilterBar";
import { Pagination } from "@/components/vireo/Pagination";
import { StatusBadge } from "@/components/vireo/StatusBadge";
import { ALL, useCollection } from "@/hooks/useCollection";

export interface PendingUser {
  id: number;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  role?: string | null;
  status?: string | null;
  avatar?: string | null;
  avatar_url?: string | null;
  daara?: { name?: string | null } | null;
}

type SortKey = "name" | "role" | "status";

const TABS = [
  { value: "pending", label: "En attente" },
  { value: "active", label: "Validés" },
  { value: ALL, label: "Tous" },
];

const fullName = (u: PendingUser) =>
  `${u.first_name ?? ""} ${u.last_name ?? ""}`.trim();

export function MembersValidationClient({
  initialUsers,
}: {
  initialUsers: PendingUser[];
}) {
  const [users, setUsers] = useState(initialUsers);
  const [isPending, startTransition] = useTransition();

  const handleAction = (user: PendingUser, action: "validate" | "block") => {
    const previous = user.status;
    const next = action === "validate" ? "active" : "blocked";

    /* Optimiste, mais réversible : une erreur réseau remet la ligne dans son
       état d'origine au lieu de laisser croire à une validation. */
    setUsers((prev) =>
      prev.map((u) => (u.id === user.id ? { ...u, status: next } : u)),
    );

    startTransition(async () => {
      const res = await updateUserStatus(user.id, action);
      if (res.error) {
        setUsers((prev) =>
          prev.map((u) => (u.id === user.id ? { ...u, status: previous } : u)),
        );
        toast.error(res.error);
        return;
      }
      toast.success(
        action === "validate"
          ? `Compte de ${fullName(user)} validé.`
          : `Accès de ${fullName(user)} bloqué.`,
      );
    });
  };

  const searchable = useMemo(
    () => (u: PendingUser) => [u.first_name, u.last_name, u.email, u.daara?.name],
    [],
  );

  const filters = useMemo(
    () => ({ status: (u: PendingUser, v: string) => u.status === v }),
    [],
  );

  const sorters = useMemo(
    () => ({
      name: (u: PendingUser) => fullName(u),
      role: (u: PendingUser) => u.role ?? "",
      status: (u: PendingUser) => u.status ?? "",
    }),
    [],
  );

  const c = useCollection(users, {
    searchable,
    filters,
    sorters,
    initialSort: { key: "name", dir: "asc" },
    /* On ouvre sur la file d'attente : c'est la raison d'être de l'écran. */
    initialFilters: { status: "pending" },
    pageSize: 15,
  });

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { [ALL]: users.length };
    for (const u of users) {
      const s = u.status ?? "unknown";
      counts[s] = (counts[s] ?? 0) + 1;
    }
    return counts;
  }, [users]);

  const columns = useMemo<Column<PendingUser, SortKey>[]>(
    () => [
      {
        key: "user",
        header: "Utilisateur",
        sortKey: "name",
        cell: (u) => (
          <div className="flex items-center gap-3">
            <Avatar src={u.avatar || u.avatar_url} name={fullName(u)} size="sm" />
            <div className="min-w-0">
              <div className="ax-truncate font-medium">{fullName(u)}</div>
              <div className="ax-truncate ax-text-subtle text-xs">{u.email}</div>
            </div>
          </div>
        ),
      },
      {
        key: "daara",
        header: "Daara",
        hideBelow: "md",
        cell: (u) =>
          u.daara?.name || <span className="ax-text-subtle">Sans Daara</span>,
      },
      {
        key: "role",
        header: "Rôle",
        sortKey: "role",
        hideBelow: "sm",
        cell: (u) => (
          <span className="ax-badge ax-badge--outline ax-badge--sm">
            {roleLabel(u.role ?? "")}
          </span>
        ),
      },
      {
        key: "status",
        header: "Statut",
        sortKey: "status",
        cell: (u) => <StatusBadge domain="user" value={u.status} size="sm" />,
      },
      {
        key: "actions",
        header: "Actions",
        headerHidden: true,
        numeric: true,
        cell: (u) => (
          <div className="flex justify-end gap-2">
            {u.status !== "active" && (
              <button
                type="button"
                className="ax-btn ax-btn--soft-success ax-btn--sm"
                disabled={isPending}
                onClick={() => handleAction(u, "validate")}
              >
                <UserCheck className="ax-btn__icon" size={14} aria-hidden="true" />
                <span className="ax-btn__label">Valider</span>
              </button>
            )}
            {u.status !== "blocked" && (
              <button
                type="button"
                className="ax-btn ax-btn--soft-danger ax-btn--sm"
                disabled={isPending}
                onClick={() => handleAction(u, "block")}
              >
                <UserX className="ax-btn__icon" size={14} aria-hidden="true" />
                <span className="ax-btn__label">Bloquer</span>
              </button>
            )}
          </div>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isPending],
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="ax-segment ax-scroll-x max-w-full" role="group" aria-label="Filtrer par statut">
        {TABS.map((t) => (
          <button
            key={t.value}
            type="button"
            className="ax-segment__option"
            aria-pressed={c.filter("status") === t.value}
            onClick={() => c.setFilter("status", t.value)}
          >
            {t.label}
            <span className="ax-badge ax-badge--count ax-badge--sm">
              {statusCounts[t.value] ?? 0}
            </span>
          </button>
        ))}
      </div>

      <FilterBar
        searchValue={c.search}
        onSearchChange={c.setSearch}
        searchPlaceholder="Nom, e-mail ou Daara…"
        resultCount={c.total}
        itemLabel="compte"
      />

      <div className="ax-card">
        <DataTable
          rows={c.rows}
          columns={columns}
          getRowKey={(u) => u.id}
          sort={c.sort}
          onSort={c.toggleSort}
          caption="Comptes à valider"
          rowTone={(u) => (u.status === "pending" ? "warning" : undefined)}
          empty={
            <div className="ax-card__body">
              <EmptyState
                icon={c.search ? Search : Users}
                tone={c.filter("status") === "pending" ? "success" : "neutral"}
                title={
                  c.filter("status") === "pending" && !c.search
                    ? "Aucune demande en attente"
                    : "Aucun compte ne correspond"
                }
                description={
                  c.filter("status") === "pending" && !c.search
                    ? "Toutes les inscriptions ont été traitées."
                    : "Changez d'onglet ou élargissez la recherche."
                }
                action={
                  c.filter("status") !== ALL ? (
                    <button
                      type="button"
                      className="ax-btn ax-btn--outline"
                      onClick={() => c.setFilter("status", ALL)}
                    >
                      <span className="ax-btn__label">Voir tous les comptes</span>
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
        itemLabel="comptes"
      />
    </div>
  );
}
