import { redirect } from "next/navigation";
import { getProfile } from "@/app/actions/users";

/**
 * Layout de protection pour toutes les routes /dashboard/admin/*.
 * Vérifie côté serveur que l'utilisateur connecté est bien admin.
 * Si non, redirige vers /dashboard (403 soft).
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: profile, error } = await getProfile();

  if (error || !profile) {
    redirect("/login");
  }

  if (profile.role !== "admin") {
    // Redirige les non-admins vers le dashboard
    redirect("/dashboard");
  }

  return <>{children}</>;
}
