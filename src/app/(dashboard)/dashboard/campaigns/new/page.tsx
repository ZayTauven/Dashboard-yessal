import { redirect } from "next/navigation";
import { getProfile, getAllUsers } from "@/app/actions/users";
import { getEvents } from "@/app/actions/events";
import { NewCampaignClient } from "./NewCampaignClient";
import { ErrorAlert } from "@/components/ui/error-alert";

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
    <div className="p-8 max-w-6xl mx-auto flex flex-col gap-6">
      <div>
        <h1
          className="text-3xl font-semibold tracking-tight"
          style={{ color: "var(--foreground)" }}
        >
          Nouvelle campagne
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--muted-foreground)" }}>
          Réservé aux administrateurs. Les membres voient les Ndiguels sur la
          liste principale.
        </p>
      </div>

      {fetesError ? (
        <ErrorAlert message={fetesError} />
      ) : (
        <NewCampaignClient fetes={fetes || []} members={members || []} />
      )}
    </div>
  );
}
