"use client";

import AppAreaChart from "@/components/AppAreaChart";
import { Wallet, HandCoins, Landmark, Users, Heart, ArrowUpRight, Calendar, Bell, AlertCircle, AlertTriangle, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function MemberDashboard({ stats }: { stats: any }) {
  const kpis = stats?.kpis || [];
  const announcements = stats?.announcements || [];
  const campaignDonations = stats?.campaign_donations || [];
  const chartData = stats?.chartData || [];

  const topAnnouncements = announcements.slice(0, 3); // Show top 3 as alerts

  return (
    <div className="space-y-6">
      {/* INLINE ANNOUNCEMENTS / ALERTS */}
      {topAnnouncements.length > 0 && (
          <div className="flex flex-col gap-3">
              {topAnnouncements.map((ann: any) => (
                  <div key={ann.id} className={`flex items-center gap-4 p-4 rounded-2xl border bg-white shadow-sm overflow-hidden relative group transition-all hover:shadow-md animate-in slide-in-from-top duration-500`} 
                       style={{ borderColor: ann.urgency === 'critical' ? 'var(--red-500)' : ann.urgency === 'warning' ? 'var(--orange-400)' : 'var(--border)' }}>
                      <div className={`absolute left-0 top-0 w-1 h-full ${
                          ann.urgency === 'critical' ? 'bg-red-500' : ann.urgency === 'warning' ? 'bg-orange-400' : 'bg-blue-400'
                      }`} />
                      
                      <div className={`p-2 rounded-xl hidden sm:flex ${
                          ann.urgency === 'critical' ? 'bg-red-50 text-red-500' : ann.urgency === 'warning' ? 'bg-orange-50 text-orange-500' : 'bg-blue-50 text-blue-500'
                      }`}>
                          {ann.urgency === 'critical' ? <AlertCircle size={20} /> : ann.urgency === 'warning' ? <AlertTriangle size={20} /> : <Info size={20} />}
                      </div>

                      <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                              <h4 className="font-bold text-sm truncate">{ann.title}</h4>
                              <span className="text-[10px] font-black uppercase text-muted-foreground opacity-60">
                                  {new Date(ann.created_at).toLocaleDateString('fr-FR')}
                              </span>
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-1">{ann.content}</p>
                      </div>

                      <Button variant="ghost" size="sm" className="h-8 px-3 text-[10px] uppercase font-black tracking-widest text-yessal-green hover:bg-yessal-green/10 border-none transition-all">
                          Lire la suite
                      </Button>
                  </div>
              ))}
          </div>
      )}

      {/* WELCOME SECTION */}
      <div className="bg-gradient-to-r from-yessal-green to-green-600 p-8 rounded-3xl text-white shadow-lg relative overflow-hidden">
             <div className="relative z-10">
                <h2 className="text-3xl font-bold">Heureux de vous revoir !</h2>
                <p className="mt-2 opacity-90 max-w-md text-sm leading-relaxed">
                    Votre engagement fait revivre nos Daaras. Voici l'état de vos contributions et de vos membres sous tutelle.
                </p>
                <div className="flex gap-3 mt-6">
                    <Button asChild variant="secondary" className="bg-white text-yessal-green hover:bg-gray-100 border-none shadow-sm font-bold">
                        <Link href="/dashboard/donations">Mes contributions</Link>
                    </Button>
                    <Button variant="ghost" className="text-white border border-white/20 hover:bg-white/10 font-bold">
                        <Link href="/dashboard/campaigns">Voir les Jëfs</Link>
                    </Button>
                </div>
             </div>
             <Heart className="absolute -right-8 -bottom-8 w-64 h-64 text-white/10 rotate-12" />
      </div>

      {/* KPI GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Campaign List as a special card if Member */}
        {campaignDonations.length > 0 && (
           <div className="bg-card p-6 rounded-2xl border shadow-sm flex flex-col gap-3 hover:border-yessal-green/30 transition-all col-span-1 md:col-span-2 lg:col-span-1" style={{ borderColor: "var(--border)" }}>
              <div className="flex justify-between items-center mb-1">
                 <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Dons par Campagne</p>
                 <Wallet size={16} className="text-yessal-green" />
              </div>
              <div className="space-y-2 max-h-[100px] overflow-y-auto pr-2">
                 {campaignDonations.map((cd: any) => (
                    <div key={cd.id} className="flex justify-between items-center text-xs border-b border-dashed pb-1 last:border-0" style={{ borderColor: 'var(--border)' }}>
                       <span className="truncate max-w-[120px] font-medium" title={cd.name}>{cd.name}</span>
                       <span className="font-bold text-yessal-green">{cd.total.toLocaleString()} <span className="text-[9px]">F</span></span>
                    </div>
                 ))}
              </div>
           </div>
        )}

        {kpis.map((kpi: any, idx: number) => {
          const Icon = kpi.icon === 'Wallet' ? Wallet : 
                       kpi.icon === 'HandCoins' ? HandCoins : 
                       kpi.icon === 'Landmark' ? Landmark : Users;
          return (
            <div key={idx} className="bg-card p-6 rounded-2xl border shadow-sm flex flex-col gap-2 hover:border-yessal-green/30 transition-all" style={{ borderColor: "var(--border)" }}>
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
                <h3 className="text-lg font-bold">Évolution de mes dons</h3>
                <span className="text-xs text-muted-foreground">7 derniers jours</span>
             </div>
              <AppAreaChart 
                data={chartData} 
                title="" 
                subtitle="Dons cumulés par jour"
              />
        </div>
        <div className="bg-card p-6 rounded-2xl border shadow-sm divide-y" style={{ borderColor: "var(--border)" }}>
             <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Bell size={18} className="text-yessal-green" /> Annonces de la Direction
             </h3>
             {announcements.length === 0 ? (
                <p className="text-xs text-muted-foreground py-4 italic">Aucune annonce récente.</p>
             ) : (
                announcements.map((ann: any) => (
                    <div key={ann.id} className="py-4 flex flex-col gap-1 group cursor-pointer">
                       <div className="flex justify-between items-start">
                           <p className="text-sm font-bold group-hover:text-yessal-green transition-colors">{ann.title}</p>
                           <span className="text-[9px] uppercase font-bold bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
                               {ann.target === 'global' ? 'National' : 'Daara'}
                           </span>
                       </div>
                       <p className="text-xs text-muted-foreground line-clamp-2">{ann.content}</p>
                       <span className="text-[10px] text-muted-foreground/60 mt-1">Publié le {new Date(ann.created_at).toLocaleDateString('fr-FR')}</span>
                    </div>
                ))
             )}
             <Button variant="link" className="w-full text-xs text-yessal-green h-auto pt-4 font-bold">Voir toutes les annonces</Button>
        </div>
      </div>
    </div>
  );
}
