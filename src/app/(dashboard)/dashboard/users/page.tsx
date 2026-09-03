import { redirect } from "next/navigation";
import { getProfile } from "@/app/actions/users";

/*
 * ═══════════════════════════════════════════════════════════════════════════
 * /dashboard/users — index manquant
 * ═══════════════════════════════════════════════════════════════════════════
 * Le dossier ne contenait que `[id]/`. Les fiches membres sont donc
 * atteignables (`/dashboard/users/12`), mais l'adresse parente ne menait à
 * rien : un 404 brut, sans coque ni retour. On y arrive plus souvent qu'on ne
 * croit — en raccourcissant l'URL, ou en remontant le fil d'Ariane.
 *
 * Il n'y a pas d'écran propre à créer : la liste des membres existe déjà, à
 * deux endroits selon le rôle. On y redirige plutôt que d'inventer un
 * troisième annuaire à maintenir.
 */

export default async function UsersIndexPage() {
  const { data: profile } = await getProfile();

  if (profile?.role === "admin") {
    redirect("/dashboard/admin/users");
  }
  redirect("/dashboard/members");
}
