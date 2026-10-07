import { getUserDashboardStats } from "@/app/actions/analytics";
import {
  getDirectoryUser,
  getProfile,
  getUser,
  getUserDocuments,
  getUserTutelle,
} from "@/app/actions/users";
import { getUserDonations } from "@/app/actions/donations";
import UserDetailClient from "./UserDetailClient";
import { ErrorAlert } from "@/components/ui/error-alert";
import { PageHead } from "@/components/vireo/PageHead";
import { isMissing } from "@/lib/api-result";
import type { Role } from "@/lib/nav";
import { MemberReadOnlyCard } from "./MemberReadOnlyCard";

export default async function UserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  /*
   * Rôle lu comme dans `members/page.tsx`. Seul l'admin a droit à la fiche
   * complète : `/api/users/{id}/` lui est réservé, et tout autre rôle y
   * recevait un 403 affiché en « Utilisateur introuvable ». Les autres lisent
   * l'annuaire, borné à leur Daara, et voient une carte sans aucune action.
   */
  const { data: profile } = await getProfile();
  const role = (profile?.role ?? "member") as Role;

  if (role !== "admin") {
    const memberRes = await getDirectoryUser(id);
    return (
      <div className="flex flex-col gap-6">
        <PageHead role={role} title="Fiche du membre" />
        {memberRes.data ? (
          <MemberReadOnlyCard member={memberRes.data} />
        ) : (
          <ErrorAlert
            message={
              isMissing(memberRes)
                ? "Ce membre ne fait pas partie de votre Daara."
                : (memberRes.error ?? "Impossible de charger ce membre.")
            }
          />
        )}
      </div>
    );
  }

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
