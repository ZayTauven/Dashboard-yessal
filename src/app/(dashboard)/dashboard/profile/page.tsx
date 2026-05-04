import { getProfile } from "@/app/actions/users";
import { getTitles, getUserDocuments } from "@/app/actions/users";
import { ProfileClient } from "./ProfileClient";

export default async function ProfilePage() {
  const { data: profile, error } = await getProfile();
  const [{ data: titles }, { data: documents }] = await Promise.all([
    getTitles(),
    profile?.id ? getUserDocuments(profile.id) : Promise.resolve({ data: [] }),
  ]);

  return (
    <div className="p-8 max-w-4xl mx-auto flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight" style={{ color: "var(--foreground)" }}>
          Mon Profil
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--muted-foreground)" }}>
          Gérez vos informations personnelles et votre sécurité.
        </p>
      </div>

      {error ? (
        <div className="bg-red-50 text-red-600 p-4 rounded-md">{error}</div>
      ) : (
        <ProfileClient profile={profile} titles={titles || []} initialDocuments={documents || []} />
      )}
    </div>
  );
}
