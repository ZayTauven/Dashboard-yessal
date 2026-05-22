"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { ChevronLeft, Eye, EyeOff, UserPlus } from "lucide-react";

import { registerAction } from "@/app/actions/auth";
import { BrandMark } from "@/components/BrandMark";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import PhoneNumberValidation from "@/components/PhoneNumberValidation";

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
  const [searchQuery, setSearchQuery] = useState("");

  const filteredDaaras = daaras
    .filter((daara) => {
      const q = searchQuery.toLowerCase().trim();
      if (!q) return true;
      return (
        daara.name?.toLowerCase().includes(q) ||
        daara.ldd?.code?.toLowerCase().includes(q) ||
        daara.ldd?.name?.toLowerCase().includes(q)
      );
    })
    .slice(0, searchQuery.trim() ? undefined : 6);

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
          <div className="h-20 w-20 bg-yessal-violet/10 text-yessal-violet rounded-full flex items-center justify-center mx-auto shadow-sm border border-yessal-violet/20">
            <UserPlus size={32} />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-foreground">
            Demande envoyée
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Votre demande d&apos;adhésion au réseau Yessal Gui a été transmise.
            Un administrateur doit valider votre compte avant la première
            connexion.
          </p>
          <Button
            asChild
            className="w-full bg-yessal-violet hover:bg-violet-700 text-white rounded-xl h-12 shadow-xl shadow-yessal-violet/10"
          >
            <Link href="/login">Retour à la connexion</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-background">
      <div className="w-full max-w-md">
        <Link
          href="/login"
          className="flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-yessal-violet transition-colors mb-8 uppercase tracking-widest"
        >
          <ChevronLeft size={14} /> Retour
        </Link>

        <div className="text-center mb-8">
          <BrandMark href="/" size="md" className="justify-center" />
          <h1 className="mt-3 text-3xl font-black tracking-tighter text-foreground">
            Rejoindre Yessal
          </h1>
          <p className="mt-2 text-sm text-muted-foreground font-medium uppercase tracking-widest opacity-80">
            Réseau d&apos;appui à la Grande Mosquée
          </p>
        </div>

        <form action={handleRegister} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">
                Prénom
              </Label>
              <Input
                name="first_name"
                placeholder="Moussa"
                required
                className="h-11 rounded-xl bg-muted/20 border-none px-4"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">
                Nom
              </Label>
              <Input
                name="last_name"
                placeholder="Diop"
                required
                className="h-11 rounded-xl bg-muted/20 border-none px-4"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">
              Email (optionnel si téléphone)
            </Label>
            <Input
              name="email"
              type="email"
              placeholder="moussa@exemple.com"
              className="h-11 rounded-xl bg-muted/20 border-none px-4"
            />
          </div>

          <PhoneNumberValidation />

          <div className="space-y-1.5">
            <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">
              Daara
            </Label>
            <div className="space-y-2">
              <Input
                type="text"
                placeholder="Rechercher votre Daara (nom ou code)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 text-xs rounded-lg bg-muted/10 border-dashed"
              />
              <select
                name="daara_id"
                required
                defaultValue=""
                className="flex h-11 w-full rounded-xl bg-muted/20 dark:bg-card px-4 text-sm border-none text-foreground dark:text-foreground focus:ring-2 focus:ring-yessal-violet dark:focus:ring-yessal-violet/50 cursor-pointer"
              >
                <option
                  value=""
                  disabled
                  className="dark:bg-card dark:text-foreground"
                >
                  {searchQuery
                    ? `${filteredDaaras.length} résultat(s) trouvé(s)`
                    : "Sélectionnez parmi les suggestions"}
                </option>
                {filteredDaaras.map((daara) => (
                  <option
                    key={daara.id}
                    value={daara.id}
                    className="dark:bg-card dark:text-foreground"
                  >
                    {daara.ldd?.code ? `${daara.ldd.code} - ` : ""}
                    {daara.name}
                  </option>
                ))}
              </select>
            </div>
            {daaras.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                Aucun Daara actif n&apos;est disponible pour le moment.
              </p>
            ) : filteredDaaras.length === 0 && searchQuery ? (
              <p className="text-xs text-destructive font-medium">
                Aucun Daara ne correspond à &quot;{searchQuery}&quot;
              </p>
            ) : !searchQuery && daaras.length > 6 ? (
              <p className="text-[10px] text-muted-foreground italic ml-1">
                6 suggestions affichées. Utilisez la recherche pour en trouver
                d&apos;autres.
              </p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">
              Mot de passe
            </Label>
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
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-yessal-violet transition-colors"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {errorMsg ? (
            <p className="text-destructive text-xs font-bold text-center mt-2">
              {errorMsg}
            </p>
          ) : null}

          <Button
            type="submit"
            disabled={isPending || daaras.length === 0}
            className="w-full mt-4 bg-yessal-violet hover:bg-violet-700 text-white rounded-xl h-12 font-black uppercase tracking-widest text-xs shadow-xl shadow-yessal-violet/10 border-none transition-all hover:scale-[1.02] active:scale-95"
          >
            {isPending ? "Création..." : "S'inscrire au réseau"}
          </Button>
        </form>

        <p className="text-center text-xs text-muted-foreground mt-8 font-medium">
          Vous avez déjà un compte ?{" "}
          <Link href="/login" className="text-yessal-violet font-bold">
            Connectez-vous
          </Link>
        </p>
      </div>
    </div>
  );
}
