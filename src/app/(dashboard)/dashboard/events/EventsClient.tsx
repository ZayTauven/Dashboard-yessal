"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addEvent, deleteEvent, updateEvent, notifyMembersAboutEvent } from "@/app/actions/events";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SmartLink } from "@/components/SmartLink";
import { Plus, Calendar, Trash2, MoreHorizontal, Edit, Bell, CheckCircle2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { toast } from "sonner";

type Fete = {
  id: number;
  name: string;
  date?: string | null;
  description?: string | null;
  recurrence?: string;
  is_active?: boolean;
};

export function EventsClient({
  initialEvents,
  isAdmin,
}: {
  initialEvents: Fete[];
  isAdmin: boolean;
}) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Fete | null>(null);
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
        toast.success("Fête créée avec succès");
      }
    });
  }

  async function handleUpdate(formData: FormData) {
    if (!editingEvent) return;
    setErrorMsg("");
    startTransition(async () => {
      const res = await updateEvent(editingEvent.id, formData);
      if (res.error) {
        setErrorMsg(res.error);
      } else {
        setEditingEvent(null);
        router.refresh();
        toast.success("Fête mise à jour");
      }
    });
  }

  async function handleDelete(id: number) {
    if (!confirm("Supprimer cette fête ?")) return;
    const { error } = await deleteEvent(id);
    if (!error) {
      router.refresh();
      toast.success("Fête supprimée");
    }
  }

  async function handleNotify(id: number) {
    startTransition(async () => {
        const res: any = await notifyMembersAboutEvent(id);
        if (res.success) {
            toast.success(res.message);
        }
    });
  }

  const isSoon = (dateStr?: string | null) => {
    if (!dateStr) return false;
    const date = new Date(dateStr);
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    const days = diff / (1000 * 3600 * 24);
    return days >= 0 && days <= 7;
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <div className="space-y-1">
            <h2 className="text-2xl font-bold tracking-tight">
                Pilotage des fêtes
            </h2>
            <p className="text-xs text-muted-foreground">Planifiez et gérez les grands rendez-vous de la communauté.</p>
        </div>
        {isAdmin && (
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button className="bg-yessal-green hover:bg-green-700 text-white gap-3 border-none px-8 h-12 shadow-xl shadow-yessal-green/20 rounded-2xl font-black uppercase tracking-widest text-[10px]">
                <Plus size={20} /> Programmer une fête
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-xl">
              <DialogHeader>
                <DialogTitle>Nouvelle fête</DialogTitle>
                <DialogDescription>
                  Nom, date, récurrence et description.
                </DialogDescription>
              </DialogHeader>
              <form action={handleAdd} className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nom</Label>
                    <Input
                      id="name"
                      name="name"
                      placeholder="Ex: Grand Magal"
                      required
                      className="bg-muted/10 border-none h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="event_date">Date</Label>
                    <Input id="event_date" name="event_date" type="date" className="bg-muted/10 border-none h-11" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" name="description" rows={3} className="bg-muted/10 border-none" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="recurrence">Récurrence</Label>
                    <select
                      name="recurrence"
                      className="w-full h-11 px-3 bg-muted/10 border-none rounded-md text-sm outline-none focus:ring-1 focus:ring-yessal-green"
                    >
                      <option value="annual">Annuelle</option>
                      <option value="quarterly">Trimestrielle</option>
                      <option value="weekly">Hebdomadaire</option>
                      <option value="none">Ponctuelle</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="is_active">Active</Label>
                    <select
                      name="is_active"
                      className="w-full h-11 px-3 bg-muted/10 border-none rounded-md text-sm outline-none focus:ring-1 focus:ring-yessal-green"
                      defaultValue="true"
                    >
                      <option value="true">Oui</option>
                      <option value="false">Non</option>
                    </select>
                  </div>
                </div>

                {errorMsg && (
                  <p className="text-xs text-red-500 font-bold">{errorMsg}</p>
                )}

                <DialogFooter className="mt-6">
                  <Button
                    type="submit"
                    disabled={isPending}
                    className="w-full bg-yessal-green text-white border-none h-12 font-bold uppercase tracking-widest text-xs"
                  >
                    {isPending ? "Création en cours..." : "Enregistrer la fête"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Dialog open={!!editingEvent} onOpenChange={(o) => !o && setEditingEvent(null)}>
        <DialogContent className="max-w-xl">
            <DialogHeader>
            <DialogTitle>Modifier la fête</DialogTitle>
            <DialogDescription>
                Mettez à jour les informations de {editingEvent?.name}.
            </DialogDescription>
            </DialogHeader>
            {editingEvent && (
                <form action={handleUpdate} className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                    <Label htmlFor="edit_name">Nom</Label>
                    <Input
                        id="edit_name"
                        name="name"
                        defaultValue={editingEvent.name}
                        required
                        className="bg-muted/10 border-none h-11"
                    />
                    </div>
                    <div className="space-y-2">
                    <Label htmlFor="edit_event_date">Date</Label>
                    <Input 
                        id="edit_event_date" 
                        name="event_date" 
                        type="date" 
                        defaultValue={editingEvent.date || ""} 
                        className="bg-muted/10 border-none h-11" 
                    />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="edit_description">Description</Label>
                    <Textarea 
                        id="edit_description" 
                        name="description" 
                        rows={3} 
                        defaultValue={editingEvent.description || ""} 
                        className="bg-muted/10 border-none" 
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                    <Label htmlFor="edit_recurrence">Récurrence</Label>
                    <select
                        name="recurrence"
                        defaultValue={editingEvent.recurrence || "annual"}
                        className="w-full h-11 px-3 bg-muted/10 border-none rounded-md text-sm outline-none focus:ring-1 focus:ring-yessal-green"
                    >
                        <option value="annual">Annuelle</option>
                        <option value="quarterly">Trimestrielle</option>
                        <option value="weekly">Hebdomadaire</option>
                        <option value="none">Ponctuelle</option>
                    </select>
                    </div>
                    <div className="space-y-2">
                    <Label htmlFor="edit_is_active">Active</Label>
                    <select
                        name="is_active"
                        defaultValue={String(editingEvent.is_active)}
                        className="w-full h-11 px-3 bg-muted/10 border-none rounded-md text-sm outline-none focus:ring-1 focus:ring-yessal-green"
                    >
                        <option value="true">Oui</option>
                        <option value="false">Non</option>
                    </select>
                    </div>
                </div>

                {errorMsg && (
                    <p className="text-xs text-red-500 font-bold">{errorMsg}</p>
                )}

                <DialogFooter className="mt-6">
                    <Button
                        type="submit"
                        disabled={isPending}
                        className="w-full bg-yessal-green text-white border-none h-12 font-bold uppercase tracking-widest text-xs"
                    >
                        {isPending ? "Mise à jour..." : "Sauvegarder les modifications"}
                    </Button>
                </DialogFooter>
                </form>
            )}
        </DialogContent>
      </Dialog>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {initialEvents.length === 0 ? (
          <div
            className="col-span-full p-12 text-center border-2 border-dashed rounded-lg"
            style={{
              borderColor: "var(--border)",
              color: "var(--muted-foreground)",
            }}
          >
            Aucune fête enregistrée.
          </div>
        ) : (
          initialEvents.map((event) => {
            const soon = isSoon(event.date);
            return (
                <Card
                  key={event.id}
                  className={`overflow-hidden hover:shadow-xl transition-all duration-300 border shadow-sm group ${soon ? 'ring-2 ring-yessal-green/20' : ''}`}
                >
                  <CardHeader className="pb-3 px-5">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                            <span className="text-lg font-black group-hover:text-yessal-green transition-colors">
                                {event.name}
                            </span>
                            {soon && (
                                <Badge className="bg-yessal-green text-white text-[8px] animate-pulse">PROCHE</Badge>
                            )}
                        </div>
                      </div>
                      {isAdmin && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              className="h-8 w-8 p-0 border-none opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <MoreHorizontal size={16} />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setEditingEvent(event)}>
                                <Edit size={14} className="mr-2" /> Modifier
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleNotify(event.id)}>
                                <Bell size={14} className="mr-2" /> Notifier les membres
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-red-600 font-bold"
                              onClick={() => handleDelete(event.id)}
                            >
                              <Trash2 size={14} className="mr-2" /> Supprimer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                    <CardDescription className="line-clamp-2 text-xs leading-relaxed">
                      {event.description || "Aucune description."}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="px-5 pb-5 pt-0 space-y-3">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Calendar size={14} className={soon ? "text-orange-500" : "text-yessal-green"} />
                      <span className={soon ? "text-orange-600 font-bold" : ""}>
                        {event.date
                            ? new Date(event.date).toLocaleDateString("fr-FR", { day: 'numeric', month: 'long', year: 'numeric' })
                            : "Date non renseignée"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="bg-muted/30 text-[10px] uppercase font-bold tracking-wider">{event.recurrence || "annual"}</Badge>
                        {!event.is_active && (
                        <Badge variant="destructive" className="text-[10px] uppercase font-bold">Inactive</Badge>
                        )}
                        {event.is_active && (
                        <Badge className="bg-green-100 text-green-700 text-[10px] uppercase font-bold border-none">Active</Badge>
                        )}
                    </div>
                  </CardContent>
                </Card>
              );
          })
        )}
      </div>
    </div>
  );
}
