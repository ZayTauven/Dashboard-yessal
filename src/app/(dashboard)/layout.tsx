import type { Metadata } from "next";
import AppSidebar from "@/components/AppSidebar";
import Navbar from "@/components/Navbar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { cookies } from "next/headers";
import { jwtDecode } from "jwt-decode";
import { getProfile } from "@/app/actions/users";

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
  
  let user: any = null;
  const token = (await cookieStore).get("session-yessal")?.value;
  
  if (token) {
    try {
      user = jwtDecode(token);
    } catch (e) {
      console.error("JWT Decode Error:", e);
    }
  }

  const { data: profile } = await getProfile();

  return (
    <SidebarProvider defaultOpen={defaultOpenValue}>
      <AppSidebar user={profile || user} />
      <main className="w-full min-h-screen flex flex-col">
        <Navbar user={profile || user} />
        <div className="flex-1 p-4 lg:p-6">{children}</div>
      </main>
    </SidebarProvider>
  );
}
