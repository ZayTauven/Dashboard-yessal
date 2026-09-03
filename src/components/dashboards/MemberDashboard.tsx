"use client";

/*
 * ═══════════════════════════════════════════════════════════════════════════
 * Tableau de bord — Membre
 * ═══════════════════════════════════════════════════════════════════════════
 * Le membre ne pilote rien : il contribue. Sa page doit répondre à « qu'est-ce
 * que j'ai donné », « à quoi », et « qu'est-ce que la direction attend de
 * moi ». Le reste est du bruit.
 *
 * Corrections de fond par rapport à la version précédente :
 *
 *   · Les annonces étaient affichées DEUX FOIS — en bandeau d'alerte en haut,
 *     puis en liste complète en bas. On garde le bandeau pour les urgentes et
 *     la liste pour le reste, sans doublon.
 *
 *   · Le bouton « Voir les Jëfs » pointait vers /dashboard/campaigns,
 *     c'est-à-dire les Ndiguels. Dans le vocabulaire du produit, un Jëf est un
 *     don et un Ndiguel une campagne : le libellé mentait sur la destination.
 *
 *   · Le bandeau d'accueil était peint en violet en dur avec une ombre
 *     violette en dur. Il suit maintenant l'accent actif — sinon changer de
 *     couleur dans le panneau Apparence laissait un rectangle violet orphelin
 *     en haut de la page la plus vue du produit.
 */

