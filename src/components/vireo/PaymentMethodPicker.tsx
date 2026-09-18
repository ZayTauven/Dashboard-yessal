"use client";

/*
 * ═══════════════════════════════════════════════════════════════════════════
 * Sélecteur de moyen de paiement
 * ═══════════════════════════════════════════════════════════════════════════
 * Le même bloc de sept options était recopié dans « Faire un Jëf » (modale des
 * Ndiguels) et dans « Nouveau don » — sept `<label>` de huit lignes chacun,
 * deux fois. Avec deux conséquences :
 *
 *   · Les deux listes avaient DIVERGÉ : le virement bancaire était proposé
 *     dans « Nouveau don » et absent de la modale des Ndiguels, sans raison
 *     métier.
 *   · Chaque `<label>` portait un `onClick` EN PLUS du `onChange` du radio,
 *     donc l'état se mettait à jour deux fois par clic.
 *
 * Le radio reste un vrai radio, seulement masqué : c'est lui qui porte le nom
 * du champ, la navigation par flèches et l'annonce du lecteur d'écran. Le
 * label ne fait que peindre l'état — il n'usurpe pas `role="radio"`, ce qui
 * dédoublerait l'élément pour les technologies d'assistance.
 */

import { cn } from "@/lib/utils";
/*
 * Le registre a demenage dans `lib/payment-methods.ts` : il etait ecrit ici ET
 * dans `StatusBadge`, et deux catalogues finissent toujours par diverger. On le
 * reexporte pour ne casser aucun import existant.
 */
import {
  ALL_METHODS,
  PAYMENT_METHODS,
  type PaymentMethodOption,
} from "@/lib/payment-methods";

export { ALL_METHODS, PAYMENT_METHODS };
export type { PaymentMethodOption };

export interface PaymentMethodPickerProps {
  value: string;
  onChange: (value: string) => void;
  /** Clés à proposer. Défaut : tout le jeu. */
  methods?: string[];
  /** Nom du champ transmis au formulaire. */
  name?: string;
  legend?: string;
  className?: string;
}

export function PaymentMethodPicker({
  value,
  onChange,
  methods = ALL_METHODS,
  name = "paymentMethod",
  legend = "Moyen de paiement",
  className,
}: PaymentMethodPickerProps) {
  return (
    <fieldset className={cn("ax-field", className)}>
      <legend className="ax-field__label">
        {legend}
        <span className="ax-field__required" aria-hidden="true"> *</span>
      </legend>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {methods.map((key) => {
          const m = PAYMENT_METHODS[key];
          if (!m) return null;
          const Icon = m.icon;
          const selected = value === m.value;

          return (
            <label
              key={m.value}
              className={cn(
                "ax-segment__option flex-col justify-center gap-1 border border-(--ax-border) py-3",
                selected && "is-active",
              )}
            >
              <input
                type="radio"
                name={name}
                value={m.value}
                checked={selected}
                onChange={() => onChange(m.value)}
                className="ax-visually-hidden"
              />
              <Icon size={16} aria-hidden="true" />
              {m.label}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

export default PaymentMethodPicker;
