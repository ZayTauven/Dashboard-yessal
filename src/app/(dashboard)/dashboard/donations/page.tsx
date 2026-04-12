import { getDonations } from "@/app/actions/donations";
import { DonationListClient } from "./DonationListClient";

export default async function DonationsPage() {
  const { data: donations, error } = await getDonations();

  return (
    <div className="p-8 max-w-6xl mx-auto flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight" style={{ color: "var(--foreground)" }}>
          Mes Contributions
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--muted-foreground)" }}>
          Historique de vos dons personnels et des dons effectués pour vos tutelles.
        </p>
      </div>

      {error ? (
        <div className="bg-red-50 text-red-600 p-4 rounded-md">{error}</div>
      ) : (
        <DonationListClient initialDonations={donations || []} />
      )}
    </div>
  );
}
