"use client";

/*
 * ═══════════════════════════════════════════════════════════════════════════
 * Les Fêtes
 * ═══════════════════════════════════════════════════════════════════════════
 * Repris du patron `pages/Events` de Vireo, qui traite exactement ce besoin :
 * une fête en vedette, une barre d'outils, des puces de filtre, une grille de
 * cartes à pastille de date.
 *
 * Ce que ce patron apporte et qui manquait ici :
 *
 *   · La PROCHAINE fête en vedette, en pleine largeur. C'est la seule
 *     information que tout le monde vient chercher — elle se trouvait jusqu'ici
 *     noyée dans une grille alphabétique, repérable au mieux par un badge
 *     « PROCHE » clignotant (`animate-pulse`, que rien ne justifie et que les
 *     préférences de mouvement réduit devraient désactiver).
 *
 *   · La pastille de date jour/mois. Sur une grille de fêtes, c'est la date
 *     qu'on balaie, pas le nom ; elle était reléguée en petit texte sous la
 *     description.
 *
 *   · Le filtre à venir / passées. Le modèle Django trie par NOM
 *     (`ordering = ['name']`), donc l'écran mélangeait les fêtes échues et
 *     celles à préparer, dans l'ordre de l'alphabet.
 *
 * Le compte à rebours remplace le badge « PROCHE » : « dans 5 jours » dit ce
 * que « PROCHE » laissait deviner.
 */

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bell,
  CalendarDays,
  ExternalLink,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import {
  addEvent,
  deleteEvent,
  notifyMembersAboutEvent,
  updateEvent,
} from "@/app/actions/events";
import { DatePicker } from "@/components/ui/DatePicker";
import { EmptyState } from "@/components/ui/empty-state";
import { DateTile } from "@/components/vireo/DateTile";
import { Menu } from "@/components/vireo/Menu";
import { Modal } from "@/components/vireo/Modal";
import { Pagination } from "@/components/vireo/Pagination";
import { ALL, useCollection } from "@/hooks/useCollection";

type Fete = {
  id: number;
  name: string;
  date?: string | null;
  description?: string | null;
  recurrence?: string;
  is_active?: boolean;
};

/** `events.Fete.Recurrence` */
const RECURRENCE_LABELS: Record<string, string> = {
  annual: "Annuelle",
  quarterly: "Trimestrielle",
  weekly: "Hebdomadaire",
  none: "Ponctuelle",
};

const RECURRENCE_CHIPS = [
  { value: ALL, label: "Toutes" },
  { value: "annual", label: "Annuelles" },
  { value: "quarterly", label: "Trimestrielles" },
  { value: "weekly", label: "Hebdomadaires" },
  { value: "none", label: "Ponctuelles" },
];

const longDate = new Intl.DateTimeFormat("fr-SN", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

/**
 * Jours restants avant la fête, en jours PLEINS depuis minuit — sinon une fête
 * du soir même aurait déjà basculé en « passée » l'après-midi.
 */
function daysUntil(dateStr?: string | null): number | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  return Math.round((d.getTime() - today.getTime()) / 86_400_000);
}

function countdownLabel(days: number | null): string {
  if (days === null) return "Date non renseignée";
  if (days === 0) return "C'est aujourd'hui";
  if (days === 1) return "Demain";
  if (days > 0) return `Dans ${days} jours`;
  if (days === -1) return "Hier";
  return `Il y a ${Math.abs(days)} jours`;
}

