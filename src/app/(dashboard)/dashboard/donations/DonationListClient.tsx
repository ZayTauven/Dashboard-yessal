"use client";

/*
 * ═══════════════════════════════════════════════════════════════════════════
 * Liste des Jëfs
 * ═══════════════════════════════════════════════════════════════════════════
 * Premier écran de liste porté sur les contrats Aurora ; il sert de gabarit aux
 * dix autres. Le trio est toujours le même : barre de filtres → tableau →
 * pagination, la mécanique étant tenue par useCollection.
 *
 * Ce que la version précédente ne savait pas faire, et qui manquait vraiment :
 *
 *   · Trier. On ne pouvait pas classer par montant — c'est pourtant la première
 *     question qu'on pose à un historique de dons.
 *   · Totaliser. « Mes contributions » affichait vingt lignes sans jamais dire
 *     combien elles faisaient ensemble ; le pied de tableau le dit maintenant,
 *     et il suit les filtres.
 *   · Filtrer par moyen de paiement, ce qui est la façon normale de retrouver
 *     un virement en attente.
 *
 * Les montants passent en chiffres tabulaires alignés à droite. Une colonne de
 * FCFA en police proportionnelle ne se lit pas en diagonale : les unités ne
 * tombent pas les unes sous les autres.
 */

import { useMemo } from "react";
import Link from "next/link";
import { History, Plus, Search } from "lucide-react";
import { ExportButton } from "@/components/ExportButton";
import { EmptyState } from "@/components/ui/empty-state";
import { formatFCFA } from "@/components/charts/YessalCharts";
import { DataTable, type Column } from "@/components/vireo/DataTable";
import { FilterBar } from "@/components/vireo/FilterBar";
import { Pagination } from "@/components/vireo/Pagination";
import {
  PaymentMethodBadge,
  StatusBadge,
  paymentMethodLabel,
  statusLabel,
} from "@/components/vireo/StatusBadge";
import { ALL, useCollection } from "@/hooks/useCollection";

type DonationRow = {
  id: number;
  created_at: string;
  campaign_id?: number;
  campaign_name?: string;
  beneficiary_name?: string | null;
  amount: string | number;
  payment_method: string;
  payment_status: string;
  donor_id?: number;
  donor_name?: string | null;
  donor_daara_name?: string | null;
};

/* Colonnes triables — l'union est explicite pour que le typage attrape une
   `sortKey` mal orthographiée à la compilation plutôt qu'à l'exécution. */
type SortKey = "date" | "donor" | "campaign" | "amount" | "status";

const dateFmt = new Intl.DateTimeFormat("fr-SN", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

function formatDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : dateFmt.format(d);
}

