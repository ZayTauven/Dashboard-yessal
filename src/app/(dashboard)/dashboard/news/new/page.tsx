import { redirect } from "next/navigation";
import { PageHead } from "@/components/vireo/PageHead";
import { NewsForm } from "../NewsForm";
import { getSessionRole } from "../session-role";

export const metadata = {
  title: "Nouvel article",
  description: "Rédiger une actualité de la confrérie Yessal.",
};

export default async function NewNewsPage() {
  /* Écrire est réservé aux administrateurs : `NewsPostViewSet` exige
     `IsAdminUser` sur la création. Autant le dire ici plutôt que de laisser un
     membre rédiger un article que le serveur refusera. */
  if ((await getSessionRole()) !== "admin") {
    redirect("/dashboard/news");
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHead
        role="admin"
        title="Nouvel article"
        subtitle="Le journal de la confrérie : événements, annonces et récits."
        crumbs={[
          { label: "Application" },
          { label: "Actualités", href: "/dashboard/news" },
        ]}
      />

      <NewsForm />
    </div>
  );
}
