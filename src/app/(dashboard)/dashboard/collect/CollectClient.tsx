"use client";

import { useState, useTransition } from "react";
import { searchMembers } from "@/app/actions/users";
import { makeDonation } from "@/app/actions/donations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Search, User, CreditCard, Banknote, AlertCircle, CheckCircle2 } from "lucide-react";

export function CollectClient({ campaigns }: { campaigns: any[] }) {
  const [query, setQuery] = useState("");
  const [members, setMembers] = useState<any[]>([]);
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSearch = async () => {
    if (!query) return;
    setErrorMsg("");
    startTransition(async () => {
        const res = await searchMembers(query);
        if (res.error) setErrorMsg(res.error);
        else setMembers(res.data);
    });
  };

  const handleCollect = async (formData: FormData) => {
    setErrorMsg("");
    setSuccess(false);
    startTransition(async () => {
        const res = await makeDonation(formData);
        if (res.error) {
            setErrorMsg(res.error);
        } else {
            setSuccess(true);
            setSelectedMember(null);
            setQuery("");
            setMembers([]);
        }
    });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {/* SELECTION MEMBRE */}
      <div className="space-y-6">
        <div className="bg-card p-6 rounded-2xl border flex flex-col gap-4 shadow-sm" style={{ borderColor: "var(--border)" }}>
            <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-full bg-yessal-green/10 flex items-center justify-center text-yessal-green" style={{ background: "var(--yessal-green/10)", color: "var(--yessal-green)" }}>
                    <Search size={16} />
                </div>
                <h3 className="font-bold">Recherche Membre</h3>
            </div>
            <div className="flex gap-2">
                <Input 
                    value={query} 
                    onChange={(e) => setQuery(e.target.value)} 
                    placeholder="Email ou Prénom..." 
                    className="flex-1"
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
                <Button onClick={handleSearch} disabled={isPending} style={{ background: "var(--yessal-green)", color: "white" }}>
                    {isPending ? "..." : "Trouver"}
                </Button>
            </div>

            <div className="space-y-2 mt-2">
                {members.length === 0 && !isPending && query.length > 2 && (
                    <p className="text-[10px] text-center italic text-muted-foreground">Aucun résultat trouvé.</p>
                )}
                {members.map(member => (
                    <div 
                        key={member.id} 
                        onClick={() => setSelectedMember(member)}
                        className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                            selectedMember?.id === member.id ? 'border-yessal-green bg-green-50/50' : 'hover:bg-muted border-transparent bg-muted/20'
                        }`}
                        style={{ borderLeftColor: selectedMember?.id === member.id ? "var(--yessal-green)" : "transparent" }}
                    >
                        <Avatar className="h-8 w-8">
                            <AvatarFallback>{member.first_name?.[0]}{member.last_name?.[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 overflow-hidden">
                            <div className="font-bold text-xs truncate">{member.first_name} {member.last_name}</div>
                            <div className="text-[10px] text-muted-foreground truncate">{member.email}</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      </div>

      {/* FORMULAIRE DE COLLECTE */}
      <div className="space-y-6">
        <div className="bg-card p-6 rounded-2xl border flex flex-col gap-6 shadow-sm min-h-[400px]" style={{ borderColor: "var(--border)" }}>
            {!selectedMember ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 opacity-40">
                    <User size={64} className="mb-4 text-muted-foreground" />
                    <h3 className="text-xl font-bold">Sélectionner un membre</h3>
                    <p className="text-sm">Veuillez d'abord identifier le membre effectuant le versement physique.</p>
                </div>
            ) : (
                <>
                    <div className="flex items-center justify-between border-b pb-4" style={{ borderColor: "var(--border)" }}>
                        <div className="flex items-center gap-3">
                             <Avatar className="h-10 w-10">
                                <AvatarFallback className="bg-yessal-green text-white" style={{ background: "var(--yessal-green)" }}>
                                    {selectedMember.first_name[0]}
                                </AvatarFallback>
                             </Avatar>
                             <div>
                                 <div className="font-bold">{selectedMember.first_name} {selectedMember.last_name}</div>
                                 <div className="text-[10px] text-muted-foreground uppercase">{selectedMember.role}</div>
                             </div>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => setSelectedMember(null)}>Changer</Button>
                    </div>

                    <form action={handleCollect} className="space-y-4">
                        <input type="hidden" name="beneficiaryId" value="" />
                        <input type="hidden" name="paymentMethod" value="manual" />
                        <input type="hidden" name="donorId" value={selectedMember.id} />
                        
                        <div className="space-y-2 text-left">
                            <Label htmlFor="campaignId">Attribuer au Jëf (Campagne)</Label>
                            <select 
                                id="campaignId" 
                                name="campaignId" 
                                className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-green-500"
                                required
                            >
                                <option value="">Choisir une campagne active...</option>
                                {campaigns.filter(c => c.status === 'active').map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2 text-left">
                            <Label htmlFor="amount">Somme récoltée (FCFA)</Label>
                            <div className="relative">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2">
                                    <Banknote size={16} className="text-muted-foreground" />
                                </div>
                                <Input id="amount" name="amount" type="number" min="1000" placeholder="Montant en FCFA" className="pl-10 h-10" required />
                            </div>
                        </div>

                        {errorMsg && (
                            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 text-red-600 text-xs font-medium">
                                <AlertCircle size={14} /> {errorMsg}
                            </div>
                        )}

                        <Button type="submit" disabled={isPending} className="w-full h-12 gap-2 mt-4" style={{ background: "var(--yessal-green)", color: "white" }}>
                            <CheckCircle2 size={18} /> {isPending ? "Validation..." : "Enregistrer et Valider"}
                        </Button>
                    </form>
                </>
            )}

            {success && !selectedMember && (
                <div className="flex items-center gap-2 p-4 rounded-xl bg-green-50 text-green-700 font-bold animate-bounce shadow-sm">
                    <CheckCircle2 size={24} /> Don manuel enregistré avec succès !
                </div>
            )}
        </div>
      </div>
    </div>
  );
}
