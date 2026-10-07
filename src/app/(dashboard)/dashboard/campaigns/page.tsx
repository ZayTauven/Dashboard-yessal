import { getCampaigns } from "@/app/actions/campaigns";
import { getProfile } from "@/app/actions/users";
import { ErrorAlert } from "@/components/ui/error-alert";
import { PageHead } from "@/components/vireo/PageHead";
import type { Role } from "@/lib/nav";
import { CampaignsClient } from "./CampaignsClient";

export default async function CampaignsPage() {
  const [{ data: campaigns, error: campaignError }, { data: profile }] =
    await Promise.all([getCampaigns(), getProfile()]);

  const role = (profile?.role ?? "member") as Role;
  const isAdmin = role === "admin";
  const canUseDonationPage =
    role === "member" || role === "collector" || role === "chef_daara";
  /* Le talibé et la tutelle ne voient que les Ndiguels ouverts : le serveur
     ne leur envoie plus les Ndiguels terminés, l'onglet resterait vide. */
  const hideCompleted = role === "member" || role === "tutelle";

  return (
    <div className="flex flex-col gap-6">
      {/*
        Le titre disait « Ndiguels (Jëfs) », ce qui mettait un signe égal entre
        la campagne et le don. Ce sont deux objets distincts, et la confusion se
        propageait ensuite dans les étiquettes de formulaire.
      */}
      <PageHead
        role={role}
        title="Les Ndiguels"
        subtitle="Suivez les objectifs de collecte et participez aux actions de la confrérie."
      />

      {campaignError ? (
        <ErrorAlert message={campaignError} />
      ) : (
        <CampaignsClient
          initialCampaigns={campaigns || []}
          isAdmin={isAdmin}
          canUseDonationPage={canUseDonationPage}
          hideCompleted={hideCompleted}
        />
      )}
    </div>
  );
}
