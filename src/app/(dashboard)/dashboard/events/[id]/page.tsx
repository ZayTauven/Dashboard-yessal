import Link from "next/link";
import { notFound } from "next/navigation";
import { getFeteEtat } from "@/app/actions/events";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  ArrowLeft,
  Calendar,
  TrendingUp,
  Users,
  BookOpen,
  CheckCircle2,
  Clock,
  XCircle,
} from "lucide-react";

type Contribution = {
  member_name: string;
  member_id: number;
  daara_name: string | null;
  campaign_name: string | null;
  amount: string;
  date: string;
  payment_method: string;
  is_anonymous: boolean;
};

type CampaignRow = {
  id: number;
  name: string;
  goal_amount: string | null;
  collected_amount: string;
  progress_pct: number;
  status: string;
  deadline: string;
  daara_name: string | null;
  organizer_name: string | null;
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

const STATUS_CONFIG: Record<string, { label: string; icon: React.ElementType; className: string }> = {
  active: { label: "Actif", icon: CheckCircle2, className: "bg-green-100 text-green-700" },
  pending: { label: "En attente", icon: Clock, className: "bg-yellow-100 text-yellow-700" },
  completed: { label: "Terminé", icon: CheckCircle2, className: "bg-gray-100 text-gray-600" },
  inactive: { label: "Inactif", icon: XCircle, className: "bg-red-100 text-red-600" },
};

function getInitials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

export default async function FeteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const feteId = Number(id);

  const { data: etat, error } = await getFeteEtat(feteId);
  if (error || !etat) notFound();

  const contributions: Contribution[] = etat.contributions || [];
  const campaigns: CampaignRow[] = etat.campaigns || [];
  const totalCollected = Number(etat.total_collected || 0);
  const topDonors = [...contributions]
    .sort((a, b) => Number(b.amount) - Number(a.amount))
    .slice(0, 3);

  return (
    <div className="p-6 max-w-6xl mx-auto flex flex-col gap-6">
      {/* Back */}
      <Button variant="ghost" className="w-fit gap-2 -ml-2" asChild>
        <Link href="/dashboard/events">
          <ArrowLeft size={16} />
          Retour aux fêtes
        </Link>
      </Button>

      {/* Header */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-semibold tracking-tight" style={{ color: "var(--foreground)" }}>
            {etat.name}
          </h1>
          <Badge
            className={`text-[10px] uppercase font-bold ${etat.is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}
          >
            {etat.is_active ? "Active" : "Inactive"}
          </Badge>
        </div>
        {etat.description && (
          <p className="text-sm max-w-2xl" style={{ color: "var(--muted-foreground)" }}>
            {etat.description}
          </p>
        )}
        <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
          {etat.date && (
            <span className="flex items-center gap-1">
              <Calendar size={12} />
              {new Date(etat.date).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
            </span>
          )}
          <span className="flex items-center gap-1">
            <BookOpen size={12} />
            {etat.recurrence}
          </span>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-xl border p-4 flex flex-col gap-2" style={{ borderColor: "var(--border)" }}>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
            <TrendingUp size={14} className="text-yessal-green" />
            Total collecté
          </div>
          <span className="text-2xl font-bold text-yessal-green">
            {totalCollected.toLocaleString("fr-FR")} <span className="text-sm font-normal">FCFA</span>
          </span>
        </div>

        <div className="bg-card rounded-xl border p-4 flex flex-col gap-2" style={{ borderColor: "var(--border)" }}>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
            <Users size={14} />
            Donateurs
          </div>
          <span className="text-2xl font-bold">{etat.donation_count}</span>
        </div>

        <div className="bg-card rounded-xl border p-4 flex flex-col gap-2" style={{ borderColor: "var(--border)" }}>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
            <BookOpen size={14} />
            Ndiguels
          </div>
          <span className="text-2xl font-bold">{etat.campaigns_count}</span>
        </div>

        <div className="bg-card rounded-xl border p-4 flex flex-col gap-2" style={{ borderColor: "var(--border)" }}>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
            <Calendar size={14} />
            Date
          </div>
          <span className="text-lg font-bold">
            {etat.date
              ? new Date(etat.date).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })
              : "—"}
          </span>
        </div>
      </div>

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
                  <div className="text-[10px] text-yessal-green font-bold">
                    {Number(d.amount).toLocaleString("fr-FR")} FCFA
                  </div>
                  {d.campaign_name && (
                    <div className="text-[10px] text-muted-foreground">{d.campaign_name}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Campaigns list */}
      {campaigns.length > 0 && (
        <div className="bg-card rounded-2xl border shadow-sm overflow-hidden" style={{ borderColor: "var(--border)" }}>
          <div className="px-5 py-4 border-b" style={{ borderColor: "var(--border)" }}>
            <h2 className="font-bold text-sm">Ndiguels associés</h2>
          </div>
          <div className="divide-y" style={{ borderColor: "var(--border)" }}>
            {campaigns.map((c) => {
              const statusCfg = STATUS_CONFIG[c.status] || STATUS_CONFIG.pending;
              const StatusIcon = statusCfg.icon;
              const goal = Number(c.goal_amount || 0);
              const collected = Number(c.collected_amount || 0);
              return (
                <div key={c.id} className="px-5 py-4 flex items-center gap-4 hover:bg-muted/10 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Link
                        href={`/dashboard/campaigns/${c.id}/etat`}
                        className="font-semibold text-sm hover:underline"
                        style={{ color: "var(--primary)" }}
                      >
                        {c.name}
                      </Link>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${statusCfg.className}`}>
                        <StatusIcon size={10} />
                        {statusCfg.label}
                      </span>
                    </div>
                    <div className="text-[10px] text-muted-foreground flex gap-3">
                      {c.daara_name && <span>{c.daara_name}</span>}
                      {c.organizer_name && <span>Organisateur : {c.organizer_name}</span>}
                      <span>Échéance : {new Date(c.deadline).toLocaleDateString("fr-FR")}</span>
                    </div>
                    {goal > 0 && (
                      <div className="mt-2 flex items-center gap-3">
                        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-yessal-green rounded-full"
                            style={{ width: `${Math.min(c.progress_pct, 100)}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-muted-foreground shrink-0">
                          {c.progress_pct}%
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-sm font-bold text-yessal-green">
                      {collected.toLocaleString("fr-FR")} <span className="text-xs font-normal text-muted-foreground">FCFA</span>
                    </div>
                    {goal > 0 && (
                      <div className="text-[10px] text-muted-foreground">
                        sur {goal.toLocaleString("fr-FR")} FCFA
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Full contributors table */}
      <div className="bg-card rounded-2xl border shadow-sm overflow-hidden" style={{ borderColor: "var(--border)" }}>
        <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: "var(--border)" }}>
          <h2 className="font-bold text-sm">Liste des contributeurs</h2>
          <Badge variant="outline" className="text-[10px]">
            {contributions.length} don{contributions.length > 1 ? "s" : ""}
          </Badge>
        </div>

        {contributions.length === 0 ? (
          <div className="p-12 text-center text-sm text-muted-foreground italic">
            Aucune contribution confirmée pour cette fête.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/30">
                <tr>
                  <th className="px-5 py-3 text-left font-bold uppercase text-[10px] tracking-widest">Contributeur</th>
                  <th className="px-5 py-3 text-left font-bold uppercase text-[10px] tracking-widest">Daara</th>
                  <th className="px-5 py-3 text-left font-bold uppercase text-[10px] tracking-widest">Ndiguel</th>
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
                        <span className="font-medium">
                          {row.is_anonymous ? "Contributeur anonyme" : (row.member_name || "—")}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-muted-foreground text-xs">{row.daara_name || "—"}</td>
                    <td className="px-5 py-3 text-xs text-muted-foreground">{row.campaign_name || "—"}</td>
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
                      {Number(row.amount).toLocaleString("fr-FR")}{" "}
                      <span className="text-xs font-normal text-muted-foreground">FCFA</span>
                    </td>
                    <td className="px-5 py-3 text-right text-xs text-muted-foreground">
                      {new Date(row.date).toLocaleDateString("fr-FR", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
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
