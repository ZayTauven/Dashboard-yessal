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

import {
  AlertCircle,
  Ban,
  Banknote,
  Building2,
  Check,
  CheckCircle2,
  Clock,
  CreditCard,
  Hourglass,
  Smartphone,
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
const METHOD: Record<string, { label: string; icon: LucideIcon }> = {
  orange_money: { label: "Orange Money", icon: Smartphone },
  wave: { label: "Wave", icon: Smartphone },
  bictorys: { label: "Carte bancaire", icon: CreditCard },
  virement: { label: "Virement", icon: Building2 },
  manual: { label: "Espèces", icon: Banknote },
  /* Valeurs héritées, conservées côté backend pour compatibilité. */
  collector: { label: "Espèces", icon: Banknote },
  paypal: { label: "PayPal", icon: CreditCard },
  visa: { label: "Visa", icon: CreditCard },
  mastercard: { label: "Mastercard", icon: CreditCard },
};

export function PaymentMethodBadge({
  value,
  className,
}: {
  value?: string | null;
  className?: string;
}) {
  const entry = METHOD[(value ?? "").toLowerCase()];
  const Icon = entry?.icon ?? CreditCard;

  return (
    <span className={cn("ax-badge ax-badge--outline ax-badge--sm", className)}>
      <Icon className="ax-badge__icon" aria-hidden="true" />
      {entry?.label ?? value ?? "—"}
    </span>
  );
}

/** Libellé seul — pour les exports CSV/XLSX, qui n'ont pas de couleurs. */
export function statusLabel(domain: StatusDomain, value?: string | null): string {
  return DOMAINS[domain][(value ?? "").toLowerCase()]?.label ?? value ?? "";
}

export function paymentMethodLabel(value?: string | null): string {
  return METHOD[(value ?? "").toLowerCase()]?.label ?? value ?? "";
}

export default StatusBadge;