import Link from "next/link";
import {
  AlertCircle,
  AlertTriangle,
  Bell,
  HandCoins,
  Heart,
  Info,
  Landmark,
  Users,
  Wallet,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { AreaTrend, formatFCFA, type Point } from "@/components/charts/YessalCharts";
import { KpiValue } from "@/components/vireo/Amount";
import { PageHead } from "@/components/vireo/PageHead";
import { EmptyState } from "@/components/ui/empty-state";

const ICON_MAP: Record<string, LucideIcon> = {
  Wallet,
  HandCoins,
  Landmark,
  Users,
};

const URGENCY: Record<string, { cls: string; icon: LucideIcon }> = {
  critical: { cls: "ax-alert--danger", icon: AlertCircle },
  warning: { cls: "ax-alert--warning", icon: AlertTriangle },
  info: { cls: "ax-alert--info", icon: Info },
};

interface Kpi {
  title: string;
  value: string | number;
  icon?: string;
}

interface Announcement {
  id: number | string;
  title: string;
  content?: string | null;
  urgency?: string | null;
  target?: string | null;
  created_at?: string | null;
}

interface CampaignDonation {
  id: number | string;
  name: string;
  total: number;
}

interface AreaRow {
  name: string;
  total: number;
}

interface MemberStats {
  kpis?: Kpi[];
  announcements?: Announcement[];
  campaign_donations?: CampaignDonation[];
  chartData?: AreaRow[];
}

const dateFmt = new Intl.DateTimeFormat("fr-SN", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

function formatDate(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : dateFmt.format(d);
}

export default function MemberDashboard({ stats }: { stats: MemberStats | null }) {
  const kpis = stats?.kpis ?? [];
  const announcements = stats?.announcements ?? [];
  const campaignDonations = stats?.campaign_donations ?? [];
  const chartRows = stats?.chartData ?? [];

  /* Seules les annonces urgentes montent en bandeau. Les autres restent dans
     la liste plus bas — pas de double affichage. */
  const urgentes = announcements.filter(
    (a) => a.urgency === "critical" || a.urgency === "warning",
  );
  const courantes = announcements.filter(
    (a) => a.urgency !== "critical" && a.urgency !== "warning",
  );

  const evolution: Point[] = chartRows.map((r) => ({
    label: r.name,
    value: Number(r.total ?? 0),
  }));

  const totalParCampagne = campaignDonations.reduce(
    (s, c) => s + Number(c.total ?? 0),
    0,
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHead
        role="member"
        title="Mon tableau de bord"
        subtitle="Vos contributions, vos Ndiguels et les annonces de la direction."
        crumbs={[{ label: "Application" }]}
      />

      {/* ── Annonces urgentes ── */}
      {urgentes.length > 0 && (
        <div className="flex flex-col gap-2">
          {urgentes.slice(0, 3).map((ann) => {
            const cfg = URGENCY[ann.urgency ?? "info"] ?? URGENCY.info;
            const Icon = cfg.icon;
            return (
              <div
                key={ann.id}
                className={`ax-alert ax-alert--accent-edge ${cfg.cls}`}
                role="status"
              >
                <span className="ax-alert__icon" aria-hidden="true">
                  <Icon size={18} />
                </span>
                <div className="ax-alert__content">
                  <p className="ax-alert__title">{ann.title}</p>
                  {ann.content && <p className="ax-alert__message">{ann.content}</p>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Bandeau d'accueil ── */}
      <section
        className="relative overflow-hidden rounded-xl p-8"
        style={{
          /* Dégradé bâti sur l'accent actif : il suit le panneau Apparence. */
          background:
            "linear-gradient(135deg, var(--ax-accent) 0%, color-mix(in oklab, var(--ax-accent) 55%, #1b1030) 100%)",
          color: "var(--ax-on-accent)",
          boxShadow: "0 18px 44px -22px rgba(var(--ax-accent-rgb), 0.55)",
        }}
      >
        <div className="relative z-10 max-w-xl">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Heureux de vous revoir
          </h2>
          <p className="mt-2 text-sm leading-relaxed opacity-90">
            Votre engagement fait vivre les Daaras. Voici l&apos;état de vos
            contributions et des membres dont vous avez la tutelle.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/dashboard/donations"
              className="ax-btn"
              style={{
                background: "var(--ax-surface-solid)",
                color: "var(--ax-accent)",
                fontWeight: 600,
              }}
            >
              Mes Jëfs
            </Link>
            <Link
              href="/dashboard/campaigns"
              className="ax-btn"
              style={{
                border: "1px solid rgba(255,255,255,0.3)",
                color: "var(--ax-on-accent)",
              }}
            >
              Voir les Ndiguels
            </Link>
          </div>
        </div>

        <Heart
          className="pointer-events-none absolute -bottom-10 -end-10 h-56 w-56 rotate-12 opacity-10"
          aria-hidden="true"
        />
      </section>

      {/* ── KPI + dons par Ndiguel ── */}
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

        {campaignDonations.length > 0 && (
          <article className="ax-card md:col-span-2 lg:col-span-1">
            <div className="ax-card__body">
              <div className="mb-3 flex items-baseline justify-between gap-2">
                <p className="ax-kpi__label">Mes dons par Ndiguel</p>
                <span className="font-mono text-xs tabular text-text-subtle">
                  {campaignDonations.length}
                </span>
              </div>

              <ul className="flex max-h-[104px] flex-col gap-1.5 overflow-y-auto pe-1">
                {campaignDonations.map((cd) => (
                  <li
                    key={cd.id}
                    className="flex items-baseline justify-between gap-3 text-sm"
                  >
                    <span className="truncate text-text-muted" title={cd.name}>
                      {cd.name}
                    </span>
                    <span className="shrink-0 font-mono text-xs font-semibold tabular text-montant">
                      {formatFCFA(Number(cd.total ?? 0))}
                    </span>
                  </li>
                ))}
              </ul>

              <p className="mt-3 border-t pt-2 text-end font-mono text-sm font-semibold tabular text-montant"
                 style={{ borderColor: "var(--ax-border)" }}>
                {formatFCFA(totalParCampagne)}
              </p>
            </div>
          </article>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* ── Évolution des dons ── */}
        <section className="ax-card" aria-label="Évolution de mes dons">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <h2 className="ax-card__title">Évolution de mes dons</h2>
              <p className="ax-card__subtitle">Cumul journalier, 7 derniers jours</p>
            </div>
          </div>
          <div className="ax-card__body pt-0">
            <AreaTrend
              data={evolution}
              name="Donné"
              height={280}
              emptyMessage="Vos dons apparaîtront ici dès votre première contribution."
            />
          </div>
        </section>

        {/* ── Annonces courantes ── */}
        <section className="ax-card" aria-label="Annonces de la direction">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <h2 className="ax-card__title">
                <Bell size={16} className="me-1.5 inline align-[-2px]" aria-hidden="true" />
                Annonces de la direction
              </h2>
            </div>
            <Link href="/dashboard/news" className="ax-btn ax-btn--link ax-btn--sm">
              Tout voir
            </Link>
          </div>

          <div className="ax-card__body pt-0">
            {courantes.length === 0 ? (
              <EmptyState
                icon={Bell}
                size="sm"
                tone="search"
                title="Aucune annonce récente"
                description="Les communications de la direction s'afficheront ici."
              />
            ) : (
              <ul className="divide-y" style={{ borderColor: "var(--ax-border)" }}>
                {courantes.slice(0, 5).map((ann) => (
                  <li key={ann.id} className="flex flex-col gap-1 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm font-medium text-text-strong">{ann.title}</p>
                      <span className="ax-badge ax-badge--sm ax-badge--soft ax-badge--neutral shrink-0">
                        {ann.target === "global" ? "National" : "Daara"}
                      </span>
                    </div>
                    {ann.content && (
                      <p className="line-clamp-2 text-sm text-text-muted">{ann.content}</p>
                    )}
                    {ann.created_at && (
                      <span className="text-xs text-text-subtle">
                        Publié le {formatDate(ann.created_at)}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
