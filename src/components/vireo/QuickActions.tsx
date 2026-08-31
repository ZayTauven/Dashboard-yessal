"use client";

/*
 * ═══════════════════════════════════════════════════════════════════════════
 * Actions rapides — la palette ⌘K
 * ═══════════════════════════════════════════════════════════════════════════
 * Le dashboard compte 28 pages derrière une barre latérale à tiroirs. Pour un
 * collecteur qui enregistre vingt jëfs dans une journée, ou un admin qui passe
 * son temps entre le pilotage et la validation des pièces, chaque trajet coûte
 * deux ou trois clics. Cette palette les ramène à deux touches.
 *
 * Trois familles, dans cet ordre — parce que c'est l'ordre d'urgence réel :
 *   1. ce qu'on vient FAIRE (enregistrer un don, ouvrir une campagne) ;
 *   2. où on veut ALLER ;
 *   3. l'apparence, reléguée en bas, qu'on ne règle qu'une fois.
 *
 * Le filtrage par rôle n'est pas cosmétique : proposer « Pilotage » à un membre
 * qui recevra un 403 est pire que ne rien proposer.
 *
 * Ouverture : ⌘K / Ctrl+K, ou le bouton de la barre supérieure.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import { useTheme } from "next-themes";
import {
  Bell,
  Building2,
  CalendarDays,
  Coins,
  FileSignature,
  Gauge,
  HandCoins,
  LayoutDashboard,
  Megaphone,
  MessagesSquare,
  Moon,
  Newspaper,
  Search,
  ShieldCheck,
  Sun,
  UserCog,
  UserRound,
  Users,
  Wallet,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

type Role = "admin" | "chef_daara" | "collector" | "member" | string;

interface Item {
  id: string;
  label: string;
  /** Mots que l'utilisateur pourrait taper et qui n'apparaissent pas dans le
   *  libellé : « don » pour Jëf, « ndiguel » pour campagne, etc. */
  keywords?: string[];
  icon: LucideIcon;
  href?: string;
  run?: () => void;
  /** Rôles autorisés. Absent ⇒ visible par tous. */
  roles?: Role[];
  shortcut?: string;
}

