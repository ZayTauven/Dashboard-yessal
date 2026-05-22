import { getAnnouncements } from "@/app/actions/announcements";
import { getDaaras } from "@/app/actions/daara";
import { ErrorAlert } from "@/components/ui/error-alert";
import {
  AnnouncementManagementClient,
  type Announcement,
} from "./AnnouncementManagementClient";

export default async function AdminAnnouncementsPage() {
  const [{ data: announcements, error: annError }, { data: daaras, error: daaraError }] = await Promise.all([
    getAnnouncements(),
    getDaaras()
  ]);

  const error = annError || daaraError;

  return (
    <div className="p-8 max-w-6xl mx-auto flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Espace Annonces</h1>
        <p className="text-muted-foreground mt-2">
            Communiquez avec vos membres. Publiez des messages globaux ou spécifiques à certains Daaras.
        </p>
      </div>

      {error ? (
        <ErrorAlert message={error} />
      ) : (
        <AnnouncementManagementClient
          initialAnnouncements={(announcements || []) as Announcement[]}
          daaras={daaras || []}
        />
      )}
    </div>
  );
}
