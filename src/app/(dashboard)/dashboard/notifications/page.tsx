import { getNotifications } from "@/app/actions/notifications";
import {
  NotificationsClient,
  type Notification,
} from "./NotificationsClient";
import { ErrorAlert } from "@/components/ui/error-alert";

export default async function NotificationsPage() {
  const { data: notifications, error } = await getNotifications();

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
            Toutes vos alertes personnelles centralisées.
          </p>
        </div>
      </div>

      {error ? (
        <ErrorAlert message={`${error} — Impossible de charger les notifications.`} />
      ) : (
        <NotificationsClient
          notifications={(notifications || []) as Notification[]}
        />
      )}
    </div>
  );
}
