"use client";

/*
 * ═══════════════════════════════════════════════════════════════════════════
 * Actualités — le journal de la confrérie
 * ═══════════════════════════════════════════════════════════════════════════
 * Repris du patron `blog/BlogList` de Vireo : un article à la une en pleine
 * largeur, puis une grille de cartes média.
 *
 * Trois manques que le patron comble :
 *
 *   · Ni AUTEUR ni DATE n'étaient affichés. `created_by_name` et `created_at`
 *     existent dans le type et arrivent de l'API — ils n'étaient simplement
 *     jamais rendus. Un journal sans date de parution n'est pas un journal.
 *
 *   · Aucun article à la une : douze cartes de poids identique, dont la plus
 *     récente ne se distinguait pas.
 *
 *   · Aucune recherche, aucun filtre. Un admin ne pouvait pas retrouver ses
 *     brouillons — le badge « Actualité » était figé et ne disait jamais si
 *     l'article était publié.
 *
 * Correction d'un bug au passage : après l'ajout d'une image à la galerie, le
 * code appelait `fetch("/api/news/posts/<slug>/")`. Cette route n'existe pas —
 * il n'y a pas de dossier `src/app/api`. Le `.json()` levait sur la page 404,
 * donc `setGalleryLoading(false)` n'était jamais atteint et le bouton
 * « Ajouter » restait bloqué en chargement. On passe par l'action serveur
 * `getNewsPost`, qui existe déjà et fait exactement ce travail.
 */

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  ImagePlus,
  Loader2,
  Newspaper,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  addGalleryImage,
  addNewsPost,
  deleteGalleryImage,
  deleteNewsPost,
  getNewsPost,
  updateNewsPost,
} from "@/app/actions/news";
import { EmptyState } from "@/components/ui/empty-state";
import { Gallery } from "@/components/vireo/Gallery";
import { Avatar } from "@/components/vireo/Avatar";
import { FileDrop, checkFileSize } from "@/components/vireo/FileDrop";
import { Menu } from "@/components/vireo/Menu";
import { Modal } from "@/components/vireo/Modal";
import { Pagination } from "@/components/vireo/Pagination";
import { CoverImage } from "@/components/vireo/CoverImage";
import { ALL, useCollection } from "@/hooks/useCollection";

type NewsGalleryImage = {
  id: number;
  image: string;
  caption?: string;
};

type NewsPost = {
  id: number;
  slug: string;
  title: string;
  excerpt?: string | null;
  content: string;
  cover_image?: string | null;
  youtube_url?: string | null;
  is_published: boolean;
  created_at: string;
  created_by_name?: string | null;
  gallery?: NewsGalleryImage[];
};

