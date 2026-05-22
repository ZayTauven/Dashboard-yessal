import { notFound, redirect } from "next/navigation";
import { getProfile, getAllUsers } from "@/app/actions/users";
import { getEvents } from "@/app/actions/events";
import { getCampaignById } from "@/app/actions/campaigns";
import { NewCampaignClient } from "../new/NewCampaignClient";
import { ErrorAlert } from "@/components/ui/error-alert";

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

  const [{ data: campaign, error: campaignError }, { data: fetes, error: fetesError }, { data: members }] =
    await Promise.all([
      getCampaignById(campaignId),
      getEvents(),
      getAllUsers(),
    ]);

  if (campaignError || !campaign) {
    notFound();
  }

  return (
    <div className="p-8 max-w-6xl mx-auto flex flex-col gap-6">
      <div>
        <h1
          className="text-3xl font-semibold tracking-tight"
          style={{ color: "var(--foreground)" }}
        >
          Modifier la campagne
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--muted-foreground)" }}>
          Réservé aux administrateurs. Les modifications s&apos;appliquent immédiatement.
        </p>
      </div>

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
