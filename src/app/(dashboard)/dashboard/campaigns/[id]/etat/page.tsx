import Link from "next/link";
import { notFound } from "next/navigation";
import { getCampaignById, getCampaignEtat } from "@/app/actions/campaigns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ArrowLeft, Target, Users, TrendingUp, CalendarDays } from "lucide-react";

type Contribution = {
  member_name: string;
  member_id: number;
  daara_name: string | null;
  amount: number | string;
  date: string;
  payment_method: string;
  is_anonymous: boolean;
};

const METHOD_LABELS: Record<string, string> = {
  orange_money: "Orange Money",
  wave: "Wave",
  bictorys: "Bictorys",
  virement: "Virement",
  manual: "Manuel",
  paypal: "PayPal",
  collector: "Collecteur",
  visa: "Visa",
  mastercard: "Mastercard",
};

const METHOD_COLORS: Record<string, string> = {
  orange_money: "bg-orange-100 text-orange-700",
  wave: "bg-blue-100 text-blue-700",
  bictorys: "bg-purple-100 text-purple-700",
  virement: "bg-gray-100 text-gray-700",
  manual: "bg-yellow-100 text-yellow-700",
};

function getInitials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

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

  if (error || !etat) notFound();

  const contributions: Contribution[] = etat.contributions || [];
  const collectedAmount = Number(etat.collected_amount || 0);
  const goalAmount = Number(etat.goal_amount || 0);
  const progressPct = etat.progress_pct ?? (goalAmount > 0 ? Math.round((collectedAmount / goalAmount) * 100) : 0);
  const donationCount = etat.donation_count ?? contributions.length;
  const topDonors = [...contributions].sort((a, b) => Number(b.amount) - Number(a.amount)).slice(0, 3);

  return (
    <div className="p-6 max-w-6xl mx-auto flex flex-col gap-6">
      {/* Back */}
      <Button variant="ghost" className="w-fit gap-2 -ml-2" asChild>
        <Link href="/dashboard/campaigns">
          <ArrowLeft size={16} />
          Retour aux Ndiguels
        </Link>
      </Button>

      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-semibold tracking-tight" style={{ color: "var(--foreground)" }}>
          État du Ndiguel
        </h1>
        <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
          {campaign?.name || etat.ndiguel_name || `Ndiguel #${campaignId}`}
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-xl border p-4 flex flex-col gap-2" style={{ borderColor: "var(--border)" }}>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
            <TrendingUp size={14} className="text-yessal-green" />
            Collecté
          </div>
          <span className="text-2xl font-bold text-yessal-green">
            {collectedAmount.toLocaleString("fr-FR")} <span className="text-sm font-normal">FCFA</span>
          </span>
        </div>

        <div className="bg-card rounded-xl border p-4 flex flex-col gap-2" style={{ borderColor: "var(--border)" }}>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
            <Target size={14} />
            Objectif
          </div>
          <span className="text-2xl font-bold">
            {goalAmount > 0 ? goalAmount.toLocaleString("fr-FR") : "—"}{" "}
            {goalAmount > 0 && <span className="text-sm font-normal">FCFA</span>}
          </span>
        </div>

        <div className="bg-card rounded-xl border p-4 flex flex-col gap-2" style={{ borderColor: "var(--border)" }}>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
            <Users size={14} />
            Donateurs
          </div>
          <span className="text-2xl font-bold">{donationCount}</span>
        </div>

        <div className="bg-card rounded-xl border p-4 flex flex-col gap-2" style={{ borderColor: "var(--border)" }}>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
            <CalendarDays size={14} />
            Progression
          </div>
          <span className="text-2xl font-bold" style={{ color: progressPct >= 100 ? "var(--yessal-green)" : "var(--foreground)" }}>
            {progressPct}%
          </span>
        </div>
      </div>

      {/* Progress bar */}
      {goalAmount > 0 && (
        <div className="bg-card rounded-xl border p-5 flex flex-col gap-3" style={{ borderColor: "var(--border)" }}>
          <div className="flex justify-between text-sm font-medium">
            <span className="text-muted-foreground">Progression vers l&apos;objectif</span>
            <span className="text-yessal-green font-bold">{progressPct}%</span>
          </div>
          <div className="h-3 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-yessal-green rounded-full transition-all"
              style={{ width: `${Math.min(progressPct, 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{collectedAmount.toLocaleString("fr-FR")} FCFA collectés</span>
            <span>sur {goalAmount.toLocaleString("fr-FR")} FCFA</span>
          </div>
        </div>
      )}

      {/* Top donors */}
      {topDonors.length > 0 && (
        <div className="bg-card rounded-xl border p-5 flex flex-col gap-3" style={{ borderColor: "var(--border)" }}>
          <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Top contributeurs</h2>
          <div className="flex flex-wrap gap-3">
            {topDonors.map((d, i) => (
              <div key={i} className="flex items-center gap-2 bg-muted/30 rounded-lg px-3 py-2">
                <Avatar className="h-7 w-7">
                  <AvatarFallback className="text-[10px]" style={{ background: "var(--primary)", color: "white" }}>
                    {d.is_anonymous ? "?" : getInitials(d.member_name || "?")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="text-xs font-semibold">{d.is_anonymous ? "Anonyme" : d.member_name}</div>
                  <div className="text-[10px] text-yessal-green font-bold">{Number(d.amount).toLocaleString("fr-FR")} FCFA</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Full contributors table */}
      <div className="bg-card rounded-2xl border shadow-sm overflow-hidden" style={{ borderColor: "var(--border)" }}>
        <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: "var(--border)" }}>
          <h2 className="font-bold text-sm">Liste des contributeurs</h2>
          <Badge variant="outline" className="text-[10px]">{contributions.length} don{contributions.length > 1 ? "s" : ""}</Badge>
        </div>

        {contributions.length === 0 ? (
          <div className="p-12 text-center text-sm text-muted-foreground italic">
            Aucune contribution confirmée pour ce Ndiguel.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/30">
                <tr>
                  <th className="px-5 py-3 text-left font-bold uppercase text-[10px] tracking-widest">Contributeur</th>
                  <th className="px-5 py-3 text-left font-bold uppercase text-[10px] tracking-widest">Daara</th>
                  <th className="px-5 py-3 text-left font-bold uppercase text-[10px] tracking-widest">Méthode</th>
                  <th className="px-5 py-3 text-right font-bold uppercase text-[10px] tracking-widest">Montant</th>
                  <th className="px-5 py-3 text-right font-bold uppercase text-[10px] tracking-widest">Date</th>
                </tr>
              </thead>
              <tbody>
                {contributions.map((row, idx) => (
                  <tr
                    key={`${row.member_id}-${idx}`}
                    className="border-t hover:bg-muted/10"
                    style={{ borderColor: "var(--border)" }}
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-[10px]" style={{ background: "var(--primary)", color: "white" }}>
                            {row.is_anonymous ? "?" : getInitials(row.member_name || "?")}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{row.is_anonymous ? "Contributeur anonyme" : (row.member_name || "—")}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-muted-foreground text-xs">{row.daara_name || "—"}</td>
                    <td className="px-5 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          METHOD_COLORS[row.payment_method] || "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {METHOD_LABELS[row.payment_method] || row.payment_method}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right font-bold text-yessal-green">
                      {Number(row.amount).toLocaleString("fr-FR")} <span className="text-xs font-normal text-muted-foreground">FCFA</span>
                    </td>
                    <td className="px-5 py-3 text-right text-xs text-muted-foreground">
                      {new Date(row.date).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
