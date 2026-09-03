"use client";

/*
 * ═══════════════════════════════════════════════════════════════════════════
 * Fiche membre (vue administrateur)
 * ═══════════════════════════════════════════════════════════════════════════
 * Repris du patron `ecommerce/CustomerDetails` de Vireo : en-tête d'identité,
 * bandeau de KPI, rail de gauche factuel, et le gros du contenu en onglets.
 *
 * <MemberProfileCard> reste l'en-tête — il était déjà porté sur Aurora. Tout
 * ce qui l'entourait ne l'était pas.
 *
 * Ce que la reprise corrige, au-delà du style :
 *
 *   · Le bouton « Modifier » n'avait ni `onClick` ni `href` : il ne menait
 *     nulle part. Aucune route d'édition par utilisateur n'existe — l'édition
 *     se fait depuis « Utilisateurs et rôles ». Le bouton pointe désormais là,
 *     au lieu de simuler une action.
 *
 *   · « Voir tout (N) » sous les Ndiguels était mort lui aussi. La liste
 *     n'est plus tronquée : la carte défile, ce qui rend le bouton inutile.
 *
 *   · « Appeler » et « Voir » n'apparaissaient qu'au survol
 *     (`opacity-0 group-hover:opacity-100`). Sur un écran tactile il n'y a pas
 *     de survol : ces actions étaient inatteignables sur mobile.
 *
 *   · `new Date(doc.validated_at)` était formaté sans vérifier le champ : un
 *     document validé sans date affichait « Validé le Invalid Date ».
 *
 *   · Les `any` de l'interface sont remplacés par des formes explicites.
 */

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  Building2,
  Calendar,
  Copy,
  CreditCard,
  ExternalLink,
  FileText,
  HandCoins,
  KeyRound,
  Layers,
  Mail,
  MapPin,
  Pencil,
  Phone,
  ShieldAlert,
  Trash2,
  User,
  Users,
  Wallet,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { toast } from "sonner";
import { EmptyState } from "@/components/ui/empty-state";
import { formatFCFA } from "@/lib/format";
import { Avatar } from "@/components/vireo/Avatar";
import { Amount, KpiValue } from "@/components/vireo/Amount";
import { MemberProfileCard } from "@/components/vireo/MemberProfileCard";
import { cn } from "@/lib/utils";
import { Menu } from "@/components/vireo/Menu";
import { Modal } from "@/components/vireo/Modal";
import { PageHead } from "@/components/vireo/PageHead";
import {
  PaymentMethodBadge,
  StatusBadge,
  statusLabel,
} from "@/components/vireo/StatusBadge";
import {
  deleteUserAction,
  resetMemberPasswordAction,
  updateUserStatus,
} from "@/app/actions/users";
import type { DocumentStatus } from "@/types/member";
import { DonationListClient } from "../../donations/DonationListClient";

interface DetailUser {
  id: number;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  phone?: string | null;
  ldd_name?: string | null;
  daara_name?: string | null;
  title_name?: string | null;
  member_number?: string | null;
  date_joined?: string | null;
  is_active?: boolean;
  status?: string | null;
}

interface Kpi {
  title: string;
  value: string | number;
  /** Montant brut, en FCFA. Prioritaire sur `value` quand il est présent. */
  amount?: number;
  /** Valeur textuelle (une date) : ni chasse fixe, ni corps de KPI. */
  text?: boolean;
  icon?: string;
}

interface CampaignDonation {
  id: number;
  name: string;
  total: number | string;
  count?: number | null;
  last_donation?: string | null;
  description?: string | null;
}

interface UserStats {
  kpis?: Kpi[];
  campaign_donations?: CampaignDonation[];
  chartData?: Record<string, unknown>[];
}

interface UserDoc {
  id: number;
  type_display?: string | null;
  /* Meme union que `MemberDocument`, a qui cette liste est transmise. */
  status?: DocumentStatus | null;
  validated_at?: string | null;
  doc_number?: string | null;
  image?: string | null;
  image_verso?: string | null;
}

