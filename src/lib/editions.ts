/**
 * Les fenêtres de collecte des prochaines éditions d'une série, pour l'aperçu
 * du formulaire. Même règle que le serveur (`events/occurrences.py`) :
 * ouverture = jour J − « ouvre », clôture = J + « ferme », bornes incluses.
 *
 * ⚠ Tout se calcule sur des chaînes `AAAA-MM-JJ` lues en UTC, et « aujourd'hui »
 * est le jour de DAKAR. Un `new Date("2026-10-30")` local décale d'un jour
 * dans les Amériques : l'aperçu montrerait à la diaspora une semaine fausse.
 */

const JOUR_MS = 86_400_000;

/** Durée de la période la plus courte, en jours — la borne du serveur. */
export const PERIODE_JOURS: Record<string, number> = {
  weekly: 7,
  quarterly: 89,
  annual: 365,
  annual_hijri: 354,
};

function versUtc(iso: string): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  return m ? Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : null;
}

/** Le jour de Dakar, `AAAA-MM-JJ`. */
export function aujourdhuiDakar(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Dakar" }).format(new Date());
}

/** Même jour, `mois` plus tard ; un 31 devient le dernier jour du mois court. */
function plusMois(t: number, mois: number): number {
  const d = new Date(t);
  const total = d.getUTCMonth() + mois;
  const annee = d.getUTCFullYear() + Math.floor(total / 12);
  const m = ((total % 12) + 12) % 12;
  const dernier = new Date(Date.UTC(annee, m + 1, 0)).getUTCDate();
  return Date.UTC(annee, m, Math.min(d.getUTCDate(), dernier));
}

/** Les `n` occurrences tombant le `depuis` ou après (récurrences grégoriennes). */
function occurrences(ref: number, recurrence: string, depuis: number, n: number): number[] {
  const pasMois = recurrence === "quarterly" ? 3 : recurrence === "annual" ? 12 : null;
  const res: number[] = [];
  if (recurrence === "weekly") {
    let t = ref >= depuis ? ref : ref + Math.ceil((depuis - ref) / (7 * JOUR_MS)) * 7 * JOUR_MS;
    while (res.length < n) {
      res.push(t);
      t += 7 * JOUR_MS;
    }
    return res;
  }
  if (!pasMois) return res;
  // Compter depuis la référence, comme le serveur : un 31 ne glisse pas au 30.
  for (let k = 0; res.length < n && k < 400; k++) {
    const t = plusMois(ref, pasMois * k);
    if (t >= depuis) res.push(t);
  }
  return res;
}

export interface FenetreCollecte {
  ouverture: string;
  cloture: string;
}

const libelle = new Intl.DateTimeFormat("fr-FR", {
  weekday: "short",
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});

/** Les trois prochaines collectes, ou `[]` si la règle ne permet pas de les calculer. */
export function prochainesCollectes(
  dateReference: string,
  recurrence: string,
  ouvre: number,
  ferme: number,
  n = 3,
): FenetreCollecte[] {
  const ref = versUtc(dateReference);
  const jour = versUtc(aujourdhuiDakar());
  if (ref === null || jour === null) return [];
  // L'édition dont la collecte court encore compte (`occurrence_en_cours`).
  const depuis = jour - ferme * JOUR_MS;
  return occurrences(ref, recurrence, depuis, n).map((t) => ({
    ouverture: libelle.format(new Date(t - ouvre * JOUR_MS)),
    cloture: libelle.format(new Date(t + ferme * JOUR_MS)),
  }));
}
