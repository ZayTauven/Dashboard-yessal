/*
 * ═══════════════════════════════════════════════════════════════════════════
 * Identifier une personne, pas seulement la nommer
 * ═══════════════════════════════════════════════════════════════════════════
 * Un collecteur est DEBOUT DEVANT QUELQU'UN. Il doit décider, en quelques
 * secondes, laquelle des lignes à l'écran est la personne qui lui tend
 * 50 000 FCFA. Se tromper impute le versement au mauvais compte — et un don
 * mal imputé ne se voit pas : il s'affiche normalement, du côté de celui qui
 * n'a rien donné.
 *
 * ── Ce n'est pas un cas rare ──────────────────────────────────────────────
 * Sur les 31 membres de la base, DEUX noms sont portés par deux personnes
 * chacun — soit 4 comptes, 12 %. « Souleymane Sy » et « Babacar Cissé ». Sur
 * un annuaire confrérique, où les prénoms et les noms se répètent par
 * tradition, cette proportion ne baissera pas avec la croissance.
 *
 * ── Pourquoi l'e-mail ne convient pas ─────────────────────────────────────
 * L'écran de collecte affichait l'e-mail. Il est bien unique, mais il ne se
 * VÉRIFIE PAS sur le terrain : le collecteur ne le connaît pas, la personne ne
 * le récite pas, et beaucoup de membres n'en auront jamais d'autre que celui
 * qu'on leur a généré à l'inscription.
 *
 * Un discriminant utile ici est de l'une de ces deux natures :
 *   · le collecteur le sait déjà — c'est le DAARA, puisqu'il y collecte ;
 *   · la personne peut le confirmer à voix haute — ce sont les derniers
 *     chiffres de son TÉLÉPHONE.
 *
 * Les deux sont renseignés à 100 % en base. Le titre (29 %) et la photo (6 %)
 * ne peuvent pas porter cette responsabilité.
 *
 * ── On ne signale que l'ambiguïté RÉELLE ──────────────────────────────────
 * Le drapeau se calcule sur la liste AFFICHÉE, pas sur la base. Deux homonymes
 * dont un seul apparaît dans les résultats ne posent au lecteur aucune
 * question : l'avertir alors ne ferait que l'habituer à ignorer
 * l'avertissement. Même raisonnement que `rankDonors` dans
 * `lib/donor-ranking.ts`.
 */

export interface IdentifiableMember {
  id: number;
  first_name?: string | null;
  last_name?: string | null;
  daara_name?: string | null;
  phone?: string | null;
}

export function memberFullName(m: IdentifiableMember): string {
  return `${m.first_name ?? ""} ${m.last_name ?? ""}`.trim() || "Membre";
}

/**
 * La forme sur laquelle deux noms se COMPARENT.
 *
 * Casse, accents et espaces multiples ne distinguent personne : « Babacar
 * Cissé » et « babacar cisse » désignent le même risque de confusion. C'est le
 * même principe que la clé d'appariement des Daaras à l'import.
 */
function nameKey(m: IdentifiableMember): string {
  return memberFullName(m)
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
}

/**
 * Les identifiants des membres dont le nom est porté par quelqu'un d'autre
 * DANS CETTE MÊME LISTE.
 */
export function homonymIds(members: IdentifiableMember[]): Set<number> {
  const parNom = new Map<string, number[]>();
  for (const m of members) {
    const cle = nameKey(m);
    parNom.set(cle, [...(parNom.get(cle) ?? []), m.id]);
  }

  const ids = new Set<number>();
  for (const groupe of parNom.values()) {
    if (groupe.length > 1) groupe.forEach((id) => ids.add(id));
  }
  return ids;
}

/**
 * Les quatre derniers chiffres du téléphone, précédés d'une ellipse.
 *
 * Quatre chiffres suffisent à trancher entre deux personnes, et c'est
 * exactement ce qu'on demande de confirmer à voix haute. Afficher le numéro
 * entier n'apporterait rien de plus à la décision, sur un écran qu'un tiers
 * peut lire par-dessus l'épaule pendant une collecte.
 */
export function phoneTail(phone?: string | null): string | null {
  const chiffres = String(phone ?? "").replace(/\D/g, "");
  if (chiffres.length < 4) return null;
  return `…${chiffres.slice(-4)}`;
}

/**
 * La ligne qui identifie une personne sous son nom : « KANDE · …0002 ».
 *
 * Le Daara vient en premier : c'est celui des deux que le collecteur porte
 * déjà en tête.
 */
export function identityLine(m: IdentifiableMember): string {
  return [m.daara_name, phoneTail(m.phone)].filter(Boolean).join(" · ") || "—";
}
