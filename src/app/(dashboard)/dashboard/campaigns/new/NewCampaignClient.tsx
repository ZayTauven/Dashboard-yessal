"use client";

/*
 * ═══════════════════════════════════════════════════════════════════════════
 * Lancer / modifier un Ndiguel
 * ═══════════════════════════════════════════════════════════════════════════
 * Formulaire sur les contrats `.ax-field` (patron `forms/Layouts` de Vireo).
 *
 * Ce que la reprise change :
 *
 *   · Les libellés étaient saisis sans accents — « Une campagne peut etre liee
 *     a une fete », « Description detaillee », « Mise a jour », « Creation ».
 *     Ils sont réécrits en français correct.
 *
 *   · Le vocabulaire hésitait entre « campagne » et « Ndiguel » dans le même
 *     écran, jusque dans le bouton d'envoi (« Enregistrer la campagne » sous un
 *     titre « Lancer un nouveau Ndiguel »).
 *
 *   · L'aperçu de l'image existante s'affichait avec `alt="Current"` — un mot
 *     anglais lu tel quel par les lecteurs d'écran. L'image est décorative ici :
 *     l'attribut passe à vide.
 *
 *   · L'objectif financier est facultatif mais rien ne disait ce qui se passe
 *     sans lui. Une précision l'indique, parce que la liste des Ndiguels masque
 *     effectivement la barre de progression dans ce cas.
 */

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Target } from "lucide-react";
import { addCampaign, updateCampaign } from "@/app/actions/campaigns";
import { DatePicker } from "@/components/ui/DatePicker";
import { roleLabel } from "@/lib/roles";
import { FileDrop } from "@/components/vireo/FileDrop";

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
        return;
      }
      router.push("/dashboard/campaigns");
      router.refresh();
    });
  };

  const eligibleMembers = members.filter((m) =>
    ["member", "collector", "chef_daara"].includes(m.role || ""),
  );

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
      <Link href="/dashboard/campaigns" className="ax-btn ax-btn--ghost w-fit">
        <ArrowLeft className="ax-btn__icon" size={16} aria-hidden="true" />
        <span className="ax-btn__label">Retour aux Ndiguels</span>
      </Link>

      <section className="ax-card">
        <div className="ax-card__header">
          <span className="ax-card__kpi-icon ax-card__kpi-icon--c1" aria-hidden="true">
            <Target />
          </span>
          <div className="ax-card__titles">
            <h2 className="ax-card__title">
              {isEditMode ? "Modifier le Ndiguel" : "Lancer un nouveau Ndiguel"}
            </h2>
            <p className="ax-card__subtitle">
              Un Ndiguel peut être rattaché à une fête et confié à un
              responsable.
            </p>
          </div>
        </div>

        <div className="ax-card__body">
          <form action={handleSubmit} className="flex flex-col gap-5">
            <div className="ax-field">
              <label className="ax-field__label" htmlFor="name">
                Nom du Ndiguel
                <span className="ax-field__required" aria-hidden="true"> *</span>
              </label>
              <input
                id="name"
                name="name"
                className="ax-input"
                placeholder="Ex. Contribution mur d'enceinte"
                defaultValue={initialCampaign?.name ?? ""}
                required
              />
            </div>

            <div className="ax-field">
              <label className="ax-field__label" htmlFor="description">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                rows={3}
                className="ax-textarea"
                placeholder="Ce que finance ce Ndiguel, et pourquoi."
                defaultValue={initialCampaign?.description ?? ""}
              />
            </div>

            <div className="ax-field">
              <span className="ax-field__label">Image illustrative</span>

              {/*
                L'`<input type="file">` natif affichait « No file chosen » —
                un texte imposé par la locale du NAVIGATEUR, qu'aucun attribut
                ne traduit. <FileDrop> le masque et dessine l'interface, en
                français, avec le plafond de taille annoncé avant le dépôt.
              */}
              <FileDrop
                name="illustrative_photo"
                accept="image/*"
                hint="JPG ou PNG"
                currentPreview={initialCampaign?.illustrative_photo}
              />

              <p className="ax-field__hint">
                Facultative. Elle habille la carte du Ndiguel dans la liste.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="ax-field">
                <label className="ax-field__label" htmlFor="goalAmount">
                  Objectif financier
                </label>
                <div className="ax-field__control">
                  <input
                    id="goalAmount"
                    name="goalAmount"
                    type="number"
                    min={1000}
                    step={1000}
                    inputMode="numeric"
                    className="ax-input ax-input--with-trailing font-mono tabular"
                    placeholder="100000"
                    defaultValue={initialCampaign?.goal_amount ?? ""}
                  />
                  <span className="ax-field__affix ax-field__affix--trailing">
                    FCFA
                  </span>
                </div>
                <p className="ax-field__hint">
                  Facultatif. Sans objectif, la barre de progression n&apos;est
                  pas affichée.
                </p>
              </div>

              <div className="ax-field">
                <label className="ax-field__label">
                  Date limite
                  <span className="ax-field__required" aria-hidden="true"> *</span>
                </label>
                <DatePicker
                  name="deadline"
                  defaultValue={initialCampaign?.deadline ?? ""}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="ax-field">
                <label className="ax-field__label" htmlFor="feteId">
                  Rattacher à une fête
                </label>
                <select
                  id="feteId"
                  name="feteId"
                  className="ax-select"
                  defaultValue={
                    initialCampaign?.fete ? String(initialCampaign.fete) : ""
                  }
                >
                  <option value="">Aucune fête</option>
                  {fetes.map((fete) => (
                    <option key={fete.id} value={fete.id}>
                      {fete.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="ax-field">
                <label className="ax-field__label" htmlFor="organizerId">
                  Responsable
                </label>
                <select
                  id="organizerId"
                  name="organizerId"
                  className="ax-select"
                  defaultValue={
                    initialCampaign?.organizer
                      ? String(initialCampaign.organizer)
                      : ""
                  }
                >
                  <option value="">Aucun responsable</option>
                  {eligibleMembers.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.first_name} {m.last_name}
                      {m.role ? ` · ${roleLabel(m.role)}` : ""}
                    </option>
                  ))}
                </select>
                <p className="ax-field__hint">
                  Il pourra gérer les tâches et ouvrir un salon d&apos;organisation.
                </p>
              </div>
            </div>

            {errorMsg && (
              <p className="ax-field__message ax-field__message--error">
                {errorMsg}
              </p>
            )}

            <button
              type="submit"
              className="ax-btn ax-btn--primary ax-btn--lg ax-btn--block"
              disabled={isPending}
            >
              <span className="ax-btn__label">
                {isPending
                  ? isEditMode
                    ? "Mise à jour…"
                    : "Création…"
                  : isEditMode
                    ? "Enregistrer les modifications"
                    : "Lancer le Ndiguel"}
              </span>
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
