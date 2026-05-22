import type { Metadata } from "next";
import AppSidebar from "@/components/AppSidebar";
import Navbar from "@/components/Navbar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { cookies } from "next/headers";
import { jwtDecode } from "jwt-decode";
import { getProfile, getUserDocuments } from "@/app/actions/users";
import { getNotificationsPreview } from "@/app/actions/notifications";
import ProfileCompletionBanner from "@/components/ProfileCompletionBanner";
import { FCMProvider } from "@/components/FCMProvider";

export const dynamic = 'force-dynamic';

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

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const defaultOpenValue = (await cookieStore).get("sidebar_state")?.value === "true";
  
  let user: DashboardUser | null = null;
  const token = (await cookieStore).get("session-yessal")?.value;
  
  if (token) {
    try {
      user = jwtDecode(token);
    } catch (e) {
      console.error("JWT Decode Error:", e);
    }
  }

  const [{ data: profileData }, previewRes] = await Promise.all([
    getProfile(),
    getNotificationsPreview(3),
  ]);

  const profile = profileData;
  if (profile?.id) {
    const { data: documents } = await getUserDocuments(profile.id);
    profile.documents = documents || [];
  }

  const notificationPreview = previewRes.data ?? [];

  return (
    <SidebarProvider defaultOpen={defaultOpenValue}>
      <AppSidebar user={profile || user} />
      <main className="w-full min-h-screen flex flex-col">
        <Navbar
          user={profile || user}
          notificationPreview={notificationPreview}
        />
        <ProfileCompletionBanner profile={profile} />
        <div className="flex-1 p-4 lg:p-6">{children}</div>
      </main>
      <FCMProvider />
    </SidebarProvider>
  );
}
