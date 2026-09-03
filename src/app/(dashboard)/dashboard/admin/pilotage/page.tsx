"use client";

/*
 * ═══════════════════════════════════════════════════════════════════════════
 * Pilotage du système
 * ═══════════════════════════════════════════════════════════════════════════
 * Six sections empilées sur un seul défilement deviennent trois onglets, parce
 * qu'on vient ici pour deux raisons distinctes : RÉGLER quelque chose, ou
 * TRAITER une file d'attente. L'onglet « À traiter » regroupe tout ce qui
 * bloque quelqu'un — virements, demandes de titres, pièces d'identité — et
 * porte le total en attente, visible dès l'arrivée.
 *
 * Corrections de fond :
 *
 *   · Les notes de refus passaient par `window.prompt()`. Une boîte native
 *     bloquante, impossible à styler, sans libellé de champ, et qui ne dit pas
 *     ce qu'on est en train de refuser. Elles passent sur <Modal>, où l'on voit
 *     la demande concernée pendant qu'on écrit la note.
 *
 *   · Les boutons d'action étaient peints en `bg-green-600` et
 *     `border-red-300 text-red-600` : hors palette, insensibles au thème.
 *
 *   · Les libellés étaient saisis sans accents — « Pilotage du systeme »,
 *     « Confirmer la reception bancaire », « Creer une archive des Jefs ».
 *
 *   · Les compteurs « en attente » étaient des pastilles `bg-orange-100`
 *     collées au titre ; ils deviennent les badges des onglets.
 */

