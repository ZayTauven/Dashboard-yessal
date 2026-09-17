import { getNews } from "@/app/actions/news";
import { ErrorAlert } from "@/components/ui/error-alert";
import { PageHead } from "@/components/vireo/PageHead";
import { NewsClient } from "./NewsClient";
import { getSessionRole } from "./session-role";

export const metadata = {
  title: "Actualités",
  description: "Journal et actualités de la confrérie Yessal.",
};

export default async function NewsPage() {
  const { data: posts, error } = await getNews();
  /* La lecture du jeton vivait ici, recopiée. Elle est passée dans
     `session-role.ts` depuis que les pages de création et d'édition en ont
     besoin du même contrôle. */
  const role = await getSessionRole();

  return (
    <div className="flex flex-col gap-6">
      <PageHead
        role={role}
        title="Actualités"
        subtitle="Le journal de la confrérie : événements, annonces et récits."
      />

      {error && <ErrorAlert message={error} />}

      <NewsClient initialPosts={posts || []} isAdmin={role === "admin"} />
    </div>
  );
}
