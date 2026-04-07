"use client";

import { useState, useTransition } from "react";
import { addEvent } from "@/app/actions/events";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Calendar, MapPin, MoreHorizontal } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export function EventsClient({ initialEvents, isAdmin }: { initialEvents: any[], isAdmin: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState("");

  async function handleAdd(formData: FormData) {
    setErrorMsg("");
    startTransition(async () => {
      const res = await addEvent(formData);
      if (res.error) {
        setErrorMsg(res.error);
      } else if (res.success) {
        setIsOpen(false);
      }
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-end">
        {isAdmin && (
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button
                className="gap-2"
                style={{
                  background: "var(--yessal-green)",
                  color: "#FAFAF8",
                }}
              >
                <Plus size={16} /> Nouvel événement
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]" style={{ background: "var(--background)", borderColor: "var(--border)" }}>
              <DialogHeader>
                <DialogTitle style={{ color: "var(--foreground)" }}>Créer un événement</DialogTitle>
                <DialogDescription style={{ color: "var(--muted-foreground)" }}>
                  Ajoutez un nouveau Magal, Gamous, ou tout autre événement marquant.
                </DialogDescription>
              </DialogHeader>
              <form action={handleAdd} className="grid gap-4 py-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="name" style={{ color: "var(--foreground)" }}>Nom de l'événement</Label>
                  <Input id="name" name="name" placeholder="Ex: Magal de Touba" required />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="description" style={{ color: "var(--foreground)" }}>Description</Label>
                  <Textarea id="description" name="description" placeholder="Détails de l'événement..." rows={3} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="eventDate" style={{ color: "var(--foreground)" }}>Date</Label>
                    <Input id="eventDate" name="eventDate" type="date" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="recurrence" style={{ color: "var(--foreground)" }}>Récurrence</Label>
                    <select 
                      id="recurrence" 
                      name="recurrence" 
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      style={{ color: "var(--foreground)", background: "var(--background)", border: "1px solid var(--border)" }}
                    >
                      <option value="none">Aucune</option>
                      <option value="annual">Annuelle</option>
                      <option value="quarterly">Trimestrielle</option>
                      <option value="weekly">Hebdomadaire</option>
                    </select>
                  </div>
                </div>
                {errorMsg && <p className="text-sm text-red-500 font-medium">{errorMsg}</p>}
                <div className="flex justify-end mt-4">
                  <Button type="submit" disabled={isPending} style={{ background: "var(--yessal-green)", color: "#FAFAF8" }}>
                    {isPending ? "Création..." : "Créer l'événement"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {initialEvents.length === 0 ? (
          <div className="col-span-full p-12 text-center border-2 border-dashed rounded-lg" style={{ borderColor: "var(--border)", color: "var(--muted-foreground)" }}>
            Aucun événement enregistré pour le moment.
          </div>
        ) : (
          initialEvents.map((event: any) => (
            <Card key={event.id} className="overflow-hidden hover:shadow-lg transition-shadow border-2" style={{ borderColor: "var(--border)" }}>
              <div className="h-40 bg-muted flex items-center justify-center relative">
                 {/* Placeholder Image or First Event Media */}
                 {event.media && event.media.length > 0 ? (
                    <img 
                        src={event.media[0].url} 
                        alt={event.name} 
                        className="w-full h-full object-cover"
                    />
                 ) : (
                    <Calendar size={48} className="text-muted-foreground opacity-20" />
                 )}
                 <div className="absolute top-3 right-3">
                    <span className="px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider bg-black/50 text-white backdrop-blur-sm">
                        {event.recurrence === 'none' ? 'Exceptionnel' : event.recurrence}
                    </span>
                 </div>
              </div>
              <CardHeader className="pb-2">
                <CardTitle className="text-xl line-clamp-1">{event.name}</CardTitle>
                <CardDescription className="line-clamp-2 min-h-[40px]">
                    {event.description || "Pas de description."}
                </CardDescription>
              </CardHeader>
              <CardContent className="pb-4">
                <div className="flex flex-col gap-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                        <Calendar size={14} />
                        <span>{event.event_date ? new Date(event.event_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : "Date non fixée"}</span>
                    </div>
                </div>
              </CardContent>
              <CardFooter className="pt-0 flex justify-between border-t bg-muted/20" style={{ borderColor: "var(--border)" }}>
                <span className="text-[10px] text-muted-foreground py-3">Créé par {event.created_by_name || "Système"}</span>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreHorizontal size={16} />
                </Button>
              </CardFooter>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
