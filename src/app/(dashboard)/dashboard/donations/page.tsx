import Link from "next/link";
import { getDonations } from "@/app/actions/donations";
import { getProfile } from "@/app/actions/users";
import { DonationListClient } from "./DonationListClient";
import { Button } from "@/components/ui/button";
import { ErrorAlert } from "@/components/ui/error-alert";
import { Plus } from "lucide-react";

export default async function DonationsPage() {
  const { data: donations, error } = await getDonations();
  const { data: profile } = await getProfile();
  const role = profile?.role;

  const canNewDonation =
    role === "member" || role === "collector" || role === "chef_daara";

  const listVariant =
    role === "admin" || role === "chef_daara" ? "directory" : "personal";

  const title =
    role === "admin"
      ? "Les contributions"
      : role === "chef_daara"
        ? "Dons du Daara"
        : "Mes contributions";

  const subtitle =
    role === "admin"
      ? "Toutes les contributions enregistrées sur la plateforme, avec le contributeur et le Daara."
      : role === "chef_daara"
        ? "Contributions des membres rattachés à votre Daara."
        : "Historique de vos dons personnels et des dons effectués pour vos tutelles.";

  return (
    <div className="p-8 max-w-6xl mx-auto flex flex-col gap-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1
            className="text-3xl font-semibold tracking-tight"
            style={{ color: "var(--foreground)" }}
          >
            {title}
          </h1>
          <p
            className="text-sm mt-1"
            style={{ color: "var(--muted-foreground)" }}
          >
            {subtitle}
          </p>
        </div>
        {canNewDonation && (
          <Button
            className="gap-2 shrink-0"
            style={{ background: "var(--primary)", color: "#FAFAF8" }}
            asChild
          >
            <Link href="/dashboard/donations/new">
              <Plus size={16} />
              Faire un Jëfs
            </Link>
          </Button>
        )}
      </div>

      {error ? (
        <ErrorAlert message={error} />
      ) : (
        <DonationListClient
          initialDonations={donations || []}
          variant={listVariant}
        />
      )}
    </div>
  );
}
