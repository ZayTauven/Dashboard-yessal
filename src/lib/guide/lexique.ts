/*
 * ═══════════════════════════════════════════════════════════════════════════
 * Yessal Guide — le lexique
 * ═══════════════════════════════════════════════════════════════════════════
 * Huit mots, et l'interface cesse d'être opaque.
 *
 * Deux principes de rédaction, tenus partout :
 *
 *   1. La définition dit ce que le mot désigne DANS LA PLATEFORME. Le guide
 *      documente un logiciel, pas une confrérie : l'origine du mot est donnée
 *      brièvement, pour situer, et on s'arrête là. Les lecteurs connaissent
 *      leur tradition mieux que ce fichier.
 *
 *   2. « Jëf » est le DON, « Ndiguel » est la CAMPAGNE. Les premières notes de
 *      cadrage disaient l'inverse (`07_direction_artistique.md` traduit encore
 *      Jëf par « campagne de don »). Le modèle Django tranche : `Donation` a
 *      pour `verbose_name` « Jëf », `Campaign` a « Ndiguel ». L'interface suit
 *      le modèle, ce guide aussi.
 *
 * Ces entrées servent à deux endroits : le chapitre « Les mots de la maison »,
 * et les infobulles des termes cités en ligne dans les autres chapitres.
 */

export interface LexTerm {
  /** Ancre et clé de citation : <Terme mot="jef">Jëf</Terme>. */
  id: string;
  word: string;
  /** Origine du mot, une ligne. */
  origin?: string;
  /** Ce que le mot désigne dans la plateforme. */
  def: string;
  /** Version courte, pour l'infobulle. */
  short: string;
  /** Où on le rencontre dans l'interface. */
  where?: string;
  /** Picto dessiné, dans /guide-assets/pictos/. */
  picto?: string;
}

export const LEXIQUE: LexTerm[] = [
  {
    id: "jef",
    word: "Jëf",
    origin: "Wolof — l'acte, l'œuvre, ce que l'on fait.",
    def: "Un don, une contribution. C'est l'unité de base de la plateforme : un montant, un donateur, un Ndiguel auquel il est rattaché, et un statut qui dit où en est le paiement. Un Jëf peut être versé en ligne, remis en espèces à un collecteur, ou fait au nom d'un proche.",
    short: "Un don. Un montant rattaché à un Ndiguel, avec un donateur et un statut.",
    where: "Rail de gauche → Les Jëfs",
    picto: "jef.png",
  },
  {
    id: "ndiguel",
    word: "Ndiguel",
    origin: "Wolof — la consigne, la recommandation qui engage.",
    def: "Une campagne de collecte. Elle porte un nom, une description, un objectif en francs CFA, une date limite, et souvent une Fête à laquelle elle se rattache. Les Jëfs se rangent dans un Ndiguel ; sans Ndiguel actif, aucun don ne peut être enregistré.",
    short: "Une campagne de collecte : un objectif, une échéance, et les Jëfs qui s'y rattachent.",
    where: "Rail de gauche → Les Ndiguels",
  },
  {
    id: "daara",
    word: "Daara",
    origin: "De l'arabe dār, la maison.",
    def: "Le groupe d'appartenance. Chaque membre est rattaché à un seul Daara, et ce rattachement ne dépend pas de l'endroit où il vit : les membres d'un même Daara peuvent être à Touba, à Dakar, à Milan ou à New York. Un Daara a un chef, parfois des collecteurs, et appartient à une zone territoriale.",
    short: "Le groupe d'appartenance. Un membre n'en a qu'un, où qu'il vive dans le monde.",
    where: "Rail de gauche → Mon Daara",
    picto: "repas.png",
  },
  {
    id: "talibe",
    word: "Talibé",
    origin: "De l'arabe ṭālib, celui qui cherche, le disciple.",
    def: "Le membre de la communauté, tel que la plateforme le nomme. Un talibé possède une fiche — identité, Daara, titre éventuel, pièces justificatives — et l'historique de ses Jëfs. C'est le rôle par défaut de tout compte créé.",
    short: "Le membre. Le rôle par défaut de tout compte.",
    where: "Rail de gauche → Liste des Talibés",
  },
  {
    id: "tutelle",
    word: "Tutelle",
    def: "Une personne au nom de laquelle un membre donne : un enfant, un parent, un proche disparu. Elle est enregistrée avec un prénom, un nom et le lien de parenté. Un Jëf porté au nom d'une tutelle reste versé par le tuteur, mais garde inscrit le nom du bénéficiaire — et, si la tutelle a son propre compte, le don apparaît dans son historique.",
    short: "La personne au nom de qui l'on donne. Le don reste versé par le tuteur.",
    where: "Rail de gauche → Tutelles",
    picto: "solidarite.png",
  },
  {
    id: "zone",
    word: "Zone territoriale",
    origin: "Appelée LDD dans les fichiers de référence de la direction.",
    def: "Un regroupement de Daaras, identifié par un code (DS S3, DS AF…) et un nom. Elle sert à l'organisation et aux statistiques, jamais à restreindre qui peut donner ou écrire à qui. Attention : plusieurs zones peuvent partager le même code — c'est le couple code + nom qui en désigne une.",
    short: "Un regroupement de Daaras, identifié par un code et un nom.",
    where: "Administration → Gestion des Daaras",
  },
  {
    id: "fete",
    word: "Fête",
    def: "Un événement de la communauté : le Magal, le Gamou, le Tog Ajumma hebdomadaire, ou un rassemblement sans date fixe. Une Fête peut revenir chaque année, chaque semaine, ou n'avoir lieu qu'une fois. Les Ndiguels s'y rattachent : c'est ce qui donne une raison à une collecte.",
    short: "Un événement de la communauté, auquel un Ndiguel peut se rattacher.",
    where: "Rail de gauche → Fêtes",
  },
  {
    id: "titre",
    word: "Titre",
    def: "Une distinction portée à côté du nom d'un membre. Le membre en fait la demande, l'administration l'accorde ou la refuse. La liste des titres disponibles est tenue par l'administration, et chaque changement est compté.",
    short: "Une distinction portée à côté du nom, demandée par le membre et accordée par l'administration.",
    where: "Administration → Pilotage du système → Titres",
  },
  {
    id: "organisateur",
    word: "Organisateur",
    def: "La personne désignée pour mener un Ndiguel : suivre les tâches, relancer, rendre compte. Elle est choisie dans n'importe quel Daara — l'organisateur d'un Ndiguel n'a aucun rapport avec le Daara éventuellement ciblé par ce Ndiguel. Ne jamais confondre les deux.",
    short: "La personne désignée pour mener un Ndiguel. Choisie dans n'importe quel Daara.",
    where: "Les Ndiguels → Gérer",
  },
  {
    id: "collecteur",
    word: "Collecteur",
    def: "Un membre habilité à encaisser des dons en personne et à les enregistrer pour le compte du donateur. Il est nommé par l'administration, parfois sur proposition d'un chef de Daara, et peut collecter auprès de n'importe quel membre, quel que soit son Daara.",
    short: "Un membre habilité à encaisser des dons en personne, dans n'importe quel Daara.",
    where: "Rail de gauche → Collecte physique",
    picto: "collecte.png",
  },
];

export function termById(id: string): LexTerm | undefined {
  return LEXIQUE.find((t) => t.id === id);
}
