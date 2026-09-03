import { getDashboardStats } from "@/app/actions/analytics";
import { DashboardClient } from "./DashboardClient";
import { ErrorAlert } from "@/components/ui/error-alert";

export default async function DashboardPage() {
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
