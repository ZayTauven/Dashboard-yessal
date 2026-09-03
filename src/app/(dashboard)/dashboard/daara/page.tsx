import Link from "next/link";
import {
  Building2,
  Hash,
  MapPin,
  MessageSquare,
  UserCircle,
  Users2,
} from "lucide-react";
import { getMyDaara } from "@/app/actions/daara";
import {
  getDirectoryUsers,
  getPilotageSettings,
  getProfile,
} from "@/app/actions/users";
import { EmptyState } from "@/components/ui/empty-state";
import { Avatar } from "@/components/vireo/Avatar";
import { CoverBand } from "@/components/vireo/CoverBand";
import { PageHead } from "@/components/vireo/PageHead";
import { StatusBadge } from "@/components/vireo/StatusBadge";
import type { Role } from "@/lib/nav";
import { roleLabelLong } from "@/lib/roles";
import { CollectorList } from "./CollectorList";

/*
 * ═══════════════════════════════════════════════════════════════════════════
 * Mon Daara
 * ═══════════════════════════════════════════════════════════════════════════
 * Fiche d'entité, bâtie sur le patron `pages/Profile` de Vireo : bandeau de
 * couverture, identité posée dessus, bandeau de statistiques, puis les
 * sections.
 *
 * Ce que la version précédente peignait à la main, et pourquoi ça posait
 * problème :
 *
 *   · La bannière fondait `var(--primary)` vers `#2D7A4F`, un vert écrit en
 *     dur. La moitié du dégradé suivait l'accent du Customizer, l'autre non :
 *     changer d'accent produisait un fondu vers une couleur sans rapport.
 *     <CoverBand> dérive tout de jetons.
 *
 *   · Le statut actif/inactif était un point coloré en `bg-green-100
 *     text-green-700` — invisible en thème sombre, et un vocabulaire de plus
 *     pour dire ce que <StatusBadge> dit partout ailleurs.
 *
 *   · Le tableau des membres était typé `any` et n'affichait ni Daara ni
 *     statut ; l'en-tête était en `font-black uppercase tracking-widest
 *     text-[10px]`, une graisse qu'on ne trouve nulle part ailleurs.
 *
 * Le type `DaaraMember` remplace les `any` de la boucle : la forme vient de
 * `getDirectoryUsers`, la même que celle de l'annuaire.
 */

type DaaraPayload = {
  name: string;
  code?: string;
  description?: string | null;
  is_active?: boolean;
  created_at?: string;
  location?: string;
  members_count?: number;
  chef_full_name?: string | null;
  collectors?: Array<{
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
  }>;
  ldd?: {
    id: number;
    code: string;
    name: string;
  };
};

type DaaraMember = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  role?: string | null;
  avatar?: string | null;
  avatar_url?: string | null;
};

