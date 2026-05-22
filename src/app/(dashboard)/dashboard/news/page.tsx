import { getNews } from "@/app/actions/news";
import { NewsClient } from "./NewsClient";
import { ErrorAlert } from "@/components/ui/error-alert";
import { cookies } from "next/headers";

export const metadata = {
  title: "Actualités | Yessal",
  description: "Journal et actualités de la confrérie Yessal.",
};

export default async function NewsPage() {
  const { data: posts, error } = await getNews();
  const cookiesList = await cookies();
  const token = cookiesList.get("session-yessal")?.value;
  let isAdmin = false;
  
  if (token) {
    try {
      const { jwtDecode } = await import("jwt-decode");
      const user = jwtDecode<{ role?: string }>(token);
      isAdmin = user?.role === "admin";
    } catch (e) {
      console.error(e);
    }
  }

  return (
    <div className="container mx-auto py-8 px-4 lg:px-8">
      {error && <ErrorAlert message={error} className="mb-6" />}
      <NewsClient initialPosts={posts || []} isAdmin={isAdmin} />
    </div>
  );
}
