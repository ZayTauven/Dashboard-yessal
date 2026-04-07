import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // Les routes protégées
  const isDashboardRoute = request.nextUrl.pathname.startsWith("/dashboard");
  // On récupère le token (pour l'instant on mock avec 'session-yessal')
  const hasToken = request.cookies.has("session-yessal");

  // Si on est sur une route protégée sans token, on redirige vers le login
  if (isDashboardRoute && !hasToken) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Si on est sur la page de login et qu'on a déjà un token, on redirige vers le dashboard
  if (request.nextUrl.pathname.startsWith("/login") && hasToken) {
    const dashboardUrl = new URL("/dashboard", request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
