"use client";

/*
 * Liste des collecteurs du Daara, avec fiche de contact au clic.
 *
 * L'ancienne fiche s'ouvrait sur un en-tête violet plein (`bg-yessal-violet`)
 * portant un avatar en verre : elle ne suivait ni l'accent du Customizer ni le
 * thème sombre. Elle passe sur <Modal>, et l'avatar sur le contrat Aurora.
 *
 * L'usage réel commande la hiérarchie des actions : on ouvre cette fiche pour
 * APPELER quelqu'un. « Appeler » reste donc l'action principale, et le
 * téléphone est un lien `tel:` cliquable — il fallait auparavant le recopier à
 * la main s'il n'y avait pas de bouton.
 *
 * Les lignes étaient des `<li>` porteuses d'un `onClick` : rien au clavier.
 * Ce sont désormais de vrais boutons.
 */

import { useState } from "react";
import { ExternalLink, Mail, Phone } from "lucide-react";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/vireo/Avatar";
import { Modal } from "@/components/vireo/Modal";

type Collector = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  avatar?: string | null;
  avatar_url?: string | null;
};

const fullName = (c: Collector) =>
  `${c.first_name ?? ""} ${c.last_name ?? ""}`.trim();

export function CollectorList({
  collectors,
  role,
}: {
  collectors: Collector[];
  role?: string;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<Collector | null>(null);

  /* Un simple membre ne voit pas les e-mails de l'encadrement. */
  const isMember = role === "member";

  return (
    <>
      <ul className="ax-list ax-list--compact ax-list--selectable">
        {collectors.map((c) => (
          <li key={c.id}>
            <button
              type="button"
              className="ax-list__row w-full text-start"
              onClick={() => setSelected(c)}
            >
              <Avatar
                className="ax-list__leading"
                src={c.avatar || c.avatar_url}
                name={fullName(c)}
                size="sm"
              />
              <span className="ax-list__content">
                <span className="ax-list__title">{fullName(c)}</span>
                {!isMember && <span className="ax-list__meta">{c.email}</span>}
              </span>
              <ExternalLink
                className="ax-list__trailing"
                size={13}
                aria-hidden="true"
              />
            </button>
          </li>
        ))}
      </ul>

      <Modal
        open={Boolean(selected)}
        onOpenChange={(o) => !o && setSelected(null)}
        title={selected ? fullName(selected) : ""}
        description="Collecteur officiel"
        size="sm"
        footer={
          selected && (
            <>
              {role === "admin" && (
                <button
                  type="button"
                  className="ax-btn ax-btn--ghost"
                  onClick={() => {
                    const id = selected.id;
                    setSelected(null);
                    router.push(`/dashboard/users/${id}`);
                  }}
                >
                  <span className="ax-btn__label">Fiche complète</span>
                </button>
              )}
              {selected.phone && (
                <a
                  href={`tel:${selected.phone}`}
                  className="ax-btn ax-btn--primary"
                >
                  <Phone className="ax-btn__icon" size={15} aria-hidden="true" />
                  <span className="ax-btn__label">Appeler</span>
                </a>
              )}
            </>
          )
        }
      >
        {selected && (
          <div className="flex flex-col items-center gap-5">
            <Avatar
              src={selected.avatar || selected.avatar_url}
              name={fullName(selected)}
              size="2xl"
            />

            <ul className="ax-list ax-list--compact w-full">
              {!isMember && (
                <li className="ax-list__row">
                  <Mail className="ax-list__leading" size={16} aria-hidden="true" />
                  <span className="ax-list__content">
                    <span className="ax-list__title">{selected.email}</span>
                    <span className="ax-list__meta">E-mail</span>
                  </span>
                </li>
              )}
              <li className="ax-list__row">
                <Phone className="ax-list__leading" size={16} aria-hidden="true" />
                <span className="ax-list__content">
                  <span className="ax-list__title font-mono tabular">
                    {selected.phone || "Non renseigné"}
                  </span>
                  <span className="ax-list__meta">Téléphone</span>
                </span>
              </li>
            </ul>
          </div>
        )}
      </Modal>
    </>
  );
}
