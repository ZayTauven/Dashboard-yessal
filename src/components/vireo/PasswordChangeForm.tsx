"use client";

/*
 * ═══════════════════════════════════════════════════════════════════════════
 * Formulaire de changement de mot de passe
 * ═══════════════════════════════════════════════════════════════════════════
 * Un seul formulaire pour les deux endroits où l'on change son mot de passe :
 * le bandeau d'alerte des comptes dont le mot de passe a été attribué par un
 * tiers, et l'onglet « Sécurité » du profil, ouvert à tous et à tout moment.
 *
 * Le bouton d'envoi est laissé à l'appelant via `formId` : dans une modale il
 * appartient au pied de fenêtre, dans une page il suit le formulaire. Rien
 * d'autre ne change entre les deux usages, et surtout pas les règles.
 */

import { useState, useTransition } from "react";
import { Eye, EyeOff } from "lucide-react";
import { changePasswordAction } from "@/app/actions/auth";

export interface PasswordChangeFormProps {
  /** Identifiant du <form>, pour qu'un bouton extérieur puisse le soumettre. */
  formId: string;
  /** Appelé après un changement réussi. */
  onSuccess?: () => void;
  /** Rend son propre bouton d'envoi. Faux dans une modale à pied de fenêtre. */
  withSubmit?: boolean;
  /** Renseigné par le parent pour désactiver son propre bouton. */
  onPendingChange?: (pending: boolean) => void;
  /** Précision sous le champ « mot de passe actuel ». */
  currentHint?: string;
}

export function PasswordChangeForm({
  formId,
  onSuccess,
  withSubmit = false,
  onPendingChange,
  currentHint,
}: PasswordChangeFormProps) {
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    const form = e.currentTarget;
    const data = new FormData(form);
    const current = String(data.get("current_password") ?? "");
    const next = String(data.get("new_password") ?? "");
    const confirm = String(data.get("confirm_password") ?? "");

    /* La confirmation se vérifie ici et non au serveur : c'est une faute de
       frappe, pas une règle métier, et l'aller-retour n'apprendrait rien. */
    if (next !== confirm) {
      setError("Les deux mots de passe ne correspondent pas.");
      return;
    }

    onPendingChange?.(true);
    startTransition(async () => {
      const res = await changePasswordAction(current, next);
      onPendingChange?.(false);

      if (res.error) {
        setError(res.error);
        return;
      }
      /* Le formulaire est vidé : laisser un mot de passe en clair dans un champ
         après coup n'a aucune raison d'être. */
      form.reset();
      onSuccess?.();
    });
  };

  return (
    <form id={formId} onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="ax-field">
        <label className="ax-field__label" htmlFor={`${formId}-current`}>
          Mot de passe actuel
          <span className="ax-field__required" aria-hidden="true"> *</span>
        </label>
        <input
          id={`${formId}-current`}
          name="current_password"
          type="password"
          autoComplete="current-password"
          className="ax-input"
          required
        />
        {currentHint && <p className="ax-field__hint">{currentHint}</p>}
      </div>

      <div className="ax-field">
        <label className="ax-field__label" htmlFor={`${formId}-new`}>
          Nouveau mot de passe
          <span className="ax-field__required" aria-hidden="true"> *</span>
        </label>
        <div className="ax-field__control">
          <input
            id={`${formId}-new`}
            name="new_password"
            type={show ? "text" : "password"}
            autoComplete="new-password"
            minLength={8}
            className="ax-input ax-input--with-trailing"
            required
          />
          <button
            type="button"
            className="ax-field__affix ax-field__affix--trailing ax-field__affix--button"
            aria-label={show ? "Masquer le mot de passe" : "Afficher le mot de passe"}
            onClick={() => setShow(!show)}
          >
            {show ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
          </button>
        </div>
        <p className="ax-field__hint">Huit caractères au minimum.</p>
      </div>

      <div className="ax-field">
        <label className="ax-field__label" htmlFor={`${formId}-confirm`}>
          Confirmer le nouveau mot de passe
          <span className="ax-field__required" aria-hidden="true"> *</span>
        </label>
        <input
          id={`${formId}-confirm`}
          name="confirm_password"
          type={show ? "text" : "password"}
          autoComplete="new-password"
          className="ax-input"
          required
        />
      </div>

      {error && (
        <p className="ax-field__message ax-field__message--error" role="alert">
          {error}
        </p>
      )}

      {withSubmit && (
        <div>
          <button
            type="submit"
            className="ax-btn ax-btn--primary"
            disabled={isPending}
          >
            <span className="ax-btn__label">
              {isPending ? "Enregistrement…" : "Modifier le mot de passe"}
            </span>
          </button>
        </div>
      )}
    </form>
  );
}
