import { getDaaras } from "@/app/actions/daara";
import { AdminDaaraClient } from "./AdminDaaraClient";

export default async function AdminDaaraPage() {
  const { data: daaras, error } = await getDaaras();

  return (
    <div className="p-8 max-w-6xl mx-auto flex flex-col gap-8">
      <div className="flex justify-between items-end">
        <div>
            <h1 className="text-3xl font-bold tracking-tight">Gestion des Daaras</h1>
            <p className="text-muted-foreground mt-1">Créez et administrez les structures communautaires.</p>
        </div>
      </div>

      {error ? (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100">{error}</div>
      ) : (
        <AdminDaaraClient initialDaaras={daaras || []} />
      )}
    </div>
  );
}
