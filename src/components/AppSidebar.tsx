"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter, usePathname } from "next/navigation";
import { logoutAction } from "@/app/actions/auth";
import { BrandMark } from "@/components/BrandMark";
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
  ScrollText,
  User,
  ChevronUp,
  Wallet,
  Settings,
  Newspaper,
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
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { getPendingDocuments, getTitleRequests } from "@/app/actions/users";

interface AppSidebarProps {
  user?: {
    user_id: number;
    email: string;
    first_name: string;
    last_name: string;
    avatar?: string | null;
    avatar_url?: string | null;
    role: "admin" | "chef_daara" | "collector" | "member" | "tutelle";
  };
}

const AppSidebar = ({ user }: AppSidebarProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [pendingTitleCount, setPendingTitleCount] = useState(0);
  const [pendingDocumentCount, setPendingDocumentCount] = useState(0);

  const handleLogout = () => {
    startTransition(async () => {
      await logoutAction();
      router.push("/login");
    });
  };

  useEffect(() => {
    if (user?.role !== "admin") return;
    (async () => {
      const [titleReqs, docs] = await Promise.all([
        getTitleRequests(),
        getPendingDocuments(),
      ]);
      const pendingTitles = (titleReqs.data || []).filter(
        (req: { status?: string }) => req.status === "pending",
      ).length;
      setPendingTitleCount(pendingTitles);
      setPendingDocumentCount((docs.data || []).length);
    })();
  }, [user?.role]);

  const isActive = (url: string) => {
    if (url === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(url);
  };

  // ── Navigation logic based on role ──────────────────────────────────────────

  const navApplication = [
    { title: "Tableau de bord", url: "/dashboard", icon: LayoutDashboard },
    {
      title: "Actualités",
      url: "/dashboard/news",
      icon: Newspaper,
    },
    {
      title: "Notifications",
      url: "/dashboard/notifications",
      icon: Bell,
    },
  ];

  const donationsTitle =
    user?.role === "admin"
      ? "Les Jëfs"
      : user?.role === "chef_daara"
        ? "Jëfs du Daara"
        : "Mes Jëfs";

  const navGestion = [
    {
      title: "Fêtes",
      url: "/dashboard/events",
      icon: CalendarDays,
      roles: ["admin"],
    },
    { title: "Les Ndiguels", url: "/dashboard/campaigns", icon: Landmark },
    {
      title: "Collecte (Physique)",
      url: "/dashboard/collect",
      icon: HandCoins,
      roles: ["admin", "collector", "chef_daara"],
    },
    { title: donationsTitle, url: "/dashboard/donations", icon: Wallet },
  ].filter((item) => !item.roles || (user && item.roles.includes(user.role)));

  const showTutelles =
    user?.role === "member" || user?.role === "collector";

  const navCommunaute = [
    ...(user?.role !== "admin"
      ? [
          {
            title: "Mon Daara",
            url: "/dashboard/daara",
            icon: UsersRound,
          },
        ]
      : []),
    { title: "Messagerie", url: "/dashboard/chat", icon: MessageSquare },
    ...(user?.role === "admin"
      ? [{ title: "Liste des Talibés", url: "/dashboard/members", icon: Users }]
      : []),
    ...(user?.role === "chef_daara" || user?.role === "collector"
      ? [
          {
            title: "Talibés du Daara",
            url: "/dashboard/members",
            icon: Users,
          },
        ]
      : []),
    ...(showTutelles
      ? [{ title: "Tutelles", url: "/dashboard/tutelles", icon: UserCheck }]
      : []),
  ];

  const navAdmin = [
    {
      title: "Gestion des Daaras",
      url: "/dashboard/admin/daara",
      icon: Building2,
    },
    { title: "Utilisateurs et rôles", url: "/dashboard/admin/users", icon: Users },
    {
      title: "Performance Ndiguels",
      url: "/dashboard/admin/campaign-metrics",
      icon: Landmark,
    },
    {
      title: "Annonces Hub",
      url: "/dashboard/admin/announcements",
      icon: Bell,
    },
    { title: "Logs d'audit", url: "/dashboard/admin/audit", icon: ScrollText },
    {
      title: "Pilotage du système",
      url: "/dashboard/admin/pilotage",
      icon: Settings,
      badge:
        pendingTitleCount + pendingDocumentCount > 0
          ? String(pendingTitleCount + pendingDocumentCount)
          : undefined,
    },
  ];

  const isAdmin = user?.role === "admin";

  type NavItem = {
    title: string;
    url: string;
    icon: typeof LayoutDashboard;
    badge?: string;
    roles?: string[];
  };

  const renderNavItems = (items: NavItem[]) =>
    items.map((item) => {
      const active = isActive(item.url);
      return (
        <SidebarMenuItem key={item.title}>
          <SidebarMenuButton asChild>
            <Link
              href={item.url}
              className={cn(
                "flex items-center gap-2 transition-all",
                active && "font-bold",
              )}
              style={
                active
                  ? {
                      color: "var(--primary)",
                      background: "var(--sidebar-accent)",
                    }
                  : undefined
              }
            >
              <item.icon
                size={16}
                strokeWidth={active ? 2 : 1.5}
                style={active ? { color: "var(--primary)" } : undefined}
              />
              <span>{item.title}</span>
            </Link>
          </SidebarMenuButton>
          {item.badge && <SidebarMenuBadge>{item.badge}</SidebarMenuBadge>}
        </SidebarMenuItem>
      );
    });

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="py-5 px-4">
        <BrandMark href="/dashboard" size="sm" showSubtitle={false} />
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent>
        {/* Application */}
        <SidebarGroup>
          <SidebarGroupLabel>Application</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>{renderNavItems(navApplication)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Gestion */}
        <SidebarGroup>
          <SidebarGroupLabel>Gestion</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>{renderNavItems(navGestion)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Communauté */}
        <SidebarGroup>
          <SidebarGroupLabel>Communauté</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>{renderNavItems(navCommunaute)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Administration - Only for Admin */}
        {isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel>Administration</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>{renderNavItems(navAdmin)}</SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarSeparator />
      <SidebarFooter className="pb-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton className="gap-3">
                  <Avatar className="h-6 w-6 border" style={{ borderColor: "var(--border)" }}>
                    <AvatarImage
                      src={user?.avatar || user?.avatar_url || undefined}
                      className="object-cover"
                    />
                    <AvatarFallback
                      className="text-[10px] font-black text-white"
                      style={{ background: "var(--primary)" }}
                    >
                      {user?.first_name?.[0] ? (
                        `${user.first_name[0]}${user.last_name?.[0] ?? ""}`
                      ) : (
                        <User size={13} strokeWidth={1.5} />
                      )}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col items-start text-left gap-0">
                    <span
                      className="text-xs font-medium"
                      style={{ color: "var(--foreground)" }}
                    >
                      {user && (user.first_name || user.last_name)
                        ? `${user.first_name || ""} ${user.last_name || ""}`.trim()
                        : user?.email || "Chargement..."}
                    </span>
                    <span
                      className="text-[10px] uppercase font-bold"
                      style={{ color: "var(--primary)" }}
                    >
                      {user?.role === "member" ? "Talibé" : user?.role || "Talibé"}
                    </span>
                  </div>
                  <ChevronUp
                    size={14}
                    strokeWidth={1.5}
                    className="ml-auto"
                    style={{ color: "var(--muted-foreground)" }}
                  />
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
