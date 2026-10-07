"use client";

/*
 * ═══════════════════════════════════════════════════════════════════════════
 * Coque de l'application
 * ═══════════════════════════════════════════════════════════════════════════
 * `.ax-layout` → sidebar + `.ax-shell` (header + main + footer), plus les deux
 * calques en surimpression : panneau Apparence et palette ⌘K.
 *
 * C'est la structure qui remplace `SidebarProvider` de shadcn. La différence
 * n'est pas qu'un décor : cette géométrie est celle que les attributs
 * `data-ax-*` savent piloter. Sans elle, la moitié des réglages du Customizer
 * étaient présents dans le panneau mais sans effet — on proposait des boutons
 * qui ne faisaient rien.
 *
 * Le rail a deux comportements selon la largeur, gérés ici :
 *   · ≥ 992 px, le bouton replie le rail en mode icônes (`data-ax-collapsed`,
 *     persisté par Vireo) ;
 *   · en dessous, le rail devient un tiroir (`data-ax-drawer="open"`) avec
 *     voile et verrou de défilement, refermé par Échap, par le voile, ou par
 *     la navigation elle-même.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { useCustomizer } from "@/context/CustomizerContext";
import * as vireoTheme from "@/lib/vireo/theme";
import { ShellSidebar } from "./ShellSidebar";
import { ShellHeader } from "./ShellHeader";
import { Customizer } from "./Customizer";
import { QuickActions } from "./QuickActions";
import { AmbientBackdrop } from "./AmbientBackdrop";
import { getTitleRequests, getPendingDocuments } from "@/app/actions/users";
import type { NotificationDto } from "@/app/actions/notifications";
import type { NavCounts, Role } from "@/lib/nav";

/** Seuil de bascule rail ↔ tiroir. Doit suivre --ax-bp-lg de Vireo (992 px). */
const DESKTOP_QUERY = "(min-width: 992px)";

/* Déclinaison figée pour tout rôle autre qu'admin, validée par le client sur
   capture : clés du `REGISTRY` de `lib/vireo/theme.ts`. */
const MEMBER_APPEARANCE: Record<string, string> = {
  "shell-style": "detached",
  "sidebar-scheme": "dark",
};

/* Témoin du ménage unique des réglages d'un membre. Changer la version
   relance ce ménage chez tous les membres au prochain chargement. */
const MEMBER_RESET_KEY = "yessal:apparence-membre";
const MEMBER_RESET_VERSION = "1";

/* localStorage peut lever (navigation privée, stockage bloqué) : sans lui, on
   refait simplement le ménage à chaque chargement. */
function readFlag(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeFlag(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* stockage indisponible : rien à retenir */
  }
}

export interface AppShellProps {
  user?: {
    first_name?: string | null;
    last_name?: string | null;
    email?: string | null;
    role?: string | null;
    avatar?: string | null;
    avatar_url?: string | null;
    title_name?: string | null;
  } | null;
  notificationPreview: NotificationDto[];
  /** Bandeau de complétion de profil, rendu au-dessus du contenu. */
  banner?: React.ReactNode;
  children: React.ReactNode;
}

