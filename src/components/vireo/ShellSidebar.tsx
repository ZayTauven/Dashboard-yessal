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

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import { Search } from "lucide-react";
import Image from "next/image";
import {
  isActiveHref,
  matchesFilter,
  navSections,
  type NavCounts,
  type Role,
} from "@/lib/nav";

export interface ShellSidebarProps {
  role: Role;
  counts?: NavCounts;
  /** Ferme le tiroir mobile après navigation. */
  onNavigate?: () => void;
}

export function ShellSidebar({ role, counts = {}, onNavigate }: ShellSidebarProps) {
  const pathname = usePathname() || "/dashboard";
  const [filter, setFilter] = useState("");
  const sections = navSections(role);

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
    </aside>
  );
}

export default ShellSidebar;
