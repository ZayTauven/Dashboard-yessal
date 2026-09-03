import Link from "next/link";
import { Compass, LayoutDashboard, Search } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";

/*
 * ═══════════════════════════════════════════════════════════════════════════
 * Page introuvable — à l'intérieur de la coque
 * ═══════════════════════════════════════════════════════════════════════════
 * Il n'existait aucun `not-found.tsx` dans le projet. Les quatre pages qui
 * appellent `notFound()` — Ndiguel, état d'un Ndiguel, fête, article —
 * tombaient donc sur l'écran par défaut de Next : « 404 · This page could not
 * be found », en anglais, en Helvetica, sur fond blanc, hors du menu, sans le
 * moindre lien de retour. Sur une plateforme entièrement en français, l'effet
 * est celui d'une application cassée plutôt que d'une adresse erronée.
 *
 * Étant sous `(dashboard)`, ce fichier hérite de <AppShell> : le menu, l'en-
 * tête et le fil d'Ariane restent en place. On reste dans l'application.
 */

export default function DashboardNotFound() {
  return (
    <div className="ax-card">
      <EmptyState
        icon={Compass}
        size="lg"
        title="Cette page n'existe pas"
        description={
          "L'adresse demandée ne correspond à aucun écran. Le contenu a peut-être " +
          "été supprimé, ou le lien recopié à la main comporte une coquille."
        }
        action={
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Link href="/dashboard" className="ax-btn ax-btn--primary">
              <LayoutDashboard size={16} aria-hidden="true" />
              Retour au tableau de bord
            </Link>
            <Link href="/dashboard/news" className="ax-btn ax-btn--outline">
              <Search size={16} aria-hidden="true" />
              Parcourir les actualités
            </Link>
          </div>
        }
      />
    </div>
  );
}
