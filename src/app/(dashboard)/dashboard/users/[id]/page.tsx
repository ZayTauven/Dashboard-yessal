import { getUserDashboardStats } from "@/app/actions/analytics";
import { getUser, getUserDocuments, getUserTutelle } from "@/app/actions/users";
import { getUserDonations } from "@/app/actions/donations";
import UserDetailClient from "./UserDetailClient";
import { ErrorAlert } from "@/components/ui/error-alert";

export default async function UserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Parallel fetching for all data
  const [userRes, statsRes, donationsRes, documentsRes, tutelleRes] =
    await Promise.all([
      getUser(id),
      getUserDashboardStats(id),
      getUserDonations(id),
      getUserDocuments(parseInt(id)),
      getUserTutelle(id),
    ]);

  const user = userRes.data;
  const stats = statsRes.data;
  const donations = donationsRes.data || [];
  const documents = documentsRes.data || [];
  const tutelle = tutelleRes.data || [];

  if (userRes.error && !user) {
    return (
      <div>
        <ErrorAlert title="Utilisateur introuvable" message={userRes.error} />
      </div>
    );
  }

  /* Le fond `bg-muted/10` qui enveloppait la fiche est retire : c'est la coque
     (`--ax-canvas`) qui peint le fond de page, et cette teinte de plus creait
     une bande legerement differente du reste du tableau de bord. */
  return (
    <>
      <UserDetailClient
        user={user}
        stats={stats}
        donations={donations}
        documents={documents}
        tutelle={tutelle}
      />
    </>
  );
}