export function AppShell({
  user,
  notificationPreview,
  banner,
  children,
}: AppShellProps) {
  const pathname = usePathname() || "/dashboard";
  const c = useCustomizer();
  const role = ((user?.role as Role) ?? "member") as Role;

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(true);
  const [customizerOpen, setCustomizerOpen] = useState(false);
  const [quickOpen, setQuickOpen] = useState(false);
  const [counts, setCounts] = useState<NavCounts>({});
  const { setTheme } = useTheme();

  /*
   * Apparence figée hors admin — demande du client : le panneau Apparence ne
   * sert qu'à l'administrateur. Les autres rôles voient la déclinaison retenue
   * par le client (`MEMBER_APPEARANCE` : coque détachée, barre latérale
   * sombre, violet Yessal), en thème clair par défaut ; seule la bascule
   * clair / sombre de l'en-tête leur reste.
   *
   * Masquer le panneau ne suffit pas : un talibé qui avait déjà choisi un
   * autre accent le garderait à vie, puisque le script d'en-tête
   * `RESTORE_AX_ATTRS` réapplique les clés `ax:*` à chaque chargement. On les
   * efface donc — mais UNE SEULE FOIS par navigateur (`MEMBER_RESET_KEY`,
   * hors des clés `ax:*` que `reset()` efface) : refaire le ménage à chaque
   * chargement annulerait aussi le mode sombre que le membre a choisi. La
   * déclinaison, elle, est reposée à chaque montage ; persistée, elle est
   * réappliquée avant React dès la visite suivante, sans flash.
   *
   * `reset()` repose `lang="en"` sur <html> (comportement d'origine de
   * Vireo) : on remet la langue de la page, sans quoi les lecteurs d'écran
   * liraient le français avec une voix anglaise.
   */
  const appearanceLocked = role !== "admin";
  const appearanceResetDone = useRef(false);
  useEffect(() => {
    if (!appearanceLocked || appearanceResetDone.current) return;
    appearanceResetDone.current = true;
    if (readFlag(MEMBER_RESET_KEY) !== MEMBER_RESET_VERSION) {
      const D = document.documentElement;
      const lang = D.getAttribute("lang") || "fr";
      vireoTheme.reset();
      D.setAttribute("lang", lang);
      setTheme("light");
      writeFlag(MEMBER_RESET_KEY, MEMBER_RESET_VERSION);
    }
    for (const [name, value] of Object.entries(MEMBER_APPEARANCE)) {
      vireoTheme.setByName(name, value);
    }
  }, [appearanceLocked, setTheme]);

  /* Largeur : on écoute la media query plutôt que window.innerWidth pour
     éviter de recalculer à chaque pixel de redimensionnement. */
  useEffect(() => {
    const mql = window.matchMedia(DESKTOP_QUERY);
    const apply = () => setIsDesktop(mql.matches);
    apply();
    mql.addEventListener("change", apply);
    return () => mql.removeEventListener("change", apply);
  }, []);

  /* Le tiroir vit sur <html> : c'est là que le CSS de Vireo le lit. */
  useEffect(() => {
    const D = document.documentElement;
    if (drawerOpen && !isDesktop) {
      D.setAttribute("data-ax-drawer", "open");
      D.setAttribute("data-ax-scroll-lock", "");
    } else {
      D.removeAttribute("data-ax-drawer");
      D.removeAttribute("data-ax-scroll-lock");
    }
    return () => {
      D.removeAttribute("data-ax-drawer");
      D.removeAttribute("data-ax-scroll-lock");
    };
  }, [drawerOpen, isDesktop]);

  /* Naviguer referme le tiroir : sinon il masque la page qu'on vient d'ouvrir. */
  useEffect(() => setDrawerOpen(false), [pathname]);

  /* Échap referme le tiroir. Le panneau Apparence et la palette gèrent le leur. */
  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setDrawerOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [drawerOpen]);

  /* Compteurs des pastilles — réservés à l'admin, qui seul voit Pilotage. */
  useEffect(() => {
    if (role !== "admin") return;
    let cancelled = false;
    (async () => {
      const [titleReqs, docs] = await Promise.all([
        getTitleRequests(),
        getPendingDocuments(),
      ]);
      if (cancelled) return;
      const pendingTitles = (titleReqs.data || []).filter(
        (req: { status?: string }) => req.status === "pending",
      ).length;
      const pendingDocs = (docs.data || []).length;
      setCounts({ pilotage: pendingTitles + pendingDocs });
    })();
    return () => {
      cancelled = true;
    };
  }, [role]);

  const toggleRail = useCallback(() => {
    if (isDesktop) c.toggleCollapsed();
    else setDrawerOpen((o) => !o);
  }, [isDesktop, c]);

  return (
    <>
      <AmbientBackdrop />

      <div className="ax-layout">
        <ShellSidebar
          role={role}
          user={user}
          counts={counts}
          onNavigate={() => setDrawerOpen(false)}
        />

        <div className="ax-shell">
          <ShellHeader
            user={user}
            notificationPreview={notificationPreview}
            onToggleRail={toggleRail}
            onOpenQuickActions={() => setQuickOpen(true)}
            onOpenCustomizer={
              appearanceLocked ? undefined : () => setCustomizerOpen(true)
            }
            railExpanded={isDesktop ? !c.collapsed : drawerOpen}
          />

          <main className="ax-main" id="ax-main">
            <div>
              {banner}
              {children}
            </div>
          </main>

          <footer className="ax-footer">
            <span>
              Yessal Gui — plateforme de gestion des Jëfs et des Ndiguels
            </span>
            <span className="ax-footer__links">
              <a href="/dashboard/notifications">Notifications</a>
              <a href="/dashboard/profile">Mon profil</a>
            </span>
          </footer>
        </div>
      </div>

      {/* Voile du tiroir mobile — bouton plutôt que div : cliquable au clavier. */}
      {drawerOpen && !isDesktop && (
        <button
          type="button"
          className="ax-backdrop"
          onClick={() => setDrawerOpen(false)}
          aria-label="Fermer le menu"
        />
      )}

      {!appearanceLocked && (
        <Customizer open={customizerOpen} onClose={() => setCustomizerOpen(false)} />
      )}
      <QuickActions role={role} open={quickOpen} onOpenChange={setQuickOpen} />
    </>
  );
}

export default AppShell;
