"use client";

/*
 * ═══════════════════════════════════════════════════════════════════════════
 * Annuaire des membres
 * ═══════════════════════════════════════════════════════════════════════════
 * Cet écran garde sa grille de cartes plutôt que de passer au tableau : on y
 * cherche une PERSONNE, et un visage se reconnaît plus vite qu'une ligne. Le
 * tableau reste réservé aux écrans où l'on compare des valeurs (Jëfs, audit).
 *
 * Trois corrections de fond :
 *
 *   · Le filtre par rôle passe en `.ax-segment`. Il gardait ses compteurs —
 *     qui sont la vraie information de la barre — mais était peint à la main
 *     en `bg-muted/40` avec des libellés en `text-[11px] font-bold uppercase`,
 *     une graisse qu'on ne trouve nulle part ailleurs dans l'interface.
 *
 *   · Le filtre par statut n'existait pas. Sur un annuaire de plusieurs
 *     centaines de personnes, « qui reste à valider ? » est pourtant la
 *     question quotidienne d'un chef de Daara.
 *
 *   · La fiche s'ouvrait dans une modale à en-tête violet plein, dont le
 *     contraste et les arrondis ne suivaient ni le thème sombre ni l'accent.
 *     Elle passe sur <Modal>, donc sur la surface de verre Aurora.
 */

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  FileText,
  Mail,
  MapPin,
  Phone,
  Search,
  Shield,
  Users,
} from "lucide-react";
import { promoteUserToCollector } from "@/app/actions/directory";
import { EmptyState } from "@/components/ui/empty-state";
import { Avatar } from "@/components/vireo/Avatar";
import { FilterBar } from "@/components/vireo/FilterBar";
import { Modal } from "@/components/vireo/Modal";
import { Pagination } from "@/components/vireo/Pagination";
import { StatusBadge } from "@/components/vireo/StatusBadge";
import { ALL, useCollection } from "@/hooks/useCollection";

type Role = "chef_daara" | "collector" | "member";

const ROLE_LABELS: Record<Role, string> = {
  chef_daara: "Chef Daara",
  collector: "Talibé · Collecteur",
  member: "Talibé",
};

/* Le rôle est une qualité, pas un état : il reste en badge doux, sans la
   sémantique succès/alerte réservée aux statuts. */
const ROLE_BADGE: Record<Role, string> = {
  chef_daara: "ax-badge--info",
  collector: "ax-badge--accent",
  member: "ax-badge--neutral",
};

const FILTER_ROLES: (Role | typeof ALL)[] = [
  ALL,
  "member",
  "chef_daara",
  "collector",
];

type MemberRow = {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string | null;
  role: string;
  status: string;
  daara_name?: string | null;
  /*
   * ⚠️ `zone_name` et `zone_code` n'existent NULLE PART côté backend — ni dans
   * `UserSerializer`, ni dans `DirectoryUserSerializer`. Ils valaient donc
   * toujours `undefined`, et la ligne « LDD » affichait « Inconnue » sur
   * chaque fiche, y compris pour des membres dont le Daara a bel et bien une
   * zone. Les champs réels sont `ldd_name` et `daara.ldd.code`.
   *
   * Conservés en optionnel au cas où l'API les fournirait un jour, mais ils ne
   * sont plus la source de vérité.
   */
  zone_name?: string | null;
  zone_code?: string | null;
  /* La zone vient du Daara, via `DirectoryDaaraBriefSerializer`. */
  daara?: { id?: number; name?: string | null; ldd_code?: string | null; ldd_name?: string | null } | null;
  avatar?: string | null;
  avatar_url?: string | null;
  title?: string | null;
  documents_count?: number;
};

const fullName = (m: MemberRow) => `${m.first_name ?? ""} ${m.last_name ?? ""}`.trim();

