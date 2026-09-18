import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Calendar, Image as ImageIcon, Pencil, Youtube } from "lucide-react";
import { getNewsPost } from "@/app/actions/news";
import { Avatar } from "@/components/vireo/Avatar";
import { Gallery } from "@/components/vireo/Gallery";
import { PageHead } from "@/components/vireo/PageHead";
import { CoverImage } from "@/components/vireo/CoverImage";
import { getSessionRole } from "../session-role";
import { isHtmlContent } from "../types";

/*
 * ═══════════════════════════════════════════════════════════════════════════
 * Article d'actualité
 * ═══════════════════════════════════════════════════════════════════════════
 * Repris du patron `blog/BlogDetails` de Vireo : en-tête d'article, bannière,
 * corps en colonne de lecture, rail latéral pour la galerie.
 *
 * Deux corrections :
 *
 *   · `getEmbedUrl` faisait `url.split("v=")[1]` sans vérifier que le motif
 *     existe. Une URL YouTube au format `/embed/…` ou `/shorts/…` produisait
 *     donc un `undefined` propagé dans l'URL de l'iframe. Le découpage est
 *     désormais fait par expression régulière, et couvre les trois formes.
 *
 *   · Le titre s'affichait en `text-5xl font-black`, une graisse qu'on ne
 *     trouve nulle part ailleurs. Il passe sur l'échelle typographique Aurora
 *     via <PageHead>, comme les vingt-sept autres écrans.
 *
 * ── Le corps, depuis l'éditeur riche ──────────────────────────────────────
 * `content` est du HTML pour tout article écrit avec <RichTextEditor>, et du
 * texte brut pour ceux d'avant. Les deux cohabitent en base — rien ne migre le
 * corpus — donc la page reconnaît lequel elle tient et rend en conséquence :
 * balisage d'un côté, `white-space: pre-wrap` de l'autre, comme avant.
 *
 * L'injection est sûre parce que la sortie l'est : `NewsPostSerializer.
 * validate_content` fait passer tout `content` par `core.richtext.
 * sanitize_html` À L'ENREGISTREMENT, liste blanche à l'appui. Ce qui est en
 * base a donc déjà été réduit à une douzaine de balises sans attribut
 * d'événement — y compris ce qu'un appel direct à l'API aurait tenté d'y
 * mettre.
 */

type GalleryImage = { id: number; image: string; caption?: string };

const dateFmt = new Intl.DateTimeFormat("fr-SN", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

/**
 * Extrait l'identifiant d'une vidéo YouTube, quelle que soit la forme de l'URL
 * (`watch?v=`, `youtu.be/`, `/embed/`, `/shorts/`). Renvoie `null` si aucune
 * ne correspond, plutôt qu'une URL contenant `undefined`.
 */
function getEmbedUrl(url?: string | null): string | null {
  if (!url) return null;
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/,
  );
  return match ? `https://www.youtube-nocookie.com/embed/${match[1]}` : null;
}

