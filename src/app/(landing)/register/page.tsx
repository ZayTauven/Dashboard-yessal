"use client";

import { useState, useTransition } from "react";
import { registerAction } from "@/app/actions/auth";
import Link from "next/link";
import { Eye, EyeOff, UserPlus, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BrandMark } from "@/components/BrandMark";

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  async function handleRegister(formData: FormData) {
    setErrorMsg("");
    startTransition(async () => {
      const res = await registerAction(formData);
      if (res.error) {
        setErrorMsg(res.error);
      } else {
        setIsSuccess(true);
      }
    });
  }

  if (isSuccess) {
      return (
        <div className="min-h-screen flex items-center justify-center px-4 bg-background">
            <div className="w-full max-w-sm text-center space-y-6">
                <div className="h-20 w-20 bg-yessal-green/10 text-yessal-green rounded-full flex items-center justify-center mx-auto shadow-sm border border-yessal-green/20">
                    <UserPlus size={32} />
                </div>
                <h1 className="text-2xl font-black tracking-tight text-foreground">Demande Envoyée !</h1>
                <p className="text-sm text-muted-foreground leading-relaxed">
                    Votre demande d'adhésion au réseau Yessal Gui a été transmise. 
                    Un administrateur doit valider votre compte avant que vous puissiez vous connecter.
                </p>
                <Button asChild className="w-full bg-yessal-green hover:bg-green-700 text-white rounded-xl h-12 shadow-xl shadow-yessal-green/10">
                    <Link href="/login">Retour à la connexion</Link>
                </Button>
            </div>
        </div>
      );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-background">
      <div className="w-full max-w-md">
        <Link href="/login" className="flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-yessal-green transition-colors mb-8 uppercase tracking-widest">
            <ChevronLeft size={14} /> Retour
        </Link>

        <div className="text-center mb-8">
          <BrandMark href="/" size="md" className="justify-center" />
          <h1 className="mt-3 text-3xl font-black tracking-tighter text-foreground">Rejoindre Yessal</h1>
          <p className="mt-2 text-sm text-muted-foreground font-medium uppercase tracking-widest opacity-80">Réseau d'appui à la Grande Mosquée</p>
        </div>

        <form action={handleRegister} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Prénom</Label>
                <Input name="first_name" placeholder="Moussa" required className="h-11 rounded-xl bg-muted/20 border-none px-4" />
            </div>
            <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Nom</Label>
                <Input name="last_name" placeholder="Diop" required className="h-11 rounded-xl bg-muted/20 border-none px-4" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Email</Label>
            <Input name="email" type="email" placeholder="moussa@exemple.com" required className="h-11 rounded-xl bg-muted/20 border-none px-4" />
          </div>

          <div className="space-y-1.5">
            <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Téléphone</Label>
            <Input name="phone" placeholder="+221 77 ..." className="h-11 rounded-xl bg-muted/20 border-none px-4" />
          </div>

          <div className="space-y-1.5">
            <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Mot de passe</Label>
            <div className="relative">
              <Input
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                required
                className="h-11 rounded-xl bg-muted/20 border-none px-4 pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-yessal-green transition-colors"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {errorMsg && (
            <p className="text-destructive text-xs font-bold text-center mt-2 animate-pulse">{errorMsg}</p>
          )}

          <Button
            type="submit"
            disabled={isPending}
            className="w-full mt-4 bg-yessal-green hover:bg-green-700 text-white rounded-xl h-12 font-black uppercase tracking-widest text-xs shadow-xl shadow-yessal-green/10 border-none transition-all hover:scale-[1.02] active:scale-95"
          >
            {isPending ? "Création..." : "S'inscrire au réseau"}
          </Button>
        </form>

        <p className="text-center text-xs text-muted-foreground mt-8 font-medium">
          Vous avez déjà un compte ?{" "}
          <Link href="/login" className="text-yessal-green font-bold">Connectez-vous</Link>
        </p>
      </div>
    </div>
  );
}
