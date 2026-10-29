"use client";

/*
 * Les trois étapes de l'accueil, dans l'ordre que donne Django : Daara, fiche,
 * mot de passe. Chacune enregistre puis rafraîchit la page serveur, qui
 * recalcule les étapes restantes — et renvoie au tableau de bord quand il
 * n'en reste plus. Aucune règle n'est recopiée ici.
 *
 * Le mot de passe vient en dernier parce que c'est lui qui clôt l'accueil
 * (`must_change_password`) ; placé en premier, un membre qui fermait l'onglet
 * juste après sortait du parcours avec sa fiche vide.
 */

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, LogOut } from "lucide-react";
import { BrandMark } from "@/components/BrandMark";
import { DatePicker } from "@/components/ui/DatePicker";
import { DaaraCombobox, type DaaraOption } from "@/components/vireo/DaaraCombobox";
import { PasswordChangeForm } from "@/components/vireo/PasswordChangeForm";
import { chooseDaaraAction, updateProfile } from "@/app/actions/users";

export type EtapeAccueil = "daara" | "fiche" | "mot_de_passe";

type Profil = {
  first_name?: string | null;
  birth_date?: string | null;
  gender?: string | null;
  residence_country?: string | null;
  city?: string | null;
};

const TITRES: Record<EtapeAccueil, string> = {
  daara: "Votre Daara",
  fiche: "Votre fiche",
  mot_de_passe: "Votre mot de passe",
};

export default function BienvenueClient({
  profile,
  etapes,
  daaras,
}: {
  profile: Profil;
  etapes: EtapeAccueil[];
  daaras: DaaraOption[];
}) {
  const router = useRouter();
  /* Le total se fige à l'arrivée : sans cela, « étape 1 sur 3 » deviendrait
     « étape 1 sur 2 » après la première, et le compteur n'avancerait jamais. */
  const [initial] = useState(etapes.length);
  const total = Math.max(initial, etapes.length);
  const numero = total - etapes.length + 1;
  const courante = etapes[0];

  return (
    <main className="flex min-h-dvh items-start justify-center px-4 py-10 sm:items-center">
      <div className="w-full max-w-lg">
        <div className="mb-6 flex justify-center">
          <BrandMark href="/" size="md" className="justify-center" />
        </div>

        <p className="ax-eyebrow mb-2">
          Étape {numero} sur {total}
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">
          Bienvenue{profile.first_name ? `, ${profile.first_name}` : ""}
        </h1>
        <p className="ax-text-muted mt-1.5 text-sm">
          Votre compte a été créé pour vous. Quelques informations avant de
          commencer : elles ne vous seront demandées qu’une fois.
        </p>

        <ol className="my-6 flex items-center gap-2" aria-label="Progression">
          {Array.from({ length: total }).map((_, i) => {
            const fait = i < numero - 1;
            const enCours = i === numero - 1;
            return (
              <li
                key={i}
                aria-current={enCours ? "step" : undefined}
                className={
                  "flex size-6 items-center justify-center rounded-full border " +
                  (fait
                    ? "border-primary bg-primary text-primary-foreground"
                    : enCours
                      ? "border-2 border-primary"
                      : "border-border")
                }
              >
                {fait && <Check size={13} aria-hidden="true" />}
              </li>
            );
          })}
        </ol>

        <section className="ax-card">
          <div className="ax-card__body flex flex-col gap-5">
            <h2 className="ax-card__title">{TITRES[courante]}</h2>
            {courante === "daara" && (
              <EtapeDaara daaras={daaras} onDone={() => router.refresh()} />
            )}
            {courante === "fiche" && (
              <EtapeFiche profile={profile} onDone={() => router.refresh()} />
            )}
            {courante === "mot_de_passe" && (
              <>
                <p className="text-sm">
                  Le mot de passe avec lequel vous venez de vous connecter est
                  connu d’autres personnes. Choisissez le vôtre.
                </p>
                <PasswordChangeForm
                  formId="accueil-mot-de-passe"
                  withSubmit
                  currentHint="Celui qu’on vous a communiqué."
                  onSuccess={() => router.refresh()}
                />
              </>
            )}
          </div>
        </section>

        <div className="mt-6 flex justify-center">
          {/* Un lien et non un bouton : `/logout` est un Route Handler. */}
          <a href="/logout" className="ax-btn ax-btn--ghost ax-btn--sm">
            <LogOut className="ax-btn__icon" size={14} aria-hidden="true" />
            <span className="ax-btn__label">Se déconnecter</span>
          </a>
        </div>
      </div>
    </main>
  );
}