export default async function NewsDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { data: post, error, status } = await getNewsPost(slug);
  const isAdmin = (await getSessionRole()) === "admin";

  /*
   * `notFound()` est réservé au vrai 404. Une session expirée (401), un droit
   * manquant (403) ou un backend à terre (500 / 0) ne sont pas des absences :
   * les confondre affichait « cette page n'existe pas » sur des écrans
   * parfaitement existants. On relaie donc l'incident à la frontière
   * d'erreur du segment, qui propose de réessayer.
   */
  if (status === 404) notFound();
  if (error || !post) {
    throw new Error(error ?? "Actualité indisponible.");
  }

  const embedUrl = getEmbedUrl(post.youtube_url);
  const publishedOn = post.created_at
    ? dateFmt.format(new Date(post.created_at))
    : null;

  return (
    <article className="flex flex-col gap-6">
      <PageHead
        title={post.title}
        crumbs={[
          { label: "Application" },
          { label: "Actualités", href: "/dashboard/news" },
        ]}
        actions={
          <>
            <Link href="/dashboard/news" className="ax-btn ax-btn--ghost">
              <ArrowLeft className="ax-btn__icon" size={16} aria-hidden="true" />
              <span className="ax-btn__label">Retour aux actualités</span>
            </Link>
            {/* La modification ne s'atteignait que par le menu « ⋯ » d'une
                carte de la liste : relire son article puis vouloir corriger une
                faute obligeait à revenir en arrière et à retrouver la bonne
                carte. */}
            {isAdmin && (
              <Link
                href={`/dashboard/news/${slug}/edit`}
                className="ax-btn ax-btn--primary"
              >
                <Pencil className="ax-btn__icon" size={16} aria-hidden="true" />
                <span className="ax-btn__label">Modifier</span>
              </Link>
            )}
          </>
        }
      >
        <div className="ax-cluster ax-text-muted mt-3 gap-4 text-sm">
          <span className="ax-cluster gap-2">
            <Avatar name={post.created_by_name} size="xs" />
            {post.created_by_name || "Confrérie Yessal"}
          </span>
          {publishedOn && (
            <span className="ax-cluster gap-1">
              <Calendar size={14} aria-hidden="true" />
              {publishedOn}
            </span>
          )}
        </div>
      </PageHead>

      {post.cover_image && (
        <div className="ax-card ax-card--media overflow-hidden">
          {/* Pas de prop `icon` : cette page est un composant SERVEUR, et une
              icône Lucide est une fonction — React refuse de la sérialiser
              jusqu'au client et fait tomber la page entière. <CoverImage>
              retombe sur la même icône par défaut. */}
          <CoverImage
            src={post.cover_image}
            className="aspect-21/9 w-full object-cover"
            fallbackClassName="aspect-21/9 w-full"
          />
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="flex flex-col gap-4 lg:col-span-2">
          <section className="ax-card">
            <div className="ax-card__body">
              {/*
                `.ax-prose` porte la colonne de lecture (68ch : au-delà
                d'environ 70 caractères par ligne, l'œil perd le début de la
                ligne suivante) ET la typographie des balises de l'article.
                Elle est écrite en regard de `.ax-editor__area`, dans
                `_yessal-layers.css` : un intertitre a le même poids à
                l'écriture et à la lecture, sinon l'auteur compose à l'aveugle.
              */}
              {isHtmlContent(post.content) ? (
                <div
                  className="ax-prose"
                  dangerouslySetInnerHTML={{ __html: post.content }}
                />
              ) : (
                /* Article d'avant l'éditeur : du texte, dont les retours à la
                   ligne portent toute la structure. */
                <div className="ax-prose ax-prose--plain">{post.content}</div>
              )}
            </div>
          </section>

          {embedUrl && (
            <section className="ax-card">
              <div className="ax-card__header">
                <span className="ax-card__kpi-icon ax-card__kpi-icon--c4" aria-hidden="true">
                  <Youtube />
                </span>
                <div className="ax-card__titles">
                  <h2 className="ax-card__title">Vidéo</h2>
                </div>
              </div>
              <div className="ax-card__body">
                <div className="ax-ratio aspect-video w-full overflow-hidden rounded-(--ax-radius-sm)">
                  <iframe
                    className="h-full w-full"
                    src={embedUrl}
                    title={`Vidéo — ${post.title}`}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </div>
            </section>
          )}
        </div>

        {post.gallery && post.gallery.length > 0 && (
          <aside className="flex flex-col gap-4">
            <section className="ax-card">
              <div className="ax-card__header">
                <span className="ax-card__kpi-icon ax-card__kpi-icon--c3" aria-hidden="true">
                  <ImageIcon />
                </span>
                <div className="ax-card__titles">
                  <h2 className="ax-card__title">Galerie</h2>
                </div>
                <span className="ax-badge ax-badge--neutral ax-badge--sm">
                  {post.gallery.length}
                </span>
              </div>

              <div className="ax-card__body">
                {/* Visionneuse en place de huit allers-retours vers un onglet. */}
                <Gallery images={post.gallery as GalleryImage[]} columns={2} />
              </div>
            </section>
          </aside>
        )}
      </div>
    </article>
  );
}
