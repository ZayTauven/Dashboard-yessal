"use client";

/*
 * ═══════════════════════════════════════════════════════════════════════════
 * « Changez votre mot de passe »
 * ═══════════════════════════════════════════════════════════════════════════
 * Trois parcours attribuent à un membre un mot de passe qu'il n'a pas choisi :
 * la création manuelle par un administrateur, l'inscription rapide faite par un
 * collecteur sur le terrain, et l'import Excel — ce dernier posant la MÊME
 * chaîne sur toute une promotion de comptes.
 *
 * Dans les trois cas, au moins une autre personne connaît le mot de passe, et
 * dans le cas de l'import, tous les membres importés se connaissent
 * mutuellement le leur. Le backend lève donc `must_change_password`, que ce
 * bandeau traduit à l'écran jusqu'à ce que ce soit réglé.
 *
 * Il ne bloque pas l'usage de la plateforme : quelqu'un qui vient de verser de
 * l'argent à un collecteur doit pouvoir vérifier que son Jëf est enregistré,
 * sans qu'on lui impose d'abord un formulaire. Mais il ne se referme pas non
 * plus — il n'y a pas de « plus tard », le bandeau reste jusqu'au changement.
 *
 * Le formulaire lui-même est partagé avec l'onglet « Sécurité » du profil :
 * voir <PasswordChangeForm>.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { Modal } from "@/components/vireo/Modal";
import { PasswordChangeForm } from "@/components/vireo/PasswordChangeForm";

export function PasswordChangeBanner({
  mustChange,
}: {
  mustChange?: boolean | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);

  if (!mustChange) return null;

  return (
    <>
      <div className="ax-alert ax-alert--danger ax-alert--inline rounded-none border-x-0 border-t-0">
        <ShieldAlert className="ax-alert__icon" aria-hidden="true" />
        <div className="ax-alert__content min-w-0">
          <p className="ax-alert__title">Changez votre mot de passe</p>
          <p className="ax-alert__message">
            Votre mot de passe vous a été attribué : d&apos;autres personnes le
            connaissent. Remplacez-le avant d&apos;utiliser la plateforme.
          </p>
        </div>
        <button
          type="button"
          className="ax-btn ax-btn--sm ax-btn--primary shrink-0"
          onClick={() => setOpen(true)}
        >
          <KeyRound className="ax-btn__icon" size={14} aria-hidden="true" />
          <span className="ax-btn__label">Changer maintenant</span>
        </button>
      </div>

      <Modal
        open={open}
        onOpenChange={setOpen}
        title="Changer mon mot de passe"
        description="Choisissez-en un que vous êtes seul à connaître."
        status="warning"
        size="sm"
        footer={
          <button
            type="submit"
            form="change-password-banner"
            className="ax-btn ax-btn--primary"
            disabled={isPending}
          >
            <span className="ax-btn__label">
              {isPending ? "Enregistrement…" : "Enregistrer"}
            </span>
          </button>
        }
      >
        <PasswordChangeForm
          formId="change-password-banner"
          currentHint="Celui qu'on vous a communiqué."
          onPendingChange={setIsPending}
          onSuccess={() => {
            toast.success("Mot de passe modifié.");
            setOpen(false);
            /* Le bandeau lit `must_change_password` depuis le profil chargé
               côté serveur : il faut rafraîchir pour qu'il disparaisse. */
            router.refresh();
          }}
        />
      </Modal>
    </>
  );
}
