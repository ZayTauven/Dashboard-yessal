import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getProfile } from "@/app/actions/users";
import { getDaaras } from "@/app/actions/daara";
import type { DaaraOption } from "@/components/vireo/DaaraCombobox";
import BienvenueClient, { type EtapeAccueil } from "./BienvenueClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Bienvenue",
};

/*
 * L'accueil d'un compte créé par un tiers — pendant web de
 * `yessal-mobile/app/(app)/bienvenue.tsx`.
 *
 * Les étapes viennent de Django (`profile.onboarding`, voir
 * `accounts/services/accueil.py`) : Daara, fiche, puis mot de passe. Le layout
 * du tableau de bord renvoie ici tant qu'il en reste une ; cette page renvoie
 * au tableau de bord dès qu'il n'en reste plus. Elle vit HORS du groupe
 * `(dashboard)`, sans quoi la garde de ce layout la renverrait sur elle-même.
 */
export default async function BienvenuePage() {
  const { data: profile, unauthorized } = await getProfile();
  if (unauthorized) redirect("/logout?reason=revoked");
  if (!profile) redirect("/login");

  const etapes: EtapeAccueil[] = profile.onboarding ?? [];
  if (etapes.length === 0) redirect("/dashboard");

  let daaras: DaaraOption[] = [];
  if (etapes[0] === "daara") {
    const { data } = await getDaaras();
    const liste = Array.isArray(data) ? data : (data?.results ?? []);
    daaras = liste.filter((d: DaaraOption) => typeof d?.id === "number");
  }

  return <BienvenueClient profile={profile} etapes={etapes} daaras={daaras} />;
}
