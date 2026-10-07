/*
 * ═══════════════════════════════════════════════════════════════════════════
 * Titre honorifique — pastille posée AVANT le nom
 * ═══════════════════════════════════════════════════════════════════════════
 * Le client tient à ce que le titre (Serigne, Sokhna…) précède le nom, comme
 * on le prononce. Il n'était jusqu'ici visible que sur la fiche membre, en
 * pastille APRÈS le nom, et réduit ailleurs à un texte « Talibé · X ».
 *
 * Volontairement SANS `"use client"` : le composant n'a ni hook ni
 * gestionnaire, et il est rendu aussi bien par des pages serveur (Mon Daara,
 * fiche en lecture seule) que par des composants client. L'icône est importée
 * ici même — elle ne traverse donc jamais la frontière serveur → client.
 *
 * Usage : le placer dans une ligne `flex flex-wrap items-center` avec le nom,
 * pour qu'un nom long passe à la ligne sous la pastille plutôt que de la
 * pousser hors du cadre.
 */

import { BadgeCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export interface TitleBadgeProps {
  /** Le titre honorifique ; rien n'est rendu s'il est vide. */
  title?: string | null;
  /** `sm` pour les rangées de tableau et les cartes compactes. */
  size?: "sm" | "md";
  className?: string;
}

export function TitleBadge({ title, size = "md", className }: TitleBadgeProps) {
  const label = title?.trim();
  if (!label) return null;

  return (
    <span
      className={cn(
        "ax-badge ax-badge--pill ax-badge--soft ax-badge--accent shrink-0",
        size === "sm" && "ax-badge--sm",
        className,
      )}
    >
      <BadgeCheck size={size === "sm" ? 12 : 13} aria-hidden="true" />
      {label}
    </span>
  );
}

export default TitleBadge;
