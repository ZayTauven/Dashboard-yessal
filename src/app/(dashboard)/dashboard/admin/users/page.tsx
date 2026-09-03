import { getAllUsers, getPendingDocuments, getTitles, getTitleRequests } from "@/app/actions/users";
import { getDaaras } from "@/app/actions/daara";
import { PageHead } from "@/components/vireo/PageHead";
import type { DaaraOption } from "@/components/vireo/DaaraCombobox";
import {
  UserManagementClient,
  type PendingDoc,
  type TitleRequest,
  type User,
} from "./UserManagementClient";
import { ErrorAlert } from "@/components/ui/error-alert";

export default async function AdminUsersPage() {
  const [
    { data: users, error: userError }, 
    { data: daaras, error: daaraError },
    { data: pendingDocs },
    { data: titles },
    { data: titleRequests }
  ] = await Promise.all([
    getAllUsers(),
    getDaaras(),
    getPendingDocuments(),
    getTitles(),
    getTitleRequests()
  ]);

  const error = userError || daaraError;

  return (
    <div className="flex flex-col gap-6">
      <PageHead
        role="admin"
        title="Utilisateurs et rôles"
        subtitle="Créez des comptes, attribuez les rôles et validez les inscriptions."
      />

      {error ? (
        <ErrorAlert message={`${error} — Veuillez rafraîchir la page ou vérifier votre connexion.`} />
      ) : (
        <UserManagementClient
          initialUsers={(users || []) as User[]}
          daaras={(daaras || []) as DaaraOption[]}
          initialPendingDocs={(pendingDocs || []) as PendingDoc[]}
          initialTitles={titles || []}
          initialTitleRequests={
            ((titleRequests || []) as TitleRequest[]).filter(
              (r) => r.status === "pending",
            )
          }
        />
      )}
    </div>
  );
}
