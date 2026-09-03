"use client";

/*
 * ═══════════════════════════════════════════════════════════════════════════
 * Fiche d'un Daara (vue administrateur)
 * ═══════════════════════════════════════════════════════════════════════════
 * Repris du patron `crm/Companies` de Vireo : identité de l'entité, bandeau de
 * KPI, puis onglets sur les personnes et les finances.
 *
 * Corrections de fond :
 *
 *   · La DESCRIPTION du Daara n'était éditable nulle part. Le formulaire de
 *     cette modale ne la proposait pas ; seul `DaaraEditClient.tsx` la gérait —
 *     un fichier qui n'était importé par AUCUN écran, donc du code mort. Le
 *     champ rejoint ici le formulaire vivant, et le fichier mort est supprimé.
 *
 *   · Les cartes de collecteur avaient un en-tête `bg-yessal-violet` plein,
 *     avec l'avatar en verre par-dessus : ni thème sombre, ni accent.
 *
 *   · `STATUS_CONFIG` recopiait localement un vocabulaire de statut déjà
 *     centralisé, en couleurs figées (`bg-green-100`).
 *
 *   · Le bandeau du chef de Daara était peint en `bg-yessal-violet/5` avec sa
 *     propre bordure teintée ; il passe sur `.ax-card--accent-edge`.
 */

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  BookOpen,
  Building2,
  ExternalLink,
  Layers,
  Mail,
  Pencil,
  Phone,
  TrendingUp,
  UserCircle,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { updateDaara } from "@/app/actions/daara";
import { EmptyState } from "@/components/ui/empty-state";
import { roleLabel } from "@/lib/roles";
import { formatFCFA } from "@/components/charts/YessalCharts";
import { Avatar } from "@/components/vireo/Avatar";
import { Modal } from "@/components/vireo/Modal";
import { PageHead } from "@/components/vireo/PageHead";
import { StatCard } from "@/components/vireo/StatCard";
import { StatusBadge } from "@/components/vireo/StatusBadge";

type Member = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string | null;
  role: string;
  avatar?: string | null;
  title_name?: string | null;
};

type Campaign = {
  id: number;
  name: string;
  goal_amount: string | null;
  collected_amount: string;
  progress_pct: number;
  status: string;
  deadline: string;
  organizer_name: string | null;
};

type Etat = {
  id: number;
  name: string;
  is_active: boolean;
  created_at?: string | null;
  ldd?: { id: number; code: string; name: string } | null;
  chef?: Member | null;
  members_count: number;
  collectors_count: number;
  total_collected: string;
  donation_count: number;
  campaigns_count: number;
  members: Member[];
  collectors: Member[];
  campaigns: Campaign[];
};

type DaaraData = {
  id: number;
  name: string;
  description?: string | null;
  is_active?: boolean;
  ldd?: {
    id: number;
    code: string;
    name: string;
    location?: string | null;
  } | null;
};

