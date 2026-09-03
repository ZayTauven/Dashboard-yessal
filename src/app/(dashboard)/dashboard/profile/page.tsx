import { getProfile, getTitles, getUserDocuments } from "@/app/actions/users";
import { ErrorAlert } from "@/components/ui/error-alert";
import { PageHead } from "@/components/vireo/PageHead";
import type { Role } from "@/lib/nav";
import { ProfileClient, type ProfilePayload } from "./ProfileClient";

export default async function ProfilePage() {
  const { data: profile, error } = await getProfile();
  const [{ data: titles }, { data: documents }] = await Promise.all([
    getTitles(),
    profile?.id ? getUserDocuments(profile.id) : Promise.resolve({ data: [] }),
  ]);

  const role = (profile?.role ?? "member") as Role;

  return (
    <div className="flex flex-col gap-6">
      {/*
        L'ancien sous-titre annonçait « et votre sécurité » : l'écran ne propose
        aucun réglage de sécurité — ni mot de passe, ni sessions, ni double
        authentification. Il promettait donc une section inexistante.
      */}
      <PageHead
        role={role}
        title="Mon profil"
        subtitle="Vos informations personnelles et vos pièces d'identité."
      />

      {error ? (
        <ErrorAlert message={error} />
      ) : (
        <ProfileClient
          profile={(profile ?? null) as ProfilePayload | null}
          titles={titles || []}
          initialDocuments={documents || []}
        />
      )}
    </div>
  );
}
