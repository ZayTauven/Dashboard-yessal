"use client";

/*
 * Toasts — Sonner, habillé aux jetons Aurora.
 *
 * Sonner reste le moteur : toute l'application appelle déjà `toast()` et
 * plusieurs écrans s'appuient sur ses toasts d'action (« Bloquer l'accès ? »
 * avec Confirmer / Annuler). On ne remplace donc pas la librairie, on lui donne
 * la bonne peau.
 *
 * Deux choses que le Toaster précédent ne faisait pas :
 *
 *   · il ne suivait pas le thème — `richColors` seul laisse Sonner sur son
 *     fond blanc quand l'application passe en sombre. Ici le thème vient de
 *     next-themes, donc du même endroit que le reste ;
 *   · les couleurs de succès/erreur venaient de la palette de Sonner, pas de
 *     la nôtre. Elles sortent maintenant de --ax-success-500 / --ax-danger-500,
 *     les mêmes que les badges et les alertes des pages.
 *
 * La position par défaut passe en bas à gauche : le bouton d'apparence occupe
 * le coin bas-droit, et un toast qui recouvre un bouton flottant est un toast
 * qu'on ferme par accident.
 */

import { useTheme } from "next-themes";
import { Toaster as SonnerToaster } from "sonner";
import type { ComponentProps } from "react";

type ToasterProps = ComponentProps<typeof SonnerToaster>;

export function AuroraToaster({ ...props }: ToasterProps) {
  const { resolvedTheme } = useTheme();

  return (
    <SonnerToaster
      theme={(resolvedTheme as ToasterProps["theme"]) ?? "system"}
      position="bottom-left"
      closeButton
      richColors
      toastOptions={{
        classNames: {
          toast: "ax-sonner",
          title: "ax-sonner__title",
          description: "ax-sonner__desc",
          actionButton: "ax-sonner__action",
          cancelButton: "ax-sonner__cancel",
          closeButton: "ax-sonner__close",
        },
      }}
      style={
        {
          "--normal-bg": "var(--ax-surface-overlay)",
          "--normal-text": "var(--ax-text-strong)",
          "--normal-border": "var(--ax-border)",
          "--success-bg": "var(--ax-success-50)",
          "--success-text": "var(--ax-success-500)",
          "--success-border": "var(--ax-success-200)",
          "--error-bg": "var(--ax-danger-50)",
          "--error-text": "var(--ax-danger-500)",
          "--error-border": "var(--ax-danger-200)",
          "--warning-bg": "var(--ax-warning-50)",
          "--warning-text": "var(--ax-warning-500)",
          "--warning-border": "var(--ax-warning-200)",
          "--info-bg": "var(--ax-info-50)",
          "--info-text": "var(--ax-info-500)",
          "--info-border": "var(--ax-info-200)",
        } as React.CSSProperties
      }
      {...props}
    />
  );
}

export default AuroraToaster;
