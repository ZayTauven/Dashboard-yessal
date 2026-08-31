"use client";

/*
 * ═══════════════════════════════════════════════════════════════════════════
 * Fiche membre
 * ═══════════════════════════════════════════════════════════════════════════
 * L'en-tête de profil précédent posait un dégradé violet en dur et affichait
 * six lignes d'état civil. Celui-ci répond d'abord aux questions qu'un chef de
 * Daara ou un admin se pose vraiment en ouvrant une fiche :
 *
 *   1. Qui est-ce, et à quel Daara appartient-il ?      → bandeau d'identité
 *   2. Son compte est-il en règle ?                     → statut + pièces
 *   3. Que donne-t-il, et depuis quand ?                → bandeau de KPI
 *   4. Son profil est-il exploitable ?                  → jauge de complétude
 *
 * La bannière n'est plus un aplat : c'est un dégradé bâti sur l'accent actif,
 * plus une trame d'arabesque très discrète. Elle suit donc la couleur choisie
 * dans le panneau Apparence — y compris si le client abandonne le violet.
 *
 * Aucune couleur en dur ici : tout passe par les jetons Aurora, et les
 * montants gardent le vert Yessal quel que soit l'accent.
 */

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  BadgeCheck,
  Building2,
  CalendarDays,
  CircleAlert,
  Clock,
  Droplet,
  FileText,
  Heart,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Users,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatFCFA } from "@/components/charts/YessalCharts";
import {
  ROLE_LABEL,
  STATUS_LABEL,
  memberDisplayName,
  memberInitials,
  type Member,
  type MemberDocument,
  type MemberTutelle,
} from "@/types/member";
import { cn } from "@/lib/utils";

/* ── Formatage ─────────────────────────────────────────────────────────── */

const dateFmt = new Intl.DateTimeFormat("fr-SN", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

function formatDate(iso?: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : dateFmt.format(d);
}

/** « il y a 3 jours », « à l'instant » — pour la dernière activité. */
function formatRelative(iso?: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const rtf = new Intl.RelativeTimeFormat("fr", { numeric: "auto" });
  const diffMs = d.getTime() - Date.now();
  const units: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ["year", 31536000000],
    ["month", 2592000000],
    ["day", 86400000],
    ["hour", 3600000],
    ["minute", 60000],
  ];
  for (const [unit, ms] of units) {
    if (Math.abs(diffMs) >= ms) return rtf.format(Math.round(diffMs / ms), unit);
  }
  return "à l'instant";
}

/* ── Complétude du profil ──────────────────────────────────────────────── */

/**
 * Champs qui comptent réellement pour la vie de la plateforme : joindre le
 * membre, le rattacher à un Daara, et savoir à qui on parle. L'état civil
 * décoratif (groupe sanguin, code postal) n'entre pas dans le calcul — sinon
 * tout le monde plafonne à 60 % sans rien y pouvoir.
 */
const COMPLETENESS_FIELDS: Array<{ key: keyof Member; label: string }> = [
  { key: "first_name", label: "Prénom" },
  { key: "last_name", label: "Nom" },
  { key: "phone", label: "Téléphone" },
  { key: "email", label: "E-mail" },
  { key: "daara_name", label: "Daara" },
  { key: "city", label: "Ville" },
  { key: "birth_date", label: "Date de naissance" },
  { key: "avatar_url", label: "Photo" },
];

function completeness(member: Member) {
  const missing = COMPLETENESS_FIELDS.filter((f) => {
    const v = member[f.key];
    return v === null || v === undefined || v === "";
  });
  const filled = COMPLETENESS_FIELDS.length - missing.length;
  return {
    pct: Math.round((filled / COMPLETENESS_FIELDS.length) * 100),
    missing: missing.map((f) => f.label),
  };
}

/* ── Sous-composants ───────────────────────────────────────────────────── */

