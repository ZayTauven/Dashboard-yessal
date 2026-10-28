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

import { useMemo, useState } from "react";
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
  /* Identifiants tels que `DonationSerializer` les rend. La liste lisait
     `campaign_id` et `donor_id`, que l'API n'envoie pas : les liens vers le
     Ndiguel et vers la fiche du talubé ne s'affichaient jamais. */
  campaign?: number;
  campaign_name?: string;
  beneficiary_name?: string | null;
  amount: string | number;
  payment_method: string;
  payment_status: string;
  donor?: number;
  donor_name?: string | null;
  collector?: number | null;
  collector_name?: string | null;
  donor_daara_name?: string | null;
  /* LDD du Daara du talubé. Champ récent côté API : absent d'une réponse
     plus ancienne, d'où l'optionnel et le repli « — ». */
  donor_ldd_name?: string | null;
};

/*
 * Qui a versé le Jëf : le talubé lui-même, ou une tutelle pour son compte.
 * Même libellé à l'écran et dans l'export — le client lit les deux côte à
 * côte et ne doit pas avoir à traduire de l'un à l'autre.
 *
 * ⚠ « Moi-même » n'est vrai que sur la liste PERSONNELLE de celui qui a donné.
 * Il s'affichait aussi sur le registre de l'administrateur et sur les Jëfs
 * qu'un collecteur encaisse pour d'autres : chaque ligne y semblait être un
 * don du lecteur. Ailleurs, c'est « En son nom » — le talubé est nommé dans sa
 * propre colonne.
 */
function contributorLabel(d: DonationRow, personal: boolean): string {
  if (d.beneficiary_name) return `Tutelle - ${d.beneficiary_name}`;
  return personal ? "Moi-même" : "En son nom";
}

/** Le collecteur ne voit pas « ses » Jëfs et ceux qu'il encaisse mélangés. */
type Scope = "mine" | "collected";

export function DonationListClient({
  initialDonations,
  variant = "personal",
  viewerId,
  segmented = false,
}: {
  initialDonations: DonationRow[];
  variant?: "personal" | "directory";
  viewerId?: number;
  /** Deux onglets « Mes Jëfs | Jëfs collectés » — pour le rôle collecteur. */
  segmented?: boolean;
}) {
  const [scope, setScope] = useState<Scope>("mine");

  /*
   * Le collecteur est un talubé AVANT d'être collecteur. Mêlés, ses propres
   * Jëfs et ceux qu'il encaisse pour d'autres donnaient un « Total — 14 Jëfs »
   * qui additionnait l'argent des autres au sien. Sa portée serveur contient
   * aussi les demandes de collecte ouvertes : elles vivent sur « Collecte
   * physique », pas ici.
   */
  const { mine, collected } = useMemo(() => {
    if (!segmented) return { mine: initialDonations, collected: [] };
    return {
      mine: initialDonations.filter((d) => d.donor === viewerId),
      collected: initialDonations.filter(
        (d) => d.collector === viewerId && d.donor !== viewerId,
      ),
    };
  }, [initialDonations, segmented, viewerId]);

  if (!segmented) {
    return <DonationTable rows={initialDonations} variant={variant} />;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="ax-tabs">
        <div className="ax-tabs__list" role="tablist">
          <button
            type="button"
            role="tab"
            className="ax-tabs__tab"
            aria-selected={scope === "mine"}
            onClick={() => setScope("mine")}
          >
            Mes Jëfs
            <span className="ax-tabs__badge ax-badge ax-badge--count ax-badge--sm">
              {mine.length}
            </span>
          </button>
          <button
            type="button"
            role="tab"
            className="ax-tabs__tab"
            aria-selected={scope === "collected"}
            onClick={() => setScope("collected")}
          >
            Jëfs collectés
            <span className="ax-tabs__badge ax-badge ax-badge--count ax-badge--sm">
              {collected.length}
            </span>
          </button>
        </div>
      </div>

      {/* La clé remonte le tableau : recherche, filtres et page repartent de
          zéro à chaque changement d'onglet. */}
      {scope === "mine" ? (
        <DonationTable key="mine" rows={mine} variant="personal" />
      ) : (
        <DonationTable key="collected" rows={collected} variant="collected" />
      )}
    </div>
  );
}

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

