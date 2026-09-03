"use client";

/*
 * ═══════════════════════════════════════════════════════════════════════════
 * Graphiques Yessal — couche ApexCharts pilotée par les jetons Aurora
 * ═══════════════════════════════════════════════════════════════════════════
 * Tout passe par <ApexChart>, qui relit la palette --ax-* et se repeint sur
 * l'événement `ax:change`. Conséquence : changer l'accent ou basculer en mode
 * sombre depuis le panneau Apparence retinte les courbes en direct, sans
 * remontage ni rechargement.
 *
 * Deux règles de couleur, tenues partout dans ce fichier :
 *   · les MONTANTS en FCFA sont peints avec --yessal-montant (le vert Yessal),
 *     jamais avec l'accent — une somme ne doit pas changer de couleur parce
 *     qu'on a changé le thème ;
 *   · les VOLUMES (donateurs, jefs, membres) suivent l'accent, eux.
 *
 * Les libellés sont en français et les nombres formatés en fr-SN : espace
 * insécable comme séparateur de milliers, pas de décimale sur les FCFA (le
 * franc CFA n'a pas de subdivision en usage courant).
 */

import { useMemo } from "react";
import type { ApexOptions } from "apexcharts";
import { ApexChart } from "./ApexChart";
import { cn } from "@/lib/utils";

/* ── Formatage ─────────────────────────────────────────────────────────── */

/*
 * Les formateurs vivent desormais dans `@/lib/format`, un module SANS
 * directive : ce fichier-ci est `"use client"`, et un composant serveur ne peut
 * pas appeler une fonction exportee par un module client. Ils sont reexportes
 * ici pour ne casser aucun import existant.
 */
export {
  formatCompact,
  formatFCFA,
  formatNumber,
  formatPercent,
} from "@/lib/format";

import {
  formatCompact,
  formatFCFA,
  formatNumber,
  formatPercent,
} from "@/lib/format";

/* Formateur local des libelles d'axes et d'infobulles. */
const nf = { format: (v: number) => formatNumber(Number(v)) };

/* ── Primitives de série ───────────────────────────────────────────────── */

export interface Point {
  label: string;
  value: number;
}

type Tone = "accent" | "montant" | "or" | "success" | "warning" | "danger" | "info";

const TONE_TOKEN: Record<Tone, string> = {
  accent: "--ax-accent",
  montant: "--yessal-montant",
  or: "--yessal-or",
  success: "--ax-success-500",
  warning: "--ax-warning-500",
  danger: "--ax-danger-500",
  info: "--ax-info-500",
};

/* ── Étiquette de délestage ────────────────────────────────────────────── */

/**
 * Rendu commun quand une série est vide. Un graphique vide qui affiche des
 * axes nus donne l'impression d'un bug ; une phrase explicite, non.
 */
