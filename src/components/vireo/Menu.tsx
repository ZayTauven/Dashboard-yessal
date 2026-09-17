"use client";

/*
 * ═══════════════════════════════════════════════════════════════════════════
 * Menu contextuel
 * ═══════════════════════════════════════════════════════════════════════════
 * Même parti pris que <Modal> : markup Vireo (`.ax-menu`), comportement Radix.
 * Le menu « ⋯ » des cartes doit se piloter au clavier (flèches, Home/End,
 * saisie au clavier pour atteindre un item, Échap pour fermer, retour du focus
 * au déclencheur) — tout cela existe déjà dans `@radix-ui/react-dropdown-menu`,
 * déjà installé.
 *
 * Détail d'intégration : `.ax-menu` est déclaré `position: absolute` dans
 * Vireo, qui positionne ses menus à la main. Radix les place lui-même via un
 * conteneur Popper ; on neutralise donc la règle avec l'utilitaire `static`.
 * Les feuilles Vireo vivent dans `@layer components`, donc l'utilitaire
 * Tailwind gagne sans `!important`.
 */

import Link from "next/link";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface MenuItem {
  label: string;
  icon?: LucideIcon;
  onSelect?: () => void;
  /**
   * Entrée de NAVIGATION. Exclusive de `onSelect`.
   *
   * Une entrée qui mène ailleurs doit être un vrai lien, et non un `onSelect`
   * qui appelle `router.push` : sans `<a href>`, le clic du milieu, le
   * Ctrl+clic et « ouvrir dans un nouvel onglet » ne font rien, la barre
   * d'état n'annonce pas la destination, et un lecteur d'écran annonce un
   * bouton là où il y a un déplacement.
   */
  href?: string;
  /** Rend l'entrée en ton d'alerte — suppressions et actions irréversibles. */
  danger?: boolean;
  disabled?: boolean;
  /** Insère un filet AU-DESSUS de cette entrée. */
  separatorBefore?: boolean;
}

export interface MenuProps {
  items: MenuItem[];
  /** Déclencheur personnalisé. Par défaut : un bouton « ⋯ ». */
  trigger?: React.ReactNode;
  /** Libellé du déclencheur par défaut, lu par les lecteurs d'écran. */
  label?: string;
  align?: "start" | "center" | "end";
  className?: string;
}

export function Menu({
  items,
  trigger,
  label = "Actions",
  align = "end",
  className,
}: MenuProps) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        {trigger ?? (
          <button
            type="button"
            className="ax-btn ax-btn--ghost ax-btn--icon"
            aria-label={label}
          >
            <MoreHorizontal size={16} aria-hidden="true" />
          </button>
        )}
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align={align}
          sideOffset={6}
          className={cn("ax-menu static", className)}
        >
          {items.map((item, i) => (
            <div key={item.label}>
              {item.separatorBefore && i > 0 && (
                <DropdownMenu.Separator className="ax-menu__divider" />
              )}
              <DropdownMenu.Item
                disabled={item.disabled}
                onSelect={item.onSelect}
                /* `asChild` remplace le <div> de Radix par notre <Link> tout en
                   lui laissant le clavier et la fermeture du menu. */
                asChild={Boolean(item.href)}
                className={cn(
                  "ax-menu__item",
                  item.danger && "ax-menu__item--danger",
                )}
              >
                {item.href ? (
                  <Link href={item.href}>
                    {item.icon && (
                      <item.icon className="ax-menu__icon" aria-hidden="true" />
                    )}
                    {item.label}
                  </Link>
                ) : (
                  <>
                    {item.icon && (
                      <item.icon className="ax-menu__icon" aria-hidden="true" />
                    )}
                    {item.label}
                  </>
                )}
              </DropdownMenu.Item>
            </div>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

export default Menu;
