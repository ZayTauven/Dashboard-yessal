import { getAnnouncements } from "@/app/actions/announcements";
import { NotificationsClient } from "./NotificationsClient";

export default async function NotificationsPage() {
  const { data: announcements, error } = await getAnnouncements();

  return (
    <div className="p-8 max-w-4xl mx-auto flex flex-col gap-8">
      <div className="flex justify-between items-end">
        <div>
          <h1
            className="text-3xl font-semibold tracking-tight"
            style={{ color: "var(--foreground)" }}
          >
            Notifications
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--muted-foreground)" }}>
            Toutes vos alertes et annonces centralisées.
          </p>
        </div>
      </div>

      {error ? (
        <div className="bg-red-50 text-red-600 p-6 rounded-2xl border border-red-100 font-medium">
          {error} — Impossible de charger les notifications.
        </div>
      ) : (
        <NotificationsClient announcements={announcements || []} />
      )}
    </div>
  );
}
