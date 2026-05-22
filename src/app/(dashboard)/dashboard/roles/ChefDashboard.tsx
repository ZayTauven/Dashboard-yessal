"use client";

import AppBarChart from "@/components/AppBarChart";
import AppAreaChart from "@/components/AppAreaChart";
import AppPieChart from "@/components/AppPieChart";
import { Wallet, HandCoins, Landmark, Users, TrendingUp, Building2, UserPlus, FileEdit, Medal } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const ICON_MAP: Record<string, React.ElementType> = {
  Wallet,
  HandCoins,
  Landmark,
  Users,
};

export default function ChefDashboard({ stats }: { stats: any }) {
  const kpis = stats?.kpis || [];
  const daaraName = stats?.daara || "Mon Daara";
  const collectors = stats?.collectors || [];
  const barChartData = stats?.bar_chart || stats?.donations_by_month || undefined;
  const pieChartData = stats?.pie_chart || stats?.donations_by_method || undefined;

  return (
    <div className="space-y-8">
      {/* HEADER SECTION */}
      <div
        className="flex justify-between items-center bg-card p-8 rounded-3xl border shadow-sm"
        style={{ borderColor: "var(--border)" }}
      >
        <div>
          <div
            className="flex items-center gap-2 font-bold text-xs uppercase tracking-widest mb-2"
            style={{ color: "var(--primary)" }}
          >
            <Building2 size={16} /> District de {daaraName}
          </div>
          <h2 className="text-3xl font-bold tracking-tight">Gestion du Daara</h2>
          <p className="text-sm text-muted-foreground mt-2 max-w-md">
            Supervisez les collectes locales, gérez vos membres et coordonnez les actions sociales de votre communauté.
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            asChild
            variant="outline"
            className="h-12 px-6 gap-2 font-bold"
            style={{ borderColor: "var(--primary)", color: "var(--primary)" }}
          >
            <Link href="/dashboard/members">
              <UserPlus size={18} /> Gérer les Membres
            </Link>
          </Button>
          <Button
            asChild
            className="h-12 px-6 gap-2 font-bold text-white border-none"
            style={{ background: "var(--primary)" }}
          >
            <Link href="/dashboard/collect">
              <FileEdit size={18} /> Journal de Bord
            </Link>
          </Button>
        </div>
      </div>

      {/* KPI GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi: any, idx: number) => {
          const Icon = ICON_MAP[kpi.icon] || Users;
          return (
            <div
              key={idx}
              className="bg-card p-6 rounded-2xl border shadow-sm flex flex-col gap-2 hover:shadow-md transition-all"
              style={{ borderColor: "var(--border)" }}
            >
              <div className="flex justify-between items-start">
                <div className="p-2 rounded-lg" style={{ background: "rgba(145,110,231,0.1)", color: "var(--primary)" }}>
                  <Icon size={20} />
                </div>
                <div className="flex items-center gap-1 text-[10px] font-bold text-green-600 bg-green-50 dark:bg-green-900/30 px-2 py-0.5 rounded-full">
                  <TrendingUp size={10} /> {kpi.change || "+0%"}
                </div>
              </div>
              <div className="mt-2">
                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">{kpi.title}</p>
                <h3 className="text-2xl font-bold mt-1 tracking-tight">{kpi.value}</h3>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bar Chart */}
        <div
          className="bg-card p-6 rounded-2xl border shadow-sm lg:col-span-2"
          style={{ borderColor: "var(--border)" }}
        >
          <AppBarChart data={barChartData} title="Collectes du Daara par mois" />
        </div>

        {/* Pie Chart */}
        <div
          className="bg-card p-6 rounded-2xl border shadow-sm"
          style={{ borderColor: "var(--border)" }}
        >
          <AppPieChart data={pieChartData} title="Répartition des dons" />
        </div>

        {/* Collectors List — Real data */}
        <div
          className="bg-card p-6 rounded-2xl border shadow-sm lg:col-span-1"
          style={{ borderColor: "var(--border)" }}
        >
          <div className="mb-4 font-bold text-sm uppercase tracking-widest text-muted-foreground flex items-center gap-2">
            <Medal size={14} style={{ color: "var(--primary)" }} /> Performances Collecteurs
          </div>
          {collectors.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <Users size={28} className="text-muted-foreground/20" />
              <p className="text-xs text-muted-foreground italic">Aucun collecteur assigné.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {collectors.map((col: any, i: number) => {
                const pct = col.percentage ?? Math.round(((i + 1) / collectors.length) * 100);
                return (
                  <div
                    key={col.id || i}
                    className="flex items-center justify-between p-3 bg-muted/20 rounded-xl border border-dashed hover:border-yessal-violet/50 transition-colors cursor-pointer group"
                    style={{ borderColor: "var(--border)" }}
                  >
                    <div className="flex gap-3 items-center">
                      <div
                        className="h-2 w-2 rounded-full shadow-[0_0_8px_rgba(33,121,81,0.5)]"
                        style={{ background: "var(--primary)" }}
                      />
                      <span className="text-sm font-medium">
                        {col.first_name} {col.last_name}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-xs group-hover:text-yessal-violet transition-colors" style={{ color: "var(--foreground)" }}>
                        {col.donations_count ?? col.dons ?? 0} dons
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 7-day area chart */}
        <div
          className="bg-card p-6 rounded-2xl border shadow-sm lg:col-span-2"
          style={{ borderColor: "var(--border)" }}
        >
          <AppAreaChart
            data={stats?.area_chart || stats?.chartData || []}
            title="Dons du Daara — 7 derniers jours"
            subtitle="Montants journaliers en FCFA"
          />
        </div>
      </div>
    </div>
  );
}
