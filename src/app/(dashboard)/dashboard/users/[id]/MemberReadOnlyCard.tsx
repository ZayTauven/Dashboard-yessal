/*
 * ═══════════════════════════════════════════════════════════════════════════
 * Fiche membre en lecture seule — pour tous les rôles sauf l'admin
 * ═══════════════════════════════════════════════════════════════════════════
 * Un talibé qui cliquait sur un nom dans « Mon Daara » tombait sur
 * « Utilisateur introuvable » : la fiche complète lit `/api/users/{id}/`,
 * réservé à l'admin. Cette carte-ci se contente de ce que l'annuaire expose
 * à un membre du même Daara : visage, titre, nom, rôle, et le téléphone pour
 * l'appeler.
 *
 * Rien d'autre, et c'est voulu : ni menu, ni bouton d'action, ni lien vers
 * les écrans d'administration. Statut du compte, pièces, Jëfs et tutelles
 * restent l'affaire de l'admin.
 *
 * Sans `"use client"` : aucun hook, aucun gestionnaire. Les icônes sont
 * importées ici, rien ne traverse la frontière serveur → client.
 */

import { Phone } from "lucide-react";
import { Avatar } from "@/components/vireo/Avatar";
import { CoverBand } from "@/components/vireo/CoverBand";
import { TitleBadge } from "@/components/vireo/TitleBadge";
import { roleLabelLong } from "@/lib/roles";
import type { DirectoryUserPayload } from "@/app/actions/users";

export function MemberReadOnlyCard({ member }: { member: DirectoryUserPayload }) {
  const name =
    [member.first_name, member.last_name].filter(Boolean).join(" ").trim() ||
    "Membre";
  const phone = member.phone?.trim();

  return (
    <section
      className="ax-card mx-auto w-full max-w-xl overflow-hidden"
      aria-label={`Fiche de ${name}`}
    >
      <CoverBand height={96} />

      <div className="ax-card__body -mt-12 flex flex-col items-center gap-3 text-center">
        <Avatar
          src={member.avatar || member.avatar_url}
          name={name}
          size="2xl"
          className="ax-avatar--ringed"
        />

        {/* Titre avant le nom ; un nom long passe à la ligne sous la pastille. */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          <TitleBadge title={member.title_name} />
          <h2 className="ax-card__title break-words text-xl">{name}</h2>
        </div>

        <p className="ax-text-muted text-sm">{roleLabelLong(member.role)}</p>

        {phone && (
          <a
            href={`tel:${phone}`}
            className="ax-link inline-flex items-center gap-1.5 font-mono tabular"
          >
            <Phone size={14} aria-hidden="true" />
            {phone}
          </a>
        )}
      </div>
    </section>
  );
}

export default MemberReadOnlyCard;
