import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/*
 * ═══════════════════════════════════════════════════════════════════════════
 * Garde de session, et prolongation silencieuse
 * ═══════════════════════════════════════════════════════════════════════════
 * Le jeton d'accès vit une heure (SIMPLE_JWT.ACCESS_TOKEN_LIFETIME), et le
 * cookie autant. Le backend émet aussi un jeton de rafraîchissement, valable
 * un jour, et expose `/api/auth/refresh/` pour l'échanger — mais `loginAction`
 * jetait ce jeton, et rien n'appelait jamais cet endpoint.
 *
 * Conséquence : au bout d'une heure, chaque appel repartait en 401. Les pages
 * de liste s'affichaient vides, et les pages de détail — qui traitaient toute
 * erreur comme une absence — annonçaient « cette page n'existe pas ». Le
 * symptôme ressemblait à des routes cassées ; c'était une session expirée.
 *
 * Le renouvellement se fait ici et pas ailleurs : dans Next, seuls un
 * intergiciel, une route et une action serveur peuvent ÉCRIRE un cookie. Les
 * chargements de données, eux, s'exécutent pendant le rendu — ils peuvent lire
 * le jeton, jamais le remplacer.
 */

const ACCESS_COOKIE = "session-yessal";
const REFRESH_COOKIE = "refresh-yessal";

/** Marge avant expiration : on renouvelle avant que le rendu ne parte en 401. */
const RENEW_BEFORE_SECONDS = 120;

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:8000";

/**
 * Instant d'expiration d'un JWT, en secondes epoch. `null` si le jeton est
 * illisible — auquel cas on le traite comme périmé plutôt que de faire
 * confiance à une valeur qu'on n'a pas su lire.
 *
 * Décodage manuel : `jwt-decode` n'est pas garanti sur le runtime Edge, et on
 * n'a besoin que d'un champ. Aucune vérification de signature n'est faite ici,
 * et il ne faut pas en tirer de décision d'autorisation : c'est le backend qui
 * valide. On ne s'en sert que pour savoir s'il est temps de renouveler.
 */
function expiryOf(token: string): number | null {
  const payload = token.split(".")[1];
  if (!payload) return null;
  try {
    const json = JSON.parse(
      atob(payload.replace(/-/g, "+").replace(/_/g, "/")),
    );
    return typeof json.exp === "number" ? json.exp : null;
  } catch {
    return null;
  }
}

function isExpiringSoon(token: string): boolean {
  const exp = expiryOf(token);
  if (exp === null) return true;
  return exp - Math.floor(Date.now() / 1000) < RENEW_BEFORE_SECONDS;
}

const COOKIE_BASE = {
  httpOnly: true,
  path: "/",
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isDashboardRoute = pathname.startsWith("/dashboard");
  const isLoginRoute = pathname.startsWith("/login");

  let accessToken = request.cookies.get(ACCESS_COOKIE)?.value;
  const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value;

  /*
   * Prolongation. On ne la tente que sur les écrans protégés : inutile de
   * solliciter le backend pour la page d'accueil ou un fichier statique.
   */
  let renewed: string | null = null;
  if (isDashboardRoute && refreshToken && (!accessToken || isExpiringSoon(accessToken))) {
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/refresh/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh: refreshToken }),
        cache: "no-store",
      });
      if (res.ok) {
        const data = await res.json();
        if (typeof data?.access === "string") {
          renewed = data.access;
          accessToken = data.access;
        }
      } else {
        /*
         * 401 : session révoquée côté serveur (mot de passe changé ailleurs)
         * ou jeton de rafraîchissement lui-même expiré. On efface les deux
         * cookies, sinon la boucle se rejoue à chaque navigation.
         */
        const out = NextResponse.redirect(new URL("/login", request.url));
        out.cookies.delete(ACCESS_COOKIE);
        out.cookies.delete(REFRESH_COOKIE);
        return out;
      }
    } catch {
      // Backend injoignable : on laisse passer avec le jeton en main. La page
      // affichera son erreur de chargement, ce qui est plus honnête qu'une
      // déconnexion pour une panne réseau passagère.
    }
  }

  if (isDashboardRoute && !accessToken) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (isLoginRoute && accessToken) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  /*
   * Le nouveau jeton est posé sur la requête ET sur la réponse.
   *
   * Sur la requête, via `NextResponse.next({ request })` : sans cela, le rendu
   * qui suit lirait encore l'ancien cookie et repartirait en 401 — la
   * prolongation ne prendrait effet qu'à la navigation suivante, c'est-à-dire
   * jamais du point de vue de l'utilisateur.
   *
   * Sur la réponse, pour que le navigateur garde le jeton neuf.
   */
  if (!renewed) {
    return NextResponse.next();
  }

  request.cookies.set(ACCESS_COOKIE, renewed);
  const response = NextResponse.next({ request });
  response.cookies.set({
    ...COOKIE_BASE,
    name: ACCESS_COOKIE,
    value: renewed,
    maxAge: 60 * 60,
  });

  return response;
}

export const config = {
  matcher: [
    /*
     * Toutes les routes sauf :
     * - api            (routes d'API)
     * - _next/static   (fichiers statiques)
     * - _next/image    (images optimisées)
     * - favicon.ico
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