function DonationTable({
  rows: initialDonations,
  variant,
}: {
  rows: DonationRow[];
  /** `collected` : les Jëfs qu'un collecteur a encaissés pour d'autres. */
  variant: "personal" | "directory" | "collected";
}) {
  const showDirectory = variant === "directory";
  const personal = variant === "personal";
  /* Le talubé est nommé partout où la ligne n'est pas celle du lecteur. */
  const showDonor = variant !== "personal";
  /* Le collecteur n'apprend rien d'une colonne qui le nomme lui-même. */
  const showCollector = variant !== "collected";

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
        d.collector_name,
        ...(showDonor
          ? [d.donor_name, d.donor_daara_name, d.donor_ldd_name]
          : []),
      ],
    [showDonor],
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

  /*
   * Total de l'ensemble filtré — pas de la page affichée.
   *
   * 🔴 Il additionnait TOUS les statuts : un Jëf annulé ou encore en attente
   * gonflait le « Total » d'un membre (22 010 FCFA affichés, dont 7 005 jamais
   * versés). Sans filtre de statut, il ne compte que le CONFIRMÉ, et le dit.
   * Avec un filtre de statut, il totalise ce que l'utilisateur a demandé.
   */
  const statusFiltered = c.filter("status") !== ALL;
  const footer = useMemo(() => {
    const counted = statusFiltered
      ? c.matched
      : c.matched.filter((d) => d.payment_status === "confirmed");
    return {
      count: counted.length,
      amount: counted.reduce((sum, d) => sum + Number(d.amount ?? 0), 0),
    };
  }, [c.matched, statusFiltered]);

  const exportData = useMemo(
    () =>
      /*
       * L'ordre des clés EST l'ordre des colonnes du fichier (`ExportButton`
       * lit `Object.keys` de la première ligne). Ordre demandé par le client :
       * Date, Référence, Talubé, LDD, Daara, Ndiguel, Contributeur, Montant,
       * Méthode, Statut — les trois colonnes d'annuaire n'existant qu'en
       * variante `directory`.
       */
      c.matched.map((d) => {
        const row: Record<string, string | number> = {
          Date: formatDate(d.created_at),
          Référence: `REF-${d.id}`,
        };
        if (showDonor) {
          row.Talubé = d.donor_name || "—";
          row.LDD = d.donor_ldd_name || "—";
          row.Daara = d.donor_daara_name || "—";
        }
        row.Ndiguel = String(d.campaign_name ?? "");
        row.Contributeur = contributorLabel(d, personal);
        row.Montant = Number(d.amount);
        row.Méthode = paymentMethodLabel(d.payment_method);
        row.Statut = statusLabel("payment", d.payment_status);
        /* En dernier : l'ordre des colonnes précédentes est celui du client. */
        row.Collecteur = d.collector_name || "—";
        return row;
      }),
    [c.matched, showDonor, personal],
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

    if (showDonor) {
      cols.push({
        key: "donor",
        header: "Talubé",
        sortKey: "donor",
        /* La fiche membre est un écran d'annuaire : un collecteur n'y a pas
           accès, le nom reste du texte pour lui. */
        cell: (d) =>
          showDirectory && d.donor ? (
            <Link
              href={`/dashboard/users/${d.donor}`}
              className="ax-link font-medium"
            >
              {d.donor_name || "—"}
            </Link>
          ) : (
            <span className="font-medium">{d.donor_name || "—"}</span>
          ),
      });
    }

    if (showDirectory) {
      cols.push(
        {
          key: "ldd",
          header: "LDD",
          hideBelow: "lg",
          cell: (d) => (
            <span className="ax-text-muted">{d.donor_ldd_name || "—"}</span>
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
          d.campaign ? (
            <Link
              href={`/dashboard/campaigns/${d.campaign}`}
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
        header: "Contributeur",
        hideBelow: "lg",
        cell: (d) =>
          d.beneficiary_name ? (
            <span className="ax-badge ax-badge--info ax-badge--sm">
              {contributorLabel(d, personal)}
            </span>
          ) : (
            <span className="ax-text-subtle italic">{contributorLabel(d, personal)}</span>
          ),
      },
      /* Avant le montant : le pied de tableau aligne son total sur la 3e
         colonne en partant de la fin. Pour un membre, c'est la transparence
         promise — il voit qui a reçu son argent. */
      ...(showCollector
        ? [
            {
              key: "collector",
              header: "Collecteur",
              hideBelow: "lg" as const,
              cell: (d: DonationRow) => (
                <span className="ax-text-muted">{d.collector_name || "—"}</span>
              ),
            },
          ]
        : []),
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
  }, [showDirectory, showDonor, showCollector, personal]);

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
              { value: "collected", label: "Encaissé, à remettre" },
              { value: "failed", label: "Échoué" },
              { value: "cancelled", label: "Annulé" },
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
                  {statusFiltered
                    ? `Total (filtré) — ${footer.count} Jëfs`
                    : `Total confirmé — ${footer.count} Jëf${footer.count > 1 ? "s" : ""} sur ${c.total}`}
                </td>
                <td className="ax-table__td--num text-montant">
                  {formatFCFA(footer.amount)}
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
