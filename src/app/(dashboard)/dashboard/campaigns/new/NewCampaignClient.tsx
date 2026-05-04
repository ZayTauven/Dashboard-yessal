"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { addCampaign, updateCampaign } from "@/app/actions/campaigns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Target } from "lucide-react";

type FeteOption = { id: number | string; name: string };
type MemberOption = {
  id: number | string;
  first_name: string;
  last_name: string;
  email: string;
  role?: string;
};

type CampaignFormInitialData = {
  id: number | string;
  name: string;
  description?: string | null;
  objective?: string | null;
  goal_amount?: number | string | null;
  deadline: string;
  fete?: number | null;
  organizer?: number | null;
  illustrative_photo?: string | null;
};

export function NewCampaignClient({
  fetes,
  members,
  initialCampaign,
}: {
  fetes: FeteOption[];
  members: MemberOption[];
  initialCampaign?: CampaignFormInitialData;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState("");
  const isEditMode = Boolean(initialCampaign);

  const handleSubmit = async (formData: FormData) => {
    setErrorMsg("");
    startTransition(async () => {
      const res =
        isEditMode && initialCampaign
          ? await updateCampaign(Number(initialCampaign.id), formData)
          : await addCampaign(formData);

      if (res.error) {
        setErrorMsg(res.error);
      } else {
        router.push("/dashboard/campaigns");
        router.refresh();
      }
    });
  };

  const eligibleMembers = members.filter((member) =>
    ["member", "collector", "chef_daara"].includes(member.role || ""),
  );

  return (
    <div className="max-w-xl mx-auto flex flex-col gap-8">
      <Button variant="ghost" className="w-fit gap-2 -ml-2" asChild>
        <Link href="/dashboard/campaigns">
          <ArrowLeft size={16} />
          Retour aux Ndiguels
        </Link>
      </Button>

      <div
        className="rounded-xl border bg-card p-6 shadow-sm"
        style={{ borderColor: "var(--border)" }}
      >
        <div className="mb-6">
          <h2
            className="text-xl font-semibold flex items-center gap-2"
            style={{ color: "var(--foreground)" }}
          >
            <Target size={20} style={{ color: "var(--yessal-green)" }} />
            {isEditMode ? "Modifier la campagne" : "Creer une campagne"}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Une campagne peut etre liee a une fete et pilotee par un membre.
          </p>
        </div>

        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nom du Ndiguel</Label>
            <Input
              id="name"
              name="name"
              placeholder={"Ex.: Contribution mur d'enceinte"}
              defaultValue={initialCampaign?.name ?? ""}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Description detaillee de la campagne..."
              rows={3}
              defaultValue={initialCampaign?.description ?? ""}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="illustrative_photo">Image illustrative (Optionnel)</Label>
            <div className="flex flex-col gap-2">
              {initialCampaign?.illustrative_photo && (
                <div className="relative h-32 w-full rounded-lg overflow-hidden border">
                  <img
                    src={initialCampaign.illustrative_photo}
                    alt="Current"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <Input
                id="illustrative_photo"
                name="illustrative_photo"
                type="file"
                accept="image/*"
                className="cursor-pointer"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="objective">Objectif qualitatif (Optionnel)</Label>
            <Textarea
              id="objective"
              name="objective"
              placeholder="Ex.: Acheter 50 corans et financer la peinture..."
              rows={2}
              defaultValue={initialCampaign?.objective ?? ""}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="goalAmount">Objectif financier (Optionnel)</Label>
              <Input
                id="goalAmount"
                name="goalAmount"
                type="number"
                min={1000}
                placeholder="100000"
                defaultValue={initialCampaign?.goal_amount ?? ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="deadline">Date limite</Label>
              <Input
                id="deadline"
                name="deadline"
                type="date"
                defaultValue={initialCampaign?.deadline ?? ""}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="feteId">Lier a une fete</Label>
              <select
                id="feteId"
                name="feteId"
                defaultValue={initialCampaign?.fete ? String(initialCampaign.fete) : ""}
                className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{ borderColor: "var(--border)" }}
              >
                <option value="">Aucune fete</option>
                {fetes.map((fete) => (
                  <option key={fete.id} value={fete.id}>
                    {fete.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="organizerId">Responsable / Organisateur</Label>
              <select
                id="organizerId"
                name="organizerId"
                defaultValue={initialCampaign?.organizer ? String(initialCampaign.organizer) : ""}
                className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{ borderColor: "var(--border)" }}
              >
                <option value="">Aucun organisateur</option>
                {eligibleMembers.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.first_name} {member.last_name} ({member.email}) - {member.role}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {errorMsg ? <p className="text-xs text-red-600 font-medium">{errorMsg}</p> : null}

          <Button
            type="submit"
            disabled={isPending}
            className="w-full mt-2"
            style={{ background: "var(--yessal-green)", color: "white" }}
          >
            {isPending
              ? isEditMode
                ? "Mise a jour..."
                : "Creation..."
              : isEditMode
                ? "Enregistrer les modifications"
                : "Enregistrer la campagne"}
          </Button>
        </form>
      </div>
    </div>
  );
}
