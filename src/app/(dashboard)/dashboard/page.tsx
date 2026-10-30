import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { jwtDecode } from "jwt-decode";
import { getDashboardStats } from "@/app/actions/analytics";
import { DashboardClient } from "./DashboardClient";
import { ErrorAlert } from "@/components/ui/error-alert";

export default async function DashboardPage() {
  /* Sangue Bi, la guide du Kourel, n'a pas de tableau de bord de membre : son
     accueil est sa fenêtre de suivi. */
  const token = (await cookies()).get("session-yessal")?.value;
  if (token) {
    let role: string | undefined;
    try {
      role = jwtDecode<{ role?: string }>(token).role;
    } catch {
      role = undefined;
    }
    if (role === "guide") redirect("/dashboard/suivi");
  }

  const { data: stats, error } = await getDashboardStats();

  return (
    <>
      {error ? (
        <ErrorAlert message={`${error} — Veuillez rafraîchir la page.`} />
      ) : (
        <DashboardClient stats={stats} />
      )}
    </>
  );
}
