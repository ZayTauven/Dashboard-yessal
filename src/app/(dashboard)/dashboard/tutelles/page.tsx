import { getTutelles } from "@/app/actions/tutelles";
import { TutelleClient } from "./TutelleClient";
import { ErrorAlert } from "@/components/ui/error-alert";

export default async function TutellesPage() {
  const { data: tutelles, error } = await getTutelles();

  return (
    <div className="p-8 max-w-5xl mx-auto flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight" style={{ color: "var(--foreground)" }}>
            Mes Tutelles
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--muted-foreground)" }}>
            Gérez la liste de vos proches dont vous prenez en charge les participations et dons.
          </p>
        </div>
      </div>

      {error ? (
        <ErrorAlert message={error} />
      ) : (
        <TutelleClient initialTutelles={tutelles || []} />
      )}
    </div>
  );
}