function InfoRow({
  icon: Icon,
  label,
  value,
  mono,
  href,
}: {
  icon: LucideIcon;
  label: string;
  value?: string | null;
  mono?: boolean;
  href?: string;
}) {
  const content = (
    <span className={cn("truncate font-medium text-text-strong", mono && "font-mono")}>
      {value || <span className="font-normal text-text-subtle">Non renseigné</span>}
    </span>
  );

  return (
    <li className="flex items-center gap-3 py-2">
      <span
        className="grid h-9 w-9 shrink-0 place-items-center rounded-md text-text-subtle"
        style={{ background: "var(--ax-fill-hover)" }}
        aria-hidden="true"
      >
        <Icon size={16} />
      </span>
      <span className="flex min-w-0 flex-col">
        <span className="text-[11px] uppercase tracking-wider text-text-subtle">
          {label}
        </span>
        {href && value ? (
          <a href={href} className="truncate font-medium text-text-strong hover:underline">
            {value}
          </a>
        ) : (
          content
        )}
      </span>
    </li>
  );
}

function StatusPill({ status }: { status?: string | null }) {
  const s = (status || "").toLowerCase();
  const map: Record<string, { cls: string; icon: LucideIcon }> = {
    active: { cls: "ax-badge--soft ax-badge--success", icon: ShieldCheck },
    pending: { cls: "ax-badge--soft ax-badge--warning", icon: Clock },
    blocked: { cls: "ax-badge--soft ax-badge--danger", icon: CircleAlert },
    suspended: { cls: "ax-badge--soft ax-badge--danger", icon: CircleAlert },
  };
  const cfg = map[s] ?? { cls: "ax-badge--soft ax-badge--neutral", icon: CircleAlert };
  const Icon = cfg.icon;

  return (
    <span className={cn("ax-badge ax-badge--pill", cfg.cls)}>
      <Icon size={13} aria-hidden="true" />
      {STATUS_LABEL[s] ?? "Statut inconnu"}
    </span>
  );
}

function MiniStat({
  label,
  value,
  hint,
  currency,
}: {
  label: string;
  value: number;
  hint?: string;
  currency?: boolean;
}) {
  const nf = new Intl.NumberFormat("fr-SN", { maximumFractionDigits: 0 });
  return (
    <div className="flex flex-col gap-0.5 px-4 py-3">
      <span className="text-[11px] uppercase tracking-wider text-text-subtle">
        {label}
      </span>
      <span
        className={cn(
          "font-mono text-xl font-semibold tabular",
          currency ? "text-montant" : "text-text-strong",
        )}
      >
        {currency ? formatFCFA(value) : nf.format(value)}
      </span>
      {hint && <span className="text-xs text-text-subtle">{hint}</span>}
    </div>
  );
}

/* ── Composant principal ───────────────────────────────────────────────── */

export interface MemberProfileCardProps {
  member: Member;
  /** Total donné, en FCFA. */
  totalDonated?: number;
  /** Nombre de jefs enregistrés. */
  donationCount?: number;
  documents?: MemberDocument[];
  tutelle?: MemberTutelle[];
  /** Actions contextuelles (Modifier, Bloquer…) rendues en haut à droite. */
  actions?: React.ReactNode;
  className?: string;
}