interface TutelleEntry {
  id: number;
  first_name?: string | null;
  last_name?: string | null;
  relation?: string | null;
  phone?: string | null;
  avatar_url?: string | null;
}

interface UserDetailClientProps {
  user: DetailUser;
  stats: UserStats | null;
  /* `campaign` et `created_at` sont nommés explicitement — les KPI du membre
     s'appuient dessus, et l'index signature les aurait laissés en `unknown`.
     DRF sérialise `campaign` tantôt en objet imbriqué, tantôt en identifiant
     brut selon la profondeur demandée : les deux formes sont acceptées. */
  donations: Array<{
    amount?: string | number;
    created_at?: string | null;
    campaign?: { id?: number | string } | number | string | null;
    [k: string]: unknown;
  }>;
  documents: UserDoc[];
  tutelle: TutelleEntry[];
}

const ICON_MAP: Record<string, LucideIcon> = {
  Wallet,
  HandCoins,
  Landmark: Building2,
  Users,
  Calendar,
};

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

type Tab = "stats" | "history" | "docs";

/** Ligne d'information du rail de gauche. */
function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value?: string | null;
}) {
  return (
    <li className="ax-list__row">
      <Icon className="ax-list__leading" size={16} aria-hidden="true" />
      <span className="ax-list__content">
        <span className="ax-list__title">{value || "—"}</span>
        <span className="ax-list__meta">{label}</span>
      </span>
    </li>
  );
}

