"use client";

/*
 * ═══════════════════════════════════════════════════════════════════════════
 * Tableau de bord — Collecteur
 * ═══════════════════════════════════════════════════════════════════════════
 * Le collecteur travaille sur le terrain, souvent debout, souvent sur
 * téléphone. Sa page n'est pas un rapport : c'est un poste de travail. Deux
 * questions seulement, et dans cet ordre : « j'enregistre un don » puis « mes
 * dernières saisies sont-elles bien passées ? ».
 *
 * D'où trois partis pris :
 *
 *   · L'action d'enregistrement est la première chose de la page, en pleine
 *     largeur sur mobile — pas un bouton perdu à droite d'un titre.
 *
 *   · Le journal récent affiche le STATUT de validation en évidence. Un don
 *     saisi mais rejeté est le seul incident qui compte vraiment pour un
 *     collecteur, et l'ancienne version le noyait dans un badge minuscule.
 *
 *   · Le total du jour est mis en tête. C'est le chiffre qu'on lui demande le
 *     soir, et il ne se lisait nulle part.
 */

import Link from "next/link";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  HandCoins,
  History,
  Landmark,
  Plus,
  TrendingUp,
  Wallet,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { BarCompare, formatFCFA, type Point } from "@/components/charts/YessalCharts";
import { KpiDelta } from "@/components/vireo/KpiDelta";
import { KpiValue } from "@/components/vireo/Amount";
import { PageHead } from "@/components/vireo/PageHead";
import { EmptyState } from "@/components/ui/empty-state";

const ICON_MAP: Record<string, LucideIcon> = {
  Wallet,
  HandCoins,
  Landmark,
  TrendingUp,
};

/* Le statut pilote la classe de badge Aurora — plus de couleurs Tailwind
   brutes qui ne suivaient pas le mode sombre. */
const STATUS: Record<
  string,
  { label: string; cls: string; icon: LucideIcon }
> = {
  pending: { label: "En attente", cls: "ax-badge--warning", icon: Clock },
  validated: { label: "Validé", cls: "ax-badge--success", icon: CheckCircle2 },
  rejected: { label: "Rejeté", cls: "ax-badge--danger", icon: AlertCircle },
};

interface Kpi {
  title: string;
  value: string | number;
  icon?: string;
  change?: string;
}

interface Collecte {
  id?: number;
  donor_name?: string | null;
  campaign_name?: string | null;
  amount?: number | string | null;
  status?: string | null;
  created_at?: string | null;
}

interface BarRow {
  month: string;
  online?: number;
  manual?: number;
}

interface CollectorStats {
  kpis?: Kpi[];
  recent_collects?: Collecte[];
  recent_donations?: Collecte[];
  bar_chart?: BarRow[];
  weekly_chart?: BarRow[];
}

const dateFmt = new Intl.DateTimeFormat("fr-SN", {
  hour: "2-digit",
  minute: "2-digit",
  day: "numeric",
  month: "short",
});

function formatMoment(iso?: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : dateFmt.format(d);
}

