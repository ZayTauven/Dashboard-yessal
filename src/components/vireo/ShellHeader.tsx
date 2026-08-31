"use client";

/*
 * ═══════════════════════════════════════════════════════════════════════════
 * Barre supérieure — contrat DOM Vireo
 * ═══════════════════════════════════════════════════════════════════════════
 * `.ax-header` : bascule du rail, recherche ⌘K, puis les commandes à droite.
 *
 * Deux comportements que l'ancienne barre n'avait pas :
 *   · la bascule du rail est contextuelle — sur mobile elle ouvre le tiroir,
 *     sur desktop elle replie le rail en mode icônes. Un seul bouton, deux
 *     sens, parce que c'est le même geste mental ;
 *   · l'ombre portée n'apparaît qu'une fois la page défilée (`is-scrolled`),
 *     ce qui évite la barre qui « flotte » sur un contenu court.
 *
 * Tout ce qui existait est conservé : cloche de notifications, menu profil,
 * déconnexion. Les composants Radix sous-jacents (DropdownMenu) sont gardés —
 * ils gèrent le clavier et le focus correctement, ce qu'un menu maison ferait
 * moins bien.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import {
  LogOut,
  Menu,
  Moon,
  Palette,
  Search,
  Settings,
  Sun,
  User as UserIcon,
} from "lucide-react";
import { useTheme } from "next-themes";
import { logoutAction } from "@/app/actions/auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NotificationBell } from "@/components/NotificationBell";
import type { NotificationDto } from "@/app/actions/notifications";
import { ROLE_LABEL } from "@/types/member";

export interface ShellHeaderProps {
  user?: {
    first_name?: string | null;
    last_name?: string | null;
    email?: string | null;
    role?: string | null;
    avatar?: string | null;
    avatar_url?: string | null;
  } | null;
  notificationPreview: NotificationDto[];
  onToggleRail: () => void;
  onOpenQuickActions: () => void;
  onOpenCustomizer: () => void;
  railExpanded: boolean;
}

export function ShellHeader({
  user,
  notificationPreview,
  onToggleRail,
  onOpenQuickActions,
  onOpenCustomizer,
  railExpanded,
}: ShellHeaderProps) {
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();
  const [isPending, startTransition] = useTransition();
  const [scrolled, setScrolled] = useState(false);

  /* L'ombre de la barre n'apparaît qu'une fois le contenu passé dessous. */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleLogout = () => {
    startTransition(async () => {
      await logoutAction();
      router.push("/login");
    });
  };

  const initials =
    `${user?.first_name?.[0] ?? ""}${user?.last_name?.[0] ?? ""}`.toUpperCase() || "U";
  const fullName =
    [user?.first_name, user?.last_name].filter(Boolean).join(" ") || "Utilisateur";
  const roleLabel = ROLE_LABEL[(user?.role ?? "").toString()] ?? "Membre";

  return (
    <header className={`ax-header${scrolled ? " is-scrolled" : ""}`} role="banner">
      {/* ── Bascule du rail / tiroir ── */}
      <button
        type="button"
        className="ax-nav-toggle ax-icon-btn"
        onClick={onToggleRail}
        aria-label={railExpanded ? "Replier le menu" : "Déplier le menu"}
        aria-expanded={railExpanded}
      >
        <Menu className="ax-icon" size={20} aria-hidden="true" />
      </button>

      {/* ── Recherche ⌘K ── */}
      <button
        type="button"
        className="ax-search"
        onClick={onOpenQuickActions}
        aria-haspopup="dialog"
        aria-label="Rechercher une action ou une page"
      >
        <Search className="ax-icon ax-search__icon" size={18} aria-hidden="true" />
        <span className="ax-search__placeholder">Rechercher une action…</span>
        <kbd className="ax-search__keycap">⌘K</kbd>
      </button>

      <span className="ax-header__spacer" />

      {/* ── Salutation ── */}
      <span className="me-1 hidden text-sm text-text-muted lg:inline">
        Bonjour,{" "}
        <span className="font-semibold text-text-strong">
          {user?.first_name || "Talibé"}
        </span>
      </span>

      {/* ── Notifications ── */}
      <NotificationBell items={notificationPreview} />

      {/* ── Bascule rapide clair / sombre ── */}
      <button
        type="button"
        className="ax-icon-btn"
        onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
        aria-label={
          resolvedTheme === "dark" ? "Passer en mode clair" : "Passer en mode sombre"
        }
      >
        {resolvedTheme === "dark" ? (
          <Sun className="ax-icon" size={19} aria-hidden="true" />
        ) : (
          <Moon className="ax-icon" size={19} aria-hidden="true" />
        )}
      </button>

      {/* ── Panneau Apparence ── */}
      <button
        type="button"
        className="ax-icon-btn"
        onClick={onOpenCustomizer}
        aria-label="Ouvrir le panneau d'apparence"
        aria-controls="ax-customizer"
      >
        <Palette className="ax-icon" size={19} aria-hidden="true" />
      </button>

      {/* ── Menu profil ── */}
      <DropdownMenu>
        <DropdownMenuTrigger className="ax-profile__trigger outline-none" aria-label="Menu du profil">
          <Avatar className="size-9">
            <AvatarImage
              src={user?.avatar_url || user?.avatar || undefined}
              alt=""
              className="object-cover"
            />
            <AvatarFallback
              className="text-[11px] font-semibold uppercase"
              style={{
                background:
                  "color-mix(in oklab, var(--ax-accent) 18%, var(--ax-surface-solid))",
                color: "var(--ax-accent)",
              }}
            >
              {initials}
            </AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-60">
          <DropdownMenuLabel className="flex flex-col gap-0.5">
            <span className="truncate font-semibold">{fullName}</span>
            <span className="truncate text-xs font-normal text-text-subtle">
              {user?.email}
            </span>
            <span className="mt-1.5 w-fit rounded-pill bg-accent px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-accent-foreground">
              {roleLabel}
            </span>
          </DropdownMenuLabel>

          <DropdownMenuSeparator />

          <DropdownMenuItem asChild>
            <Link href="/dashboard/profile" className="cursor-pointer gap-2">
              <UserIcon size={16} aria-hidden="true" /> Mon profil
            </Link>
          </DropdownMenuItem>

          <DropdownMenuItem onSelect={onOpenCustomizer} className="cursor-pointer gap-2">
            <Settings size={16} aria-hidden="true" /> Apparence
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            onSelect={handleLogout}
            disabled={isPending}
            className="cursor-pointer gap-2 text-danger focus:text-danger"
          >
            <LogOut size={16} aria-hidden="true" />
            {isPending ? "Déconnexion…" : "Se déconnecter"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}

export default ShellHeader;
