"use client";

import { useState, useTransition, useEffect } from "react";
import { searchMembers, createUserByAdmin } from "@/app/actions/users";
import { makeDonation } from "@/app/actions/donations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Search, User, CreditCard, Banknote, CheckCircle2, Loader2, Plus, UserPlus } from "lucide-react";
import { ErrorAlert } from "@/components/ui/error-alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";

export function CollectClient({ campaigns }: { campaigns: any[] }) {
  const [query, setQuery] = useState("");
  const [members, setMembers] = useState<any[]>([]);
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState("");
  const [success, setSuccess] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("manual");

  useEffect(() => {
    if (query.length < 2) {
        setMembers([]);
        return;
    }
    const timer = setTimeout(() => {
        handleSearch();
    }, 500);
    return () => clearTimeout(timer);
  }, [query]);

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
        } else if (res.redirectUrl) {
            window.location.href = res.redirectUrl;
        } else {
            setSuccess(true);
            setSelectedMember(null);
            setQuery("");
            setMembers([]);
            toast.success("Don enregistré avec succès !");
        }
    });
  };

  const handleQuickRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData);
    
    startTransition(async () => {
        const res = await createUserByAdmin({
            ...data,
            role: 'member',
            password: 'YessalUser2024!' // Default password for quick enrollment
        });
        
        if (res.error) {
            toast.error(res.error);
        } else {
            toast.success("Membre inscrit avec succès !");
            setIsAddModalOpen(false);
            setSelectedMember(res.data);
        }
    });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {/* SELECTION MEMBRE */}
      <div className="space-y-6">
        <div className="bg-card p-6 rounded-2xl border flex flex-col gap-4 shadow-sm" style={{ borderColor: "var(--border)" }}>
            <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-full bg-yessal-violet/10 flex items-center justify-center" style={{ color: "var(--primary)" }}>
                    <Search size={16} />
                </div>
                <h3 className="font-bold">Recherche Membre</h3>
            </div>
                <div className="relative flex-1">
                    <Input 
                        value={query} 
                        onChange={(e) => setQuery(e.target.value)} 
                        placeholder="Email, Prénom ou Nom..." 
                        className="pl-10 h-11 bg-muted/20 border-none"
                    />
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        {isPending ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
                    </div>
                </div>

            <div className="space-y-2 mt-2">
                {members.length === 0 && !isPending && query.length > 2 && (
                    <div className="flex flex-col items-center gap-3 py-4 border-2 border-dashed rounded-xl bg-muted/10">
                        <p className="text-[10px] text-center italic text-muted-foreground">Aucun résultat trouvé.</p>
                        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
                            <DialogTrigger asChild>
                                <Button size="sm" variant="outline" className="gap-2 text-[10px] font-bold uppercase tracking-widest border-yessal-violet text-yessal-violet hover:bg-yessal-violet hover:text-white transition-all">
                                    <UserPlus size={14} /> Inscrire ce membre
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-md">
                                <DialogHeader>
                                    <DialogTitle>Inscription rapide</DialogTitle>
                                    <DialogDescription>Créez un compte membre pour valider la collecte immédiatement.</DialogDescription>
                                </DialogHeader>
                                <form onSubmit={handleQuickRegister} className="space-y-4 py-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <Label className="text-[10px] uppercase font-black ml-1">Prénom</Label>
                                            <Input name="first_name" placeholder="Prénom" required />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-[10px] uppercase font-black ml-1">Nom</Label>
                                            <Input name="last_name" placeholder="Nom" required />
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-[10px] uppercase font-black ml-1">Email (Optionnel)</Label>
                                        <Input name="email" type="email" placeholder="email@exemple.com" />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-[10px] uppercase font-black ml-1">Téléphone</Label>
                                        <Input name="phone" placeholder="77..." required />
                                    </div>
                                    <p className="text-[9px] text-muted-foreground italic mt-2">Le mot de passe par défaut sera : YessalUser2024!</p>
                                    <DialogFooter>
                                        <Button type="submit" disabled={isPending} className="w-full bg-yessal-violet text-white font-bold uppercase tracking-widest text-[10px] h-11">Valider l&apos;inscription</Button>
                                    </DialogFooter>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </div>
                )}
                {members.map(member => (
                    <div 
                        key={member.id} 
                        onClick={() => setSelectedMember(member)}
                        className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                            selectedMember?.id === member.id ? 'border-yessal-violet bg-yessal-violet/5' : 'hover:bg-muted border-transparent bg-muted/20'
                        }`}
                        style={{ borderLeftColor: selectedMember?.id === member.id ? "var(--primary)" : "transparent" }}
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
                                <AvatarFallback className="bg-yessal-violet text-white" style={{ background: "var(--primary)" }}>
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
                        <input type="hidden" name="donorId" value={selectedMember.id} />

                        <div className="space-y-2 text-left">
                            <Label htmlFor="paymentMethod">Méthode de versement</Label>
                            <select 
                                id="paymentMethod" 
                                name="paymentMethod" 
                                className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-yessal-violet/50"
                                required
                                value={paymentMethod}
                                onChange={(e) => setPaymentMethod(e.target.value)}
                            >
                                <option value="manual">Conserver en espèces (Cash)</option>
                                <option value="wave">Dépôt digital (Wave)</option>
                                <option value="orange_money">Dépôt digital (Orange Money)</option>
                                <option value="visa">Dépôt digital (Carte Visa/Mastercard)</option>
                                <option value="virement">Dépôt digital (Virement bancaire)</option>
                            </select>
                            <p className="text-[10px] text-muted-foreground mt-1">
                                Sélectionnez la méthode pour déposer les espèces collectées sur le compte Yessal.
                            </p>
                        </div>

                        {paymentMethod === "virement" && (
                            <div className="space-y-2 rounded-xl border p-4 bg-muted/20 text-left" style={{ borderColor: "var(--border)" }}>
                                <p className="text-xs font-semibold">Coordonnées bancaires Yessal</p>
                                <p className="text-xs text-muted-foreground">Veuillez effectuer le virement puis saisir la référence.</p>
                                <div className="space-y-1.5 pt-2">
                                    <Label htmlFor="wireReference">Référence du virement</Label>
                                    <Input id="wireReference" name="wireReference" placeholder="Ex: VIR-12345" required />
                                </div>
                            </div>
                        )}
                        
                        <div className="space-y-2 text-left">
                            <Label htmlFor="campaignId">Attribuer au Jëf (Campagne)</Label>
                            <select 
                                id="campaignId" 
                                name="campaignId" 
                                className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-yessal-violet/50"
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

                        {errorMsg && <ErrorAlert message={errorMsg} />}

                        <Button type="submit" disabled={isPending} className="w-full h-12 gap-2 mt-4" style={{ background: "var(--primary)", color: "white" }}>
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
