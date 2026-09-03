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

  const url = new URL("/login", request.url);
  if (new URL(request.url).searchParams.get("reason") === "revoked") {
    url.searchParams.set("reason", "revoked");
  }

  return NextResponse.redirect(url);
}
