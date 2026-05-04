import { getEvents } from "@/app/actions/events";
import { getProfile } from "@/app/actions/users";
import { EventsClient } from "./EventsClient";

export default async function EventsPage() {
  const [{ data: fetes, error }, { data: profile }] = await Promise.all([
    getEvents(),
    getProfile(),
  ]);

  const isAdmin = profile?.role === "admin";

  return (
    <div className="p-8 max-w-6xl mx-auto flex flex-col gap-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight" style={{ color: "var(--foreground)" }}>
            Fetes
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--muted-foreground)" }}>
            Calendrier des fetes utilisees pour lier les Ndiguels.
          </p>
        </div>
      </div>

      {error ? (
        <div className="bg-red-50 text-red-600 p-4 rounded-md">{error}</div>
      ) : (
        <EventsClient initialEvents={fetes || []} isAdmin={isAdmin} />
      )}
    </div>
  );
}
