"use client";

/*
 * Carte de KPI — la brique de tête de tous les tableaux de bord Yessal.
 *
 * Reprend le contrat `.ax-kpi` de Vireo (tuile d'icône teintée, valeur en
 * chiffres tabulaires, puce de variation) et y ajoute deux choses propres au
 * projet :
 *
 *   · le ton `montant`, qui peint la valeur en vert Yessal et la formate en
 *     FCFA — parce qu'une somme ne doit jamais changer de couleur quand on
 *     change l'accent du thème ;
 *   · une sparkline optionnelle, qui donne à la valeur son contexte. « 2,4 M
 *     FCFA » ne dit rien ; « 2,4 M FCFA, en hausse depuis trois semaines » dit
 *     tout, et tient dans la même carte.
 *
 * La puce de variation reste muette si `delta` n'est pas fourni : afficher
 * « +0 % » quand on n'a pas de point de comparaison est un mensonge poli.
 */

import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { Sparkline, formatFCFA } from "@/components/charts/YessalCharts";
import { cn } from "@/lib/utils";

const nf = new Intl.NumberFormat("fr-SN", { maximumFractionDigits: 0 });

type Tone = "accent" | "montant" | "or" | "info";

/* Les tuiles c1..c4 de Vireo : accent, cyan, violet, ambre. On mappe nos tons
   dessus pour que quatre cartes côte à côte ne se ressemblent pas toutes. */
const ICON_TONE: Record<Tone, string> = {
  accent: "ax-kpi__icon--c1",
  montant: "ax-kpi__icon--c2",
  or: "ax-kpi__icon--c4",
  info: "ax-kpi__icon--c3",
};

export interface StatCardProps {
  label: string;
  value: number;
  /** Formate la valeur en FCFA et la peint en vert Yessal. */
  currency?: boolean;
  icon?: LucideIcon;
  tone?: Tone;
  /** Variation en points de pourcentage sur la période précédente. */
  delta?: number | null;
  /** Texte de la période comparée, ex. « vs mois dernier ». */
  deltaLabel?: string;
  /** Série pour la sparkline — au moins deux points, sinon elle est masquée. */
  trend?: number[];
  /** Précision affichée sous la valeur, ex. « 12 Daaras actifs ». */
  hint?: string;
  className?: string;
}

export function StatCard({
  label,
  value,
  currency = false,
  icon: Icon,
  tone = "accent",
  delta = null,
  deltaLabel = "vs période précédente",
  trend,
  hint,
  className,
}: StatCardProps) {
  const hasDelta = typeof delta === "number" && Number.isFinite(delta);
  const direction = !hasDelta ? "flat" : delta > 0 ? "up" : delta < 0 ? "down" : "flat";

  const DeltaIcon =
    direction === "up" ? ArrowUpRight : direction === "down" ? ArrowDownRight : Minus;

  return (
    <article className={cn("ax-card ax-card--stat", className)}>
      <div className="ax-card__body">
        <div className="ax-kpi">
          <div className="ax-kpi__top">
            {Icon && (
              <span className={cn("ax-kpi__icon", ICON_TONE[tone])} aria-hidden="true">
                <Icon />
              </span>
            )}

            {hasDelta && (
              <span
                className={cn(
                  "ax-kpi__delta",
                  direction === "up" && "ax-kpi__delta--up",
                  direction === "down" && "ax-kpi__delta--down",
                )}
                title={deltaLabel}
              >
                <DeltaIcon aria-hidden="true" />
                {Math.abs(delta).toFixed(1).replace(".", ",")} %
              </span>
            )}
          </div>

          <div>
            <p className="ax-kpi__label">{label}</p>
            <p
              className={cn(
                "ax-kpi__value font-mono tabular",
                currency && "text-montant",
              )}
            >
              {currency ? formatFCFA(value) : nf.format(value)}
            </p>
            {hint && <p className="ax-kpi__meta">{hint}</p>}
          </div>

          {trend && trend.length > 1 && (
            <Sparkline
              values={trend}
              tone={currency ? "montant" : tone === "or" ? "or" : "accent"}
              height={48}
            />
          )}
        </div>
      </div>
    </article>
  );
}

export default StatCard;
