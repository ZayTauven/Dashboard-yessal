"use client";

/*
 * ═══════════════════════════════════════════════════════════════════════════
 * Mes tutelles
 * ═══════════════════════════════════════════════════════════════════════════
 * Une liste de PROCHES, pas un jeu de données : trois à dix personnes qu'on
 * reconnaît au visage. Le patron retenu est donc `apps/Contacts` de Vireo — une
 * liste à avatars — et non le tableau, qui reste pour les écrans où l'on
 * compare des valeurs.
 *
 * Trois corrections de fond :
 *
 *   · Après l'ajout d'un proche, la modale se fermait sans `router.refresh()` :
 *     le nouveau nom n'apparaissait qu'après un rechargement manuel de la
 *     page. On croyait l'enregistrement perdu.
 *
 *   · La colonne « Statut » affichait `<Badge variant="active">Actif</Badge>`
 *     en dur, sur chaque ligne. Le modèle `accounts.Tutelle` n'a aucun champ
 *     de statut : ce badge ne décrivait rien. Il laisse la place au téléphone
 *     et à la date d'enregistrement, qui arrivent déjà du sérialiseur et
 *     n'étaient affichés nulle part.
 *
 *   · La modale était une `<div fixed inset-0>` sans piège de focus.
 */

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { HeartHandshake, Link2, Phone, Plus } from "lucide-react";
import { addTutelle } from "@/app/actions/tutelles";
import { EmptyState } from "@/components/ui/empty-state";
import { Avatar } from "@/components/vireo/Avatar";
import { Modal } from "@/components/vireo/Modal";

export interface Tutelle {
  id: number;
  first_name: string;
  last_name: string;
  relation: string;
  linked_user?: number | string | null;
  avatar_url?: string | null;
  phone?: string | null;
  created_at?: string | null;
}

const dateFmt = new Intl.DateTimeFormat("fr-SN", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

const fullName = (t: Tutelle) =>
  `${t.first_name ?? ""} ${t.last_name ?? ""}`.trim();

export function TutelleClient({
  initialTutelles,
}: {
  initialTutelles: Tutelle[];
}) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState("");

  /* Trié par ordre d'enregistrement décroissant : le proche qu'on vient
     d'ajouter se voit en tête, ce qui confirme l'enregistrement. */
  const tutelles = useMemo(
    () =>
      [...initialTutelles].sort((a, b) =>
        (b.created_at ?? "").localeCompare(a.created_at ?? ""),
      ),
    [initialTutelles],
  );

  const handleAdd = (formData: FormData) => {
    setErrorMsg("");
    startTransition(async () => {
      const res = await addTutelle(formData);
      if (res.error) {
        setErrorMsg(res.error);
        return;
      }
      setIsOpen(false);
      /* Sans ce rafraîchissement, la liste rendue côté serveur reste celle
         d'avant l'ajout. */
      router.refresh();
    });
  };

  return (
    <>
      <div className="ax-card">
        <div className="ax-card__header">
          <div className="ax-card__titles">
            <h2 className="ax-card__title">Proches sous tutelle</h2>
            <p className="ax-card__subtitle">
              Vous pouvez faire un Jëf en leur nom.
            </p>
          </div>
          <button
            type="button"
            className="ax-btn ax-btn--primary"
            onClick={() => {
              setErrorMsg("");
              setIsOpen(true);
            }}
          >
            <Plus className="ax-btn__icon" size={16} aria-hidden="true" />
            <span className="ax-btn__label">Ajouter un proche</span>
          </button>
        </div>

        {tutelles.length === 0 ? (
          <div className="ax-card__body">
            <EmptyState
              icon={HeartHandshake}
              title="Aucun proche enregistré"
              description="Ajoutez un membre de votre famille pour prendre en charge ses participations et ses dons."
              action={
                <button
                  type="button"
                  className="ax-btn ax-btn--primary"
                  onClick={() => setIsOpen(true)}
                >
                  <Plus className="ax-btn__icon" size={16} aria-hidden="true" />
                  <span className="ax-btn__label">Ajouter un proche</span>
                </button>
              }
            />
          </div>
        ) : (
          <ul className="ax-list ax-list--comfortable">
            {tutelles.map((t) => (
              <li key={t.id} className="ax-list__row">
                <Avatar
                  className="ax-list__leading"
                  src={t.avatar_url}
                  name={fullName(t)}
                  size="md"
                />

                <span className="ax-list__content">
                  <span className="ax-list__title">{fullName(t)}</span>
                  <span className="ax-list__meta ax-cluster gap-3">
                    <span className="capitalize">{t.relation}</span>
                    {t.phone && (
                      <span className="ax-cluster gap-1">
                        <Phone size={12} aria-hidden="true" />
                        <span className="font-mono tabular">{t.phone}</span>
                      </span>
                    )}
                  </span>
                </span>

                <span className="ax-list__trailing flex-col items-end gap-1">
                  {t.linked_user ? (
                    <span className="ax-badge ax-badge--info ax-badge--sm">
                      <Link2 className="ax-badge__icon" aria-hidden="true" />
                      Compte lié
                    </span>
                  ) : (
                    <span className="ax-badge ax-badge--neutral ax-badge--sm">
                      Sans compte
                    </span>
                  )}
                  {t.created_at && (
                    <span className="ax-text-subtle text-xs">
                      Depuis le {dateFmt.format(new Date(t.created_at))}
                    </span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Modal
        open={isOpen}
        onOpenChange={setIsOpen}
        title="Nouveau proche"
        description="Vous pourrez ensuite payer des Jëfs en son nom."
        size="sm"
      >
        <form action={handleAdd} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="ax-field">
              <label className="ax-field__label" htmlFor="firstName">
                Prénom
                <span className="ax-field__required" aria-hidden="true"> *</span>
              </label>
              <input
                id="firstName"
                name="firstName"
                className="ax-input"
                required
              />
            </div>
            <div className="ax-field">
              <label className="ax-field__label" htmlFor="lastName">
                Nom
                <span className="ax-field__required" aria-hidden="true"> *</span>
              </label>
              <input
                id="lastName"
                name="lastName"
                className="ax-input"
                required
              />
            </div>
          </div>

          <div className="ax-field">
            <label className="ax-field__label" htmlFor="relation">
              Lien de parenté
              <span className="ax-field__required" aria-hidden="true"> *</span>
            </label>
            <input
              id="relation"
              name="relation"
              className="ax-input"
              placeholder="Fils, Fille, Épouse…"
              required
            />
          </div>

          {errorMsg && (
            <p className="ax-field__message ax-field__message--error">
              {errorMsg}
            </p>
          )}

          <button
            type="submit"
            className="ax-btn ax-btn--primary ax-btn--block"
            disabled={isPending}
          >
            <span className="ax-btn__label">
              {isPending ? "Enregistrement…" : "Enregistrer"}
            </span>
          </button>
        </form>
      </Modal>
    </>
  );
}
