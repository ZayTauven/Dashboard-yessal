import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { jwtDecode } from "jwt-decode";

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
  const cookieStore = await cookies();
  const token = cookieStore.get("session-yessal")?.value;

  if (!token) {
    redirect("/login");
  }

  let role: string | undefined;
  try {
    const decoded = jwtDecode<{ role?: string }>(token);
    role = decoded.role;
  } catch {
    redirect("/login");
  }

  if (role !== "admin") {
    // Redirige les non-admins vers le dashboard
    redirect("/dashboard");
  }

  return <>{children}</>;
}
