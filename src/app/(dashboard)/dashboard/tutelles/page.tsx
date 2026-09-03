import { getTutelles } from "@/app/actions/tutelles";
import { getProfile } from "@/app/actions/users";
import { ErrorAlert } from "@/components/ui/error-alert";
import { PageHead } from "@/components/vireo/PageHead";
import type { Role } from "@/lib/nav";
import { TutelleClient, type Tutelle } from "./TutelleClient";

export default async function TutellesPage() {
  const [{ data: tutelles, error }, { data: profile }] = await Promise.all([
    getTutelles(),
    getProfile(),
  ]);

  const role = (profile?.role ?? "member") as Role;

  return (
    <div className="flex flex-col gap-6">
      <PageHead
        role={role}
        title="Mes tutelles"
        subtitle="Les proches dont vous prenez en charge les participations et les Jëfs."
      />

      {error ? (
        <ErrorAlert message={error} />
      ) : (
        <TutelleClient initialTutelles={(tutelles || []) as Tutelle[]} />
      )}
    </div>
  );
}
