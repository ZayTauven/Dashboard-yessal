"use client";

import AppBarChart from "@/components/AppBarChart";
import AppPieChart from "@/components/AppPieChart";
import { Wallet, HandCoins, Landmark, Users, TrendingUp, Building2, UserPlus, FileEdit } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function ChefDashboard({ stats }: { stats: any }) {
  const kpis = stats?.kpis || [];
  const daaraName = stats?.daara || "Mon Daara";

  return (
    <div className="space-y-8">
      {/* HEADER SECTION */}
      <div className="flex justify-between items-center bg-card p-8 rounded-3xl border shadow-sm border-yessal-green/20" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
             <div>
                <div className="flex items-center gap-2 text-yessal-green font-bold text-xs uppercase tracking-widest mb-2">
                    <Building2 size={16} /> District de {daaraName}
                </div>
                <h2 className="text-3xl font-bold tracking-tight">Gestion du Daara</h2>
                <p className="text-sm text-muted-foreground mt-2 max-w-md">
                    Supervisez les collectes locales, gérez vos membres et coordonnez les actions sociales de votre communauté.
                </p>
             </div>
             <div className="flex gap-3">
                <Button asChild variant="outline" className="h-12 px-6 gap-2 border-yessal-green text-yessal-green hover:bg-yessal-green/5 font-bold">
                    <Link href="/dashboard/members"><UserPlus size={18} /> Gérer les Membres</Link>
                </Button>
                <Button asChild className="h-12 px-6 gap-2 bg-yessal-green hover:bg-green-700 text-white font-bold border-none">
                    <Link href="/dashboard/collect"><FileEdit size={18} /> Journal de Bord</Link>
                </Button>
             </div>
      </div>

      {/* KPI GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi: any, idx: number) => {
          const Icon = kpi.icon === 'Wallet' ? Wallet : 
                       kpi.icon === 'HandCoins' ? HandCoins : 
                       kpi.icon === 'Landmark' ? Landmark : Users;
          return (
            <div key={idx} className="bg-card p-6 rounded-2xl border shadow-sm flex flex-col gap-2 hover:shadow-md transition-all" style={{ borderColor: "var(--border)" }}>
              <div className="flex justify-between items-start">
                <div className="p-2 rounded-lg bg-yessal-green/10 text-yessal-green">
                    <Icon size={20} />
                </div>
                <div className="flex items-center gap-1 text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                    <TrendingUp size={10} /> +5%
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
        <div className="bg-card p-6 rounded-2xl border shadow-sm lg:col-span-2" style={{ borderColor: "var(--border)" }}>
             <AppBarChart />
        </div>
        <div className="bg-card p-6 rounded-2xl border shadow-sm" style={{ borderColor: "var(--border)" }}>
             <AppPieChart />
        </div>
        <div className="bg-card p-6 rounded-2xl border shadow-sm lg:col-span-1" style={{ borderColor: "var(--border)" }}>
             <div className="mb-4 font-bold text-sm uppercase tracking-widest text-muted-foreground">Performances Collecteurs</div>
             <div className="space-y-4">
                {[1, 2, 3].map((_, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-muted/20 rounded-xl border border-dashed hover:border-yessal-green/50 transition-colors cursor-pointer group">
                        <div className="flex gap-3 items-center">
                            <div className="h-2 w-2 rounded-full bg-yessal-green shadow-[0_0_8px_rgba(33,121,81,0.5)]" />
                            <span className="text-sm font-medium">Collecteur #{i+1}</span>
                        </div>
                        <span className="font-bold text-xs group-hover:text-yessal-green transition-colors">{(i+1)*12} dons</span>
                    </div>
                ))}
             </div>
        </div>
        <div className="bg-card p-6 rounded-2xl border shadow-sm lg:col-span-2" style={{ borderColor: "var(--border)" }}>
             <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold">Répartition des revenus (Daara)</h3>
                <span className="text-xs text-muted-foreground">Vue hebdo</span>
             </div>
             <div className="h-[250px] w-full bg-muted/10 rounded-xl border border-dashed flex items-center justify-center text-muted-foreground text-xs italic">
                Aperçu analytique détaillé disponible prochainement
             </div>
        </div>
      </div>
    </div>
  );
}
