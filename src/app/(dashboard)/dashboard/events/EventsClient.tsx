"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addEvent, deleteEvent } from "@/app/actions/events";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SmartLink } from "@/components/SmartLink";
import { Plus, Calendar, Trash2, MoreHorizontal } from "lucide-react";
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
    if (!confirm("Supprimer cette fete ?")) return;
    const { error } = await deleteEvent(id);
    if (!error) router.refresh();
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold tracking-tight">
          Pilotage des fetes
        </h2>
        {isAdmin && (
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button className="bg-yessal-green hover:bg-green-700 text-white gap-2 border-none px-6">
                <Plus size={18} /> Creer une fete
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-xl">
              <DialogHeader>
                <DialogTitle>Nouvelle fete</DialogTitle>
                <DialogDescription>
                  Nom, date, recurrence et description.
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
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="event_date">Date</Label>
                    <Input id="event_date" name="event_date" type="date" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" name="description" rows={3} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="recurrence">Recurrence</Label>
                    <select
                      name="recurrence"
                      className="w-full h-10 px-3 bg-muted/20 border-none rounded-md text-sm outline-none focus:ring-1 focus:ring-yessal-green"
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
                      className="w-full h-10 px-3 bg-muted/20 border-none rounded-md text-sm outline-none focus:ring-1 focus:ring-yessal-green"
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
                    className="w-full bg-yessal-green text-white border-none"
                  >
                    {isPending ? "Creation en cours..." : "Enregistrer"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {initialEvents.length === 0 ? (
          <div
            className="col-span-full p-12 text-center border-2 border-dashed rounded-lg"
            style={{
              borderColor: "var(--border)",
              color: "var(--muted-foreground)",
            }}
          >
            Aucune fete enregistree.
          </div>
        ) : (
          initialEvents.map((event) => (
            <Card
              key={event.id}
              className="overflow-hidden hover:shadow-xl transition-all duration-300 border shadow-sm group"
            >
              <CardHeader className="pb-3 px-5">
                <div className="flex justify-between items-start">
                  <SmartLink
                    href={`/dashboard/events`}
                    className="text-lg font-black group-hover:text-yessal-green transition-colors block"
                  >
                    {event.name}
                  </SmartLink>
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
                  <Calendar size={14} className="text-yessal-green" />
                  {event.date
                    ? new Date(event.date).toLocaleDateString("fr-FR")
                    : "Date non renseignee"}
                </div>
                <Badge variant="outline">{event.recurrence || "annual"}</Badge>
                {!event.is_active && (
                  <Badge variant="secondary">Inactive</Badge>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
