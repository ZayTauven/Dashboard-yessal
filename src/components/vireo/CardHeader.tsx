/*
 * ═══════════════════════════════════════════════════════════════════════════
 * En-tête de carte
 * ═══════════════════════════════════════════════════════════════════════════
 * Ce composant existe pour une raison précise : la composition « icône +
 * titres » que j'avais écrite à la main était FAUSSE, et elle l'était partout.
 *
 * `.ax-card__header` est déclaré `justify-content: space-between`. La règle
 * suppose deux groupes — le contenu à gauche, l'action à droite. En y plaçant
 * l'icône puis `.ax-card__titles` comme deux enfants directs, l'espace se
 * répartissait entre EUX : l'icône restait à gauche et le titre partait à
 * droite. C'est ce qu'on voyait sur « 1 · Identifier le membre » de la Collecte,
 * et sur vingt autres en-têtes.
 *
 * Vireo, lui, ne met jamais d'icône de tête dans `__header` : `.ax-card__titles`
 * y est toujours le premier enfant. Plutôt que de renoncer à l'icône — elle
 * porte la couleur de section et aide au repérage — on groupe icône et titres
 * dans un même conteneur. `space-between` sépare alors ce groupe de l'action
 * finale, ce qui est exactement son rôle.
 *
 * Le composant est sans état ni gestionnaire : PAS de `"use client"`, pour
 * qu'une page serveur puisse lui passer `icon={Users}` sans se heurter à
 * « Functions cannot be passed directly to Client Components ».
 */

import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/** Les quatre tuiles d'icône de Vireo : accent, cyan, violet, ambre. */
export type CardHeaderTone = "c1" | "c2" | "c3" | "c4";

export interface CardHeaderProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  /** Icône de section. Omise, l'en-tête se réduit aux titres. */
  icon?: LucideIcon;
  tone?: CardHeaderTone;
  /** Contenu aligné à droite : badge de compteur, bouton, menu. */
  trailing?: React.ReactNode;
  /** Surtitre affiché au-dessus du titre. */
  eyebrow?: React.ReactNode;
  /** Niveau du titre — `h2` par défaut, à ajuster selon la hiérarchie de page. */
  as?: "h2" | "h3" | "h4";
  className?: string;
}

export function CardHeader({
  title,
  subtitle,
  icon: Icon,
  tone = "c1",
  trailing,
  eyebrow,
  as: Heading = "h2",
  className,
}: CardHeaderProps) {
  return (
    <div className={cn("ax-card__header", className)}>
      {/*
        Icône et titres forment UN groupe. C'est la correction : sans ce
        conteneur, `space-between` les écarte l'un de l'autre.
      */}
      <div className="flex min-w-0 items-start gap-3">
        {Icon && (
          <span
            className={`ax-card__kpi-icon ax-card__kpi-icon--${tone} shrink-0`}
            aria-hidden="true"
          >
            <Icon />
          </span>
        )}

        <div className="ax-card__titles">
          {eyebrow && <span className="ax-card__eyebrow">{eyebrow}</span>}
          <Heading className="ax-card__title">{title}</Heading>
          {subtitle && <p className="ax-card__subtitle">{subtitle}</p>}
        </div>
      </div>

      {trailing}
    </div>
  );
}

export default CardHeader;
