"use client";

import AppBarChart from "@/components/AppBarChart";
import AppPieChart from "@/components/AppPieChart";
import AppAreaChart from "@/components/AppAreaChart";
import CardList from "@/components/CardList";
import { Wallet, HandCoins, Landmark, Users, TrendingUp, Megaphone, AlertCircle, AlertTriangle, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function AdminDashboard({ stats }: { stats: any }) {
  const kpis = stats?.kpis || [];
  const announcements = stats?.announcements || [];

  return (
    <div className="space-y-8">
      {/* INLINE ANNOUNCEMENTS */}
      {announcements.length > 0 && (
          <div className="flex flex-col gap-3">
              {announcements.slice(0, 2).map((ann: any) => (
                  <div key={ann.id} className="flex items-center gap-3 p-3 px-4 rounded-xl border bg-card/50 backdrop-blur-sm text-sm font-medium relative overflow-hidden group shadow-sm transition-all hover:shadow-md">
                      <div className={`absolute left-0 top-0 w-1 h-full ${
                          ann.urgency === 'critical' ? 'bg-red-500' : ann.urgency === 'warning' ? 'bg-orange-400' : 'bg-blue-400'
                      }`} />
                      <Megaphone size={16} className="text-yessal-green" />
                      <span className="flex-1 truncate font-bold text-xs">{ann.title}</span>
                      <div className="hidden md:flex items-center gap-2">
                        <Badge variant="outline" className="text-[9px] uppercase font-black tracking-widest border-none px-2 h-5 bg-muted/20 opacity-70">
                            {ann.urgency}
                        </Badge>
                        <Button variant="ghost" size="sm" className="h-7 text-[10px] font-black uppercase tracking-widest text-yessal-green border-none hover:bg-yessal-green/10">Actions</Button>
                      </div>
                  </div>
              ))}
          </div>
      )}

      {/* KPI GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi: any, idx: number) => {
          const Icon = kpi.icon === 'Wallet' ? Wallet : 
                       kpi.icon === 'HandCoins' ? HandCoins : 
                       kpi.icon === 'Landmark' ? Landmark : Users;
          return (
            <div key={idx} className="bg-card p-6 rounded-2xl border shadow-sm flex flex-col gap-2 group hover:shadow-md transition-all ease-out" style={{ borderColor: "var(--border)" }}>
              <div className="flex justify-between items-start">
                <div className="p-2 rounded-lg bg-yessal-green/10 text-yessal-green font-bold">
                    <Icon size={20} />
                </div>
                <div className="flex items-center gap-1 text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full border border-green-100">
                    <TrendingUp size={10} /> {kpi.change}
                </div>
              </div>
              <div className="mt-2 text-left">
                <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest opacity-60">{kpi.title}</p>
                <h3 className="text-2xl font-black mt-1 tracking-tight">{kpi.value}</h3>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-card p-6 rounded-2xl border shadow-sm lg:col-span-2" style={{ borderColor: "var(--border)" }}>
             <AppBarChart />
        </div>
        <div className="bg-card p-6 rounded-2xl border shadow-sm" style={{ borderColor: "var(--border)" }}>
             <AppPieChart />
        </div>
        <div className="bg-card p-6 rounded-2xl border shadow-sm lg:col-span-1" style={{ borderColor: "var(--border)" }}>
             <CardList title="Alertes Critiques" />
        </div>
        <div className="bg-card p-6 rounded-2xl border shadow-sm lg:col-span-2" style={{ borderColor: "var(--border)" }}>
             <AppAreaChart />
        </div>
      </div>
    </div>
  );
}
