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

import {
  Banknote,
  CreditCard,
  Landmark,
  Smartphone,
  Wallet,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface PaymentMethodOption {
  value: string;
  label: string;
  icon: LucideIcon;
}

/** Aligné sur `contributions.Donation.PaymentMethod`, valeurs héritées comprises. */
export const PAYMENT_METHODS: Record<string, PaymentMethodOption> = {
  orange_money: { value: "orange_money", label: "Orange Money", icon: Smartphone },
  wave: { value: "wave", label: "Wave", icon: Smartphone },
  visa: { value: "visa", label: "Visa", icon: CreditCard },
  mastercard: { value: "mastercard", label: "Mastercard", icon: CreditCard },
  paypal: { value: "paypal", label: "PayPal", icon: Wallet },
  virement: { value: "virement", label: "Virement", icon: Landmark },
  collector: { value: "collector", label: "Collecteur", icon: Banknote },
};

/** Jeu complet, dans l'ordre d'usage réel au Sénégal. */
export const ALL_METHODS = [
  "orange_money",
  "wave",
  "visa",
  "mastercard",
  "paypal",
  "virement",
  "collector",
];

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
