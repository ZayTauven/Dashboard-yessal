import Link from "next/link";
import { notFound } from "next/navigation";
import { getCampaignById, getCampaignEtat } from "@/app/actions/campaigns";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

type EtatContributor = {
  donor_name?: string | null;
  amount: number | string;
  payment_status: string;
  created_at: string;
};

export default async function CampaignEtatPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const campaignId = Number(id);

  const [{ data: campaign }, { data: etat, error }] = await Promise.all([
    getCampaignById(campaignId),
    getCampaignEtat(campaignId),
  ]);

  if (error) {
    notFound();
  }

  const contributors: EtatContributor[] = etat?.contributors || etat?.donations || [];
  const total = Number(etat?.total_amount || etat?.collected_amount || 0);

  return (
    <div className="p-8 max-w-6xl mx-auto flex flex-col gap-6">
      <Button variant="ghost" className="w-fit gap-2 -ml-2" asChild>
        <Link href="/dashboard/campaigns">
          <ArrowLeft size={16} />
          Retour aux Ndiguels
        </Link>
      </Button>

      <div>
        <h1 className="text-3xl font-semibold tracking-tight" style={{ color: "var(--foreground)" }}>
          Etat du Ndiguel
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--muted-foreground)" }}>
          {campaign?.name || `Ndiguel #${campaignId}`} - Total collecte: {total.toLocaleString()} FCFA
        </p>
      </div>

      <div className="border rounded-xl overflow-hidden" style={{ borderColor: "var(--border)" }}>
        {contributors.length === 0 ? (
          <div className="p-8 text-sm text-muted-foreground">Aucune contribution enregistree.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted/40">
              <tr>
                <th className="px-4 py-3 text-left">Contributeur</th>
                <th className="px-4 py-3 text-left">Montant</th>
                <th className="px-4 py-3 text-left">Statut</th>
                <th className="px-4 py-3 text-left">Date</th>
              </tr>
            </thead>
            <tbody>
              {contributors.map((row, idx) => (
                <tr key={`${row.created_at}-${idx}`} className="border-t" style={{ borderColor: "var(--border)" }}>
                  <td className="px-4 py-3">{row.donor_name || "Anonyme"}</td>
                  <td className="px-4 py-3 font-semibold">{Number(row.amount || 0).toLocaleString()} FCFA</td>
                  <td className="px-4 py-3">{row.payment_status}</td>
                  <td className="px-4 py-3">{new Date(row.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
