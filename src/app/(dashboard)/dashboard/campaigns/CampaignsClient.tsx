"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { makeDonation, payDonation } from "@/app/actions/donations";
import {
  addCampaignTodo,
  deleteCampaign,
  getCampaignOrganizerDirectory,
  toggleCampaignTodo,
} from "@/app/actions/campaigns";
import { createChat } from "@/app/actions/comms";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Plus,
  Wallet,
  CreditCard,
  ChevronRight,
  Settings2,
  CheckCircle2,
  Circle,
  MessageSquare,
  Pencil,
  Trash2,
  Target,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SmartLink } from "@/components/SmartLink";

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
  const [selectedAssistantIds, setSelectedAssistantIds] = useState<number[]>(
    [],
  );
  const [assistantSearch, setAssistantSearch] = useState("");
  const [selectedMethod, setSelectedMethod] = useState("orange_money");

  useEffect(() => {
    if (!isManageOpen || !selectedCampaign) return;

    let cancelled = false;
    setOrganizerUsers([]);
    setOrganizerUsersError("");
    setSelectedAssistantIds([]);
    setAssistantSearch("");
    setChatName(`Organisation - ${selectedCampaign.name}`);

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
      } else {
        const donation = res.data;

        // If collector payment, show specific message
        if (paymentMethod === "collector") {
          setIsDonationOpen(false);
          alert(
            "Demande de collecte enregistrée. Les responsables ont été notifiés.",
          );
          return;
        }

        // If digital payment, initiate Bictorys
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
            // Mobile money
            alert(
              `Une demande de paiement ${paymentMethod.replace("_", " ")} a été envoyée. Veuillez valider sur votre téléphone.`,
            );
          }
        }

        setIsDonationOpen(false);
        alert("Demande de don effectuée avec succès.");
      }
    });
  };

  const handleAddTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodoTitle.trim() || !selectedCampaign) return;

    startTransition(async () => {
      const res = await addCampaignTodo(
        Number(selectedCampaign.id),
        newTodoTitle,
      );
      if (!res.error) {
        setNewTodoTitle("");
        router.refresh();
      } else {
        alert(res.error);
      }
    });
  };

  const handleToggleTodo = async (todoId: number, isCompleted: boolean) => {
    startTransition(async () => {
      const res = await toggleCampaignTodo(todoId, !isCompleted);
      if (res.error) {
        alert(res.error);
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
        alert(res.error);
        return;
      }

      const chat = res.data as { id?: number } | undefined;
      setIsManageOpen(false);
      router.push(
        chat?.id ? `/dashboard/chat?chat=${chat.id}` : "/dashboard/chat",
      );
      router.refresh();
    });
  };

  const handleDeleteCampaign = (campaignId: number, campaignName: string) => {
    const confirmed = window.confirm(
      `Supprimer la campagne "${campaignName}" ? Cette action est irréversible.`,
    );
    if (!confirmed) return;

    startTransition(async () => {
      const res = await deleteCampaign(campaignId);
      if (res.error) {
        alert(res.error);
        return;
      }
      router.refresh();
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

  return (
    <div className="flex flex-col gap-8">
      <div className="flex justify-end">
        {isAdmin && (
          <Button
            className="gap-2"
            style={{
              background: "var(--yessal-green)",
              color: "#FAFAF8",
            }}
            asChild
          >
            <Link href="/dashboard/campaigns/new">
              <Plus size={16} /> Nouvelle campagne
            </Link>
          </Button>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {initialCampaigns.length === 0 ? (
          <div
            className="col-span-full p-12 text-center border-2 border-dashed rounded-lg"
            style={{
              borderColor: "var(--border)",
              color: "var(--muted-foreground)",
            }}
          >
            Aucune campagne de dons active pour le moment.
          </div>
        ) : (
          initialCampaigns.map((camp) => {
            const collected = camp.collected_amount ?? 0;
            const goal = camp.goal_amount;
            const progressPct =
              goal > 0 ? Math.min(100, (collected / goal) * 100) : 0;
            const statusLabel = camp.effective_status ?? camp.status;

            return (
              <Card
                key={camp.id}
                className="overflow-hidden hover:shadow-lg transition-shadow border-2 flex flex-col group"
                style={{ borderColor: "var(--border)" }}
              >
                <div className="relative h-48 w-full overflow-hidden bg-muted">
                  {camp.illustrative_photo ? (
                    <img
                      src={camp.illustrative_photo}
                      alt={camp.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground/20">
                      <Target size={64} />
                    </div>
                  )}
                  <div className="absolute top-3 right-3">
                    <span
                      className="px-3 py-1 rounded-full text-[10px] font-black uppercase text-white shadow-lg backdrop-blur-md"
                      style={{
                        background:
                          statusLabel === "completed"
                            ? "rgba(37, 99, 235, 0.8)"
                            : statusLabel === "inactive"
                              ? "rgba(107, 114, 128, 0.8)"
                              : "rgba(16, 122, 68, 0.8)", // yessal-green with alpha
                      }}
                    >
                      {statusLabel}
                    </span>
                  </div>
                </div>
                <CardHeader className="pb-3 border-b bg-muted/5 relative">
                  <div className="flex justify-between items-start gap-2">
                    <SmartLink
                      href={`/dashboard/campaigns/${camp.id}`}
                      className="text-xl line-clamp-1 pr-2 block font-semibold"
                    >
                      {camp.name}
                    </SmartLink>
                  </div>
                  <CardDescription className="line-clamp-2 min-h-[40px] mt-1">
                    {camp.description ||
                      "Pas de description pour cette campagne."}
                  </CardDescription>
                  <div className="mt-2">
                    <SmartLink
                      href={`/dashboard/campaigns/${camp.id}/etat`}
                      className="text-xs font-semibold"
                    >
                      Etat du Ndiguel
                    </SmartLink>
                  </div>
                  {camp.organizer_name && (
                    <span className="inline-block mt-2 text-[10px] uppercase font-bold text-muted-foreground bg-muted px-2 py-1 rounded-md">
                      Responsable : {camp.organizer_name}
                      {camp.organizer_role ? ` (${camp.organizer_role})` : ""}
                    </span>
                  )}
                </CardHeader>
                <CardContent className="py-6 space-y-4 flex-1">
                  {camp.objective && (
                    <div className="text-sm bg-muted/30 p-3 rounded-lg border text-muted-foreground italic mb-4">
                      <span className="font-semibold block mb-1 not-italic">
                        Objectif :
                      </span>
                      {camp.objective}
                    </div>
                  )}

                  {goal > 0 ? (
                    <>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">
                            Progression
                          </span>
                          <span className="font-bold">
                            {Math.round(progressPct)}%
                          </span>
                        </div>
                        <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-yessal-green transition-all"
                            style={{
                              width: `${progressPct}%`,
                              background: "var(--yessal-green)",
                            }}
                          />
                        </div>
                      </div>
                      <div
                        className="grid grid-cols-2 pt-2 border-t"
                        style={{ borderColor: "var(--border)" }}
                      >
                        <div className="flex flex-col">
                          <span className="text-[10px] uppercase text-muted-foreground font-semibold">
                            Objectif
                          </span>
                          <span className="text-sm font-bold">
                            {Number(camp.goal_amount).toLocaleString()} FCFA
                          </span>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="text-[10px] uppercase text-muted-foreground font-semibold">
                            Collecté
                          </span>
                          <span
                            className="text-sm font-bold text-yessal-green"
                            style={{ color: "var(--yessal-green)" }}
                          >
                            {Number(
                              camp.collected_amount || 0,
                            ).toLocaleString()}{" "}
                            FCFA
                          </span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-center text-sm font-semibold text-muted-foreground p-4 bg-muted/20 rounded-lg">
                      Campagne sans objectif financier fixe.
                    </div>
                  )}

                  <div className="text-xs text-muted-foreground">
                    {typeof camp.days_remaining === "number"
                      ? camp.days_remaining > 0
                        ? `${camp.days_remaining} jour(s) restants pour l'organisation`
                        : "Organisation close: les privilèges du responsable sont retirés"
                      : null}
                  </div>
                </CardContent>
                <CardFooter
                  className="pt-0 p-0 flex flex-col sm:flex-row border-t"
                  style={{ borderColor: "var(--border)" }}
                >
                  {canUseDonationPage ? (
                    <Button
                      variant="ghost"
                      className="flex-1 h-12 gap-2 rounded-none hover:bg-muted/50"
                      asChild
                    >
                      <Link
                        href={`/dashboard/donations/new?campaign=${camp.id}`}
                      >
                        Faire un Jëfs <ChevronRight size={14} />
                      </Link>
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      className="flex-1 h-12 gap-2 rounded-none hover:bg-muted/50"
                      onClick={() => {
                        setSelectedCampaign(camp);
                        setIsDonationOpen(true);
                      }}
                    >
                      Faire un Jëfs <ChevronRight size={14} />
                    </Button>
                  )}

                  {camp.is_manageable && statusLabel !== "completed" && (
                    <Button
                      variant="secondary"
                      className="flex-1 h-12 gap-2 rounded-none bg-muted/30 hover:bg-muted/80 border-t sm:border-t-0 sm:border-l"
                      onClick={() => {
                        setSelectedCampaign(camp);
                        setIsManageOpen(true);
                      }}
                    >
                      <Settings2 size={14} /> Gérer
                    </Button>
                  )}
                </CardFooter>
                {isAdmin ? (
                  <div
                    className="grid grid-cols-2 border-t"
                    style={{ borderColor: "var(--border)" }}
                  >
                    <Button
                      variant="ghost"
                      className="rounded-none h-11 gap-2"
                      asChild
                    >
                      <Link href={`/dashboard/campaigns/${camp.id}`}>
                        <Pencil size={14} /> Modifier
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      className="rounded-none h-11 gap-2 text-red-600 hover:text-red-700 border-l"
                      style={{ borderColor: "var(--border)" }}
                      onClick={() =>
                        handleDeleteCampaign(Number(camp.id), camp.name)
                      }
                      disabled={isPending}
                    >
                      <Trash2 size={14} /> Supprimer
                    </Button>
                  </div>
                ) : null}
              </Card>
            );
          })
        )}
      </div>

      {isManageOpen && selectedCampaign && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
          onClick={() => setIsManageOpen(false)}
        >
          <div
            className="w-full max-w-[760px] max-h-[90vh] overflow-y-auto rounded-xl border bg-background p-6 shadow-2xl"
            style={{ borderColor: "var(--border)" }}
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-6 flex items-start justify-between">
              <div>
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <Settings2 size={20} /> Gestion de campagne
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Campagne : {selectedCampaign.name}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsManageOpen(false)}
              >
                Fermer
              </Button>
            </div>

            <div className="grid gap-8 lg:grid-cols-2">
              <div className="space-y-4">
                <h3 className="font-bold text-sm tracking-widest uppercase text-muted-foreground border-b pb-2">
                  Liste des tâches
                </h3>

                <form onSubmit={handleAddTodo} className="flex gap-2">
                  <Input
                    value={newTodoTitle}
                    onChange={(e) => setNewTodoTitle(e.target.value)}
                    placeholder="Nouvelle tâche à accomplir..."
                    disabled={isPending}
                  />
                  <Button
                    type="submit"
                    disabled={isPending || !newTodoTitle.trim()}
                  >
                    Ajouter
                  </Button>
                </form>

                <div className="space-y-2 mt-4 max-h-[280px] overflow-y-auto pr-2">
                  {!selectedCampaign.todos ||
                  selectedCampaign.todos.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic text-center p-4 bg-muted/20 rounded-md">
                      Aucune tâche enregistrée.
                    </p>
                  ) : (
                    selectedCampaign.todos.map((todo) => (
                      <div
                        key={todo.id}
                        className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/30 transition-colors"
                      >
                        <button
                          onClick={() =>
                            handleToggleTodo(todo.id, todo.is_completed)
                          }
                          className="shrink-0 text-muted-foreground hover:text-primary transition-colors"
                          disabled={isPending}
                        >
                          {todo.is_completed ? (
                            <CheckCircle2
                              size={20}
                              className="text-emerald-500"
                            />
                          ) : (
                            <Circle size={20} />
                          )}
                        </button>
                        <span
                          className={`text-sm font-medium ${
                            todo.is_completed
                              ? "text-muted-foreground line-through"
                              : ""
                          }`}
                        >
                          {todo.title}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-bold text-sm tracking-widest uppercase text-muted-foreground border-b pb-2">
                  Salon d&apos;organisation
                </h3>
                <p className="text-sm text-muted-foreground">
                  Invitez les membres qui vont assister le responsable sur cette
                  campagne.
                </p>

                <div className="space-y-2">
                  <Label htmlFor="chatName">Nom du salon</Label>
                  <Input
                    id="chatName"
                    value={chatName}
                    onChange={(e) => setChatName(e.target.value)}
                    placeholder="Ex. Coordination campagne Ramadan"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Membres à inviter</Label>
                  <Input
                    value={assistantSearch}
                    onChange={(e) => setAssistantSearch(e.target.value)}
                    placeholder="Rechercher un membre, un rôle ou un daara..."
                  />
                  <div className="max-h-[240px] overflow-y-auto rounded-lg border p-3 space-y-2">
                    {organizerUsersError ? (
                      <p className="text-sm text-red-600">
                        {organizerUsersError}
                      </p>
                    ) : filteredOrganizerUsers.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        Aucun membre ne correspond à la recherche.
                      </p>
                    ) : (
                      filteredOrganizerUsers.map((user) => (
                        <label
                          key={user.id}
                          className="flex items-start gap-3 rounded-md border p-3 cursor-pointer hover:bg-muted/30"
                        >
                          <input
                            type="checkbox"
                            checked={selectedAssistantIds.includes(user.id)}
                            onChange={() => toggleAssistant(user.id)}
                            className="mt-1"
                          />
                          <div className="min-w-0">
                            <div className="font-medium text-sm">
                              {user.first_name} {user.last_name}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {user.role}
                              {user.daara_name ? ` • ${user.daara_name}` : ""}
                            </div>
                          </div>
                        </label>
                      ))
                    )}
                  </div>
                </div>

                <Button
                  className="w-full gap-2 font-bold bg-blue-600 hover:bg-blue-700 text-white"
                  type="button"
                  disabled={isPending || !chatName.trim()}
                  onClick={handleCreateCampaignChat}
                >
                  <MessageSquare size={16} /> Créer le salon
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isDonationOpen && selectedCampaign && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
          onClick={() => setIsDonationOpen(false)}
        >
          <div
            className="w-full max-w-[450px] rounded-xl border bg-background p-6 shadow-2xl"
            style={{ borderColor: "var(--border)" }}
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-6 flex items-start justify-between">
              <div>
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <Wallet
                    className="text-yessal-green"
                    size={20}
                    style={{ color: "var(--yessal-green)" }}
                  />
                  Faire un Jëfs
                </h2>
                <p className="text-sm text-muted-foreground">
                  Campagne : {selectedCampaign.name}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsDonationOpen(false)}
              >
                Quitter
              </Button>
            </div>

            <form action={handleDonation} className="space-y-5">
              <input
                type="hidden"
                name="campaignId"
                value={selectedCampaign.id}
              />

              <div className="space-y-2">
                <Label htmlFor="amount">Montant du don (FCFA)</Label>
                <div className="relative">
                  <Input
                    id="amount"
                    name="amount"
                    type="number"
                    min="5"
                    placeholder="5000"
                    className="pl-9"
                    required
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold text-xs">
                    CFA
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Moyen de paiement</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <label
                    className={`flex flex-col items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-muted transition-colors ${selectedMethod === "orange_money" ? "border-yessal-green bg-yessal-green/10" : "border-border"}`}
                    onClick={() => setSelectedMethod("orange_money")}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="orange_money"
                      checked={selectedMethod === "orange_money"}
                      onChange={() => setSelectedMethod("orange_money")}
                      className="hidden"
                    />
                    <span className="text-[10px] font-bold">Orange</span>
                  </label>
                  <label
                    className={`flex flex-col items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-muted transition-colors ${selectedMethod === "wave" ? "border-yessal-green bg-yessal-green/10" : "border-border"}`}
                    onClick={() => setSelectedMethod("wave")}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="wave"
                      checked={selectedMethod === "wave"}
                      onChange={() => setSelectedMethod("wave")}
                      className="hidden"
                    />
                    <span className="text-[10px] font-bold">Wave</span>
                  </label>
                  <label
                    className={`flex flex-col items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-muted transition-colors ${selectedMethod === "visa" ? "border-yessal-green bg-yessal-green/10" : "border-border"}`}
                    onClick={() => setSelectedMethod("visa")}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="visa"
                      checked={selectedMethod === "visa"}
                      onChange={() => setSelectedMethod("visa")}
                      className="hidden"
                    />
                    <span className="text-[10px] font-bold">Visa</span>
                  </label>
                  <label
                    className={`flex flex-col items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-muted transition-colors ${selectedMethod === "mastercard" ? "border-yessal-green bg-yessal-green/10" : "border-border"}`}
                    onClick={() => setSelectedMethod("mastercard")}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="mastercard"
                      checked={selectedMethod === "mastercard"}
                      onChange={() => setSelectedMethod("mastercard")}
                      className="hidden"
                    />
                    <span className="text-[10px] font-bold">Mastercard</span>
                  </label>
                  <label
                    className={`flex flex-col items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-muted transition-colors ${selectedMethod === "paypal" ? "border-yessal-green bg-yessal-green/10" : "border-border"}`}
                    onClick={() => setSelectedMethod("paypal")}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="paypal"
                      checked={selectedMethod === "paypal"}
                      onChange={() => setSelectedMethod("paypal")}
                      className="hidden"
                    />
                    <span className="text-[10px] font-bold">PayPal</span>
                  </label>
                  <label
                    className={`flex flex-col items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-muted transition-colors ${selectedMethod === "collector" ? "border-yessal-green bg-yessal-green/10" : "border-border"}`}
                    onClick={() => setSelectedMethod("collector")}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="collector"
                      checked={selectedMethod === "collector"}
                      onChange={() => setSelectedMethod("collector")}
                      className="hidden"
                    />
                    <span className="text-[10px] font-bold">Collecteur</span>
                  </label>
                </div>
              </div>

              {errorMsg && (
                <p className="text-xs text-red-500 font-medium">{errorMsg}</p>
              )}

              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={isPending}
                  className="w-full gap-2 py-6 text-lg"
                  style={{ background: "var(--yessal-green)", color: "white" }}
                >
                  <CreditCard size={18} />
                  {isPending ? "Traitement..." : "Confirmer le paiement"}
                </Button>
                <p className="text-[10px] text-center mt-3 text-muted-foreground">
                  Paiement sécurisé chiffré de bout en bout.
                </p>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
