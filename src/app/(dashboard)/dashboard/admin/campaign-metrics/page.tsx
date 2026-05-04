import { getCampaignMetrics } from "@/app/actions/analytics";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Briefcase, CheckCircle2, TrendingUp, Presentation } from "lucide-react";

type CampaignMetric = {
  id: number;
  campaign_name: string;
  objective?: string;
  status: string;
  goal_amount: string | number;
  collected_amount: string | number;
  organizer_name: string;
  organizer_role: string;
  tasks_total: number;
  tasks_completed: number;
  days_active: number;
  days_total: number;
  days_remaining: number;
  chat_count: number;
};

export default async function CampaignMetricsPage() {
  const { data: metrics, error } = await getCampaignMetrics();

  if (error) {
    return (
      <div className="p-8 max-w-6xl mx-auto flex flex-col gap-8">
        <div className="bg-red-50 text-red-600 p-6 rounded-2xl border border-red-100 font-medium">
          {error} — Impossible de charger les métriques.
        </div>
      </div>
    );
  }

  // Aggregate stats
  const totalCollected = metrics?.reduce((acc: number, m: CampaignMetric) => acc + (parseFloat(m.collected_amount as string) || 0), 0) || 0;
  const totalTasks = metrics?.reduce((acc: number, m: CampaignMetric) => acc + m.tasks_total, 0) || 0;
  const completedTasks = metrics?.reduce((acc: number, m: CampaignMetric) => acc + m.tasks_completed, 0) || 0;
  const ActiveCampaignsCount = metrics?.filter((m: CampaignMetric) => m.status === 'active').length || 0;
  const uniqueOrganizers = new Set((metrics || []).map((m: CampaignMetric) => `${m.organizer_name}-${m.organizer_role}`)).size;
  const totalChats = metrics?.reduce((acc: number, m: CampaignMetric) => acc + m.chat_count, 0) || 0;

  return (
    <div className="p-8 max-w-6xl mx-auto flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Métriques Organisateurs</h1>
          <p className="text-muted-foreground mt-1">
            Suivi des performances et de l&apos;implication des responsables de Ndiguel.
          </p>
        </div>
        <div className="flex gap-3">
          <div className="bg-card border rounded-2xl px-5 py-3 shadow-sm flex flex-col text-right">
            <span className="text-xs text-muted-foreground font-bold tracking-wider uppercase mb-1">Total Récolté</span>
            <span className="text-xl font-black text-primary">{totalCollected.toLocaleString("fr-FR")} FCFA</span>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card rounded-3xl border p-6 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/30 text-blue-600 rounded-2xl">
              <Presentation size={24} />
            </div>
          </div>
          <div>
            <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-1">Ndiguel Assignées</p>
            <p className="text-4xl font-black">{ActiveCampaignsCount}</p>
          </div>
        </div>
        
        <div className="bg-card rounded-3xl border p-6 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 rounded-2xl">
              <CheckCircle2 size={24} />
            </div>
          </div>
          <div>
            <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-1">Tâches Complétées</p>
            <p className="text-4xl font-black flex items-baseline gap-2">
              {completedTasks} <span className="text-xl text-muted-foreground font-semibold">/ {totalTasks}</span>
            </p>
          </div>
        </div>
        
        <div className="bg-card rounded-3xl border p-6 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-50 dark:bg-purple-900/30 text-purple-600 rounded-2xl">
              <TrendingUp size={24} />
            </div>
          </div>
          <div>
            <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-1">Responsables</p>
            <p className="text-4xl font-black">{uniqueOrganizers}</p>
            <p className="text-xs text-muted-foreground mt-2">{totalChats} salon(s) d&apos;organisation</p>
          </div>
        </div>
      </div>

      {/* Organizers Table */}
      {!metrics || metrics.length === 0 ? (
        <div className="flex flex-col items-center gap-5 py-24 text-center bg-card rounded-2xl border shadow-sm">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-muted">
            <Briefcase size={28} className="text-muted-foreground" />
          </div>
          <div>
            <p className="font-bold text-foreground">Aucun organisateur assigné</p>
            <p className="text-sm text-muted-foreground mt-1 max-w-xs">
              Les statistiques apparaîtront ici dès qu&apos;une campagne sera confiée à un membre.
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-card rounded-2xl border shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b bg-muted/10">
            <h2 className="font-bold">Détails des performances</h2>
          </div>
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/20">
                <TableHead className="font-bold uppercase text-[10px] tracking-widest pl-6">Organisateur</TableHead>
                <TableHead className="font-bold uppercase text-[10px] tracking-widest">Campagne</TableHead>
                <TableHead className="font-bold uppercase text-[10px] tracking-widest">Avancement Tâches</TableHead>
                <TableHead className="font-bold uppercase text-[10px] tracking-widest">Montant Récolté</TableHead>
                <TableHead className="font-bold uppercase text-[10px] tracking-widest">Jours Écoulés</TableHead>
                <TableHead className="text-right font-bold uppercase text-[10px] tracking-widest pr-6">Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {metrics.map((m: CampaignMetric) => {
                const percent = m.tasks_total > 0 ? Math.round((m.tasks_completed / m.tasks_total) * 100) : 0;
                
                return (
                  <TableRow key={m.id} className="hover:bg-muted/20 transition-colors">
                    <TableCell className="pl-6 font-semibold">
                      {m.organizer_name}
                      <span className="block text-[10px] uppercase text-muted-foreground mt-0.5">
                        {m.organizer_role}
                      </span>
                    </TableCell>
                    <TableCell className="font-medium text-muted-foreground">
                      {m.campaign_name}
                      {m.objective && <span className="block text-[10px] truncate max-w-[200px] mt-0.5" title={m.objective}>Obj: {m.objective}</span>}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between text-xs font-bold w-32">
                          <span className="text-muted-foreground">{m.tasks_completed} / {m.tasks_total}</span>
                          <span className={percent === 100 ? "text-emerald-500" : "text-primary"}>{percent}%</span>
                        </div>
                        <div className="w-32 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all ${percent === 100 ? "bg-emerald-500" : "bg-primary"}`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-black text-sm">
                      {parseInt(m.collected_amount as string).toLocaleString("fr-FR")} FCFA
                      {Number(m.goal_amount) > 0 && (
                        <span className="block text-[10px] font-semibold text-muted-foreground mt-0.5">
                          sur {parseInt(m.goal_amount as string).toLocaleString('fr-FR')}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm font-medium">
                      {m.days_active} jour(s)
                      <span className="block text-[10px] text-muted-foreground mt-0.5">
                        sur {m.days_total} • reste {m.days_remaining}
                      </span>
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <Badge
                        variant="secondary"
                        className={`text-[10px] uppercase font-black tracking-wider border-none ${
                          m.status === "active" 
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30"
                            : m.status === "completed"
                            ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {m.status}
                      </Badge>
                      <span className="block text-[10px] text-muted-foreground mt-1">
                        {m.chat_count} salon(s)
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
