/*
 * Bandeau de couverture — repris de l'écran `pages/Profile` de Vireo.
 *
 * Trois écrans se peignaient une bannière à la main, chacun avec son propre
 * dégradé codé en dur. « Mon Daara » utilisait
 * `linear-gradient(135deg, var(--primary) 0%, #2D7A4F 100%)` : un violet qui
 * suivait l'accent, fondu vers un vert écrit en dur qui ne le suivait pas. Dès
 * qu'on changeait d'accent dans le Customizer, le dégradé partait vers une
 * couleur sans rapport.
 *
 * Ici tout est dérivé de jetons : deux halos radiaux (accent + violet de la
 * palette de données) sur un fond de surface, plus une trame fine qui donne de
 * la matière sans image. Le bandeau suit donc l'accent, en clair comme en
 * sombre.
 *
 * Il est purement décoratif : `aria-hidden`, et le contenu se pose PAR-DESSUS
 * via `children`, jamais dedans.
 */

import { cn } from "@/lib/utils";

export interface CoverBandProps {
  height?: number;
  /** Contenu superposé — titre, avatar, actions. */
  children?: React.ReactNode;
  className?: string;
}

export function CoverBand({
  height = 168,
  children,
  className,
}: CoverBandProps) {
  return (
    <div className={cn("relative overflow-hidden", className)}>
      <div
        aria-hidden="true"
        style={{
          height,
          background: [
            "radial-gradient(120% 160% at 12% 0%, color-mix(in oklab, var(--ax-accent) 42%, transparent), transparent 60%)",
            "radial-gradient(90% 140% at 88% 10%, color-mix(in oklab, var(--ax-viz-violet) 34%, transparent), transparent 58%)",
            "linear-gradient(120deg, var(--ax-surface-subtle), var(--ax-surface-raised))",
          ].join(","),
        }}
      >
        {/* Trame — 34 px, à 40 % d'opacité : lisible de près, invisible de loin. */}
        <span
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(var(--ax-border) 1px, transparent 1px), linear-gradient(90deg, var(--ax-border) 1px, transparent 1px)",
            backgroundSize: "34px 34px",
            opacity: 0.4,
          }}
        />
      </div>

      {children}
    </div>
  );
}

export default CoverBand;
