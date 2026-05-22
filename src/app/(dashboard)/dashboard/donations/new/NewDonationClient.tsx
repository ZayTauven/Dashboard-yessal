"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { makeDonation, payDonation } from "@/app/actions/donations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, CreditCard, Wallet, Landmark } from "lucide-react";

type CampaignOption = { id: number | string; name: string };
type TutelleOption = {
  id: number | string;
  first_name: string;
  last_name: string;
};

export function NewDonationClient({
  campaigns,
  tutelles,
  defaultCampaignId,
  bankConfig,
}: {
  campaigns: CampaignOption[];
  tutelles: TutelleOption[];
  defaultCampaignId?: string;
  bankConfig: {
    bank_name: string;
    iban: string;
    bic: string;
    account_name: string;
    reference_format: string;
  };
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState("");
  const [selectedMethod, setSelectedMethod] = useState("orange_money");

  const handleDonation = async (formData: FormData) => {
    setErrorMsg("");
    const paymentMethod = formData.get("paymentMethod") as string;

    startTransition(async () => {
      const res = await makeDonation(formData);
      if (res.error) {
        setErrorMsg(res.error);
      } else {
        const donation = res.data;

        // If collector payment, show specific message
        if (paymentMethod === "collector") {
          alert("Demande de collecte enregistrée. Les responsables ont été notifiés.");
          router.push("/dashboard/donations");
          return;
        }

        // If digital payment, initiate Bictorys
        if (paymentMethod !== "paypal") {
          const payRes = await payDonation(donation.id, paymentMethod);
          if (payRes.error) {
            setErrorMsg(payRes.error);
            return;
          }

          if (paymentMethod === "visa" || paymentMethod === "mastercard") {
            if (payRes.data?.checkout_url) {
              window.location.href = payRes.data.checkout_url;
              return;
            }
          } else {
            // Mobile money
            alert(`Une demande de paiement ${paymentMethod.replace('_', ' ')} a été envoyée. Veuillez valider sur votre téléphone.`);
          }
        }

        router.push("/dashboard/donations");
      }
    });
  };

  return (
    <div className="max-w-xl mx-auto flex flex-col gap-8">
      <Button variant="ghost" className="w-fit gap-2 -ml-2" asChild>
        <Link href="/dashboard/donations">
          <ArrowLeft size={16} />
          Retour à mes Jëfs
        </Link>
      </Button>

      <div
        className="rounded-xl border bg-card p-6 shadow-sm"
        style={{ borderColor: "var(--border)" }}
      >
        <div className="mb-6">
          <h2
            className="text-xl font-semibold flex items-center gap-2"
            style={{ color: "var(--foreground)" }}
          >
            <Wallet size={20} style={{ color: "var(--primary)" }} />
            Faire un Jëfs
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Choisissez une campagne, un montant et un moyen de paiement.
          </p>
        </div>

        {campaigns.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Aucune campagne disponible pour le moment.{" "}
            <Link
              href="/dashboard/campaigns"
              className="underline font-medium"
              style={{ color: "var(--primary)" }}
            >
              Voir les Ndiguels
            </Link>
          </p>
        ) : (
          <form action={handleDonation} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="campaignId">Campagne</Label>
              <select
                id="campaignId"
                name="campaignId"
                required
                defaultValue={defaultCampaignId || ""}
                className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{ borderColor: "var(--border)" }}
              >
                <option value="" disabled>
                  Sélectionner…
                </option>
                {campaigns.map((c) => (
                  <option key={c.id} value={String(c.id)}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Montant (FCFA)</Label>
              <div className="relative">
                <Input
                  id="amount"
                  name="amount"
                  type="number"
                  min={5}
                  placeholder="5000"
                  className="pl-12"
                  required
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold text-xs">
                  FCFA
                </span>
              </div>
            </div>

            {tutelles.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="beneficiaryId">Bénéficiaire (tutelle)</Label>
                <select
                  id="beneficiaryId"
                  name="beneficiaryId"
                  className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                  style={{ borderColor: "var(--border)" }}
                >
                  <option value="">Pour moi-même</option>
                  {tutelles.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.first_name} {t.last_name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="space-y-2">
              <Label>Moyen de paiement</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <label 
                  className={`flex flex-col items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors ${selectedMethod === "orange_money" ? "border-yessal-violet bg-yessal-violet/10" : "border-border"}`}
                  onClick={() => setSelectedMethod("orange_money")}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="orange_money"
                    checked={selectedMethod === "orange_money"}
                    onChange={() => setSelectedMethod("orange_money")}
                    className="sr-only"
                  />
                  <span className="text-[10px] font-bold">Orange</span>
                </label>
                <label 
                  className={`flex flex-col items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors ${selectedMethod === "wave" ? "border-yessal-violet bg-yessal-violet/10" : "border-border"}`}
                  onClick={() => setSelectedMethod("wave")}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="wave"
                    checked={selectedMethod === "wave"}
                    onChange={() => setSelectedMethod("wave")}
                    className="sr-only"
                  />
                  <span className="text-[10px] font-bold">Wave</span>
                </label>
                <label 
                  className={`flex flex-col items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors ${selectedMethod === "visa" ? "border-yessal-violet bg-yessal-violet/10" : "border-border"}`}
                  onClick={() => setSelectedMethod("visa")}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="visa"
                    checked={selectedMethod === "visa"}
                    onChange={() => setSelectedMethod("visa")}
                    className="sr-only"
                  />
                  <span className="text-[10px] font-bold">Visa</span>
                </label>
                <label 
                  className={`flex flex-col items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors ${selectedMethod === "mastercard" ? "border-yessal-violet bg-yessal-violet/10" : "border-border"}`}
                  onClick={() => setSelectedMethod("mastercard")}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="mastercard"
                    checked={selectedMethod === "mastercard"}
                    onChange={() => setSelectedMethod("mastercard")}
                    className="sr-only"
                  />
                  <span className="text-[10px] font-bold">Mastercard</span>
                </label>
                <label 
                  className={`flex flex-col items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors ${selectedMethod === "paypal" ? "border-yessal-violet bg-yessal-violet/10" : "border-border"}`}
                  onClick={() => setSelectedMethod("paypal")}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="paypal"
                    checked={selectedMethod === "paypal"}
                    onChange={() => setSelectedMethod("paypal")}
                    className="sr-only"
                  />
                  <span className="text-[10px] font-bold">PayPal</span>
                </label>
                <label 
                  className={`flex flex-col items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors ${selectedMethod === "collector" ? "border-yessal-violet bg-yessal-violet/10" : "border-border"}`}
                  onClick={() => setSelectedMethod("collector")}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="collector"
                    checked={selectedMethod === "collector"}
                    onChange={() => setSelectedMethod("collector")}
                    className="sr-only"
                  />
                  <span className="text-[10px] font-bold">Collecteur</span>
                </label>
                <label
                  className={`flex flex-col items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors ${selectedMethod === "virement" ? "border-yessal-violet bg-yessal-violet/10" : "border-border"}`}
                  onClick={() => setSelectedMethod("virement")}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="virement"
                    checked={selectedMethod === "virement"}
                    onChange={() => setSelectedMethod("virement")}
                    className="sr-only"
                  />
                  <Landmark size={14} />
                  <span className="text-[10px] font-bold">Virement</span>
                </label>
              </div>
            </div>

            {selectedMethod === "virement" && (
              <div className="space-y-2 rounded-xl border p-4 bg-muted/20" style={{ borderColor: "var(--border)" }}>
                <p className="text-xs font-semibold">Coordonnees bancaires</p>
                <p className="text-xs text-muted-foreground">{bankConfig.bank_name} - {bankConfig.account_name}</p>
                <p className="text-xs">IBAN: {bankConfig.iban}</p>
                <p className="text-xs">BIC: {bankConfig.bic}</p>
                <div className="space-y-1.5 pt-2">
                  <Label htmlFor="wireReference">Reference de virement</Label>
                  <Input id="wireReference" name="wireReference" placeholder={bankConfig.reference_format} required />
                </div>
              </div>
            )}

            <label className="flex items-center gap-2 text-xs">
              <input type="checkbox" name="isAnonymous" />
              Masquer mon identite dans l'etat du Ndiguel
            </label>

            {errorMsg && (
              <p className="text-xs text-red-600 font-medium">{errorMsg}</p>
            )}

            <Button
              type="submit"
              disabled={isPending}
              className="w-full gap-2 py-6 text-base"
              style={{ background: "var(--primary)", color: "white" }}
            >
              <CreditCard size={18} />
              {isPending ? "Traitement…" : "Confirmer le don"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
