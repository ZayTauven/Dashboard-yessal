"use client";

import { Bell, LogOut, Moon, Settings, Sun, User as UserIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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

const Navbar = ({ user }: { user?: any }) => {
  const { setTheme } = useTheme();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleLogout = () => {
    startTransition(async () => {
      await logoutAction();
      router.push("/login");
    });
  };

  return (
    <nav className="p-4 flex items-center justify-between sticky top-0 bg-background/80 backdrop-blur-md z-10 border-b">
      {/* LEFT */}
      <SidebarTrigger />
      {/* RIGHT */}
      <div className="flex items-center gap-4 text-sm font-medium">
        <span className="hidden md:inline text-muted-foreground mr-2">
            Bonjour, <span className="text-foreground font-bold">{user?.first_name || "Membre"}</span>
        </span>
        
        {/* NOTIFICATIONS */}
        <Button variant="ghost" size="icon" className="relative group border-none">
            <Bell className="h-5 w-5 text-muted-foreground group-hover:text-yessal-green transition-colors" />
            <span className="absolute top-2 right-2 h-2 w-2 bg-red-500 rounded-full border-2 border-background"></span>
        </Button>

        {/* THEME MENU */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon">
              <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setTheme("light")}>
              Light
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("dark")}>
              Dark
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("system")}>
              System
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* USER MENU */}
        <DropdownMenu>
          <DropdownMenuTrigger className="outline-none">
            <Avatar className="h-9 w-9 border-2 border-yessal-green/20 hover:border-yessal-green transition-all shadow-sm">
              <AvatarImage src={user?.avatar || user?.avatar_url} className="object-cover" />
              <AvatarFallback className="bg-yessal-green text-white font-bold text-xs">
                {user?.first_name?.[0]}{user?.last_name?.[0]}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent sideOffset={10} align="end" className="w-56">
            <DropdownMenuLabel className="p-4 flex flex-col gap-1 border-b mb-1">
                <span className="text-sm font-bold truncate">{user?.first_name || "Utilisateur"} {user?.last_name || ""}</span>
                <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-black flex items-center gap-1">
                    <span className="h-1.5 w-1.5 bg-yessal-green rounded-full"></span> {user?.role || "Membre"}
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