function EmptyPlot({ height, message }: { height: number; message: string }) {
  return (
    <div
      className="ax-empty-plot grid place-items-center rounded-lg border border-dashed
                 border-border-default/70 bg-surface-subtle/40 px-4 text-center"
      style={{ minHeight: height }}
    >
      <p className="max-w-[36ch] text-sm text-text-subtle">{message}</p>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   Courbe d'évolution — dons dans le temps, membres inscrits, etc.
   ═══════════════════════════════════════════════════════════════════════ */

export interface AreaTrendProps {
  data: Point[];
  /** Nom de la série, affiché dans l'infobulle. */
  name?: string;
  height?: number;
  /** `montant` formate en FCFA et peint en vert Yessal. */
  tone?: Tone;
  /** Formatte les valeurs en FCFA plutôt qu'en nombre brut. */
  currency?: boolean;
  emptyMessage?: string;
  className?: string;
}

export function AreaTrend({
  data,
  name = "Total",
  height = 300,
  tone = "montant",
  currency = true,
  emptyMessage = "Aucun historique sur la période.",
  className,
}: AreaTrendProps) {
  const options = useMemo<ApexOptions>(
    () => ({
      chart: { toolbar: { show: false }, zoom: { enabled: false } },
      stroke: { curve: "smooth", width: 2.5 },
      fill: {
        type: "gradient",
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.32,
          opacityTo: 0.02,
          stops: [0, 90, 100],
        },
      },
      dataLabels: { enabled: false },
      markers: { size: 0, hover: { size: 5 } },
      xaxis: {
        categories: data.map((d) => d.label),
        axisBorder: { show: false },
        axisTicks: { show: false },
        tooltip: { enabled: false },
      },
      yaxis: {
        labels: {
          formatter: (v: number) => (currency ? formatCompact(v) : nf.format(v)),
        },
      },
      tooltip: {
        y: {
          formatter: (v: number) => (currency ? formatFCFA(v) : nf.format(v)),
        },
      },
      grid: { strokeDashArray: 4, padding: { left: 4, right: 8 } },
      legend: { show: false },
    }),
    [data, currency],
  );

  if (!data.length) return <EmptyPlot height={height} message={emptyMessage} />;

  return (
    <ApexChart
      type="area"
      height={height}
      color={TONE_TOKEN[tone]}
      series={[{ name, data: data.map((d) => d.value) }]}
      apex={options}
      className={className}
      ariaLabel={`Évolution : ${name}`}
    />
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   Barres comparatives — collecte par Daara, par collecteur, par campagne
   ═══════════════════════════════════════════════════════════════════════ */

export interface BarCompareProps {
  data: Point[];
  name?: string;
  height?: number;
  tone?: Tone;
  currency?: boolean;
  /** Barres couchées : indispensable dès que les libellés sont longs
   *  (« Daara Serigne Fallou de Thiès » ne tient pas sous un axe X). */
  horizontal?: boolean;
  emptyMessage?: string;
  className?: string;
}

export function BarCompare({
  data,
  name = "Montant",
  height = 320,
  tone = "montant",
  currency = true,
  horizontal = true,
  emptyMessage = "Aucune donnée à comparer pour l'instant.",
  className,
}: BarCompareProps) {
  const options = useMemo<ApexOptions>(
    () => ({
      chart: { toolbar: { show: false } },
      plotOptions: {
        bar: {
          horizontal,
          borderRadius: 6,
          borderRadiusApplication: "end",
          barHeight: "62%",
          columnWidth: "56%",
          distributed: false,
        },
      },
      dataLabels: { enabled: false },
      xaxis: {
        categories: data.map((d) => d.label),
        axisBorder: { show: false },
        axisTicks: { show: false },
        labels: horizontal
          ? { formatter: (v: string) => (currency ? formatCompact(Number(v)) : v) }
          : {},
      },
      yaxis: horizontal
        ? {}
        : {
            labels: {
              formatter: (v: number) => (currency ? formatCompact(v) : nf.format(v)),
            },
          },
      tooltip: {
        y: { formatter: (v: number) => (currency ? formatFCFA(v) : nf.format(v)) },
      },
      grid: { strokeDashArray: 4 },
      legend: { show: false },
    }),
    [data, horizontal, currency],
  );

  if (!data.length) return <EmptyPlot height={height} message={emptyMessage} />;

  return (
    <ApexChart
      type="bar"
      height={height}
      color={TONE_TOKEN[tone]}
      series={[{ name, data: data.map((d) => d.value) }]}
      apex={options}
      className={className}
      ariaLabel={`Comparaison : ${name}`}
    />
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   Anneau de répartition — méthodes de paiement, statuts, provenance
   ═══════════════════════════════════════════════════════════════════════ */

export interface DonutBreakdownProps {
  data: Point[];
  height?: number;
  currency?: boolean;
  /** Libellé du total affiché au centre de l'anneau. */
  totalLabel?: string;
  emptyMessage?: string;
  className?: string;
}

export function DonutBreakdown({
  data,
  height = 320,
  currency = true,
  totalLabel = "Total",
  emptyMessage = "Aucune répartition à afficher.",
  className,
}: DonutBreakdownProps) {
  const options = useMemo<ApexOptions>(
    () => ({
      labels: data.map((d) => d.label),
      plotOptions: {
        pie: {
          donut: {
            size: "72%",
            labels: {
              show: true,
              name: { fontSize: "13px", offsetY: -2 },
              value: {
                fontSize: "20px",
                fontWeight: 600,
                offsetY: 4,
                formatter: (v: string) =>
                  currency ? formatCompact(Number(v)) : nf.format(Number(v)),
              },
              total: {
                show: true,
                showAlways: true,
                label: totalLabel,
                formatter: (w: { globals: { seriesTotals: number[] } }) => {
                  const t = w.globals.seriesTotals.reduce((a, b) => a + b, 0);
                  return currency ? formatCompact(t) : nf.format(t);
                },
              },
            },
          },
        },
      },
      dataLabels: { enabled: false },
      stroke: { width: 0 },
      tooltip: {
        y: { formatter: (v: number) => (currency ? formatFCFA(v) : nf.format(v)) },
      },
      legend: {
        position: "bottom",
        horizontalAlign: "center",
        markers: { size: 6, shape: "circle" },
        itemMargin: { horizontal: 10, vertical: 4 },
      },
    }),
    [data, currency, totalLabel],
  );

  if (!data.length) return <EmptyPlot height={height} message={emptyMessage} />;

  return (
    <ApexChart
      type="donut"
      height={height}
      accent
      series={data.map((d) => d.value)}
      apex={options}
      className={className}
      ariaLabel={`Répartition — ${totalLabel}`}
    />
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   Jauge radiale — progression d'un Ndiguel vers son objectif
   ═══════════════════════════════════════════════════════════════════════ */

export interface RadialGoalProps {
  /** Montant déjà collecté. */
  collected: number;
  /** Objectif de la campagne. 0 ou absent ⇒ campagne sans objectif chiffré. */
  goal?: number | null;
  height?: number;
  className?: string;
}

export function RadialGoal({
  collected,
  goal,
  height = 260,
  className,
}: RadialGoalProps) {
  const hasGoal = typeof goal === "number" && goal > 0;
  const pct = hasGoal ? Math.min(100, (collected / goal) * 100) : 0;

  const options = useMemo<ApexOptions>(
    () => ({
      plotOptions: {
        radialBar: {
          hollow: { size: "66%" },
          track: { strokeWidth: "100%" },
          dataLabels: {
            name: { fontSize: "12px", offsetY: 22 },
            value: {
              fontSize: "26px",
              fontWeight: 700,
              offsetY: -14,
              formatter: (v: number) => `${Math.round(v)} %`,
            },
          },
        },
      },
      labels: ["de l'objectif"],
      stroke: { lineCap: "round" },
    }),
    [],
  );

  if (!hasGoal) {
    return (
      <div
        className={cn(
          "grid place-items-center rounded-lg border border-dashed border-border-default/70 px-4 text-center",
          className,
        )}
        style={{ minHeight: height }}
      >
        <div>
          <p className="font-mono text-2xl font-semibold text-montant">
            {formatFCFA(collected)}
          </p>
          <p className="mt-1 text-sm text-text-subtle">
            Ndiguel sans objectif chiffré
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <ApexChart
        type="radialBar"
        height={height}
        color="--yessal-montant"
        series={[pct]}
        apex={options}
        ariaLabel={`Progression : ${formatPercent(pct / 100)} de l'objectif`}
      />
      <p className="-mt-2 text-center text-sm text-text-muted">
        <span className="font-mono font-semibold text-montant">
          {formatFCFA(collected)}
        </span>{" "}
        sur {formatFCFA(goal)}
      </p>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   Sparkline — micro-courbe logée dans une carte de KPI
   ═══════════════════════════════════════════════════════════════════════ */

export interface SparklineProps {
  values: number[];
  tone?: Tone;
  height?: number;
  type?: "area" | "line" | "bar";
  className?: string;
}

export function Sparkline({
  values,
  tone = "accent",
  height = 56,
  type = "area",
  className,
}: SparklineProps) {
  const options = useMemo<ApexOptions>(
    () => ({
      stroke: { curve: "smooth", width: type === "bar" ? 0 : 2 },
      fill:
        type === "area"
          ? {
              type: "gradient",
              gradient: { opacityFrom: 0.38, opacityTo: 0, stops: [0, 100] },
            }
          : { opacity: 1 },
      plotOptions:
        type === "bar"
          ? { bar: { borderRadius: 2, columnWidth: "58%" } }
          : undefined,
      tooltip: { enabled: false },
    }),
    [type],
  );

  if (values.length < 2) return null;

  return (
    <ApexChart
      type={type}
      height={height}
      sparkline
      tooltip={false}
      color={TONE_TOKEN[tone]}
      series={[{ data: values }]}
      apex={options}
      className={className}
      ariaLabel="Tendance sur la période"
    />
  );
}
