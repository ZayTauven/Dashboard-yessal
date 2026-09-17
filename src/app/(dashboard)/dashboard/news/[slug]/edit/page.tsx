import { notFound, redirect } from "next/navigation";
import { getNewsPost } from "@/app/actions/news";
import { PageHead } from "@/components/vireo/PageHead";
import { NewsForm } from "../../NewsForm";
import { getSessionRole } from "../../session-role";
import type { NewsPost } from "../../types";

export const metadata = {
  title: "Modifier l'article",
};

export default async function EditNewsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  if ((await getSessionRole()) !== "admin") {
    redirect(`/dashboard/news/${slug}`);
  }

  const { data: post, error, status } = await getNewsPost(slug);

  /*
   * Même découpage que la page de lecture : `notFound()` est réservé au vrai
   * 404. Une session expirée (401), un droit manquant (403) ou un backend à
   * terre ne sont pas des absences — les confondre afficherait « cette page
   * n'existe pas » sur un article parfaitement existant. Le reste part à la
   * frontière d'erreur du segment, qui propose de réessayer.
   */
  if (status === 404) notFound();
  if (error || !post) {
    throw new Error(error ?? "Actualité indisponible.");
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHead
        role="admin"
        title="Modifier l'article"
        subtitle={post.title}
        crumbs={[
          { label: "Application" },
          { label: "Actualités", href: "/dashboard/news" },
          { label: post.title, href: `/dashboard/news/${slug}` },
        ]}
      />

      <NewsForm post={post as NewsPost} />
    </div>
  );
}
