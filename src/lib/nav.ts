/*
 * ═══════════════════════════════════════════════════════════════════════════
 * Arborescence de navigation
 * ═══════════════════════════════════════════════════════════════════════════
 * Vireo pilote sa barre latérale par un manifeste JSON générique (186 routes,
 * alias, sections, mots-clés). On garde l'IDÉE — une seule source de vérité
 * pour la sidebar, le fil d'Ariane et la palette ⌘K — mais on l'écrit en TS
 * typé plutôt qu'en JSON : notre arbre fait vingt entrées, il est filtré par
 * rôle, et les icônes viennent de lucide (déjà une dépendance) au lieu du
 * registre de chemins Tabler.
 *
 * Le filtrage par rôle est calculé ici, une fois, et sert partout. C'était
 * jusqu'ici recopié à trois endroits avec des variantes — d'où des libellés
 * qui divergeaient (« Les Jëfs » / « Mes Jëfs ») selon l'écran.
 */

import {
  Bell,
  Building2,
  CalendarDays,
  HandCoins,
  Landmark,
  LayoutDashboard,
  MessageSquare,
  Newspaper,
  ScrollText,
  Settings,
  UserCheck,
  Users,
  UsersRound,
  Wallet,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type Role = "admin" | "chef_daara" | "collector" | "member" | "tutelle";

export interface NavLeaf {
  id: string;
  title: string;
  href: string;
  icon: LucideIcon;
  /** Rôles autorisés. Absent ⇒ visible par tous. */
  roles?: Role[];
  /** Mots que l'on pourrait taper dans le filtre et qui ne sont pas dans le
   *  libellé : « don » pour Jëf, « campagne » pour Ndiguel. */
  keywords?: string[];
  /** Clé de compteur résolue à l'exécution (voir `NavCounts`). */
  badgeKey?: keyof NavCounts;
}

export interface NavSection {
  id: string;
  label: string;
  roles?: Role[];
  items: NavLeaf[];
}

/** Compteurs chargés côté client et injectés dans les pastilles. */
export interface NavCounts {
  pilotage?: number;
  notifications?: number;
}

/*
 * Les libellés varient selon le rôle : un admin voit « Les Jëfs » (tous),
 * un chef de Daara « Jëfs du Daara », un membre « Mes Jëfs ». C'est une
 * distinction utile, pas un caprice — elle dit à qui appartiennent les
 * données affichées.
 */
function donationsTitle(role: Role): string {
  if (role === "admin") return "Les Jëfs";
  if (role === "chef_daara") return "Jëfs du Daara";
  return "Mes Jëfs";
}

function membersTitle(role: Role): string {
  return role === "admin" ? "Liste des Talibés" : "Talibés du Daara";
}

export function navSections(role: Role): NavSection[] {
  const sections: NavSection[] = [
    {
      id: "app",
      label: "Application",
      items: [
        {
          id: "dashboard",
          title: "Tableau de bord",
          href: "/dashboard",
          icon: LayoutDashboard,
          keywords: ["accueil", "kpi", "statistiques"],
        },
        {
          id: "news",
          title: "Actualités",
          href: "/dashboard/news",
          icon: Newspaper,
          keywords: ["articles", "publications"],
        },
        {
          id: "notifications",
          title: "Notifications",
          href: "/dashboard/notifications",
          icon: Bell,
          badgeKey: "notifications",
        },
      ],
    },
    {
      id: "gestion",
      label: "Gestion",
      items: [
        {
          id: "events",
          title: "Fêtes",
          href: "/dashboard/events",
          icon: CalendarDays,
          roles: ["admin"],
          keywords: ["événements", "magal", "gamou", "agenda"],
        },
        {
          id: "campaigns",
          title: "Les Ndiguels",
          href: "/dashboard/campaigns",
          icon: Landmark,
          keywords: ["campagnes", "collecte", "objectif"],
        },
        {
          id: "collect",
          title: "Collecte physique",
          href: "/dashboard/collect",
          icon: HandCoins,
          roles: ["admin", "collector", "chef_daara"],
          keywords: ["espèces", "terrain", "encaisser"],
        },
        {
          id: "donations",
          title: donationsTitle(role),
          href: "/dashboard/donations",
          icon: Wallet,
          keywords: ["dons", "versements", "historique", "fcfa"],
        },
      ],
    },
    {
      id: "communaute",
      label: "Communauté",
      items: [
        {
          id: "daara",
          title: "Mon Daara",
          href: "/dashboard/daara",
          icon: UsersRound,
          roles: ["chef_daara", "collector", "member", "tutelle"],
        },
        {
          id: "chat",
          title: "Messagerie",
          href: "/dashboard/chat",
          icon: MessageSquare,
          keywords: ["discussion", "conversation", "messages"],
        },
        {
          id: "members",
          title: membersTitle(role),
          href: "/dashboard/members",
          icon: Users,
          roles: ["admin", "chef_daara", "collector"],
          keywords: ["membres", "annuaire", "talibés"],
        },
        {
          id: "tutelles",
          title: "Tutelles",
          href: "/dashboard/tutelles",
          icon: UserCheck,
          roles: ["member", "collector"],
          keywords: ["proches", "famille"],
        },
      ],
    },
    {
      id: "admin",
      label: "Administration",
      roles: ["admin"],
      items: [
        {
          id: "admin-daara",
          title: "Gestion des Daaras",
          href: "/dashboard/admin/daara",
          icon: Building2,
          keywords: ["zones territoriales", "ldd"],
        },
        {
          id: "admin-users",
          title: "Utilisateurs et rôles",
          href: "/dashboard/admin/users",
          icon: Users,
          keywords: ["permissions", "comptes"],
        },
        {
          id: "campaign-metrics",
          title: "Performance Ndiguels",
          href: "/dashboard/admin/campaign-metrics",
          icon: Landmark,
          keywords: ["métriques", "rendement"],
        },
        {
          id: "announcements",
          title: "Annonces Hub",
          href: "/dashboard/admin/announcements",
          icon: Bell,
          keywords: ["communication", "diffusion"],
        },
        {
          id: "audit",
          title: "Logs d'audit",
          href: "/dashboard/admin/audit",
          icon: ScrollText,
          keywords: ["traçabilité", "journal"],
        },
        {
          id: "pilotage",
          title: "Pilotage du système",
          href: "/dashboard/admin/pilotage",
          icon: Settings,
          badgeKey: "pilotage",
          keywords: ["titres", "validation", "virements", "réglages"],
        },
      ],
    },
  ];

  return sections
    .filter((s) => !s.roles || s.roles.includes(role))
    .map((s) => ({ ...s, items: s.items.filter((i) => !i.roles || i.roles.includes(role)) }))
    .filter((s) => s.items.length > 0);
}

/**
 * Entrée active pour un chemin donné.
 *
 * `/dashboard` est un préfixe de tout le reste : sans le cas particulier,
 * « Tableau de bord » resterait allumé sur les 28 pages. Pour les autres, on
 * garde le préfixe pour que `/dashboard/campaigns/12/etat` allume bien
 * « Les Ndiguels ».
 */
export function isActiveHref(href: string, pathname: string): boolean {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(href + "/");
}

/** Fil d'Ariane : la section et l'entrée correspondant au chemin courant. */
export function trailFor(
  pathname: string,
  role: Role,
): { section: NavSection; item: NavLeaf } | null {
  for (const section of navSections(role)) {
    for (const item of section.items) {
      if (isActiveHref(item.href, pathname)) return { section, item };
    }
  }
  return null;
}

/** Correspondance pour le champ de filtre de la barre latérale. */
export function matchesFilter(item: NavLeaf, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  if (item.title.toLowerCase().includes(q)) return true;
  return (item.keywords || []).some((k) => k.toLowerCase().includes(q));
}
