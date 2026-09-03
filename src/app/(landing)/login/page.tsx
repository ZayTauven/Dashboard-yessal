"use client";

/*
 * ═══════════════════════════════════════════════════════════════════════════
 * Connexion
 * ═══════════════════════════════════════════════════════════════════════════
 * Repris du patron `auth/SignInCover` de Vireo : une couverture à gauche sur
 * grand écran, le formulaire à droite, et le formulaire seul en dessous de lg.
 *
 * Note d'intégration : `.ax-auth-cover` n'est PAS un contrat partagé de Vireo —
 * c'est une balise `<style>` locale à son écran. La grille est donc refaite en
 * utilitaires ici, plutôt que d'importer une classe qui n'existe pas dans les
 * feuilles portées.
 *
 * Corrections de fond :
 *
 *   · Le bouton et les liens étaient peints sur `var(--yessal-violet)` en dur,
 *     avec une ombre `rgba(145,110,231,0.35)` de la même couleur écrite en
 *     chiffres. Sur l'écran d'entrée du produit, c'est précisément là qu'il
 *     faut voir l'accent choisi dans le Customizer.
 *
 *   · Le halo décoratif reprenait le même violet littéral.
 *
 *   · Le champ mot de passe portait son bouton œil en position absolue calculée
 *     à la main ; il passe sur `.ax-field__affix--button`.
 */

import { Suspense, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Eye, EyeOff, LogIn } from "lucide-react";
import { loginAction } from "@/app/actions/auth";
import { BrandMark } from "@/components/BrandMark";
import { ErrorAlert } from "@/components/ui/error-alert";
import { CoverBand } from "@/components/vireo/CoverBand";

/*
 * ═══════════════════════════════════════════════════════════════════════════
 * Le message « session fermée », isolé derrière une frontière Suspense
 * ═══════════════════════════════════════════════════════════════════════════
 * `useSearchParams()` était appelé directement dans <LoginPage>. Or ce hook
 * force le composant qui l'appelle à sortir du rendu statique : sans
 * <Suspense> au-dessus, Next refuse de prérendre la page et `next build`
 * s'arrête net —
 *
 *     useSearchParams() should be wrapped in a suspense boundary at "/login"
 *
 * — ce qui rendait la compilation de production impossible, et donc l'image
 * Docker de production non constructible. Le développement, lui, ne prérend
 * rien : le défaut ne se voyait qu'au build.
 *
 * Le hook descend donc dans ce composant minuscule. La page reste statique ;
 * seul ce message attend les paramètres d'URL.
 */
function RevokedNotice() {
  /*
   * Arrivé ici depuis /logout?reason=revoked : la session a été fermée à
   * distance, pas expirée d'elle-même. La distinction compte — c'est souvent
   * le membre lui-même qui l'a demandée, et il doit savoir que ça a marché.
   */
  const revoked = useSearchParams().get("reason") === "revoked";
  if (!revoked) return null;

  return (
    <div className="ax-alert ax-alert--info ax-alert--inline">
      <div className="ax-alert__content">
        <p className="ax-alert__message">
          Votre session a été fermée parce que le mot de passe de ce compte a
          changé. Connectez-vous avec le nouveau.
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState("");

  const router = useRouter();

  const handleLogin = (formData: FormData) => {
    setErrorMsg("");
    startTransition(async () => {
      const res = await loginAction(formData);
      if (res.error) {
        setErrorMsg(res.error);
        return;
      }
      if (res.success) router.push("/dashboard");
    });
  };

  return (
    <div className="grid min-h-dvh grid-cols-1 lg:grid-cols-[52%_48%]">
      {/* ── Couverture — masquée sous lg, où elle volerait la place au formulaire ── */}
      <aside className="relative hidden lg:block">
        <CoverBand height={2000} className="absolute inset-0" />

        <div className="relative flex h-full flex-col justify-between p-12">
          <BrandMark href="/" size="md" />

          <div className="max-w-md">
            <p className="ax-eyebrow mb-3">Yessal Gui</p>
            <p className="text-2xl leading-snug font-medium text-foreground">
              La plateforme de la confrérie : Jëfs, Ndiguels, fêtes et
              actualités, réunis en un seul endroit.
            </p>
            <p className="ax-text-muted mt-4 text-sm">
              Chaque contribution est tracée, chaque Daara y trouve sa place.
            </p>
          </div>

          <p className="ax-text-subtle text-xs">
            Votre compte est validé par un administrateur.
          </p>
        </div>
      </aside>

      {/* ── Formulaire ── */}
      <main className="relative flex items-center justify-center px-4 py-10">
        <Link
          href="/"
          className="ax-btn ax-btn--ghost ax-btn--sm absolute top-5 left-5"
        >
          <ArrowLeft className="ax-btn__icon" size={14} aria-hidden="true" />
          <span className="ax-btn__label">Accueil</span>
        </Link>

        <div className="w-full max-w-md">
          <div className="mb-8 text-center lg:hidden">
            <BrandMark href="/" size="md" className="justify-center" />
          </div>

          <div className="mb-8 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">
              Connexion à votre espace
            </h1>
            <p className="ax-text-muted mt-1.5 text-sm">
              Réservé aux membres de la confrérie.
            </p>
          </div>

          <div className="ax-card">
            <div className="ax-card__body">
              <form className="flex flex-col gap-6" action={handleLogin}>
                <div className="ax-field">
                  <label className="ax-field__label" htmlFor="identifier">
                    E-mail ou téléphone
                  </label>
                  <input
                    id="identifier"
                    name="identifier"
                    type="text"
                    autoComplete="username"
                    className="ax-input ax-input--lg"
                    placeholder="nom@exemple.com ou +221…"
                    required
                  />
                </div>

                <div className="ax-field">
                  <div className="flex items-center justify-between">
                    <label className="ax-field__label" htmlFor="password">
                      Mot de passe
                    </label>
                    <Link href="/forgot-password" className="ax-link text-xs">
                      Oublié ?
                    </Link>
                  </div>

                  <div className="ax-field__control">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      className="ax-input ax-input--lg ax-input--with-trailing"
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

                {!errorMsg && (
                  <Suspense fallback={null}>
                    <RevokedNotice />
                  </Suspense>
                )}

                {errorMsg && <ErrorAlert message={errorMsg} />}

                <button
                  type="submit"
                  className="ax-btn ax-btn--primary ax-btn--lg ax-btn--block"
                  disabled={isPending}
                >
                  <LogIn className="ax-btn__icon" size={16} aria-hidden="true" />
                  <span className="ax-btn__label">
                    {isPending ? "Connexion…" : "Se connecter"}
                  </span>
                </button>
              </form>
            </div>
          </div>

          <p className="ax-text-muted mt-5 text-center text-sm">
            Pas encore de compte ?{" "}
            <Link href="/register" className="ax-link font-medium">
              Demander un accès
            </Link>
          </p>

          <p className="ax-text-subtle mt-3 text-center text-xs lg:hidden">
            Votre compte est validé par un administrateur.
          </p>
        </div>
      </main>
    </div>
  );
}
