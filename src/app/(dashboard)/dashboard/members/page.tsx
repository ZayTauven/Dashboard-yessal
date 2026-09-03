import { redirect } from "next/navigation";
import { getDirectoryUsers } from "@/app/actions/directory";
import { getProfile } from "@/app/actions/users";
import { ErrorAlert } from "@/components/ui/error-alert";
import { PageHead } from "@/components/vireo/PageHead";
import type { Role } from "@/lib/nav";
import { MembersClient } from "./MembersClient";

export default async function MembersPage() {
  const { data: profile } = await getProfile();
  const role = (profile?.role ?? "member") as Role;

  if (role === "member") {
    redirect("/dashboard");
  }

  const { data: members, error } = await getDirectoryUsers();

  return (
    <div className="flex flex-col gap-6">
      <PageHead
        role={role}
        title={role === "admin" ? "Liste des membres" : "Membres du Daara"}
        subtitle={
          role === "admin"
            ? "Membres, chefs de Daara et collecteurs (hors comptes administrateurs)."
            : "Personnes rattachées à votre Daara : membres, chef et collecteurs."
        }
      />

      {error ? (
        <ErrorAlert message={error} />
      ) : (
        <MembersClient
          initialMembers={members || []}
          viewerRole={role as "admin" | "chef_daara" | "collector"}
        />
      )}
    </div>
  );
}
