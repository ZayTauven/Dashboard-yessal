"use client";

/*
 * ═══════════════════════════════════════════════════════════════════════════
 * Le rappel de profil incomplet
 * ═══════════════════════════════════════════════════════════════════════════
 * Il jugeait sur QUATRE critères quand la fiche du membre en affichait SEPT
 * sur la même donnée. Un membre sans photographie ni adresse ne voyait donc
 * aucun bandeau, puis lisait « 5 sur 7 » en ouvrant son profil — le rappel se
 * taisait précisément pour les deux champs qu'on lui demandait de réclamer.
 *
 * La règle vit maintenant dans `@/lib/profile-completion`, partagée avec la
 * fiche, et écrite à l'identique côté mobile.
 *
 * Trois autres corrections, reprises de ce que le mobile a arbitré :
 *
 *   · **Le bandeau NOMME ce qui manque.** Il annonçait « votre date de
 *     naissance, genre, numéro de carte d'identité et pays sont requis » —
 *     une liste FIGÉE, la même pour tout le monde, qui citait des champs déjà
 *     remplis et taisait ceux qui manquaient vraiment. Elle mentionnait même
 *     un « numéro de carte d'identité » qui ne fait pas partie des critères.
 *
 *   · **Il est violet, plus orange.** Un profil incomplet est une chose à
 *     faire, pas une panne. L'orange est réservé aux avertissements.
 *
 *   · **Il mène au premier manque**, pas à un index. À qui il ne manque qu'une
 *     pièce d'identité, le formulaire d'état civil ne sert à rien.
 */

import Link from "next/link";
import { ChevronRight, UserPen } from "lucide-react";
import {
  missingSummary,
  profileMissing,
  type CompletionProfile,
} from "@/lib/profile-completion";

interface ProfileBannerProps {
  profile: (CompletionProfile & { id?: number }) | null;
}

/** Le premier manque décide de la destination. */
function destination(id: string): string {
  if (id === "document") return "/dashboard/profile#documents";
  return "/dashboard/profile";
}

export default function ProfileCompletionBanner({ profile }: ProfileBannerProps) {
  if (!profile) return null;

  const missing = profileMissing(profile, profile.documents?.length ?? 0);
  if (missing.length === 0) return null;

  return (
    <div className="flex items-center justify-between gap-3 border-b border-[color:var(--ax-accent-200)] bg-[color:var(--ax-accent-50)] p-3 px-4 shadow-sm lg:px-6 dark:border-[color:var(--ax-accent-800)] dark:bg-[color:var(--ax-accent-wash)]">
      <div className="flex items-center gap-3">
        <div className="rounded-full bg-[color:var(--ax-accent-100)] p-2 text-[color:var(--ax-accent-700)] dark:bg-[color:var(--ax-accent-800)] dark:text-[color:var(--ax-accent-200)]">
          <UserPen size={16} />
        </div>
        <div>
          <p className="text-sm font-semibold text-[color:var(--ax-accent-800)] dark:text-[color:var(--ax-accent-200)]">
            Complétez votre profil
          </p>
          {/*
            Le décompte ET les noms : le premier situe l'effort restant, les
            seconds évitent d'ouvrir l'écran pour découvrir lesquels.
          */}
          <p className="hidden text-xs font-medium text-[color:var(--ax-accent-700)]/80 sm:block dark:text-[color:var(--ax-accent-300)]/80">
            Il manque {missingSummary(missing)}.
          </p>
        </div>
      </div>
      <Link
        href={destination(missing[0].id)}
        className="flex items-center gap-1 rounded-lg bg-[color:var(--ax-accent-100)] px-3 py-2 text-xs font-semibold tracking-widest text-[color:var(--ax-accent-700)] uppercase transition-colors hover:text-[color:var(--ax-accent-900)] dark:bg-[color:var(--ax-accent-800)] dark:text-[color:var(--ax-accent-200)]"
      >
        Compléter <ChevronRight size={14} />
      </Link>
    </div>
  );
}
