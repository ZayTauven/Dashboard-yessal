/*
 * Forme d'un article telle que la renvoie `NewsPostSerializer`.
 *
 * Le type vivait en double, déclaré à l'identique dans la liste et dans la page
 * de détail. Il est maintenant lu par trois écrans — liste, formulaire,
 * lecture — et un type de frontière d'API recopié trois fois finit par décrire
 * trois API différentes.
 */

export type NewsGalleryImage = {
  id: number;
  image: string;
  caption?: string;
};

export type NewsPost = {
  id: number;
  slug: string;
  title: string;
  excerpt?: string | null;
  /**
   * HTML depuis l'éditeur riche, assaini par `core.richtext.sanitize_html`.
   *
   * Les articles antérieurs à l'éditeur sont du texte brut et le restent : rien
   * ne les migre. Les surfaces de lecture distinguent les deux — voir
   * `isHtmlContent` — et le texte brut garde son rendu `pre-wrap` d'origine.
   */
  content: string;
  cover_image?: string | null;
  youtube_url?: string | null;
  is_published: boolean;
  created_at: string;
  published_at?: string | null;
  created_by_name?: string | null;
  gallery?: NewsGalleryImage[];
};

/**
 * Un article vient-il de l'éditeur riche, ou de l'ancien `<textarea>` ?
 *
 * Pendant de `core.richtext.looks_like_html`, côté client. Les deux doivent
 * répondre pareil : c'est ce test qui décide si le corps est injecté comme du
 * balisage ou affiché en `white-space: pre-wrap`.
 */
export function isHtmlContent(value?: string | null): boolean {
  return Boolean(value) && /<[a-zA-Z/!][^>]*>/.test(value as string);
}
