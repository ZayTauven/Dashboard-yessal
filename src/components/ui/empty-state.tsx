import * as React from "react";
import { cn } from "@/lib/utils";

/*
 * État vide — version Aurora.
 *
 * L'ancienne version posait une icône grise à 50 % d'opacité sur du blanc.
 * Résultat : une liste vide ressemblait à une liste cassée. Celle-ci construit
 * un vrai objet visuel — disque de halo teinté à l'accent, anneaux
 * concentriques, icône nette — et surtout elle réserve une place à l'action de
 * sortie. Un écran vide sans bouton laisse l'utilisateur sans issue.
 *
 * L'API reste celle d'avant (icon / title / description / action / size), donc
 * les quatre pages qui l'utilisaient déjà en héritent sans être modifiées.
 *
 * `tone` permet de distinguer un vide NORMAL (rien à afficher, c'est la vie)
 * d'un vide de RECHERCHE (des filtres trop stricts) : ce n'est pas la même
 * chose à lire, et ce n'est pas la même action à proposer.
 */

interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ElementType;
  title: string;
  description?: string;
  action?: React.ReactNode;
  size?: "sm" | "md" | "lg";
  tone?: "neutral" | "search" | "success";
}

const TONE_COLOR: Record<string, string> = {
  neutral: "var(--ax-accent)",
  search: "var(--ax-info-500)",
  success: "var(--ax-success-500)",
};

function EmptyState({
  className,
  icon: Icon,
  title,
  description,
  action,
  size = "md",
  tone = "neutral",
  ...props
}: EmptyStateProps) {
  const iconSize = { sm: 20, md: 28, lg: 36 }[size];
  const discSize = { sm: 56, md: 84, lg: 108 }[size];
  const titleSize = { sm: "text-sm", md: "text-base", lg: "text-lg" }[size];
  const padding = { sm: "py-8", md: "py-14", lg: "py-20" }[size];
  const color = TONE_COLOR[tone];

  return (
    <div
      data-slot="empty-state"
      className={cn(
        "flex flex-col items-center justify-center gap-4 px-6 text-center",
        padding,
        className,
      )}
      {...props}
    >
      {Icon && (
        <div
          className="relative grid place-items-center"
          style={{ width: discSize, height: discSize }}
          aria-hidden="true"
        >
          {/* Halo diffus — la seule touche de couleur de tout le bloc. */}
          <span
            className="absolute inset-0 rounded-pill blur-xl"
            style={{ background: color, opacity: 0.16 }}
          />
          {/* Deux anneaux concentriques : donnent une cible à l'œil sans
              alourdir, et restent lisibles sur les deux thèmes. */}
          <span
            className="absolute inset-0 rounded-pill border"
            style={{ borderColor: "var(--ax-border)" }}
          />
          <span
            className="absolute rounded-pill border"
            style={{
              inset: discSize * 0.14,
              borderColor: "var(--ax-border-strong)",
            }}
          />
          <Icon size={iconSize} style={{ color }} strokeWidth={1.6} />
        </div>
      )}

      <div className="space-y-1.5">
        <p className={cn("font-semibold text-text-strong", titleSize)}>{title}</p>
        {description && (
          <p className="mx-auto max-w-[42ch] text-sm leading-relaxed text-text-muted">
            {description}
          </p>
        )}
      </div>

      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}

export { EmptyState };
