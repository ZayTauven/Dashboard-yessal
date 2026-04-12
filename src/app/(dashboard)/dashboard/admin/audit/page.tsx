import { getAuditLogs } from "@/app/actions/analytics";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default async function AdminAuditPage() {
  const { data: logs, error } = await getAuditLogs();

  return (
    <div className="p-8 max-w-6xl mx-auto flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Journaux d'Audit</h1>
        <p className="text-muted-foreground mt-1">Traçabilité complète des actions administratives et financières.</p>
      </div>

      {error ? (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100">{error}</div>
      ) : (
        <div className="bg-card rounded-2xl border shadow-sm overflow-hidden" style={{ borderColor: "var(--border)" }}>
            <Table>
                <TableHeader className="bg-muted/30">
                    <TableRow>
                        <TableHead className="font-bold uppercase text-[10px] tracking-widest pl-6">Date</TableHead>
                        <TableHead className="font-bold uppercase text-[10px] tracking-widest">Utilisateur</TableHead>
                        <TableHead className="font-bold uppercase text-[10px] tracking-widest">Action</TableHead>
                        <TableHead className="font-bold uppercase text-[10px] tracking-widest">Entité</TableHead>
                        <TableHead className="text-right font-bold uppercase text-[10px] tracking-widest pr-6">Status</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {logs?.map((log: any) => (
                        <TableRow key={log.id}>
                            <TableCell className="pl-6 text-xs text-muted-foreground">
                                {new Date(log.created_at).toLocaleString()}
                            </TableCell>
                            <TableCell className="font-medium text-xs">
                                {log.user_email}
                            </TableCell>
                            <TableCell className="font-bold text-xs uppercase text-yessal-green">
                                {log.action}
                            </TableCell>
                            <TableCell className="text-xs">
                                <Badge variant="outline" className="capitalize">{log.entity || "System"}</Badge>
                            </TableCell>
                            <TableCell className="text-right pr-6">
                                <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none">Success</Badge>
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