export function DonationListClient({
  initialDonations,
  variant = "personal",
}: {
  initialDonations: DonationRow[];
  variant?: "personal" | "directory";
}) {
  const showDirectory = variant === "directory";

  /*
   * `searchable`, `filters` et `sorters` sont mémoïsés : useCollection les
   * dépend dans ses useMemo, et une fonction recréée à chaque rendu
   * relancerait le filtrage et le tri de toute la liste à chaque frappe.
   */
  const searchable = useMemo(
    () => (d: DonationRow) =>
      [
        d.campaign_name,
        d.beneficiary_name,
        `REF-${d.id}`,
        ...(showDirectory ? [d.donor_name, d.donor_daara_name] : []),
      ],
    [showDirectory],
  );

  const filters = useMemo(
    () => ({
      status: (d: DonationRow, v: string) => d.payment_status === v,
      method: (d: DonationRow, v: string) => d.payment_method === v,
    }),
    [],
  );

  const sorters = useMemo(
    () => ({
      date: (d: DonationRow) => d.created_at,
      donor: (d: DonationRow) => d.donor_name ?? "",
      campaign: (d: DonationRow) => d.campaign_name ?? "",
      amount: (d: DonationRow) => Number(d.amount ?? 0),
      status: (d: DonationRow) => d.payment_status,
    }),
    [],
  );

  const c = useCollection(initialDonations, {
    searchable,
    filters,
    sorters,
    initialSort: { key: "date", dir: "desc" },
    pageSize: 10,
  });

  /* Total de l'ensemble filtré — pas de la page affichée. C'est la somme que
     l'utilisateur cherche quand il filtre sur « confirmé ». */
  const totalMontant = useMemo(
    () => c.matched.reduce((sum, d) => sum + Number(d.amount ?? 0), 0),
    [c.matched],
  );

  const exportData = useMemo(
    () =>
      c.matched.map((d) => {
        const base: Record<string, string | number> = {
          Date: formatDate(d.created_at),
          Référence: `REF-${d.id}`,
          Ndiguel: String(d.campaign_name ?? ""),
          Bénéficiaire: d.beneficiary_name || "Moi-même",
          Montant: Number(d.amount),
          Méthode: paymentMethodLabel(d.payment_method),
          Statut: statusLabel("payment", d.payment_status),
        };
        if (showDirectory) {
          base.Contributeur = String(d.donor_name ?? "—");
          base.Daara = String(d.donor_daara_name ?? "—");
        }
        return base;
      }),
    [c.matched, showDirectory],
  );

  const columns = useMemo<Column<DonationRow, SortKey>[]>(() => {
    const cols: Column<DonationRow, SortKey>[] = [
      {
        key: "date",
        header: "Date & réf.",
        sortKey: "date",
        cell: (d) => (
          <>
            <div className="font-medium">{formatDate(d.created_at)}</div>
            <div className="ax-text-subtle text-xs font-mono">REF-{d.id}</div>
          </>
        ),
      },
    ];

    if (showDirectory) {
      cols.push(
        {
          key: "donor",
          header: "Contributeur",
          sortKey: "donor",
          cell: (d) =>
            d.donor_id ? (
              <Link
                href={`/dashboard/users/${d.donor_id}`}
                className="ax-link font-medium"
              >
                {d.donor_name || "—"}
              </Link>
            ) : (
              <span className="font-medium">{d.donor_name || "—"}</span>
            ),
        },
        {
          key: "daara",
          header: "Daara",
          hideBelow: "lg",
          cell: (d) => (
            <span className="ax-text-muted">{d.donor_daara_name || "—"}</span>
          ),
        },
      );
    }

    cols.push(
      {
        key: "campaign",
        header: "Ndiguel",
        sortKey: "campaign",
        hideBelow: "md",
        cell: (d) =>
          d.campaign_id ? (
            <Link
              href={`/dashboard/campaigns/${d.campaign_id}`}
              className="ax-link"
            >
              {d.campaign_name}
            </Link>
          ) : (
            (d.campaign_name ?? "—")
          ),
      },
      {
        key: "beneficiary",
        header: "Bénéficiaire",
        hideBelow: "lg",
        cell: (d) =>
          d.beneficiary_name ? (
            <span className="ax-badge ax-badge--info ax-badge--sm">
              {d.beneficiary_name}
            </span>
          ) : (
            <span className="ax-text-subtle italic">Moi-même</span>
          ),
      },
      {
        key: "amount",
        header: "Montant",
        sortKey: "amount",
        numeric: true,
        cell: (d) => (
          <span className="text-montant font-semibold">
            {formatFCFA(Number(d.amount ?? 0))}
          </span>
        ),
      },
      {
        key: "method",
        header: "Méthode",
        hideBelow: "md",
        cell: (d) => <PaymentMethodBadge value={d.payment_method} />,
      },
      {
        key: "status",
        header: "Statut",
        sortKey: "status",
        cell: (d) => <StatusBadge domain="payment" value={d.payment_status} />,
      },
    );

    return cols;
  }, [showDirectory]);

  return (
    <div className="flex flex-col gap-4">
      <FilterBar
        searchValue={c.search}
        onSearchChange={c.setSearch}
        searchPlaceholder={
          showDirectory
            ? "Ndiguel, contributeur, Daara, référence…"
            : "Ndiguel, bénéficiaire ou référence…"
        }
        resultCount={c.total}
        itemLabel="Jëf"
        filters={[
          {
            label: "Statut du paiement",
            value: c.filter("status"),
            onChange: (v) => c.setFilter("status", v),
            options: [
              { value: ALL, label: "Tous les statuts" },
              { value: "confirmed", label: "Confirmé" },
              { value: "pending", label: "En attente" },
              { value: "pending_wire", label: "Virement en attente" },
              { value: "failed", label: "Échoué" },
            ],
          },
          {
            label: "Moyen de paiement",
            value: c.filter("method"),
            onChange: (v) => c.setFilter("method", v),
            options: [
              { value: ALL, label: "Tous les moyens" },
              { value: "orange_money", label: "Orange Money" },
              { value: "wave", label: "Wave" },
              { value: "bictorys", label: "Carte bancaire" },
              { value: "virement", label: "Virement" },
              { value: "manual", label: "Espèces" },
            ],
          },
        ]}
        actions={
          <ExportButton data={exportData} filename="Yessal_Jefs_Export" />
        }
      />

      <div className="ax-card">
        <DataTable
          rows={c.rows}
          columns={columns}
          getRowKey={(d) => d.id}
          sort={c.sort}
          onSort={c.toggleSort}
          caption="Historique des Jëfs"
          rowTone={(d) => (d.payment_status === "failed" ? "danger" : undefined)}
          empty={
            <div className="ax-card__body">
              <EmptyState
                icon={c.isFiltered ? Search : History}
                tone={c.isFiltered ? "search" : "neutral"}
                title={
                  c.isFiltered
                    ? "Aucun Jëf ne correspond"
                    : "Aucun Jëf enregistré"
                }
                description={
                  c.isFiltered
                    ? "Élargissez la recherche ou remettez les filtres à zéro."
                    : "Les contributions apparaîtront ici dès le premier don."
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
                  ) : (
                    <Link
                      href="/dashboard/donations/new"
                      className="ax-btn ax-btn--primary"
                    >
                      <Plus className="ax-btn__icon" size={16} aria-hidden="true" />
                      <span className="ax-btn__label">Faire un Jëf</span>
                    </Link>
                  )
                }
              />
            </div>
          }
          footer={
            /*
              Le pied ne s'affiche qu'à partir de deux lignes : totaliser une
              ligne unique ne fait que la répéter.
            */
            c.total > 1 ? (
              <tr>
                <td colSpan={columns.length - 3}>
                  Total{c.isFiltered ? " (filtré)" : ""} — {c.total} Jëfs
                </td>
                <td className="ax-table__td--num text-montant">
                  {formatFCFA(totalMontant)}
                </td>
                <td colSpan={2} />
              </tr>
            ) : undefined
          }
        />
      </div>

      <Pagination
        page={c.page}
        totalPages={c.totalPages}
        onPageChange={c.setPage}
        totalItems={c.total}
        pageSize={c.pageSize}
        itemLabel="Jëfs"
      />
    </div>
  );
}
