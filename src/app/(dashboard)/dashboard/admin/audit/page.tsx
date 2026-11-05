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
        subtitle="Qui a fait quoi, et quand : les actes de gestion et les mouvements d'argent."
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
