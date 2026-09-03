/*
 * Pastille de date — l'élément signature de l'écran Events de Vireo.
 *
 * Un bloc jour / mois vaut mieux qu'une ligne « 12 novembre 2026 » perdue sous
 * un titre : sur une grille de fêtes, c'est la DATE qu'on balaie en premier,
 * pas le nom. Vireo la compose en styles en ligne (il n'existe pas de classe
 * `.ax-date-tile`) ; on garde ce choix mais on l'emballe une fois pour toutes,
 * en ne lisant que des jetons — la tuile suit donc l'accent du Customizer.
 *
 * `muted` retire le dégradé d'accent : une fête PASSÉE ne doit pas crier aussi
 * fort qu'une fête à venir.
 */

const MONTH_FMT = new Intl.DateTimeFormat("fr-SN", { month: "short" });

export interface DateTileProps {
  /** Date ISO. Une valeur absente ou invalide affiche un tiret. */
  date?: string | null;
  size?: "sm" | "lg";
  muted?: boolean;
  className?: string;
}

export function DateTile({
  date,
  size = "sm",
  muted = false,
  className,
}: DateTileProps) {
  const d = date ? new Date(date) : null;
  const valid = d !== null && !Number.isNaN(d.getTime());

  const px = size === "lg" ? 92 : 56;

  return (
    <div
      className={className}
      aria-hidden="true"
      style={{
        flex: "0 0 auto",
        display: "grid",
        placeItems: "center",
        width: px,
        height: px,
        borderRadius: "var(--ax-radius-lg)",
        background: muted ? "var(--ax-fill-hover)" : "var(--ax-gradient-accent)",
        color: muted ? "var(--ax-text-muted)" : "var(--ax-on-accent)",
        boxShadow: muted
          ? "none"
          : "0 12px 26px -12px rgba(var(--ax-accent-rgb), .7)",
      }}
    >
      <span
        className="ax-num"
        style={{
          fontFamily: "var(--ax-font-display)",
          fontSize: size === "lg" ? "var(--ax-text-2xl)" : "var(--ax-text-lg)",
          fontWeight: 700,
          lineHeight: 1,
        }}
      >
        {valid ? String(d.getDate()).padStart(2, "0") : "—"}
      </span>
      <span
        style={{
          fontSize: "var(--ax-text-xs)",
          textTransform: "uppercase",
          letterSpacing: ".08em",
          opacity: 0.9,
        }}
      >
        {valid ? MONTH_FMT.format(d).replace(".", "") : ""}
      </span>
    </div>
  );
}

export default DateTile;
