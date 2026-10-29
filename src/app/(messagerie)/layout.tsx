import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getProfile } from "@/app/actions/users";
import { FCMProvider } from "@/components/FCMProvider";

/*
 * ═══════════════════════════════════════════════════════════════════════════
 * La messagerie, en plein écran
 * ═══════════════════════════════════════════════════════════════════════════
 * Même parti que le Yessal Guide : un groupe de routes à part, sans la coque
 * du tableau de bord. Une messagerie se lit comme Discord — canaux à gauche,
 * fil au centre, membres à droite — et le rail de vingt entrées, l'en-tête et
 * le fil d'Ariane lui volaient le tiers de l'écran.
 *
 * L'adresse ne change pas (`/dashboard/chat`) : les liens des notifications
 * push, les « Écrire à… » des fiches et l'intergiciel qui protège
 * `/dashboard` continuent de s'appliquer. Le retour au tableau de bord est le
 * premier bouton de la colonne des canaux.
 *
 * Les deux gardes du layout du tableau de bord sont reprises : une session
 * fermée à distance, et un accueil de premier accès inachevé.
 */

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Messagerie",
};

export default async function MessagerieLayout({ children }: { children: React.ReactNode }) {
  const profileRes = await getProfile();
  if (profileRes.unauthorized) redirect("/logout?reason=revoked");
  if (profileRes.data?.onboarding?.length) redirect("/bienvenue");

  return (
    <>
      <div className="flex h-dvh min-h-[520px] w-full overflow-hidden bg-background">{children}</div>
      <FCMProvider />
    </>
  );
}
