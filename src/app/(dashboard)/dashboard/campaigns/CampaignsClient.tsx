"use client";

/*
 * ═══════════════════════════════════════════════════════════════════════════
 * Les Ndiguels
 * ═══════════════════════════════════════════════════════════════════════════
 * L'écran central du produit : une grille de cartes média, une par campagne.
 *
 * Quatre problèmes de fond corrigés ici :
 *
 *   · Les deux modales (« Gérer » et « Faire un Jëf ») étaient des `<div>`
 *     posées en `fixed inset-0`. Aucun piège de focus, aucune fermeture par
 *     Échap, aucun retour du focus au bouton d'origine : au clavier, ouvrir la
 *     modale de paiement laissait l'utilisateur bloqué derrière elle. Elles
 *     passent sur <Modal>, donc sur les primitives Radix.
 *
 *   · Le statut s'affichait en anglais brut — « active », « completed » — dans
 *     une pastille peinte en `rgba(145,110,231,0.85)` codée en dur, insensible
 *     au thème. Il passe par <StatusBadge>, qui parle français.
 *
 *   · Les six moyens de paiement étaient six blocs de huit lignes recopiés,
 *     chacun avec un `onClick` sur le label EN PLUS du `onChange` du radio —
 *     donc un double déclenchement. Ils deviennent une seule liste mappée sur
 *     des vrais radios stylés `.ax-segment`.
 *
 *   · La pagination ne disait que « Page 2 sur 5 » sans permettre d'aller à la
 *     fin.
 */

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  ChevronRight,
  Circle,
  CreditCard,
  MessageSquare,
  Pencil,
  Plus,
  Settings2,
  Target,
  Trash2,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { makeDonation, payDonation } from "@/app/actions/donations";
import {
  addCampaignTodo,
  deleteCampaign,
  getCampaignOrganizerDirectory,
  toggleCampaignTodo,
} from "@/app/actions/campaigns";
import { createChat } from "@/app/actions/comms";
import { EmptyState } from "@/components/ui/empty-state";
import { roleLabel } from "@/lib/roles";
import { formatFCFA } from "@/components/charts/YessalCharts";
import { Modal } from "@/components/vireo/Modal";
import { Pagination } from "@/components/vireo/Pagination";
import { PaymentMethodPicker } from "@/components/vireo/PaymentMethodPicker";
import { StatusBadge } from "@/components/vireo/StatusBadge";
import { CoverImage } from "@/components/vireo/CoverImage";
import { ALL, useCollection } from "@/hooks/useCollection";

type Todo = {
  id: number;
  title: string;
  is_completed: boolean;
};

type OrganizerUser = {
  id: number;
  first_name: string;
  last_name: string;
  role: string;
  daara_name?: string | null;
};

type CampaignCard = {
  id: number | string;
  name: string;
  description?: string | null;
  objective?: string | null;
  status: string;
  effective_status?: string;
  goal_amount: number;
  collected_amount?: number | null;
  organizer?: number | null;
  organizer_name?: string | null;
  organizer_role?: string | null;
  todos?: Todo[];
  is_manageable?: boolean;
  days_remaining?: number;
  illustrative_photo?: string | null;
};

const STATUS_TABS = [
  { value: ALL, label: "Tous" },
  { value: "active", label: "En cours" },
  { value: "pending", label: "À venir" },
  { value: "inactive", label: "Suspendus" },
  { value: "completed", label: "Terminés" },
];

const statusOf = (c: CampaignCard) => c.effective_status ?? c.status;

