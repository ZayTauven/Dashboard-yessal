"use client";

/*
 * ═══════════════════════════════════════════════════════════════════════════
 * Rédaction d'un article — formulaire partagé création / édition
 * ═══════════════════════════════════════════════════════════════════════════
 * Auparavant, ces deux formulaires vivaient dans DEUX <Modal> de NewsClient,
 * alimentées par une fonction `formFields(post)` commune. La modale posait
 * trois problèmes, dont un seul était visible :
 *
 *   · LE PROBLÈME VISIBLE. Supprimer une photo de la galerie ouvrait une
 *     confirmation en toast, rendue par le Toaster de l'application — donc
 *     dans le coin bas-gauche de la fenêtre, HORS de la modale centrée qui
 *     tenait l'attention. Le geste et sa conséquence n'étaient pas au même
 *     endroit. C'est le symptôme d'où part cette reprise ; il est traité par
 *     <ConfirmDialog>, pas par le déplacement en page.
 *
 *   · LA PLACE. Un `ax-modal__dialog--lg` plafonne autour de 800 px et défile
 *     dans sa propre boîte. Y loger une barre d'outils d'éditeur, un corps de
 *     texte confortable, une bannière, une vidéo et une galerie revenait à
 *     empiler onze champs dans une fenêtre de hublot.
 *
 *   · LA PERTE. Une modale se ferme sur Échap ou sur un clic à côté. Sur un
 *     formulaire de deux minutes, c'est un confort ; sur un article qu'on
 *     rédige, c'est la perte du travail, sans confirmation ni retour.
 *
 * ── Ce que la page dédiée coûte en retour ─────────────────────────────────
 * La modale gardait au moins la liste derrière elle : on fermait, on était
 * revenu. Une page, elle, s'abandonne pour de bon. D'où le garde-fou de sortie
 * plus bas — c'est la contrepartie du déplacement, pas un supplément.
 */

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ImagePlus, Loader2, Save, Send, X } from "lucide-react";
import { toast } from "sonner";
import {
  addGalleryImage,
  addNewsPost,
  deleteGalleryImage,
  getNewsPost,
  updateNewsPost,
} from "@/app/actions/news";
import { FileDrop, MAX_FILE_SIZE_MB, checkFileSize } from "@/components/vireo/FileDrop";
import { Gallery } from "@/components/vireo/Gallery";
import { RichTextEditor, isRichTextEmpty } from "@/components/vireo/RichTextEditor";
import { useConfirm } from "@/components/vireo/ConfirmDialog";
import type { NewsGalleryImage, NewsPost } from "./types";


