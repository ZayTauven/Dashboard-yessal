import { getNotifications } from "@/app/actions/notifications";
import { getProfile } from "@/app/actions/users";
import { ErrorAlert } from "@/components/ui/error-alert";
import { PageHead } from "@/components/vireo/PageHead";
import type { Role } from "@/lib/nav";
import { NotificationsClient, type Notification } from "./NotificationsClient";

export default async function NotificationsPage() {
  const [{ data: notifications, error }, { data: profile }] = await Promise.all([
    getNotifications(),
    getProfile(),
  ]);

  const role = (profile?.role ?? "member") as Role;

  return (
    <div className="flex flex-col gap-6">
      <PageHead
        role={role}
        title="Notifications"
        subtitle="Toutes vos alertes personnelles, centralisées."
      />

      {error ? (
        <ErrorAlert
          message={`${error} — Impossible de charger les notifications.`}
        />
      ) : (
        <NotificationsClient
          notifications={(notifications || []) as Notification[]}
        />
      )}
    </div>
  );
}
