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
      <div className="p-8">
        <ErrorAlert title="Utilisateur introuvable" message={userRes.error} />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 bg-muted/10 min-h-screen">
      <UserDetailClient
        user={user}
        stats={stats}
        donations={donations}
        documents={documents}
        tutelle={tutelle}
      />
    </div>
  );
}
