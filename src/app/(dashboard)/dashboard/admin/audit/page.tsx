import { getAuditLogs } from "@/app/actions/analytics";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ErrorAlert } from "@/components/ui/error-alert";
import { EmptyState } from "@/components/ui/empty-state";
import { ScrollText, ShieldCheck } from "lucide-react";

const ACTION_COLORS: Record<string, string> = {
  CREATE: "bg-green-100 text-green-700 dark:bg-green-900/30",
  UPDATE: "bg-blue-100 text-blue-700 dark:bg-blue-900/30",
  DELETE: "bg-red-100 text-red-700 dark:bg-red-900/30",
  LOGIN: "bg-purple-100 text-purple-700 dark:bg-purple-900/30",
  LOGOUT: "bg-gray-100 text-gray-600 dark:bg-gray-800",
  EXPORT: "bg-orange-100 text-orange-700 dark:bg-orange-900/30",
};

function getActionColor(action: string) {
  const key = (action || "").toUpperCase();
  for (const [prefix, cls] of Object.entries(ACTION_COLORS)) {
    if (key.includes(prefix)) return cls;
  }
  return "bg-muted text-muted-foreground";
}

export default async function AdminAuditPage() {
  const { data: logs, error } = await getAuditLogs();

  return (
    <div className="p-8 max-w-6xl mx-auto flex flex-col gap-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Journaux d'Audit</h1>
          <p className="text-muted-foreground mt-1">
            Traçabilité complète des actions administratives et financières.
          </p>
        </div>
        <div
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold"
          style={{ background: "rgba(145,110,231,0.1)", color: "var(--primary)" }}
        >
          <ShieldCheck size={15} />
          Audit activé
        </div>
      </div>

      {error ? (
        <ErrorAlert message={`${error} — Impossible de charger les logs d'audit.`} />
      ) : !logs || logs.length === 0 ? (
        <div className="bg-card rounded-2xl border shadow-sm" style={{ borderColor: "var(--border)" }}>
          <EmptyState
            icon={ScrollText}
            title="Aucune activité enregistrée"
            description="Les actions administratives et financières apparaîtront ici automatiquement."
            size="lg"
          />
        </div>
      ) : (
        <div
          className="bg-card rounded-2xl border shadow-sm overflow-hidden"
          style={{ borderColor: "var(--border)" }}
        >
          {/* Stats Bar */}
          <div
            className="flex items-center gap-6 px-6 py-4 border-b bg-muted/10 text-xs font-bold text-muted-foreground"
            style={{ borderColor: "var(--border)" }}
          >
            <span>{logs.length} entrée{logs.length > 1 ? "s" : ""}</span>
            {["CREATE", "UPDATE", "DELETE", "LOGIN"].map((action) => {
              const count = logs.filter((l: any) =>
                (l.action || "").toUpperCase().includes(action)
              ).length;
              if (!count) return null;
              return (
                <span key={action} className={`px-2 py-0.5 rounded-md ${getActionColor(action)}`}>
                  {action} ({count})
                </span>
              );
            })}
          </div>

          <Table>
            <TableHeader className="bg-muted/20">
              <TableRow>
                <TableHead className="font-bold uppercase text-[10px] tracking-widest pl-6">Date & Heure</TableHead>
                <TableHead className="font-bold uppercase text-[10px] tracking-widest">Utilisateur</TableHead>
                <TableHead className="font-bold uppercase text-[10px] tracking-widest">Action</TableHead>
                <TableHead className="font-bold uppercase text-[10px] tracking-widest">Entité</TableHead>
                <TableHead className="text-right font-bold uppercase text-[10px] tracking-widest pr-6">Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log: any) => (
                <TableRow
                  key={log.id}
                  className="hover:bg-muted/20 transition-colors"
                >
                  <TableCell className="pl-6 text-xs text-muted-foreground font-medium">
                    {new Date(log.created_at).toLocaleString("fr-FR", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </TableCell>
                  <TableCell className="text-xs font-medium">
                    {log.user_email || log.user || "Système"}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={`text-[10px] uppercase font-black tracking-wider border-none ${getActionColor(log.action)}`}
                    >
                      {log.action}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs">
                    <Badge variant="outline" className="capitalize text-[10px]">
                      {log.entity || log.model || "System"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right pr-6">
                    <Badge
                      className={`border-none text-[10px] ${
                        log.success === false
                          ? "bg-red-100 text-red-700 dark:bg-red-900/30"
                          : "bg-green-100 text-green-700 dark:bg-green-900/30"
                      }`}
                    >
                      {log.success === false ? "Échec" : "Succès"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
