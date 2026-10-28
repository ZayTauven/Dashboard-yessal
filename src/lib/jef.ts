/**
 * Les bornes d'un Jëf, partagées par tous les champs de montant du web.
 *
 * ⚠ Le plancher est volontairement BAS. Sur une plateforme confrérique,
 * refuser une offrande parce qu'elle est modeste serait mal reçu : 100 FCFA
 * est accepté partout. Les trois écrans divergeaient — 5 FCFA (Ndiguels),
 * 500 (Faire un Jëf), 1 000 par pas de 500 (Collecte physique) — et le mobile
 * en disait un quatrième.
 *
 * Même valeur dans `yessal-mobile/app/(app)/donate.tsx` (`MIN_JEF`) et dans
 * `contributions.Donation.MIN_AMOUNT`, qui fait foi : le serveur refuse en
 * dessous.
 *
 * Le plafond ne garde que des fautes de frappe (un zéro de trop).
 */
export const MIN_JEF = 100;
export const MAX_JEF = 2_000_000;
