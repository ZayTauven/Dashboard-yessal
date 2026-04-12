"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { loginAction } from "@/app/actions/auth";
import Link from "next/link";
import { Eye, EyeOff, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BrandMark } from "@/components/BrandMark";

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
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "var(--background)" }}
    >
      <div className="w-full max-w-sm">
        {/* Logo / nom */}
        <div className="text-center mb-8">
          <BrandMark href="/" size="md" className="justify-center" />
          <h1
            className="mt-3 text-2xl"
            style={{
              fontWeight: 300,
              letterSpacing: "-0.02em",
              color: "var(--foreground)",
            }}
          >
            Connexion à votre espace
          </h1>
          <p className="mt-2 text-sm" style={{ color: "var(--muted-foreground)" }}>
            Réservé aux membres de la confrérie
          </p>
        </div>

        {/* Formulaire */}
        <form
          className="flex flex-col gap-4"
          action={handleLogin}
        >
          <div className="flex flex-col gap-1.5">
            <Label
              htmlFor="email"
              className="text-sm"
              style={{ color: "var(--foreground)" }}
            >
              Adresse email
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="nom@exemple.com"
              required
              style={{
                borderRadius: "8px",
                height: "44px",
                background: "var(--background)",
                border: "1px solid var(--border)",
                color: "var(--foreground)",
                fontSize: "15px",
              }}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <Label
                htmlFor="password"
                className="text-sm"
                style={{ color: "var(--foreground)" }}
              >
                Mot de passe
              </Label>
              <Link
                href="/forgot-password"
                className="text-xs hover:text-yessal-green transition-colors font-medium underline underline-offset-4 decoration-muted-foreground/30"
                style={{ color: "var(--muted-foreground)" }}
              >
                Mot de passe oublié ?
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
                style={{
                  borderRadius: "8px",
                  height: "44px",
                  background: "var(--background)",
                  border: "1px solid var(--border)",
                  color: "var(--foreground)",
                  fontSize: "15px",
                  paddingRight: "40px",
                }}
              />
              <button
                type="button"
                aria-label={showPassword ? "Masquer" : "Afficher"}
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2"
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

          {errorMsg && (
            <div className="text-destructive text-sm font-medium mt-1">
              {errorMsg}
            </div>
          )}

          <Button
            type="submit"
            id="btn-connexion"
            className="mt-2 gap-2"
            disabled={isPending}
            style={{
              background: "var(--yessal-green)",
              color: "#FAFAF8",
              borderRadius: "8px",
              height: "48px",
              fontSize: "15px",
              fontWeight: 500,
            }}
          >
            <LogIn size={16} strokeWidth={1.5} />
            {isPending ? "Connexion..." : "Connexion"}
          </Button>
        </form>

        {/* Pied de page */}
        <p
          className="text-center text-xs mt-8"
          style={{ color: "var(--muted-foreground)" }}
        >
          Pas encore de compte ?{" "}
          <Link href="/register" className="font-bold underline underline-offset-4 decoration-yessal-green/30 transition-all hover:decoration-yessal-green" style={{ color: "var(--yessal-green)" }}>
            S'inscrire au réseau
          </Link>
        </p>

        <p
          className="text-center text-xs mt-3"
          style={{ color: "var(--border)" }}
        >
          Votre compte est validé par un administrateur.
        </p>
      </div>
    </div>
  );
}
