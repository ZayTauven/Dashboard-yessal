/*
 * ═══════════════════════════════════════════════════════════════════════════
 * Badges de statut métier
 * ═══════════════════════════════════════════════════════════════════════════
 * Un même statut s'affichait jusqu'ici de trois façons selon l'écran : « Payé »
 * ici, « Confirmé » là, « CONFIRMED » ailleurs — et les couleurs venaient de
 * classes Tailwind en dur (`bg-green-100 text-green-700`) qui ne suivaient ni
 * le mode sombre ni l'accent du Customizer.
 *
 * Ce module centralise le vocabulaire. Les valeurs proviennent directement des
 * `TextChoices` Django, domaine par domaine : ce qui n'existe pas côté backend
 * ne peut pas s'afficher ici, et un statut inconnu se dégrade en badge neutre
 * plutôt qu'en case vide.
 *
 * Les tons se limitent aux quatre sémantiques d'Aurora (success / warning /
 * danger / info) plus neutre. Volontairement : l'accent est réservé à
 * l'identité de marque, pas aux états.
 */

import Image from "next/image";
import {
  PAYMENT_METHODS,
  paymentMethodLabel as paymentMethodLabelFromRegistry,
} from "@/lib/payment-methods";
import {
  AlertCircle,
  Ban,
  Check,
  CheckCircle2,
  Clock,
  CreditCard,
  Hourglass,
  X,
  XCircle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type Tone = "success" | "warning" | "danger" | "info" | "neutral";

const TONE_CLASS: Record<Tone, string> = {
  success: "ax-badge--success",
  warning: "ax-badge--warning",
  danger: "ax-badge--danger",
  info: "ax-badge--info",
  neutral: "ax-badge--neutral",
};

interface Entry {
  label: string;
  tone: Tone;
  icon: LucideIcon;
}

/* ── Vocabulaire, aligné sur les TextChoices Django ────────────────────── */

/** `contributions.Donation.PaymentStatus` */
const PAYMENT: Record<string, Entry> = {
  pending: { label: "En attente", tone: "warning", icon: Clock },
  pending_wire: { label: "Virement en attente", tone: "info", icon: Hourglass },
  confirmed: { label: "Confirmé", tone: "success", icon: CheckCircle2 },
  failed: { label: "Échoué", tone: "danger", icon: XCircle },
};

/** `events.Campaign.Status` */
const CAMPAIGN: Record<string, Entry> = {
  pending: { label: "À venir", tone: "info", icon: Clock },
  active: { label: "En cours", tone: "success", icon: CheckCircle2 },
  completed: { label: "Terminé", tone: "neutral", icon: Check },
  inactive: { label: "Suspendu", tone: "warning", icon: Ban },
};

/** `accounts.User.Status` */
const USER: Record<string, Entry> = {
  pending: { label: "À valider", tone: "warning", icon: Clock },
  active: { label: "Actif", tone: "success", icon: CheckCircle2 },
  inactive: { label: "Inactif", tone: "neutral", icon: Ban },
  blocked: { label: "Bloqué", tone: "danger", icon: Ban },
};

/** `accounts.UserDocument.ValidationStatus` */
const DOCUMENT: Record<string, Entry> = {
  pending: { label: "En attente", tone: "warning", icon: Clock },
  validated: { label: "Validé", tone: "success", icon: CheckCircle2 },
  rejected: { label: "À corriger", tone: "danger", icon: AlertCircle },
};

/** `accounts.TitleRequest.Status` */
const TITLE: Record<string, Entry> = {
  pending: { label: "En attente", tone: "warning", icon: Clock },
  approved: { label: "Approuvé", tone: "success", icon: CheckCircle2 },
  refused: { label: "Refusé", tone: "danger", icon: XCircle },
};

/** `comms.ChatInvitation.Status` */
const INVITATION: Record<string, Entry> = {
  pending: { label: "En attente", tone: "warning", icon: Clock },
  accepted: { label: "Acceptée", tone: "success", icon: Check },
  declined: { label: "Refusée", tone: "danger", icon: X },
  expired: { label: "Expirée", tone: "neutral", icon: Clock },
};

const DOMAINS = {
  payment: PAYMENT,
  campaign: CAMPAIGN,
  user: USER,
  document: DOCUMENT,
  title: TITLE,
  invitation: INVITATION,
} as const;

export type StatusDomain = keyof typeof DOMAINS;

export interface StatusBadgeProps {
  /** Domaine métier — détermine le vocabulaire et les couleurs. */
  domain: StatusDomain;
  /** Valeur brute renvoyée par l'API. */
  value?: string | null;
  /** Masque l'icône quand la place manque (cellules de tableau denses). */
  iconless?: boolean;
  size?: "sm" | "md";
  className?: string;
}

export function StatusBadge({
  domain,
  value,
  iconless = false,
  size = "md",
  className,
}: StatusBadgeProps) {
  const key = (value ?? "").toLowerCase();
  const entry = DOMAINS[domain][key];

  /*
   * Statut inconnu : on affiche la valeur brute en neutre plutôt que rien.
   * Un badge vide dans une colonne « Statut » se lit comme une donnée
   * manquante ; la valeur brute se lit comme un vocabulaire à compléter ici.
   */
  const label = entry?.label ?? (value || "—");
  const tone: Tone = entry?.tone ?? "neutral";
  const Icon = entry?.icon;

  return (
    <span
      className={cn(
        "ax-badge",
        TONE_CLASS[tone],
        size === "sm" && "ax-badge--sm",
        className,
      )}
    >
      {!iconless && Icon && <Icon className="ax-badge__icon" aria-hidden="true" />}
      {label}
    </span>
  );
}

/* ── Moyens de paiement ────────────────────────────────────────────────── */

/**
 * `contributions.Donation.PaymentMethod`, valeurs héritées comprises.
 *
 * Le moyen de paiement n'est pas un état : il n'a pas de sémantique
 * succès/échec. Il reste donc en badge neutre à contour, l'icône portant seule
 * la distinction — c'est aussi ce qui permet d'en aligner cinq dans une
 * colonne sans que le tableau vire au sapin de Noël.
 */
/*
 * Le catalogue etait recopie ici. Il vit desormais dans
 * `lib/payment-methods.ts`, avec les logos de marque.
 */

/**
 * Le moyen de paiement, par son LOGO.
 *
 * « Orange Money », « Wave » : ces noms se lisent, ils ne se reconnaissent pas.
 * Dans un tableau de trente Jëfs, l'œil retrouve une marque bien plus vite
 * qu'il ne parcourt une colonne de texte.
 *
 * Le nom n'est pas perdu pour autant : il reste en infobulle au survol
 * (`title`) et dans le nom accessible (`aria-label`), de sorte qu'un lecteur
 * d'écran annonce « Wave » et non « image ». `showLabel` le ramène à l'écran
 * pour les endroits où le logo seul manquerait de contexte — une fiche isolée,
 * par exemple, où il n'y a pas de colonne pour l'expliquer.
 */
export function PaymentMethodBadge({
  value,
  className,
  showLabel = false,
}: {
  value?: string | null;
  className?: string;
  /** Affiche le nom À CÔTÉ du logo, au lieu de le réserver à l'infobulle. */
  showLabel?: boolean;
}) {
  const entry = PAYMENT_METHODS[(value ?? "").toLowerCase()];
  const label = entry?.label ?? value ?? "—";
  const Icon = entry?.icon ?? CreditCard;

  return (
    <span
      className={cn("ax-paymethod", className)}
      title={label}
      aria-label={showLabel ? undefined : label}
      role={showLabel ? undefined : "img"}
    >
      <span
        className={cn(
          "ax-paymethod__tile",
          entry?.bleed && "ax-paymethod__tile--bleed",
        )}
        aria-hidden={showLabel || undefined}
      >
        {entry?.logo ? (
          /*
            `next/image` et non `<img>` : ces logos sont des fichiers LOCAUX de
            `public/`, de dimensions connues — exactement le cas que Next sait
            optimiser, contrairement aux médias distants servis par Django.
          */
          <Image
            src={entry.logo}
            alt=""
            width={28}
            height={28}
            className="ax-paymethod__logo"
          />
        ) : (
          <Icon className="ax-paymethod__icon" aria-hidden="true" />
        )}
      </span>

      {showLabel && <span className="ax-paymethod__label">{label}</span>}
    </span>
  );
}

/** Libellé seul — pour les exports CSV/XLSX, qui n'ont pas de couleurs. */
export function statusLabel(domain: StatusDomain, value?: string | null): string {
  return DOMAINS[domain][(value ?? "").toLowerCase()]?.label ?? value ?? "";
}

export function paymentMethodLabel(value?: string | null): string {
  return paymentMethodLabelFromRegistry(value);
}

export default StatusBadge;
