"use client";

/*
 * ═══════════════════════════════════════════════════════════════════════════
 * Centre des annonces
 * ═══════════════════════════════════════════════════════════════════════════
 * Le sélecteur de Daara passe sur le contrat `.ax-combobox` de Vireo, qui
 * existe précisément pour ce cas : une liste longue, groupée, avec recherche.
 * Il était jusqu'ici composé à la main dans un Popover, avec ses propres
 * dimensions (`w-[400px]`, `h-[350px]`) et un en-tête de groupe peint en
 * `bg-yessal-violet/5` — donc insensible à l'accent.
 *
 * Autres corrections :
 *
 *   · Le liseré d'urgence était posé en `absolute left-0 top-0` dans un
 *     conteneur SANS `position: relative`. Il se plaçait donc par rapport à un
 *     ancêtre quelconque, pas par rapport à la carte. L'urgence est désormais
 *     portée par le ton du badge, qui suit le thème.
 *
 *   · Aucune recherche ni filtre sur l'historique, alors que les annonces
 *     s'accumulent sans limite. Ajout d'une <FilterBar> et d'une pagination.
 *
 *   · `daaras: any[]` devient une forme explicite.
 *
 *   · Le formulaire proposait « Portée : spécifique à un Daara » et un
 *     sélecteur de Daara comme deux champs indépendants — on pouvait donc
 *     choisir « Réseau global » ET un Daara, ou l'inverse. Le sélecteur
 *     n'apparaît maintenant que si la portée le demande.
 */

