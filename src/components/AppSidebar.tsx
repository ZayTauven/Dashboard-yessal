"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
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

interface AppSidebarProps {
  user?: {
    user_id: number;
    email: string;
    first_name: string;
    last_name: string;
    role: "admin" | "chef_daara" | "collector" | "member";
  };
}

const AppSidebar = ({ user }: AppSidebarProps) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleLogout = () => {
    startTransition(async () => {
      await logoutAction();
      router.push("/login");
    });
  };

  // ── Navigation logic based on role ──────────────────────────────────────────
  
  const navApplication = [
    { title: "Tableau de bord", url: "/dashboard", icon: LayoutDashboard },
    { title: "Notifications", url: "/dashboard/notifications", icon: Bell, badge: "3" },
    { title: "Messagerie", url: "/dashboard/chat", icon: MessageSquare },
  ];

  const navGestion = [
    { title: "Événements", url: "/dashboard/events", icon: CalendarDays },
    { title: "Campagnes (Jëfs)", url: "/dashboard/campaigns", icon: Landmark },
    { 
        title: "Collecte (Physique)", 
        url: "/dashboard/collect", 
        icon: HandCoins,
        roles: ["admin", "collector", "chef_daara"] 
    },
    { title: "Mes Dons", url: "/dashboard/donations", icon: Wallet },
  ].filter(item => !item.roles || (user && item.roles.includes(user.role)));

  const navCommunaute = [
    { 
        title: user?.role === "admin" ? "Tous les Daaras" : "Mon Daara", 
        url: user?.role === "admin" ? "/dashboard/admin/daara" : "/dashboard/daara", 
        icon: UsersRound 
    },
    { title: "Membres", url: "/dashboard/members", icon: Users },
    { title: "Tutelles", url: "/dashboard/tutelles", icon: UserCheck },
  ];

  const navAdmin = [
    { title: "Gestion des Daaras", url: "/dashboard/admin/daara", icon: Building2 },
    { title: "Membres & Rôles", url: "/dashboard/admin/users", icon: Users },
    { title: "Annonces Hub", url: "/dashboard/admin/announcements", icon: Bell },
    { title: "Logs d'audit", url: "/dashboard/admin/audit", icon: ScrollText },
  ];

  const isAdmin = user?.role === "admin";

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
            <SidebarMenu>
              {navApplication.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link href={item.url}>
                      <item.icon size={16} strokeWidth={1.5} />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                  {item.badge && <SidebarMenuBadge>{item.badge}</SidebarMenuBadge>}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Gestion */}
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

        {/* Communauté */}
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

        {/* Administration - Only for Admin */}
        {isAdmin && (
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
        )}
      </SidebarContent>

      <SidebarSeparator />
      <SidebarFooter className="pb-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton className="gap-3">
                  <div
                    className="flex-shrink-0 flex items-center justify-center rounded-full"
                    style={{ width: "24px", height: "24px", background: "var(--accent)", border: "1px solid var(--border)" }}
                  >
                    <User size={13} strokeWidth={1.5} style={{ color: "var(--muted-foreground)" }} />
                  </div>
                  <div className="flex flex-col items-start text-left gap-0">
                    <span className="text-xs font-medium" style={{ color: "var(--foreground)" }}>
                      {user && (user.first_name || user.last_name) 
                        ? `${user.first_name || ""} ${user.last_name || ""}`.trim() 
                        : user?.email || "Chargement..."}
                    </span>
                    <span className="text-[10px] uppercase font-bold text-yessal-green" style={{ color: "var(--yessal-green)" }}>
                      {user?.role || "Membre"}
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
