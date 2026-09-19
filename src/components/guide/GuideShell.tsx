"use client";

/*
 * ═══════════════════════════════════════════════════════════════════════════
 * Yessal Guide — la coque
 * ═══════════════════════════════════════════════════════════════════════════
 * En-tête fin, rail de chapitres à gauche, colonne de lecture au centre. Le
 * guide se lit connecté — l'intergiciel protège `/guide` comme `/dashboard` —
 * mais dans un décor à lui : une colonne étroite, un sommaire de page, des
 * figures pleine largeur. D'où le bouton de retour au tableau de bord, bien
 * visible : on doit pouvoir rentrer chez soi d'un clic.
 *
 * La coque se contente de la structure. Les pages posent elles-mêmes leur
 * <main> et leur sommaire de page : ce sont des enfants directs de la grille,
 * donc des colonnes, et un chapitre peut décider de n'avoir pas de sommaire.
 *
 * Le bouton de thème ne rend RIEN de conditionnel : les deux icônes sont
 * toujours dans le DOM, et c'est le CSS qui en masque une. Brancher le rendu
 * sur `resolvedTheme` ferait diverger le HTML du serveur de celui du client —
 * le CSS, lui, connaît déjà le thème avant que React ne s'exécute.
 */

import { useEffect, useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { LayoutDashboard, Menu, Moon, Search, Sun, X } from "lucide-react";
import { GuideSidebar } from "./GuideSidebar";
import { GuideSearch } from "./GuideSearch";

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  return (
    <button
      type="button"
      className="ax-btn ax-btn--ghost ax-btn--icon"
      aria-label="Basculer le thème"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
    >
      <Sun
        size={16}
        className="rotate-0 scale-100 transition-transform dark:-rotate-90 dark:scale-0"
        aria-hidden="true"
      />
      <Moon
        size={16}
        className="absolute rotate-90 scale-0 transition-transform dark:rotate-0 dark:scale-100"
        aria-hidden="true"
      />
    </button>
  );
}

export function GuideShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [drawer, setDrawer] = useState(false);
  const [search, setSearch] = useState(false);

  /* Un changement de page ferme le tiroir : sinon on navigue derrière un
     panneau resté ouvert. */
  useEffect(() => setDrawer(false), [pathname]);

  /* Tiroir ouvert : la page dessous ne doit pas défiler. */
  useEffect(() => {
    if (!drawer) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [drawer]);

  return (
    <div className="yg">
      <div className="yg__glow" aria-hidden="true" />

      <header className="yg-header">
        <div className="yg-header__inner">
          <button
            type="button"
            className="ax-btn ax-btn--ghost ax-btn--icon lg:hidden"
            aria-label="Ouvrir le sommaire"
            aria-expanded={drawer}
            onClick={() => setDrawer(true)}
          >
            <Menu size={18} aria-hidden="true" />
          </button>

          <Link href="/guide" className="yg-header__brand">
            <span className="yg-header__mark">
              <Image src="/logo.svg" alt="" width={32} height={32} priority />
            </span>
            <span>
              <span className="yg-header__name">Yessal Guide</span>
              <span className="yg-header__tag">Prise en main</span>
            </span>
          </Link>

          <span className="yg-header__spacer" />

          <nav className="yg-header__links" aria-label="Liens du guide">
            <Link
              href="/guide/lexique"
              className={`yg-header__link${pathname === "/guide/lexique" ? " is-active" : ""}`}
            >
              Lexique
            </Link>
            <Link
              href="/guide/roles"
              className={`yg-header__link${pathname === "/guide/roles" ? " is-active" : ""}`}
            >
              Qui fait quoi
            </Link>
            <Link href="/contact" className="yg-header__link">
              Support
            </Link>
          </nav>

          <button
            type="button"
            className="yg-search-trigger"
            onClick={() => setSearch(true)}
          >
            <Search size={15} aria-hidden="true" />
            <span className="yg-search-trigger__label">Rechercher…</span>
            <kbd className="yg-kbd">⌘K</kbd>
          </button>

          <ThemeToggle />

          {/*
            Sous 576 px le libellé s'efface et le bouton se réduit à son icône :
            le titre du bouton reste annoncé aux lecteurs d'écran par
            `aria-label`, mais l'en-tête cesse de se battre pour la place avec
            la marque et la recherche.
          */}
          <Link
            href="/dashboard"
            className="ax-btn ax-btn--primary ax-btn--sm yg-header__cta"
            aria-label="Retour au tableau de bord"
          >
            <LayoutDashboard className="ax-btn__icon" size={14} aria-hidden="true" />
            <span className="ax-btn__label">Tableau de bord</span>
          </Link>
        </div>
      </header>

      <div className="yg-layout">
        <GuideSidebar />
        {children}
      </div>

      {drawer && (
        <div className="yg-drawer" role="dialog" aria-modal="true" aria-label="Sommaire">
          <div className="yg-drawer__panel">
            <div className="mb-4 flex items-center justify-between">
              <span className="yg-header__name">Sommaire</span>
              <button
                type="button"
                className="ax-btn ax-btn--ghost ax-btn--icon"
                aria-label="Fermer le sommaire"
                onClick={() => setDrawer(false)}
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>
            <GuideSidebar onNavigate={() => setDrawer(false)} />
          </div>
          <button
            type="button"
            className="yg-drawer__backdrop"
            aria-label="Fermer le sommaire"
            onClick={() => setDrawer(false)}
          />
        </div>
      )}

      <GuideSearch open={search} onOpenChange={setSearch} />
    </div>
  );
}
