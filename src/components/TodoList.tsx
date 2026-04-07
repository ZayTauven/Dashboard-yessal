"use client";

import { useState } from "react";
import { Card } from "./ui/card";
import { Checkbox } from "./ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { ScrollArea } from "./ui/scroll-area";
import { Button } from "./ui/button";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { Calendar } from "./ui/calendar";
import { Badge } from "./ui/badge";

const TodoList = () => {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [open, setOpen] = useState(false);
  return (
    <div className="">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-lg font-medium">À valider</h1>
        <Badge variant="outline" className="bg-yessal-warning/10 text-yessal-warning border-yessal-warning/20">3 en attente</Badge>
      </div>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-full justify-start text-left font-normal bg-background">
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date ? format(date, "d MMMM yyyy") : <span>Choisir une date</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-0 w-auto">
          <Calendar
            mode="single"
            selected={date}
            onSelect={(date) => {
              setDate(date);
              setOpen(false);
            }}
          />
        </PopoverContent>
      </Popover>
      {/* LIST */}
      <ScrollArea className="max-h-[350px] mt-4 overflow-y-auto pr-3">
        <div className="flex flex-col gap-3 pb-4">
          {/* LIST ITEM */}
          <Card className="p-4 shadow-none border bg-background/50 hover:bg-background transition-colors">
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2 max-w-[80%]">
                  <Checkbox id="d1" className="mt-0.5" />
                  <label htmlFor="d1" className="text-sm font-medium leading-none cursor-pointer">
                    Don manuel — Abdoulaye Diallo
                  </label>
                </div>
                <span className="text-xs font-semibold text-foreground bg-secondary px-2 py-0.5 rounded-sm">25 000 FCFA</span>
              </div>
              <p className="text-xs text-muted-foreground ml-6">Reçu par le Collecteur 04 (Paris). Preuve attachée.</p>
            </div>
          </Card>
          {/* LIST ITEM */}
          <Card className="p-4 shadow-none border bg-background/50 hover:bg-background transition-colors">
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2 max-w-[80%]">
                  <Checkbox id="d2" className="mt-0.5" />
                  <label htmlFor="d2" className="text-sm font-medium leading-none cursor-pointer">
                    Don physique — Cheikh Ndiaye
                  </label>
                </div>
                <span className="text-xs font-semibold text-foreground bg-secondary px-2 py-0.5 rounded-sm">50 000 FCFA</span>
              </div>
              <p className="text-xs text-muted-foreground ml-6">Magal 2025. Récupéré à la mosquée.</p>
            </div>
          </Card>
           {/* LIST ITEM */}
           <Card className="p-4 shadow-none border bg-background/50 hover:bg-background transition-colors">
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2 max-w-[80%]">
                  <Checkbox id="d3" className="mt-0.5" />
                  <label htmlFor="d3" className="text-sm font-medium leading-none cursor-pointer">
                    Don physique — Modou Lo (Tutelle)
                  </label>
                </div>
                <span className="text-xs font-semibold text-foreground bg-secondary px-2 py-0.5 rounded-sm">10 000 FCFA</span>
              </div>
              <p className="text-xs text-muted-foreground ml-6">Donné au nom de Fatou Lo. Vérification en cours.</p>
            </div>
          </Card>
        </div>
      </ScrollArea>
    </div>
  );
};

export default TodoList;