export function EventsClient({
  initialEvents,
  isAdmin,
}: {
  initialEvents: Fete[];
  isAdmin: boolean;
}) {
  const router = useRouter();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editing, setEditing] = useState<Fete | null>(null);
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState("");

  const searchable = useMemo(
    () => (f: Fete) => [f.name, f.description],
    [],
  );

  const filters = useMemo(
    () => ({
      recurrence: (f: Fete, v: string) => (f.recurrence ?? "annual") === v,
      when: (f: Fete, v: string) => {
        const d = daysUntil(f.date);
        if (d === null) return v === "undated";
        return v === "upcoming" ? d >= 0 : d < 0;
      },
    }),
    [],
  );

  const sorters = useMemo(
    () => ({
      /* Trié par proximité : la fête la plus imminente d'abord. Le backend
         ordonne par nom, ce qui n'a aucun sens pour un calendrier. */
      date: (f: Fete) => f.date ?? "9999-12-31",
      name: (f: Fete) => f.name,
    }),
    [],
  );

  const c = useCollection(initialEvents, {
    searchable,
    filters,
    sorters,
    initialSort: { key: "date", dir: "asc" },
    initialFilters: { when: "upcoming" },
    pageSize: 9,
  });

  /*
   * La fête en vedette est la prochaine à venir de TOUT le jeu, pas du jeu
   * filtré : elle reste le repère de l'écran même quand on fouille les fêtes
   * passées.
   */
  const featured = useMemo(() => {
    const upcoming = initialEvents
      .map((f) => ({ f, d: daysUntil(f.date) }))
      .filter((x) => x.d !== null && x.d >= 0)
      .sort((a, b) => (a.d as number) - (b.d as number));
    return upcoming[0]?.f ?? null;
  }, [initialEvents]);

  const whenValue = c.filter("when");

  const handleAdd = (formData: FormData) => {
    setErrorMsg("");
    startTransition(async () => {
      const res = await addEvent(formData);
      if (res.error) {
        setErrorMsg(res.error);
        return;
      }
      setIsCreateOpen(false);
      router.refresh();
      toast.success("Fête créée avec succès.");
    });
  };

  const handleUpdate = (formData: FormData) => {
    if (!editing) return;
    setErrorMsg("");
    startTransition(async () => {
      const res = await updateEvent(editing.id, formData);
      if (res.error) {
        setErrorMsg(res.error);
        return;
      }
      setEditing(null);
      router.refresh();
      toast.success("Fête mise à jour.");
    });
  };

  const handleDelete = (fete: Fete) => {
    toast(`Supprimer « ${fete.name} » ?`, {
      action: {
        label: "Confirmer",
        onClick: async () => {
          const { error } = await deleteEvent(fete.id);
          if (error) {
            toast.error(error);
            return;
          }
          router.refresh();
          toast.success("Fête supprimée.");
        },
      },
      cancel: { label: "Annuler", onClick: () => {} },
    });
  };

  const handleNotify = (id: number) => {
    startTransition(async () => {
      const res = await notifyMembersAboutEvent(id);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success(res.message ?? "Membres notifiés.");
    });
  };

  const adminMenu = (fete: Fete) => [
    { label: "Modifier", icon: Pencil, onSelect: () => setEditing(fete) },
    {
      label: "Notifier les membres",
      icon: Bell,
      onSelect: () => handleNotify(fete.id),
    },
    {
      label: "Supprimer",
      icon: Trash2,
      danger: true,
      separatorBefore: true,
      onSelect: () => handleDelete(fete),
    },
  ];

  /* Le formulaire est strictement le même en création et en édition : une
     seule définition, `fete` fournit les valeurs par défaut. */
  const renderForm = (fete: Fete | null, action: (fd: FormData) => void) => (
    <form action={action} className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="ax-field">
          <label className="ax-field__label" htmlFor={`name-${fete?.id ?? "new"}`}>
            Nom de la fête
            <span className="ax-field__required" aria-hidden="true"> *</span>
          </label>
          <input
            id={`name-${fete?.id ?? "new"}`}
            name="name"
            className="ax-input"
            defaultValue={fete?.name ?? ""}
            placeholder="Ex. Magal de Touba"
            required
          />
        </div>
        <div className="ax-field">
          <label className="ax-field__label">Date</label>
          <DatePicker name="event_date" defaultValue={fete?.date || ""} />
        </div>
      </div>

      <div className="ax-field">
        <label
          className="ax-field__label"
          htmlFor={`description-${fete?.id ?? "new"}`}
        >
          Description
        </label>
        <textarea
          id={`description-${fete?.id ?? "new"}`}
          name="description"
          rows={3}
          className="ax-textarea"
          defaultValue={fete?.description ?? ""}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="ax-field">
          <label
            className="ax-field__label"
            htmlFor={`recurrence-${fete?.id ?? "new"}`}
          >
            Récurrence
          </label>
          <select
            id={`recurrence-${fete?.id ?? "new"}`}
            name="recurrence"
            className="ax-select"
            defaultValue={fete?.recurrence ?? "annual"}
          >
            {Object.entries(RECURRENCE_LABELS).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </div>
        <div className="ax-field">
          <label
            className="ax-field__label"
            htmlFor={`is_active-${fete?.id ?? "new"}`}
          >
            Active
          </label>
          <select
            id={`is_active-${fete?.id ?? "new"}`}
            name="is_active"
            className="ax-select"
            defaultValue={fete ? String(fete.is_active) : "true"}
          >
            <option value="true">Oui</option>
            <option value="false">Non</option>
          </select>
          <p className="ax-field__hint">
            Une fête inactive reste consultable mais ne peut plus porter de
            nouveau Ndiguel.
          </p>
        </div>
      </div>

      {errorMsg && (
        <p className="ax-field__message ax-field__message--error">{errorMsg}</p>
      )}

      <button
        type="submit"
        className="ax-btn ax-btn--primary ax-btn--block"
        disabled={isPending}
      >
        <span className="ax-btn__label">
          {isPending
            ? "Enregistrement…"
            : fete
              ? "Sauvegarder les modifications"
              : "Enregistrer la fête"}
        </span>
      </button>
    </form>
  );

  return (
    <div className="flex flex-col gap-4">
      {/* ── Fête en vedette ── */}
      {featured && (
        <section
          className="ax-card ax-card--accent-edge"
          aria-label="Prochaine fête"
        >
          <div className="ax-card__body flex flex-wrap items-center gap-6">
            <DateTile date={featured.date} size="lg" />

            <div className="min-w-0 flex-1">
              <div className="ax-cluster mb-2 gap-2">
                <span className="ax-badge ax-badge--soft ax-badge--accent ax-badge--pill">
                  Prochaine fête
                </span>
                <span className="ax-badge ax-badge--outline ax-badge--sm">
                  {RECURRENCE_LABELS[featured.recurrence ?? "annual"]}
                </span>
              </div>

              <h2 className="ax-card__title">{featured.name}</h2>

              <div className="ax-cluster ax-text-muted mt-2 flex-wrap gap-4 text-sm">
                <span className="ax-cluster gap-1">
                  <CalendarDays size={16} aria-hidden="true" />
                  {featured.date ? longDate.format(new Date(featured.date)) : "—"}
                </span>
                <span className="ax-text-accent font-medium">
                  {countdownLabel(daysUntil(featured.date))}
                </span>
              </div>
            </div>

            <Link
              href={`/dashboard/events/${featured.id}`}
              className="ax-btn ax-btn--tonal"
            >
              <span className="ax-btn__label">Voir la fête</span>
              <ExternalLink className="ax-btn__icon" size={14} aria-hidden="true" />
            </Link>
          </div>
        </section>
      )}

      {/* ── Barre d'outils ── */}
      <section className="ax-card ax-card--compact" aria-label="Filtres">
        <div className="ax-card__body flex flex-wrap items-center gap-3">
          <div className="ax-field__control min-w-48 flex-1">
            <span className="ax-field__affix ax-field__affix--leading">
              <Search aria-hidden="true" />
            </span>
            <input
              type="search"
              className="ax-input ax-input--with-leading-icon"
              placeholder="Rechercher une fête…"
              value={c.search}
              onChange={(e) => c.setSearch(e.target.value)}
              aria-label="Rechercher une fête"
            />
          </div>

          <div className="ax-segment" role="group" aria-label="Période">
            {[
              { value: "upcoming", label: "À venir" },
              { value: "past", label: "Passées" },
              { value: ALL, label: "Toutes" },
            ].map((o) => (
              <button
                key={o.value}
                type="button"
                className="ax-segment__option"
                aria-pressed={whenValue === o.value}
                onClick={() => c.setFilter("when", o.value)}
              >
                {o.label}
              </button>
            ))}
          </div>

          {isAdmin && (
            <button
              type="button"
              className="ax-btn ax-btn--primary md:ms-auto"
              onClick={() => {
                setErrorMsg("");
                setIsCreateOpen(true);
              }}
            >
              <Plus className="ax-btn__icon" size={16} aria-hidden="true" />
              <span className="ax-btn__label">Nouvelle fête</span>
            </button>
          )}
        </div>
      </section>

      {/* ── Puces de récurrence ── */}
      <div className="ax-cluster gap-2" role="group" aria-label="Récurrence">
        {RECURRENCE_CHIPS.map((chip) => {
          const selected = c.filter("recurrence") === chip.value;
          return (
            <button
              key={chip.value}
              type="button"
              className={`ax-badge ax-badge--filter ax-badge--pill ${
                selected ? "is-selected" : ""
              }`}
              aria-pressed={selected}
              onClick={() => c.setFilter("recurrence", chip.value)}
            >
              {chip.label}
            </button>
          );
        })}
      </div>

      {/* ── Grille ── */}
      {c.total === 0 ? (
        <div className="ax-card">
          <div className="ax-card__body">
            <EmptyState
              icon={c.isFiltered ? Search : CalendarDays}
              tone={c.isFiltered ? "search" : "neutral"}
              title={
                c.isFiltered
                  ? "Aucune fête ne correspond"
                  : "Aucune fête enregistrée"
              }
              description={
                c.isFiltered
                  ? "Changez de période ou remettez les filtres à zéro."
                  : "Le calendrier des fêtes sert à rattacher les Ndiguels."
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
                ) : isAdmin ? (
                  <button
                    type="button"
                    className="ax-btn ax-btn--primary"
                    onClick={() => setIsCreateOpen(true)}
                  >
                    <Plus className="ax-btn__icon" size={16} aria-hidden="true" />
                    <span className="ax-btn__label">Nouvelle fête</span>
                  </button>
                ) : undefined
              }
            />
          </div>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {c.rows.map((fete) => {
            const days = daysUntil(fete.date);
            const past = days !== null && days < 0;

            return (
              <article key={fete.id} className="ax-card flex flex-col">
                <div className="ax-card__body flex flex-1 gap-4">
                  <DateTile date={fete.date} muted={past} />

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <Link
                        href={`/dashboard/events/${fete.id}`}
                        className="ax-card__title ax-clamp-2"
                      >
                        {fete.name}
                      </Link>
                      {isAdmin && (
                        <Menu
                          items={adminMenu(fete)}
                          label={`Actions pour ${fete.name}`}
                        />
                      )}
                    </div>

                    <p className="ax-text-muted ax-clamp-2 mt-1 text-sm">
                      {fete.description || "Aucune description."}
                    </p>

                    <p
                      className={`mt-2 text-xs font-medium ${
                        past ? "ax-text-subtle" : "ax-text-accent"
                      }`}
                    >
                      {countdownLabel(days)}
                    </p>
                  </div>
                </div>

                <div className="ax-card__footer">
                  <span className="ax-badge ax-badge--neutral ax-badge--sm">
                    {RECURRENCE_LABELS[fete.recurrence ?? "annual"]}
                  </span>
                  {fete.is_active === false && (
                    <span className="ax-badge ax-badge--warning ax-badge--sm">
                      Inactive
                    </span>
                  )}
                  <Link
                    href={`/dashboard/events/${fete.id}`}
                    className="ax-link ms-auto text-xs"
                  >
                    Détail
                  </Link>
                </div>
              </article>
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
        itemLabel="fêtes"
      />

      <Modal
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        title="Nouvelle fête"
        description="Elle pourra ensuite porter un ou plusieurs Ndiguels."
        size="lg"
      >
        {renderForm(null, handleAdd)}
      </Modal>

      <Modal
        open={Boolean(editing)}
        onOpenChange={(o) => !o && setEditing(null)}
        title="Modifier la fête"
        description={editing?.name}
        size="lg"
      >
        {editing && renderForm(editing, handleUpdate)}
      </Modal>
    </div>
  );
}
