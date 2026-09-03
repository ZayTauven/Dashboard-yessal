"use client";

/*
 * ═══════════════════════════════════════════════════════════════════════════
 * Tableau de bord — Administrateur
 * ═══════════════════════════════════════════════════════════════════════════
 * Reprise complète dans le langage Aurora. Les contrats de données restent
 * exactement ceux du backend (`stats.kpis`, `bar_chart`, `pie_chart`,
 * `area_chart`, `announcements`, `alerts`) : rien à changer côté Django.
 *
 * Ce qui change :
 *   · les cartes de KPI passent sur `.ax-kpi`, avec des tuiles d'icône qui
 *     alternent sur quatre teintes au lieu du même violet répété quatre fois ;
 *   · les annonces deviennent de vraies alertes `.ax-alert`, dont la couleur
 *     vient du niveau d'urgence renvoyé par l'API et non d'un `bg-red-500` ;
 *   · les graphiques passent de Recharts à ApexCharts piloté par les jetons,
 *     donc ils se repeignent quand on change l'accent ou le mode sombre ;
 *   · les montants restent en vert Yessal, les volumes suivent l'accent.
 */

import Link from "next/link";
import {
  ArrowUpRight,
  HandCoins,
  Landmark,
  Megaphone,
  Users,
  Wallet,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import CardList, { type CardListItem } from "@/components/CardList";
import { KpiDelta } from "@/components/vireo/KpiDelta";
import { KpiValue } from "@/components/vireo/Amount";
import { PageHead } from "@/components/vireo/PageHead";
import {
  AreaTrend,
  BarCompare,
  DonutBreakdown,
  type Point,
} from "@/components/charts/YessalCharts";

const ICON_MAP: Record<string, LucideIcon> = {
  Wallet,
  HandCoins,
  Landmark,
  Users,
};

/* ── Formes renvoyées par l'API analytics ──────────────────────────────── */

interface Kpi {
  title: string;
  value: string | number;
  icon?: string;
  change?: string;
  href?: string;
}

interface Announcement {
  id: number | string;
  title: string;
  urgency?: "critical" | "warning" | "info" | string;
}

interface BarRow {
  month: string;
  online?: number;
  manual?: number;
}

interface PieRow {
  method: string;
  dons: number;
  /** Somme collectée par ce moyen de paiement. Absent des API antérieures. */
  amount?: number;
}

interface AreaRow {
  name: string;
  total: number;
}

interface AdminStats {
  kpis?: Kpi[];
  announcements?: Announcement[];
  alerts?: CardListItem[];
  bar_chart?: BarRow[];
  donations_by_month?: BarRow[];
  pie_chart?: PieRow[];
  donations_by_method?: PieRow[];
  area_chart?: AreaRow[];
  members_evolution?: AreaRow[];
}

/* Le niveau d'urgence de l'API pilote directement le modificateur d'alerte. */
const URGENCY_CLASS: Record<string, string> = {
  critical: "ax-alert--danger",
  warning: "ax-alert--warning",
  info: "ax-alert--info",
};

export default function AdminDashboard({ stats }: { stats: AdminStats | null }) {
  const kpis = stats?.kpis ?? [];
  const announcements = stats?.announcements ?? [];
  const alerts = stats?.alerts ?? [];

  const barRows = stats?.bar_chart ?? stats?.donations_by_month ?? [];
  const pieRows = stats?.pie_chart ?? stats?.donations_by_method ?? [];
  /*
   * `members_evolution` EN PREMIER, et c'est tout le correctif.
   *
   * Le repli était inversé : `area_chart` est prioritaire dans la charge, et
   * porte les DONS des sept derniers jours. La carte « Évolution des membres /
   * Inscriptions cumulées » traçait donc l'argent collecté jour par jour — une
   * courbe en dents de scie, qui montait puis redescendait à zéro. Un cumul
   * d'inscriptions ne peut pas décroître : c'était le signe.
   *
   * Les deux séries existent bel et bien et sont justes ; c'est le choix entre
   * elles qui était faux. `area_chart` reste le repli pour les rôles autres
   * qu'admin, à qui le backend ne calcule pas d'évolution de membres.
   */
  const areaRows = stats?.members_evolution ?? stats?.area_chart ?? [];

  /* Le backend sépare en ligne / manuel ; on somme pour la courbe mensuelle,
     la ventilation par méthode étant déjà l'objet de l'anneau ci-dessous. */
  const collecteParMois: Point[] = barRows.map((r) => ({
    label: r.month,
    value: Number(r.online ?? 0) + Number(r.manual ?? 0),
  }));

  /*
   * On ventile l'ARGENT, pas le nombre de transactions. L'anneau affichait
   * `dons` — un compte — sous le libellé « Collecté », d'où un centre où l'on
   * lisait « Collecté 43 » pour 1 113 000 FCFA réellement collectés.
   *
   * `amount` vient d'être ajouté côté backend ; `dons` sert de repli pour une
   * API pas encore à jour, auquel cas le libellé change avec la donnée.
   */
  const hasAmounts = pieRows.some((r) => r.amount !== undefined);

  const parMethode: Point[] = pieRows.map((r) => ({
    label: r.method,
    value: Number((hasAmounts ? r.amount : r.dons) ?? 0),
  }));

  const membres: Point[] = areaRows.map((r) => ({
    label: r.name,
    value: Number(r.total ?? 0),
  }));

  return (
    <div className="flex flex-col gap-6">
      <PageHead
        role="admin"
        title="Pilotage général"
        subtitle="Collecte, adhésions et santé du réseau, tous Daaras confondus."
        crumbs={[{ label: "Application" }]}
        actions={
          <>
            <Link href="/dashboard/admin/campaign-metrics" className="ax-btn ax-btn--outline">
              <span className="ax-btn__label">Performance des Ndiguels</span>
            </Link>
            <Link href="/dashboard/admin/pilotage" className="ax-btn ax-btn--primary">
              <span className="ax-btn__label">Pilotage du système</span>
            </Link>
          </>
        }
      />

      {/* ── Annonces épinglées ── */}
      {announcements.length > 0 && (
        <div className="flex flex-col gap-2">
          {announcements.slice(0, 2).map((ann) => (
            <div
              key={ann.id}
              className={`ax-alert ax-alert--accent-edge ${
                URGENCY_CLASS[ann.urgency ?? "info"] ?? "ax-alert--info"
              }`}
              role="status"
            >
              <span className="ax-alert__icon" aria-hidden="true">
                <Megaphone size={18} />
              </span>
              <div className="ax-alert__content">
                <p className="ax-alert__message">{ann.title}</p>
              </div>
              <div className="ax-alert__actions">
                <Link
                  href="/dashboard/admin/announcements"
                  className="ax-btn ax-btn--link ax-btn--sm"
                >
                  Gérer
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Bandeau de KPI ── */}
      {kpis.length > 0 && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {kpis.map((kpi, idx) => {
            const Icon = ICON_MAP[kpi.icon ?? ""] ?? Users;
            return (
              <Link
                key={idx}
                href={kpi.href || "/dashboard"}
                className="ax-card ax-card--stat ax-card--interactive group"
              >
                {/* relative : ancre la flèche de survol en haut à droite. */}
                <div className="ax-card__body relative">
                  <div className="ax-kpi">
                    <div className="ax-kpi__top">
                      <span
                        className={`ax-kpi__icon ax-kpi__icon--c${(idx % 4) + 1}`}
                        aria-hidden="true"
                      >
                        <Icon />
                      </span>
                      {/* La flèche suit le signe, et disparaît quand `change`
                          n'est pas une variation. Voir KpiDelta.tsx. */}
                      <KpiDelta change={kpi.change} />
                    </div>
                    <div>
                      <p className="ax-kpi__label">{kpi.title}</p>
                      <p className="ax-kpi__value font-mono tabular">
                        <KpiValue value={kpi.value} />
                      </p>
                    </div>
                  </div>
                  <ArrowUpRight
                    className="pointer-events-none absolute end-4 top-4 h-4 w-4 opacity-0
                               transition-opacity group-hover:opacity-40"
                    aria-hidden="true"
                  />
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* ── Graphiques ── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <section className="ax-card lg:col-span-2" aria-label="Collecte mensuelle">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <h2 className="ax-card__title">Jëfs collectés par mois</h2>
              <p className="ax-card__subtitle">
                Tous Daaras confondus, en ligne et collecte physique
              </p>
            </div>
          </div>
          <div className="ax-card__body pt-0">
            <BarCompare
              data={collecteParMois}
              name="Collecté"
              horizontal={false}
              height={300}
              emptyMessage="Aucune collecte enregistrée sur la période."
            />
          </div>
        </section>

        <section className="ax-card" aria-label="Répartition par méthode de paiement">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <h2 className="ax-card__title">Par méthode</h2>
              <p className="ax-card__subtitle">Orange Money, Wave, virement…</p>
            </div>
          </div>
          <div className="ax-card__body pt-0">
            <DonutBreakdown
              data={parMethode}
              totalLabel={hasAmounts ? "Collecté" : "Jëfs"}
              currency={hasAmounts}
              height={300}
              emptyMessage="Aucun paiement à ventiler pour l'instant."
            />
          </div>
        </section>

        <section className="ax-card lg:col-span-2" aria-label="Évolution des membres">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <h2 className="ax-card__title">Évolution des membres</h2>
              <p className="ax-card__subtitle">Inscriptions cumulées</p>
            </div>
          </div>
          <div className="ax-card__body pt-0">
            <AreaTrend
              data={membres}
              name="Membres"
              tone="accent"
              currency={false}
              height={280}
              emptyMessage="Pas encore assez d'inscriptions pour tracer une courbe."
            />
          </div>
        </section>

        <section className="ax-card" aria-label="Alertes critiques">
          <div className="ax-card__body">
            <CardList title="Alertes critiques" items={alerts} />
          </div>
        </section>
      </div>
    </div>
  );
}