export function MemberProfileCard({
  member,
  totalDonated,
  donationCount,
  documents = [],
  tutelle = [],
  actions,
  className,
}: MemberProfileCardProps) {
  const name = memberDisplayName(member);
  const initials = memberInitials(member);
  const role = ROLE_LABEL[(member.role || "").toString()] ?? "Membre";
  const joined = formatDate(member.date_joined);
  const lastSeen = formatRelative(member.last_active_at);
  const { pct, missing } = completeness(member);

  const approvedDocs = documents.filter((d) => d.status === "approved").length;
  const pendingDocs = documents.filter((d) => d.status === "pending").length;

  const location = [member.city, member.residence_country].filter(Boolean).join(", ");

  return (
    <section
      className={cn("ax-card overflow-visible", className)}
      aria-label={`Fiche de ${name}`}
    >
      {/*
        Bannière — dégradé construit sur l'accent actif plutôt qu'un violet
        figé, surmonté d'une trame d'arabesque à 8 % qui évite l'aplat mort.
      */}
      <div
        className="relative h-36 rounded-t-xl sm:h-40"
        style={{
          background:
            "linear-gradient(120deg, var(--ax-accent) 0%, color-mix(in oklab, var(--ax-accent) 62%, var(--ax-viz-violet)) 55%, color-mix(in oklab, var(--ax-accent) 40%, #000) 100%)",
        }}
      >
        <div
          className="absolute inset-0 rounded-t-xl opacity-[0.09]"
          aria-hidden="true"
          style={{
            backgroundImage:
              "repeating-linear-gradient(135deg, #fff 0 1px, transparent 1px 14px), repeating-linear-gradient(45deg, #fff 0 1px, transparent 1px 14px)",
          }}
        />
        <span className="absolute end-4 top-4 font-mono text-xs text-white/85">
          #{member.id}
        </span>
      </div>

      <div className="ax-card__body pt-0">
        {/* ── Identité ── */}
        <div className="-mt-12 flex flex-col gap-4 sm:-mt-14 sm:flex-row sm:items-end">
          <Avatar
            className="size-24 shrink-0 border-4 sm:size-28"
            style={{
              borderColor: "var(--ax-surface-solid)",
              boxShadow: "var(--ax-shadow-md)",
            }}
          >
            <AvatarImage
              src={member.avatar_url || member.avatar || undefined}
              alt=""
              className="object-cover"
            />
            <AvatarFallback
              className="text-2xl font-semibold uppercase"
              style={{
                background: "color-mix(in oklab, var(--ax-accent) 16%, var(--ax-surface-solid))",
                color: "var(--ax-accent)",
              }}
            >
              {initials}
            </AvatarFallback>
          </Avatar>

          <div className="flex min-w-0 flex-1 flex-col gap-2 sm:pb-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="truncate text-2xl font-semibold tracking-tight sm:text-3xl">
                {name}
              </h1>
              {member.title_name && (
                <span className="ax-badge ax-badge--pill ax-badge--soft ax-badge--accent">
                  <BadgeCheck size={13} aria-hidden="true" />
                  {member.title_name}
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm text-text-muted">
              <span className="font-medium">{role}</span>
              {member.daara_name && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="inline-flex items-center gap-1.5">
                    <Building2 size={14} aria-hidden="true" />
                    {member.daara_name}
                  </span>
                </>
              )}
              {member.ldd_name && (
                <>
                  <span aria-hidden="true">·</span>
                  <span>{member.ldd_name}</span>
                </>
              )}
              <StatusPill status={member.status} />
            </div>
          </div>

          {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
        </div>

        {/* ── Bandeau de KPI ── */}
        {(totalDonated !== undefined || donationCount !== undefined) && (
          <div
            className="mt-6 grid grid-cols-2 divide-x rounded-lg lg:grid-cols-4"
            style={{
              background: "var(--ax-surface-subtle)",
              borderColor: "var(--ax-border)",
            }}
          >
            {totalDonated !== undefined && (
              <MiniStat label="Total donné" value={totalDonated} currency />
            )}
            {donationCount !== undefined && (
              <MiniStat
                label="Jëfs enregistrés"
                value={donationCount}
                hint={donationCount === 0 ? "Aucun don à ce jour" : undefined}
              />
            )}
            <MiniStat
              label="Pièces validées"
              value={approvedDocs}
              hint={
                pendingDocs > 0
                  ? `${pendingDocs} en attente de validation`
                  : documents.length === 0
                    ? "Aucune pièce déposée"
                    : "Dossier complet"
              }
            />
            <MiniStat
              label="Sous tutelle"
              value={tutelle.length}
              hint={tutelle.length === 0 ? "Aucun proche rattaché" : undefined}
            />
          </div>
        )}

        {/* ── Coordonnées + complétude ── */}
        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_260px]">
          <ul className="min-w-0">
            <InfoRow
              icon={Phone}
              label="Téléphone"
              value={member.phone}
              mono
              href={member.phone ? `tel:${member.phone}` : undefined}
            />
            <InfoRow
              icon={Mail}
              label="E-mail"
              value={member.email}
              href={member.email ? `mailto:${member.email}` : undefined}
            />
            <InfoRow icon={MapPin} label="Localisation" value={location || null} />
          </ul>

          <ul className="min-w-0">
            <InfoRow icon={CalendarDays} label="Membre depuis" value={joined} />
            <InfoRow icon={Clock} label="Dernière activité" value={lastSeen} />
            <InfoRow
              icon={Droplet}
              label="Groupe sanguin"
              value={member.blood_type}
              mono
            />
          </ul>

          {/* Jauge de complétude — dit quoi réclamer au membre, pas juste un % */}
          <div
            className="rounded-lg p-4"
            style={{ background: "var(--ax-surface-subtle)" }}
          >
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-[11px] uppercase tracking-wider text-text-subtle">
                Profil complété
              </span>
              <span className="font-mono text-lg font-semibold tabular">{pct} %</span>
            </div>

            <div
              className="mt-2 h-1.5 overflow-hidden rounded-pill"
              style={{ background: "var(--ax-fill-active)" }}
              role="progressbar"
              aria-valuenow={pct}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Complétude du profil"
            >
              <div
                className="h-full rounded-pill transition-[width] duration-500"
                style={{
                  width: `${pct}%`,
                  background:
                    pct >= 80
                      ? "var(--ax-success-500)"
                      : pct >= 50
                        ? "var(--ax-warning-500)"
                        : "var(--ax-danger-500)",
                }}
              />
            </div>

            {missing.length > 0 ? (
              <p className="mt-3 text-xs leading-relaxed text-text-muted">
                Manque&nbsp;: {missing.join(", ").toLowerCase()}.
              </p>
            ) : (
              <p className="mt-3 text-xs text-text-muted">
                Toutes les informations utiles sont renseignées.
              </p>
            )}
          </div>
        </div>

        {/* ── Proches sous tutelle ── */}
        {tutelle.length > 0 && (
          <div className="mt-6">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-text-strong">
              <Users size={15} aria-hidden="true" />
              Proches sous tutelle
              <span className="ax-badge ax-badge--sm ax-badge--soft ax-badge--neutral">
                {tutelle.length}
              </span>
            </h2>
            <ul className="flex flex-wrap gap-2">
              {tutelle.map((t) => {
                const tName =
                  [t.first_name, t.last_name].filter(Boolean).join(" ") || "Proche";
                return (
                  <li
                    key={t.id}
                    className="flex items-center gap-2.5 rounded-pill py-1.5 pe-4 ps-1.5"
                    style={{ background: "var(--ax-fill-hover)" }}
                  >
                    <Avatar className="size-7">
                      <AvatarImage src={t.avatar_url || undefined} alt="" />
                      <AvatarFallback className="text-[10px] font-semibold uppercase">
                        {tName.slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">{tName}</span>
                    {t.relationship && (
                      <span className="text-xs text-text-subtle">{t.relationship}</span>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* ── Pièces d'identité ── */}
        {documents.length > 0 && (
          <div className="mt-6">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-text-strong">
              <FileText size={15} aria-hidden="true" />
              Pièces déposées
            </h2>
            <ul className="flex flex-wrap gap-2">
              {documents.map((d) => {
                const cls =
                  d.status === "approved"
                    ? "ax-badge--success"
                    : d.status === "rejected"
                      ? "ax-badge--danger"
                      : "ax-badge--warning";
                const label =
                  d.status === "approved"
                    ? "validée"
                    : d.status === "rejected"
                      ? "refusée"
                      : "en attente";
                return (
                  <li key={d.id}>
                    <span className={cn("ax-badge ax-badge--pill ax-badge--soft", cls)}>
                      {d.type_display || d.type || "Pièce"} — {label}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}

export default MemberProfileCard;
