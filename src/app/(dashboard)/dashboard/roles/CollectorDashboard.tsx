"use client";

import AppBarChart from "@/components/AppBarChart";
import {
  Wallet,
  HandCoins,
  Landmark,
  TrendingUp,
  Plus,
  History,
  Clock,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

const ICON_MAP: Record<string, React.ElementType> = {
  Wallet,
  HandCoins,
  Landmark,
  TrendingUp,
};

const statusConfig: Record<string, { label: string; cls: string; icon: React.ElementType }> = {
  pending: { label: "En attente", cls: "bg-orange-50 text-orange-600 dark:bg-orange-900/30", icon: Clock },
  validated: { label: "Validé", cls: "bg-green-50 text-green-700 dark:bg-green-900/30", icon: CheckCircle2 },
  rejected: { label: "Rejeté", cls: "bg-red-50 text-red-600 dark:bg-red-900/30", icon: AlertCircle },
};

export default function CollectorDashboard({ stats }: { stats: any }) {
  const kpis = stats?.kpis || [];
  const recentCollects = stats?.recent_collects || stats?.recent_donations || [];
  const barChartData = stats?.bar_chart || stats?.weekly_chart || undefined;

  return (
    <div className="space-y-8">
      {/* QUICK ACTIONS */}
      <div
        className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-card p-6 rounded-2xl border shadow-sm"
        style={{ borderColor: "var(--border)" }}
      >
        <div>
          <h3 className="text-xl font-bold">Collecteur en service</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Enregistrez les dons physiques et suivez votre performance journalière.
          </p>
        </div>
        <Button
          asChild
          className="h-12 px-8 gap-2 font-bold rounded-xl transition-all shadow-lg active:scale-95 border-none text-white"
          style={{ background: "var(--yessal-green)" }}
        >
          <Link href="/dashboard/collect">
            <Plus size={20} /> Nouvelle Collecte
          </Link>
        </Button>
      </div>

      {/* KPI GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi: any, idx: number) => {
          const Icon = ICON_MAP[kpi.icon] || TrendingUp;
          return (
            <div
              key={idx}
              className="bg-card p-6 rounded-2xl border shadow-sm flex flex-col gap-2 group hover:shadow-md transition-all ease-out"
              style={{ borderColor: "var(--border)" }}
            >
              <div className="flex justify-between items-start">
                <div className="p-2 rounded-lg" style={{ background: "rgba(26,92,58,0.1)", color: "var(--yessal-green)" }}>
                  <Icon size={20} />
                </div>
                {kpi.change && (
                  <div className="flex items-center gap-1 text-[10px] font-bold text-green-600 bg-green-50 dark:bg-green-900/30 px-2 py-0.5 rounded-full">
                    <TrendingUp size={10} /> {kpi.change}
                  </div>
                )}
              </div>
              <div className="mt-2">
                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">{kpi.title}</p>
                <h3 className="text-2xl font-bold mt-1 tracking-tight">{kpi.value}</h3>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Chart */}
        <div
          className="bg-card p-6 rounded-2xl border shadow-sm"
          style={{ borderColor: "var(--border)" }}
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold">Mes collectes de la semaine</h3>
            <span className="text-xs text-muted-foreground">Volume hebdomadaire</span>
          </div>
          <AppBarChart data={barChartData} title="" />
        </div>

        {/* Activité Récente — vraies données */}
        <div
          className="bg-card p-6 rounded-2xl border shadow-sm"
          style={{ borderColor: "var(--border)" }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold flex gap-2 items-center">
              <History size={18} /> Activité Récente
            </h3>
            <Link
              href="/dashboard/donations"
              className="text-xs font-bold hover:underline"
              style={{ color: "var(--yessal-green)" }}
            >
              Tout voir
            </Link>
          </div>

          {recentCollects.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-10 text-center">
              <HandCoins size={32} className="text-muted-foreground/20" />
              <p className="text-xs text-muted-foreground italic">
                Aucune collecte enregistrée aujourd'hui.
              </p>
              <Button asChild size="sm" className="border-none text-white" style={{ background: "var(--yessal-green)" }}>
                <Link href="/dashboard/collect">
                  <Plus size={14} className="mr-1" /> Première collecte
                </Link>
              </Button>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: "var(--border)" }}>
              {recentCollects.slice(0, 5).map((collecte: any, i: number) => {
                const status = collecte.status || "pending";
                const cfg = statusConfig[status] || statusConfig.pending;
                const StatusIcon = cfg.icon;
                return (
                  <div key={collecte.id || i} className="py-4 flex justify-between items-center group">
                    <div className="flex gap-4 items-center">
                      <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                        <HandCoins size={16} className="text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-bold">
                          {collecte.donor_name || `Don #${collecte.id}`}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {collecte.created_at
                            ? new Date(collecte.created_at).toLocaleString("fr-FR", {
                                hour: "2-digit",
                                minute: "2-digit",
                                day: "numeric",
                                month: "short",
                              })
                            : "—"}
                          {collecte.campaign_name && ` · ${collecte.campaign_name}`}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold">
                        {collecte.amount?.toLocaleString("fr-FR") ?? "—"} FCFA
                      </p>
                      <Badge
                        variant="outline"
                        className={`text-[10px] gap-1 border-none mt-0.5 ${cfg.cls}`}
                      >
                        <StatusIcon size={10} /> {cfg.label}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
