/*
 * ═══════════════════════════════════════════════════════════════════════════
 * Résultat d'un appel serveur : distinguer « absent » de « refusé »
 * ═══════════════════════════════════════════════════════════════════════════
 * Les actions serveur écrasaient tous les modes d'échec en une seule chaîne
 * de caractères :
 *
 *     if (!res.ok) return { error: "Impossible de charger la campagne." };
 *
 * Les pages de détail en tiraient ensuite une conclusion unique :
 *
 *     if (error || !data) notFound();
 *
 * Si bien que quatre situations très différentes — la ressource n'existe pas
 * (404), la session a expiré (401), l'utilisateur n'a pas le droit (403), le
 * backend est tombé (500 ou réseau) — aboutissaient toutes à la même page
 * « introuvable ». C'est l'origine des 404 constatés sur des pages qui
 * existent bel et bien : le jeton d'accès vit une heure, et passé ce délai,
 * chaque écran de détail annonçait que son contenu n'existait pas.
 *
 * `status` conserve le code HTTP (0 = le serveur n'a pas répondu). Les pages
 * peuvent alors réserver `notFound()` au seul vrai 404 et laisser le reste
 * remonter à la frontière d'erreur, qui, elle, propose de réessayer.
 */

export interface ApiResult<T> {
  data?: T;
  error?: string;
  /** Code HTTP de la réponse. `0` quand aucune réponse n'est parvenue. */
  status?: number;
  /** Raccourci : la session est absente, expirée ou révoquée. */
  unauthorized?: boolean;
}

/** Message par défaut selon le code, quand l'appelant n'en fournit pas. */
export function messageForStatus(status: number, fallback: string): string {
  if (status === 0) return "Le serveur est injoignable. Réessayez dans un instant.";
  if (status === 401) return "Votre session a expiré. Reconnectez-vous.";
  if (status === 403) return "Vous n'avez pas accès à cette ressource.";
  if (status === 404) return "Cette ressource n'existe pas ou plus.";
  if (status >= 500) return "Le serveur a rencontré une erreur. Réessayez dans un instant.";
  return fallback;
}

/**
 * Vrai lorsque l'échec justifie une page « introuvable ».
 *
 * Uniquement 404 : tout le reste est un incident, pas une absence, et mérite
 * un écran qui le dise — sans quoi on renvoie l'utilisateur chercher une page
 * qui, elle, est parfaitement là.
 */
export function isMissing(result: { status?: number }): boolean {
  return result.status === 404;
}


/**
 * Traduit la réponse d'échec de DRF en une phrase affichable.
 *
 * Les actions d'écriture faisaient toutes :
 *
 *     return { error: data.detail || "Erreur lors de la création." };
 *
 * Or `detail` n'existe QUE pour les erreurs d'authentification et de
 * permission. Une erreur de VALIDATION — le cas courant — a la forme
 * `{"champ": ["message"]}`. Le `||` retombait donc systématiquement sur la
 * phrase générique, et l'utilisateur voyait « Erreur lors de la création de
 * l'article » sans jamais savoir quel champ posait problème.
 *
 * C'est ce qui rend un échec de création indiagnosticable : le serveur dit
 * précisément ce qui ne va pas, et l'interface le jette.
 *
 * `non_field_errors` est remonté sans son nom : le préfixer de
 * « non_field_errors : » n'apprendrait rien à personne.
 */
export function messageForErrors(body: unknown, fallback: string): string {
  if (!body) return fallback;

  /* Une chaine renvoyee telle quelle — certains points d'entree le font. */
  if (typeof body === "string") return body || fallback;

  /* DRF renvoie parfois un TABLEAU a la racine, sans nom de champ :
     `["Vous etes deja membre de ce Ndiguel."]`. */
  if (Array.isArray(body)) {
    const texte = body.filter((v) => typeof v === "string").join(" ");
    return texte || fallback;
  }

  if (typeof body !== "object") return fallback;

  const data = body as Record<string, unknown>;
  if (typeof data.detail === "string") return data.detail;
  /* `error` : la forme des points d'entree ecrits a la main du projet, hors
     conventions DRF. */
  if (typeof data.error === "string") return data.error;

  const parts: string[] = [];
  for (const [field, value] of Object.entries(data)) {
    const text = Array.isArray(value) ? value.join(" ") : String(value);
    if (!text) continue;
    parts.push(
      field === "non_field_errors" || field === "detail" || field === "error"
        ? text
        : `${LABELS[field] ?? field} : ${text}`,
    );
  }

  return parts.length > 0 ? parts.join(" · ") : fallback;
}

/** Noms de champs tels que l'utilisateur les lit à l'écran. */
const LABELS: Record<string, string> = {
  title: "Titre",
  content: "Contenu",
  excerpt: "Résumé",
  cover_image: "Bannière",
  youtube_url: "Lien YouTube",
  is_published: "État",
  image: "Image",
  gallery_images: "Galerie",
  avatar: "Photo de profil",
  file: "Fichier",
  file_url: "Fichier",
  document: "Document",
  doc_type: "Type de document",
  name: "Nom",
  first_name: "Prénom",
  last_name: "Nom",
  email: "Adresse e-mail",
  phone: "Téléphone",
  password: "Mot de passe",
  amount: "Montant",
  date: "Date",
  daara: "Daara",
  ldd: "Localité",
  role: "Rôle",
  relation: "Lien de parenté",
  tutelle_user: "Membre sous tutelle",
  deadline: "Date limite",
  goal_amount: "Objectif",
  objective: "Objectif",
  fete: "Fête",
  organizer: "Organisateur",
  doc_number: "Numéro du document",
  image_recto: "Recto",
  image_verso: "Verso",
  target: "Destinataires",
  message_type: "Type de message",
  illustrative_photo: "Photo d'illustration",
};

/**
 * Charge JSON relayée telle quelle à l'API.
 *
 * Ces actions ne font que `JSON.stringify` et transmettre : la forme exacte
 * appartient au sérialiseur Django, pas au front. Inventer ici une interface
 * par point d'entrée donnerait l'illusion d'un contrat — et cette illusion se
 * périmerait à la première migration, sans que rien ne le signale.
 *
 * `Record<string, unknown>` dit la vérité et apporte le vrai gain sur `any` :
 * on ne peut plus déréférencer une propriété sans l'avoir vérifiée.
 */
export type JsonPayload = Record<string, unknown>;
