"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, LayoutDashboard, RotateCw } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";

/*
 * ═══════════════════════════════════════════════════════════════════════════
 * Frontière d'erreur du tableau de bord
 * ═══════════════════════════════════════════════════════════════════════════
 * Le projet n'avait aucun `error.tsx`. Une exception dans un composant serveur
 * — backend injoignable, JSON inattendu, champ absent — remontait donc jusqu'à
 * l'écran d'erreur générique de Next : trace de pile en développement, page
 * blanche en production. Dans les deux cas, l'application disparaît.
 *
 * Cette frontière garde la coque, dit ce qui s'est passé en français, et offre
 * les deux seules issues utiles : réessayer, ou revenir au tableau de bord.
 * `reset()` rejoue le rendu du segment — ce qui suffit quand la cause était
 * passagère, et c'est le cas le plus fréquent ici (backend qui redémarre).
 */

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Le message n'est pas affiché à l'utilisateur : en production, Next le
    // remplace par un texte générique et ne conserve que `digest`, qui permet
    // de retrouver la trace côté serveur.
    console.error("Erreur de rendu du tableau de bord:", error);
  }, [error]);

  return (
    <div className="ax-card">
      <EmptyState
        icon={AlertTriangle}
        size="lg"
        tone="search"
        title="Cet écran n'a pas pu s'afficher"
        description={
          "Une erreur est survenue pendant le chargement des données. " +
          "Le serveur est peut-être momentanément indisponible."
        }
        action={
          <div className="flex flex-col items-center gap-3">
            <div className="flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                onClick={reset}
                className="ax-btn ax-btn--primary"
              >
                <RotateCw size={16} aria-hidden="true" />
                Réessayer
              </button>
              <Link href="/dashboard" className="ax-btn ax-btn--outline">
                <LayoutDashboard size={16} aria-hidden="true" />
                Tableau de bord
              </Link>
            </div>
            {error.digest && (
              <p className="font-mono text-xs text-text-muted">
                Référence : {error.digest}
              </p>
            )}
          </div>
        }
      />
    </div>
  );
}