export function CampaignsClient({
  initialCampaigns,
  isAdmin,
  canUseDonationPage,
}: {
  initialCampaigns: CampaignCard[];
  isAdmin: boolean;
  canUseDonationPage: boolean;
}) {
  const router = useRouter();
  const [isDonationOpen, setIsDonationOpen] = useState(false);
  const [isManageOpen, setIsManageOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<CampaignCard | null>(
    null,
  );
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState("");
  const [newTodoTitle, setNewTodoTitle] = useState("");
  const [organizerUsers, setOrganizerUsers] = useState<OrganizerUser[]>([]);
  const [organizerUsersError, setOrganizerUsersError] = useState("");
  const [chatName, setChatName] = useState("");
  const [selectedAssistantIds, setSelectedAssistantIds] = useState<number[]>([]);
  const [assistantSearch, setAssistantSearch] = useState("");
  const [selectedMethod, setSelectedMethod] = useState("orange_money");

  const filters = useMemo(
    () => ({ status: (c: CampaignCard, v: string) => statusOf(c) === v }),
    [],
  );

  const c = useCollection(initialCampaigns, { filters, pageSize: 6 });

  /* Compteurs d'onglets, calculés sur l'ensemble : un onglet doit annoncer ce
     qu'il contient, pas ce que le filtre courant laisse passer. */
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { [ALL]: initialCampaigns.length };
    for (const camp of initialCampaigns) {
      const s = statusOf(camp);
      counts[s] = (counts[s] ?? 0) + 1;
    }
    return counts;
  }, [initialCampaigns]);

  useEffect(() => {
    if (!isManageOpen || !selectedCampaign) return;

    let cancelled = false;
    setOrganizerUsers([]);
    setOrganizerUsersError("");
    setSelectedAssistantIds([]);
    setAssistantSearch("");
    setChatName(`Organisation — ${selectedCampaign.name}`);

    startTransition(async () => {
      const res = await getCampaignOrganizerDirectory(
        Number(selectedCampaign.id),
      );
      if (cancelled) return;
      if (res.error) {
        setOrganizerUsersError(res.error);
        return;
      }
      const raw = res.data as { eligible_users?: OrganizerUser[] } | undefined;
      setOrganizerUsers(raw?.eligible_users ?? []);
    });

    return () => {
      cancelled = true;
    };
  }, [isManageOpen, selectedCampaign]);

  const handleDonation = async (formData: FormData) => {
    setErrorMsg("");
    const paymentMethod = formData.get("paymentMethod") as string;

    startTransition(async () => {
      const res = await makeDonation(formData);
      if (res.error) {
        setErrorMsg(res.error);
        return;
      }

      const donation = res.data;

      // Collecte physique : rien à payer en ligne, on notifie les responsables.
      if (paymentMethod === "collector") {
        setIsDonationOpen(false);
        toast.success(
          "Demande de collecte enregistrée. Les responsables ont été notifiés.",
        );
        return;
      }

      // Paiement digital : on enchaîne sur Bictorys.
      if (paymentMethod !== "paypal") {
        const payRes = await payDonation(donation.id, paymentMethod);
        if (payRes.error) {
          setErrorMsg(payRes.error);
          return;
        }

        if (paymentMethod === "visa" || paymentMethod === "mastercard") {
          if (payRes.data?.checkout_url) {
            window.location.href = payRes.data.checkout_url;
            return;
          }
        } else {
          toast.success(
            "Demande de paiement envoyée. Validez sur votre téléphone.",
          );
        }
      }

      setIsDonationOpen(false);
      toast.success("Demande de Jëf effectuée avec succès.");
    });
  };

  const handleAddTodo = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!newTodoTitle.trim() || !selectedCampaign) return;

    startTransition(async () => {
      const res = await addCampaignTodo(
        Number(selectedCampaign.id),
        newTodoTitle,
      );
      if (res.error) {
        toast.error(res.error);
        return;
      }
      setNewTodoTitle("");
      router.refresh();
    });
  };

  const handleToggleTodo = (todoId: number, isCompleted: boolean) => {
    startTransition(async () => {
      const res = await toggleCampaignTodo(todoId, !isCompleted);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      router.refresh();
    });
  };

  const toggleAssistant = (userId: number) => {
    setSelectedAssistantIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId],
    );
  };

  const handleCreateCampaignChat = () => {
    if (!selectedCampaign || !chatName.trim()) return;

    startTransition(async () => {
      const res = await createChat({
        name: chatName.trim(),
        invite_mode: "manual",
        manual_user_ids: selectedAssistantIds,
        campaign_id: Number(selectedCampaign.id),
      });

      if (res.error) {
        toast.error(res.error);
        return;
      }

      const chat = res.data as { id?: number } | undefined;
      setIsManageOpen(false);
      router.push(chat?.id ? `/dashboard/chat?chat=${chat.id}` : "/dashboard/chat");
      router.refresh();
    });
  };

  const handleDeleteCampaign = (campaignId: number, campaignName: string) => {
    toast(`Supprimer « ${campaignName} » ? Cette action est irréversible.`, {
      action: {
        label: "Supprimer",
        onClick: () => {
          startTransition(async () => {
            const res = await deleteCampaign(campaignId);
            if (res.error) {
              toast.error(res.error);
              return;
            }
            toast.success("Ndiguel supprimé.");
            router.refresh();
          });
        },
      },
      cancel: { label: "Annuler", onClick: () => {} },
    });
  };

  const filteredOrganizerUsers = organizerUsers.filter((user) => {
    const q = assistantSearch.trim().toLowerCase();
    if (!q) return true;
    return [user.first_name, user.last_name, user.role, user.daara_name || ""]
      .join(" ")
      .toLowerCase()
      .includes(q);
  });

  const activeStatus = c.filter("status");

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="ax-segment ax-scroll-x max-w-full" role="group" aria-label="Filtrer par statut">
          {STATUS_TABS.map((t) => (
            <button
              key={t.value}
              type="button"
              className="ax-segment__option"
              aria-pressed={activeStatus === t.value}
              onClick={() => c.setFilter("status", t.value)}
            >
              {t.label}
              <span className="ax-badge ax-badge--count ax-badge--sm">
                {statusCounts[t.value] ?? 0}
              </span>
            </button>
          ))}
        </div>

        {isAdmin && (
          <Link href="/dashboard/campaigns/new" className="ax-btn ax-btn--primary">
            <Plus className="ax-btn__icon" size={16} aria-hidden="true" />
            <span className="ax-btn__label">Lancer un Ndiguel</span>
          </Link>
        )}
      </div>

      {c.total === 0 ? (
        <div className="ax-card">
          <div className="ax-card__body">
            <EmptyState
              icon={Target}
              tone={c.isFiltered ? "search" : "neutral"}
              title={
                c.isFiltered
                  ? "Aucun Ndiguel dans cet état"
                  : "Aucun Ndiguel lancé"
              }
              description={
                c.isFiltered
                  ? "Changez d'onglet pour voir les autres campagnes."
                  : "Les campagnes de collecte de la confrérie apparaîtront ici."
              }
              action={
                isAdmin && !c.isFiltered ? (
                  <Link
                    href="/dashboard/campaigns/new"
                    className="ax-btn ax-btn--primary"
                  >
                    <Plus className="ax-btn__icon" size={16} aria-hidden="true" />
                    <span className="ax-btn__label">Lancer un Ndiguel</span>
                  </Link>
                ) : undefined
              }
            />
          </div>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {c.rows.map((camp) => {
            const collected = Number(camp.collected_amount ?? 0);
            const goal = Number(camp.goal_amount ?? 0);
            const pct = goal > 0 ? Math.min(100, (collected / goal) * 100) : 0;
            const status = statusOf(camp);

            return (
              <article key={camp.id} className="ax-card ax-card--media flex flex-col">
                <div className="ax-card__media relative h-44 overflow-hidden">
                  <CoverImage
                    src={camp.illustrative_photo}
                    icon={Target}
                    iconSize={56}
                    className="h-full w-full object-cover"
                    fallbackClassName="h-full w-full"
                  />
                  <div className="absolute inset-e-3 top-3">
                    <StatusBadge domain="campaign" value={status} size="sm" />
                  </div>
                </div>

                <div className="ax-card__header">
                  <div className="ax-card__titles">
                    <Link
                      href={`/dashboard/campaigns/${camp.id}`}
                      className="ax-card__title ax-clamp-2"
                    >
                      {camp.name}
                    </Link>
                    <p className="ax-card__subtitle ax-clamp-2">
                      {camp.description || "Pas de description pour ce Ndiguel."}
                    </p>
                  </div>
                </div>

                <div className="ax-card__body flex flex-1 flex-col gap-4">
                  {camp.organizer_name && (
                    <p className="ax-text-muted text-xs">
                      Responsable :{" "}
                      <span className="ax-text-strong">{camp.organizer_name}</span>
                      {/* La clé brute s'affichait telle quelle : on lisait
                          « Pape Kane · collector » sur les cartes. */}
                      {camp.organizer_role ? ` · ${roleLabel(camp.organizer_role)}` : ""}
                    </p>
                  )}

                  {goal > 0 && (
                    <div className="flex flex-col gap-3">
                      <div
                        className="ax-progress ax-progress--md"
                        role="progressbar"
                        aria-valuenow={Math.round(pct)}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label={`Progression de ${camp.name}`}
                      >
                        <div className="ax-progress__track">
                          <div
                            className="ax-progress__fill"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="ax-progress__value">
                          {pct.toFixed(0)} %
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex flex-col">
                          <span className="ax-eyebrow">Objectif</span>
                          <span className="font-mono tabular text-sm font-semibold">
                            {formatFCFA(goal)}
                          </span>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="ax-eyebrow">Collecté</span>
                          <span className="text-montant font-mono tabular text-sm font-semibold">
                            {formatFCFA(collected)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  <Link
                    href={`/dashboard/campaigns/${camp.id}/etat`}
                    className="ax-link text-xs"
                  >
                    Voir l&apos;état du Ndiguel
                  </Link>
                </div>

                <div className="ax-card__footer">
                  <div className="ax-btn-group w-full">
                    {canUseDonationPage ? (
                      <Link
                        href={`/dashboard/donations/new?campaign=${camp.id}`}
                        className="ax-btn ax-btn--tonal"
                      >
                        <span className="ax-btn__label">Faire un Jëf</span>
                        <ChevronRight className="ax-btn__icon" size={14} aria-hidden="true" />
                      </Link>
                    ) : (
                      <button
                        type="button"
                        className="ax-btn ax-btn--tonal"
                        onClick={() => {
                          setSelectedCampaign(camp);
                          setErrorMsg("");
                          setIsDonationOpen(true);
                        }}
                      >
                        <span className="ax-btn__label">Faire un Jëf</span>
                        <ChevronRight className="ax-btn__icon" size={14} aria-hidden="true" />
                      </button>
                    )}

                    {camp.is_manageable && status !== "completed" && (
                      <button
                        type="button"
                        className="ax-btn ax-btn--ghost"
                        onClick={() => {
                          setSelectedCampaign(camp);
                          setIsManageOpen(true);
                        }}
                      >
                        <Settings2 className="ax-btn__icon" size={14} aria-hidden="true" />
                        <span className="ax-btn__label">Gérer</span>
                      </button>
                    )}
                  </div>

                  {isAdmin && (
                    <div className="ax-btn-group ms-auto">
                      <Link
                        href={`/dashboard/campaigns/${camp.id}`}
                        className="ax-btn ax-btn--ghost ax-btn--icon"
                        aria-label={`Modifier ${camp.name}`}
                        title="Modifier"
                      >
                        <Pencil size={15} aria-hidden="true" />
                      </Link>
                      <button
                        type="button"
                        className="ax-btn ax-btn--ghost-danger ax-btn--icon"
                        aria-label={`Supprimer ${camp.name}`}
                        title="Supprimer"
                        disabled={isPending}
                        onClick={() =>
                          handleDeleteCampaign(Number(camp.id), camp.name)
                        }
                      >
                        <Trash2 size={15} aria-hidden="true" />
                      </button>
                    </div>
                  )}
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
        itemLabel="Ndiguels"
      />

      {/* ── Gestion : tâches + salon d'organisation ── */}
      <Modal
        open={isManageOpen && Boolean(selectedCampaign)}
        onOpenChange={setIsManageOpen}
        title="Gestion du Ndiguel"
        description={selectedCampaign?.name}
        size="lg"
      >
        {selectedCampaign && (
          <div className="grid gap-8 lg:grid-cols-2">
            <section className="flex flex-col gap-3">
              <h3 className="ax-eyebrow">Liste des tâches</h3>

              <form onSubmit={handleAddTodo} className="ax-input-group">
                <input
                  className="ax-input"
                  value={newTodoTitle}
                  onChange={(e) => setNewTodoTitle(e.target.value)}
                  placeholder="Nouvelle tâche à accomplir…"
                  disabled={isPending}
                  aria-label="Nouvelle tâche"
                />
                <button
                  type="submit"
                  className="ax-btn ax-btn--primary"
                  disabled={isPending || !newTodoTitle.trim()}
                >
                  <span className="ax-btn__label">Ajouter</span>
                </button>
              </form>

              {!selectedCampaign.todos || selectedCampaign.todos.length === 0 ? (
                <p className="ax-text-subtle text-sm italic">
                  Aucune tâche enregistrée.
                </p>
              ) : (
                <ul className="ax-list ax-list--compact ax-scroll-y max-h-72">
                  {selectedCampaign.todos.map((todo) => (
                    <li key={todo.id} className="ax-list__row">
                      <button
                        type="button"
                        className="ax-list__leading ax-icon-btn"
                        onClick={() => handleToggleTodo(todo.id, todo.is_completed)}
                        disabled={isPending}
                        aria-pressed={todo.is_completed}
                        aria-label={
                          todo.is_completed
                            ? `Rouvrir « ${todo.title} »`
                            : `Terminer « ${todo.title} »`
                        }
                      >
                        {todo.is_completed ? (
                          <CheckCircle2 size={18} className="ax-text-success" />
                        ) : (
                          <Circle size={18} />
                        )}
                      </button>
                      <span
                        className={`ax-list__content ${
                          todo.is_completed ? "ax-text-subtle line-through" : ""
                        }`}
                      >
                        {todo.title}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="flex flex-col gap-3">
              <h3 className="ax-eyebrow">Salon d&apos;organisation</h3>
              <p className="ax-text-muted text-sm">
                Invitez les membres qui assisteront le responsable sur ce
                Ndiguel.
              </p>

              <div className="ax-field">
                <label className="ax-field__label" htmlFor="chatName">
                  Nom du salon
                </label>
                <input
                  id="chatName"
                  className="ax-input"
                  value={chatName}
                  onChange={(e) => setChatName(e.target.value)}
                  placeholder="Ex. Coordination Ramadan"
                />
              </div>

              <div className="ax-field">
                <label className="ax-field__label" htmlFor="assistantSearch">
                  Membres à inviter
                  {selectedAssistantIds.length > 0 && (
                    <span className="ax-badge ax-badge--count ax-badge--sm ms-2">
                      {selectedAssistantIds.length}
                    </span>
                  )}
                </label>
                <input
                  id="assistantSearch"
                  className="ax-input"
                  value={assistantSearch}
                  onChange={(e) => setAssistantSearch(e.target.value)}
                  placeholder="Nom, rôle ou Daara…"
                />

                <div className="ax-scroll-y max-h-60 rounded-(--ax-radius-sm) border border-(--ax-border)">
                  {organizerUsersError ? (
                    <p className="ax-field__message ax-field__message--error p-3">
                      {organizerUsersError}
                    </p>
                  ) : filteredOrganizerUsers.length === 0 ? (
                    <p className="ax-text-subtle p-3 text-sm">
                      Aucun membre ne correspond à la recherche.
                    </p>
                  ) : (
                    <ul className="ax-list ax-list--compact">
                      {filteredOrganizerUsers.map((user) => (
                        <li key={user.id} className="ax-list__row">
                          <label className="ax-check w-full">
                            <input
                              type="checkbox"
                              className="ax-checkbox"
                              checked={selectedAssistantIds.includes(user.id)}
                              onChange={() => toggleAssistant(user.id)}
                            />
                            <span className="ax-list__content">
                              <span className="ax-list__title">
                                {user.first_name} {user.last_name}
                              </span>
                              <span className="ax-list__meta">
                                {user.role}
                                {user.daara_name ? ` · ${user.daara_name}` : ""}
                              </span>
                            </span>
                          </label>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              <button
                type="button"
                className="ax-btn ax-btn--primary ax-btn--block"
                disabled={isPending || !chatName.trim()}
                onClick={handleCreateCampaignChat}
              >
                <MessageSquare className="ax-btn__icon" size={16} aria-hidden="true" />
                <span className="ax-btn__label">Créer le salon</span>
              </button>
            </section>
          </div>
        )}
      </Modal>

      {/* ── Paiement d'un Jëf ── */}
      <Modal
        open={isDonationOpen && Boolean(selectedCampaign)}
        onOpenChange={setIsDonationOpen}
        title="Faire un Jëf"
        description={selectedCampaign?.name}
        size="sm"
      >
        {selectedCampaign && (
          <form action={handleDonation} className="flex flex-col gap-5">
            <input type="hidden" name="campaignId" value={selectedCampaign.id} />

            <div className="ax-field">
              <label className="ax-field__label" htmlFor="amount">
                Montant du Jëf
                <span className="ax-field__required" aria-hidden="true"> *</span>
              </label>
              <div className="ax-field__control">
                <span className="ax-field__affix ax-field__affix--leading">
                  <Wallet aria-hidden="true" />
                </span>
                <input
                  id="amount"
                  name="amount"
                  type="number"
                  min="5"
                  inputMode="numeric"
                  className="ax-input ax-input--with-leading-icon ax-input--lg font-mono tabular"
                  placeholder="5000"
                  required
                />
                <span className="ax-field__affix ax-field__affix--trailing">
                  FCFA
                </span>
              </div>
            </div>

            {/*
              Sélecteur partagé avec « Nouveau Jëf ». Le virement bancaire
              rejoint au passage cette modale : il y manquait sans raison
              métier, les deux listes ayant divergé au fil des copies.
            */}
            <PaymentMethodPicker
              value={selectedMethod}
              onChange={setSelectedMethod}
            />

            {errorMsg && (
              <p className="ax-field__message ax-field__message--error">
                {errorMsg}
              </p>
            )}

            <div className="flex flex-col gap-2">
              <button
                type="submit"
                className="ax-btn ax-btn--primary ax-btn--lg ax-btn--block"
                disabled={isPending}
              >
                <CreditCard className="ax-btn__icon" size={18} aria-hidden="true" />
                <span className="ax-btn__label">
                  {isPending ? "Traitement…" : "Confirmer le paiement"}
                </span>
              </button>
              <p className="ax-text-subtle text-center text-xs">
                Paiement sécurisé, chiffré de bout en bout.
              </p>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
