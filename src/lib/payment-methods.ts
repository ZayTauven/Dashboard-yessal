/*
 * ═══════════════════════════════════════════════════════════════════════════
 * Les moyens de paiement — une seule source
 * ═══════════════════════════════════════════════════════════════════════════
 * Le catalogue existait EN DOUBLE : une fois dans `PaymentMethodPicker`
 * (formulaires de saisie), une fois dans `StatusBadge` (affichage en lecture).
 * Les deux s'accordaient encore, mais rien ne les y obligeait — et ce projet a
 * déjà vu ce qu'une liste recopiée devient : les options de paiement de la
 * modale des Ndiguels et de « Nouveau don » avaient divergé sans raison métier.
 *
 * Le registre est ici, dans un module NEUTRE, parce que ses deux consommateurs
 * ne sont pas de même nature : `PaymentMethodPicker` est un composant client,
 * `StatusBadge` est universel et se rend depuis des pages serveur. Un module
 * sans directive se laisse importer par les deux sans rien entraîner derrière
 * lui.
 *
 * ── Pourquoi des logos ────────────────────────────────────────────────────
 * « Orange Money », « Wave » : ces noms se lisent, mais ne se RECONNAISSENT
 * pas. Dans un tableau de trente lignes, l'œil saute d'une marque à l'autre
 * bien plus vite qu'il ne lit une colonne de texte — c'est précisément ce que
 * les logos apportent. Le nom reste attaché à chaque image, en infobulle et
 * pour les lecteurs d'écran : on remplace la lecture par la reconnaissance,
 * sans retirer l'information à qui en a besoin.
 *
 * ── Les fichiers de `public/payment/` sont RECADRÉS ───────────────────────
 * Ils viennent de sources sans rapport et n'avaient ni la même toile ni les
 * mêmes marges : l'encre d'`orange-money.png` occupait 394 × 200 px au centre
 * d'un carré de 512, soit 12 px de haut une fois rendue dans une tuile de 30 —
 * moitié moins que le Visa de la ligne voisine. Aucune règle CSS ne rattrape
 * cela : `contain` respecte la toile, pixels vides compris, et `cover` rognerait
 * la marque.
 *
 * Chaque fichier a donc été rogné sur sa boîte d'encre puis recentré sur une
 * toile carrée à 8 % de marge. Le dessin n'a pas changé — seulement son cadrage.
 * Un logo AJOUTÉ ICI doit passer par la même normalisation, sinon il jurera.
 */

import {
  Banknote,
  Building2,
  CreditCard,
  Smartphone,
  Wallet,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface PaymentMethodOption {
  value: string;
  label: string;
  /** Repli : affiché quand aucun logo n'existe pour cette méthode. */
  icon: LucideIcon;
  /**
   * Logo de marque, servi depuis `public/payment/`.
   *
   * ⚠ `wave.png` et `orange-money.png` SONT les logos officiels retenus par la
   * direction du projet. Ils ne se remplacent pas au goût du jour.
   */
  logo?: string;
  /**
   * Le logo porte-t-il son PROPRE fond opaque ?
   *
   * Wave est un carré cyan plein : posé avec une marge au centre d'une tuile
   * blanche, il y forme un autocollant aux angles vifs dans un cadre arrondi.
   * Les autres marques sont détourées et se posent SUR la tuile. La différence
   * tient à l'image, pas à l'écran — d'où ce drapeau ici et non dans le CSS.
   */
  bleed?: boolean;
}

/**
 * Aligné sur `contributions.Donation.PaymentMethod`.
 *
 * ⚠ Les valeurs HÉRITÉES restent lisibles ici — la base en contient encore sur
 * des dons anciens (migration 0007), et un historique doit savoir les afficher.
 * Elles ne sont pas PROPOSABLES pour autant : voir `ALL_METHODS`.
 */
export const PAYMENT_METHODS: Record<string, PaymentMethodOption> = {
  orange_money: {
    value: "orange_money",
    label: "Orange Money",
    icon: Smartphone,
    logo: "/payment/orange-money.png",
  },
  wave: {
    value: "wave",
    label: "Wave",
    icon: Smartphone,
    logo: "/payment/wave.png",
    bleed: true,
  },
  bictorys: {
    value: "bictorys",
    label: "Carte bancaire",
    icon: CreditCard,
    /* Bictorys encaisse par CARTE : le logo Visa dit la chose au premier coup
       d'œil, là où « Bictorys » ne parle qu'aux initiés. */
    logo: "/payment/visa.png",
  },
  virement: {
    value: "virement",
    label: "Virement bancaire",
    icon: Building2,
    /* Une banque, pas une carte. Un virement n'est pas un paiement par carte,
       et les confondre brouillerait la seule distinction qui compte ici pour
       le rapprochement comptable. */
    logo: "/payment/banque.png",
  },
  manual: {
    value: "manual",
    label: "Espèces (collecteur)",
    icon: Banknote,
    logo: "/payment/especes.png",
  },

  // ── Héritées : affichables, jamais proposées ──────────────────────────
  visa: {
    value: "visa",
    label: "Visa",
    icon: CreditCard,
    logo: "/payment/visa.png",
  },
  mastercard: {
    value: "mastercard",
    label: "Mastercard",
    icon: CreditCard,
    logo: "/payment/mastercard.png",
  },
  paypal: {
    value: "paypal",
    label: "PayPal",
    icon: Wallet,
    logo: "/payment/paypal.png",
  },
  collector: {
    value: "collector",
    label: "Espèces (collecteur)",
    icon: Banknote,
    logo: "/payment/especes.png",
  },
};

/**
 * Ce qu'on PROPOSE. Cinq, dans l'ordre d'usage réel au Sénégal.
 *
 * 🔴 IL Y EN AVAIT SEPT, ET DEUX MENAIENT À UNE IMPASSE. `DonationViewSet.pay`
 * (`contributions/views.py:154`) n'accepte que `orange_money`, `wave`, `visa`,
 * `mastercard` et `bictorys` — plus `virement` et `manual`, traités avant. Un
 * membre qui choisissait **PayPal** ou **Collecteur** recevait donc un 400
 * « Méthode de paiement non supportée » après avoir saisi son montant.
 *
 * `visa` et `mastercard` sont retirées pour une autre raison : le paiement par
 * carte passe par un seul routage, `bictorys`, qui présente lui-même le choix
 * de la marque. Deux lignes ici pour un seul parcours faisaient croire à deux
 * chemins différents.
 *
 * Ce jeu est celui que le mobile émet depuis la refonte
 * (`yessal-mobile/types/donation.types.ts`). Divergence relevée par l'audit de
 * parité du 2026-09-05.
 */
export const ALL_METHODS = [
  "orange_money",
  "wave",
  "bictorys",
  "virement",
  "manual",
];

/** Libellé seul — pour les exports CSV/XLSX, qui n'ont ni logo ni couleur. */
export function paymentMethodLabel(value?: string | null): string {
  return PAYMENT_METHODS[(value ?? "").toLowerCase()]?.label ?? value ?? "";
}
