import { getDaaras } from "@/app/actions/daara";
import { AdminDaaraClient, type Daara } from "./AdminDaaraClient";
import { ErrorAlert } from "@/components/ui/error-alert";
import { PageHead } from "@/components/vireo/PageHead";

export default async function AdminDaaraPage() {
  const { data: daaras, error } = await getDaaras();

  return (
    <div className="flex flex-col gap-6">
      <PageHead
        role="admin"
        title="Gestion des Daaras"
        subtitle="Créez et administrez les structures communautaires et leurs zones LDD."
      />

      {error ? (
        <ErrorAlert message={error} />
      ) : (
        <AdminDaaraClient initialDaaras={(daaras || []) as Daara[]} />
      )}
    </div>
  );
}
