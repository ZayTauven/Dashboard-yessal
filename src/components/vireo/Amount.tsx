/*
 * ═══════════════════════════════════════════════════════════════════════════
 * Montant
 * ═══════════════════════════════════════════════════════════════════════════
 * ⚠️ PAS de `"use client"` ici, et c'est délibéré : <StatCard> et les pages de
 * lecture pure sont des composants SERVEUR. Ce module ne contient que du calcul
 * et du balisage, rien qui exige le navigateur.
 *
 * Un seul endroit décide comment une somme s'écrit dans Yessal Gui. Deux
 * raisons de le centraliser :
 *
 *   · L'ORDRE DE GRANDEUR VA CHANGER. La collecte se compte aujourd'hui en
 *     millions ; le projet vise les centaines de millions, puis le milliard.
 *     Un composant qui tient bon à 20 000 FCFA et casse à 1 113 000 000 n'est
 *     pas un composant fini. La bascule vers l'écriture abrégée est ici, et
 *     nulle part ailleurs.
 *
 *   · LA PLACE NE CHANGE PAS. Une tuile de KPI fait la même largeur quel que
 *     soit le chiffre qu'on y met. `--ax-num-kpi` vaut 32 px, taille juste pour
 *     « 26 » ou « 3 » — les compteurs pour lesquels Vireo l'a choisie — mais
 *     beaucoup trop pour « 1,11 Md FCFA ». La taille suit donc la longueur
 *     réelle du texte, par paliers.
 *
 * Le montant exact reste toujours accessible au survol : c'est de l'argent,
 * quelqu'un voudra le lire au franc près.
 */

import { cn } from "@/lib/utils";
import { formatFCFAParts, formatNumber } from "@/lib/format";

/*
 * Paliers de taille. Mesurés sur la largeur utile d'une tuile de KPI, à trois
 * ou quatre colonnes — le cas le plus contraint de l'application.
 *
 * Un MONTANT ne prend jamais la pleine taille, même court. Deux raisons :
 * il traîne toujours « FCFA » derrière lui, et surtout il change d'ordre de
 * grandeur en cours de vie. Sans cette règle, « 245 M FCFA » (dix caractères)
 * s'afficherait en 32 px à côté d'un « 1,11 Md FCFA » en 26 px : deux tuiles
 * voisines, deux corps différents, pour la même nature de chiffre.
 *
 * Un COMPTEUR — « 26 », « 43 » — garde la taille pour laquelle Vireo a
 * dessiné la tuile.
 *
 * Ce sont des classes utilitaires : depuis que la typographie Vireo est passée
 * dans `@layer base`, elles l'emportent sans `!important`.
 */
function sizeFor(text: string, { money = false } = {}): string {
  if (!money && text.length <= 10) return "text-[length:var(--ax-num-kpi)]";
  if (text.length <= 14) return "text-[26px] leading-[32px]";
  return "text-[21px] leading-[28px]";
}

export interface AmountProps {
  /** Le montant, en francs CFA. */
  value: number;
  /**
   * Force l'écriture complète, quelle que soit la grandeur. À réserver aux
   * endroits où la place ne manque pas et où le franc près compte : lignes de
   * tableau, total en pied de liste, reçu.
   */
  exact?: boolean;
  /** Ajuste la taille à la longueur du texte. Vrai dans les tuiles de KPI. */
  responsive?: boolean;
  className?: string;
}

export function Amount({
  value,
  exact = false,
  responsive = false,
  className,
}: AmountProps) {
  const parts = formatFCFAParts(value);
  const text = exact ? parts.exact : parts.display;

  return (
    <span
      /* Le montant complet au survol, mais seulement quand l'affichage est
         abrégé : ailleurs, l'infobulle répéterait ce qui est déjà lisible. */
      title={parts.compacted && !exact ? parts.exact : undefined}
      className={cn(
        "tabular-nums",
        responsive && sizeFor(text, { money: true }),
        className,
      )}
    >
      {text}
    </span>
  );
}

/*
 * ── Valeurs de KPI venues du backend ──
 *
 * Les tableaux de bord de rôle reçoivent leurs KPI DÉJÀ FORMATÉS, en chaînes,
 * depuis `getDashboardStats`. Deux ennuis avec ça :
 *
 *   · le formatage y est anglo-saxon — « 1,113,000 FCFA », « 20,000 FCFA » —
 *     alors que tout le reste de l'application écrit « 1 113 000 FCFA » ;
 *   · une chaîne ne peut pas s'abréger : rien ne sait qu'il y a un nombre
 *     dedans, donc rien ne peut décider d'écrire « 1,11 Md ».
 *
 * On récupère donc le nombre quand la chaîne est manifestement un montant, et
 * on le repasse par <Amount>. Le reste — « 26 », « 3 sur 5 confiés », une date
 * — traverse intact, avec la seule taille adaptée à sa longueur.
 *
 * Le jour où l'API renverra des nombres bruts, ce filet deviendra inutile et
 * `value` sera simplement un `number`.
 */
/* `\s` couvre en JavaScript les espaces insécables — U+00A0 et U+202F —
   que produit `Intl` en locale fr-SN comme séparateur de milliers. */
const MONEY = /^[\s\d.,]+FCFA$/;

export function KpiValue({
  value,
  className,
}: {
  value: string | number;
  className?: string;
}) {
  /*
   * Un nombre nu n'est PAS un montant. Le compter comme tel affichait
   * « 3 FCFA » là où il fallait lire « 3 Jëfs ». Seul <Amount>, appelé
   * explicitement, ajoute la devise ; ici on se contente des séparateurs de
   * milliers français.
   */
  if (typeof value === "number") {
    const text = formatNumber(value);
    return (
      <span className={cn("tabular-nums", sizeFor(text), className)}>{text}</span>
    );
  }

  const raw = value.trim();

  /* `MONEY` refuse tout ce qui porte une lettre avant « FCFA » : un « 1,2 M
     FCFA » déjà abrégé ne doit surtout pas être relu comme 12. */
  if (MONEY.test(raw)) {
    const digits = raw.replace(/FCFA/, "").replace(/[^\d]/g, "");
    const n = Number(digits);
    if (digits && Number.isFinite(n)) {
      return <Amount value={n} responsive className={className} />;
    }
  }

  return (
    <span className={cn("tabular-nums", sizeFor(raw), className)}>{raw}</span>
  );
}
