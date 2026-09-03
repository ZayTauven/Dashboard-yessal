"use client";

/*
 * ═══════════════════════════════════════════════════════════════════════════
 * Demande d'adhésion
 * ═══════════════════════════════════════════════════════════════════════════
 * Repris du patron `auth/SignUpCover` de Vireo, en miroir de l'écran de
 * connexion : couverture à gauche sur grand écran, formulaire à droite.
 *
 * La correction principale porte sur le choix du Daara. L'ancienne version
 * juxtaposait un champ de recherche ET un `<select>` tronqué aux six premiers
 * résultats, avec une note en dessous : « 6 suggestions affichées. Utilisez la
 * recherche pour en trouver d'autres. » Autrement dit, la liste ne montrait
 * pas ce qu'elle contenait, et il fallait deviner le nom exact de son Daara
 * pour le voir apparaître — sur un écran d'inscription, pour quelqu'un qui
 * découvre la plateforme.
 *
 * <DaaraCombobox> affiche TOUT, groupé par zone LDD, avec une recherche qui
 * filtre à l'intérieur. C'est le même composant que celui de l'administration :
 * un Daara se choisit de la même façon partout.
 *
 * Le `<select>` disparaissant, la valeur part au serveur par un champ caché —
 * le nom `daara_id` attendu par `registerAction` est inchangé.
 */

import { useState, useTransition } from "react";
import Link from "next/link";
import { ChevronLeft, Eye, EyeOff, UserPlus } from "lucide-react";
import { registerAction } from "@/app/actions/auth";
import { BrandMark } from "@/components/BrandMark";
import PhoneNumberValidation from "@/components/PhoneNumberValidation";
import { CoverBand } from "@/components/vireo/CoverBand";
import { DaaraCombobox } from "@/components/vireo/DaaraCombobox";

type DaaraOption = {
  id: number;
  name: string;
  ldd?: {
    code: string;
    name: string;
  };
};

