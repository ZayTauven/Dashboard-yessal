import { ShieldCheck } from "lucide-react";
import { getAuditLogs } from "@/app/actions/analytics";
import { ErrorAlert } from "@/components/ui/error-alert";
import { PageHead } from "@/components/vireo/PageHead";
import { AuditClient, type AuditLog } from "./AuditClient";

export default async function AdminAuditPage() {
  const { data: logs, error } = await getAuditLogs();

  return (
    <div className="flex flex-col gap-6">
      <PageHead
        role="admin"
        title="Journal d'audit"
        subtitle="Traçabilité des actions administratives et financières."
        actions={
          /* L'indicateur « Audit activé » était peint en
             `rgba(145,110,231,0.1)` — un violet écrit en dur qui ne suivait pas
             l'accent du Customizer. */
          <span className="ax-badge ax-badge--soft ax-badge--success ax-badge--pill">
            <ShieldCheck className="ax-badge__icon" aria-hidden="true" />
            Audit activé
          </span>
        }
      />

      {error ? (
        <ErrorAlert
          message={`${error} — Impossible de charger le journal d'audit.`}
        />
      ) : (
        <AuditClient logs={(logs || []) as AuditLog[]} />
      )}
    </div>
  );
}