import { useEffect, useState, useTransition } from "react";
import {
  createTitle,
  deleteTitle,
  getPendingDocuments,
  getPilotageSettings,
  getTitleRequests,
  getTitles,
  reviewTitleRequest,
  updatePilotageSettings,
  validateDocument,
} from "@/app/actions/users";
import {
  confirmWireDonation,
  createDonationArchive,
  getArchiveDonations,
  getPendingWireDonations,
  listDonationArchives,
} from "@/app/actions/donations";
import {
  Archive as ArchiveIcon,
  BadgeCheck,
  Check,
  FileText,
  FileWarning,
  Inbox,
  Landmark,
  Loader2,
  Plus,
  Save,
  Settings,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { ExportButton } from "@/components/ExportButton";
import { EmptyState } from "@/components/ui/empty-state";
import { formatFCFA } from "@/components/charts/YessalCharts";
import { Modal } from "@/components/vireo/Modal";
import { PageHead } from "@/components/vireo/PageHead";
import { CoverImage } from "@/components/vireo/CoverImage";
import {
  PaymentMethodBadge,
  paymentMethodLabel,
  statusLabel,
} from "@/components/vireo/StatusBadge";

type PilotageSettings = { enable_salons: boolean };

type Title = {
  id: number;
  name: string;
  description?: string;
  is_active?: boolean;
};

type TitleRequest = {
  id: number;
  member_name?: string;
  title_name?: string;
  status: string;
  created_at: string;
};

type UserDocument = {
  id: number;
  user?: number;
  doc_type: string;
  image?: string;
  image_verso?: string;
  status: string;
  rejection_note?: string;
};

type Donation = {
  id: number;
  donor_name?: string;
  donor_daara_name?: string;
  campaign_name?: string;
  collector_name?: string;
  beneficiary_name?: string;
  amount: number | string;
  payment_method?: string;
  payment_status: string;
  wire_reference?: string;
  is_anonymous?: boolean;
  created_at: string;
};

type Archive = {
  id: number;
  name: string;
  total_count: number;
  total_amount: number;
  created_at: string;
};

/** `accounts.UserDocument.DocType` */
const DOC_TYPE_LABEL: Record<string, string> = {
  national_id: "Carte nationale d'identité",
  passport: "Passeport",
  voter_id: "Carte d'électeur",
  driver_license: "Permis de conduire",
};

const dateFmt = new Intl.DateTimeFormat("fr-SN", {
  day: "2-digit",
  month: "long",
  year: "numeric",
});

const shortDate = new Intl.DateTimeFormat("fr-SN", {
  day: "2-digit",
  month: "short",
});

type Tab = "queue" | "titles" | "archives" | "settings";

/** Refus en cours — la modale de note remplace `window.prompt()`. */
type RefusalTarget =
  | { kind: "title"; id: number; label: string }
  | { kind: "document"; id: number; label: string };

export default function PilotagePage() {
  const [settings, setSettings] = useState<PilotageSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [tab, setTab] = useState<Tab>("queue");

  const [titles, setTitles] = useState<Title[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [titleRequests, setTitleRequests] = useState<TitleRequest[]>([]);

  const [pendingDocs, setPendingDocs] = useState<UserDocument[]>([]);
  const [pendingWires, setPendingWires] = useState<Donation[]>([]);

  const [archives, setArchives] = useState<Archive[]>([]);
  const [archiveName, setArchiveName] = useState("");
  const [archiveDescription, setArchiveDescription] = useState("");
  const [archiveDetails, setArchiveDetails] = useState<Donation[]>([]);
  const [selectedArchiveId, setSelectedArchiveId] = useState<number | null>(null);

  const [lightboxDoc, setLightboxDoc] = useState<UserDocument | null>(null);
  const [refusal, setRefusal] = useState<RefusalTarget | null>(null);
  const [refusalNote, setRefusalNote] = useState("");

  const loadAll = async () => {
    setIsLoading(true);
    const [s, t, tr, pd, pw, ar] = await Promise.all([
      getPilotageSettings(),
      getTitles(),
      getTitleRequests(),
      getPendingDocuments(),
      getPendingWireDonations(),
      listDonationArchives(),
    ]);
    if (s.data) setSettings(s.data);
    setTitles(t.data || []);
    setTitleRequests(
      (tr.data || []).filter((x: TitleRequest) => x.status === "pending"),
    );
    setPendingDocs(pd.data || []);
    setPendingWires(pw.data || []);
    setArchives(ar.data || []);
    setIsLoading(false);
  };

  useEffect(() => {
    void loadAll();
  }, []);

  const queueCount =
    pendingWires.length + titleRequests.length + pendingDocs.length;

  const handleSaveSettings = () => {
    startTransition(async () => {
      if (!settings) return;
      const { error } = await updatePilotageSettings(settings);
      if (error) {
        toast.error(error);
        return;
      }
      toast.success("Réglages enregistrés.");
    });
  };

  const handleCreateTitle = () => {
    if (!newTitle.trim()) return;
    startTransition(async () => {
      const res = await createTitle({ name: newTitle.trim(), is_active: true });
      if (res.error) {
        toast.error(res.error);
        return;
      }
      setNewTitle("");
      toast.success("Titre créé.");
      void loadAll();
    });
  };

  const handleDeleteTitle = (title: Title) => {
    toast(`Supprimer le titre « ${title.name} » ?`, {
      action: {
        label: "Supprimer",
        onClick: () =>
          startTransition(async () => {
            const res = await deleteTitle(title.id);
            if (res.error) {
              toast.error(res.error);
              return;
            }
            toast.success("Titre supprimé.");
            void loadAll();
          }),
      },
      cancel: { label: "Annuler", onClick: () => {} },
    });
  };

  const handleApproveTitle = (id: number) => {
    startTransition(async () => {
      const res = await reviewTitleRequest(id, "approve", "");
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success("Demande approuvée.");
      void loadAll();
    });
  };

  const handleValidateDocument = (id: number) => {
    startTransition(async () => {
      const res = await validateDocument(id, "validated", "");
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success("Document validé.");
      void loadAll();
    });
  };

  /** Refus commun aux titres et aux documents, avec sa note. */
  const submitRefusal = () => {
    if (!refusal) return;
    const note = refusalNote.trim();

    startTransition(async () => {
      const res =
        refusal.kind === "title"
          ? await reviewTitleRequest(refusal.id, "refuse", note)
          : await validateDocument(refusal.id, "rejected", note);

      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success(
        refusal.kind === "title" ? "Demande refusée." : "Document rejeté.",
      );
      setRefusal(null);
      setRefusalNote("");
      void loadAll();
    });
  };

  const handleConfirmWire = (id: number) => {
    startTransition(async () => {
      const res = await confirmWireDonation(id);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success("Virement confirmé.");
      void loadAll();
    });
  };

  const handleCreateArchive = () => {
    if (!archiveName.trim()) {
      toast.error("Donnez un nom à l'archive.");
      return;
    }
    startTransition(async () => {
      const res = await createDonationArchive(
        archiveName.trim(),
        archiveDescription.trim(),
      );
      if (res.error) {
        toast.error(res.error);
        return;
      }
      setArchiveName("");
      setArchiveDescription("");
      toast.success("Archive créée.");
      void loadAll();
    });
  };

  const handleOpenArchive = (id: number) => {
    setSelectedArchiveId(id);
    startTransition(async () => {
      const res = await getArchiveDonations(id);
      setArchiveDetails(res.data || []);
    });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <PageHead role="admin" title="Pilotage du système" />
        <div className="ax-card">
          <div className="ax-card__body ax-center flex-col gap-3 py-16">
            <Loader2 className="ax-text-accent animate-spin" aria-hidden="true" />
            <p className="ax-text-muted text-sm">Chargement des réglages…</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHead
        role="admin"
        title="Pilotage du système"
        subtitle="Réglages généraux, files d'attente et archives."
        actions={
          <button
            type="button"
            className="ax-btn ax-btn--primary"
            onClick={handleSaveSettings}
            disabled={isPending}
          >
            {isPending ? (
              <Loader2 className="ax-btn__icon animate-spin" size={16} aria-hidden="true" />
            ) : (
              <Save className="ax-btn__icon" size={16} aria-hidden="true" />
            )}
            <span className="ax-btn__label">Enregistrer les réglages</span>
          </button>
        }
      />

      <div className="ax-tabs">
        <div className="ax-tabs__list" role="tablist">
          <button
            type="button"
            role="tab"
            className="ax-tabs__tab"
            aria-selected={tab === "queue"}
            onClick={() => setTab("queue")}
          >
            <Inbox className="ax-tabs__icon" size={15} aria-hidden="true" />À traiter
            {queueCount > 0 && (
              <span className="ax-tabs__badge ax-badge ax-badge--warning ax-badge--sm">
                {queueCount}
              </span>
            )}
          </button>
          <button
            type="button"
            role="tab"
            className="ax-tabs__tab"
            aria-selected={tab === "titles"}
            onClick={() => setTab("titles")}
          >
            <BadgeCheck className="ax-tabs__icon" size={15} aria-hidden="true" />
            Titres
            <span className="ax-tabs__badge ax-badge ax-badge--count ax-badge--sm">
              {titles.length}
            </span>
          </button>
          <button
            type="button"
            role="tab"
            className="ax-tabs__tab"
            aria-selected={tab === "archives"}
            onClick={() => setTab("archives")}
          >
            <ArchiveIcon className="ax-tabs__icon" size={15} aria-hidden="true" />
            Archives
            <span className="ax-tabs__badge ax-badge ax-badge--count ax-badge--sm">
              {archives.length}
            </span>
          </button>
          <button
            type="button"
            role="tab"
            className="ax-tabs__tab"
            aria-selected={tab === "settings"}
            onClick={() => setTab("settings")}
          >
            <Settings className="ax-tabs__icon" size={15} aria-hidden="true" />
            Réglages
          </button>
        </div>
      </div>

      {/* ══ À traiter ══ */}
      {tab === "queue" && (
        <div className="flex flex-col gap-4" role="tabpanel">
          {queueCount === 0 && (
            <div className="ax-card">
              <div className="ax-card__body">
                <EmptyState
                  icon={Inbox}
                  tone="success"
                  title="Rien à traiter"
                  description="Aucun virement, aucune demande de titre et aucune pièce d'identité en attente."
                />
              </div>
            </div>
          )}

          {/* Virements */}
          {pendingWires.length > 0 && (
            <section className="ax-card">
              <div className="ax-card__header">
                <span className="ax-card__kpi-icon ax-card__kpi-icon--c2" aria-hidden="true">
                  <Landmark />
                </span>
                <div className="ax-card__titles">
                  <h2 className="ax-card__title">Virements en attente</h2>
                  <p className="ax-card__subtitle">
                    Confirmez la réception bancaire.
                  </p>
                </div>
                <span className="ax-badge ax-badge--warning ax-badge--sm">
                  {pendingWires.length}
                </span>
              </div>

              <ul className="ax-list ax-list--comfortable">
                {pendingWires.map((wire) => (
                  <li key={wire.id} className="ax-list__row items-start">
                    <span className="ax-list__content gap-2">
                      <span className="ax-cluster flex-wrap gap-2">
                        <span className="ax-list__title font-mono">
                          JEF-{wire.id}
                        </span>
                        <span className="text-montant font-mono tabular font-semibold">
                          {formatFCFA(Number(wire.amount || 0))}
                        </span>
                        {wire.payment_method && (
                          <PaymentMethodBadge value={wire.payment_method} />
                        )}
                      </span>

                      <span className="ax-list__meta grid gap-x-4 gap-y-1 text-xs sm:grid-cols-2">
                        <span>
                          Donateur :{" "}
                          <span className="ax-text-strong">
                            {wire.is_anonymous
                              ? "Anonyme"
                              : wire.donor_name || "—"}
                          </span>
                        </span>
                        <span>
                          Daara :{" "}
                          <span className="ax-text-strong">
                            {wire.donor_daara_name || "—"}
                          </span>
                        </span>
                        <span>
                          Référence :{" "}
                          <span className="ax-text-strong font-mono tabular">
                            {wire.wire_reference || "—"}
                          </span>
                        </span>
                        <span>
                          Ndiguel :{" "}
                          <span className="ax-text-strong">
                            {wire.campaign_name || "—"}
                          </span>
                        </span>
                      </span>

                      <span className="ax-text-subtle text-xs">
                        {dateFmt.format(new Date(wire.created_at))}
                      </span>
                    </span>

                    <button
                      type="button"
                      className="ax-btn ax-btn--soft-success ax-btn--sm ax-list__trailing"
                      onClick={() => handleConfirmWire(wire.id)}
                      disabled={isPending}
                    >
                      <Check className="ax-btn__icon" size={14} aria-hidden="true" />
                      <span className="ax-btn__label">Confirmer</span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Demandes de titres */}
          {titleRequests.length > 0 && (
            <section className="ax-card">
              <div className="ax-card__header">
                <span className="ax-card__kpi-icon ax-card__kpi-icon--c4" aria-hidden="true">
                  <BadgeCheck />
                </span>
                <div className="ax-card__titles">
                  <h2 className="ax-card__title">Demandes de titres</h2>
                  <p className="ax-card__subtitle">
                    Approuvez ou refusez les demandes en attente.
                  </p>
                </div>
                <span className="ax-badge ax-badge--warning ax-badge--sm">
                  {titleRequests.length}
                </span>
              </div>

              <ul className="ax-list ax-list--comfortable">
                {titleRequests.map((req) => (
                  <li key={req.id} className="ax-list__row">
                    <span className="ax-list__content">
                      <span className="ax-list__title">{req.member_name}</span>
                      <span className="ax-list__meta">
                        demande le titre de{" "}
                        <span className="ax-text-strong">{req.title_name}</span>
                      </span>
                    </span>

                    <span className="ax-list__trailing gap-2">
                      <button
                        type="button"
                        className="ax-btn ax-btn--soft-success ax-btn--sm"
                        onClick={() => handleApproveTitle(req.id)}
                        disabled={isPending}
                      >
                        <Check className="ax-btn__icon" size={14} aria-hidden="true" />
                        <span className="ax-btn__label">Approuver</span>
                      </button>
                      <button
                        type="button"
                        className="ax-btn ax-btn--soft-danger ax-btn--sm"
                        onClick={() => {
                          setRefusalNote("");
                          setRefusal({
                            kind: "title",
                            id: req.id,
                            label: `${req.member_name} — ${req.title_name}`,
                          });
                        }}
                        disabled={isPending}
                      >
                        <X className="ax-btn__icon" size={14} aria-hidden="true" />
                        <span className="ax-btn__label">Refuser</span>
                      </button>
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Documents d'identité */}
          {pendingDocs.length > 0 && (
            <section className="ax-card">
              <div className="ax-card__header">
                <span className="ax-card__kpi-icon ax-card__kpi-icon--c3" aria-hidden="true">
                  <FileText />
                </span>
                <div className="ax-card__titles">
                  <h2 className="ax-card__title">Pièces d&apos;identité</h2>
                  <p className="ax-card__subtitle">
                    Vérifiez les pièces soumises par les membres.
                  </p>
                </div>
                <span className="ax-badge ax-badge--warning ax-badge--sm">
                  {pendingDocs.length}
                </span>
              </div>

              <div className="ax-card__body grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {pendingDocs.map((doc) => (
                  <article key={doc.id} className="ax-card ax-card--compact">
                    <div className="ax-card__body flex flex-col gap-3">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-sm font-medium">
                          {DOC_TYPE_LABEL[doc.doc_type] ?? doc.doc_type}
                        </h3>
                        <span className="ax-badge ax-badge--warning ax-badge--sm">
                          {statusLabel("document", "pending")}
                        </span>
                      </div>

                      {doc.image && (
                        <button
                          type="button"
                          onClick={() => setLightboxDoc(doc)}
                          className="w-full cursor-zoom-in"
                          aria-label="Agrandir le document"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={doc.image}
                            alt=""
                            className="h-32 w-full rounded-(--ax-radius-sm) border border-(--ax-border) object-cover"
                          />
                        </button>
                      )}

                      <div className="flex gap-2">
                        <button
                          type="button"
                          className="ax-btn ax-btn--soft-success ax-btn--sm flex-1"
                          onClick={() => handleValidateDocument(doc.id)}
                          disabled={isPending}
                        >
                          <Check className="ax-btn__icon" size={14} aria-hidden="true" />
                          <span className="ax-btn__label">Valider</span>
                        </button>
                        <button
                          type="button"
                          className="ax-btn ax-btn--soft-danger ax-btn--sm flex-1"
                          onClick={() => {
                            setRefusalNote("");
                            setRefusal({
                              kind: "document",
                              id: doc.id,
                              label:
                                DOC_TYPE_LABEL[doc.doc_type] ?? doc.doc_type,
                            });
                          }}
                          disabled={isPending}
                        >
                          <X className="ax-btn__icon" size={14} aria-hidden="true" />
                          <span className="ax-btn__label">Rejeter</span>
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {/* ══ Titres ══ */}
      {tab === "titles" && (
        <section className="ax-card" role="tabpanel">
          <div className="ax-card__header">
            <span className="ax-card__kpi-icon ax-card__kpi-icon--c1" aria-hidden="true">
              <BadgeCheck />
            </span>
            <div className="ax-card__titles">
              <h2 className="ax-card__title">Titres honorifiques</h2>
              <p className="ax-card__subtitle">
                Les titres attribuables aux membres de la confrérie.
              </p>
            </div>
          </div>

          <div className="ax-card__body flex flex-col gap-4">
            <div className="ax-input-group">
              <input
                className="ax-input"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Nouveau titre — Serigne, Mame…"
                aria-label="Nouveau titre honorifique"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleCreateTitle();
                  }
                }}
              />
              <button
                type="button"
                className="ax-btn ax-btn--primary"
                onClick={handleCreateTitle}
                disabled={isPending || !newTitle.trim()}
              >
                <Plus className="ax-btn__icon" size={16} aria-hidden="true" />
                <span className="ax-btn__label">Ajouter</span>
              </button>
            </div>

            {titles.length === 0 ? (
              <p className="ax-text-subtle text-sm italic">
                Aucun titre enregistré.
              </p>
            ) : (
              <ul className="ax-list ax-list--compact">
                {titles.map((t) => (
                  <li key={t.id} className="ax-list__row">
                    <span className="ax-list__content">
                      <span className="ax-list__title">{t.name}</span>
                      {t.description && (
                        <span className="ax-list__meta">{t.description}</span>
                      )}
                    </span>
                    <button
                      type="button"
                      className="ax-btn ax-btn--ghost-danger ax-btn--icon ax-list__trailing"
                      aria-label={`Supprimer le titre ${t.name}`}
                      onClick={() => handleDeleteTitle(t)}
                      disabled={isPending}
                    >
                      <Trash2 size={15} aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      )}

      {/* ══ Archives ══ */}
      {tab === "archives" && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3" role="tabpanel">
          <section className="ax-card lg:col-span-1">
            <div className="ax-card__header">
              <span className="ax-card__kpi-icon ax-card__kpi-icon--c1" aria-hidden="true">
                <ArchiveIcon />
              </span>
              <div className="ax-card__titles">
                <h2 className="ax-card__title">Archives des Jëfs</h2>
                <p className="ax-card__subtitle">
                  Fige l&apos;état des dons à un instant donné.
                </p>
              </div>
            </div>

            <div className="ax-card__body flex flex-col gap-4">
              <div className="ax-field">
                <label className="ax-field__label" htmlFor="archive-name">
                  Nom de l&apos;archive
                  <span className="ax-field__required" aria-hidden="true"> *</span>
                </label>
                <input
                  id="archive-name"
                  className="ax-input"
                  value={archiveName}
                  onChange={(e) => setArchiveName(e.target.value)}
                  placeholder="Ex. Magal 2026"
                />
              </div>

              <div className="ax-field">
                <label className="ax-field__label" htmlFor="archive-description">
                  Description
                </label>
                <input
                  id="archive-description"
                  className="ax-input"
                  value={archiveDescription}
                  onChange={(e) => setArchiveDescription(e.target.value)}
                  placeholder="Facultative"
                />
              </div>

              <button
                type="button"
                className="ax-btn ax-btn--primary ax-btn--block"
                onClick={handleCreateArchive}
                disabled={isPending || !archiveName.trim()}
              >
                <ArchiveIcon className="ax-btn__icon" size={16} aria-hidden="true" />
                <span className="ax-btn__label">Créer une archive</span>
              </button>

              {archives.length > 0 && (
                <ul className="ax-list ax-list--compact ax-list--selectable ax-scroll-y max-h-72">
                  {archives.map((a) => (
                    <li key={a.id}>
                      <button
                        type="button"
                        className={`ax-list__row w-full text-start ${
                          selectedArchiveId === a.id ? "is-active" : ""
                        }`}
                        onClick={() => handleOpenArchive(a.id)}
                      >
                        <span className="ax-list__content">
                          <span className="ax-list__title">{a.name}</span>
                          <span className="ax-list__meta text-xs">
                            {shortDate.format(new Date(a.created_at))} ·{" "}
                            {a.total_count} Jëfs ·{" "}
                            {formatFCFA(Number(a.total_amount))}
                          </span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          <section className="ax-card lg:col-span-2">
            <div className="ax-card__header">
              <div className="ax-card__titles">
                <h2 className="ax-card__title">
                  {selectedArchiveId
                    ? `Contenu de l'archive #${selectedArchiveId}`
                    : "Contenu de l'archive"}
                </h2>
                {selectedArchiveId && (
                  <p className="ax-card__subtitle">
                    {archiveDetails.length} Jëfs ·{" "}
                    {formatFCFA(
                      archiveDetails.reduce(
                        (s, d) => s + Number(d.amount || 0),
                        0,
                      ),
                    )}
                  </p>
                )}
              </div>

              {archiveDetails.length > 0 && (
                <ExportButton
                  data={archiveDetails.map((d) => ({
                    Réf: `JEF-${d.id}`,
                    Donateur: d.is_anonymous ? "Anonyme" : d.donor_name || "—",
                    Daara: d.donor_daara_name || "—",
                    Ndiguel: d.campaign_name || "—",
                    Collecteur: d.collector_name || "—",
                    Méthode: paymentMethodLabel(d.payment_method),
                    Montant_FCFA: Number(d.amount || 0),
                    Statut: statusLabel("payment", d.payment_status),
                    Référence_bancaire: d.wire_reference || "—",
                    Date: new Date(d.created_at).toLocaleDateString("fr-SN"),
                  }))}
                  filename={`archive-${selectedArchiveId}-jefs`}
                  label="Exporter CSV"
                  format="csv"
                  variant="outline"
                />
              )}
            </div>

            {!selectedArchiveId ? (
              <div className="ax-card__body">
                <EmptyState
                  icon={ArchiveIcon}
                  title="Aucune archive sélectionnée"
                  description="Choisissez une archive dans la liste pour en voir le contenu."
                />
              </div>
            ) : archiveDetails.length === 0 ? (
              <div className="ax-card__body">
                <p className="ax-text-subtle text-center text-sm italic">
                  Cette archive ne contient aucun Jëf.
                </p>
              </div>
            ) : (
              <div className="ax-table-wrap ax-scroll-y max-h-128">
                <table className="ax-table ax-table--compact ax-table--hover ax-table--sticky">
                  <caption className="ax-visually-hidden">
                    Jëfs de l&apos;archive #{selectedArchiveId}
                  </caption>
                  <thead className="ax-table__head">
                    <tr>
                      <th scope="col" className="ax-table__th">
                        Réf.
                      </th>
                      <th scope="col" className="ax-table__th">
                        Donateur
                      </th>
                      <th scope="col" className="ax-table__th hidden lg:table-cell">
                        Daara
                      </th>
                      <th scope="col" className="ax-table__th hidden md:table-cell">
                        Ndiguel
                      </th>
                      <th scope="col" className="ax-table__th hidden sm:table-cell">
                        Méthode
                      </th>
                      <th scope="col" className="ax-table__th ax-table__th--num">
                        Montant
                      </th>
                      <th scope="col" className="ax-table__th ax-table__th--num">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {archiveDetails.map((d) => (
                      <tr key={d.id} className="ax-table__row">
                        <td className="ax-table__td ax-text-subtle font-mono text-xs">
                          JEF-{d.id}
                        </td>
                        <td className="ax-table__td font-medium">
                          {d.is_anonymous ? "Anonyme" : d.donor_name || "—"}
                        </td>
                        <td className="ax-table__td ax-text-muted hidden lg:table-cell">
                          {d.donor_daara_name || "—"}
                        </td>
                        <td className="ax-table__td ax-text-muted hidden md:table-cell">
                          {d.campaign_name || "—"}
                        </td>
                        <td className="ax-table__td hidden sm:table-cell">
                          <PaymentMethodBadge value={d.payment_method} />
                        </td>
                        <td className="ax-table__td ax-table__td--num text-montant font-semibold">
                          {formatFCFA(Number(d.amount || 0))}
                        </td>
                        <td className="ax-table__td ax-table__td--num ax-text-muted text-xs">
                          {shortDate.format(new Date(d.created_at))}
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

      {/* ══ Réglages ══ */}
      {tab === "settings" && (
        <section className="ax-card" role="tabpanel">
          <div className="ax-card__header">
            <span className="ax-card__kpi-icon ax-card__kpi-icon--c1" aria-hidden="true">
              <Settings />
            </span>
            <div className="ax-card__titles">
              <h2 className="ax-card__title">Messagerie</h2>
              <p className="ax-card__subtitle">
                Active ou désactive les salons de discussion pour tout le réseau.
              </p>
            </div>
          </div>

          <div className="ax-card__body">
            <label className="ax-toggle">
              <input
                type="checkbox"
                className="ax-toggle__input"
                checked={settings?.enable_salons ?? false}
                onChange={(e) => setSettings({ enable_salons: e.target.checked })}
              />
              <span className="ax-toggle__track">
                <span className="ax-toggle__thumb" />
              </span>
              <span className="ax-toggle__label">
                Activer les salons de discussion
              </span>
            </label>

            <p className="ax-field__hint mt-2">
              Désactivés, les salons disparaissent de la navigation et les
              invitations en cours restent sans effet.
            </p>
          </div>
        </section>
      )}

      {/* ── Note de refus (remplace window.prompt) ── */}
      <Modal
        open={Boolean(refusal)}
        onOpenChange={(o) => {
          if (!o) {
            setRefusal(null);
            setRefusalNote("");
          }
        }}
        title={
          refusal?.kind === "title" ? "Refuser la demande" : "Rejeter le document"
        }
        description={refusal?.label}
        status="warning"
        size="sm"
        footer={
          <>
            <button
              type="button"
              className="ax-btn ax-btn--ghost"
              onClick={() => setRefusal(null)}
            >
              <span className="ax-btn__label">Annuler</span>
            </button>
            <button
              type="button"
              className="ax-btn ax-btn--danger"
              onClick={submitRefusal}
              disabled={isPending}
            >
              <span className="ax-btn__label">
                {refusal?.kind === "title" ? "Refuser" : "Rejeter"}
              </span>
            </button>
          </>
        }
      >
        <div className="ax-field">
          <label className="ax-field__label" htmlFor="refusal-note">
            Motif
          </label>
          <textarea
            id="refusal-note"
            rows={4}
            className="ax-textarea"
            value={refusalNote}
            onChange={(e) => setRefusalNote(e.target.value)}
            placeholder="Ce motif sera visible par le membre."
          />
          <p className="ax-field__hint">
            Facultatif, mais un refus sans explication oblige le membre à
            deviner ce qu&apos;il doit corriger.
          </p>
        </div>
      </Modal>

      {/* ── Agrandissement d'un document ── */}
      <Modal
        open={Boolean(lightboxDoc)}
        onOpenChange={(o) => !o && setLightboxDoc(null)}
        title={
          lightboxDoc
            ? (DOC_TYPE_LABEL[lightboxDoc.doc_type] ?? lightboxDoc.doc_type)
            : ""
        }
        size="lg"
      >
        {lightboxDoc && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {(["image", "image_verso"] as const).map((key) => {
              const src = lightboxDoc[key];
              if (!src) return null;
              const label = key === "image" ? "Recto" : "Verso";
              return (
                <figure key={key} className="flex flex-col gap-1">
                  <figcaption className="ax-eyebrow">{label}</figcaption>
                  <a href={src} target="_blank" rel="noopener noreferrer">
                    {/*
                      Un fichier manquant doit se DIRE, pas se deviner. Une
                      vignette cassée peut passer pour un défaut d'affichage,
                      et rien n'est plus fâcheux ici : on valide une pièce
                      d'identité. <CoverImage> affiche l'icône d'alerte, qui
                      ne ressemble à aucun document valide.
                    */}
                    <CoverImage
                      src={src}
                      alt={`${label} du document`}
                      icon={FileWarning}
                      iconSize={40}
                      className="w-full rounded-(--ax-radius-sm) border border-(--ax-border)"
                      fallbackClassName="aspect-3/2 w-full rounded-(--ax-radius-sm) border border-(--ax-border)"
                    />
                  </a>
                </figure>
              );
            })}
          </div>
        )}
      </Modal>
    </div>
  );
}
