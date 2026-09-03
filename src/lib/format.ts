/*
 * ═══════════════════════════════════════════════════════════════════════════
 * Formatage des nombres — module NEUTRE, sans directive
 * ═══════════════════════════════════════════════════════════════════════════
 * Ces trois fonctions vivaient dans `components/charts/YessalCharts.tsx`, un
 * module marqué `"use client"` parce qu'il contient aussi les graphiques.
 *
 * Conséquence : tout composant SERVEUR qui appelait `formatFCFA()` échouait à
 * l'exécution — « Attempted to call formatFCFA() from the server but
 * formatFCFA is on the client ». Trois pages de lecture pure étaient dans ce
 * cas (état d'un Ndiguel, état d'une fête, performance des Ndiguels), plus
 * <StatCard> lui-même.
 *
 * Ce sont des fonctions pures : rien ne les rattache au client. Elles vivent
 * donc ici, sans directive, utilisables des deux côtés de la frontière.
 * `YessalCharts` les réexporte pour ne casser aucun import existant.
 *
 * Locale `fr-SN` partout : séparateur de milliers par espace insécable et
 * virgule décimale, comme on l'écrit au Sénégal.
 */

const nf = new Intl.NumberFormat("fr-SN", { maximumFractionDigits: 0 });

const nfCompact = new Intl.NumberFormat("fr-SN", {
  notation: "compact",
  maximumFractionDigits: 1,
});

/** 1250000 → « 1 250 000 FCFA ». */
export function formatFCFA(value: number): string {
  return `${nf.format(Math.round(value))} FCFA`;
}

/** 1250000 → « 1,3 M » — pour les axes, où la place manque. */
export function formatCompact(value: number): string {
  return nfCompact.format(value);
}

/*
 * ── Montants à l'échelle du projet ──
 *
 * Yessal Gui n'est pas dimensionné pour les 20 000 FCFA d'un Daara de
 * démonstration : la collecte se compte déjà en millions, et l'ambition porte
 * sur des centaines de millions, puis des milliards. Écrit en entier, un
 * milliard occupe dix-huit caractères — « 1 113 000 000 FCFA » — là où une
 * tuile de KPI en tient une douzaine. Le chiffre passait à la ligne, ou
 * débordait de sa carte.
 *
 * Au-delà du seuil, on abrège donc : « 1,11 Md FCFA ». La locale fr-SN donne
 * les bonnes abréviations françaises — k, M, Md — sans qu'on ait à les écrire.
 *
 * Le seuil est à un MILLION, pas plus bas : « 187 000 FCFA » se lit
 * parfaitement et tient dans la place disponible, alors que « 187 k FCFA »
 * perd en précision sans rien gagner en lisibilité. On n'abrège que là où
 * l'écriture complète devient un problème.
 *
 * Deux décimales, et non une : sur un milliard, un chiffre après la virgule
 * masque cent millions. « 1,11 Md » reste une approximation, mais honnête.
 */
const COMPACT_THRESHOLD = 1_000_000;

const nfAmountCompact = new Intl.NumberFormat("fr-SN", {
  notation: "compact",
  compactDisplay: "short",
  maximumFractionDigits: 2,
});

/**
 * Rend les deux écritures d'un montant : celle qu'on affiche, et celle qu'on
 * met à disposition au survol. Le chiffre exact ne doit jamais disparaître —
 * c'est une somme d'argent, quelqu'un voudra la lire au franc près.
 */
export function formatFCFAParts(value: number): {
  display: string;
  exact: string;
  compacted: boolean;
} {
  const exact = formatFCFA(value);
  const compacted = Math.abs(value) >= COMPACT_THRESHOLD;

  return {
    display: compacted
      ? `${nfAmountCompact.format(value)} FCFA`
      : exact,
    exact,
    compacted,
  };
}

/** 1113000000 → « 1,11 Md FCFA » ; 187000 → « 187 000 FCFA ». */
export function formatFCFACompact(value: number): string {
  return formatFCFAParts(value).display;
}

/** 0.734 → « 73 % ». */
export function formatPercent(value: number): string {
  return `${nf.format(Math.round(value * 100))} %`;
}

/** 1250000 → « 1 250 000 », sans unité. */
export function formatNumber(value: number): string {
  return nf.format(Math.round(value));
}
