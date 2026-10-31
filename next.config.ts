import type { NextConfig } from "next";

/*
 * ═══════════════════════════════════════════════════════════════════════════
 * En-têtes de sécurité
 * ═══════════════════════════════════════════════════════════════════════════
 * nginx ne pose que `nosniff` et `Referrer-Policy`, et le commentaire « Django
 * envoie déjà X-Frame-Options » ne vaut que pour les réponses de Django : les
 * PAGES viennent d'ici. Sans `frame-ancestors`, un site tiers pouvait afficher
 * /dashboard/admin/users dans un cadre invisible et faire cliquer un
 * administrateur connecté (valider un compte, confirmer une remise).
 *
 * La CSP se limite à ce qui ne casse rien : pas de `script-src`, qui exigerait
 * un nonce pour le script de thème inline de `app/layout.tsx`.
 */
const SECURITY_HEADERS = [
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'; base-uri 'self'; object-src 'none'" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Strict-Transport-Security", value: "max-age=31536000" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
];

const nextConfig: NextConfig = {
  /*
   * Aucun hôte distant pour l'optimiseur d'images. Il autorisait
   * `images.pexels.com` et `*.onrender.com`, que plus rien n'utilisait : le
   * second laissait quiconque crée un sous-domaine Render gratuit faire
   * télécharger et décoder par ce serveur un fichier de son choix — la porte
   * d'entrée des failles de l'optimiseur (SVG, AVIF, SSRF). `next/image` ne
   * sert plus que les fichiers de `public/`.
   */
  poweredByHeader: false,

  async headers() {
    return [{ source: "/:path*", headers: SECURITY_HEADERS }];
  },

  /*
   * ═══════════════════════════════════════════════════════════════════════
   * Taille maximale d'un envoi
   * ═══════════════════════════════════════════════════════════════════════
   * Le plafond d'envoi a été porté à 15 Mo en deux endroits — le composant
   * <FileDrop> côté navigateur, et `MAX_UPLOAD_SIZE` côté Django — mais un
   * troisième plafond restait au défaut : celui des Server Actions de Next,
   * fixé à 1 Mo.
   *
   * Symptôme : « Body exceeded 1 MB limit », en erreur SERVEUR, à la
   * modification d'un article ou de la bannière d'un Ndiguel. Le front
   * acceptait le fichier, Django l'aurait accepté aussi — Next le refusait
   * entre les deux.
   *
   * Les trois valeurs doivent rester alignées. Si l'une bouge, les autres
   * suivent : `components/vireo/FileDrop.tsx` (MAX_FILE_SIZE_MB) et
   * `core/settings.py` (MAX_UPLOAD_SIZE).
   */
  experimental: {
    serverActions: {
      bodySizeLimit: "15mb",
    },
  },

  /*
   * Les pièces jointes et portraits arrivent de Django en chemins RELATIFS
   * (`/media/chat_files/…`). En production, nginx sert `/media/` sur le même
   * hôte et ne laisse jamais la requête atteindre Next ; en local, rien ne
   * les servait — une image partagée dans la messagerie s'affichait cassée.
   */
  async rewrites() {
    const backend = process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:8000";
    return [{ source: "/media/:path*", destination: `${backend}/media/:path*` }];
  },
};

export default nextConfig;
