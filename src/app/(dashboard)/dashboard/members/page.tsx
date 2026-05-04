import { redirect } from "next/navigation";
import { getDirectoryUsers } from "@/app/actions/directory";
import { getProfile } from "@/app/actions/users";
import { MembersClient } from "./MembersClient";

export default async function MembersPage() {
  const { data: profile } = await getProfile();
  const role = profile?.role;

  if (role === "member") {
    redirect("/dashboard");
  }

  const { data: members, error } = await getDirectoryUsers();

  return (
    <div className="p-8 max-w-6xl mx-auto flex flex-col gap-8">
      <div>
        <h1
          className="text-3xl font-semibold tracking-tight"
          style={{ color: "var(--foreground)" }}
        >
          {role === "admin" ? "Liste des membres" : "Membres du Daara"}
        </h1>
        <p
          className="text-sm mt-1"
          style={{ color: "var(--muted-foreground)" }}
        >
          {role === "admin"
            ? "Membres, chefs de Daara et collecteurs (hors comptes administrateurs)."
            : "Personnes rattachées à votre Daara : membres, chef et collecteurs."}
        </p>
      </div>

      {error ? (
        <div className="bg-red-50 text-red-600 p-6 rounded-2xl border border-red-100 font-medium">
          {error}
        </div>
      ) : (
        <MembersClient
          initialMembers={members || []}
          viewerRole={role as "admin" | "chef_daara" | "collector"}
        />
      )}
    </div>
  );
}
