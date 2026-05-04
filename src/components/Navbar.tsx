"use client";

import { LogOut, Moon, Settings, Sun, User as UserIcon, ChevronRight, Home } from "lucide-react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useTransition } from "react";
import { logoutAction } from "@/app/actions/auth";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Button } from "./ui/button";
import { useTheme } from "next-themes";
import { SidebarTrigger } from "./ui/sidebar";
import { NotificationBell } from "@/components/NotificationBell";
import type { NotificationDto } from "@/app/actions/notifications";

// Mapping des segments d'URL vers des labels lisibles
const BREADCRUMB_LABELS: Record<string, string> = {
  dashboard: "Tableau de bord",
  events: "Actualités",
  campaigns: "Ndiguels",
  donations: "Les Jëfs",
  collect: "Collecte",
  members: "Talibés",
  daara: "Mon Daara",
  tutelles: "Tutelles",
  notifications: "Notifications",
  chat: "Messagerie",
  profile: "Profil",
  admin: "Administration",
  users: "Utilisateurs et rôles",
  announcements: "Annonces",
  audit: "Logs d'Audit",
  roles: "Rôles",
};

function Breadcrumb({ pathname }: { pathname: string }) {
  const segments = pathname.split("/").filter(Boolean);
  // On skip le premier segment "dashboard" pour ne pas le doubler si déjà au root
  const crumbs = segments.map((seg, idx) => {
    const href = "/" + segments.slice(0, idx + 1).join("/");
    const label = BREADCRUMB_LABELS[seg] || seg;
    const isLast = idx === segments.length - 1;
    return { href, label, isLast };
  });

  if (crumbs.length <= 1) return null; // Pas de fil sur la page racine /dashboard

  return (
    <nav aria-label="Fil d'Ariane" className="hidden md:flex items-center gap-1.5 text-xs text-muted-foreground">
      <Home size={12} />
      {crumbs.map((crumb) => (
        <span key={crumb.href} className="flex items-center gap-1.5">
          <ChevronRight size={11} className="opacity-40" />
          {crumb.isLast ? (
            <span className="font-bold" style={{ color: "var(--foreground)" }}>
              {crumb.label}
            </span>
          ) : (
            <Link
              href={crumb.href}
              className="hover:text-foreground transition-colors font-medium"
            >
              {crumb.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
}

const Navbar = ({
  user,
  notificationPreview = [],
}: {
  user?: {
    first_name?: string;
    last_name?: string;
    role?: string;
    avatar?: string | null;
    avatar_url?: string | null;
  } | null;
  notificationPreview?: NotificationDto[];
}) => {
  const { setTheme } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const handleLogout = () => {
    startTransition(async () => {
      await logoutAction();
      router.push("/login");
    });
  };

  return (
    <nav className="p-4 flex items-center justify-between sticky top-0 bg-background/80 backdrop-blur-md z-10 border-b" style={{ borderColor: "var(--border)" }}>
      {/* LEFT — Trigger + Breadcrumb */}
      <div className="flex items-center gap-3">
        <SidebarTrigger />
        <Breadcrumb pathname={pathname} />
      </div>

      {/* RIGHT */}
      <div className="flex items-center gap-4 text-sm font-medium">
        <span className="hidden md:inline text-muted-foreground">
          Bonjour,{" "}
          <span className="text-foreground font-bold">
            {user?.first_name || "Talibe"}
          </span>
        </span>

        {/* THEME MENU */}
        <NotificationBell items={notificationPreview} />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" aria-label="Changer le thème">
              <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setTheme("light")}>☀️ Clair</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("dark")}>🌙 Sombre</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("system")}>💻 Système</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* USER MENU */}
        <DropdownMenu>
          <DropdownMenuTrigger className="outline-none group">
            <Avatar className="h-9 w-9 border-2 border-yessal-green/20 group-hover:border-yessal-green group-hover:scale-105 transition-all duration-300 shadow-sm" style={{ borderColor: "var(--yessal-green-20)" }}>
              <AvatarImage src={user?.avatar || user?.avatar_url || undefined} className="object-cover" />
              <AvatarFallback
                className="text-white font-black text-[10px] uppercase"
                style={{ background: "var(--yessal-green)" }}
              >
                {user?.first_name?.charAt(0) || "U"}
                {user?.last_name?.charAt(0) || ""}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent sideOffset={10} align="end" className="w-56">
            <DropdownMenuLabel className="p-4 flex flex-col gap-1 border-b mb-1" style={{ borderColor: "var(--border)" }}>
              <span className="text-sm font-bold truncate">
                {user?.first_name || "Utilisateur"} {user?.last_name || ""}
              </span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-black flex items-center gap-1">
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ background: "var(--yessal-green)" }}
                />
                {user?.role === "member" ? "Talibé" : user?.role || "Talibé"}
              </span>
            </DropdownMenuLabel>
            <DropdownMenuItem asChild>
              <Link href="/dashboard/profile" className="flex items-center w-full cursor-pointer py-2">
                <UserIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                Profil
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer py-2">
              <Settings className="h-4 w-4 mr-2 text-muted-foreground" />
              Paramètres
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              className="cursor-pointer py-2"
              disabled={isPending}
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4 mr-2" />
              {isPending ? "Déconnexion..." : "Déconnexion"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  );
};

export default Navbar;
