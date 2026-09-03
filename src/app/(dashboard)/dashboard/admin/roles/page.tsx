import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHead } from "@/components/vireo/PageHead";

/*
 * Écran non encore développé.
 *
 * L'ancienne version enveloppait toute la page dans `opacity-60` et affichait
 * « En cours de déploiement… » dans un cadre en pointillés. Un écran volontai-
 * rement délavé se lit comme un écran CASSÉ, pas comme un écran à venir, et
 * l'opacité globale faisait tomber le contraste du texte sous les seuils
 * d'accessibilité.
 *
 * On garde donc la pleine lisibilité, on annonce clairement l'état, et surtout
 * on offre une SORTIE : l'attribution des rôles se fait déjà depuis
 * « Utilisateurs et rôles ». L'ancienne page laissait l'administrateur dans
 * une impasse.
 */
export default function AdminRolesPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHead
        role="admin"
        title="Permissions et rôles"
        subtitle="Niveaux d'accès des administrateurs, chefs de Daara, collecteurs et talibés."
      />

      <div className="ax-card">
        <div className="ax-card__body">
          <EmptyState
            icon={ShieldCheck}
            size="lg"
            title="Écran en cours de développement"
            description="La gestion fine des permissions arrivera ici. En attendant, les rôles s'attribuent depuis la fiche de chaque utilisateur."
            action={
              <Link
                href="/dashboard/admin/users"
                className="ax-btn ax-btn--primary"
              >
                <span className="ax-btn__label">
                  Aller à Utilisateurs et rôles
                </span>
              </Link>
            }
          />
        </div>
      </div>
    </div>
  );
}
