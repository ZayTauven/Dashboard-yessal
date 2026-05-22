import { getAllUsers } from "@/app/actions/users";
import { MembersValidationClient } from "./MembersValidationClient";
import { ErrorAlert } from "@/components/ui/error-alert";

export default async function AdminMembersPage() {
  const { data: users, error } = await getAllUsers();

  return (
    <div className="p-8 max-w-6xl mx-auto flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Validation des Comptes</h1>
        <p className="text-muted-foreground mt-1">Approuvez ou bloquez l'accès des nouveaux inscrits.</p>
      </div>

      {error ? (
        <ErrorAlert message={error} />
      ) : (
        <MembersValidationClient initialUsers={users || []} />
      )}
    </div>
  );
}
