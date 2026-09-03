import { getAllUsers } from "@/app/actions/users";
import { ErrorAlert } from "@/components/ui/error-alert";
import { PageHead } from "@/components/vireo/PageHead";
import {
  MembersValidationClient,
  type PendingUser,
} from "./MembersValidationClient";

export default async function AdminMembersPage() {
  const { data: users, error } = await getAllUsers();

  return (
    <div className="flex flex-col gap-6">
      <PageHead
        role="admin"
        title="Validation des comptes"
        subtitle="Approuvez ou bloquez l'accès des nouveaux inscrits."
      />

      {error ? (
        <ErrorAlert message={error} />
      ) : (
        <MembersValidationClient
          initialUsers={(users || []) as PendingUser[]}
        />
      )}
    </div>
  );
}
