import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /*
   * Scrutation de fichiers plutôt qu'événements système.
   *
   * En conteneur sur Windows, le bind mount ne remonte pas les événements
   * inotify : Turbopack ne voit jamais les fichiers changer et sert
   * indéfiniment le code figé au moment du build de l'image. Symptôme
   * trompeur — la page répond 200, elle est simplement périmée.
   *
   * Le sondage périodique règle le problème. Il coûte un peu de CPU, donc on
   * ne l'active qu'en développement.
   */
  watchOptions:
    process.env.NODE_ENV === "development"
      ? { pollIntervalMs: 800 }
      : undefined,

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.pexels.com",
      },
      {
        protocol: "https",
        hostname: "*.onrender.com",
      }
    ]
  }
};

export default nextConfig;
