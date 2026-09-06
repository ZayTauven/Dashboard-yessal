/*
 * ═══════════════════════════════════════════════════════════════════════════
 * La règle du profil complet — une seule fois
 * ═══════════════════════════════════════════════════════════════════════════
 * Elle était écrite DEUX FOIS, et les deux versions ne disaient pas la même
 * chose :
 *
 *   · `ProfileCompletionBanner.tsx` jugeait sur QUATRE critères — date de
 *     naissance, genre, pays de résidence, pièce d'identité ;
 *   · `ProfileClient.tsx` affichait, sur la même donnée, une liste de contrôle
 *     de SEPT — les quatre précédents plus l'identité, la photographie et
 *     l'adresse.
 *
 * Un membre sans photographie ni adresse lisait donc « profil complet » dans
 * le bandeau et « 5 sur 7 » sur sa fiche, dans la même session. Le bandeau,
 * qui est le rappel persistant, se taisait précisément pour les deux champs
 * qu'on lui demandait de réclamer.
 *
 * Les SEPT font foi : c'est l'énoncé de la règle tel que le commanditaire la
 * formule, et c'est ce que le mobile applique depuis `lib/profile-completion.ts`
 * (module jumeau, mêmes critères, mêmes libellés). Divergence relevée par
 * l'audit de parité du 2026-09-05 ; corrigée ici, côté web, comme il l'avait
 * conclu.
 *
 * ⚠ Les libellés sont contractuels entre les deux plateformes. Les changer ici
 * sans changer là-bas, c'est rouvrir la même faille par un autre bout.
 */

export interface CompletionItem {
  /** Clé stable — sert de `key` de liste et de repère de test. */
  id: string;
  label: string;
  done: boolean;
}

export interface CompletionProfile {
  first_name?: string | null;
  last_name?: string | null;
  birth_date?: string | null;
  gender?: string | null;
  avatar?: string | null;
  avatar_url?: string | null;
  residence_country?: string | null;
  address?: string | null;
  city?: string | null;
  documents?: unknown[] | null;
}

function filled(value: unknown): boolean {
  return typeof value === "string" ? value.trim().length > 0 : Boolean(value);
}

/**
 * Les sept critères, dans l'ordre où la fiche les présente.
 *
 * `documentCount` est passé à part parce que les pièces ne viennent pas du
 * même appel que le profil (`GET /users/{id}/documents/`) ; le tableau de bord
 * les joint dans son layout, le mobile les charge séparément.
 */
export function profileCompletionItems(
  profile: CompletionProfile | null | undefined,
  documentCount: number,
): CompletionItem[] {
  return [
    {
      id: "identity",
      label: "Prénom et nom",
      done: filled(profile?.first_name) && filled(profile?.last_name),
    },
    {
      id: "birth_date",
      label: "Date de naissance",
      done: filled(profile?.birth_date),
    },
    { id: "gender", label: "Genre", done: filled(profile?.gender) },
    {
      id: "avatar",
      label: "Photo de profil",
      /* Deux champs pour une seule chose : `avatar` est le fichier téléversé,
         `avatar_url` une adresse extérieure. L'un ou l'autre suffit. */
      done: filled(profile?.avatar) || filled(profile?.avatar_url),
    },
    {
      id: "residence_country",
      label: "Pays de résidence",
      done: filled(profile?.residence_country),
    },
    {
      id: "address",
      label: "Adresse complète",
      done: filled(profile?.address) && filled(profile?.city),
    },
    {
      id: "document",
      label: "Pièce d'identité",
      done: documentCount > 0,
    },
  ];
}

/** Ce qui reste à renseigner. Vide ⇒ le profil est complet. */
export function profileMissing(
  profile: CompletionProfile | null | undefined,
  documentCount: number,
): CompletionItem[] {
  return profileCompletionItems(profile, documentCount).filter((i) => !i.done);
}

/**
 * « la date de naissance et la photo de profil ».
 *
 * Nommer ce qui manque plutôt que compter : « 2 informations manquantes » fait
 * ouvrir l'écran pour découvrir lesquelles. Même formulation que le mobile.
 */
export function missingSummary(missing: CompletionItem[]): string {
  const noms = missing.map((item) => item.label.toLowerCase());
  if (noms.length === 0) return "";
  if (noms.length === 1) return noms[0];
  if (noms.length === 2) return `${noms[0]} et ${noms[1]}`;
  const reste = noms.length - 2;
  return `${noms.slice(0, 2).join(", ")} et ${reste} autre${reste > 1 ? "s" : ""}`;
}
