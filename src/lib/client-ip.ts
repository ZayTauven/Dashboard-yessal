import { headers } from "next/headers";

/*
 * L'adresse du visiteur, à transmettre à Django sur les appels anonymes.
 *
 * Les Server Actions appellent Django de conteneur à conteneur : sans cet
 * en-tête, Django voyait TOUS les visiteurs du web sous l'adresse du
 * conteneur Next. Cinq demandes « mot de passe oublié » en une heure, d'où
 * qu'elles viennent, bloquaient la fonction pour tout le monde — et la limite
 * de tentatives de connexion ne visait plus personne en particulier.
 *
 * Seule la DERNIÈRE adresse de `X-Forwarded-For` compte : c'est celle que le
 * frontal nginx a ajoutée, la seule qu'un visiteur ne peut pas écrire. Django
 * lit la même position (`NUM_PROXIES = 1`). En local, sans nginx, l'en-tête
 * est absent et rien n'est transmis.
 */
export async function clientIpHeaders(): Promise<Record<string, string>> {
  const forwarded = (await headers()).get("x-forwarded-for");
  const ip = forwarded?.split(",").pop()?.trim();
  return ip ? { "X-Forwarded-For": ip } : {};
}
