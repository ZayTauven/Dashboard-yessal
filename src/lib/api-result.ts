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
