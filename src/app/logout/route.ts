import { cookies } from "next/headers";
import { NextResponse } from "next/server";

/*
 * ═══════════════════════════════════════════════════════════════════════════
 * Déconnexion
 * ═══════════════════════════════════════════════════════════════════════════
 * Un Route Handler, et non une action serveur, parce qu'il doit être atteignable
 * par une simple redirection depuis le rendu d'une page — ce qu'une action ne
 * permet pas. C'est le cas quand la session a été fermée à distance : mot de
 * passe changé sur un autre appareil, ou réinitialisé par un administrateur.
 *
 * Le middleware ne regarde que la PRÉSENCE du cookie ; il ne peut pas savoir
 * qu'un jeton a été révoqué côté serveur. Sans ce passage, la personne gardait
 * un cookie périmé, franchissait le middleware, et se retrouvait devant une
 * interface vide dont chaque appel renvoyait 401.
 */
export async function GET(request: Request) {
  const cookiesList = await cookies();
  cookiesList.delete("session-yessal");
  cookiesList.delete("refresh-yessal");

  /*
   * ── Une Location RELATIVE, et c'est tout l'objet de ce correctif ─────────
   * `NextResponse.redirect(new URL("/login", request.url))` renvoyait
   *
   *     location: http://0.0.0.0:3000/login?reason=revoked
   *
   * `request.url` porte l'adresse de LIAISON du serveur, pas l'hôte par lequel
   * le visiteur est arrivé. `0.0.0.0` signifie « toutes les interfaces » côté
   * serveur ; côté navigateur, ce n'est pas une adresse joignable — Chromium
   * répond ERR_ADDRESS_INVALID.
   *
   * Et cette route est le chemin NORMAL d'une session expirée : le jeton vit
   * une heure, après quoi le middleware envoie tout le monde ici. Au lieu de
   * retomber sur l'écran de connexion, on atterrissait donc sur une page
   * d'erreur du navigateur.
   *
   * Le middleware, lui, n'a pas ce défaut : Next normalise ses redirections
   * de même origine en chemin relatif. Ce n'est pas le cas d'un Route Handler,
   * d'où la construction à la main.
   *
   * Une Location relative est valide (RFC 7231 §7.1.2) et se résout contre
   * l'URL courante — donc contre l'hôte réel du visiteur, quel que soit le
   * proxy devant.
   */
  const revoked =
    new URL(request.url).searchParams.get("reason") === "revoked";
  const target = revoked ? "/login?reason=revoked" : "/login";

  /* Les cookies sont posés sur CETTE réponse, et pas seulement via
     `cookies()` : c'est elle qui part au navigateur. */
  const response = new NextResponse(null, {
    status: 307,
    headers: { Location: target },
  });
  response.cookies.delete("session-yessal");
  response.cookies.delete("refresh-yessal");
  return response;
}
