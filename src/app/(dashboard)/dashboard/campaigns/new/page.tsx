import { redirect } from "next/navigation";
import { getProfile, getAllUsers } from "@/app/actions/users";
import { getEvents } from "@/app/actions/events";
import { NewCampaignClient } from "./NewCampaignClient";
import { ErrorAlert } from "@/components/ui/error-alert";
import { PageHead } from "@/components/vireo/PageHead";

export default async function NewCampaignPage() {
  const { data: profile, error: profileError } = await getProfile();
  if (profileError || !profile) {
    redirect("/login");
  }
  if (profile.role !== "admin") {
    redirect("/dashboard/campaigns");
  }

  const { data: fetes, error: fetesError } = await getEvents();
  const { data: members } = await getAllUsers();

  return (
    <div className="flex flex-col gap-6">
      {/* Le titre disait « Nouvelle campagne » sur un ecran qui parle de
          Ndiguels partout ailleurs. */}
      <PageHead
        role="admin"
        title="Nouveau Ndiguel"
        subtitle="Réservé aux administrateurs."
        crumbs={[
          { label: "Gestion" },
          { label: "Les Ndiguels", href: "/dashboard/campaigns" },
        ]}
      />

      {fetesError ? (
        <ErrorAlert message={fetesError} />
      ) : (
        <NewCampaignClient fetes={fetes || []} members={members || []} />
      )}
    </div>
  );
}
