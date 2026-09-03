"use client";

/*
 * ═══════════════════════════════════════════════════════════════════════════
 * Mot de passe oublié
 * ═══════════════════════════════════════════════════════════════════════════
 * Repris du patron `auth/ResetPasswordBasic` de Vireo : une carte centrée, un
 * seul champ, et un état de confirmation qui remplace le formulaire.
 *
 * Corrections de fond :
 *
 *   · Le disque de confirmation était peint en `bg-yessal-violet/10` AVEC une
 *     bordure `border-green-100` — deux teintes sans rapport l'une avec
 *     l'autre, et un vert qui n'apparaît nulle part ailleurs sur cet écran.
 *
 *   · Le sous-titre était en `uppercase tracking-widest opacity-80` : une
 *     phrase entière en capitales espacées, difficile à lire et inutilement
 *     criarde pour une simple consigne.
 *
 *   · Le message d'erreur portait `animate-shake` — une secousse à chaque
 *     échec, que `prefers-reduced-motion` devrait supprimer et qui n'apporte
 *     rien qu'un texte d'alerte ne dise mieux.
 *
 *   · Le lien de bas de page menait vers « Maintenance Centrale », un libellé
 *     interne qui ne veut rien dire pour un membre de la confrérie.
 */

import { useState, useTransition } from "react";
import Link from "next/link";
import { CheckCircle2, ChevronLeft, Mail } from "lucide-react";
import { forgotPasswordAction } from "@/app/actions/auth";
import { BrandMark } from "@/components/BrandMark";

export default function ForgotPasswordPage() {
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMsg("");
    const email = String(new FormData(e.currentTarget).get("email") ?? "");

    startTransition(async () => {
      const res = await forgotPasswordAction(email);
      if (res.error) {
        setErrorMsg(res.error);
        return;
      }
      setIsSuccess(true);
    });
  };

  return (
    <div className="flex min-h-dvh items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <BrandMark href="/" size="md" className="justify-center" />
        </div>

        {isSuccess ? (
          <div className="ax-card">
            <div className="ax-card__body flex flex-col items-center gap-4 text-center">
              <span
                className="ax-modal__status ax-modal__status--success"
                aria-hidden="true"
              >
                <CheckCircle2 />
              </span>

              <div>
                <h1 className="text-xl font-semibold tracking-tight">
                  Message envoyé
                </h1>
                <p className="ax-text-muted mt-2 text-sm leading-relaxed">
                  Si un compte existe avec cette adresse, un lien de
                  réinitialisation vient d&apos;y être envoyé. Pensez à
                  vérifier vos indésirables.
                </p>
              </div>

              <Link href="/login" className="ax-btn ax-btn--primary ax-btn--block">
                <span className="ax-btn__label">Retour à la connexion</span>
              </Link>
            </div>
          </div>
        ) : (
          <>
            <Link href="/login" className="ax-btn ax-btn--ghost ax-btn--sm mb-4">
              <ChevronLeft className="ax-btn__icon" size={14} aria-hidden="true" />
              <span className="ax-btn__label">Retour à la connexion</span>
            </Link>

            <div className="mb-8 text-center">
              <h1 className="text-2xl font-semibold tracking-tight">
                Mot de passe oublié
              </h1>
              <p className="ax-text-muted mt-1.5 text-sm">
                Saisissez l&apos;adresse liée à votre compte membre.
              </p>
            </div>

            <div className="ax-card">
              <div className="ax-card__body">
                <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                  <div className="ax-field">
                    <label className="ax-field__label" htmlFor="email">
                      Adresse e-mail
                    </label>
                    <div className="ax-field__control">
                      <span className="ax-field__affix ax-field__affix--leading">
                        <Mail aria-hidden="true" />
                      </span>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        className="ax-input ax-input--lg ax-input--with-leading-icon"
                        placeholder="nom@exemple.com"
                        required
                      />
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
                    disabled={isPending}
                  >
                    <span className="ax-btn__label">
                      {isPending ? "Envoi…" : "Envoyer le lien"}
                    </span>
                  </button>
                </form>
              </div>
            </div>

            <p className="ax-text-muted mt-5 text-center text-sm">
              Besoin d&apos;aide ?{" "}
              <Link href="/contact" className="ax-link font-medium">
                Contactez-nous
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