export function NewsForm({ post }: { post?: NewsPost | null }) {
  const router = useRouter();
  const editing = Boolean(post);
  const [isPending, startTransition] = useTransition();

  /* La galerie d'un article existant s'édite en direct : chaque image part au
     serveur à la seconde où on la dépose, alors que le reste du formulaire
     attend la soumission. On tient donc sa liste à part. */
  const [gallery, setGallery] = useState<NewsGalleryImage[]>(post?.gallery ?? []);
  /* Un booléen ne sait pas dire « 2 sur 5 ». Sur un dépôt de huit photos prises
     au téléphone, l'attente se compte en dizaines de secondes : sans compteur,
     l'auteur croit que rien ne se passe et reclique. */
  const [upload, setUpload] = useState<{ done: number; total: number } | null>(null);

  const [content, setContent] = useState(post?.content ?? "");
  const [contentError, setContentError] = useState(false);
  const [dirty, setDirty] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const { ask, dialog } = useConfirm();

  /*
   * Garde-fou de sortie. La modale protégeait le brouillon par accident : on
   * la fermait et la liste était encore derrière. Une page, non.
   *
   * Sa portée est celle de `beforeunload` : fermeture d'onglet, rechargement,
   * retour navigateur. Une navigation interne à Next ne le déclenche pas —
   * l'intercepter demanderait de patcher <Link> à l'échelle du produit. C'est
   * donc un filet, pas un verrou, et il couvre les pertes les plus brutales.
   */
  useEffect(() => {
    if (!dirty || isPending) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty, isPending]);

  const submit = (formData: FormData) => {
    /*
     * L'éditeur n'est pas un `<input>` : `required` ne s'y applique pas et le
     * navigateur ne le validera jamais. Le contrôle est donc explicite, et il
     * vise `<p><br></p>` autant que la chaîne vide — un éditeur qu'on a ouvert
     * puis vidé n'est pas vide au sens du HTML.
     */
    if (isRichTextEmpty(content)) {
      setContentError(true);
      toast.error("L'article n'a pas encore de contenu.");
      document.getElementById("news-content")?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
      return;
    }
    setContentError(false);

    startTransition(async () => {
      const res = editing
        ? /* Le SLUG, pas l'identifiant : `NewsPostViewSet` déclare
             `lookup_field = 'slug'`. */
          await updateNewsPost(post!.slug, formData)
        : await addNewsPost(formData);

      if (res.error) {
        toast.error(res.error);
        return;
      }

      /* Posé avant la navigation : sinon le garde-fou se déclenche sur notre
         propre redirection. */
      setDirty(false);
      toast.success(editing ? "Article mis à jour." : "Article publié.");

      const slug = editing ? post!.slug : res.data?.slug;
      /* On emmène l'auteur SUR l'article plutôt que sur la liste : c'est le
         résultat de son travail, et la seule façon de vérifier la mise en page
         qu'il vient de composer. */
      router.push(slug ? `/dashboard/news/${slug}` : "/dashboard/news");
      router.refresh();
    });
  };

  const addImages = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const chosen = Array.from(e.target.files ?? []);
    if (chosen.length === 0 || !post) return;

    /* Ces dépôts partent au serveur immédiatement : on les refuse AVANT
       l'envoi plutôt que de laisser Django répondre par une erreur de
       validation. Les fichiers trop lourds sont écartés, les autres passent —
       un seul refus ne doit pas annuler la sélection entière. */
    const tooBig = chosen.map(checkFileSize);
    const files = chosen.filter((_, i) => !tooBig[i]);
    tooBig.filter(Boolean).forEach((msg) => toast.error(msg as string));

    if (files.length === 0) {
      e.target.value = "";
      return;
    }

    setUpload({ done: 0, total: files.length });
    let ok = 0;
    const failed: string[] = [];

    try {
      /*
       * En série, et non en `Promise.all`. L'API n'accepte qu'une image par
       * appel (`POST /posts/<slug>/gallery/`), et huit envois simultanés
       * depuis une connexion de Dakar se gênent plus qu'ils ne s'aident — sans
       * compter que le serveur redimensionne chaque image à la réception.
       * La progression, elle, n'a de sens que séquentielle.
       */
      for (const file of files) {
        const formData = new FormData();
        formData.append("image", file);
        const { error } = await addGalleryImage(post.slug, formData);
        if (error) failed.push(file.name);
        else ok += 1;
        setUpload((u) => (u ? { ...u, done: u.done + 1 } : u));
      }

      if (ok > 0) {
        toast.success(
          ok === 1 ? "Photo ajoutée à la galerie." : `${ok} photos ajoutées à la galerie.`,
        );
      }
      /* Nommer les fichiers en échec : « 2 échecs » n'aide pas à savoir
         lesquels redéposer. */
      if (failed.length > 0) {
        toast.error(
          failed.length === 1
            ? `« ${failed[0]} » n'a pas pu être envoyée.`
            : `${failed.length} photos n'ont pas pu être envoyées : ${failed.join(", ")}.`,
        );
      }

      /* Une seule relecture pour tout le lot : c'est elle qui donne les
         identifiants créés par le serveur, sans lesquels on ne saurait pas
         supprimer les images. */
      if (ok > 0) {
        const { data: updated } = await getNewsPost(post.slug);
        if (updated?.gallery) setGallery(updated.gallery as NewsGalleryImage[]);
        router.refresh();
      }
    } finally {
      /* `finally` : même si la relecture échoue, la zone doit sortir de son
         état de chargement. */
      setUpload(null);
      e.target.value = "";
    }
  };

  const removeImage = (imageId: number) =>
    ask({
      title: "Retirer cette photo ?",
      description:
        "Elle disparaîtra de la galerie de l'article, sur le site comme dans l'application mobile. Le retrait est immédiat et ne s'annule pas.",
      confirmLabel: "Retirer la photo",
      onConfirm: async () => {
        const { error } = await deleteGalleryImage(imageId);
        if (error) {
          toast.error(error);
          return;
        }
        setGallery((prev) => prev.filter((i) => i.id !== imageId));
        toast.success("Photo retirée.");
        router.refresh();
      },
    });

  return (
    <>
      <form
        ref={formRef}
        action={submit}
        onChange={() => setDirty(true)}
        className="flex flex-col gap-4"
      >
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {/* ── Colonne de rédaction ────────────────────────────────────── */}
          <div className="flex flex-col gap-4 lg:col-span-2">
            <section className="ax-card">
              <div className="ax-card__body flex flex-col gap-5">
                <div className="ax-field">
                  <label className="ax-field__label" htmlFor="news-title">
                    Titre
                    <span className="ax-field__required" aria-hidden="true">
                      {" "}
                      *
                    </span>
                  </label>
                  <input
                    id="news-title"
                    name="title"
                    className="ax-input"
                    defaultValue={post?.title ?? ""}
                    placeholder="Magal de Touba 2026 : le récit de la délégation"
                    required
                    autoFocus={!editing}
                  />
                </div>

                <div className="ax-field">
                  <label className="ax-field__label" htmlFor="news-excerpt">
                    Résumé court
                  </label>
                  <input
                    id="news-excerpt"
                    name="excerpt"
                    className="ax-input"
                    defaultValue={post?.excerpt ?? ""}
                    placeholder="La phrase qui donnera envie de lire l'article."
                    aria-describedby="news-excerpt-hint"
                  />
                  {/* Le résumé n'est pas décoratif : c'est lui qui s'affiche
                      sur les cartes du web et dans le fil de l'application. */}
                  <p className="ax-field__hint" id="news-excerpt-hint">
                    Affiché sur les cartes et dans l&apos;application mobile. Sans
                    résumé, c&apos;est le début de l&apos;article qui est repris.
                  </p>
                </div>
              </div>
            </section>

            <section className="ax-card">
              <div className="ax-card__header">
                <div className="ax-card__titles">
                  <h2 className="ax-card__title">Contenu</h2>
                  <p className="ax-card__subtitle">
                    Intertitres, listes et citations structurent un récit long.
                  </p>
                </div>
              </div>
              <div className="ax-card__body">
                <div className="ax-field">
                  {/* `htmlFor` vise l'éditeur : un `contenteditable` porteur
                      d'un id et de `role="textbox"` s'associe à un label comme
                      un champ ordinaire. */}
                  <label className="ax-field__label" htmlFor="news-content">
                    Corps de l&apos;article
                    <span className="ax-field__required" aria-hidden="true">
                      {" "}
                      *
                    </span>
                  </label>
                  <RichTextEditor
                    id="news-content"
                    name="content"
                    defaultValue={post?.content}
                    aria-describedby={contentError ? "news-content-error" : undefined}
                    onChange={(html) => {
                      setContent(html);
                      setDirty(true);
                      if (contentError && !isRichTextEmpty(html)) setContentError(false);
                    }}
                  />
                  {contentError && (
                    <p
                      className="ax-field__message ax-field__message--error"
                      id="news-content-error"
                      role="alert"
                    >
                      Un article a besoin d&apos;un contenu avant d&apos;être
                      enregistré.
                    </p>
                  )}
                </div>
              </div>
            </section>
          </div>

          {/* ── Rail latéral ───────────────────────────────────────────────
              Bannière, vidéo et état de publication sont des réglages, pas de
              la rédaction. Les sortir de la colonne de texte rend visible ce
              qui reste à écrire. */}
          <aside className="flex flex-col gap-4">
            <section className="ax-card">
              <div className="ax-card__header">
                <div className="ax-card__titles">
                  <h2 className="ax-card__title">Publication</h2>
                </div>
              </div>
              <div className="ax-card__body flex flex-col gap-4">
                {/*
                  Deux boutons radio et non une case à cocher. Une case
                  décochée n'apparaît PAS dans le `FormData` : sur un PATCH,
                  `is_published` était alors simplement absent de la requête et
                  Django gardait l'ancienne valeur. Dépublier un article était
                  donc impossible — le bouton semblait ne rien faire. Un groupe
                  de radios envoie toujours exactement une valeur.
                */}
                <fieldset className="ax-field">
                  <legend className="ax-field__label">État</legend>
                  <label className="ax-check">
                    <input
                      type="radio"
                      name="is_published"
                      value="true"
                      className="ax-radio"
                      defaultChecked={post ? post.is_published : true}
                    />
                    <span>
                      Publié
                      <span className="ax-text-subtle block text-xs">
                        Visible par tous les membres, web et mobile.
                      </span>
                    </span>
                  </label>
                  <label className="ax-check">
                    <input
                      type="radio"
                      name="is_published"
                      value="false"
                      className="ax-radio"
                      defaultChecked={post ? !post.is_published : false}
                    />
                    <span>
                      Brouillon
                      <span className="ax-text-subtle block text-xs">
                        Visible des seuls administrateurs.
                      </span>
                    </span>
                  </label>
                </fieldset>
              </div>
            </section>

            <section className="ax-card">
              <div className="ax-card__header">
                <div className="ax-card__titles">
                  <h2 className="ax-card__title">Bannière</h2>
                  <p className="ax-card__subtitle">
                    L&apos;image en tête d&apos;article et sur les cartes.
                  </p>
                </div>
              </div>
              <div className="ax-card__body">
                <FileDrop
                  name="cover_image"
                  accept="image/*"
                  hint="JPG ou PNG"
                  currentPreview={post?.cover_image}
                />
              </div>
            </section>

            <section className="ax-card">
              <div className="ax-card__header">
                <div className="ax-card__titles">
                  <h2 className="ax-card__title">Vidéo</h2>
                </div>
              </div>
              <div className="ax-card__body">
                <div className="ax-field">
                  <label className="ax-field__label" htmlFor="news-youtube">
                    Lien YouTube
                  </label>
                  <input
                    id="news-youtube"
                    name="youtube_url"
                    type="url"
                    className="ax-input"
                    defaultValue={post?.youtube_url ?? ""}
                    placeholder="https://youtu.be/…"
                    aria-describedby="news-youtube-hint"
                  />
                  <p className="ax-field__hint" id="news-youtube-hint">
                    Les formats <code>watch</code>, <code>youtu.be</code>,{" "}
                    <code>embed</code> et <code>shorts</code> sont reconnus.
                  </p>
                </div>
              </div>
            </section>
          </aside>
        </div>

        {/* ── Galerie ─────────────────────────────────────────────────────
            Les deux régimes ne peuvent pas être confondus : à la création
            l'article n'a pas encore de slug, donc pas d'URL où déposer une
            image. Les photos voyagent alors AVEC le formulaire, et
            `perform_create` les rattache. En édition, l'article existe : elles
            partent une par une, et se retirent une par une. */}
        {editing ? (
          <section className="ax-card">
            <div className="ax-card__header">
              <div className="ax-card__titles">
                <h2 className="ax-card__title">Galerie</h2>
                <p className="ax-card__subtitle">
                  Les ajouts et les retraits sont immédiats — ils ne dépendent
                  pas du bouton d&apos;enregistrement.
                </p>
              </div>
              {gallery.length > 0 && (
                <span className="ax-badge ax-badge--neutral ax-badge--sm">
                  {gallery.length}
                </span>
              )}
            </div>
            <div className="ax-card__body flex flex-col gap-4">
              <div className="ax-dropzone">
                <label className="ax-dropzone__area">
                  {upload ? (
                    <Loader2 className="animate-spin" aria-hidden="true" />
                  ) : (
                    <ImagePlus aria-hidden="true" />
                  )}
                  <span className="text-sm font-medium">
                    {upload
                      ? `Envoi ${upload.done + 1} sur ${upload.total}…`
                      : "Ajouter des photos à la galerie"}
                  </span>
                  <span className="ax-text-subtle text-xs">
                    Plusieurs photos à la fois · {MAX_FILE_SIZE_MB} Mo maximum par photo
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    /* `multiple` manquait : la galerie d'un article existant
                       s'alimentait une photo à la fois, alors que la création
                       en acceptait déjà plusieurs. Rien ne justifiait l'écart —
                       et c'est en édition qu'on ajoute des photos, après
                       l'événement. */
                    multiple
                    className="ax-visually-hidden"
                    disabled={Boolean(upload)}
                    onChange={addImages}
                  />
                </label>
              </div>

              {gallery.length > 0 && (
                /* Même visionneuse que côté lecture : une vignette de 80 px ne
                   permet pas de décider quelle photo retirer. */
                <Gallery
                  images={gallery}
                  columns={4}
                  overlay={(img) => (
                    <button
                      type="button"
                      /* `end-1`, et non `inset-e-1` : cette dernière n'existe
                         ni dans Vireo ni dans Tailwind. Reprise telle quelle de
                         l'ancienne modale, elle ne produisait aucune règle — le
                         bouton retombait en haut À GAUCHE de la vignette, sur
                         l'image, au lieu du coin opposé. */
                      className="ax-btn ax-btn--icon ax-btn--soft-danger absolute end-1 top-1"
                      aria-label="Retirer cette photo"
                      onClick={() => removeImage(img.id as number)}
                    >
                      <X size={12} aria-hidden="true" />
                    </button>
                  )}
                />
              )}
            </div>
          </section>
        ) : (
          <section className="ax-card">
            <div className="ax-card__header">
              <div className="ax-card__titles">
                <h2 className="ax-card__title">Galerie</h2>
                <p className="ax-card__subtitle">
                  Elles s&apos;afficheront sous l&apos;article.
                </p>
              </div>
            </div>
            <div className="ax-card__body">
              <FileDrop
                name="gallery_images"
                accept="image/*"
                multiple
                hint="JPG ou PNG"
              />
            </div>
          </section>
        )}

        {/* ── Barre d'action ──────────────────────────────────────────────
            Collée en bas : sur un formulaire qui fait deux écrans, un bouton
            posé après la galerie oblige à faire défiler tout l'article pour
            enregistrer une correction de titre. */}
        <div className="ax-form-bar">
          <Link
            href={editing ? `/dashboard/news/${post!.slug}` : "/dashboard/news"}
            className="ax-btn ax-btn--ghost"
          >
            <span className="ax-btn__label">Annuler</span>
          </Link>
          <button
            type="submit"
            className="ax-btn ax-btn--primary"
            disabled={isPending}
            aria-busy={isPending}
          >
            {editing ? (
              <Save className="ax-btn__icon" size={16} aria-hidden="true" />
            ) : (
              <Send className="ax-btn__icon" size={16} aria-hidden="true" />
            )}
            <span className="ax-btn__label">
              {isPending
                ? "Enregistrement…"
                : editing
                  ? "Enregistrer les modifications"
                  : "Créer l'article"}
            </span>
          </button>
        </div>
      </form>

      {dialog}
    </>
  );
}

export default NewsForm;
