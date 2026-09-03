"use client";

/*
 * ═══════════════════════════════════════════════════════════════════════════
 * Modale
 * ═══════════════════════════════════════════════════════════════════════════
 * Le meilleur des deux systèmes : le MARKUP de Vireo (`.ax-modal`, surface de
 * verre, en-tête et pied séparés par un filet) posé sur les PRIMITIVES Radix
 * déjà présentes — piège de focus, retour du focus à l'élément déclencheur,
 * fermeture par Échap, verrouillage du défilement, `aria-modal`.
 *
 * Vireo pilote ses modales en Alpine : rien à reprendre côté comportement, et
 * réécrire un piège de focus à la main serait une régression d'accessibilité
 * pour un gain visuel nul. On ne garde donc que la couche présentation.
 *
 * `status` affiche la pastille d'intention de Vireo. Elle est réservée aux
 * confirmations destructrices ou aux résultats : une modale de formulaire n'a
 * pas d'intention à annoncer, et la pastille n'y ferait que du bruit.
 */

import * as DialogPrimitive from "@radix-ui/react-dialog";
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  X,
  XCircle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type Status = "success" | "warning" | "danger" | "info";

const STATUS_ICON: Record<Status, LucideIcon> = {
  success: CheckCircle2,
  warning: AlertTriangle,
  danger: XCircle,
  info: Info,
};

export interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  /** Sous-titre lu par les lecteurs d'écran et affiché sous le titre. */
  description?: string;
  size?: "sm" | "md" | "lg" | "xl";
  /** Pastille d'intention — confirmations et résultats uniquement. */
  status?: Status;
  /** Boutons du pied, alignés à droite. */
  footer?: React.ReactNode;
  /** Retire le rembourrage du corps (en-tête illustré pleine largeur). */
  bare?: boolean;
  children?: React.ReactNode;
  className?: string;
}

const SIZE_CLASS = {
  sm: "ax-modal__dialog--sm",
  md: "",
  lg: "ax-modal__dialog--lg",
  xl: "ax-modal__dialog--xl",
} as const;

export function Modal({
  open,
  onOpenChange,
  title,
  description,
  size = "md",
  status,
  footer,
  bare = false,
  children,
  className,
}: ModalProps) {
  const StatusIcon = status ? STATUS_ICON[status] : null;

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="ax-modal__backdrop" />

        {/*
          Le conteneur de placement est hors du champ de focus de Radix : c'est
          voulu. Un clic sur cette zone est « hors du contenu » pour Radix, donc
          il ferme la modale — le comportement attendu d'un fond de modale.
        */}
        <div className="ax-modal ax-modal--centered">
          <DialogPrimitive.Content
            aria-describedby={description ? undefined : ""}
            className={cn(
              "ax-modal__dialog ax-modal__dialog--scrollable",
              SIZE_CLASS[size],
              className,
            )}
          >
            <div className="ax-modal__header">
              <div className="flex items-start gap-3">
                {StatusIcon && (
                  <span
                    className={cn("ax-modal__status", `ax-modal__status--${status}`)}
                    aria-hidden="true"
                  >
                    <StatusIcon />
                  </span>
                )}
                <div>
                  <DialogPrimitive.Title className="ax-modal__title">
                    {title}
                  </DialogPrimitive.Title>
                  {description && (
                    <DialogPrimitive.Description className="ax-text-muted text-sm mt-1">
                      {description}
                    </DialogPrimitive.Description>
                  )}
                </div>
              </div>

              <DialogPrimitive.Close className="ax-modal__close" aria-label="Fermer">
                <X aria-hidden="true" />
              </DialogPrimitive.Close>
            </div>

            <div className={cn("ax-modal__body", bare && "!p-0")}>{children}</div>

            {footer && <div className="ax-modal__footer">{footer}</div>}
          </DialogPrimitive.Content>
        </div>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

export default Modal;
