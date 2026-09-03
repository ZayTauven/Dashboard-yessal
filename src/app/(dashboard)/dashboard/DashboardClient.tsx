"use client";

/*
 * Aiguillage du tableau de bord selon le rôle.
 *
 * Les quatre vues étaient chargées en `dynamic(..., { ssr: false })`. Ce
 * réglage venait probablement d'un souci d'hydratation avec Recharts, mais il
 * coûtait cher : le rendu serveur ne produisait RIEN pour la page la plus vue
 * du produit. L'utilisateur recevait la coque, puis un vide, puis le contenu
 * une fois le JavaScript téléchargé et exécuté — soit une éternité sur une
 * connexion mobile sénégalaise.
 *
 * Le rendu serveur est réactivé. Les graphiques ApexCharts n'y font pas
 * obstacle : <ApexChart> importe la librairie dans un effet et ne peint que
 * côté client, le serveur se contentant de réserver le conteneur à la bonne
 * hauteur. Le découpage en bundles reste assuré par `dynamic()` — on ne charge
 * toujours que la vue du rôle courant, pas les quatre.
 */

import dynamic from "next/dynamic";
import { StatRowSkeleton } from "@/components/vireo/Skeletons";

/* Le squelette sert de repli pendant le chargement du bundle de la vue. */
const loading = () => <StatRowSkeleton />;

const AdminDashboard = dynamic(() => import("@/components/dashboards/AdminDashboard"), { loading });
const MemberDashboard = dynamic(() => import("@/components/dashboards/MemberDashboard"), { loading });
const CollectorDashboard = dynamic(() => import("@/components/dashboards/CollectorDashboard"), {
  loading,
});
const ChefDashboard = dynamic(() => import("@/components/dashboards/ChefDashboard"), { loading });

/*
 * Le payload d'analytics change de forme selon le rôle : chaque vue déclare
 * précisément les champs qu'elle consomme. On ne modélise ici que le
 * discriminant, et on laisse chaque composant valider le reste.
 */
export interface DashboardStats {
  role?: "admin" | "chef_daara" | "collector" | "member" | string;
  [key: string]: unknown;
}

export function DashboardClient({ stats }: { stats: DashboardStats | null }) {
  const role = stats?.role || "member";

  switch (role) {
    case "admin":
      return <AdminDashboard stats={stats as never} />;
    case "chef_daara":
      return <ChefDashboard stats={stats as never} />;
    case "collector":
      return <CollectorDashboard stats={stats as never} />;
    default:
      return <MemberDashboard stats={stats as never} />;
  }
}
