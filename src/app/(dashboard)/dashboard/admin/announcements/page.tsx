import { getAnnouncements } from "@/app/actions/announcements";
import { getDaaras } from "@/app/actions/daara";
import { AnnouncementManagementClient } from "./AnnouncementManagementClient";

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
        <div className="bg-red-50 text-red-600 p-6 rounded-2xl border border-red-100 font-medium">{error}</div>
      ) : (
        <AnnouncementManagementClient initialAnnouncements={announcements || []} daaras={daaras || []} />
      )}
    </div>
  );
}
