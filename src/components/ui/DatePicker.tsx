"use client";

/*
 * ═══════════════════════════════════════════════════════════════════════════
 * Sélecteur de date
 * ═══════════════════════════════════════════════════════════════════════════
 * Recomposé sur le patron `forms/Pickers` de Vireo : un champ `.ax-input` avec
 * affixes, et non un `<Button>` shadcn déguisé en champ. Il ressemble
 * désormais aux champs voisins — c'est la première chose qui clochait dans un
 * formulaire où tout le reste est en `.ax-input`.
 *
 * Deux corrections de fond :
 *
 *   · LA VALIDATION NE S'APPLIQUAIT PAS. Le `required` portait sur
 *     l'`<input type="hidden">`, que les navigateurs excluent de la validation
 *     de contrainte. Un formulaire pouvait donc partir sans date — sur « Lancer
 *     un Ndiguel », où l'échéance est obligatoire côté Django, l'utilisateur
 *     récupérait une erreur serveur au lieu d'être arrêté sur le champ.
 *     La contrainte porte maintenant sur le déclencheur visible.
 *
 *   · Aucun moyen d'EFFACER une date une fois choisie. Sur un champ facultatif
 *     comme la date d'une fête, il fallait recharger la page. Un bouton
 *     d'effacement apparaît dès qu'une date est posée.
 */

import { useEffect, useId, useRef, useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { CalendarIcon, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DatePickerProps {
  name: string;
  defaultValue?: string;
  placeholder?: string;
  className?: string;
  required?: boolean;
  disabled?: boolean;
  /** Précision affichée sous le champ. */
  hint?: string;
}

export function DatePicker({
  name,
  defaultValue,
  placeholder = "Sélectionner une date",
  className,
  required,
  disabled,
  hint,
}: DatePickerProps) {
  const [date, setDate] = useState<Date | undefined>(() => {
    if (!defaultValue) return undefined;
    /* Midi et non minuit : à minuit, un décalage de fuseau négatif fait
       basculer la date sur la veille. */
    const d = new Date(defaultValue + "T12:00:00");
    return Number.isNaN(d.getTime()) ? undefined : d;
  });
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const fieldId = useId();

  const isoValue = date ? format(date, "yyyy-MM-dd") : "";

  /*
   * La contrainte est posée sur le DÉCLENCHEUR, seul élément visible et donc
   * seul élément que le navigateur validera. Sans cela, `required` ne faisait
   * rien du tout.
   */
  useEffect(() => {
    const el = triggerRef.current;
    if (!el) return;
    el.setCustomValidity(
      required && !isoValue ? "Veuillez sélectionner une date." : "",
    );
  }, [required, isoValue]);

  return (
    <>
      <input type="hidden" name={name} value={isoValue} />

      <div className="ax-field__control">
        <span className="ax-field__affix ax-field__affix--leading">
          <CalendarIcon aria-hidden="true" />
        </span>

        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <button
              ref={triggerRef}
              id={fieldId}
              type="button"
              disabled={disabled}
              aria-label={date ? `Date : ${format(date, "d MMMM yyyy", { locale: fr })}` : placeholder}
              className={cn(
                "ax-input ax-input--with-leading-icon ax-input--with-trailing text-start",
                !date && "text-(--ax-text-disabled)",
                className,
              )}
            >
              {date
                ? format(date, "d MMMM yyyy", { locale: fr })
                : placeholder}
            </button>
          </PopoverTrigger>

          <PopoverContent
            className="w-auto p-0"
            align="start"
            collisionPadding={12}
          >
            <Calendar
              mode="single"
              selected={date}
              onSelect={(d) => {
                setDate(d);
                setOpen(false);
              }}
              captionLayout="dropdown"
              startMonth={new Date(1924, 0)}
              endMonth={new Date(new Date().getFullYear() + 10, 11)}
              locale={fr}
              autoFocus
            />
          </PopoverContent>
        </Popover>

        {/* Effacement — n'apparaît que s'il y a quelque chose à effacer. */}
        {date && !disabled && (
          <button
            type="button"
            className="ax-field__affix ax-field__affix--trailing ax-field__affix--button"
            aria-label="Effacer la date"
            onClick={() => setDate(undefined)}
          >
            <X aria-hidden="true" />
          </button>
        )}
      </div>

      {hint && <p className="ax-field__hint">{hint}</p>}
    </>
  );
}
