import { getDashboardStats } from "@/app/actions/analytics";
import { DashboardClient } from "./DashboardClient";

export default async function DashboardPage() {
  const { data: stats, error } = await getDashboardStats();

  return (
    <div className="p-4 flex flex-col gap-8">
      {error ? (
        <div className="p-8 text-center bg-red-50 text-red-600 rounded-2xl border border-red-100 font-medium">
          {error} - Veuillez rafraîchir la page.
        </div>
      ) : (
        <DashboardClient stats={stats} />
      )}
    </div>
  );
}