function Erreur({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div className="ax-alert ax-alert--danger ax-alert--inline" role="alert">
      <div className="ax-alert__content">
        <p className="ax-alert__message">{message}</p>
      </div>
    </div>
  );
}

function EtapeDaara({ daaras, onDone }: { daaras: DaaraOption[]; onDone: () => void }) {
  const [daaraId, setDaaraId] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const valider = () => {
    const id = Number(daaraId);
    if (!id) return;
    setErreur(null);
    startTransition(async () => {
      const { error } = await chooseDaaraAction(id);
      if (error) setErreur(error);
      else onDone();
    });
  };

  return (
    <>
      <p className="text-sm">
        Choisissez le Daara auquel vous appartenez — cherchez par son nom ou par
        sa zone LDD. Le coordinateur du Daara en sera prévenu. Ce choix ne
        pourra ensuite être modifié que par un administrateur.
      </p>
      <div className="ax-field">
        <label className="ax-field__label" htmlFor="daara">
          Mon Daara
        </label>
        <DaaraCombobox
          id="daara"
          daaras={daaras}
          value={daaraId}
          onChange={setDaaraId}
          placeholder="Rechercher mon Daara…"
        />
      </div>
      <Erreur message={erreur} />
      <button
        type="button"
        className="ax-btn ax-btn--primary self-start"
        onClick={valider}
        disabled={!daaraId || isPending}
      >
        {isPending && (
          <Loader2 className="ax-btn__icon animate-spin" size={16} aria-hidden="true" />
        )}
        <span className="ax-btn__label">Rejoindre ce Daara</span>
      </button>
    </>
  );
}

function EtapeFiche({ profile, onDone }: { profile: Profil; onDone: () => void }) {
  const [erreur, setErreur] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const envoyer = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    /* Les quatre champs sont ceux que l'accueil exige (`CHAMPS_FICHE` côté
       Django) : un vide ici ne ferait que ramener à cette même étape. */
    const manquant = ["birth_date", "gender", "residence_country", "city"].some(
      (k) => !String(fd.get(k) ?? "").trim(),
    );
    if (manquant) {
      setErreur("Les quatre champs sont nécessaires.");
      return;
    }
    setErreur(null);
    startTransition(async () => {
      const { error } = await updateProfile(fd);
      if (error) setErreur(error);
      else onDone();
    });
  };

  return (
    <form className="flex flex-col gap-4" onSubmit={envoyer}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="ax-field">
          <label className="ax-field__label">Date de naissance</label>
          <DatePicker name="birth_date" defaultValue={profile.birth_date || ""} required />
        </div>
        <div className="ax-field">
          <label className="ax-field__label" htmlFor="gender">
            Genre
          </label>
          <select
            id="gender"
            name="gender"
            className="ax-select"
            defaultValue={profile.gender ?? ""}
            required
          >
            <option value="">Choisir…</option>
            <option value="male">Homme</option>
            <option value="female">Femme</option>
          </select>
        </div>
        <div className="ax-field">
          <label className="ax-field__label" htmlFor="residence_country">
            Pays de résidence
          </label>
          <input
            id="residence_country"
            name="residence_country"
            className="ax-input"
            defaultValue={profile.residence_country ?? ""}
            required
          />
        </div>
        <div className="ax-field">
          <label className="ax-field__label" htmlFor="city">
            Ville
          </label>
          <input
            id="city"
            name="city"
            className="ax-input"
            defaultValue={profile.city ?? ""}
            required
          />
        </div>
      </div>
      <Erreur message={erreur} />
      <button type="submit" className="ax-btn ax-btn--primary self-start" disabled={isPending}>
        {isPending && (
          <Loader2 className="ax-btn__icon animate-spin" size={16} aria-hidden="true" />
        )}
        <span className="ax-btn__label">Enregistrer ma fiche</span>
      </button>
    </form>
  );
}
