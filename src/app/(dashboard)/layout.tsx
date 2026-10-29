import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { jwtDecode } from "jwt-decode";
import { getProfile, getUserDocuments } from "@/app/actions/users";
import { getNotificationsPreview } from "@/app/actions/notifications";
import ProfileCompletionBanner from "@/components/ProfileCompletionBanner";
import { FCMProvider } from "@/components/FCMProvider";
import { AppShell } from "@/components/vireo/AppShell";

export const dynamic = "force-dynamic";

type DashboardUser = {
  user_id?: number;
  email?: string;
  first_name?: string;
  last_name?: string;
  role?: string;
  avatar?: string | null;
  avatar_url?: string | null;
};

export const metadata: Metadata = {
  title: "Tableau de bord",
};

/*
 * Le layout ne fait plus que charger les données et déléguer la mise en page à
 * <AppShell>, la coque Aurora. L'ancien assemblage (SidebarProvider +
 * AppSidebar + Navbar) est remplacé : c'est ce changement de squelette qui
 * débloque le rail repliable, le tiroir mobile et les réglages de coque du
 * panneau Apparence.
 *
 * Les appels serveur restent identiques, et toujours en parallèle : le profil
 * et l'aperçu des notifications n'ont aucune raison de s'attendre.
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();

  let user: DashboardUser | null = null;
  const token = cookieStore.get("session-yessal")?.value;

  if (token) {
    try {
      user = jwtDecode(token);
    } catch (e) {
      console.error("JWT Decode Error:", e);
    }
  }

  const [profileRes, previewRes] = await Promise.all([
    getProfile(),
    getNotificationsPreview(3),
  ]);

  /*
   * Session fermée à distance — mot de passe changé sur un autre appareil, ou
   * réinitialisé par un administrateur qui soupçonnait une intrusion. Le cookie
   * est encore là, et le middleware ne regarde que sa présence : sans cette
   * sortie, on afficherait un tableau de bord dont chaque appel répond 401.
   */
  if (profileRes.unauthorized) {
    redirect("/logout?reason=revoked");
  }

  const profile = profileRes.data;

  /*
   * Un compte créé par un tiers termine son accueil avant toute autre chose :
   * Daara si l'import ne l'a pas désigné, fiche, puis son propre mot de passe.
   * La règle est servie par Django (`onboarding`) ; ici, on ne fait que
   * l'appliquer — comme la garde de `yessal-mobile/app/(app)/_layout.tsx`.
   */
  if (profile?.onboarding?.length) {
    redirect("/bienvenue");
  }

  if (profile?.id) {
    const { data: documents } = await getUserDocuments(profile.id);
    profile.documents = documents || [];
  }

  const notificationPreview = previewRes.data ?? [];

  return (
    <>
      <AppShell
        user={profile || user}
        notificationPreview={notificationPreview}
        /*
          Le bandeau « changez votre mot de passe » n'a plus lieu d'être : un
          mot de passe attribué renvoie désormais à l'accueil (`/bienvenue`),
          qui le fait remplacer avant d'ouvrir le tableau de bord.
        */
        banner={<ProfileCompletionBanner profile={profile} />}
      >
        {children}
      </AppShell>
      <FCMProvider />
    </>
  );
}