export default function CollectorDashboard({ stats }: { stats: CollectorStats | null }) {
  const kpis = stats?.kpis ?? [];
  const recents = stats?.recent_collects ?? stats?.recent_donations ?? [];
  const barRows = stats?.bar_chart ?? stats?.weekly_chart ?? [];

  const semaine: Point[] = barRows.map((r) => ({
    label: r.month,
    value: Number(r.online ?? 0) + Number(r.manual ?? 0),
  }));

  /* Total des saisies affichées — le chiffre qu'on lui demande le soir.
     `amount` arrive en chaîne depuis DRF : Number() avant de sommer. */
  const totalRecent = recents.reduce((s, c) => s + Number(c.amount ?? 0), 0);
  const rejetes = recents.filter((c) => c.status === "rejected").length;

  return (
    <div className="flex flex-col gap-6">
      <PageHead
        role="collector"
        title="Collecte en service"
        subtitle="Enregistrez les dons physiques et suivez vos saisies de la journée."
        crumbs={[{ label: "Application" }]}
        actions={
          <Link
            href="/dashboard/collect"
            className="ax-btn ax-btn--primary ax-btn--lg"
          >
            <Plus className="ax-btn__icon" size={19} aria-hidden="true" />
            <span className="ax-btn__label">Nouvelle collecte</span>
          </Link>
        }
      />

      {/*
        Alerte de rejet — remonte en haut de page parce que c'est la seule
        chose qui demande une action corrective immédiate de la part du
        collecteur. Elle disparaît dès qu'il n'y a plus de rejet.
      */}
      {rejetes > 0 && (
        <div className="ax-alert ax-alert--danger ax-alert--accent-edge" role="alert">
          <span className="ax-alert__icon" aria-hidden="true">
            <AlertCircle size={18} />
          </span>
          <div className="ax-alert__content">
            <p className="ax-alert__title">
              {rejetes} {rejetes > 1 ? "saisies rejetées" : "saisie rejetée"}
            </p>
            <p className="ax-alert__message">
              Vérifiez le montant et le bénéficiaire, puis saisissez à nouveau.
            </p>
          </div>
        </div>
      )}

      {/* ── KPI ── */}
      {kpis.length > 0 && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {kpis.map((kpi, idx) => {
            const Icon = ICON_MAP[kpi.icon ?? ""] ?? TrendingUp;
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

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* ── Volume hebdomadaire ── */}
        <section className="ax-card" aria-label="Collectes de la semaine">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <h2 className="ax-card__title">Mes collectes de la semaine</h2>
              <p className="ax-card__subtitle">Montants collectés par jour</p>
            </div>
          </div>
          <div className="ax-card__body pt-0">
            <BarCompare
              data={semaine}
              name="Collecté"
              horizontal={false}
              height={300}
              emptyMessage="Aucune collecte enregistrée cette semaine."
            />
          </div>
        </section>

        {/* ── Journal récent ── */}
        <section className="ax-card" aria-label="Activité récente">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <h2 className="ax-card__title">
                <History
                  size={16}
                  className="me-1.5 inline align-[-2px]"
                  aria-hidden="true"
                />
                Activité récente
              </h2>
              <p className="ax-card__subtitle">
                {recents.length > 0
                  ? `${formatFCFA(totalRecent)} sur les ${recents.length} dernières saisies`
                  : "Vos dernières saisies apparaîtront ici"}
              </p>
            </div>
            <Link href="/dashboard/donations" className="ax-btn ax-btn--link ax-btn--sm">
              Tout voir
            </Link>
          </div>

          <div className="ax-card__body pt-0">
            {recents.length === 0 ? (
              <EmptyState
                icon={HandCoins}
                size="sm"
                title="Aucune collecte aujourd'hui"
                description="Enregistrez un don physique pour démarrer votre journée."
                action={
                  <Link href="/dashboard/collect" className="ax-btn ax-btn--primary ax-btn--sm">
                    <Plus className="ax-btn__icon" size={15} aria-hidden="true" />
                    <span className="ax-btn__label">Première collecte</span>
                  </Link>
                }
              />
            ) : (
              <ul
                className="divide-y"
                style={{ borderColor: "var(--ax-border)" }}
              >
                {recents.slice(0, 6).map((c, i) => {
                  const cfg = STATUS[c.status ?? "pending"] ?? STATUS.pending;
                  const StatusIcon = cfg.icon;
                  return (
                    <li
                      key={c.id ?? i}
                      className="flex items-center justify-between gap-4 py-3"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <span
                          className="grid size-10 shrink-0 place-items-center rounded-pill"
                          style={{
                            background: "var(--ax-fill-hover)",
                            color: "var(--ax-text-subtle)",
                          }}
                          aria-hidden="true"
                        >
                          <HandCoins size={16} />
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-text-strong">
                            {c.donor_name || `Don #${c.id ?? "—"}`}
                          </p>
                          <p className="truncate text-xs text-text-subtle">
                            {formatMoment(c.created_at)}
                            {c.campaign_name && ` · ${c.campaign_name}`}
                          </p>
                        </div>
                      </div>

                      <div className="shrink-0 text-end">
                        <p className="font-mono text-sm font-semibold tabular text-montant">
                          {formatFCFA(Number(c.amount ?? 0))}
                        </p>
                        <span
                          className={`ax-badge ax-badge--sm ax-badge--soft ax-badge--pill ${cfg.cls} mt-1`}
                        >
                          <StatusIcon size={11} aria-hidden="true" />
                          {cfg.label}
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
