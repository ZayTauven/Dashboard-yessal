import { getCampaigns } from "@/app/actions/campaigns";
import { CampaignsClient } from "./CampaignsClient";
import { getProfile } from "@/app/actions/users";
import { ErrorAlert } from "@/components/ui/error-alert";

export default async function CampaignsPage() {
  const { data: campaigns, error: campaignError } = await getCampaigns();
  const { data: profile } = await getProfile();
  const isAdmin = profile?.role === "admin";
  const canUseDonationPage =
    profile?.role === "member" ||
    profile?.role === "collector" ||
    profile?.role === "chef_daara";

  return (
    <div className="p-8 max-w-6xl mx-auto flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight" style={{ color: "var(--foreground)" }}>
          Ndiguels (Jëfs)
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--muted-foreground)" }}>
          Suivez les objectifs de collecte et participez aux actions de la confrérie.
        </p>
      </div>

      {campaignError ? (
        <ErrorAlert message={campaignError} />
      ) : (
        <CampaignsClient
          initialCampaigns={campaigns || []}
          isAdmin={isAdmin}
          canUseDonationPage={canUseDonationPage}
        />
      )}
    </div>
  );
}