const dateFmt = new Intl.DateTimeFormat("fr-SN", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

function formatDate(iso?: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : dateFmt.format(d);
}

export function NewsClient({
  initialPosts,
  isAdmin,
}: {
  initialPosts: NewsPost[];
  isAdmin: boolean;
}) {
  const router = useRouter();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<NewsPost | null>(null);
  const [isPending, startTransition] = useTransition();
  const [galleryLoading, setGalleryLoading] = useState(false);

  const searchable = useMemo(
    () => (p: NewsPost) => [p.title, p.excerpt, p.created_by_name],
    [],
  );

  const filters = useMemo(
    () => ({
      state: (p: NewsPost, v: string) =>
        v === "published" ? p.is_published : !p.is_published,
    }),
    [],
  );

  const sorters = useMemo(
    () => ({ date: (p: NewsPost) => p.created_at }),
    [],
  );

  const c = useCollection(initialPosts, {
    searchable,
    filters,
    sorters,
    initialSort: { key: "date", dir: "desc" },
    pageSize: 9,
  });

  /* L'article à la une est le plus récent PUBLIÉ, pris sur l'ensemble : il ne
     doit pas disparaître parce qu'on cherche autre chose. */
  const featured = useMemo(() => {
    return [...initialPosts]
      .filter((p) => p.is_published)
      .sort((a, b) => b.created_at.localeCompare(a.created_at))[0];
  }, [initialPosts]);

  /* La une n'est pas répétée dans la grille tant qu'aucun filtre n'est actif —
     sinon on la lit deux fois de suite. Dès qu'on filtre, la grille redevient
     exhaustive : masquer un résultat de recherche serait déroutant. */
  const gridRows = c.isFiltered
    ? c.rows
    : c.rows.filter((p) => p.id !== featured?.id);

  const handleAdd = (formData: FormData) => {
    startTransition(async () => {
      const res = await addNewsPost(formData);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success("Article publié avec succès.");
      setIsCreateOpen(false);
      router.refresh();
    });
  };

  const handleUpdate = (formData: FormData) => {
    if (!editingPost) return;
    startTransition(async () => {
      /*
       * Le SLUG, pas l'identifiant. `NewsPostViewSet` déclare
       * `lookup_field = 'slug'` (news/views.py) : `PATCH /api/news/posts/4/`
       * répond 404 tandis que `PATCH /api/news/posts/<slug>/` répond 200.
       *
       * C'est la cause de « la modification ne passe pas ». L'erreur
       * d'hydratation visible en même temps dans la console n'y est pour rien :
       * elle vient du Customizer et s'affiche sur toutes les pages.
       */
      const res = await updateNewsPost(editingPost.slug, formData);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success("Article mis à jour.");
      setEditingPost(null);
      router.refresh();
    });
  };

  const handleDelete = (post: NewsPost) => {
    toast(`Supprimer « ${post.title} » ?`, {
      action: {
        label: "Supprimer",
        onClick: async () => {
          const { error } = await deleteNewsPost(post.slug);
          if (error) {
            toast.error(error);
            return;
          }
          toast.success("Article supprimé.");
          router.refresh();
        },
      },
      cancel: { label: "Annuler", onClick: () => {} },
    });
  };

  const handleAddGallery = async (
    slug: string,
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    /* Ce dépôt part au serveur immédiatement : on le refuse AVANT l'envoi
       plutôt que de laisser Django répondre par une erreur de validation. */
    const tooBig = checkFileSize(file);
    if (tooBig) {
      toast.error(tooBig);
      e.target.value = "";
      return;
    }

    setGalleryLoading(true);
    const formData = new FormData();
    formData.append("image", file);

    try {
      const { error } = await addGalleryImage(slug, formData);
      if (error) {
        toast.error(error);
        return;
      }
      toast.success("Image ajoutée à la galerie.");
      router.refresh();

      /* On relit l'article pour rafraîchir la galerie sans refermer la modale. */
      const { data: updated } = await getNewsPost(slug);
      if (updated) setEditingPost(updated as NewsPost);
    } finally {
      /* `finally` : même si la relecture échoue, le bouton doit sortir de son
         état de chargement. C'est précisément ce qui manquait. */
      setGalleryLoading(false);
      e.target.value = "";
    }
  };

  const handleDeleteGallery = (imageId: number) => {
    toast("Supprimer cette image ?", {
      action: {
        label: "Supprimer",
        onClick: async () => {
          const { error } = await deleteGalleryImage(imageId);
          if (error) {
            toast.error(error);
            return;
          }
          toast.success("Image supprimée.");
          router.refresh();
          setEditingPost((prev) =>
            prev
              ? { ...prev, gallery: prev.gallery?.filter((i) => i.id !== imageId) }
              : prev,
          );
        },
      },
      cancel: { label: "Annuler", onClick: () => {} },
    });
  };

  /* Corps de formulaire commun création / édition. */
  const formFields = (post: NewsPost | null) => (
    <>
      <div className="ax-field">
        <label className="ax-field__label" htmlFor={`title-${post?.id ?? "new"}`}>
          Titre
          <span className="ax-field__required" aria-hidden="true"> *</span>
        </label>
        <input
          id={`title-${post?.id ?? "new"}`}
          name="title"
          className="ax-input"
          defaultValue={post?.title ?? ""}
          required
        />
      </div>

      <div className="ax-field">
        <label className="ax-field__label" htmlFor={`excerpt-${post?.id ?? "new"}`}>
          Résumé court
        </label>
        <input
          id={`excerpt-${post?.id ?? "new"}`}
          name="excerpt"
          className="ax-input"
          defaultValue={post?.excerpt ?? ""}
          placeholder="La phrase qui donnera envie de lire l'article."
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="ax-field">
          <span className="ax-field__label">Bannière</span>
          <FileDrop
            name="cover_image"
            accept="image/*"
            hint="JPG ou PNG"
            currentPreview={post?.cover_image}
          />
        </div>
        <div className="ax-field">
          <label
            className="ax-field__label"
            htmlFor={`youtube-${post?.id ?? "new"}`}
          >
            Vidéo YouTube
          </label>
          <input
            id={`youtube-${post?.id ?? "new"}`}
            name="youtube_url"
            className="ax-input"
            defaultValue={post?.youtube_url ?? ""}
            placeholder="https://…"
          />
        </div>
      </div>

      <div className="ax-field">
        <label className="ax-field__label" htmlFor={`content-${post?.id ?? "new"}`}>
          Contenu
          <span className="ax-field__required" aria-hidden="true"> *</span>
        </label>
        <textarea
          id={`content-${post?.id ?? "new"}`}
          name="content"
          rows={8}
          className="ax-textarea"
          defaultValue={post?.content ?? ""}
          required
        />
      </div>

      <label className="ax-check">
        <input
          type="checkbox"
          name="is_published"
          value="true"
          className="ax-checkbox"
          defaultChecked={post ? post.is_published : true}
        />
        <span className="ax-toggle__label">Publier immédiatement</span>
      </label>
    </>
  );

  return (
    <div className="flex flex-col gap-4">
      {/* ── Barre d'outils ── */}
      <section className="ax-card ax-card--compact" aria-label="Filtres">
        <div className="ax-card__body flex flex-wrap items-center gap-3">
          <div className="ax-field__control min-w-48 flex-1">
            <span className="ax-field__affix ax-field__affix--leading">
              <Search aria-hidden="true" />
            </span>
            <input
              type="search"
              className="ax-input ax-input--with-leading-icon"
              placeholder="Titre, résumé ou auteur…"
              value={c.search}
              onChange={(e) => c.setSearch(e.target.value)}
              aria-label="Rechercher un article"
            />
          </div>

          {/* Le filtre publié/brouillon n'a de sens que pour qui peut écrire. */}
          {isAdmin && (
            <div className="ax-segment" role="group" aria-label="État de publication">
              {[
                { value: ALL, label: "Tous" },
                { value: "published", label: "Publiés" },
                { value: "draft", label: "Brouillons" },
              ].map((o) => (
                <button
                  key={o.value}
                  type="button"
                  className="ax-segment__option"
                  aria-pressed={c.filter("state") === o.value}
                  onClick={() => c.setFilter("state", o.value)}
                >
                  {o.label}
                </button>
              ))}
            </div>
          )}

          {isAdmin && (
            <button
              type="button"
              className="ax-btn ax-btn--primary md:ms-auto"
              onClick={() => setIsCreateOpen(true)}
            >
              <Plus className="ax-btn__icon" size={16} aria-hidden="true" />
              <span className="ax-btn__label">Publier une actualité</span>
            </button>
          )}
        </div>
      </section>

      {/* ── Article à la une ── */}
      {featured && !c.isFiltered && (
        <article className="ax-card ax-card--media ax-card--interactive overflow-hidden">
          <div className="grid gap-0 md:grid-cols-2">
            {/* Le repli couvre les DEUX cas : pas d'image, et image dont le
                fichier a disparu — voir <CoverImage>. */}
            <CoverImage
              src={featured.cover_image}
              icon={Newspaper}
              iconSize={56}
              className="h-56 w-full object-cover md:h-full"
              fallbackClassName="h-56 w-full md:h-full"
            />

            <div className="ax-card__body flex flex-col justify-center gap-3">
              <div className="ax-cluster gap-2">
                <span className="ax-badge ax-badge--soft ax-badge--accent ax-badge--pill">
                  À la une
                </span>
                {!featured.is_published && (
                  <span className="ax-badge ax-badge--warning ax-badge--sm">
                    Brouillon
                  </span>
                )}
              </div>

              <Link
                href={`/dashboard/news/${featured.slug}`}
                className="ax-card__title ax-clamp-2 text-xl"
              >
                {featured.title}
              </Link>

              <p className="ax-text-muted ax-clamp-3 text-sm leading-relaxed">
                {featured.excerpt || featured.content}
              </p>

              <div className="ax-cluster ax-text-subtle gap-3 text-xs">
                <Avatar name={featured.created_by_name} size="xs" />
                <span>{featured.created_by_name || "Rédaction"}</span>
                <span className="ax-cluster gap-1">
                  <CalendarDays size={12} aria-hidden="true" />
                  {formatDate(featured.created_at)}
                </span>
              </div>

              <Link
                href={`/dashboard/news/${featured.slug}`}
                className="ax-btn ax-btn--tonal w-fit"
              >
                <span className="ax-btn__label">Lire l&apos;article</span>
              </Link>
            </div>
          </div>
        </article>
      )}

      {/* ── Grille ── */}
      {gridRows.length === 0 ? (
        <div className="ax-card">
          <div className="ax-card__body">
            <EmptyState
              icon={c.isFiltered ? Search : Newspaper}
              tone={c.isFiltered ? "search" : "neutral"}
              title={
                c.isFiltered
                  ? "Aucun article ne correspond"
                  : "Aucune autre actualité"
              }
              description={
                c.isFiltered
                  ? "Essayez d'autres mots, ou remettez les filtres à zéro."
                  : "Le journal de la confrérie s'écrit ici : événements, annonces et récits."
              }
              action={
                c.isFiltered ? (
                  <button
                    type="button"
                    className="ax-btn ax-btn--outline"
                    onClick={c.resetFilters}
                  >
                    <span className="ax-btn__label">Réinitialiser les filtres</span>
                  </button>
                ) : isAdmin ? (
                  <button
                    type="button"
                    className="ax-btn ax-btn--primary"
                    onClick={() => setIsCreateOpen(true)}
                  >
                    <Plus className="ax-btn__icon" size={16} aria-hidden="true" />
                    <span className="ax-btn__label">Publier une actualité</span>
                  </button>
                ) : undefined
              }
            />
          </div>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {gridRows.map((post) => (
            <article
              key={post.id}
              className="ax-card ax-card--media ax-card--interactive flex flex-col"
            >
              <div className="ax-card__media h-44 overflow-hidden">
                <CoverImage
                  src={post.cover_image}
                  icon={Newspaper}
                  iconSize={40}
                  className="h-full w-full object-cover"
                  fallbackClassName="h-full w-full"
                />
              </div>

              <div className="ax-card__body flex flex-1 flex-col gap-2">
                <div className="flex items-start justify-between gap-2">
                  <Link
                    href={`/dashboard/news/${post.slug}`}
                    className="ax-card__title ax-clamp-2"
                  >
                    {post.title}
                  </Link>
                  {isAdmin && (
                    <Menu
                      label={`Actions pour ${post.title}`}
                      items={[
                        {
                          label: "Modifier",
                          icon: Pencil,
                          onSelect: () => setEditingPost(post),
                        },
                        {
                          label: "Supprimer",
                          icon: Trash2,
                          danger: true,
                          separatorBefore: true,
                          onSelect: () => handleDelete(post),
                        },
                      ]}
                    />
                  )}
                </div>

                {!post.is_published && (
                  <span className="ax-badge ax-badge--warning ax-badge--sm w-fit">
                    Brouillon
                  </span>
                )}

                <p className="ax-text-muted ax-clamp-3 flex-1 text-sm leading-relaxed">
                  {post.excerpt || post.content}
                </p>

                <div className="ax-cluster ax-text-subtle gap-2 text-xs">
                  <Avatar name={post.created_by_name} size="xs" />
                  <span className="ax-truncate">
                    {post.created_by_name || "Rédaction"}
                  </span>
                  <span className="ms-auto">{formatDate(post.created_at)}</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <Pagination
        page={c.page}
        totalPages={c.totalPages}
        onPageChange={c.setPage}
        totalItems={c.total}
        pageSize={c.pageSize}
        itemLabel="articles"
      />

      {/* ── Création ── */}
      <Modal
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        title="Nouvel article"
        description="Partagez les moments forts avec les membres."
        size="lg"
      >
        <form action={handleAdd} className="flex flex-col gap-4">
          {formFields(null)}

          <div className="ax-field">
            <span className="ax-field__label">Photos de galerie</span>
            <FileDrop
              name="gallery_images"
              accept="image/*"
              multiple
              hint="JPG ou PNG"
            />
            <p className="ax-field__hint">
              Elles s&apos;ajoutent sous l&apos;article.
            </p>
          </div>

          <button
            type="submit"
            className="ax-btn ax-btn--primary ax-btn--block"
            disabled={isPending}
          >
            <span className="ax-btn__label">
              {isPending ? "Publication…" : "Publier l'article"}
            </span>
          </button>
        </form>
      </Modal>

      {/* ── Édition ── */}
      <Modal
        open={Boolean(editingPost)}
        onOpenChange={(o) => !o && setEditingPost(null)}
        title="Modifier l'article"
        description={editingPost?.title}
        size="lg"
      >
        {editingPost && (
          <div className="flex flex-col gap-6">
            <form action={handleUpdate} className="flex flex-col gap-4">
              {formFields(editingPost)}
              <button
                type="submit"
                className="ax-btn ax-btn--primary ax-btn--block"
                disabled={isPending}
              >
                <span className="ax-btn__label">
                  {isPending ? "Enregistrement…" : "Sauvegarder"}
                </span>
              </button>
            </form>

            {/*
              La galerie s'édite hors du formulaire principal : chaque image
              part immédiatement au serveur, alors que le reste attend la
              soumission. Les imbriquer donnerait deux régimes d'enregistrement
              dans un même formulaire.
            */}
            <section className="ax-dropzone">
              <h3 className="ax-eyebrow">Galerie</h3>

              <label className="ax-dropzone__area">
                {galleryLoading ? (
                  <Loader2 className="animate-spin" aria-hidden="true" />
                ) : (
                  <ImagePlus aria-hidden="true" />
                )}
                <span className="text-sm">
                  {galleryLoading
                    ? "Envoi en cours…"
                    : "Ajouter une image à la galerie"}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  className="ax-visually-hidden"
                  disabled={galleryLoading}
                  onChange={(e) => handleAddGallery(editingPost.slug, e)}
                />
              </label>

              {/*
                Même visionneuse que côté lecture : une vignette de 80 px ne
                permet pas de juger d'une photo qu'on s'apprête à publier, ni de
                décider laquelle retirer. Le bouton de suppression reste posé
                par-dessus la vignette, hors du bouton d'agrandissement.
              */}
              {editingPost.gallery && editingPost.gallery.length > 0 && (
                <Gallery
                  images={editingPost.gallery}
                  columns={4}
                  overlay={(img) => (
                    <button
                      type="button"
                      className="ax-btn ax-btn--icon ax-btn--soft-danger absolute inset-e-1 top-1"
                      aria-label="Supprimer cette image"
                      onClick={() => handleDeleteGallery(img.id as number)}
                    >
                      <X size={12} aria-hidden="true" />
                    </button>
                  )}
                />
              )}
            </section>
          </div>
        )}
      </Modal>
    </div>
  );
}
