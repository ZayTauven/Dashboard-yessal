"use client";

/*
 * ═══════════════════════════════════════════════════════════════════════════
 * Barre latérale — contrat DOM Vireo
 * ═══════════════════════════════════════════════════════════════════════════
 * Remplace la sidebar shadcn par la vraie coque Aurora : `.ax-sidebar`, avec
 * marque, filtre de menu, sections et arbre `role="tree"`.
 *
 * L'intérêt n'est pas cosmétique. Ce balisage débloque tout ce que le
 * Customizer pilote et qui n'existait tout simplement pas avant :
 *   · le rail repliable en mode icônes (`data-ax-collapsed`) ;
 *   · les six styles de rail et le mode détaché (`data-ax-shell-style`) ;
 *   · les cinq habillages de surface (clair, sombre, marque, dégradé,
 *     transparent) via `data-ax-sidebar` ;
 *   · le tiroir mobile (`data-ax-drawer="open"`), avec voile et verrou de
 *     défilement.
 *
 * Le filtre de menu est le petit détail qui compte au quotidien : vingt
 * entrées réparties en quatre sections, taper « ndig » suffit.
 */

import { useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, Search, X } from "lucide-react";
import { logoutAction } from "@/app/actions/auth";
import { memberDisplayName, memberInitials } from "@/types/member";
import {
  isActiveHref,
  matchesFilter,
  navSections,
  type NavCounts,
  type Role,
} from "@/lib/nav";

export interface SidebarUser {
  id?: number;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  avatar?: string | null;
  avatar_url?: string | null;
}

export interface ShellSidebarProps {
  role: Role;
  user?: SidebarUser | null;
  counts?: NavCounts;
  /** Ferme le tiroir mobile après navigation. */
  onNavigate?: () => void;
}

export function ShellSidebar({
  role,
  user,
  counts = {},
  onNavigate,
}: ShellSidebarProps) {
  const pathname = usePathname() || "/dashboard";
  const router = useRouter();
  const [filter, setFilter] = useState("");
  const [isPending, startTransition] = useTransition();
  const sections = navSections(role);

  const handleLogout = () => {
    startTransition(async () => {
      await logoutAction();
      router.push("/login");
    });
  };

  const avatarSrc = user?.avatar_url || user?.avatar || null;
  const displayName = user
    ? memberDisplayName({ ...user, id: user.id ?? 0 })
    : "Utilisateur";
  const initials = user ? memberInitials(user) : "?";

  return (
    <aside className="ax-sidebar" role="navigation" aria-label="Navigation principale">
      {/*
        Marque — on n'utilise PAS <BrandMark> ici. Vireo replie le rail en
        masquant `.ax-sidebar__wordmark` : il faut donc que le nom porte
        littéralement cette classe, sinon le texte déborde du rail replié.
        Le logo, lui, reste toujours visible — c'est le repère qui permet de
        revenir à l'accueil même en mode icônes.
      */}
      <div className="ax-sidebar__brand">
        <Link className="ax-sidebar__logo" href="/dashboard" aria-label="Accueil Yessal Gui">
          <span className="ax-sidebar__mark" aria-hidden="true">
            <Image src="/logo.svg" alt="" width={28} height={28} priority />
          </span>
          <span className="ax-sidebar__wordmark">Yessal Gui</span>
        </Link>
      </div>

      {/* ── Filtre de menu ── */}
      <div className="ax-sidebar__search">
        <Search className="ax-icon ax-sidebar__search-icon" size={18} aria-hidden="true" />
        <input
          type="search"
          className="ax-sidebar__filter"
          placeholder="Filtrer le menu…"
          aria-label="Filtrer le menu"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          onKeyDown={(e) => e.key === "Escape" && setFilter("")}
        />
        {filter && (
          <button
            type="button"
            className="ax-sidebar__filter-clear"
            onClick={() => setFilter("")}
            aria-label="Effacer le filtre"
          >
            <X className="ax-icon" size={16} aria-hidden="true" />
          </button>
        )}
      </div>

      {/* ── Arbre de navigation ── */}
      <nav className="ax-sidebar__nav" role="tree" aria-label="Menu principal">
        {sections.map((section) => {
          const visible = section.items.filter((i) => matchesFilter(i, filter));
          /* Une section dont aucune entrée ne correspond disparaît avec son
             titre — sinon le filtre laisse des en-têtes orphelins. */
          if (visible.length === 0) return null;

          return (
            <div key={section.id}>
              <p className="ax-sidebar__section" role="presentation">
                {section.label}
              </p>

              {visible.map((item) => {
                const active = isActiveHref(item.href, pathname);
                const Icon = item.icon;
                const badge = item.badgeKey ? counts[item.badgeKey] : undefined;

                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    className={[
                      "ax-nav__item",
                      active ? "ax-nav__item--active is-active" : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    role="treeitem"
                    aria-level={1}
                    aria-current={active ? "page" : undefined}
                    onClick={onNavigate}
                  >
                    <span className="ax-nav__bar" aria-hidden="true" />
                    <Icon className="ax-nav__icon" size={20} aria-hidden="true" />
                    <span className="ax-nav__label">{item.title}</span>
                    {typeof badge === "number" && badge > 0 && (
                      <span className="ax-nav__badge ax-nav__badge--count">{badge}</span>
                    )}
                  </Link>
                );
              })}
            </div>
          );
        })}
      </nav>

      {/*
        Pied du rail — bulle de profil + déconnexion, comme dans Vireo.

        Ce n'est pas de la décoration : c'est le seul endroit où l'identité du
        compte connecté reste visible en permanence. Sur une plateforme où un
        collecteur enregistre des dons AU NOM d'autres membres, savoir en un
        coup d’œil sous quel compte on agit évite les erreurs d'imputation.

        En rail replié, Vireo masque l'avatar et le bloc texte et ne garde que
        l'icône de déconnexion, centrée — d'où les classes exactes.
      */}
      <div className="ax-sidebar__foot">
        <div className="ax-sidebar__user">
          {/*
            <img> et non next/image : l'avatar arrive du backend en URL absolue
            (http://localhost:8000/media/…), un hôte que `remotePatterns`
            n'autorise pas — next/image lèverait une erreur à l'exécution.
            Vireo utilise lui aussi un <img> nu ici, et l'optimisation n'a
            aucun intérêt sur une vignette de 36 px.
          */}
          {avatarSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              className="ax-avatar ax-sidebar__user-avatar"
              src={avatarSrc}
              alt=""
              width={36}
              height={36}
            />
          ) : (
            <span
              className="ax-avatar ax-sidebar__user-avatar"
              aria-hidden="true"
              style={{
                display: "inline-grid",
                placeItems: "center",
                inlineSize: 36,
                blockSize: 36,
                fontSize: 12,
                fontWeight: 600,
                background:
                  "color-mix(in oklab, var(--ax-accent) 18%, var(--ax-surface-solid))",
                color: "var(--ax-accent)",
              }}
            >
              {initials}
            </span>
          )}

          <span className="ax-sidebar__user-meta">
            <b className="ax-sidebar__user-name">{displayName}</b>
            <small className="ax-sidebar__user-mail">{user?.email}</small>
          </span>

          <button
            type="button"
            className="ax-sidebar__logout"
            onClick={handleLogout}
            disabled={isPending}
            aria-label="Se déconnecter"
            title="Se déconnecter"
          >
            <LogOut className="ax-icon" size={20} aria-hidden="true" />
          </button>
        </div>
      </div>
    </aside>
  );
}

export default ShellSidebar;
