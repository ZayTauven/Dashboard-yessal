/*
 * Formes de données du membre, alignées sur `UserSerializer` côté Django.
 *
 * Elles existent pour sortir la fiche membre du régime `any` relevé par
 * l'audit (76 occurrences dans le front). Tout est optionnel côté lecture :
 * l'API renvoie un profil partiel selon le rôle de l'appelant, et un membre
 * qui n'a pas complété son inscription n'a ni date de naissance ni adresse.
 */

export type MemberRole = "admin" | "chef_daara" | "collector" | "member";

/* `accounts.User.Status` — quatre valeurs, pas cinq. « suspended » n'existe
   pas cote Django ; c'est « inactive ». */
export type MemberStatus = "active" | "pending" | "inactive" | "blocked";

/*
 * `accounts.UserDocument.ValidationStatus`. La valeur validee est
 * **validated**, pas « approved » — « approved » appartient au vocabulaire de
 * `TitleRequest.Status`. La confusion rendait `approvedDocs` toujours nul dans
 * la fiche membre : le compteur « pieces validees » affichait 0 meme avec une
 * piece validee, et la puce correspondante restait en « en attente ».
 */
export type DocumentStatus = "pending" | "validated" | "rejected";

export interface MemberDaara {
  id?: number;
  name?: string | null;
}

export interface MemberTitle {
  id?: number;
  name?: string | null;
}

export interface MemberDocument {
  id: number;
  type?: string | null;
  type_display?: string | null;
  status?: DocumentStatus | null;
  file?: string | null;
  recto?: string | null;
  verso?: string | null;
  uploaded_at?: string | null;
}

/** Une personne sous tutelle : un proche au nom de qui le membre peut donner. */
export interface MemberTutelle {
  id: number;
  first_name?: string | null;
  last_name?: string | null;
  relationship?: string | null;
  phone?: string | null;
  avatar_url?: string | null;
}

export interface Member {
  id: number;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  phone?: string | null;

  role?: MemberRole | string | null;
  status?: MemberStatus | string | null;
  is_admin?: boolean;

  avatar?: string | null;
  avatar_url?: string | null;

  daara?: MemberDaara | null;
  daara_name?: string | null;
  ldd_name?: string | null;

  title?: MemberTitle | null;
  title_name?: string | null;

  birth_date?: string | null;
  gender?: string | null;
  marital_status?: string | null;
  blood_type?: string | null;

  residence_country?: string | null;
  city?: string | null;
  address?: string | null;
  state?: string | null;
  zip_code?: string | null;

  date_joined?: string | null;
  last_active_at?: string | null;

  documents?: MemberDocument[];
}

/*
 * Réexport, et non une table de plus. Celle qui vivait ici disait
 * `member: "Membre"` quand les huit autres copies du projet disaient
 * « Talibé » — et elle alimentait la fiche membre et l'en-tête de coque, deux
 * écrans très vus. Le vocabulaire du produit est « Talibé » (la navigation dit
 * « Liste des Talibés »), donc c'est celui-là qui gagne.
 *
 * L'export est conservé pour ne casser aucun import existant.
 */
export { ROLE_LABEL } from "@/lib/roles";

export const STATUS_LABEL: Record<string, string> = {
  active: "Actif",
  pending: "En attente de validation",
  inactive: "Inactif",
  blocked: "Bloqué",
};

/** Nom d'affichage, avec repli sur l'e-mail puis sur l'identifiant. */
export function memberDisplayName(m: Pick<Member, "first_name" | "last_name" | "email" | "id">): string {
  const full = [m.first_name, m.last_name].filter(Boolean).join(" ").trim();
  if (full) return full;
  if (m.email) return m.email;
  return `Membre #${m.id}`;
}

/** Initiales pour l'avatar de repli — une ou deux lettres, jamais plus. */
export function memberInitials(m: Pick<Member, "first_name" | "last_name" | "email">): string {
  const a = m.first_name?.trim()?.[0];
  const b = m.last_name?.trim()?.[0];
  if (a && b) return (a + b).toUpperCase();
  if (a) return a.toUpperCase();
  const e = m.email?.trim()?.[0];
  return (e || "?").toUpperCase();
}