export default function RegisterClient({ daaras }: { daaras: DaaraOption[] }) {
  const [showPassword, setShowPassword] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [daaraId, setDaaraId] = useState("");

  const handleRegister = (formData: FormData) => {
    setErrorMsg("");
    startTransition(async () => {
      const res = await registerAction(formData);
      if (res.error) {
        setErrorMsg(res.error);
        return;
      }
      setIsSuccess(true);
    });
  };

  if (isSuccess) {
    return (
      <div className="flex min-h-dvh items-center justify-center px-4 py-10">
        <div className="w-full max-w-sm">
          <div className="mb-8 text-center">
            <BrandMark href="/" size="md" className="justify-center" />
          </div>

          <div className="ax-card">
            <div className="ax-card__body flex flex-col items-center gap-4 text-center">
              <span
                className="ax-modal__status ax-modal__status--success"
                aria-hidden="true"
              >
                <UserPlus />
              </span>

              <div>
                <h1 className="text-xl font-semibold tracking-tight">
                  Demande envoyée
                </h1>
                <p className="ax-text-muted mt-2 text-sm leading-relaxed">
                  Votre demande d&apos;adhésion a été transmise. Un
                  administrateur doit valider votre compte avant votre première
                  connexion.
                </p>
              </div>

              <Link href="/login" className="ax-btn ax-btn--primary ax-btn--block">
                <span className="ax-btn__label">Retour à la connexion</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid min-h-dvh grid-cols-1 lg:grid-cols-[48%_52%]">
      {/* ── Couverture ── */}
      <aside className="relative hidden lg:block">
        <CoverBand height={2000} className="absolute inset-0" />

        <div className="relative flex h-full flex-col justify-between p-12">
          <BrandMark href="/" size="md" />

          <div className="max-w-md">
            <p className="ax-eyebrow mb-3">Rejoindre la confrérie</p>
            <p className="text-2xl leading-snug font-medium text-foreground">
              Rattachez-vous à votre Daara pour suivre les Ndiguels et
              contribuer aux Jëfs.
            </p>
            <p className="ax-text-muted mt-4 text-sm">
              Votre demande est examinée par un administrateur avant activation.
            </p>
          </div>

          <p className="ax-text-subtle text-xs">
            Vos données restent réservées à la confrérie.
          </p>
        </div>
      </aside>

      {/* ── Formulaire ── */}
      <main className="relative flex items-center justify-center px-4 py-10">
        <Link
          href="/login"
          className="ax-btn ax-btn--ghost ax-btn--sm absolute top-5 left-5"
        >
          <ChevronLeft className="ax-btn__icon" size={14} aria-hidden="true" />
          <span className="ax-btn__label">Connexion</span>
        </Link>

        <div className="w-full max-w-md">
          <div className="mb-8 text-center lg:hidden">
            <BrandMark href="/" size="md" className="justify-center" />
          </div>

          <div className="mb-8 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">
              Demander un accès
            </h1>
            <p className="ax-text-muted mt-1.5 text-sm">
              Quelques informations, et votre demande part à l&apos;administrateur.
            </p>
          </div>

          <div className="ax-card">
            <div className="ax-card__body">
              <form className="flex flex-col gap-6" action={handleRegister}>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="ax-field">
                    <label className="ax-field__label" htmlFor="first_name">
                      Prénom
                      <span className="ax-field__required" aria-hidden="true"> *</span>
                    </label>
                    <input
                      id="first_name"
                      name="first_name"
                      className="ax-input"
                      autoComplete="given-name"
                      placeholder="Amadou"
                      required
                    />
                  </div>

                  <div className="ax-field">
                    <label className="ax-field__label" htmlFor="last_name">
                      Nom
                      <span className="ax-field__required" aria-hidden="true"> *</span>
                    </label>
                    <input
                      id="last_name"
                      name="last_name"
                      className="ax-input"
                      autoComplete="family-name"
                      placeholder="Ndiaye"
                      required
                    />
                  </div>
                </div>

                <div className="ax-field">
                  <label className="ax-field__label" htmlFor="email">
                    Adresse e-mail
                    <span className="ax-field__required" aria-hidden="true"> *</span>
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    className="ax-input"
                    autoComplete="email"
                    placeholder="nom@exemple.com"
                    required
                  />
                </div>

                <div className="ax-field">
                  <PhoneNumberValidation name="phone" required />
                </div>

                <div className="ax-field">
                  <label className="ax-field__label" htmlFor="daara">
                    Votre Daara
                    <span className="ax-field__required" aria-hidden="true"> *</span>
                  </label>

                  {daaras.length === 0 ? (
                    <p className="ax-field__message ax-field__message--error">
                      Aucun Daara n&apos;est actif pour le moment. Contactez un
                      administrateur.
                    </p>
                  ) : (
                    <>
                      <DaaraCombobox
                        id="daara"
                        daaras={daaras}
                        value={daaraId}
                        onChange={setDaaraId}
                        neutralLabel="Je ne sais pas encore"
                        placeholder="Rechercher votre Daara…"
                      />
                      {/* Le combobox n'est pas un `<select>` natif : la valeur
                          part au serveur par ce champ caché. */}
                      <input type="hidden" name="daara_id" value={daaraId} />
                      <p className="ax-field__hint">
                        Cherchez par nom de Daara ou par zone LDD.
                      </p>
                    </>
                  )}
                </div>

                <div className="ax-field">
                  <label className="ax-field__label" htmlFor="password">
                    Mot de passe
                    <span className="ax-field__required" aria-hidden="true"> *</span>
                  </label>
                  <div className="ax-field__control">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      className="ax-input ax-input--with-trailing"
                      autoComplete="new-password"
                      placeholder="••••••••"
                      required
                    />
                    <button
                      type="button"
                      className="ax-field__affix ax-field__affix--trailing ax-field__affix--button"
                      aria-label={
                        showPassword
                          ? "Masquer le mot de passe"
                          : "Afficher le mot de passe"
                      }
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff aria-hidden="true" />
                      ) : (
                        <Eye aria-hidden="true" />
                      )}
                    </button>
                  </div>
                </div>

                {errorMsg && (
                  <p
                    className="ax-field__message ax-field__message--error"
                    role="alert"
                  >
                    {errorMsg}
                  </p>
                )}

                <button
                  type="submit"
                  className="ax-btn ax-btn--primary ax-btn--lg ax-btn--block"
                  disabled={isPending || daaras.length === 0}
                >
                  <UserPlus className="ax-btn__icon" size={16} aria-hidden="true" />
                  <span className="ax-btn__label">
                    {isPending ? "Envoi…" : "Envoyer ma demande"}
                  </span>
                </button>
              </form>
            </div>
          </div>

          <p className="ax-text-muted mt-5 text-center text-sm">
            Vous avez déjà un compte ?{" "}
            <Link href="/login" className="ax-link font-medium">
              Se connecter
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
