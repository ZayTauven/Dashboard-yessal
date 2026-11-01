/*
 * La médaille et la couronne de laurier des trois premiers d'un classement —
 * le podium des donateurs du Suivi du Kourel (2026-11-01).
 *
 * Tout est dessiné en SVG : net à toutes les tailles, sans image à charger,
 * et identique en thème clair comme en thème sombre (les métaux ne suivent
 * pas le thème, ils restent or, argent, bronze).
 */
import { useId, type ReactNode } from "react";

export type Metal = "or" | "argent" | "bronze";

const TEINTES: Record<Metal, { clair: string; fonce: string; texte: string; nom: string }> = {
  or: { clair: "#FBE08A", fonce: "#C08A1E", texte: "#4A3207", nom: "Or" },
  argent: { clair: "#F1F3F6", fonce: "#9AA1AC", texte: "#2E3440", nom: "Argent" },
  bronze: { clair: "#F2B98A", fonce: "#9A5527", texte: "#3B1F0C", nom: "Bronze" },
};

/** Le métal d'un rang : or, argent, bronze pour les trois premiers. */
export function metalDuRang(rang: number): Metal | null {
  return rang === 1 ? "or" : rang === 2 ? "argent" : rang === 3 ? "bronze" : null;
}

/** Une pastille de médaille portant le rang. */
export function Medaille({ metal, rang }: { metal: Metal; rang: number }) {
  const id = useId();
  const t = TEINTES[metal];
  return (
    <svg
      width="26"
      height="26"
      viewBox="0 0 26 26"
      role="img"
      aria-label={`${t.nom}, rang ${rang}`}
      className="shrink-0 drop-shadow-sm"
    >
      <defs>
        <linearGradient id={`${id}-m`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={t.clair} />
          <stop offset="1" stopColor={t.fonce} />
        </linearGradient>
      </defs>
      <circle cx="13" cy="13" r="12" fill={`url(#${id}-m)`} />
      <circle cx="13" cy="13" r="9.2" fill="none" stroke={t.clair} strokeOpacity="0.85" strokeWidth="1" />
      <text
        x="13"
        y="13"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize="11"
        fontWeight="700"
        fill={t.texte}
        style={{ fontFamily: "var(--font-space-grotesk), system-ui, sans-serif" }}
      >
        {rang}
      </text>
    </svg>
  );
}

/* Une feuille de laurier, pointue aux deux bouts, de hauteur 2 (−1 à 1). */
const FEUILLE = "M0,-1 C0.5,-0.45 0.5,0.45 0,1 C-0.5,0.45 -0.5,-0.45 0,-1Z";

/** Un point du cercle de la couronne, angle en degrés (sens trigonométrique).
 *
 *  Arrondi au centième : Node (rendu serveur) et le navigateur ne donnent pas
 *  les mêmes dernières décimales de `Math.cos` — 18.8622318124971**93** contre
 *  …**86** —, et React signalait un écart d'hydratation sur chaque feuille. */
function point(deg: number, rayon: number): [number, number] {
  const rad = (deg * Math.PI) / 180;
  const arrondi = (v: number) => Math.round(v * 100) / 100;
  return [arrondi(50 + rayon * Math.cos(rad)), arrondi(50 - rayon * Math.sin(rad))];
}

/**
 * Deux branches de laurier qui encerclent `children` (une photo), ouvertes en
 * haut et nouées en bas. Chaque nœud de la tige porte une paire de feuilles,
 * l'une penchée vers l'extérieur, l'autre vers l'intérieur, de plus en plus
 * petites vers la pointe. Tout se calcule sur un cercle : la couronne reste
 * régulière à toutes les tailles.
 */
export function CouronneLaurier({
  metal,
  taille = 52,
  children,
}: {
  metal: Metal;
  taille?: number;
  children: ReactNode;
}) {
  const id = useId();
  const t = TEINTES[metal];
  const r = 40;
  const feuilles: { x: number; y: number; angle: number; longueur: number }[] = [];
  // Branche gauche, du bas (252°) vers le haut (138°) — la droite en miroir.
  for (let i = 0; i < 7; i++) {
    const deg = 252 - i * 19;
    const longueur = 8 * (1 - i * 0.06);
    for (const [decalage, penche] of [[1.9, 38], [-1.9, -38]]) {
      const [x, y] = point(deg, r + decalage);
      feuilles.push({ x, y, angle: -deg - 90 + penche, longueur });
    }
  }
  const [x0, y0] = point(258, r);
  const [x1, y1] = point(132, r);

  return (
    <span className="relative inline-flex shrink-0 items-center justify-center" style={{ width: taille, height: taille }}>
      <svg viewBox="0 0 100 100" className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true">
        <defs>
          <linearGradient id={`${id}-f`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={t.clair} />
            <stop offset="1" stopColor={t.fonce} />
          </linearGradient>
        </defs>
        {[1, -1].map((sens) => (
          <g key={sens} transform={sens === -1 ? "translate(100 0) scale(-1 1)" : undefined}>
            {/* La tige */}
            <path
              d={`M ${x0} ${y0} A ${r} ${r} 0 0 1 ${x1} ${y1}`}
              fill="none"
              stroke={t.fonce}
              strokeWidth="1.4"
              strokeLinecap="round"
            />
            {feuilles.map((f, i) => (
              <path
                key={i}
                d={FEUILLE}
                fill={`url(#${id}-f)`}
                stroke={t.fonce}
                strokeOpacity="0.5"
                strokeWidth={0.6 / f.longueur}
                transform={`translate(${f.x} ${f.y}) rotate(${f.angle}) scale(${f.longueur * 0.62} ${f.longueur})`}
              />
            ))}
          </g>
        ))}
        {/* Le nœud */}
        <circle cx="50" cy={50 + r + 2} r="2.6" fill={t.fonce} />
      </svg>
      <span className="relative">{children}</span>
    </span>
  );
}
