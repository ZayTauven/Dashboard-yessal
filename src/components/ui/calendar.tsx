"use client"

import * as React from "react"
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp } from "lucide-react"
import { DayPicker } from "react-day-picker"
import { fr } from "date-fns/locale"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: React.ComponentProps<typeof DayPicker>) {
  return (
    <DayPicker
      locale={fr}
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        root: "relative",
        months: "flex flex-col sm:flex-row gap-2",
        month: "flex flex-col gap-4",
        // Caption row — nav is positioned absolute over it
        month_caption: "flex justify-center pt-1 relative items-center h-9",
        caption_label:
          "flex items-center gap-1 h-8 rounded-lg px-2 text-sm font-semibold capitalize bg-muted/20",
        // Dropdown navigation (captionLayout="dropdown")
        dropdowns: "flex gap-2 items-center justify-center",
        dropdown_root: "relative",
        /*
         * react-day-picker rend DEUX choses par liste déroulante (voir
         * `components/Dropdown.js`) : le <select> réel, puis un <span> qui
         * affiche le libellé sélectionné. Le <select> doit donc être un calque
         * transparent POSÉ SUR le libellé — c'est ce que fait la feuille de
         * style officielle, et cette classe manquait ici.
         *
         * Sans elle, les deux étaient visibles côte à côte : la légende du
         * calendrier affichait « septembre septembre 2026 2026 ».
         */
        dropdown:
          "absolute inset-0 z-[2] w-full cursor-pointer opacity-0 appearance-none border-none outline-none",
        months_dropdown: "",
        years_dropdown: "",
        // Navigation buttons — absolute top corners
        nav: "absolute top-0 inset-x-0 flex justify-between z-10 pointer-events-none",
        button_previous: cn(
          buttonVariants({ variant: "outline" }),
          "size-7 bg-transparent p-0 opacity-50 hover:opacity-100 pointer-events-auto",
        ),
        button_next: cn(
          buttonVariants({ variant: "outline" }),
          "size-7 bg-transparent p-0 opacity-50 hover:opacity-100 pointer-events-auto",
        ),
        // Grid
        month_grid: "w-full border-collapse",
        weekdays: "flex",
        weekday:
          "text-muted-foreground w-9 font-normal text-[0.75rem] text-center py-1",
        weeks: "",
        week: "flex w-full mt-1",
        // Day cell and button
        day: "relative p-0 flex items-center justify-center",
        day_button: cn(
          buttonVariants({ variant: "ghost" }),
          "size-9 p-0 font-normal",
          "data-[selected=true]:bg-primary data-[selected=true]:text-primary-foreground",
          "data-[selected=true]:hover:bg-primary data-[selected=true]:hover:text-primary-foreground",
          "data-[today=true]:bg-accent data-[today=true]:text-accent-foreground",
          "data-[outside=true]:text-muted-foreground data-[outside=true]:opacity-50",
          "data-[disabled=true]:text-muted-foreground data-[disabled=true]:opacity-50",
        ),
        selected: "",
        today: "",
        outside: "",
        disabled: "",
        range_start:
          "[&>button]:bg-primary [&>button]:text-primary-foreground [&>button]:rounded-md",
        range_end:
          "[&>button]:bg-primary [&>button]:text-primary-foreground [&>button]:rounded-md",
        range_middle:
          "[&>button]:bg-accent [&>button]:text-accent-foreground [&>button]:rounded-none",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        /*
         * Les QUATRE orientations, et pas seulement `left` contre le reste.
         * react-day-picker demande aussi un chevron `down` — celui qui signale
         * qu'une légende est une liste déroulante. Le ternaire précédent le
         * rendait pointant à DROITE : la légende du calendrier affichait deux
         * chevrons « suivant » là où il fallait deux chevrons « dérouler ».
         */
        Chevron: ({ orientation = "left", ...rest }) => {
          const Icon =
            orientation === "left"
              ? ChevronLeft
              : orientation === "up"
                ? ChevronUp
                : orientation === "down"
                  ? ChevronDown
                  : ChevronRight
          return <Icon className="size-4" {...rest} />
        },
      }}
      {...props}
    />
  )
}

export { Calendar }
