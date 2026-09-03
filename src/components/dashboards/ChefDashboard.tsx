"use client";

/*
 * ═══════════════════════════════════════════════════════════════════════════
 * Tableau de bord — Chef de Daara
 * ═══════════════════════════════════════════════════════════════════════════
 * Le chef de Daara n'a pas les mêmes questions que l'admin. Il ne pilote pas
 * la confrérie, il anime UNE communauté : qui collecte, combien, et qui
 * décroche. La page est donc construite autour de ses collecteurs plutôt
 * qu'autour d'un empilement de graphiques génériques.
 *
 * Deux changements de fond par rapport à la version précédente :
 *
 *   · Le classement des collecteurs devient exploitable. Avant, il affichait
 *     un nombre de dons brut et calculait un pourcentage bidon
 *     (`(i + 1) / collectors.length`) quand l'API n'en fournissait pas —
 *     autrement dit, une barre de progression qui ne mesurait que la position
 *     dans la liste. On affiche maintenant la part réelle de chacun dans la
 *     collecte du Daara, et rien du tout si la donnée manque.
 *
 *   · Les montants passent en vert Yessal et en chiffres tabulaires. Sur une
 *     page où l'on compare des sommes ligne à ligne, l'alignement des chiffres
 *     n'est pas un détail typographique, c'est ce qui rend la comparaison
 *     possible d'un coup d'œil.
 *
 * Les contrats de données restent ceux du backend.
 */

import Link from "next/link";
import {
  Building2,
  FileEdit,
  HandCoins,
  Landmark,
  Medal,
  UserPlus,
  Users,
  Wallet,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  AreaTrend,
  BarCompare,
  DonutBreakdown,
  formatFCFA,
  type Point,
} from "@/components/charts/YessalCharts";
import { PageHead } from "@/components/vireo/PageHead";
import { KpiDelta } from "@/components/vireo/KpiDelta";
import { KpiValue } from "@/components/vireo/Amount";
import { EmptyState } from "@/components/ui/empty-state";

const ICON_MAP: Record<string, LucideIcon> = {
  Wallet,
  HandCoins,
  Landmark,
  Users,
};

interface Kpi {
  title: string;
  value: string | number;
  icon?: string;
  change?: string;
}

