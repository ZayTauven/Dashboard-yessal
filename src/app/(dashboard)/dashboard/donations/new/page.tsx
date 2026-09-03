import { redirect } from "next/navigation";
import { getProfile } from "@/app/actions/users";
import { getCampaigns } from "@/app/actions/campaigns";
import { getTutelles } from "@/app/actions/tutelles";
import { getBankAccountConfig } from "@/app/actions/donations";
import { NewDonationClient } from "./NewDonationClient";
import { ErrorAlert } from "@/components/ui/error-alert";
import { PageHead } from "@/components/vireo/PageHead";
import type { Role } from "@/lib/nav";

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
    <div className="flex flex-col gap-6">
      {/* « campagne » -> « Ndiguel » : c'est le nom du produit. */}
      <PageHead
        role={(profile.role ?? "member") as Role}
        title="Nouveau Jëf"
        subtitle="Enregistrez une contribution en ligne pour un Ndiguel en cours."
        crumbs={[
          { label: "Gestion" },
          { label: "Mes contributions", href: "/dashboard/donations" },
        ]}
      />

      {campError ? (
        <ErrorAlert message={campError} />
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