const dateFmt = new Intl.DateTimeFormat("fr-SN", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

const fullName = (m: Member) => `${m.first_name ?? ""} ${m.last_name ?? ""}`.trim();

type Tab = "members" | "collectors" | "finances";

export function AdminDaaraDetailView({
  daara,
  etat,
}: {
  daara: DaaraData;
  etat: Etat | null;
}) {
  const router = useRouter();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState("");
  const [tab, setTab] = useState<Tab>("members");

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setErrorMsg("");

    startTransition(async () => {
      const res = await updateDaara(daara.id, {
        name: String(formData.get("name") || "").trim(),
        description:
          String(formData.get("description") || "").trim() || undefined,
        is_active: formData.get("is_active") === "on",
      });
      if (res.error) {
        setErrorMsg(res.error);
        return;
      }
      toast.success("Daara mis à jour.");
      setIsEditOpen(false);
      router.refresh();
    });
  };

  const totalCollected = Number(etat?.total_collected || 0);
  const ldd = etat?.ldd ?? daara.ldd;

  return (
    <div className="flex flex-col gap-6">
      <PageHead
        role="admin"
        title={etat?.name ?? daara.name}
        crumbs={[
          { label: "Administration" },
          { label: "Gestion des Daaras", href: "/dashboard/admin/daara" },
        ]}
        actions={
          <>
            <Link
              href="/dashboard/admin/daara"
              className="ax-btn ax-btn--ghost"
            >
              <ArrowLeft className="ax-btn__icon" size={16} aria-hidden="true" />
              <span className="ax-btn__label">Retour à la liste</span>
            </Link>
            <button
              type="button"
              className="ax-btn ax-btn--primary"
              onClick={() => setIsEditOpen(true)}
            >
              <Pencil className="ax-btn__icon" size={15} aria-hidden="true" />
              <span className="ax-btn__label">Modifier</span>
            </button>
          </>
        }
      >
        <div className="ax-cluster ax-text-muted mt-3 flex-wrap gap-3 text-sm">
          <StatusBadge
            domain="user"
            value={daara.is_active === false ? "inactive" : "active"}
            size="sm"
          />
          {ldd && (
            <span className="ax-badge ax-badge--outline ax-badge--sm">
              <Layers className="ax-badge__icon" aria-hidden="true" />
              {ldd.code} — {ldd.name}
            </span>
          )}
          {etat?.created_at && (
            <span className="text-xs">
              Créé le {dateFmt.format(new Date(etat.created_at))}
            </span>
          )}
        </div>
      </PageHead>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Membres"
          value={etat?.members_count ?? 0}
          icon={Users}
          tone="accent"
        />
        <StatCard
          label="Collecteurs"
          value={etat?.collectors_count ?? 0}
          icon={UserCircle}
          tone="info"
        />
        <StatCard
          label="Total collecté"
          value={totalCollected}
          currency
          icon={TrendingUp}
          tone="montant"
          hint={`${etat?.donation_count ?? 0} Jëf${(etat?.donation_count ?? 0) > 1 ? "s" : ""} confirmé${(etat?.donation_count ?? 0) > 1 ? "s" : ""}`}
        />
        <StatCard
          label="Ndiguels"
          value={etat?.campaigns_count ?? 0}
          icon={BookOpen}
          tone="or"
        />
      </div>

      <div className="ax-tabs">
        <div className="ax-tabs__list" role="tablist">
          <button
            type="button"
            role="tab"
            className="ax-tabs__tab"
            aria-selected={tab === "members"}
            onClick={() => setTab("members")}
          >
            Membres
            <span className="ax-tabs__badge ax-badge ax-badge--count ax-badge--sm">
              {etat?.members_count ?? 0}
            </span>
          </button>
          <button
            type="button"
            role="tab"
            className="ax-tabs__tab"
            aria-selected={tab === "collectors"}
            onClick={() => setTab("collectors")}
          >
            Collecteurs
            <span className="ax-tabs__badge ax-badge ax-badge--count ax-badge--sm">
              {etat?.collectors_count ?? 0}
            </span>
          </button>
          <button
            type="button"
            role="tab"
            className="ax-tabs__tab"
            aria-selected={tab === "finances"}
            onClick={() => setTab("finances")}
          >
            Finances
            <span className="ax-tabs__badge ax-badge ax-badge--count ax-badge--sm">
              {etat?.campaigns_count ?? 0}
            </span>
          </button>
        </div>
      </div>

      {/* ══ Membres ══ */}
      {tab === "members" && (
        <div className="flex flex-col gap-4" role="tabpanel">
          {etat?.chef && (
            <section className="ax-card ax-card--accent-edge">
              <div className="ax-card__body flex flex-wrap items-center gap-4">
                <Avatar
                  src={etat.chef.avatar}
                  name={fullName(etat.chef)}
                  size="xl"
                />
                <div className="min-w-0 flex-1">
                  <p className="ax-eyebrow ax-text-accent">Chef de Daara</p>
                  <p className="ax-card__title">{fullName(etat.chef)}</p>
                  <p className="ax-text-muted text-sm">{etat.chef.email}</p>
                </div>
                {etat.chef.phone && (
                  <a
                    href={`tel:${etat.chef.phone}`}
                    className="ax-btn ax-btn--outline"
                  >
                    <Phone className="ax-btn__icon" size={14} aria-hidden="true" />
                    <span className="ax-btn__label font-mono tabular">
                      {etat.chef.phone}
                    </span>
                  </a>
                )}
              </div>
            </section>
          )}

          <section className="ax-card">
            {!etat?.members?.length ? (
              <div className="ax-card__body">
                <EmptyState
                  icon={Users}
                  title="Aucun membre enregistré"
                  description="Les talibés rattachés à ce Daara apparaîtront ici."
                />
              </div>
            ) : (
              <div className="ax-table-wrap">
                <table className="ax-table ax-table--hover">
                  <caption className="ax-visually-hidden">
                    Membres du Daara {etat.name}
                  </caption>
                  <thead className="ax-table__head">
                    <tr>
                      <th scope="col" className="ax-table__th">
                        Membre
                      </th>
                      <th scope="col" className="ax-table__th hidden sm:table-cell">
                        Rôle
                      </th>
                      <th scope="col" className="ax-table__th hidden md:table-cell">
                        Téléphone
                      </th>
                      <th scope="col" className="ax-table__th ax-table__th--num">
                        <span className="ax-visually-hidden">Fiche</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {etat.members.map((m) => (
                      <tr key={m.id} className="ax-table__row">
                        <td className="ax-table__td">
                          <div className="flex items-center gap-3">
                            <Avatar src={m.avatar} name={fullName(m)} size="sm" />
                            <div className="min-w-0">
                              <div className="font-medium">{fullName(m)}</div>
                              <div className="ax-text-subtle ax-truncate text-xs">
                                {m.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="ax-table__td hidden sm:table-cell">
                          <span className="ax-badge ax-badge--neutral ax-badge--sm">
                            {roleLabel(m.role)}
                          </span>
                          {m.title_name && (
                            <span className="ax-text-subtle ms-2 text-xs italic">
                              {m.title_name}
                            </span>
                          )}
                        </td>
                        <td className="ax-table__td ax-text-muted hidden md:table-cell font-mono tabular text-xs">
                          {m.phone || "—"}
                        </td>
                        <td className="ax-table__td ax-table__td--num">
                          <Link
                            href={`/dashboard/users/${m.id}`}
                            className="ax-btn ax-btn--ghost ax-btn--sm"
                          >
                            <ExternalLink
                              className="ax-btn__icon"
                              size={12}
                              aria-hidden="true"
                            />
                            <span className="ax-btn__label">Fiche</span>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      )}

      {/* ══ Collecteurs ══ */}
      {tab === "collectors" && (
        <div role="tabpanel">
          {!etat?.collectors?.length ? (
            <div className="ax-card">
              <div className="ax-card__body">
                <EmptyState
                  icon={UserCircle}
                  title="Aucun collecteur désigné"
                  description="Un chef de Daara peut nommer un talibé collecteur depuis l'annuaire."
                />
              </div>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {etat.collectors.map((c) => (
                <article key={c.id} className="ax-card">
                  <div className="ax-card__header">
                    <Avatar src={c.avatar} name={fullName(c)} size="lg" />
                    <div className="ax-card__titles">
                      <h3 className="ax-card__title">{fullName(c)}</h3>
                      <p className="ax-card__subtitle">Collecteur officiel</p>
                    </div>
                  </div>

                  <div className="ax-card__body">
                    <ul className="ax-list ax-list--compact">
                      <li className="ax-list__row px-0!">
                        <Mail className="ax-list__leading" size={14} aria-hidden="true" />
                        <span className="ax-list__content ax-truncate text-sm">
                          {c.email}
                        </span>
                      </li>
                      {c.phone && (
                        <li className="ax-list__row px-0!">
                          <Phone
                            className="ax-list__leading"
                            size={14}
                            aria-hidden="true"
                          />
                          <span className="ax-list__content font-mono tabular text-sm">
                            {c.phone}
                          </span>
                        </li>
                      )}
                    </ul>
                  </div>

                  <div className="ax-card__footer">
                    {c.phone && (
                      <a
                        href={`tel:${c.phone}`}
                        className="ax-btn ax-btn--primary ax-btn--sm flex-1"
                      >
                        <Phone className="ax-btn__icon" size={13} aria-hidden="true" />
                        <span className="ax-btn__label">Appeler</span>
                      </a>
                    )}
                    <Link
                      href={`/dashboard/users/${c.id}`}
                      className="ax-btn ax-btn--outline ax-btn--sm flex-1"
                    >
                      <ExternalLink
                        className="ax-btn__icon"
                        size={13}
                        aria-hidden="true"
                      />
                      <span className="ax-btn__label">Fiche</span>
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ══ Finances ══ */}
      {tab === "finances" && (
        <div className="flex flex-col gap-4" role="tabpanel">
          {!etat?.campaigns?.length ? (
            <div className="ax-card">
              <div className="ax-card__body">
                <EmptyState
                  icon={BookOpen}
                  title="Aucun Ndiguel associé"
                  description="Les campagnes rattachées à ce Daara apparaîtront ici."
                />
              </div>
            </div>
          ) : (
            <section className="ax-card">
              <div className="ax-card__header">
                <div className="ax-card__titles">
                  <h2 className="ax-card__title">Ndiguels du Daara</h2>
                </div>
                <span className="ax-badge ax-badge--neutral ax-badge--sm">
                  {etat.campaigns.length}
                </span>
              </div>

              <ul className="ax-list ax-list--comfortable">
                {etat.campaigns.map((c) => {
                  const goal = Number(c.goal_amount || 0);
                  const collected = Number(c.collected_amount || 0);

                  return (
                    <li key={c.id} className="ax-list__row items-start">
                      <span className="ax-list__content gap-2">
                        <span className="ax-cluster flex-wrap gap-2">
                          <Link
                            href={`/dashboard/campaigns/${c.id}/etat`}
                            className="ax-link font-medium"
                          >
                            {c.name}
                          </Link>
                          <StatusBadge
                            domain="campaign"
                            value={c.status}
                            size="sm"
                          />
                        </span>

                        <span className="ax-list__meta ax-cluster flex-wrap gap-3 text-xs">
                          {c.organizer_name && (
                            <span>Responsable : {c.organizer_name}</span>
                          )}
                          <span>
                            Échéance :{" "}
                            {new Date(c.deadline).toLocaleDateString("fr-SN")}
                          </span>
                        </span>

                        {goal > 0 && (
                          <span
                            className="ax-progress ax-progress--xs mt-1"
                            role="progressbar"
                            aria-valuenow={Math.round(c.progress_pct)}
                            aria-valuemin={0}
                            aria-valuemax={100}
                            aria-label={`Progression de ${c.name}`}
                          >
                            <span className="ax-progress__track">
                              <span
                                className="ax-progress__fill block"
                                style={{
                                  width: `${Math.min(c.progress_pct, 100)}%`,
                                }}
                              />
                            </span>
                            <span className="ax-progress__value">
                              {c.progress_pct} %
                            </span>
                          </span>
                        )}
                      </span>

                      <span className="ax-list__trailing flex-col items-end">
                        <span className="text-montant font-mono tabular text-sm font-semibold">
                          {formatFCFA(collected)}
                        </span>
                        {goal > 0 && (
                          <span className="ax-text-subtle font-mono tabular text-xs">
                            sur {formatFCFA(goal)}
                          </span>
                        )}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}
        </div>
      )}

      {/* ── Édition ── */}
      <Modal
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        title="Modifier le Daara"
        description={daara.name}
        size="md"
      >
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          {daara.ldd && (
            <div className="ax-alert ax-alert--neutral ax-alert--inline">
              <Layers className="ax-alert__icon" aria-hidden="true" />
              <div className="ax-alert__content">
                <p className="ax-alert__message">
                  Zone <strong>[{daara.ldd.code}] {daara.ldd.name}</strong> — se
                  modifie depuis l&apos;onglet Zones LDD.
                </p>
              </div>
            </div>
          )}

          <div className="ax-field">
            <label className="ax-field__label" htmlFor="daara-edit-name">
              Nom du Daara
              <span className="ax-field__required" aria-hidden="true"> *</span>
            </label>
            <input
              id="daara-edit-name"
              name="name"
              className="ax-input"
              defaultValue={daara.name}
              required
            />
          </div>

          {/*
            Champ récupéré du fichier mort `DaaraEditClient.tsx` : la
            description existait côté modèle mais n'était éditable par aucun
            écran vivant.
          */}
          <div className="ax-field">
            <label className="ax-field__label" htmlFor="daara-edit-description">
              Description
            </label>
            <textarea
              id="daara-edit-description"
              name="description"
              rows={4}
              className="ax-textarea"
              defaultValue={daara.description ?? ""}
              placeholder="Précisions géographiques ou historiques…"
            />
          </div>

          <label className="ax-check">
            <input
              type="checkbox"
              name="is_active"
              className="ax-checkbox"
              defaultChecked={daara.is_active !== false}
            />
            <span className="flex flex-col">
              <span className="text-sm font-medium">Daara actif</span>
              <span className="ax-text-subtle text-xs">
                Décoché, ce Daara n&apos;apparaît plus lors des inscriptions.
              </span>
            </span>
          </label>

          {errorMsg && (
            <p className="ax-field__message ax-field__message--error">
              {errorMsg}
            </p>
          )}

          <button
            type="submit"
            className="ax-btn ax-btn--primary ax-btn--block"
            disabled={isPending}
          >
            <Building2 className="ax-btn__icon" size={16} aria-hidden="true" />
            <span className="ax-btn__label">
              {isPending ? "Enregistrement…" : "Enregistrer les modifications"}
            </span>
          </button>
        </form>
      </Modal>
    </div>
  );
}
