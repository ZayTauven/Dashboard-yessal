"use client";

import { useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface DatePickerProps {
  name: string;
  defaultValue?: string;
  placeholder?: string;
  className?: string;
  required?: boolean;
  disabled?: boolean;
}

export function DatePicker({
  name,
  defaultValue,
  placeholder = "Sélectionner une date",
  className,
  required,
  disabled,
}: DatePickerProps) {
  const [date, setDate] = useState<Date | undefined>(() => {
    if (!defaultValue) return undefined;
    const d = new Date(defaultValue + "T12:00:00");
    return isNaN(d.getTime()) ? undefined : d;
  });
  const [open, setOpen] = useState(false);

  const isoValue = date ? format(date, "yyyy-MM-dd") : "";

  return (
    <>
      <input type="hidden" name={name} value={isoValue} required={required} />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            disabled={disabled}
            className={cn(
              "w-full justify-start text-left font-normal h-11 bg-muted/10 border-none hover:bg-muted/20 rounded-xl px-4",
              !date && "text-muted-foreground",
              className,
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4 opacity-40 shrink-0" />
            {date
              ? format(date, "d MMMM yyyy", { locale: fr })
              : placeholder}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
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
            autoFocus
          />
        </PopoverContent>
      </Popover>
    </>
  );
}
