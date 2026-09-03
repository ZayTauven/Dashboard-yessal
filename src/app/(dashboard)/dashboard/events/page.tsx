import { getEvents } from "@/app/actions/events";
import { getProfile } from "@/app/actions/users";
import { ErrorAlert } from "@/components/ui/error-alert";
import { PageHead } from "@/components/vireo/PageHead";
import type { Role } from "@/lib/nav";
import { EventsClient } from "./EventsClient";

export default async function EventsPage() {
  const [{ data: fetes, error }, { data: profile }] = await Promise.all([
    getEvents(),
    getProfile(),
  ]);

  const role = (profile?.role ?? "member") as Role;

  return (
    <div className="flex flex-col gap-6">
      {/* Le titre et le sous-titre étaient saisis sans accents (« Fetes »,
          « utilisees »). */}
      <PageHead
        role={role}
        title="Les Fêtes"
        subtitle="Calendrier des célébrations de la confrérie, auxquelles se rattachent les Ndiguels."
      />

      {error ? (
        <ErrorAlert message={error} />
      ) : (
        <EventsClient initialEvents={fetes || []} isAdmin={role === "admin"} />
      )}
    </div>
  );
}
