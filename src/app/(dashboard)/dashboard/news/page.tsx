import { cookies } from "next/headers";
import { jwtDecode } from "jwt-decode";
import { getNews } from "@/app/actions/news";
import { ErrorAlert } from "@/components/ui/error-alert";
import { PageHead } from "@/components/vireo/PageHead";
import type { Role } from "@/lib/nav";
import { NewsClient } from "./NewsClient";

export const metadata = {
  title: "Actualités",
  description: "Journal et actualités de la confrérie Yessal.",
};

export default async function NewsPage() {
  const { data: posts, error } = await getNews();

  /*
   * `jwt-decode` était importé dynamiquement dans un try/catch. L'import
   * statique suffit : le paquet est déjà une dépendance et le layout du
   * dashboard l'utilise de la même façon. Seul le décodage peut échouer, et
   * c'est lui qu'on garde protégé.
   */
  const token = (await cookies()).get("session-yessal")?.value;
  let role: Role = "member";
  if (token) {
    try {
      role = (jwtDecode<{ role?: string }>(token).role ?? "member") as Role;
    } catch (e) {
      console.error("JWT Decode Error:", e);
    }
  }

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
