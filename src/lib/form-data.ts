/*
 * ═══════════════════════════════════════════════════════════════════════════
 * Le champ fichier vide qui fait échouer tout un formulaire
 * ═══════════════════════════════════════════════════════════════════════════
 * Un `<input type="file">` laissé vide n'est pas absent du `FormData` : la
 * spécification HTML veut qu'il y contribue une entrée, un `File` de taille
 * nulle et de nom vide. C'est invisible tant que le formulaire est envoyé
 * directement par le navigateur, parce que Django écarte de lui-même une
 * partie multipart dont le `filename` est vide.
 *
 * Mais nos formulaires passent par une ACTION SERVEUR. Le `FormData` traverse
 * donc la frontière, puis Node le re-sérialise pour son propre `fetch` — et sa
 * mise en forme donne un nom à ce fichier anonyme. Django n'a alors plus de
 * quoi l'écarter : il y voit un téléversement réel, et DRF répond
 *
 *     {"cover_image": ["Le fichier soumis est vide."]}
 *
 * Conséquence pour l'utilisateur : CRÉER UN ARTICLE SANS BANNIÈRE ÉCHOUAIT.
 * Systématiquement, et la bannière est facultative. Le formulaire revenait
 * vide, sans explication — le message d'erreur étant par ailleurs jeté par les
 * actions, voir `messageForErrors`.
 *
 * Le nettoyage est fait ici plutôt que dans chaque action : le piège tient à
 * la façon dont Next transporte un `FormData`, pas aux actualités, et tout
 * formulaire du produit portant un champ fichier facultatif y est exposé.
 */

/**
 * Noms que porte un fichier ANONYME une fois passé par une action serveur.
 *
 * On pourrait croire qu'un champ fichier vide donne un `File` de nom vide.
 * Il n'en est rien : la désérialisation de Next lui donne le nom littéral
 * « undefined ». Tester `!file.name` ne déclenche donc jamais — c'est le
 * piège, et il est invisible tant qu'on ne regarde pas la valeur reçue.
 *
 * « blob » est le nom que donnent d'autres implémentations de `FormData` au
 * même cas ; il est écarté par précaution, pas parce qu'il a été observé ici.
 */
const ANONYMOUS_NAMES = new Set(["", "undefined", "null", "blob"]);

/**
 * Retire les entrées fichier vides d'un `FormData`.
 *
 * L'original n'est pas modifié : un `FormData` reçu d'une action peut être lu
 * ailleurs, et le muter à distance serait une surprise désagréable.
 *
 * Un fichier de taille nulle mais VÉRITABLEMENT NOMMÉ est conservé : c'est un
 * fichier vide que l'utilisateur a réellement choisi, et il vaut mieux que le
 * serveur le refuse en le nommant que de l'escamoter en silence.
 */
export function stripEmptyFiles(formData: FormData): FormData {
  const cleaned = new FormData();

  for (const [key, value] of formData.entries()) {
    if (
      value instanceof File &&
      value.size === 0 &&
      ANONYMOUS_NAMES.has(value.name)
    ) {
      continue;
    }
    cleaned.append(key, value);
  }

  return cleaned;
}
