/*
 * ═══════════════════════════════════════════════════════════════════════════
 * Yessal Guide — le sommaire, source unique
 * ═══════════════════════════════════════════════════════════════════════════
 * Le rail de gauche, la page d'accueil du guide, la palette de recherche, le
 * fil précédent/suivant et l'avancement de lecture lisent tous CE fichier.
 * Ajouter un chapitre, c'est ajouter une entrée ici et un composant dans
 * `components/guide/chapters/` — rien d'autre à toucher.
 *
 * ⚠️ `icon` est une CHAÎNE, pas un composant Lucide, et ce n'est pas un détail.
 * Le sommaire est lu aussi bien par des composants serveur que par des
 * composants client ; une fonction ne franchit pas la frontière RSC, et une
 * icône passée en propriété fait tomber la page entière. La résolution se fait
 * donc au dernier moment, dans <GuideIcon>, du côté où l'on rend.
 */

/** Les quatre profils auxquels le guide s'adresse. */
export type GuideRole = "talibe" | "chef" | "collecteur" | "admin";

export interface GuideChapter {
  slug: string;
  title: string;
  /** Une à deux phrases : ce que le lecteur saura faire en sortant. */
  lead: string;
  /** Clé résolue par <GuideIcon> — jamais un composant. */
  icon: string;
  /** Temps de lecture annoncé, en minutes. */
  minutes: number;
  /** Profils concernés. Tableau vide ⇒ tout le monde. */
  roles: GuideRole[];
  /** Mots que l'on taperait dans la recherche sans qu'ils soient dans le titre. */
  keywords?: string[];
  /** Picto dessiné, dans /guide-assets/pictos/. */
  picto?: string;
  section: GuideSectionId;
}

export type GuideSectionId =
  | "demarrer"
  | "vocabulaire"
  | "gestes"
  | "plus-loin";

export interface GuideSection {
  id: GuideSectionId;
  label: string;
  /** Une ligne, affichée sur l'accueil du guide. */
  blurb: string;
}

export const ROLE_LABELS: Record<GuideRole, string> = {
  talibe: "Talibé",
  chef: "Chef de Daara",
  collecteur: "Collecteur",
  admin: "Administrateur",
};

export const ROLE_ORDER: GuideRole[] = [
  "talibe",
  "chef",
  "collecteur",
  "admin",
];

export const GUIDE_SECTIONS: GuideSection[] = [
  {
    id: "demarrer",
    label: "Prise en main",
    blurb: "Ouvrir son compte, se connecter, reconnaître les écrans.",
  },
  {
    id: "vocabulaire",
    label: "Le vocabulaire",
    blurb: "Jëf, Ndiguel, Daara, tutelle — et qui a le droit de quoi.",
  },
  {
    id: "gestes",
    label: "Les gestes du quotidien",
    blurb: "Les sept opérations qui font l'essentiel du travail.",
  },
  {
    id: "plus-loin",
    label: "Aller plus loin",
    blurb: "Le téléphone, la sécurité, la trace de chaque action.",
  },
];

