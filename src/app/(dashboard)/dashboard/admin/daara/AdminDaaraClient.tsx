"use client";

import { useState, useTransition } from "react";
import { createDaara, deleteDaara } from "@/app/actions/daara";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, Building2, AlertCircle, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function AdminDaaraClient({ initialDaaras }: { initialDaaras: any[] }) {
  const [daaras, setDaaras] = useState(initialDaaras);
  const [isPending, startTransition] = useTransition();
  const [showForm, setShowForm] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (formData: FormData) => {
    setErrorMsg("");
    startTransition(async () => {
        const res = await createDaara(formData);
        if (res.error) {
            setErrorMsg(res.error);
        } else {
            setDaaras(prev => [...prev, res.data]);
            setShowForm(false);
        }
    });
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Voulez-vous vraiment supprimer ce Daara ?")) return;
    startTransition(async () => {
        const res = await deleteDaara(id);
        if (!res.error) {
            setDaaras(prev => prev.filter(d => d.id !== id));
        }
    });
  };

  return (
    <div className="grid grid-cols-3 gap-8">
      {/* LISTE DES DAARAS */}
      <div className="col-span-2 space-y-4">
        <div className="bg-card rounded-2xl border shadow-sm overflow-hidden" style={{ borderColor: "var(--border)" }}>
            <Table>
                <TableHeader className="bg-muted/30">
                    <TableRow>
                        <TableHead className="font-bold uppercase text-[10px] tracking-widest pl-6">Code</TableHead>
                        <TableHead className="font-bold uppercase text-[10px] tracking-widest">Nom du Daara</TableHead>
                        <TableHead className="font-bold uppercase text-[10px] tracking-widest">Membres</TableHead>
                        <TableHead className="font-bold uppercase text-[10px] tracking-widest">Statut</TableHead>
                        <TableHead className="text-right font-bold uppercase text-[10px] tracking-widest pr-6">Action</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {daaras.map((daara: any) => (
                        <TableRow key={daara.id}>
                            <TableCell className="pl-6 font-bold text-yessal-green">{daara.code}</TableCell>
                            <TableCell className="font-medium">{daara.name}</TableCell>
                            <TableCell>
                                <span className="text-xs">0 membres</span> {/* Statistique simplifiée */}
                            </TableCell>
                            <TableCell>
                                <Badge variant="outline" className="bg-green-50 text-green-600 border-green-100">Actif</Badge>
                            </TableCell>
                            <TableCell className="text-right pr-6">
                                <Button variant="ghost" size="icon" onClick={() => handleDelete(daara.id)} className="text-red-400 hover:text-red-600 hover:bg-red-50">
                                    <Trash2 size={16} />
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
      </div>

      {/* FORMULAIRE D'AJOUT */}
      <div className="col-span-1">
        <div className="bg-card p-6 rounded-2xl border shadow-sm sticky top-8" style={{ borderColor: "var(--border)" }}>
            <div className="flex items-center gap-2 mb-6">
                <div className="p-2 rounded-lg bg-yessal-green/10 text-yessal-green">
                    <Building2 size={20} />
                </div>
                <h3 className="text-lg font-bold">Nouveau Daara</h3>
            </div>

            <form action={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Nom Complet</label>
                    <Input name="name" placeholder="Ex: Daara de Dakar Plateau" required />
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Code Unique</label>
                    <Input name="code" placeholder="Ex: DKR-01" required maxLength={10} />
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Description (Optionnel)</label>
                    <textarea 
                        name="description" 
                        className="w-full rounded-md border bg-background px-3 py-2 text-sm min-h-[100px] outline-none focus:ring-2 focus:ring-green-500" 
                        placeholder="Précisions géographiques ou historiques..."
                    />
                </div>

                {errorMsg && (
                    <div className="p-3 bg-red-50 text-red-600 rounded-lg text-xs flex items-center gap-2">
                        <AlertCircle size={14} /> {errorMsg}
                    </div>
                )}

                <Button type="submit" className="w-full h-11 gap-2 mt-4" disabled={isPending} style={{ background: "var(--yessal-green)", color: "white" }}>
                    <Plus size={18} /> {isPending ? "Création..." : "Ajouter le Daara"}
                </Button>
            </form>
        </div>
      </div>
    </div>
  );
}
