"use client";

/*
 * ═══════════════════════════════════════════════════════════════════════════
 * Champ téléphone
 * ═══════════════════════════════════════════════════════════════════════════
 * On conserve `react-phone-input-2` — drapeaux, recherche, indicatifs complets,
 * utiles à une confrérie dont une partie des membres vit en diaspora — et on
 * répare tout ce qui l'entourait.
 *
 * Ce qui ne marchait pas :
 *
 *   · L'habillage. `PhoneNumberValidation.css` écrivait ses couleurs en
 *     `hsl(var(--muted))`, la convention shadcn. Le pont Aurora a fait de ces
 *     variables des couleurs complètes : `hsl(#F0F3F9 / 0.2)` est invalide, donc
 *     les 22 règles étaient mortes. Réécrit sur les jetons `--ax-*`.
 *
 *   · La validation. Le `required` portait sur l'`<input type="hidden">`, que
 *     les navigateurs EXCLUENT de la validation de contrainte : un formulaire
 *     pouvait être soumis sans numéro. La contrainte porte désormais sur la
 *     saisie visible, via `setCustomValidity` sur le champ de la bibliothèque.
 *
 *   · Le libellé et l'erreur étaient composés à la main
 *     (`text-[10px] font-semibold uppercase`, `text-destructive text-xs
 *     font-bold`) au lieu des contrats `.ax-field__label` et
 *     `.ax-field__message--error`.
 *
 *   · Le message d'erreur n'était relié au champ par aucun `aria-describedby` :
 *     un lecteur d'écran ne l'annonçait pas.
 */

import { useCallback, useEffect, useId, useRef, useState } from "react";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import "./PhoneNumberValidation.css";

type PhoneNumberValidationProps = {
  name?: string;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  onBlur?: () => void;
  required?: boolean;
  hideLabel?: boolean;
  label?: string;
  /** Précision sous le champ. */
  hint?: string;
};

/** Indicatif + 6 à 15 chiffres — la plage couverte par le plan E.164. */
const DIGITS = /^[0-9]{6,15}$/;

export default function PhoneNumberValidation({
  name = "phone",
  value,
  defaultValue = "",
  onChange,
  onBlur,
  required = false,
  hideLabel = false,
  label = "Téléphone",
  hint,
}: PhoneNumberValidationProps) {
  const [internalValue, setInternalValue] = useState(value || defaultValue);
  const [touched, setTouched] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const errorId = useId();

  const isEmpty = !internalValue || internalValue.trim() === "";
  const isValid = required
    ? DIGITS.test(internalValue)
    : isEmpty || DIGITS.test(internalValue);

  /* L'erreur n'apparaît qu'après une première interaction : signaler « numéro
     invalide » sur un champ jamais touché est du bruit. */
  const showError = touched && !isValid;

  /*
   * La contrainte est posée sur le champ RÉEL de la bibliothèque, pas sur le
   * champ caché. C'est ce qui fait qu'un formulaire incomplet est bloqué par le
   * navigateur, avec le message natif et le focus au bon endroit.
   */
  const syncValidity = useCallback(() => {
    const input = containerRef.current?.querySelector<HTMLInputElement>(
      "input.form-control",
    );
    if (!input) return;

    if (required && isEmpty) {
      input.setCustomValidity("Veuillez renseigner un numéro de téléphone.");
    } else if (!isValid) {
      input.setCustomValidity("Ce numéro de téléphone n'est pas valide.");
    } else {
      input.setCustomValidity("");
    }
  }, [required, isEmpty, isValid]);

  useEffect(() => {
    syncValidity();
  }, [syncValidity]);

  useEffect(() => {
    if (value !== undefined) setInternalValue(value);
  }, [value]);

  const handleChange = (val: string) => {
    setInternalValue(val);
    onChange?.(val);
  };

  const handleBlur = () => {
    setTouched(true);
    onBlur?.();
  };

  return (
    <div className="ax-field">
      {!hideLabel && (
        <label className="ax-field__label" htmlFor={`${name}-phone`}>
          {label}
          {required && (
            <span className="ax-field__required" aria-hidden="true">
              {" "}
              *
            </span>
          )}
        </label>
      )}

      <div ref={containerRef} className={showError ? "is-invalid-wrap" : undefined}>
        {/*
          Le champ caché porte la valeur au format E.164 attendu par l'API.
          Il ne porte PAS `required` : un champ masqué n'est pas validé.
        */}
        <input
          type="hidden"
          name={name}
          value={internalValue ? `+${internalValue}` : ""}
        />

        <PhoneInput
          value={internalValue}
          onChange={handleChange}
          onBlur={handleBlur}
          country="sn"
          /* Les pays d'où viennent réellement les contributions, en tête de
             liste — le reste suit par ordre alphabétique. */
          preferredCountries={["sn", "fr", "it", "es", "us", "ma"]}
          enableSearch
          searchPlaceholder="Rechercher un pays…"
          searchNotFound="Aucun pays trouvé"
          placeholder="77 000 00 00"
          containerClass={`react-tel-input${showError ? " is-invalid" : ""}`}
          inputProps={{
            id: `${name}-phone`,
            "aria-describedby": showError ? errorId : undefined,
            "aria-invalid": showError || undefined,
          }}
        />
      </div>

      {showError ? (
        <p id={errorId} className="ax-field__message ax-field__message--error">
          {isEmpty
            ? "Veuillez renseigner un numéro de téléphone."
            : "Ce numéro ne semble pas valide. Vérifiez l'indicatif et le nombre de chiffres."}
        </p>
      ) : (
        hint && <p className="ax-field__hint">{hint}</p>
      )}
    </div>
  );
}
