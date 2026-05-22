"use client";

import AppBarChart from "@/components/AppBarChart";
import AppPieChart from "@/components/AppPieChart";
import AppAreaChart from "@/components/AppAreaChart";
import CardList from "@/components/CardList";
import { Wallet, HandCoins, Landmark, Users, TrendingUp, Megaphone, Link as LinkIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const ICON_MAP: Record<string, React.ElementType> = {
  Wallet,
  HandCoins,
  Landmark,
  Users,
};

export default function AdminDashboard({ stats }: { stats: any }) {
  const kpis = stats?.kpis || [];
  const announcements = stats?.announcements || [];
  const barChartData = stats?.bar_chart || stats?.donations_by_month || undefined;
  const pieChartData = stats?.pie_chart || stats?.donations_by_method || undefined;
  const areaChartData = stats?.area_chart || stats?.members_evolution || undefined;
  const alerts = stats?.alerts || [];

  return (
    <div className="space-y-8">
      {/* INLINE ANNOUNCEMENTS */}
      {announcements.length > 0 && (
        <div className="flex flex-col gap-3">
          {announcements.slice(0, 2).map((ann: any) => (
            <div
              key={ann.id}
              className="flex items-center gap-3 p-3 px-4 rounded-xl border bg-card/50 backdrop-blur-sm text-sm font-medium relative overflow-hidden group shadow-sm transition-all hover:shadow-md"
            >
              <div
                className={`absolute left-0 top-0 w-1 h-full ${
                  ann.urgency === "critical"
                    ? "bg-red-500"
                    : ann.urgency === "warning"
                    ? "bg-orange-400"
                    : "bg-blue-400"
                }`}
              />
              <Megaphone size={16} style={{ color: "var(--primary)" }} />
              <span className="flex-1 truncate font-bold text-xs">{ann.title}</span>
              <div className="hidden md:flex items-center gap-2">
                <Badge
                  variant="outline"
                  className="text-[9px] uppercase font-black tracking-widest border-none px-2 h-5 bg-muted/20 opacity-70"
                >
                  {ann.urgency}
                </Badge>
                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                  className="h-7 text-[10px] font-black uppercase tracking-widest border-none hover:bg-yessal-violet/10"
                  style={{ color: "var(--primary)" }}
                >
                  <Link href="/dashboard/admin/announcements">Gérer</Link>
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* KPI GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi: any, idx: number) => {
          const Icon = ICON_MAP[kpi.icon] || Users;
          return (
            <Link
              key={idx}
              href={kpi.href || "/dashboard"}
              className="bg-card p-6 rounded-2xl border shadow-sm flex flex-col gap-2 group hover:shadow-md hover:border-yessal-violet/30 transition-all ease-out"
              style={{ borderColor: "var(--border)" }}
            >
              <div className="flex justify-between items-start">
                <div className="p-2 rounded-lg font-bold" style={{ background: "color-mix(in srgb, var(--primary) 12%, transparent)", color: "var(--primary)" }}>
                  <Icon size={20} />
                </div>
                {kpi.change && (
                  <div className="flex items-center gap-1 text-[10px] font-bold text-green-600 bg-green-50 dark:bg-green-900/30 px-2 py-0.5 rounded-full border border-green-100 dark:border-green-800">
                    <TrendingUp size={10} /> {kpi.change}
                  </div>
                )}
              </div>
              <div className="mt-2 text-left">
                <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest opacity-60">
                  {kpi.title}
                </p>
                <h3 className="text-2xl font-black mt-1 tracking-tight group-hover:text-yessal-violet transition-colors" style={{ color: "var(--foreground)" }}>
                  {kpi.value}
                </h3>
              </div>
            </Link>
          );
        })}
      </div>

      {/* CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div
          className="bg-card p-6 rounded-2xl border shadow-sm lg:col-span-2"
          style={{ borderColor: "var(--border)" }}
        >
          <AppBarChart data={barChartData} title="Jëfs collectés par mois" />
        </div>
        <div
          className="bg-card p-6 rounded-2xl border shadow-sm"
          style={{ borderColor: "var(--border)" }}
        >
          <AppPieChart
            data={pieChartData}
            trend={stats?.donations_trend}
            title="Répartition par méthode"
          />
        </div>
        <div
          className="bg-card p-6 rounded-2xl border shadow-sm lg:col-span-1"
          style={{ borderColor: "var(--border)" }}
        >
          <CardList title="Alertes Critiques" items={alerts} />
        </div>
        <div
          className="bg-card p-6 rounded-2xl border shadow-sm lg:col-span-2"
          style={{ borderColor: "var(--border)" }}
        >
          <AppAreaChart data={areaChartData} title="Évolution des membres" />
        </div>
      </div>
    </div>
  );
}
