"use client";

/*
 * Avatar — contrat `.ax-avatar` de Vireo.
 *
 * Les écrans utilisaient l'avatar de shadcn, dont le repli initiales était
 * peint en dur (`bg-[var(--primary)] text-white`) : il changeait donc de
 * couleur avec l'accent du Customizer, et virait illisible sur les accents
 * clairs. Le contrat Aurora prend un fond neutre — les initiales restent
 * lisibles quel que soit l'accent, et l'avatar cesse de crier plus fort que le
 * nom qu'il accompagne.
 *
 * Le repli se déclenche aussi quand l'image ÉCHOUE, pas seulement quand elle
 * est absente : un média supprimé côté serveur laissait jusqu'ici un carré
 * cassé dans l'annuaire.
 */

import { useState } from "react";
import { User } from "lucide-react";
import { cn } from "@/lib/utils";

export interface AvatarProps {
  src?: string | null;
  /** Nom complet — sert aux initiales et au texte alternatif. */
  name?: string | null;
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
  /** Coins arrondis plutôt que cercle — pour les entités, pas les personnes. */
  squircle?: boolean;
  /** Pastille de présence. */
  status?: "online" | "away" | "busy" | "offline";
  className?: string;
}

const SIZE_CLASS = {
  xs: "ax-avatar--xs",
  sm: "ax-avatar--sm",
  md: "ax-avatar--md",
  lg: "ax-avatar--lg",
  xl: "ax-avatar--xl",
  "2xl": "ax-avatar--2xl",
} as const;

/** « Amadou Bamba Ndiaye » → « AN ». Deux lettres au plus : trois ne tiennent pas. */
function initialsOf(name?: string | null): string {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function Avatar({
  src,
  name,
  size = "md",
  squircle = false,
  status,
  className,
}: AvatarProps) {
  const [broken, setBroken] = useState(false);
  const initials = initialsOf(name);
  const showImage = Boolean(src) && !broken;

  return (
    <span
      className={cn(
        "ax-avatar",
        SIZE_CLASS[size],
        squircle && "ax-avatar--squircle",
        className,
      )}
      title={name ?? undefined}
    >
      {showImage ? (
        <img
          className="ax-avatar__img"
          src={src as string}
          alt={name ?? ""}
          onError={() => setBroken(true)}
        />
      ) : initials ? (
        <span className="ax-avatar__initials" aria-hidden="true">
          {initials}
        </span>
      ) : (
        <User className="ax-avatar__icon" aria-hidden="true" />
      )}

      {status && (
        <span
          className={cn("ax-avatar__status", `ax-avatar__status--${status}`)}
          aria-label={status}
        />
      )}
    </span>
  );
}

export default Avatar;