interface Collector {
  id?: number;
  first_name?: string | null;
  last_name?: string | null;
  donations_count?: number;
  dons?: number;
  /** Montant collecté, en FCFA. */
  total_amount?: number;
  /** Part de la collecte du Daara, en pourcentage. Optionnel côté API. */
  percentage?: number;
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

interface ChefStats {
  kpis?: Kpi[];
  daara?: string;
  collectors?: Collector[];
  bar_chart?: BarRow[];
  donations_by_month?: BarRow[];
  pie_chart?: PieRow[];
  donations_by_method?: PieRow[];
  area_chart?: AreaRow[];
  chartData?: AreaRow[];
}

function collectorName(c: Collector, i: number): string {
  const n = [c.first_name, c.last_name].filter(Boolean).join(" ").trim();
  return n || `Collecteur ${i + 1}`;
}

export default function ChefDashboard({ stats }: { stats: ChefStats | null }) {
  const kpis = stats?.kpis ?? [];
  const daaraName = stats?.daara || "Mon Daara";
  const collectors = stats?.collectors ?? [];

  const barRows = stats?.bar_chart ?? stats?.donations_by_month ?? [];
  const pieRows = stats?.pie_chart ?? stats?.donations_by_method ?? [];
  const areaRows = stats?.area_chart ?? stats?.chartData ?? [];

  const collecteParMois: Point[] = barRows.map((r) => ({
    label: r.month,
    value: Number(r.online ?? 0) + Number(r.manual ?? 0),
  }));
  const parMethode: Point[] = pieRows.map((r) => ({
    label: r.method,
    value: Number(r.dons ?? 0),
  }));
  const septJours: Point[] = areaRows.map((r) => ({
    label: r.name,
    value: Number(r.total ?? 0),
  }));

  /* Classement par montant si l'API le donne, sinon par nombre de dons. */
  const classement = [...collectors].sort(
    (a, b) =>
      (b.total_amount ?? b.donations_count ?? b.dons ?? 0) -
      (a.total_amount ?? a.donations_count ?? a.dons ?? 0),
  );
  const totalDaara = classement.reduce((s, c) => s + Number(c.total_amount ?? 0), 0);

  return (
    <div className="flex flex-col gap-6">
      <PageHead
        role="chef_daara"
        title="Gestion du Daara"
        subtitle={`Collectes, membres et actions sociales de ${daaraName}.`}
        crumbs={[{ label: "Application" }]}
        actions={
          <>
            <Link href="/dashboard/members" className="ax-btn ax-btn--outline">
              <UserPlus className="ax-btn__icon" size={17} aria-hidden="true" />
              <span className="ax-btn__label">Gérer les membres</span>
            </Link>
            <Link href="/dashboard/collect" className="ax-btn ax-btn--primary">
              <FileEdit className="ax-btn__icon" size={17} aria-hidden="true" />
              <span className="ax-btn__label">Journal de bord</span>
            </Link>
          </>
        }
      >
        <p className="mt-3 inline-flex items-center gap-2 text-sm text-text-muted">
          <Building2 size={15} aria-hidden="true" />
          {daaraName}
        </p>
      </PageHead>

      {/* ── KPI ── */}
      {kpis.length > 0 && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {kpis.map((kpi, idx) => {
            const Icon = ICON_MAP[kpi.icon ?? ""] ?? Users;
            return (
              <article key={idx} className="ax-card ax-card--stat">
                <div className="ax-card__body">
                  <div className="ax-kpi">
                    <div className="ax-kpi__top">
                      <span
                        className={`ax-kpi__icon ax-kpi__icon--c${(idx % 4) + 1}`}
                        aria-hidden="true"
                      >
                        <Icon />
                      </span>
                      {/*
                        La variation ne s'affiche que si l'API en renvoie une.
                        L'ancienne version repliait sur « +0% », ce qui affirmait
                        une stabilité qu'on ne mesurait pas.
                      */}
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
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* ── Graphiques + classement ── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <section className="ax-card lg:col-span-2" aria-label="Collectes mensuelles">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <h2 className="ax-card__title">Collectes du Daara par mois</h2>
              <p className="ax-card__subtitle">En ligne et collecte physique cumulées</p>
            </div>
          </div>
          <div className="ax-card__body pt-0">
            <BarCompare
              data={collecteParMois}
              name="Collecté"
              horizontal={false}
              height={300}
              emptyMessage="Aucune collecte enregistrée pour ce Daara."
            />
          </div>
        </section>

        <section className="ax-card" aria-label="Répartition des dons">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <h2 className="ax-card__title">Répartition des dons</h2>
              <p className="ax-card__subtitle">Par moyen de paiement</p>
            </div>
          </div>
          <div className="ax-card__body pt-0">
            <DonutBreakdown
              data={parMethode}
              totalLabel="Collecté"
              height={300}
              emptyMessage="Aucun paiement à ventiler."
            />
          </div>
        </section>

        {/* ── Classement des collecteurs ── */}
        <section className="ax-card" aria-label="Performances des collecteurs">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <h2 className="ax-card__title">
                <Medal
                  size={16}
                  className="me-1.5 inline align-[-2px] text-or"
                  aria-hidden="true"
                />
                Collecteurs
              </h2>
              <p className="ax-card__subtitle">
                {totalDaara > 0
                  ? `${formatFCFA(totalDaara)} collectés au total`
                  : "Classés par volume collecté"}
              </p>
            </div>
          </div>

          <div className="ax-card__body pt-0">
            {classement.length === 0 ? (
              <EmptyState
                icon={Users}
                size="sm"
                title="Aucun collecteur assigné"
                description="Rattachez un collecteur à ce Daara pour suivre les collectes de terrain."
              />
            ) : (
              <ol className="flex flex-col gap-2.5">
                {classement.map((col, i) => {
                  const nb = col.donations_count ?? col.dons ?? 0;
                  const montant = Number(col.total_amount ?? 0);
                  /* Part réelle dans la collecte, ou rien. Jamais de valeur
                     inventée à partir du rang. */
                  const part =
                    col.percentage ??
                    (totalDaara > 0 && montant > 0
                      ? (montant / totalDaara) * 100
                      : null);

                  return (
                    <li
                      key={col.id ?? i}
                      className="flex flex-col gap-1.5 rounded-md px-3 py-2.5"
                      style={{ background: "var(--ax-fill-hover)" }}
                    >
                      <div className="flex items-baseline justify-between gap-3">
                        <span className="flex items-center gap-2 truncate text-sm font-medium">
                          <span
                            className="font-mono text-xs text-text-subtle"
                            aria-hidden="true"
                          >
                            {String(i + 1).padStart(2, "0")}
                          </span>
                          {collectorName(col, i)}
                        </span>
                        <span className="shrink-0 text-right">
                          {montant > 0 ? (
                            <span className="font-mono text-sm font-semibold tabular text-montant">
                              {formatFCFA(montant)}
                            </span>
                          ) : (
                            <span className="font-mono text-sm tabular text-text-muted">
                              {nb} {nb > 1 ? "dons" : "don"}
                            </span>
                          )}
                        </span>
                      </div>

                      {part !== null && (
                        <div
                          className="h-1 overflow-hidden rounded-pill"
                          style={{ background: "var(--ax-fill-active)" }}
                          role="progressbar"
                          aria-valuenow={Math.round(part)}
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-label={`Part de ${collectorName(col, i)} dans la collecte`}
                        >
                          <div
                            className="h-full rounded-pill"
                            style={{
                              width: `${Math.min(100, part)}%`,
                              background: "var(--yessal-montant)",
                            }}
                          />
                        </div>
                      )}
                    </li>
                  );
                })}
              </ol>
            )}
          </div>
        </section>

        <section className="ax-card lg:col-span-2" aria-label="Dons des sept derniers jours">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <h2 className="ax-card__title">Dons des 7 derniers jours</h2>
              <p className="ax-card__subtitle">Montants journaliers en FCFA</p>
            </div>
          </div>
          <div className="ax-card__body pt-0">
            <AreaTrend
              data={septJours}
              name="Collecté"
              height={280}
              emptyMessage="Aucun don enregistré sur les sept derniers jours."
            />
          </div>
        </section>
      </div>
    </div>
  );
}