export const GUIDE_CHAPTERS: GuideChapter[] = [
  /* ── Prise en main ───────────────────────────────────────────────────── */
  {
    slug: "bienvenue",
    title: "Bienvenue dans Yessal Gui",
    lead: "Ce que la plateforme fait, pour qui, et comment lire ce guide sans le lire en entier.",
    icon: "sparkles",
    minutes: 3,
    roles: [],
    section: "demarrer",
    picto: "solidarite.png",
    keywords: ["introduction", "presentation", "commencer", "decouvrir"],
  },
  {
    slug: "premiers-pas",
    title: "Ouvrir son compte",
    lead: "De la demande d'accès à la première connexion, en passant par le mot de passe provisoire.",
    icon: "key",
    minutes: 5,
    roles: [],
    section: "demarrer",
    picto: "jef.png",
    keywords: [
      "inscription",
      "register",
      "connexion",
      "login",
      "mot de passe",
      "activation",
      "validation",
    ],
  },
  {
    slug: "reperes",
    title: "Se repérer dans l'interface",
    lead: "Le rail, l'en-tête, la palette ⌘K, le thème : trois minutes pour ne plus chercher.",
    icon: "compass",
    minutes: 4,
    roles: [],
    section: "demarrer",
    keywords: ["navigation", "menu", "sidebar", "raccourcis", "theme", "sombre"],
  },

  /* ── Le vocabulaire ──────────────────────────────────────────────────── */
  {
    slug: "lexique",
    title: "Les mots de la maison",
    lead: "Jëf, Ndiguel, Daara, Talibé, tutelle, zone territoriale. Huit mots, et tout le reste s'éclaire.",
    icon: "book",
    minutes: 6,
    roles: [],
    section: "vocabulaire",
    picto: "repas.png",
    keywords: ["glossaire", "definition", "wolof", "vocabulaire", "jef", "ndiguel"],
  },
  {
    slug: "roles",
    title: "Qui fait quoi",
    lead: "Cinq rôles, un tableau de droits, et la règle qui surprend tout le monde : rien n'est borné au Daara.",
    icon: "users",
    minutes: 5,
    roles: [],
    section: "vocabulaire",
    keywords: ["permissions", "droits", "admin", "chef", "collecteur", "membre"],
  },

  /* ── Les gestes du quotidien ─────────────────────────────────────────── */
  {
    slug: "faire-un-jef",
    title: "Faire un Jëf",
    lead: "Choisir un Ndiguel, saisir un montant, payer. Et savoir lire le statut qui suit.",
    icon: "heart",
    minutes: 6,
    roles: ["talibe", "chef", "collecteur", "admin"],
    section: "gestes",
    picto: "jef.png",
    keywords: ["don", "donner", "paiement", "wave", "orange money", "virement"],
  },
  {
    slug: "collecte-physique",
    title: "Encaisser une collecte",
    lead: "Le poste du collecteur : identifier la personne, enregistrer le versement, et rien de plus.",
    icon: "hand-coins",
    minutes: 7,
    roles: ["collecteur", "chef", "admin"],
    section: "gestes",
    picto: "collecte.png",
    keywords: ["especes", "terrain", "cash", "collecteur", "inscription rapide"],
  },
  {
    slug: "lancer-un-ndiguel",
    title: "Lancer un Ndiguel",
    lead: "Réservé à l'administration : l'objectif, l'échéance, l'organisateur, et le suivi jusqu'à la clôture.",
    icon: "landmark",
    minutes: 8,
    roles: ["admin"],
    section: "gestes",
    keywords: ["campagne", "creer", "objectif", "echeance", "organisateur", "fete"],
  },
  {
    slug: "suivre-son-daara",
    title: "Suivre son Daara",
    lead: "L'annuaire, le chef, les collecteurs, et ce que voit un chef de Daara que les autres ne voient pas.",
    icon: "users-round",
    minutes: 5,
    roles: ["talibe", "chef"],
    section: "gestes",
    keywords: ["daara", "annuaire", "membres", "talibes", "zone"],
  },
  {
    slug: "tutelles",
    title: "Donner au nom d'un proche",
    lead: "Enregistrer une tutelle, puis porter un Jëf au nom de sa mère, de son fils ou d'un disparu.",
    icon: "heart-handshake",
    minutes: 4,
    roles: ["talibe", "collecteur"],
    section: "gestes",
    picto: "solidarite.png",
    keywords: ["tutelle", "proche", "famille", "beneficiaire", "au nom de"],
  },
  {
    slug: "profil-documents",
    title: "Profil, pièces et titre",
    lead: "Compléter sa fiche, téléverser une pièce d'identité, demander un titre — et ce que l'administration en fait.",
    icon: "id-card",
    minutes: 5,
    roles: [],
    section: "gestes",
    keywords: ["profil", "cni", "passeport", "document", "titre", "photo"],
  },

  /* ── Aller plus loin ─────────────────────────────────────────────────── */
  {
    slug: "mobile",
    title: "L'application mobile",
    lead: "Ce que le talibé a dans la poche : les mêmes Jëfs, la même communauté, un écran de quatre pouces.",
    icon: "smartphone",
    minutes: 4,
    roles: [],
    section: "plus-loin",
    keywords: ["android", "telephone", "application", "notifications", "push"],
  },
  {
    slug: "securite",
    title: "Sécurité et traçabilité",
    lead: "Mot de passe, sessions, anonymat d'un Jëf, journal d'audit : ce que la plateforme protège et ce qu'elle garde.",
    icon: "shield",
    minutes: 5,
    roles: [],
    section: "plus-loin",
    keywords: ["securite", "audit", "anonyme", "session", "confidentialite", "journal"],
  },
];

/* ── Accès ─────────────────────────────────────────────────────────────── */

export function chapterBySlug(slug: string): GuideChapter | undefined {
  return GUIDE_CHAPTERS.find((c) => c.slug === slug);
}

export function chaptersOfSection(id: GuideSectionId): GuideChapter[] {
  return GUIDE_CHAPTERS.filter((c) => c.section === id);
}

/**
 * Précédent / suivant dans l'ordre du sommaire.
 *
 * L'ordre du tableau EST l'ordre de lecture : il suit la progression réelle
 * (comprendre, puis nommer, puis faire), pas l'ordre alphabétique.
 */
export function neighbours(slug: string): {
  prev: GuideChapter | null;
  next: GuideChapter | null;
} {
  const i = GUIDE_CHAPTERS.findIndex((c) => c.slug === slug);
  if (i < 0) return { prev: null, next: null };
  return {
    prev: i > 0 ? GUIDE_CHAPTERS[i - 1] : null,
    next: i < GUIDE_CHAPTERS.length - 1 ? GUIDE_CHAPTERS[i + 1] : null,
  };
}

/** Les chapitres qui parlent à ce profil — les chapitres sans rôle en font partie. */
export function chaptersForRole(role: GuideRole): GuideChapter[] {
  return GUIDE_CHAPTERS.filter(
    (c) => c.roles.length === 0 || c.roles.includes(role),
  );
}

/** Correspondance pour la palette de recherche. */
export function chapterMatches(chapter: GuideChapter, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  if (chapter.title.toLowerCase().includes(q)) return true;
  if (chapter.lead.toLowerCase().includes(q)) return true;
  return (chapter.keywords || []).some((k) => k.includes(q));
}