export interface QuickActionsProps {
  role?: Role;
  /** Contrôle externe (bouton de la barre supérieure). */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const STAFF: Role[] = ["admin", "chef_daara", "collector"];

export function QuickActions({ role = "member", open, onOpenChange }: QuickActionsProps) {
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();
  const [internalOpen, setInternalOpen] = useState(false);

  const isOpen = open ?? internalOpen;
  const setOpen = useCallback(
    (v: boolean) => (onOpenChange ? onOpenChange(v) : setInternalOpen(v)),
    [onOpenChange],
  );

  /* ⌘K / Ctrl+K depuis n'importe où — sauf dans un champ de saisie, où
     l'utilisateur est probablement en train d'écrire. */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() !== "k" || !(e.metaKey || e.ctrlKey)) return;
      const el = document.activeElement;
      const typing =
        el instanceof HTMLElement &&
        (el.tagName === "INPUT" ||
          el.tagName === "TEXTAREA" ||
          el.isContentEditable);
      if (typing) return;
      e.preventDefault();
      setOpen(!isOpen);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, setOpen]);

  const groups = useMemo<Array<{ heading: string; items: Item[] }>>(
    () => [
      {
        heading: "Actions",
        items: [
          {
            id: "new-donation",
            label: "Enregistrer un Jëf",
            keywords: ["don", "donation", "verser", "contribution", "fcfa"],
            icon: HandCoins,
            href: "/dashboard/donations/new",
          },
          {
            id: "collect",
            label: "Collecte physique",
            keywords: ["collecteur", "espèces", "terrain", "encaisser"],
            icon: Wallet,
            href: "/dashboard/collect",
            roles: STAFF,
          },
          {
            id: "new-campaign",
            label: "Créer un Ndiguel",
            keywords: ["campagne", "collecte", "objectif", "jëf"],
            icon: FileSignature,
            href: "/dashboard/campaigns/new",
            roles: ["admin", "chef_daara"],
          },
          {
            id: "new-announcement",
            label: "Publier une annonce",
            keywords: ["communication", "hub", "message"],
            icon: Megaphone,
            href: "/dashboard/admin/announcements",
            roles: ["admin"],
          },
        ],
      },
      {
        heading: "Aller à",
        items: [
          { id: "dashboard", label: "Tableau de bord", icon: LayoutDashboard, href: "/dashboard" },
          {
            id: "campaigns",
            label: "Ndiguels",
            keywords: ["campagnes"],
            icon: Coins,
            href: "/dashboard/campaigns",
          },
          {
            id: "donations",
            label: "Jëfs",
            keywords: ["dons", "historique", "versements"],
            icon: HandCoins,
            href: "/dashboard/donations",
          },
          { id: "events", label: "Événements", keywords: ["fêtes", "agenda"], icon: CalendarDays, href: "/dashboard/events" },
          { id: "members", label: "Membres", keywords: ["talibés", "annuaire"], icon: Users, href: "/dashboard/members" },
          { id: "daara", label: "Daara", keywords: ["groupe", "communauté"], icon: Building2, href: "/dashboard/daara" },
          { id: "tutelles", label: "Tutelles", keywords: ["proches", "famille"], icon: UserRound, href: "/dashboard/tutelles" },
          { id: "chat", label: "Messagerie", keywords: ["discussion", "conversation"], icon: MessagesSquare, href: "/dashboard/chat" },
          { id: "news", label: "Actualités", icon: Newspaper, href: "/dashboard/news" },
          { id: "notifications", label: "Notifications", icon: Bell, href: "/dashboard/notifications" },
          { id: "profile", label: "Mon profil", icon: UserRound, href: "/dashboard/profile" },
        ],
      },
      {
        heading: "Administration",
        items: [
          {
            id: "pilotage",
            label: "Pilotage",
            keywords: ["titres", "validation", "virements", "archive"],
            icon: Gauge,
            href: "/dashboard/admin/pilotage",
            roles: ["admin"],
          },
          {
            id: "admin-users",
            label: "Utilisateurs et rôles",
            icon: UserCog,
            href: "/dashboard/admin/users",
            roles: ["admin"],
          },
          {
            id: "admin-members",
            label: "Validation des inscriptions",
            keywords: ["demandes", "en attente"],
            icon: ShieldCheck,
            href: "/dashboard/admin/members",
            roles: ["admin"],
          },
          {
            id: "admin-daara",
            label: "Daaras et zones territoriales",
            keywords: ["ldd", "ligues"],
            icon: Building2,
            href: "/dashboard/admin/daara",
            roles: ["admin"],
          },
          {
            id: "audit",
            label: "Journal d'audit",
            keywords: ["logs", "traçabilité"],
            icon: ShieldCheck,
            href: "/dashboard/admin/audit",
            roles: ["admin"],
          },
        ],
      },
      {
        heading: "Apparence",
        items: [
          {
            id: "theme",
            label:
              resolvedTheme === "dark" ? "Passer en mode clair" : "Passer en mode sombre",
            keywords: ["thème", "dark", "light", "nuit"],
            icon: resolvedTheme === "dark" ? Sun : Moon,
            run: () => setTheme(resolvedTheme === "dark" ? "light" : "dark"),
          },
        ],
      },
    ],
    [resolvedTheme, setTheme],
  );

  const visible = groups
    .map((g) => ({
      ...g,
      items: g.items.filter((i) => !i.roles || i.roles.includes(role)),
    }))
    .filter((g) => g.items.length > 0);

  const select = (item: Item) => {
    setOpen(false);
    if (item.href) router.push(item.href);
    else item.run?.();
  };

  return (
    <Command.Dialog
      open={isOpen}
      onOpenChange={setOpen}
      label="Actions rapides"
      className="ax-quick"
      shouldFilter
    >
      <div className="ax-quick__panel">
        <div className="ax-quick__search">
          <Search size={17} aria-hidden="true" />
          <Command.Input
            placeholder="Rechercher une action, une page…"
            className="ax-quick__input"
          />
          <kbd className="ax-quick__kbd">Échap</kbd>
        </div>

        <Command.List className="ax-quick__list">
          <Command.Empty className="ax-quick__empty">
            Aucun résultat. Essayez « jëf », « membre » ou « ndiguel ».
          </Command.Empty>

          {visible.map((group) => (
            <Command.Group
              key={group.heading}
              heading={group.heading}
              className="ax-quick__group"
            >
              {group.items.map((item) => {
                const Icon = item.icon;
                return (
                  <Command.Item
                    key={item.id}
                    value={`${item.label} ${(item.keywords || []).join(" ")}`}
                    onSelect={() => select(item)}
                    className="ax-quick__item"
                  >
                    <Icon size={16} aria-hidden="true" />
                    <span>{item.label}</span>
                    {item.shortcut && (
                      <kbd className="ax-quick__kbd ms-auto">{item.shortcut}</kbd>
                    )}
                  </Command.Item>
                );
              })}
            </Command.Group>
          ))}
        </Command.List>

        <footer className="ax-quick__foot">
          <span>
            <kbd className="ax-quick__kbd">↑</kbd>
            <kbd className="ax-quick__kbd">↓</kbd> naviguer
          </span>
          <span>
            <kbd className="ax-quick__kbd">↵</kbd> ouvrir
          </span>
          <span className="ms-auto">
            <kbd className="ax-quick__kbd">⌘</kbd>
            <kbd className="ax-quick__kbd">K</kbd>
          </span>
        </footer>
      </div>
    </Command.Dialog>
  );
}

export default QuickActions;
