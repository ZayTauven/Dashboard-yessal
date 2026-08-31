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
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import CardList, { type CardListItem } from "@/components/CardList";
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
  const areaRows = stats?.area_chart ?? stats?.members_evolution ?? [];

  /* Le backend sépare en ligne / manuel ; on somme pour la courbe mensuelle,
     la ventilation par méthode étant déjà l'objet de l'anneau ci-dessous. */
  const collecteParMois: Point[] = barRows.map((r) => ({
    label: r.month,
    value: Number(r.online ?? 0) + Number(r.manual ?? 0),
  }));

  const parMethode: Point[] = pieRows.map((r) => ({
    label: r.method,
    value: Number(r.dons ?? 0),
  }));

  const membres: Point[] = areaRows.map((r) => ({
    label: r.name,
    value: Number(r.total ?? 0),
  }));

  return (
    <div className="flex flex-col gap-6">
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
                      {kpi.change && (
                        <span className="ax-kpi__delta ax-kpi__delta--up">
                          <TrendingUp aria-hidden="true" />
                          {kpi.change}
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="ax-kpi__label">{kpi.title}</p>
                      <p className="ax-kpi__value font-mono tabular">{kpi.value}</p>
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
              totalLabel="Collecté"
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