import { useMemo, useState } from "react";
import {
  AlertCircle,
  AlertTriangle,
  Building2,
  Calendar,
  Globe,
  Info,
  Megaphone,
  Plus,
  Search,
  Trash2,
  UserCheck,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { EmptyState } from "@/components/ui/empty-state";
import {
  DaaraCombobox,
  type DaaraOption,
} from "@/components/vireo/DaaraCombobox";
import { FilterBar } from "@/components/vireo/FilterBar";
import { Modal } from "@/components/vireo/Modal";
import { Pagination } from "@/components/vireo/Pagination";
import { createAnnouncement, deleteAnnouncement } from "@/app/actions/announcements";
import { ALL, useCollection } from "@/hooks/useCollection";

export interface Announcement {
  id: number;
  title: string;
  content: string;
  target: string;
  daara_name: string;
  urgency: "info" | "warning" | "critical";
  target_role: string;
  is_published: boolean;
  created_at: string;
}

export type { DaaraOption };

/** `comms.Announcement.Urgency` */
const URGENCY: Record<string, { label: string; cls: string; icon: LucideIcon }> = {
  info: { label: "Information", cls: "ax-badge--info", icon: Info },
  warning: { label: "Avertissement", cls: "ax-badge--warning", icon: AlertTriangle },
  critical: { label: "Critique", cls: "ax-badge--danger", icon: AlertCircle },
};

/** `comms.Announcement.TargetRole` */
const TARGET_ROLE_LABEL: Record<string, string> = {
  all: "Tout public",
  member: "Talibés",
  chef_daara: "Chefs de Daara",
  collector: "Collecteurs",
  admin: "Administrateurs",
};

const dateFmt = new Intl.DateTimeFormat("fr-SN", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

/* ── Écran ─────────────────────────────────────────────────────────────── */

export function AnnouncementManagementClient({
  initialAnnouncements,
  daaras,
}: {
  initialAnnouncements: Announcement[];
  daaras: DaaraOption[];
}) {
  const router = useRouter();
  const [announcements, setAnnouncements] = useState(initialAnnouncements);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedDaaraId, setSelectedDaaraId] = useState("NONE");
  const [scope, setScope] = useState("global");
  const [isSaving, setIsSaving] = useState(false);

  const searchable = useMemo(
    () => (a: Announcement) => [a.title, a.content, a.daara_name],
    [],
  );

  const filters = useMemo(
    () => ({
      urgency: (a: Announcement, v: string) => a.urgency === v,
      target: (a: Announcement, v: string) => a.target === v,
    }),
    [],
  );

  const sorters = useMemo(
    () => ({ date: (a: Announcement) => a.created_at }),
    [],
  );

  const c = useCollection(announcements, {
    searchable,
    filters,
    sorters,
    initialSort: { key: "date", dir: "desc" },
    pageSize: 10,
  });

  const handleDelete = (ann: Announcement) => {
    toast(`Supprimer « ${ann.title} » ?`, {
      action: {
        label: "Supprimer",
        onClick: async () => {
          const { error } = await deleteAnnouncement(ann.id);
          if (error) {
            toast.error("Impossible de supprimer l'annonce.");
            return;
          }
          setAnnouncements((prev) => prev.filter((a) => a.id !== ann.id));
          toast.success("Annonce supprimée.");
        },
      },
      cancel: { label: "Annuler", onClick: () => {} },
    });
  };

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const data = Object.fromEntries(new FormData(e.currentTarget));
      const { error, data: created } = await createAnnouncement(data);
      if (error) {
        toast.error(error);
        return;
      }
      setAnnouncements((prev) => [created as Announcement, ...prev]);
      setIsAddOpen(false);
      setSelectedDaaraId("NONE");
      setScope("global");
      toast.success("Annonce diffusée.");
      router.refresh();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <FilterBar
        searchValue={c.search}
        onSearchChange={c.setSearch}
        searchPlaceholder="Titre, contenu ou Daara…"
        resultCount={c.total}
        itemLabel="annonce"
        filters={[
          {
            label: "Niveau d'urgence",
            value: c.filter("urgency"),
            onChange: (v) => c.setFilter("urgency", v),
            options: [
              { value: ALL, label: "Toutes les urgences" },
              { value: "info", label: "Information" },
              { value: "warning", label: "Avertissement" },
              { value: "critical", label: "Critique" },
            ],
          },
          {
            label: "Portée",
            value: c.filter("target"),
            onChange: (v) => c.setFilter("target", v),
            options: [
              { value: ALL, label: "Toutes les portées" },
              { value: "global", label: "Réseau global" },
              { value: "daara_only", label: "Un Daara" },
            ],
          },
        ]}
        actions={
          <button
            type="button"
            className="ax-btn ax-btn--primary"
            onClick={() => setIsAddOpen(true)}
          >
            <Plus className="ax-btn__icon" size={16} aria-hidden="true" />
            <span className="ax-btn__label">Nouvelle diffusion</span>
          </button>
        }
      />

      {c.total === 0 ? (
        <div className="ax-card">
          <div className="ax-card__body">
            <EmptyState
              icon={c.isFiltered ? Search : Megaphone}
              tone={c.isFiltered ? "search" : "neutral"}
              title={
                c.isFiltered
                  ? "Aucune annonce ne correspond"
                  : "Aucune annonce diffusée"
              }
              description={
                c.isFiltered
                  ? "Élargissez la recherche ou remettez les filtres à zéro."
                  : "Les messages officiels adressés au réseau apparaîtront ici."
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
                ) : (
                  <button
                    type="button"
                    className="ax-btn ax-btn--primary"
                    onClick={() => setIsAddOpen(true)}
                  >
                    <Plus className="ax-btn__icon" size={16} aria-hidden="true" />
                    <span className="ax-btn__label">Nouvelle diffusion</span>
                  </button>
                )
              }
            />
          </div>
        </div>
      ) : (
        <div className="ax-card">
          <ul className="ax-list ax-list--comfortable">
            {c.rows.map((ann) => {
              const u = URGENCY[ann.urgency] ?? URGENCY.info;
              const UrgencyIcon = u.icon;

              return (
                <li key={ann.id} className="ax-list__row items-start">
                  <UrgencyIcon
                    className="ax-list__leading mt-1"
                    size={18}
                    aria-hidden="true"
                  />

                  <span className="ax-list__content gap-2">
                    <span className="ax-list__title">{ann.title}</span>
                    <span className="ax-list__meta ax-clamp-2 whitespace-pre-wrap">
                      {ann.content}
                    </span>

                    <span className="ax-cluster flex-wrap gap-2 pt-1">
                      <span className={`ax-badge ax-badge--sm ${u.cls}`}>
                        {u.label}
                      </span>

                      <span className="ax-badge ax-badge--outline ax-badge--sm">
                        {ann.target === "global" ? (
                          <Globe className="ax-badge__icon" aria-hidden="true" />
                        ) : (
                          <Building2 className="ax-badge__icon" aria-hidden="true" />
                        )}
                        {ann.target === "global"
                          ? "Réseau global"
                          : ann.daara_name || "Daara"}
                      </span>

                      <span className="ax-badge ax-badge--neutral ax-badge--sm">
                        <UserCheck className="ax-badge__icon" aria-hidden="true" />
                        {TARGET_ROLE_LABEL[ann.target_role] ?? ann.target_role}
                      </span>

                      <span className="ax-text-subtle ax-cluster gap-1 text-xs">
                        <Calendar size={11} aria-hidden="true" />
                        {dateFmt.format(new Date(ann.created_at))}
                      </span>
                    </span>
                  </span>

                  <button
                    type="button"
                    className="ax-btn ax-btn--ghost-danger ax-btn--icon ax-list__trailing"
                    aria-label={`Supprimer « ${ann.title} »`}
                    onClick={() => handleDelete(ann)}
                  >
                    <Trash2 size={16} aria-hidden="true" />
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <Pagination
        page={c.page}
        totalPages={c.totalPages}
        onPageChange={c.setPage}
        totalItems={c.total}
        pageSize={c.pageSize}
        itemLabel="annonces"
      />

      {/* ── Diffusion ── */}
      <Modal
        open={isAddOpen}
        onOpenChange={setIsAddOpen}
        title="Diffuser un message"
        description="Ciblez les membres qui doivent recevoir cette information."
        size="lg"
      >
        <form onSubmit={handleCreate} className="flex flex-col gap-4">
          <div className="ax-field">
            <label className="ax-field__label" htmlFor="ann-title">
              Sujet
              <span className="ax-field__required" aria-hidden="true"> *</span>
            </label>
            <input
              id="ann-title"
              name="title"
              className="ax-input"
              placeholder="Ex. Report du Magal"
              required
            />
          </div>

          <div className="ax-field">
            <label className="ax-field__label" htmlFor="ann-content">
              Message
              <span className="ax-field__required" aria-hidden="true"> *</span>
            </label>
            <textarea
              id="ann-content"
              name="content"
              rows={5}
              className="ax-textarea"
              placeholder="Que voulez-vous dire à la communauté ?"
              required
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="ax-field">
              <label className="ax-field__label" htmlFor="ann-urgency">
                Niveau d&apos;urgence
              </label>
              <select
                id="ann-urgency"
                name="urgency"
                className="ax-select"
                defaultValue="info"
              >
                <option value="info">Information</option>
                <option value="warning">Avertissement</option>
                <option value="critical">Critique</option>
              </select>
              <p className="ax-field__hint">
                « Critique » déclenche une notification poussée.
              </p>
            </div>

            <div className="ax-field">
              <label className="ax-field__label" htmlFor="ann-role">
                Destinataires
              </label>
              <select
                id="ann-role"
                name="target_role"
                className="ax-select"
                defaultValue="all"
              >
                {Object.entries(TARGET_ROLE_LABEL).map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="ax-field">
            <label className="ax-field__label" htmlFor="ann-target">
              Portée
            </label>
            <select
              id="ann-target"
              name="target"
              className="ax-select"
              value={scope}
              onChange={(e) => setScope(e.target.value)}
            >
              <option value="global">Réseau global — tout Yessal</option>
              <option value="daara_only">Un Daara en particulier</option>
            </select>
          </div>

          {/*
            Le sélecteur de Daara n'apparaît que si la portée l'exige. Les deux
            champs étaient auparavant indépendants : on pouvait choisir
            « Réseau global » tout en désignant un Daara, sans savoir lequel
            l'emportait.
          */}
          {scope === "daara_only" && (
            <div className="ax-field">
              <span className="ax-field__label">Daara concerné</span>
              <DaaraCombobox
                daaras={daaras}
                value={selectedDaaraId}
                onChange={setSelectedDaaraId}
                neutralValue="NONE"
                neutralLabel="Tous les Daaras"
              />
            </div>
          )}

          <input type="hidden" name="daara" value={selectedDaaraId} />

          <button
            type="submit"
            className="ax-btn ax-btn--primary ax-btn--lg ax-btn--block"
            disabled={isSaving}
          >
            <Megaphone className="ax-btn__icon" size={18} aria-hidden="true" />
            <span className="ax-btn__label">
              {isSaving ? "Diffusion…" : "Lancer la diffusion"}
            </span>
          </button>
        </form>
      </Modal>
    </div>
  );
}
