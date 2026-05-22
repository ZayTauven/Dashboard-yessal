"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { loginAction } from "@/app/actions/auth";
import Link from "next/link";
import { Eye, EyeOff, LogIn, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BrandMark } from "@/components/BrandMark";
import { ErrorAlert } from "@/components/ui/error-alert";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState("");
  const router = useRouter();

  async function handleLogin(formData: FormData) {
    setErrorMsg("");
    startTransition(async () => {
      const res = await loginAction(formData);
      if (res.error) {
        setErrorMsg(res.error);
      } else if (res.success) {
        router.push("/dashboard");
      }
    });
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 relative"
      style={{ background: "var(--background)" }}
    >
      {/* Retour accueil */}
      <div className="absolute top-5 left-5">
        <Link href="/">
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 text-sm"
            style={{ color: "var(--muted-foreground)" }}
          >
            <ArrowLeft size={14} strokeWidth={1.5} />
            Accueil
          </Button>
        </Link>
      </div>

      {/* Halo décoratif violet */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(145,110,231,0.12) 0%, transparent 70%)",
        }}
      />

      <div className="w-full max-w-sm relative">
        {/* Logo */}
        <div className="text-center mb-8">
          <BrandMark href="/" size="md" className="justify-center" />
          <h1
            className="mt-4 text-2xl"
            style={{
              fontWeight: 300,
              letterSpacing: "-0.025em",
              color: "var(--foreground)",
            }}
          >
            Connexion à votre espace
          </h1>
          <p className="mt-1.5 text-sm" style={{ color: "var(--muted-foreground)" }}>
            Réservé aux membres de la confrérie
          </p>
        </div>

        {/* Card formulaire */}
        <div
          className="rounded-2xl p-7 flex flex-col gap-5"
          style={{
            background: "var(--card)",
            border: "1px solid var(--border)",
            boxShadow:
              "0 1px 3px rgba(0,0,0,0.04), 0 8px 32px rgba(145,110,231,0.08)",
          }}
        >
          <form className="flex flex-col gap-5" action={handleLogin}>
            {/* Identifiant */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="identifier" className="text-sm font-medium">
                Email ou téléphone
              </Label>
              <Input
                id="identifier"
                name="identifier"
                type="text"
                autoComplete="email"
                placeholder="nom@exemple.com ou +221…"
                required
                className="h-11 text-[15px]"
              />
            </div>

            {/* Mot de passe */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-medium">
                  Mot de passe
                </Label>
                <Link
                  href="/forgot-password"
                  className="text-xs font-medium transition-colors hover:underline underline-offset-4"
                  style={{ color: "var(--yessal-violet)" }}
                >
                  Oublié ?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  required
                  className="h-11 text-[15px] pr-10"
                />
                <button
                  type="button"
                  aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors hover:opacity-80"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  {showPassword ? (
                    <EyeOff size={16} strokeWidth={1.5} />
                  ) : (
                    <Eye size={16} strokeWidth={1.5} />
                  )}
                </button>
              </div>
            </div>

            {/* Erreur */}
            {errorMsg && <ErrorAlert message={errorMsg} />}

            {/* Submit */}
            <Button
              type="submit"
              disabled={isPending}
              className="w-full h-11 gap-2 text-[15px] font-medium mt-1"
              style={{
                background: isPending
                  ? "color-mix(in srgb, var(--yessal-violet) 70%, transparent)"
                  : "var(--yessal-violet)",
                color: "#ffffff",
                borderRadius: "10px",
                boxShadow: isPending
                  ? "none"
                  : "0 4px 14px rgba(145,110,231,0.35)",
                transition: "all 0.2s ease",
              }}
            >
              <LogIn size={16} strokeWidth={1.5} />
              {isPending ? "Connexion en cours…" : "Se connecter"}
            </Button>
          </form>
        </div>

        {/* Pied de page */}
        <p className="text-center text-xs mt-5" style={{ color: "var(--muted-foreground)" }}>
          Pas encore de compte ?{" "}
          <Link
            href="/register"
            className="font-semibold transition-colors hover:underline underline-offset-4"
            style={{ color: "var(--yessal-violet)" }}
          >
            Demander un accès
          </Link>
        </p>

        <p
          className="text-center text-[11px] mt-3"
          style={{ color: "var(--border)" }}
        >
          Votre compte est validé par un administrateur.
        </p>
      </div>
    </div>
  );
}
