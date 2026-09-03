import { notFound, redirect } from "next/navigation";
import { getProfile, getAllUsers } from "@/app/actions/users";
import { getEvents } from "@/app/actions/events";
import { getCampaignById } from "@/app/actions/campaigns";
import { NewCampaignClient } from "../new/NewCampaignClient";
import { ErrorAlert } from "@/components/ui/error-alert";
import { PageHead } from "@/components/vireo/PageHead";

export default async function EditCampaignPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const campaignId = Number(id);

  const { data: profile, error: profileError } = await getProfile();
  if (profileError || !profile) {
    redirect("/login");
  }
  if (profile.role !== "admin") {
    redirect("/dashboard/campaigns");
  }

  const [
    { data: campaign, error: campaignError, status: campaignStatus },
    { data: fetes, error: fetesError },
    { data: members },
  ] = await Promise.all([
      getCampaignById(campaignId),
      getEvents(),
      getAllUsers(),
    ]);

  /*
   * `notFound()` est réservé au vrai 404. Une session expirée (401), un droit
   * manquant (403) ou un backend à terre (500 / 0) ne sont pas des absences :
   * les confondre affichait « cette page n'existe pas » sur des écrans
   * parfaitement existants. On relaie donc l'incident à la frontière
   * d'erreur du segment, qui propose de réessayer.
   */
  if (campaignStatus === 404) notFound();
  if (campaignError || !campaign) {
    throw new Error(campaignError ?? "Ndiguel indisponible.");
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHead
        role="admin"
        title={campaign.name}
        subtitle="Les modifications s'appliquent immédiatement."
        crumbs={[
          { label: "Gestion" },
          { label: "Les Ndiguels", href: "/dashboard/campaigns" },
        ]}
      />

      {fetesError ? (
        <ErrorAlert message={fetesError} />
      ) : (
        <NewCampaignClient
          fetes={fetes || []}
          members={members || []}
          initialCampaign={campaign}
        />
      )}
    </div>
  );
}