export default function UserDetailClient({
  user,
  stats,
  donations,
  documents,
  tutelle,
}: UserDetailClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [tab, setTab] = useState<Tab>("stats");
  const [selectedCampaign, setSelectedCampaign] =
    useState<CampaignDonation | null>(null);
  const [selectedDoc, setSelectedDoc] = useState<UserDoc | null>(null);
  /* Le mot de passe qui vient d'être attribué, le temps de le transmettre. */
  const [issuedPassword, setIssuedPassword] = useState<string | null>(null);

  const campaignDonations = stats?.campaign_donations ?? [];

  const fullName = `${user?.first_name ?? ""} ${user?.last_name ?? ""}`.trim();

  /* DRF sérialise les Decimal en chaîne : on repasse par Number avant de
     sommer, sinon « 5000 » + « 3000 » donne « 50003000 ». */
  const totalDonated = donations.reduce(
    (sum, d) => sum + Number(d?.amount ?? 0),
    0,
  );

  /*
   * ── Les quatre chiffres de CE membre ──
   *
   * `stats.kpis` vient de `getUserDashboardStats`, qui renvoie les compteurs du
   * DAARA : « Total Daara », « Talibés », « Jëfs Actifs »… Affichés en tête
   * d'une fiche individuelle, ils se lisaient comme les chiffres de la personne
   * — un membre paraissait avoir collecté les 20 000 FCFA de son Daara entier.
   *
   * Ils sont donc calculés ici, sur `donations`, qui ne contient plus que les
   * Jëfs de ce membre depuis que `DonationViewSet` honore `?user_id=`.
   */
  const memberKpis = useMemo((): Kpi[] => {
    const campaigns = new Set(
      donations
        .map((d) => {
          const c = d?.campaign;
          if (c === null || c === undefined) return undefined;
          return typeof c === "object" ? c.id : c;
        })
        .filter((c): c is number | string => c !== undefined),
    );

    const lastAt = donations.reduce<number | null>((latest, d) => {
      const t = d?.created_at ? new Date(d.created_at).getTime() : NaN;
      if (Number.isNaN(t)) return latest;
      return latest === null || t > latest ? t : latest;
    }, null);

    return [
      /* `amount` porte le nombre BRUT : c'est <Amount> qui décide de l'écrire
         en entier ou en abrégé, et à quelle taille. Passer une chaîne déjà
         formatée lui retirerait cette décision. */
      { title: "Total donné", value: "", amount: totalDonated, icon: "Wallet" },
      { title: "Jëfs", value: donations.length, icon: "HandCoins" },
      { title: "Ndiguels soutenus", value: campaigns.size, icon: "Landmark" },
      {
        title: "Dernier versement",
        value: lastAt === null ? "—" : dateFmt.format(new Date(lastAt)),
        /* Une date n'est pas un chiffre : ni chasse fixe, ni corps de KPI.
           « 31 août 2026 » en mono à 26 px détonnait à côté d'un « 3 ». */
        text: true,
        icon: "Calendar",
      },
    ];
  }, [donations, totalDonated]);

  /*
   * Assistance : le membre a perdu son mot de passe et ne peut pas passer par
   * « mot de passe oublié », faute d'adresse e-mail valide. On lui en attribue
   * un nouveau, affiché une seule fois pour qu'il soit dicté au téléphone.
   *
   * La confirmation est demandée avant, pas après : l'ancien mot de passe
   * cesse immédiatement de fonctionner, et quelqu'un qui utilisait encore son
   * compte se retrouverait dehors sans comprendre pourquoi.
   */
  /*
   * ── Ce que l'onglet « Statistiques » montre désormais ──
   *
   * Il n'affichait qu'un graphique alimenté par `getUserDashboardStats`, la
   * même source que les compteurs du DAARA écartés plus haut : sur une fiche
   * individuelle, il restait désespérément vide.
   *
   * Tout ce qu'il faut est pourtant déjà là, dans `donations` — montant, date,
   * moyen de paiement, Ndiguel — depuis que l'API honore `?user_id=`. Trois
   * lectures d'un même jeu de dons : quand, comment, et pour quoi.
   */
  const memberStats = useMemo(() => {
    const monthFmt = new Intl.DateTimeFormat("fr-SN", { month: "short" });

    /* Douze mois glissants : un membre inscrit en mars ne doit pas voir onze
       colonnes vides parce que l'année civile commence en janvier. */
    const months: { label: string; total: number }[] = [];
    const keys: string[] = [];
    const now = new Date();

    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      keys.push(`${d.getFullYear()}-${d.getMonth()}`);
      months.push({ label: monthFmt.format(d), total: 0 });
    }

    const byMethod = new Map<string, { amount: number; count: number }>();
    const byCampaign = new Map<string, { name: string; amount: number; count: number }>();

    for (const d of donations) {
      const amount = Number(d?.amount ?? 0);

      const at = d?.created_at ? new Date(d.created_at) : null;
      if (at && !Number.isNaN(at.getTime())) {
        const idx = keys.indexOf(`${at.getFullYear()}-${at.getMonth()}`);
        if (idx >= 0) months[idx].total += amount;
      }

      const method = String(d?.payment_method ?? "") || "inconnu";
      const m = byMethod.get(method) ?? { amount: 0, count: 0 };
      byMethod.set(method, { amount: m.amount + amount, count: m.count + 1 });

      const cname =
        typeof d?.campaign_name === "string" && d.campaign_name
          ? d.campaign_name
          : "Sans Ndiguel";
      const c = byCampaign.get(cname) ?? { name: cname, amount: 0, count: 0 };
      byCampaign.set(cname, { name: cname, amount: c.amount + amount, count: c.count + 1 });
    }

    return {
      months,
      monthMax: Math.max(1, ...months.map((m) => m.total)),
      methods: [...byMethod.entries()]
        .map(([method, v]) => ({ method, ...v }))
        .sort((a, b) => b.amount - a.amount),
      campaigns: [...byCampaign.values()].sort((a, b) => b.amount - a.amount),
    };
  }, [donations]);

  const handleResetPassword = () => {
    toast(`Réinitialiser le mot de passe de ${fullName} ?`, {
      description:
        "Son mot de passe actuel cessera aussitôt de fonctionner. Le nouveau ne s'affichera qu'une fois.",
      action: {
        label: "Réinitialiser",
        onClick: () =>
          startTransition(async () => {
            const res = await resetMemberPasswordAction(user.id);
            if (res.error) {
              toast.error(res.error);
              return;
            }
            setIssuedPassword(res.password ?? "");
          }),
      },
    });
  };

  const handleBlock = () => {
    toast(`Bloquer l'accès de ${fullName} ?`, {
      action: {
        label: "Confirmer",
        onClick: () =>
          startTransition(async () => {
            const res = await updateUserStatus(user.id, "block");
            if (res.error) {
              toast.error(res.error);
              return;
            }
            toast.success("Accès bloqué.");
            router.refresh();
          }),
      },
      cancel: { label: "Annuler", onClick: () => {} },
    });
  };

  const handleDelete = () => {
    toast(`Supprimer définitivement le compte de ${fullName} ?`, {
      description: "Cette action est irréversible.",
      action: {
        label: "Supprimer",
        onClick: () =>
          startTransition(async () => {
            const res = await deleteUserAction(user.id);
            if (res.error) {
              toast.error(res.error);
              return;
            }
            toast.success("Compte supprimé.");
            router.push("/dashboard/members");
          }),
      },
      cancel: { label: "Annuler", onClick: () => {} },
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHead
        role="admin"
        title={fullName || `Membre #${user.id}`}
        crumbs={[
          { label: "Communauté" },
          { label: "Membres", href: "/dashboard/members" },
        ]}
        actions={
          <>
            <Link
              href="/dashboard/admin/users"
              className="ax-btn ax-btn--outline"
            >
              <Pencil className="ax-btn__icon" size={15} aria-hidden="true" />
              <span className="ax-btn__label">Modifier</span>
            </Link>
            <Menu
              label={`Actions pour ${fullName}`}
              items={[
                {
                  label: "Réinitialiser le mot de passe",
                  icon: KeyRound,
                  disabled: isPending,
                  onSelect: handleResetPassword,
                },
                {
                  label: "Bloquer l'accès",
                  icon: ShieldAlert,
                  disabled: isPending,
                  onSelect: handleBlock,
                },
                {
                  label: "Supprimer le compte",
                  icon: Trash2,
                  danger: true,
                  separatorBefore: true,
                  disabled: isPending,
                  onSelect: handleDelete,
                },
              ]}
            />
          </>
        }
      />

      <MemberProfileCard
        member={user}
        totalDonated={totalDonated}
        donationCount={donations.length}
        documents={documents}
        tutelle={tutelle}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* ══ Rail de gauche ══ */}
        <div className="flex flex-col gap-4">
          <section className="ax-card">
            <div className="ax-card__header">
              <span className="ax-card__kpi-icon ax-card__kpi-icon--c1" aria-hidden="true">
                <User />
              </span>
              <div className="ax-card__titles">
                <h3 className="ax-card__title">Contact et identité</h3>
              </div>
            </div>
            <ul className="ax-list ax-list--compact">
              <InfoRow icon={Mail} label="Adresse e-mail" value={user?.email} />
              <InfoRow icon={Phone} label="Téléphone" value={user?.phone} />
              <InfoRow icon={MapPin} label="Localité (LDD)" value={user?.ldd_name} />
              <InfoRow icon={Building2} label="Daara" value={user?.daara_name} />
              <InfoRow
                icon={BookOpen}
                label="Titre honorifique"
                value={user?.title_name}
              />
              <InfoRow
                icon={CreditCard}
                label="Numéro de membre"
                value={user?.member_number || String(user?.id ?? "")}
              />
              <InfoRow
                icon={Calendar}
                label="Date d'inscription"
                value={formatDate(user?.date_joined)}
              />
              {/*
                Le statut MÉTIER, pas le drapeau Django.
                `is_active` n'est même pas sérialisé par `UserSerializer` :
                l'expression valait donc toujours `undefined`, et la ligne
                affichait « Inactif » sur TOUS les comptes — juste sous un badge
                d'en-tête qui lit `status` et annonce « Actif ». Deux réponses
                contradictoires sur le même écran, dont une systématiquement
                fausse.
                `statusLabel` est la même fonction qui nomme le badge : les deux
                ne peuvent plus diverger.
              */}
              <InfoRow
                icon={Layers}
                label="Statut du compte"
                value={statusLabel("user", user?.status)}
              />
            </ul>
          </section>

          {/* Tutelle */}
          <section className="ax-card">
            <div className="ax-card__header">
              <span className="ax-card__kpi-icon ax-card__kpi-icon--c3" aria-hidden="true">
                <Users />
              </span>
              <div className="ax-card__titles">
                <h3 className="ax-card__title">Tutelle</h3>
              </div>
              <span className="ax-badge ax-badge--neutral ax-badge--sm">
                {tutelle.length}
              </span>
            </div>

            {tutelle.length === 0 ? (
              <div className="ax-card__body">
                <p className="ax-text-subtle text-center text-sm italic">
                  Aucun proche sous tutelle.
                </p>
              </div>
            ) : (
              <ul className="ax-list ax-list--compact">
                {tutelle.map((t) => {
                  const name = `${t.first_name ?? ""} ${t.last_name ?? ""}`.trim();
                  return (
                    <li key={t.id} className="ax-list__row">
                      <Avatar
                        className="ax-list__leading"
                        src={t.avatar_url}
                        name={name}
                        size="sm"
                      />
                      <span className="ax-list__content">
                        <span className="ax-list__title">{name}</span>
                        <span className="ax-list__meta">
                          {t.relation || "Proche"}
                        </span>
                      </span>
                      {t.phone && (
                        <a
                          href={`tel:${t.phone}`}
                          className="ax-btn ax-btn--ghost ax-btn--sm ax-list__trailing"
                        >
                          <Phone className="ax-btn__icon" size={13} aria-hidden="true" />
                          <span className="ax-btn__label">Appeler</span>
                        </a>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          {/* Ndiguels auxquels le membre a contribué */}
          <section className="ax-card">
            <div className="ax-card__header">
              <span className="ax-card__kpi-icon ax-card__kpi-icon--c2" aria-hidden="true">
                <Wallet />
              </span>
              <div className="ax-card__titles">
                <h3 className="ax-card__title">Ndiguels soutenus</h3>
              </div>
              <span className="ax-badge ax-badge--neutral ax-badge--sm">
                {campaignDonations.length}
              </span>
            </div>

            {campaignDonations.length === 0 ? (
              <div className="ax-card__body">
                <p className="ax-text-subtle text-center text-sm italic">
                  Aucune participation enregistrée.
                </p>
              </div>
            ) : (
              <ul className="ax-list ax-list--compact ax-list--selectable ax-scroll-y max-h-96">
                {campaignDonations.map((cd) => (
                  <li key={cd.id}>
                    <button
                      type="button"
                      className="ax-list__row w-full text-start"
                      onClick={() => setSelectedCampaign(cd)}
                    >
                      <span className="ax-list__content">
                        <span className="ax-list__title">{cd.name}</span>
                        {cd.count != null && (
                          <span className="ax-list__meta">
                            {cd.count} Jëf{cd.count > 1 ? "s" : ""}
                          </span>
                        )}
                      </span>
                      <span className="ax-list__trailing text-montant font-mono tabular text-sm font-semibold">
                        {formatFCFA(Number(cd.total ?? 0))}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        {/* ══ Colonne principale ══ */}
        <div className="flex flex-col gap-4 lg:col-span-2">
          {memberKpis.length > 0 && (
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {memberKpis.map((kpi, idx) => {
                const Icon = ICON_MAP[kpi.icon ?? ""] ?? User;
                return (
                  /*
                    Les tuiles d'icône alternent sur c1..c4 pour que quatre
                    cartes voisines ne soient pas quatre fois la même.
                  */
                  <article key={idx} className="ax-card ax-card--stat">
                    <div className="ax-card__body">
                      <div className="ax-kpi">
                        <div className="ax-kpi__top">
                          <span
                            className={`ax-kpi__icon ax-kpi__icon--c${(idx % 4) + 1}`}
                            aria-hidden="true"
                          >
                            <Icon />
                          </span>
                        </div>
                        <div>
                          <p className="ax-kpi__label">{kpi.title}</p>
                          <p
                            className={cn(
                              "ax-kpi__value",
                              !kpi.text && "font-mono tabular",
                              kpi.text && "text-lg font-medium",
                              kpi.amount !== undefined && "text-montant",
                            )}
                          >
                            {kpi.amount !== undefined ? (
                              <Amount value={kpi.amount} responsive />
                            ) : kpi.text ? (
                              kpi.value
                            ) : (
                              <KpiValue value={kpi.value} />
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          <section className="ax-card">
            <div className="ax-card__header">
              <div className="ax-card__titles">
                <h3 className="ax-card__title">Activité et documents</h3>
              </div>
            </div>

            <div className="ax-card__body flex flex-col gap-4">
              <div className="ax-tabs">
                <div className="ax-tabs__list" role="tablist">
                  <button
                    type="button"
                    role="tab"
                    className="ax-tabs__tab"
                    aria-selected={tab === "stats"}
                    onClick={() => setTab("stats")}
                  >
                    Statistiques
                  </button>
                  <button
                    type="button"
                    role="tab"
                    className="ax-tabs__tab"
                    aria-selected={tab === "history"}
                    onClick={() => setTab("history")}
                  >
                    Historique
                    <span className="ax-tabs__badge ax-badge ax-badge--count ax-badge--sm">
                      {donations.length}
                    </span>
                  </button>
                  <button
                    type="button"
                    role="tab"
                    className="ax-tabs__tab"
                    aria-selected={tab === "docs"}
                    onClick={() => setTab("docs")}
                  >
                    Documents
                    {documents.length > 0 && (
                      <span className="ax-tabs__badge ax-badge ax-badge--warning ax-badge--sm">
                        {documents.length}
                      </span>
                    )}
                  </button>
                </div>
              </div>

              {tab === "stats" && (
                <div className="flex flex-col gap-6" role="tabpanel">
                  {donations.length === 0 ? (
                    <EmptyState
                      icon={HandCoins}
                      title="Aucun Jëf pour le moment"
                      description="Les versements de ce membre apparaîtront ici."
                    />
                  ) : (
                    <>
                      {/* ── Douze mois glissants ── */}
                      <section>
                        <p className="ax-eyebrow mb-3">Versements par mois</p>
                        <div className="flex h-40 items-end gap-1.5">
                          {memberStats.months.map((m, i) => (
                            <div
                              key={i}
                              className="flex flex-1 flex-col items-center gap-1.5"
                              title={`${m.label} : ${formatFCFA(m.total)}`}
                            >
                              <div className="flex w-full flex-1 items-end">
                                <div
                                  className="w-full rounded-t-(--ax-radius-sm) bg-(--ax-accent)"
                                  style={{
                                    height: `${(m.total / memberStats.monthMax) * 100}%`,
                                    minHeight: m.total > 0 ? 2 : 0,
                                  }}
                                />
                              </div>
                              <span className="ax-text-subtle text-[10px]">
                                {m.label}
                              </span>
                            </div>
                          ))}
                        </div>
                      </section>

                      {/* ── Moyens de paiement ── */}
                      <section>
                        <p className="ax-eyebrow mb-3">Moyens de paiement</p>
                        <ul className="flex flex-col gap-2">
                          {memberStats.methods.map((m) => (
                            <li key={m.method} className="ax-list__row">
                              <PaymentMethodBadge value={m.method} />
                              <span className="ax-list__content ax-text-muted text-xs">
                                {m.count} Jëf{m.count > 1 ? "s" : ""}
                              </span>
                              <span className="ax-list__trailing text-montant font-mono tabular text-sm font-semibold">
                                {formatFCFA(m.amount)}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </section>

                      {/* ── Ndiguels soutenus ── */}
                      <section>
                        <p className="ax-eyebrow mb-3">Ndiguels soutenus</p>
                        <ul className="flex flex-col gap-2">
                          {memberStats.campaigns.map((c) => (
                            <li key={c.name} className="ax-list__row">
                              <span className="ax-list__content ax-truncate text-sm">
                                {c.name}
                              </span>
                              <span className="ax-list__trailing text-montant font-mono tabular text-sm font-semibold">
                                {formatFCFA(c.amount)}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </section>
                    </>
                  )}
                </div>
              )}

              {tab === "history" && (
                <div role="tabpanel">
                  <DonationListClient
                    initialDonations={
                      donations as React.ComponentProps<
                        typeof DonationListClient
                      >["initialDonations"]
                    }
                    variant="directory"
                  />
                </div>
              )}

              {tab === "docs" && (
                <div role="tabpanel">
                  {documents.length === 0 ? (
                    <EmptyState
                      icon={FileText}
                      title="Aucun document déposé"
                      description="Le membre n'a pas encore soumis de pièce d'identité."
                    />
                  ) : (
                    <ul className="ax-list">
                      {documents.map((doc) => {
                        const validatedOn = formatDate(doc.validated_at);
                        return (
                          <li key={doc.id} className="ax-list__row">
                            <FileText
                              className="ax-list__leading"
                              size={18}
                              aria-hidden="true"
                            />
                            <span className="ax-list__content">
                              <span className="ax-list__title">
                                {doc.type_display || "Pièce d'identité"}
                              </span>
                              <span className="ax-list__meta">
                                {doc.status === "validated" && validatedOn
                                  ? `Validé le ${validatedOn}`
                                  : doc.doc_number
                                    ? `N° ${doc.doc_number}`
                                    : "En attente de validation"}
                              </span>
                            </span>
                            <span className="ax-list__trailing gap-2">
                              <StatusBadge
                                domain="document"
                                value={doc.status}
                                size="sm"
                                iconless
                              />
                              <button
                                type="button"
                                className="ax-btn ax-btn--ghost ax-btn--sm"
                                onClick={() => setSelectedDoc(doc)}
                              >
                                <span className="ax-btn__label">Voir</span>
                              </button>
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              )}
            </div>
          </section>
        </div>
      </div>

      {/* ── Détail d'une participation ── */}
      <Modal
        open={Boolean(selectedCampaign)}
        onOpenChange={(o) => !o && setSelectedCampaign(null)}
        title={selectedCampaign?.name ?? ""}
        description="Détail de la participation à ce Ndiguel"
        size="sm"
        footer={
          selectedCampaign && (
            <>
              <button
                type="button"
                className="ax-btn ax-btn--ghost"
                onClick={() => setSelectedCampaign(null)}
              >
                <span className="ax-btn__label">Fermer</span>
              </button>
              <Link
                href={`/dashboard/campaigns/${selectedCampaign.id}`}
                className="ax-btn ax-btn--primary"
              >
                <ExternalLink className="ax-btn__icon" size={14} aria-hidden="true" />
                <span className="ax-btn__label">Voir le Ndiguel</span>
              </Link>
            </>
          )
        }
      >
        {selectedCampaign && (
          <div className="flex flex-col gap-4">
            <div className="ax-card ax-card--stat">
              <div className="ax-card__body">
                <p className="ax-kpi__label">Montant total contribué</p>
                <p className="ax-kpi__value text-montant font-mono tabular">
                  {formatFCFA(Number(selectedCampaign.total ?? 0))}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {selectedCampaign.count != null && (
                <div className="ax-card ax-card--compact">
                  <div className="ax-card__body">
                    <p className="ax-kpi__label">Nombre de Jëfs</p>
                    <p className="ax-kpi__value font-mono tabular text-xl">
                      {selectedCampaign.count}
                    </p>
                  </div>
                </div>
              )}
              {formatDate(selectedCampaign.last_donation) && (
                <div className="ax-card ax-card--compact">
                  <div className="ax-card__body">
                    <p className="ax-kpi__label">Dernier Jëf</p>
                    <p className="text-sm font-medium">
                      {formatDate(selectedCampaign.last_donation)}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {selectedCampaign.description && (
              <p className="ax-text-muted text-sm">
                {selectedCampaign.description}
              </p>
            )}
          </div>
        )}
      </Modal>

      {/* ── Visionneuse de document ── */}
      <Modal
        open={Boolean(selectedDoc)}
        onOpenChange={(o) => !o && setSelectedDoc(null)}
        title={selectedDoc?.type_display || "Document d'identité"}
        description={
          selectedDoc?.doc_number ? `N° ${selectedDoc.doc_number}` : undefined
        }
        size="lg"
      >
        {selectedDoc && (
          <div className="flex flex-col gap-4">
            <StatusBadge domain="document" value={selectedDoc.status} />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {(["image", "image_verso"] as const).map((key) => {
                const src = selectedDoc[key];
                if (!src) return null;
                const label = key === "image" ? "Recto" : "Verso";
                return (
                  <figure key={key} className="flex flex-col gap-1">
                    <figcaption className="ax-eyebrow">{label}</figcaption>
                    <a href={src} target="_blank" rel="noopener noreferrer">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={src}
                        alt={`${label} du document`}
                        className="max-h-64 w-full rounded-(--ax-radius-sm) border border-(--ax-border) object-cover"
                      />
                    </a>
                  </figure>
                );
              })}
            </div>
          </div>
        )}
      </Modal>

      {/*
        Le mot de passe attribué, une fois et une seule.
        Il n'est stocké nulle part : fermer cette fenêtre l'efface définitivement,
        et il faudra recommencer. C'est dit explicitement, parce que la personne
        au bout du fil attend qu'on le lui dicte.
      */}
      <Modal
        open={issuedPassword !== null}
        onOpenChange={(open) => !open && setIssuedPassword(null)}
        title="Nouveau mot de passe"
        description={`Dictez-le à ${fullName}. Il ne sera plus affiché.`}
        status="success"
        size="sm"
        footer={
          <button
            type="button"
            className="ax-btn ax-btn--primary"
            onClick={() => setIssuedPassword(null)}
          >
            <span className="ax-btn__label">J&apos;ai transmis le mot de passe</span>
          </button>
        }
      >
        <div className="flex flex-col gap-4">
          <div className="ax-field__control">
            <span className="ax-field__affix ax-field__affix--leading">
              <KeyRound aria-hidden="true" />
            </span>
            <input
              readOnly
              value={issuedPassword ?? ""}
              aria-label="Nouveau mot de passe"
              className="ax-input ax-input--lg ax-input--with-leading-icon ax-input--with-trailing font-mono tracking-wider"
              onFocus={(e) => e.currentTarget.select()}
            />
            <button
              type="button"
              className="ax-field__affix ax-field__affix--trailing ax-field__affix--button"
              aria-label="Copier le mot de passe"
              onClick={async () => {
                if (!issuedPassword) return;
                try {
                  await navigator.clipboard.writeText(issuedPassword);
                  toast.success("Mot de passe copié.");
                } catch {
                  /* Presse-papiers refusé (contexte non sécurisé, permission) :
                     le mot de passe reste lisible à l'écran. */
                  toast.error("Copie impossible — notez-le à l'écran.");
                }
              }}
            >
              <Copy aria-hidden="true" />
            </button>
          </div>

          <p className="ax-text-muted text-sm leading-relaxed">
            {fullName} devra le remplacer à sa prochaine connexion : un bandeau
            le lui rappellera tant que ce ne sera pas fait.
          </p>
        </div>
      </Modal>
    </div>
  );
}
