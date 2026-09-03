"use client";

/*
 * ═══════════════════════════════════════════════════════════════════════════
 * Choisir un nouveau mot de passe
 * ═══════════════════════════════════════════════════════════════════════════
 * Second temps du parcours « mot de passe oublié ». La page /forgot-password
 * existait et envoyait la demande ; celle-ci n'existait pas. Le courriel de
 * réinitialisation menait donc à une adresse morte — c'est pourquoi la vue
 * backend était restée une coquille : rien n'aurait pu recevoir son lien.
 *
 * `uid` et `token` viennent de l'URL, tels que Django les a écrits. La page ne
 * les interprète pas : elle les renvoie au backend, seul juge de leur validité.
 * Un jeton est dérivé du mot de passe actuel et de `last_login` — il devient
 * caduc dès qu'il a servi, sans que rien ne soit stocké.
 *
 * Mise en page reprise de /forgot-password, à dessein : les deux écrans se
 * suivent, et rien ne justifierait qu'ils ne se ressemblent pas.
 */

import { Suspense, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, Eye, EyeOff, KeyRound } from "lucide-react";
import { resetPasswordAction } from "@/app/actions/auth";
import { BrandMark } from "@/components/BrandMark";
import { PASSWORD_MIN_LENGTH } from "@/lib/password";

/*
 * `useSearchParams` force le composant qui l'appelle hors du rendu statique.
 * Sans <Suspense> au-dessus, `next build` refuse de prérendre la page et
 * s'arrête — le même défaut qui bloquait /login. Le hook est donc isolé dans
 * ce composant, et la coque reste statique.
 */
function ResetForm() {
  const params = useSearchParams();
  const router = useRouter();

  const uid = params.get("uid") ?? "";
  const token = params.get("token") ?? "";

  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  /*
   * Lien tronqué — recopié à la main, coupé par un client de messagerie. On le
   * dit tout de suite plutôt que de laisser saisir un mot de passe pour rien.
   */
  if (!uid || !token) {
    return (
      <div className="ax-card">
        <div className="ax-card__body flex flex-col items-center gap-4 text-center">
          <h1 className="text-xl font-semibold tracking-tight">
            Ce lien est incomplet
          </h1>
          <p className="ax-text-muted text-sm leading-relaxed">
            L&apos;adresse ne contient pas tout ce qu&apos;il faut pour vous
            identifier. Elle a peut-être été coupée par votre messagerie.
            Refaites une demande, le nouveau lien sera valable.
          </p>
          <Link
            href="/forgot-password"
            className="ax-btn ax-btn--primary ax-btn--block"
          >
            <span className="ax-btn__label">Demander un nouveau lien</span>
          </Link>
        </div>
      </div>
    );
  }

  if (isSuccess) {
    return (
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
              Mot de passe modifié
            </h1>
            <p className="ax-text-muted mt-2 text-sm leading-relaxed">
              Vous pouvez maintenant vous connecter. Vos autres sessions ont
              été fermées&nbsp;: si vous étiez connecté ailleurs, il faudra
              vous y reconnecter.
            </p>
          </div>

          <Link href="/login" className="ax-btn ax-btn--primary ax-btn--block">
            <span className="ax-btn__label">Se connecter</span>
          </Link>
        </div>
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMsg("");

    const data = new FormData(e.currentTarget);
    const password = String(data.get("password") ?? "");
    const confirmation = String(data.get("confirmation") ?? "");

    // Vérifié ici parce que le backend ne voit qu'un seul mot de passe : la
    // confirmation n'existe que pour attraper une faute de frappe.
    if (password !== confirmation) {
      setErrorMsg("Les deux mots de passe ne correspondent pas.");
      return;
    }

    startTransition(async () => {
      const res = await resetPasswordAction(uid, token, password);
      if (res.error) {
        setErrorMsg(res.error);
        return;
      }
      setIsSuccess(true);
      // Le formulaire de connexion est préparé en arrière-plan : l'écran de
      // confirmation reste affiché, mais le clic suivant est instantané.
      router.prefetch("/login");
    });
  };

  return (
    <>
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          Choisissez un nouveau mot de passe
        </h1>
        <p className="ax-text-muted mt-1.5 text-sm">
          Il remplacera l&apos;ancien sur tous vos appareils.
        </p>
      </div>

      <div className="ax-card">
        <div className="ax-card__body">
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <div className="ax-field">
              <label className="ax-field__label" htmlFor="password">
                Nouveau mot de passe
              </label>
              <div className="ax-field__control">
                <span className="ax-field__affix ax-field__affix--leading">
                  <KeyRound aria-hidden="true" />
                </span>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  minLength={PASSWORD_MIN_LENGTH}
                  className="ax-input ax-input--lg ax-input--with-leading-icon"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="ax-field__affix ax-field__affix--button"
                  aria-label={
                    showPassword
                      ? "Masquer le mot de passe"
                      : "Afficher le mot de passe"
                  }
                >
                  {showPassword ? (
                    <EyeOff aria-hidden="true" />
                  ) : (
                    <Eye aria-hidden="true" />
                  )}
                </button>
              </div>
              <p className="ax-field__message">
                {PASSWORD_MIN_LENGTH} caractères au minimum. Évitez un mot de
                passe déjà utilisé ailleurs.
              </p>
            </div>

            <div className="ax-field">
              <label className="ax-field__label" htmlFor="confirmation">
                Confirmez le mot de passe
              </label>
              <div className="ax-field__control">
                <span className="ax-field__affix ax-field__affix--leading">
                  <KeyRound aria-hidden="true" />
                </span>
                <input
                  id="confirmation"
                  name="confirmation"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  minLength={PASSWORD_MIN_LENGTH}
                  className="ax-input ax-input--lg ax-input--with-leading-icon"
                  placeholder="••••••••"
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
                {isPending ? "Enregistrement…" : "Enregistrer le mot de passe"}
              </span>
            </button>
          </form>
        </div>
      </div>

      <p className="ax-text-muted mt-6 text-center text-sm">
        Le lien ne fonctionne plus&nbsp;?{" "}
        <Link href="/forgot-password" className="ax-link">
          Demandez-en un nouveau
        </Link>
      </p>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-dvh items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <BrandMark href="/" size="md" className="justify-center" />
        </div>

        <Suspense fallback={null}>
          <ResetForm />
        </Suspense>
      </div>
    </div>
  );
}
