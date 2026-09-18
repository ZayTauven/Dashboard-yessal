/*
 * ═══════════════════════════════════════════════════════════════════════════
 * Le classement des contributeurs
 * ═══════════════════════════════════════════════════════════════════════════
 * Deux écrans le construisent : l'état d'un Ndiguel et le détail d'une fête.
 * Le calcul vivait dans le premier, la seconde s'en passait — et affichait donc
 * autre chose. Il est ici pour qu'un seul classement existe.
 *
 * ── On cumule PAR PERSONNE ────────────────────────────────────────────────
 * Trier les contributions individuelles n'est pas un classement des donateurs :
 * quelqu'un qui a versé trois fois occupe trois places du podium, et un
 * contributeur régulier de 3 × 40 000 FCFA passe derrière un versement unique
 * de 50 000. C'est ce que faisait la page des fêtes.
 *
 * ── Les dons anonymes ne se cumulent pas ──────────────────────────────────
 * Chacun reste une entrée séparée. Les regrouper reviendrait à publier combien
 * une même personne anonyme a donné au total, ce que l'anonymat interdit
 * précisément de laisser deviner.
 *
 * ── Les homonymes ─────────────────────────────────────────────────────────
 * La base en contient : deux « Souleymane Sy », deux « Babacar Cissé », avec
 * des identifiants différents. Le classement les distingue correctement — mais
 * à l'écran, deux lignes portant le même nom donnent l'impression d'un doublon.
 * J'y ai moi-même cru en relisant la page. On leur adjoint donc leur Daara, et
 * seulement à eux : ajouter le Daara partout alourdirait toutes les lignes pour
 * résoudre un cas rare.
 */

export interface RankableContribution {
  member_id?: number | null;
  member_name?: string | null;
  daara_name?: string | null;
  amount: number | string;
  is_anonymous?: boolean;
}

export interface RankedDonor {
  key: string;
  name: string;
  /** Daara, renseigné UNIQUEMENT si un homonyme rend le nom ambigu. */
  hint: string | null;
  amount: number;
  count: number;
  anonymous: boolean;
}

/** Un don anonyme ne porte ni nom ni initiales. */
export function donorName(c: RankableContribution): string {
  return c.is_anonymous ? "Contributeur anonyme" : c.member_name || "—";
}

/**
 * Rend les `limit` premiers donateurs, cumulés et triés par montant décroissant.
 */
export function rankDonors(
  contributions: RankableContribution[],
  limit = 5,
): RankedDonor[] {
  const byDonor = new Map<string, RankedDonor & { daara: string | null }>();

  contributions.forEach((c, i) => {
    const anonymous = Boolean(c.is_anonymous);
    /* L'index rend la clé unique pour chaque don anonyme ; sinon on cumule sur
       l'IDENTIFIANT, jamais sur le nom — deux homonymes sont deux personnes. */
    const key = anonymous ? `anon-${i}` : `member-${c.member_id ?? c.member_name}`;
    const entry = byDonor.get(key);

    if (entry) {
      entry.amount += Number(c.amount) || 0;
      entry.count += 1;
    } else {
      byDonor.set(key, {
        key,
        name: donorName(c),
        hint: null,
        daara: c.daara_name ?? null,
        amount: Number(c.amount) || 0,
        count: 1,
        anonymous,
      });
    }
  });

  const top = [...byDonor.values()]
    .sort((a, b) => b.amount - a.amount)
    .slice(0, limit);

  /* La levée d'ambiguïté se fait sur le CLASSEMENT AFFICHÉ, pas sur la base :
     deux homonymes dont un seul figure au podium n'ont aucune ambiguïté à
     lever pour le lecteur. */
  const occurrences = new Map<string, number>();
  top.forEach((d) => occurrences.set(d.name, (occurrences.get(d.name) ?? 0) + 1));

  return top.map(({ daara, ...d }) => ({
    ...d,
    hint: !d.anonymous && (occurrences.get(d.name) ?? 0) > 1 ? daara : null,
  }));
}
