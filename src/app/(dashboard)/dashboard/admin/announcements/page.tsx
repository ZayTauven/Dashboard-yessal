import { getAnnouncements } from "@/app/actions/announcements";
import { getDaaras } from "@/app/actions/daara";
import { ErrorAlert } from "@/components/ui/error-alert";
import { PageHead } from "@/components/vireo/PageHead";
import {
  AnnouncementManagementClient,
  type Announcement,
  type DaaraOption,
} from "./AnnouncementManagementClient";

export default async function AdminAnnouncementsPage() {
  const [{ data: announcements, error: annError }, { data: daaras, error: daaraError }] = await Promise.all([
    getAnnouncements(),
    getDaaras()
  ]);

  const error = annError || daaraError;

  return (
    <div className="flex flex-col gap-6">
      <PageHead
        role="admin"
        title="Annonces Hub"
        subtitle="Publiez des messages adressés à tout le réseau ou à un Daara précis."
      />

      {error ? (
        <ErrorAlert message={error} />
      ) : (
        <AnnouncementManagementClient
          initialAnnouncements={(announcements || []) as Announcement[]}
          daaras={(daaras || []) as DaaraOption[]}
        />
      )}
    </div>
  );
}
