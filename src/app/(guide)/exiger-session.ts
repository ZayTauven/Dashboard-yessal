import { redirect } from "next/navigation";
import { getProfile } from "@/app/actions/users";

/*
 * L'intergiciel ne regarde que la PRÉSENCE du cookie de session : un visiteur
 * sans compte qui posait `session-yessal=x` lisait tout le guide — rôles,
 * organisation, circuits de collecte. Le guide demande donc à Django si la
 * session est réelle, à chaque page et pas seulement dans le layout : un
 * layout n'est pas rejoué à chaque navigation, une page l'est toujours.
 *
 * Fermé par défaut : si Django ne répond pas, le guide ne s'ouvre pas.
 */
export async function exigerSession() {
  const profil = await getProfile();
  if (profil.unauthorized) redirect("/logout?reason=revoked");
  if (!profil.data) redirect("/login");
}