export default async function DaaraPage() {
  const [
    { data: daara, error },
    { data: profile },
    { data: directory },
    { data: pilotage },
  ] = await Promise.all([
    getMyDaara(),
    getProfile(),
    getDirectoryUsers(),
    getPilotageSettings(),
  ]);

  const role = (profile?.role ?? "member") as Role;
  const showMembersLink = role === "chef_daara" || role === "collector";

  /* Les deux sorties d'erreur partagent la même coque : seul le message change,
     et l'issue proposée reste la même. */
  if (error || !daara) {
    return (
      <div className="flex flex-col gap-6">
        <PageHead role={role} title="Mon Daara" />
        <div className="ax-card">
          <div className="ax-card__body">
            <EmptyState
              icon={Building2}
              title={
                error
                  ? "Impossible de charger le Daara"
                  : "Vous n'êtes pas encore affilié à un Daara"
              }
              description={
                error ??
                "Contactez votre Chef Daara ou l'administrateur pour être rattaché à une communauté."
              }
              action={
                <Link href="/dashboard" className="ax-btn ax-btn--primary">
                  <span className="ax-btn__label">Retour au tableau de bord</span>
                </Link>
              }
            />
          </div>
        </div>
      </div>
    );
  }

  const d = daara as DaaraPayload;
  const membersCount = d.members_count ?? null;
  const collectors = d.collectors ?? [];

  const others: DaaraMember[] = ((directory as DaaraMember[]) ?? []).filter(
    (u) => u.id !== profile?.id,
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHead
        role={role}
        title="Mon Daara"
        subtitle="La communauté à laquelle vous êtes rattaché."
        actions={
          showMembersLink && (
            <Link href="/dashboard/members" className="ax-btn ax-btn--tonal">
              <Users2 className="ax-btn__icon" size={16} aria-hidden="true" />
              <span className="ax-btn__label">Gérer les membres</span>
            </Link>
          )
        }
      />

      {/* ── Identité ── */}
      <section className="ax-card overflow-hidden">
        <CoverBand height={120} />

        <div className="ax-card__body -mt-12 flex flex-col gap-4">
          <span
            className="ax-avatar ax-avatar--2xl ax-avatar--squircle ax-avatar--ringed"
            aria-hidden="true"
          >
            <Building2 className="ax-avatar__icon" />
          </span>

          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="ax-card__title text-2xl">{d.name}</h2>

              <div className="ax-cluster ax-text-muted mt-2 flex-wrap gap-4 text-sm">
                {d.code && (
                  <span className="ax-cluster gap-1">
                    <Hash size={14} aria-hidden="true" />
                    <span className="font-mono tabular">{d.code}</span>
                  </span>
                )}
                {d.ldd && (
                  <span className="ax-cluster gap-1">
                    <Building2 size={14} aria-hidden="true" />
                    {d.ldd.name} ({d.ldd.code})
                  </span>
                )}
                {d.location && (
                  <span className="ax-cluster gap-1">
                    <MapPin size={14} aria-hidden="true" />
                    {d.location}
                  </span>
                )}
              </div>
            </div>

            <StatusBadge
              domain="user"
              value={d.is_active === false ? "inactive" : "active"}
            />
          </div>

          <p className="ax-text-muted text-sm">
            {d.description || "Aucune description renseignée pour ce Daara."}
          </p>
        </div>
      </section>

      {/* ── Encadrement ── */}
      <div className="grid gap-4 md:grid-cols-2">
        <section className="ax-card">
          <div className="ax-card__header">
            <span className="ax-card__kpi-icon ax-card__kpi-icon--c1" aria-hidden="true">
              <UserCircle />
            </span>
            <div className="ax-card__titles">
              <h3 className="ax-card__title">Chef de Daara</h3>
              <p className="ax-card__subtitle">
                {d.chef_full_name || "Non renseigné"}
              </p>
            </div>
          </div>
          {membersCount != null && (
            <div className="ax-card__body">
              <p className="ax-kpi__label">Effectif sur la plateforme</p>
              <p className="ax-kpi__value font-mono tabular">
                {membersCount}
                <span className="ax-text-muted ms-2 text-base font-normal">
                  membre{membersCount !== 1 ? "s" : ""}
                </span>
              </p>
            </div>
          )}
        </section>

        <section className="ax-card">
          <div className="ax-card__header">
            <span className="ax-card__kpi-icon ax-card__kpi-icon--c2" aria-hidden="true">
              <Users2 />
            </span>
            <div className="ax-card__titles">
              <h3 className="ax-card__title">Collecteurs</h3>
              <p className="ax-card__subtitle">
                {collectors.length === 0
                  ? "Aucun collecteur désigné"
                  : `${collectors.length} désigné${collectors.length > 1 ? "s" : ""}`}
              </p>
            </div>
          </div>
          {collectors.length > 0 && (
            <div className="ax-card__body">
              <CollectorList collectors={collectors} role={role} />
            </div>
          )}
        </section>
      </div>

      {/* ── Les autres membres ── */}
      <section className="ax-card">
        <div className="ax-card__header">
          <div className="ax-card__titles">
            <h3 className="ax-card__title">Les autres membres de mon Daara</h3>
          </div>
          <span className="ax-badge ax-badge--neutral ax-badge--sm">
            {others.length}
          </span>
        </div>

        {others.length === 0 ? (
          <div className="ax-card__body">
            <p className="ax-text-subtle text-center text-sm italic">
              Aucun autre membre trouvé dans ce Daara.
            </p>
          </div>
        ) : (
          <div className="ax-table-wrap">
            <table className="ax-table ax-table--hover">
              <caption className="ax-visually-hidden">
                Membres rattachés à {d.name}
              </caption>
              <thead className="ax-table__head">
                <tr>
                  <th scope="col" className="ax-table__th">
                    Membre
                  </th>
                  <th scope="col" className="ax-table__th hidden sm:table-cell">
                    Rôle
                  </th>
                  <th scope="col" className="ax-table__th ax-table__th--num">
                    <span className="ax-visually-hidden">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {others.map((member) => (
                  <tr key={member.id} className="ax-table__row">
                    <td className="ax-table__td">
                      <div className="flex items-center gap-3">
                        <Avatar
                          src={member.avatar || member.avatar_url}
                          name={`${member.first_name} ${member.last_name}`}
                          size="sm"
                        />
                        <div className="flex flex-col">
                          <Link
                            href={`/dashboard/users/${member.id}`}
                            className="ax-link font-medium"
                          >
                            {member.first_name} {member.last_name}
                          </Link>
                          <span className="ax-text-subtle text-xs">
                            {member.email}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="ax-table__td hidden sm:table-cell">
                      <span className="ax-badge ax-badge--neutral ax-badge--sm">
                        {roleLabelLong(member.role ?? "")}
                      </span>
                    </td>
                    <td className="ax-table__td ax-table__td--num">
                      {pilotage?.enable_salons ? (
                        <Link
                          href={`/dashboard/chat?with=${member.id}`}
                          className="ax-btn ax-btn--ghost ax-btn--sm"
                        >
                          <MessageSquare
                            className="ax-btn__icon"
                            size={14}
                            aria-hidden="true"
                          />
                          <span className="ax-btn__label hidden sm:inline">
                            Inviter dans un salon
                          </span>
                        </Link>
                      ) : (
                        <span className="ax-text-subtle text-xs italic">
                          Salons désactivés
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
