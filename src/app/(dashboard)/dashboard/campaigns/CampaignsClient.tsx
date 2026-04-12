"use client";

import { useState, useTransition } from "react";
import { addCampaign } from "@/app/actions/campaigns";
import { makeDonation } from "@/app/actions/donations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Wallet, Target, CreditCard, ChevronRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export function CampaignsClient({ initialCampaigns, events, isAdmin }: { initialCampaigns: any[], events: any[], isAdmin: boolean }) {
  const [isNewOpen, setIsNewOpen] = useState(false);
  const [isDonationOpen, setIsDonationOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<any>(null);
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState("");

  const handleAddCampaign = async (formData: FormData) => {
    setErrorMsg("");
    startTransition(async () => {
      const res = await addCampaign(formData);
      if (res.error) {
        setErrorMsg(res.error);
      } else {
        setIsNewOpen(false);
      }
    });
  };

  const handleDonation = async (formData: FormData) => {
    setErrorMsg("");
    startTransition(async () => {
      const res = await makeDonation(formData);
      if (res.error) {
        setErrorMsg(res.error);
      } else {
        setIsDonationOpen(false);
        alert("Don effectué avec succès !");
      }
    });
  };

  return (
    <div className="flex flex-col gap-8">
      {/* HEADER ACTIONS */}
      <div className="flex justify-end">
        {isAdmin && (
          <Button
            className="gap-2"
            style={{
              background: "var(--yessal-green)",
              color: "#FAFAF8",
            }}
            onClick={() => setIsNewOpen(true)}
          >
            <Plus size={16} /> Nouvelle campagne
          </Button>
        )}
      </div>

      {/* CAMPAIGNS GRID */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {initialCampaigns.length === 0 ? (
          <div className="col-span-full p-12 text-center border-2 border-dashed rounded-lg" style={{ borderColor: "var(--border)", color: "var(--muted-foreground)" }}>
            Aucune campagne de dons active pour le moment.
          </div>
        ) : (
          initialCampaigns.map((camp: any) => (
            <Card key={camp.id} className="overflow-hidden hover:shadow-lg transition-shadow border-2" style={{ borderColor: "var(--border)" }}>
              <CardHeader className="pb-3 border-b bg-muted/10">
                <div className="flex justify-between items-start">
                    <CardTitle className="text-xl line-clamp-1">{camp.name}</CardTitle>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-yessal-green text-white" style={{ background: "var(--yessal-green)" }}>
                        {camp.status}
                    </span>
                </div>
                <CardDescription className="line-clamp-2 min-h-[40px] mt-1">
                    {camp.description || "Pas de description pour cet objectif."}
                </CardDescription>
              </CardHeader>
              <CardContent className="py-6 space-y-4">
                <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Progression</span>
                        <span className="font-bold">{Math.round((camp.collected_amount / camp.goal_amount) * 100 || 0)}%</span>
                    </div>
                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                        <div 
                            className="h-full bg-yessal-green transition-all" 
                            style={{ 
                                width: `${Math.min(100, (camp.collected_amount / camp.goal_amount) * 100 || 0)}%`,
                                background: "var(--yessal-green)"
                            }} 
                        />
                    </div>
                </div>
                <div className="grid grid-cols-2 pt-2 border-t" style={{ borderColor: "var(--border)" }}>
                    <div className="flex flex-col">
                        <span className="text-[10px] uppercase text-muted-foreground font-semibold">Objectif</span>
                        <span className="text-sm font-bold">{Number(camp.goal_amount).toLocaleString()} FCFA</span>
                    </div>
                    <div className="flex flex-col items-end">
                        <span className="text-[10px] uppercase text-muted-foreground font-semibold">Collecté</span>
                        <span className="text-sm font-bold text-yessal-green" style={{ color: "var(--yessal-green)" }}>{Number(camp.collected_amount || 0).toLocaleString()} FCFA</span>
                    </div>
                </div>
              </CardContent>
              <CardFooter className="pt-0 p-0 border-t" style={{ borderColor: "var(--border)" }}>
                <Button 
                    variant="ghost" 
                    className="w-full h-12 gap-2 rounded-none hover:bg-muted/50"
                    onClick={() => {
                        setSelectedCampaign(camp);
                        setIsDonationOpen(true);
                    }}
                >
                    Faire un don <ChevronRight size={14} />
                </Button>
              </CardFooter>
            </Card>
          ))
        )}
      </div>

      {/* MODAL : NEW CAMPAIGN */}
      {isNewOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
          onClick={() => setIsNewOpen(false)}
        >
          <div
            className="w-full max-w-[500px] rounded-xl border bg-background p-6 shadow-2xl animate-in fade-in zoom-in duration-200"
            style={{ borderColor: "var(--border)" }}
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-6 flex items-start justify-between">
              <div>
                <h2 className="text-xl font-semibold flex items-center gap-2" style={{ color: "var(--foreground)" }}>
                  <Target className="text-yessal-green" size={20} style={{ color: "var(--yessal-green)" }} /> Créer une campagne
                </h2>
                <p className="text-sm text-muted-foreground">Une campagne est rattachée à un événement ou un Daara.</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setIsNewOpen(false)}>Fermer</Button>
            </div>

            <form action={handleAddCampaign} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nom du Jëf</Label>
                <Input id="name" name="name" placeholder="Ex: Construction Mur d'Agiya" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" name="description" placeholder="Objectif et utilité..." rows={3} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="goalAmount">Objectif (FCFA)</Label>
                    <Input id="goalAmount" name="goalAmount" type="number" min="1000" placeholder="100000" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="deadline">Date limite</Label>
                    <Input id="deadline" name="deadline" type="date" required />
                  </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="eventId">Lier à un événement</Label>
                <select 
                    id="eventId" 
                    name="eventId" 
                    className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-green-500"
                    style={{ borderColor: "var(--border)" }}
                >
                    <option value="">Aucun événement spécifique</option>
                    {events.map(ev => (
                        <option key={ev.id} value={ev.id}>{ev.name}</option>
                    ))}
                </select>
              </div>
              {errorMsg && <p className="text-xs text-red-500 font-medium">{errorMsg}</p>}
              <Button type="submit" disabled={isPending} className="w-full mt-4" style={{ background: "var(--yessal-green)", color: "white" }}>
                {isPending ? "Création..." : "Lancer la campagne"}
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL : MAKE DONATION */}
      {isDonationOpen && selectedCampaign && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
          onClick={() => setIsDonationOpen(false)}
        >
          <div
            className="w-full max-w-[450px] rounded-xl border bg-background p-6 shadow-2xl"
            style={{ borderColor: "var(--border)" }}
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-6 flex items-start justify-between">
              <div>
                <h2 className="text-xl font-semibold flex items-center gap-2" style={{ color: "var(--foreground)" }}>
                  <Wallet className="text-yessal-green" size={20} style={{ color: "var(--yessal-green)" }} /> Faire un don
                </h2>
                <p className="text-sm text-muted-foreground">Campagne : {selectedCampaign.name}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setIsDonationOpen(false)}>Quitter</Button>
            </div>

            <form action={handleDonation} className="space-y-5">
              <input type="hidden" name="campaignId" value={selectedCampaign.id} />
              
              <div className="space-y-2">
                <Label htmlFor="amount">Montant du don (FCFA)</Label>
                <div className="relative">
                    <Input id="amount" name="amount" type="number" min="5" placeholder="5000" className="pl-9" required />
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold text-xs">CFA</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Moyen de paiement</Label>
                <div className="grid grid-cols-3 gap-2">
                    <label className="flex flex-col items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-muted transition-colors border-yessal-green bg-muted/20">
                        <input type="radio" name="paymentMethod" value="orange_money" defaultChecked className="hidden" />
                        <span className="text-[10px] font-bold">Orange</span>
                    </label>
                    <label className="flex flex-col items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-muted transition-colors">
                        <input type="radio" name="paymentMethod" value="wave" className="hidden" />
                        <span className="text-[10px] font-bold">Wave</span>
                    </label>
                    <label className="flex flex-col items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-muted transition-colors">
                        <input type="radio" name="paymentMethod" value="paypal" className="hidden" />
                        <span className="text-[10px] font-bold">PayPal</span>
                    </label>
                </div>
              </div>

              {errorMsg && <p className="text-xs text-red-500 font-medium">{errorMsg}</p>}
              
              <div className="pt-2">
                <Button type="submit" disabled={isPending} className="w-full gap-2 py-6 text-lg" style={{ background: "var(--yessal-green)", color: "white" }}>
                  <CreditCard size={18} /> {isPending ? "Traitement..." : "Confirmer le paiement"}
                </Button>
                <p className="text-[10px] text-center mt-3 text-muted-foreground">
                    Paiement sécurisé crypté de bout en bout.
                </p>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
