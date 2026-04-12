"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addEvent, deleteEvent } from "@/app/actions/events";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Calendar, Trash2, ImagePlus, MoreHorizontal, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function EventsClient({ initialEvents, isAdmin }: { initialEvents: any[], isAdmin: boolean }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState("");

  async function handleAdd(formData: FormData) {
    setErrorMsg("");
    startTransition(async () => {
      const res = await addEvent(formData);
      if (res.error) {
        setErrorMsg(res.error);
      } else {
        setIsOpen(false);
        router.refresh();
      }
    });
  }

  async function handleDelete(id: number) {
    if (!confirm("Supprimer cet événement ?")) return;
    const { error } = await deleteEvent(id);
    if (!error) router.refresh();
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold tracking-tight">Calendrier des Événements</h2>
        {isAdmin && (
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button className="bg-yessal-green hover:bg-green-700 text-white gap-2 border-none px-6">
                    <Plus size={18} /> Créer un Événement
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-xl">
                <DialogHeader>
                    <DialogTitle>Nouvel Événement</DialogTitle>
                    <DialogDescription>Remplissez les détails pour annoncer un nouvel événement à la communauté.</DialogDescription>
                </DialogHeader>
                <form action={handleAdd} className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Nom</Label>
                            <Input id="name" name="name" placeholder="Ex: Grand Magal" required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="event_date">Date</Label>
                            <Input id="event_date" name="event_date" type="date" required />
                        </div>
                    </div>
                    
                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea id="description" name="description" placeholder="Détails de l'organisation..." rows={3} />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="recurrence">Récurrence</Label>
                            <select 
                                name="recurrence" 
                                className="w-full h-10 px-3 bg-muted/20 border-none rounded-md text-sm outline-none focus:ring-1 focus:ring-yessal-green"
                            >
                                <option value="none">Ponctuel</option>
                                <option value="annual">Annuel</option>
                                <option value="monthly">Mensuel</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                             <Label htmlFor="cover_image">Image à la une</Label>
                             <div className="flex items-center gap-2 px-3 py-2 bg-muted/20 rounded-md border border-dashed border-muted-foreground/30 hover:border-yessal-green transition-colors cursor-pointer relative">
                                <ImagePlus size={16} className="text-muted-foreground" />
                                <span className="text-xs text-muted-foreground">Choisir un fichier</span>
                                <Input id="cover_image" name="cover_image" type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" />
                             </div>
                        </div>
                    </div>

                    {errorMsg && <p className="text-xs text-red-500 font-bold bg-red-50 p-2 rounded-md border border-red-100">{errorMsg}</p>}
                    
                    <DialogFooter className="mt-6">
                        <Button type="submit" disabled={isPending} className="w-full bg-yessal-green text-white border-none">
                            {isPending ? "Création en cours..." : "Publier l'événement"}
                        </Button>
                    </DialogFooter>
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
            <Card key={event.id} className="overflow-hidden hover:shadow-xl transition-all duration-300 border shadow-sm group">
              <div className="h-48 bg-muted flex items-center justify-center relative overflow-hidden">
                 {event.cover_image ? (
                    <img 
                        src={event.cover_image} 
                        alt={event.name} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                 ) : (
                    <div className="flex flex-col items-center gap-2 opacity-20">
                        <Calendar size={48} />
                    </div>
                 )}
                 <div className="absolute top-3 left-3">
                    <Badge className="bg-black/40 text-white backdrop-blur-md border-none uppercase text-[9px] tracking-widest font-black px-2 py-0.5">
                        {event.recurrence === 'none' ? 'Unique' : event.recurrence}
                    </Badge>
                 </div>
              </div>
              <CardHeader className="pb-3 px-5">
                <div className="flex justify-between items-start">
                    <CardTitle className="text-lg font-black group-hover:text-yessal-green transition-colors">{event.name}</CardTitle>
                    {isAdmin && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0 border-none opacity-0 group-hover:opacity-100 transition-opacity">
                                    <MoreHorizontal size={16} />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem className="text-red-600 font-bold" onClick={() => handleDelete(event.id)}>
                                    <Trash2 size={14} className="mr-2" /> Supprimer
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </div>
                <CardDescription className="line-clamp-2 text-xs leading-relaxed">
                    {event.description || "Aucune description détaillée n'a été fournie pour cet événement."}
                </CardDescription>
              </CardHeader>
              <CardContent className="px-5 pb-5 pt-0">
                <div className="bg-muted/30 p-3 rounded-xl flex items-center justify-between">
                    <div className="flex flex-col">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-tighter">Date officielle</span>
                        <div className="flex items-center gap-1.5 font-bold text-sm">
                            <Calendar size={14} className="text-yessal-green" />
                            {event.event_date ? new Date(event.event_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : "À venir"}
                        </div>
                    </div>
                    <div className="h-8 w-8 bg-yessal-green/10 rounded-full flex items-center justify-center text-yessal-green">
                        <CheckCircle2 size={16} />
                    </div>
                </div>
              </CardContent>
              <CardFooter className="px-5 py-3 border-t flex items-center justify-between bg-muted/10">
                <span className="text-[9px] uppercase font-black text-muted-foreground">Créé par {event.created_by_name?.split(' ')[0] || "Admin"}</span>
                <Button variant="link" className="text-yessal-green p-0 h-auto text-[11px] font-bold">Voir détails</Button>
              </CardFooter>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}