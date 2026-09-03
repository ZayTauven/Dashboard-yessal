/*
 * ═══════════════════════════════════════════════════════════════════════════
 * Libellés des rôles — module NEUTRE, sans directive
 * ═══════════════════════════════════════════════════════════════════════════
 * La même table était recopiée dans HUIT fichiers, et elle avait divergé :
 *
 *   · `collector` valait « Collecteur » dans quatre écrans et
 *     « Talibé · Collecteur » dans deux autres ;
 *   · `tutelle` manquait dans trois tables sur six — le rôle s'y affichait
 *     donc en clé brute, `tutelle` ;
 *   · `admin` manquait dans celle de « Lancer un Ndiguel ».
 *
 * Et là où aucune table n'existait — les cartes de Ndiguel — on lisait
 * carrément `chef_daara` et `collector` à l'écran.
 *
 * Une seule source désormais. Deux formes, parce que le besoin est réellement
 * double et que la divergence venait de là :
 *
 *   `roleLabel`     forme courte, pour les tableaux et les filtres, où la
 *                   colonne est étroite et le contexte déjà donné ;
 *   `roleLabelLong` forme qui rappelle le rattachement — « Talibé ·
 *                   Collecteur » — là où l'on désigne une PERSONNE dans sa
 *                   communauté : collecte physique, Mon Daara, fiche membre.
 *                   Un collecteur reste un talibé ; sur ces écrans-là, le
 *                   taire donnerait à croire qu'il s'agit d'un autre statut.
 *
 * Les clés suivent `User.Role` côté Django (accounts/models.py).
 */

export const ROLE_LABEL: Record<string, string> = {
  member: "Talibé",
  collector: "Collecteur",
  chef_daara: "Chef de Daara",
  tutelle: "Tutelle",
  admin: "Administrateur",
};

const ROLE_LABEL_LONG: Record<string, string> = {
  ...ROLE_LABEL,
  collector: "Talibé · Collecteur",
};

/**
 * Forme courte. Renvoie la clé telle quelle si le rôle est inconnu — mieux vaut
 * afficher `superviseur` que rien du tout le jour où le backend en ajoute un.
 */
export function roleLabel(role?: string | null): string {
  if (!role) return "—";
  return ROLE_LABEL[role] ?? role;
}

/** Forme longue, pour les écrans qui désignent une personne dans son Daara. */
export function roleLabelLong(role?: string | null): string {
  if (!role) return "—";
  return ROLE_LABEL_LONG[role] ?? role;
}

/** Les rôles proposables dans un filtre ou un sélecteur, dans l'ordre d'usage. */
export const ROLE_OPTIONS = [
  { value: "member", label: ROLE_LABEL.member },
  { value: "collector", label: ROLE_LABEL.collector },
  { value: "chef_daara", label: ROLE_LABEL.chef_daara },
  { value: "tutelle", label: ROLE_LABEL.tutelle },
  { value: "admin", label: ROLE_LABEL.admin },
] as const;
