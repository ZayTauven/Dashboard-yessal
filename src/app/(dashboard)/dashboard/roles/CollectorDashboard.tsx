"use client";

import AppBarChart from "@/components/AppBarChart";
import { Wallet, HandCoins, Landmark, TrendingUp, Plus, History, Clock, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function CollectorDashboard({ stats }: { stats: any }) {
  const kpis = stats?.kpis || [];

  return (
    <div className="space-y-8">
      {/* QUICK ACTIONS */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-card p-6 rounded-2xl border shadow-sm" style={{ borderColor: "var(--border)" }}>
             <div>
                <h3 className="text-xl font-bold">Collecteur en service</h3>
                <p className="text-sm text-muted-foreground mt-1">
                    Enregistrez les dons physiques et suivez votre performance journalière.
                </p>
             </div>
             <Button asChild className="h-12 px-8 gap-2 bg-yessal-green hover:bg-green-700 text-white font-bold rounded-xl transition-all shadow-lg active:scale-95 border-none">
                <Link href="/dashboard/collect"><Plus size={20} /> Nouvelle Collecte</Link>
             </Button>
      </div>

      {/* KPI GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi: any, idx: number) => {
          const Icon = kpi.icon === 'Wallet' ? Wallet : 
                       kpi.icon === 'HandCoins' ? HandCoins : 
                       kpi.icon === 'Landmark' ? Landmark : TrendingUp;
          return (
            <div key={idx} className="bg-card p-6 rounded-2xl border shadow-sm flex flex-col gap-2 group hover:shadow-md transition-all ease-out" style={{ borderColor: "var(--border)" }}>
              <div className="flex justify-between items-start">
                <div className="p-2 rounded-lg bg-yessal-green/10 text-yessal-green">
                    <Icon size={20} />
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card p-6 rounded-2xl border shadow-sm" style={{ borderColor: "var(--border)" }}>
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold">Mes collectes de la semaine</h3>
                <span className="text-xs text-muted-foreground">Volume hebdomadaire</span>
            </div>
            <AppBarChart />
        </div>
        
        <div className="bg-card p-6 rounded-2xl border shadow-sm" style={{ borderColor: "var(--border)" }}>
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold flex gap-2 items-center"><History size={18} /> Activité Récente</h3>
                <Link href="/dashboard/donations" className="text-xs text-yessal-green hover:underline font-medium">Tout voir</Link>
            </div>
            <div className="divide-y">
                {[1, 2, 3, 4].map((_, i) => (
                    <div key={i} className="py-4 flex justify-between items-center group">
                        <div className="flex gap-4 items-center">
                            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                                <HandCoins size={16} />
                            </div>
                            <div>
                                <p className="text-sm font-bold">Don Physique #{1024 - i}</p>
                                <p className="text-[10px] text-muted-foreground">Il y a {i+1}h • Member {i+1}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-sm font-bold">{(i+1)*5000} FCFA</p>
                             <Badge variant="outline" className="text-[10px] gap-1 border-none bg-orange-50 text-orange-600">
                                <Clock size={10} /> En attente
                             </Badge>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      </div>
    </div>
  );
}
