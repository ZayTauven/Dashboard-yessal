"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { logoutAction } from "@/app/actions/auth";
import {
  LayoutDashboard,
  Bell,
  MessageSquare,
  CalendarDays,
  Landmark,
  HandCoins,
  Users,
  UsersRound,
  UserCheck,
  Building2,
  ShieldCheck,
  ScrollText,
  User,
  ChevronUp,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "./ui/sidebar";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

// ── Navigation structure Yessal Gui ──────────────────────────────────────────

const navApplication = [
  {
    title: "Tableau de bord",
    url: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Notifications",
    url: "/dashboard/notifications",
    icon: Bell,
    badge: "3",
  },
  {
    title: "Messagerie",
    url: "/dashboard/chat",
    icon: MessageSquare,
  },
];

const navGestion = [
  {
    title: "Événements",
    url: "/dashboard/events",
    icon: CalendarDays,
  },
  {
    title: "Campagnes (Jëfs)",
    url: "/dashboard/campaigns",
    icon: Landmark,
  },
  {
    title: "Dons",
    url: "/dashboard/donations",
    icon: HandCoins,
  },
];

const navCommunaute = [
  {
    title: "Mon Daara",
    url: "/dashboard/daara",
    icon: UsersRound,
  },
  {
    title: "Membres",
    url: "/dashboard/members",
    icon: Users,
  },
  {
    title: "Tutelles",
    url: "/dashboard/tutelles",
    icon: UserCheck,
  },
];

const navAdmin = [
  {
    title: "Gestion des Daaras",
    url: "/dashboard/admin/daara",
    icon: Building2,
  },
  {
    title: "Gestion des rôles",
    url: "/dashboard/admin/roles",
    icon: ShieldCheck,
  },
  {
    title: "Journaux d'audit",
    url: "/dashboard/admin/audit",
    icon: ScrollText,
  },
];

// ─────────────────────────────────────────────────────────────────────────────

const AppSidebar = () => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleLogout = () => {
    startTransition(async () => {
      await logoutAction();
      router.push("/login");
    });
  };

  return (
    <Sidebar collapsible="icon">
      {/* ── En-tête : Logo Yessal Gui ── */}
      <SidebarHeader className="py-5 px-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link href="/dashboard" className="flex items-center gap-3">
                {/* Icône logo — carré vert */}
                <div
                  className="flex-shrink-0 flex items-center justify-center rounded-md"
                  style={{
                    width: "22px",
                    height: "22px",
                    background: "var(--yessal-green)",
                  }}
                >
                  <span
                    style={{
                      color: "#FAFAF8",
                      fontSize: "11px",
                      fontWeight: 700,
                      lineHeight: 1,
                    }}
                  >
                    Y
                  </span>
                </div>
                <span
                  className="text-sm font-medium"
                  style={{ color: "var(--foreground)", letterSpacing: "-0.01em" }}
                >
                  Yessal Gui
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent>
        {/* ── Application ── */}
        <SidebarGroup>
          <SidebarGroupLabel>Application</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navApplication.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link href={item.url}>
                      <item.icon size={16} strokeWidth={1.5} />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                  {item.badge && (
                    <SidebarMenuBadge>{item.badge}</SidebarMenuBadge>
                  )}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* ── Gestion ── */}
        <SidebarGroup>
          <SidebarGroupLabel>Gestion</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navGestion.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link href={item.url}>
                      <item.icon size={16} strokeWidth={1.5} />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* ── Communauté ── */}
        <SidebarGroup>
          <SidebarGroupLabel>Communauté</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navCommunaute.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link href={item.url}>
                      <item.icon size={16} strokeWidth={1.5} />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* ── Administration ── */}
        <SidebarGroup>
          <SidebarGroupLabel>Administration</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navAdmin.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link href={item.url}>
                      <item.icon size={16} strokeWidth={1.5} />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* ── Pied : Profil utilisateur ── */}
      <SidebarSeparator />
      <SidebarFooter className="pb-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton className="gap-3">
                  {/* Avatar */}
                  <div
                    className="flex-shrink-0 flex items-center justify-center rounded-full"
                    style={{
                      width: "24px",
                      height: "24px",
                      background: "var(--accent)",
                      border: "1px solid var(--border)",
                    }}
                  >
                    <User size={13} strokeWidth={1.5} style={{ color: "var(--muted-foreground)" }} />
                  </div>
                  <div className="flex flex-col items-start text-left gap-0">
                    <span className="text-xs font-medium" style={{ color: "var(--foreground)" }}>
                      Abdoulaye Diallo
                    </span>
                    <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                      Administrateur
                    </span>
                  </div>
                  <ChevronUp size={14} strokeWidth={1.5} className="ml-auto" style={{ color: "var(--muted-foreground)" }} />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" side="top">
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/profile">Mon profil</Link>
                </DropdownMenuItem>
                <DropdownMenuItem>Paramètres</DropdownMenuItem>
                <DropdownMenuItem disabled={isPending} onClick={handleLogout}>
                  {isPending ? "Déconnexion..." : "Déconnexion"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
};

export default AppSidebar;
