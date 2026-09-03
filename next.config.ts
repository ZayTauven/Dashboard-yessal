import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.pexels.com",
      },
      {
        protocol: "https",
        hostname: "*.onrender.com",
      },
    ],
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
};

export default nextConfig;
