/*
 * ═══════════════════════════════════════════════════════════════════════════
 * Variation d'un KPI
 * ═══════════════════════════════════════════════════════════════════════════
 * ⚠️ PAS de `"use client"` : les tableaux de bord de rôle sont des composants
 * serveur. Rien ici n'exige le navigateur.
 *
 * Les tuiles de KPI affichaient TOUJOURS une flèche montante verte, quel que
 * soit le contenu de `kpi.change`. On lisait donc « ↗ -73 % » en vert — une
 * chute d'argent collecté présentée comme une bonne nouvelle — et « ↗ -5 »
 * pour cinq contributions de moins.
 *
 * L'autre moitié du problème est que `change` n'est pas toujours une variation.
 * Le backend y met indifféremment :
 *
 *     '-73%'          une variation, négative
 *     '-5'            une variation, négative
 *     '2 en attente'  une précision : rien n'a augmenté ni baissé
 *     'En cours'      un état
 *
 * Une flèche sur « En cours » ne veut rien dire. On ne la dessine donc que
 * lorsque la chaîne est ENTIÈREMENT une valeur signée — sans quoi la pastille
 * reste neutre et se lit pour ce qu'elle est : une précision.
 *
 * `'2 en attente'` commence par un chiffre : d'où l'ancrage strict de
 * l'expression, qui refuse tout ce qui traîne du texte derrière le nombre.
 */

import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

/** Un nombre, éventuellement signé, éventuellement suivi de % — et rien d'autre. */
const SIGNED_VALUE = /^([+-]?)(\d+(?:[.,]\d+)?)\s*%?$/;

type Direction = "up" | "down" | "neutral";

function direction(raw: string): Direction {
  const m = SIGNED_VALUE.exec(raw.trim());
  if (!m) return "neutral";

  const value = Number(m[2].replace(",", "."));
  if (!Number.isFinite(value) || value === 0) return "neutral";

  return m[1] === "-" ? "down" : "up";
}

export function KpiDelta({
  change,
  className,
}: {
  change?: string | number | null;
  className?: string;
}) {
  if (change === null || change === undefined || change === "") return null;

  const raw = String(change);
  const dir = direction(raw);
  const Icon = dir === "up" ? ArrowUpRight : dir === "down" ? ArrowDownRight : null;

  return (
    <span
      className={cn(
        "ax-kpi__delta",
        dir === "up" && "ax-kpi__delta--up",
        dir === "down" && "ax-kpi__delta--down",
        className,
      )}
      /* Sans cela, un lecteur d'écran annonce « moins soixante-treize pour
         cent » sans dire de quoi il s'agit. */
      title={
        dir === "up"
          ? "En hausse sur la période précédente"
          : dir === "down"
            ? "En baisse sur la période précédente"
            : undefined
      }
    >
      {Icon && <Icon aria-hidden="true" />}
      {raw}
    </span>
  );
}
