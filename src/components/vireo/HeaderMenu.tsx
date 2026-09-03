"use client";

/*
 * Petit menu déroulant de la barre supérieure.
 *
 * Vireo positionne ses panneaux d'en-tête en `position: absolute` par rapport
 * à leur grappe (`.ax-apps`, `.ax-notif`, `.ax-profile`…). Radix, lui, monte
 * ses contenus dans un portail en fin de <body> et les place au pixel via
 * transform — les deux modèles ne peuvent pas cohabiter sans réécrire le CSS
 * de Vireo.
 *
 * D'où cette primitive minimale, qui rend le panneau EN PLACE et laisse le CSS
 * d'origine faire le placement. Elle reprend le contrat du <Dropdown> de Vireo :
 * fermeture au clic extérieur et à Échap (hook partagé), `aria-expanded` sur le
 * déclencheur, et fermeture automatique quand on choisit une entrée.
 *
 * Réservée aux menus légers de l'en-tête. Pour tout ce qui demande une vraie
 * gestion du focus (dialogues, menus contextuels riches), on garde Radix.
 */

import { useRef, useState, type ReactNode } from "react";
import { useClickOutside } from "@/hooks/useClickOutside";

export interface HeaderMenuProps {
  /** Classe de la grappe : `ax-apps`, `ax-notif`… (ancre de positionnement). */
  className: string;
  /** Classe du panneau : `ax-dropdown ax-apps__menu`… */
  panelClassName: string;
  /** Identifiant du panneau, référencé par `aria-controls`. */
  panelId: string;
  label: string;
  /** Contenu du bouton déclencheur. */
  icon: ReactNode;
  triggerClassName?: string;
  children: ReactNode;
}

export function HeaderMenu({
  className,
  panelClassName,
  panelId,
  label,
  icon,
  triggerClassName = "ax-icon-btn",
  children,
}: HeaderMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, open, () => setOpen(false));

  return (
    <div className={className} ref={ref}>
      <button
        type="button"
        className={triggerClassName}
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={label}
      >
        {icon}
      </button>

      {open && (
        <div
          id={panelId}
          className={panelClassName}
          role="menu"
          aria-label={label}
          /* Un clic sur une entrée referme le menu — délégué au conteneur
             plutôt que câblé sur chaque tuile. */
          onClick={() => setOpen(false)}
        >
          {children}
        </div>
      )}
    </div>
  );
}

export default HeaderMenu;
