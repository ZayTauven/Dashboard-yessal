"use client"

import * as React from "react"
import * as PopoverPrimitive from "@radix-ui/react-popover"

import { cn } from "@/lib/utils"

function Popover({
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Root>) {
  return <PopoverPrimitive.Root data-slot="popover" {...props} />
}

function PopoverTrigger({
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Trigger>) {
  return <PopoverPrimitive.Trigger data-slot="popover-trigger" {...props} />
}

function PopoverContent({
  className,
  align = "center",
  sideOffset = 4,
  portal = true,
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Content> & {
  /*
   * Portaliser dans le <body>, ou rendre sur place ?
   *
   * Par défaut oui — c'est ce qu'il faut dans une page ordinaire. Mais DANS UNE
   * MODALE, un panneau portalisé ne peut plus défiler du tout.
   *
   * Radix Dialog monte `RemoveScroll` avec `shards: [contentRef]` (voir
   * @radix-ui/react-dialog) : le défilement n'est autorisé QUE dans le contenu
   * du dialogue. Un popover portalisé dans le <body> est hors de ce périmètre,
   * donc gelé — le sélecteur de Daara s'ouvrait bien à la création d'un compte,
   * mais la molette n'y faisait rien, alors que le même composant défilait
   * normalement sur /register, où aucun dialogue n'est ouvert.
   *
   * `portal={false}` rend le contenu à sa place dans l'arbre, donc à
   * l'intérieur du dialogue, donc dans le périmètre autorisé. Rien n'est perdu
   * au passage : Radix positionne ses poppers en `strategy: "fixed"`, ils ne
   * sont donc pas rognés par les ancêtres en `overflow`.
   */
  portal?: boolean
}) {
  const content = (
    <PopoverPrimitive.Content
      data-slot="popover-content"
      align={align}
      sideOffset={sideOffset}
      className={cn(
        "bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 w-72 origin-(--radix-popover-content-transform-origin) rounded-md border p-4 shadow-md outline-hidden",
        className
      )}
      {...props}
    />
  )

  if (!portal) return content

  return <PopoverPrimitive.Portal>{content}</PopoverPrimitive.Portal>
}

function PopoverAnchor({
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Anchor>) {
  return <PopoverPrimitive.Anchor data-slot="popover-anchor" {...props} />
}

export { Popover, PopoverTrigger, PopoverContent, PopoverAnchor }