export function MembersClient({
  initialMembers,
  viewerRole,
}: {
  initialMembers: MemberRow[];
  viewerRole: "admin" | "chef_daara" | "collector";
}) {
  const router = useRouter();
  const [detail, setDetail] = useState<MemberRow | null>(null);
  const [isPending, startTransition] = useTransition();
  const [promoteError, setPromoteError] = useState("");

  const searchable = useMemo(
    () => (m: MemberRow) => [m.first_name, m.last_name, m.email, m.phone, m.daara_name],
    [],
  );

  const filters = useMemo(
    () => ({
      role: (m: MemberRow, v: string) => m.role === v,
      status: (m: MemberRow, v: string) => m.status === v,
    }),
    [],
  );

  const c = useCollection(initialMembers, {
    searchable,
    filters,
    pageSize: 9,
  });

  /*
   * Compteurs par rôle — calculés sur l'ensemble, pas sur le filtré : le
   * compteur d'un onglet doit dire ce qu'on trouvera EN CLIQUANT dessus, sinon
   * chaque onglet non sélectionné afficherait zéro.
   */
  const roleCounts = useMemo(() => {
    const counts: Record<string, number> = { [ALL]: initialMembers.length };
    for (const m of initialMembers) counts[m.role] = (counts[m.role] ?? 0) + 1;
    return counts;
  }, [initialMembers]);

  const handlePromote = (id: number) => {
    setPromoteError("");
    startTransition(async () => {
      const res = await promoteUserToCollector(id);
      if (res.error) {
        setPromoteError(res.error);
        return;
      }
      setDetail(null);
      router.refresh();
    });
  };

  const activeRole = c.filter("role");

  return (
    <div className="flex flex-col gap-4">
      {/* Sélecteur de rôle — c'est la navigation principale de l'écran, donc
          au-dessus de la recherche et non noyé parmi les selects. */}
      <div className="ax-segment ax-scroll-x max-w-full" role="group" aria-label="Filtrer par rôle">
        {FILTER_ROLES.map((r) => (
          <button
            key={r}
            type="button"
            className="ax-segment__option"
            aria-pressed={activeRole === r}
            onClick={() => c.setFilter("role", r)}
          >
            {r === ALL ? "Tous" : ROLE_LABELS[r as Role]}
            <span className="ax-badge ax-badge--count ax-badge--sm">
              {roleCounts[r] ?? 0}
            </span>
          </button>
        ))}
      </div>

      <FilterBar
        searchValue={c.search}
        onSearchChange={c.setSearch}
        searchPlaceholder="Nom, e-mail, téléphone ou Daara…"
        resultCount={c.total}
        itemLabel="membre"
        filters={[
          {
            label: "Statut du compte",
            value: c.filter("status"),
            onChange: (v) => c.setFilter("status", v),
            options: [
              { value: ALL, label: "Tous les statuts" },
              { value: "active", label: "Actif" },
              { value: "pending", label: "À valider" },
              { value: "inactive", label: "Inactif" },
              { value: "blocked", label: "Bloqué" },
            ],
          },
        ]}
      />

      {c.total === 0 ? (
        <div className="ax-card">
          <div className="ax-card__body">
            <EmptyState
              icon={c.isFiltered ? Search : Users}
              tone={c.isFiltered ? "search" : "neutral"}
              title={
                c.isFiltered ? "Aucun membre ne correspond" : "Annuaire vide"
              }
              description={
                c.isFiltered
                  ? "Essayez un autre nom, ou remettez les filtres à zéro."
                  : "Les membres apparaîtront ici dès leur inscription validée."
              }
              action={
                c.isFiltered ? (
                  <button
                    type="button"
                    className="ax-btn ax-btn--outline"
                    onClick={c.resetFilters}
                  >
                    <span className="ax-btn__label">Réinitialiser les filtres</span>
                  </button>
                ) : undefined
              }
            />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {c.rows.map((m) => {
            const role = m.role as Role;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setDetail(m)}
                className="ax-card ax-card--interactive text-start"
              >
                <div className="ax-card__body flex items-center gap-4">
                  <Avatar
                    src={m.avatar || m.avatar_url}
                    name={fullName(m)}
                    size="lg"
                  />

                  <div className="min-w-0 flex-1">
                    <div className="ax-truncate font-semibold">{fullName(m)}</div>
                    <div className="ax-truncate ax-text-subtle text-xs">
                      {m.email}
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span
                        className={`ax-badge ax-badge--sm ${
                          ROLE_BADGE[role] ?? ROLE_BADGE.member
                        }`}
                      >
                        {ROLE_LABELS[role] ?? m.role}
                      </span>
                      {m.status !== "active" && (
                        <StatusBadge domain="user" value={m.status} size="sm" />
                      )}
                      {m.daara_name && (
                        <span className="ax-text-muted inline-flex items-center gap-1 text-xs">
                          <Building2 size={11} aria-hidden="true" />
                          {m.daara_name}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      <Pagination
        page={c.page}
        totalPages={c.totalPages}
        onPageChange={c.setPage}
        totalItems={c.total}
        pageSize={c.pageSize}
        itemLabel="membres"
      />

      <Modal
        open={Boolean(detail)}
        onOpenChange={(o) => {
          if (!o) {
            setDetail(null);
            setPromoteError("");
          }
        }}
        title={detail ? fullName(detail) : ""}
        description={
          detail
            ? (ROLE_LABELS[detail.role as Role] ?? detail.role)
            : undefined
        }
        footer={
          detail && (
            <>
              <button
                type="button"
                className="ax-btn ax-btn--ghost"
                onClick={() => setDetail(null)}
              >
                <span className="ax-btn__label">Fermer</span>
              </button>
              {detail.role === "member" &&
                (viewerRole === "chef_daara" || viewerRole === "admin") && (
                  <button
                    type="button"
                    className="ax-btn ax-btn--outline"
                    disabled={isPending}
                    onClick={() => handlePromote(detail.id)}
                  >
                    <span className="ax-btn__label">
                      {isPending ? "Nomination…" : "Nommer collecteur"}
                    </span>
                  </button>
                )}
              <button
                type="button"
                className="ax-btn ax-btn--primary"
                onClick={() => router.push(`/dashboard/users/${detail.id}`)}
              >
                <span className="ax-btn__label">Voir la fiche complète</span>
              </button>
            </>
          )
        }
      >
        {detail && (
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-4">
              <Avatar
                src={detail.avatar || detail.avatar_url}
                name={fullName(detail)}
                size="2xl"
              />
              <div className="flex flex-col gap-2">
                <StatusBadge domain="user" value={detail.status} />
                <span className="ax-text-muted inline-flex items-center gap-2 text-sm">
                  <Shield size={14} aria-hidden="true" />
                  {detail.title || "Talibé"}
                </span>
              </div>
            </div>

            <section className="flex flex-col gap-2">
              <h4 className="ax-eyebrow">Coordonnées</h4>
              <ul className="ax-list ax-list--compact">
                <li className="ax-list__row">
                  <Mail className="ax-list__leading" size={16} aria-hidden="true" />
                  <span className="ax-list__content">{detail.email}</span>
                </li>
                {detail.phone && (
                  <li className="ax-list__row">
                    <Phone className="ax-list__leading" size={16} aria-hidden="true" />
                    <span className="ax-list__content font-mono tabular">
                      {detail.phone}
                    </span>
                  </li>
                )}
              </ul>
            </section>

            <section className="flex flex-col gap-2">
              <h4 className="ax-eyebrow">Rattachement</h4>
              <ul className="ax-list ax-list--compact">
                <li className="ax-list__row">
                  <Building2 className="ax-list__leading" size={16} aria-hidden="true" />
                  <span className="ax-list__content">
                    <span className="ax-list__title">
                      {detail.daara_name || "Non assigné"}
                    </span>
                    <span className="ax-list__meta">Daara</span>
                  </span>
                </li>
                <li className="ax-list__row">
                  <MapPin className="ax-list__leading" size={16} aria-hidden="true" />
                  <span className="ax-list__content">
                    <span className="ax-list__title">
                      {detail.daara?.ldd_name || detail.zone_name || "Non renseignée"}
                      {detail.daara?.ldd_code || detail.zone_code
                        ? ` (${detail.daara?.ldd_code || detail.zone_code})`
                        : ""}
                    </span>
                    <span className="ax-list__meta">LDD</span>
                  </span>
                </li>
              </ul>
            </section>

            <div className="ax-alert ax-alert--neutral ax-alert--inline">
              <FileText className="ax-alert__icon" aria-hidden="true" />
              <div className="ax-alert__content">
                <p className="ax-alert__message">
                  {detail.documents_count || 0} document
                  {(detail.documents_count || 0) > 1 ? "s" : ""} soumis pour
                  validation
                </p>
              </div>
            </div>

            {promoteError && (
              <p className="ax-field__message ax-field__message--error">
                {promoteError}
              </p>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
