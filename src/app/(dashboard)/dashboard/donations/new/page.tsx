import { redirect } from "next/navigation";
import { getProfile } from "@/app/actions/users";
import { getCampaigns } from "@/app/actions/campaigns";
import { getTutelles } from "@/app/actions/tutelles";
import { getBankAccountConfig } from "@/app/actions/donations";
import { NewDonationClient } from "./NewDonationClient";

const DONATE_ROLES = new Set(["member", "collector", "chef_daara"]);

export default async function NewDonationPage({
  searchParams,
}: {
  searchParams?: Promise<{ campaign?: string }>;
}) {
  const { data: profile, error: profileError } = await getProfile();
  if (profileError || !profile) {
    redirect("/login");
  }
  if (!DONATE_ROLES.has(profile.role)) {
    redirect("/dashboard/donations");
  }

  const params = (await searchParams) ?? {};
  const requestedCampaign = params.campaign?.trim();

  const [{ data: campaigns, error: campError }, { data: tutelles, error: tutError }, bankConfig] =
    await Promise.all([getCampaigns(), getTutelles(), getBankAccountConfig()]);

  const list = campaigns || [];
  const defaultCampaignId =
    requestedCampaign &&
    list.some((c: { id: string | number }) => String(c.id) === requestedCampaign)
      ? requestedCampaign
      : undefined;

  return (
    <div className="p-8 max-w-6xl mx-auto flex flex-col gap-6">
      <div>
        <h1
          className="text-3xl font-semibold tracking-tight"
          style={{ color: "var(--foreground)" }}
        >
          Nouveau don
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--muted-foreground)" }}>
          Enregistrez un don en ligne pour une campagne active.
        </p>
      </div>

      {campError ? (
        <div className="bg-red-50 text-red-600 p-4 rounded-md">{campError}</div>
      ) : (
        <NewDonationClient
          campaigns={list}
          tutelles={tutError ? [] : tutelles || []}
          defaultCampaignId={defaultCampaignId}
          bankConfig={bankConfig}
        />
      )}
    </div>
  );
}
