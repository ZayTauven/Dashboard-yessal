/* Le paquet `server-only` n'est pas une dépendance du projet, et il serait
   ici redondant : `next/headers` refuse déjà de s'évaluer dans un composant
   client, ce qui garantit la même chose. */
import { cookies } from "next/headers";
import { jwtDecode } from "jwt-decode";
import type { Role } from "@/lib/nav";

/**
 * Rôle du porteur de la session courante.
 *
 * La lecture du jeton était recopiée telle quelle dans `page.tsx`. Depuis que
 * le module compte trois écrans serveur — la liste, la création et l'édition —
 * la recopier deux fois de plus n'aurait plus été du copier-coller anodin :
 * c'est un contrôle d'accès, et trois exemplaires d'un contrôle d'accès
 * divergent tôt ou tard.
 *
 * Ce rôle décide de ce qu'on AFFICHE. Il ne décide de rien d'autre : l'autorité
 * reste `NewsPostViewSet.get_permissions`, qui exige `IsAdminUser` sur toute
 * écriture. Un membre qui forcerait l'URL `/dashboard/news/new` ne verrait
 * qu'un formulaire dont l'envoi est refusé par le serveur — raison pour
 * laquelle les pages le redirigent plutôt que de l'y laisser.
 */
export async function getSessionRole(): Promise<Role> {
  const token = (await cookies()).get("session-yessal")?.value;
  if (!token) return "member";

  try {
    return (jwtDecode<{ role?: string }>(token).role ?? "member") as Role;
  } catch (e) {
    /* Jeton illisible : on retombe sur le rôle le moins privilégié plutôt que
       de laisser une exception vider la page. */
    console.error("Lecture du rôle de session :", e);
    return "member";
  }
}
