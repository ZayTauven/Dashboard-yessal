/*
 * ═══════════════════════════════════════════════════════════════════════════
 * Mots de passe provisoires
 * ═══════════════════════════════════════════════════════════════════════════
 * Deux écrans créent des comptes pour quelqu'un d'autre : l'inscription rapide
 * du collecteur, et l'import Excel de l'administration. Tous deux posaient la
 * MÊME chaîne en dur pour tout le monde — `YessalUser2024!` d'un côté,
 * `YessalPassword2024!` de l'autre — et l'écran de collecte l'affichait en
 * clair, avant même la création.
 *
 * Deux problèmes distincts :
 *
 *   · un mot de passe universel n'en est pas un : connaître celui d'un compte,
 *     c'est connaître celui de tous les comptes créés de la même façon ;
 *   · écrit dans un composant client, il part dans le bundle envoyé au
 *     navigateur — donc lisible par n'importe qui, même sans compte.
 *
 * Chaque compte reçoit désormais le sien, tiré de `crypto.getRandomValues`.
 * Il n'est plus affiché AVANT la création (il n'existe pas encore) mais APRÈS,
 * une seule fois, pour que le collecteur puisse le dicter au membre.
 *
 * L'alphabet exclut ce qui se confond à l'oral et à l'écrit — 0/O, 1/l/I —
 * parce que ce mot de passe est transmis de vive voix, souvent dehors, entre
 * deux personnes qui ne le reverront plus.
 */

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";

/** Longueur par défaut : assez long pour résister, assez court pour se dicter. */
const DEFAULT_LENGTH = 12;

/**
 * Tire un mot de passe provisoire sans biais de modulo (on rejette les octets
 * qui tomberaient dans la tranche incomplète plutôt que de les replier).
 */
export function generateProvisionalPassword(length = DEFAULT_LENGTH): string {
  const max = Math.floor(256 / ALPHABET.length) * ALPHABET.length;
  let out = "";

  while (out.length < length) {
    const bytes = new Uint8Array(length - out.length);
    crypto.getRandomValues(bytes);
    for (const b of bytes) {
      if (b < max) out += ALPHABET[b % ALPHABET.length];
    }
  }

  return out;
}

/**
 * Longueur minimale exigée d'un mot de passe choisi par un membre.
 *
 * Alignée sur `MinimumLengthValidator` de Django, qui la fait respecter côté
 * serveur — c'est lui qui tranche. La constante n'existe ici que pour poser
 * `minLength` sur les champs de saisie : le navigateur refuse alors avant
 * l'aller-retour, et le message d'aide annonce la même règle que celle qui
 * sera appliquée.
 */
export const PASSWORD_MIN_LENGTH = 8;
