"use client";

/*
 * ═══════════════════════════════════════════════════════════════════════════
 * Actualités — le journal de la confrérie
 * ═══════════════════════════════════════════════════════════════════════════
 * Repris du patron `blog/BlogList` de Vireo : un article à la une en pleine
 * largeur, puis une grille de cartes média. Recherche, filtre publié /
 * brouillon, auteur et date de parution sur chaque carte.
 *
 * ── Ce que cet écran ne fait plus ─────────────────────────────────────────
 * Il portait aussi les DEUX formulaires — création et édition — dans des
 * <Modal>, plus la galerie éditable, plus les confirmations de suppression.
 * Soit 700 lignes pour un écran dont le travail est d'afficher une liste.
 *
 * La rédaction est partie sur ses propres routes, `news/new` et
 * `news/[slug]/edit`, autour de <NewsForm>. Ce qui a motivé le déplacement est
 * détaillé en tête de ce fichier-là ; le résumé est qu'une confirmation
 * s'affichait hors de la modale qui l'avait déclenchée, et qu'un article ne se
 * rédige pas dans une boîte de 800 px qu'un clic à côté referme.
 *
 * Reste ici une seule action destructrice — supprimer un article — et elle
 * passe désormais par <ConfirmDialog> plutôt que par un toast : un toast
 * expire tout seul, ne piège pas le focus, et s'affiche dans un coin que
 * personne ne regarde au moment du clic.
 */

import { useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  Newspaper,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { deleteNewsPost } from "@/app/actions/news";
import { EmptyState } from "@/components/ui/empty-state";
import { Avatar } from "@/components/vireo/Avatar";
import { useConfirm } from "@/components/vireo/ConfirmDialog";
import { CoverImage } from "@/components/vireo/CoverImage";
import { Menu } from "@/components/vireo/Menu";
import { Pagination } from "@/components/vireo/Pagination";
import { ALL, useCollection } from "@/hooks/useCollection";
import type { NewsPost } from "./types";

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

/**
 * Aperçu d'un article sur sa carte.
 *
 * Le résumé est du texte ; le corps ne l'est plus depuis l'éditeur riche. Le
 * reprendre tel quel en repli afficherait « <p>Le <strong>Magal</strong>… » sur
 * la carte. On le déshabille donc — et on en profite pour rendre son espacement
 * lisible, un `</p><p>` valant une séparation de mots.
 */
function preview(post: NewsPost): string {
  if (post.excerpt) return post.excerpt;
  return post.content
    .replace(/<\/(p|h2|h3|h4|li|blockquote)>/gi, " ")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

export function NewsClient({
  initialPosts,
  isAdmin,
}: {
  initialPosts: NewsPost[];
  isAdmin: boolean;
}) {
  const router = useRouter();
  const { ask, dialog } = useConfirm();

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

  const sorters = useMemo(() => ({ date: (p: NewsPost) => p.created_at }), []);

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

  const confirmDelete = (post: NewsPost) =>
    ask({
      title: `Supprimer « ${post.title} » ?`,
      description:
        /* La conséquence, pas une paraphrase du titre : la galerie part avec
           l'article, et c'est ce qu'on ne devine pas au moment de cliquer. */
        (post.gallery?.length
          ? `Les ${post.gallery.length} photos de sa galerie seront supprimées avec lui. `
          : "") +
        "L'article disparaîtra du site et de l'application mobile. La suppression ne s'annule pas.",
      confirmLabel: "Supprimer l'article",
      onConfirm: async () => {
        const { error } = await deleteNewsPost(post.slug);
        if (error) {
          toast.error(error);
          return;
        }
        toast.success("Article supprimé.");
        router.refresh();
      },
    });

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

          {/* Un lien, plus un bouton : la rédaction a maintenant sa propre
              adresse. On peut l'ouvrir dans un onglet, la mettre en favori, et
              le bouton « précédent » ramène à la liste. */}
          {isAdmin && (
            <Link href="/dashboard/news/new" className="ax-btn ax-btn--primary md:ms-auto">
              <Plus className="ax-btn__icon" size={16} aria-hidden="true" />
              <span className="ax-btn__label">Publier une actualité</span>
            </Link>
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
                {preview(featured)}
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
                  <Link href="/dashboard/news/new" className="ax-btn ax-btn--primary">
                    <Plus className="ax-btn__icon" size={16} aria-hidden="true" />
                    <span className="ax-btn__label">Publier une actualité</span>
                  </Link>
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
                          href: `/dashboard/news/${post.slug}/edit`,
                        },
                        {
                          label: "Supprimer",
                          icon: Trash2,
                          danger: true,
                          separatorBefore: true,
                          onSelect: () => confirmDelete(post),
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
                  {preview(post)}
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

      {dialog}
    </div>
  );
}
