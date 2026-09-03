"use client";

/*
 * ═══════════════════════════════════════════════════════════════════════════
 * Nouveau Jëf
 * ═══════════════════════════════════════════════════════════════════════════
 * Formulaire court, sur les contrats `.ax-field` de Vireo (patron
 * `forms/Layouts`). Un assistant multi-étapes serait ici du zèle : quatre
 * champs tiennent sur un écran, et découper un don en trois pages ajoute des
 * clics sans réduire la charge mentale.
 *
 * Trois corrections :
 *
 *   · Les sept moyens de paiement passent par <PaymentMethodPicker>. Ils
 *     étaient recopiés à l'identique ici ET dans la modale des Ndiguels — et
 *     les deux listes avaient divergé, le virement bancaire n'existant que
 *     dans cet écran-ci.
 *
 *   · Les coordonnées bancaires étaient écrites sans accents (« Coordonnees »,
 *     « Reference », « identite ») et l'IBAN en police proportionnelle. Un IBAN
 *     se recopie caractère par caractère : il passe en chiffres tabulaires.
 *
 *   · Le champ montant portait l'unité « FCFA » à GAUCHE, avant le nombre —
 *     l'inverse de l'usage local, et de ce que fait le reste de l'interface.
 */

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, CreditCard, Wallet } from "lucide-react";
import { toast } from "sonner";
import { makeDonation, payDonation } from "@/app/actions/donations";
import { PaymentMethodPicker } from "@/components/vireo/PaymentMethodPicker";

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
        return;
      }

      const donation = res.data;

      // Collecte physique : rien à payer en ligne, on notifie les responsables.
      if (paymentMethod === "collector") {
        toast.success(
          "Demande de collecte enregistrée. Les responsables ont été notifiés.",
        );
        router.push("/dashboard/donations");
        return;
      }

      // Paiement digital : on enchaîne sur Bictorys.
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
          toast.success(
            "Demande de paiement envoyée. Validez sur votre téléphone.",
          );
        }
      }

      router.push("/dashboard/donations");
    });
  };

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
      <Link href="/dashboard/donations" className="ax-btn ax-btn--ghost w-fit">
        <ArrowLeft className="ax-btn__icon" size={16} aria-hidden="true" />
        <span className="ax-btn__label">Retour à mes Jëfs</span>
      </Link>

      <section className="ax-card">
        <div className="ax-card__header">
          <span className="ax-card__kpi-icon ax-card__kpi-icon--c1" aria-hidden="true">
            <Wallet />
          </span>
          <div className="ax-card__titles">
            <h2 className="ax-card__title">Faire un Jëf</h2>
            <p className="ax-card__subtitle">
              Choisissez un Ndiguel, un montant et un moyen de paiement.
            </p>
          </div>
        </div>

        <div className="ax-card__body">
          {campaigns.length === 0 ? (
            <div className="ax-alert ax-alert--info">
              <Wallet className="ax-alert__icon" aria-hidden="true" />
              <div className="ax-alert__content">
                <p className="ax-alert__title">Aucun Ndiguel en cours</p>
                <p className="ax-alert__message">
                  Un Jëf se rattache toujours à un Ndiguel. Revenez lorsqu&apos;une
                  campagne sera lancée.
                </p>
                <div className="ax-alert__actions">
                  <Link
                    href="/dashboard/campaigns"
                    className="ax-btn ax-btn--soft-info ax-btn--sm"
                  >
                    <span className="ax-btn__label">Voir les Ndiguels</span>
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <form action={handleDonation} className="flex flex-col gap-5">
              <div className="ax-field">
                <label className="ax-field__label" htmlFor="campaignId">
                  Ndiguel
                  <span className="ax-field__required" aria-hidden="true"> *</span>
                </label>
                <select
                  id="campaignId"
                  name="campaignId"
                  className="ax-select"
                  required
                  defaultValue={defaultCampaignId || ""}
                >
                  <option value="" disabled>
                    Sélectionner un Ndiguel…
                  </option>
                  {campaigns.map((c) => (
                    <option key={c.id} value={String(c.id)}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="ax-field">
                <label className="ax-field__label" htmlFor="amount">
                  Montant
                  <span className="ax-field__required" aria-hidden="true"> *</span>
                </label>
                <div className="ax-field__control">
                  <input
                    id="amount"
                    name="amount"
                    type="number"
                    min={5}
                    step={500}
                    inputMode="numeric"
                    className="ax-input ax-input--lg ax-input--with-trailing font-mono tabular"
                    placeholder="5000"
                    required
                  />
                  {/* L'unité suit le nombre, comme partout ailleurs. */}
                  <span className="ax-field__affix ax-field__affix--trailing">
                    FCFA
                  </span>
                </div>
              </div>

              {tutelles.length > 0 && (
                <div className="ax-field">
                  <label className="ax-field__label" htmlFor="beneficiaryId">
                    Bénéficiaire
                  </label>
                  <select
                    id="beneficiaryId"
                    name="beneficiaryId"
                    className="ax-select"
                  >
                    <option value="">Pour moi-même</option>
                    {tutelles.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.first_name} {t.last_name}
                      </option>
                    ))}
                  </select>
                  <p className="ax-field__hint">
                    Vous pouvez donner au nom d&apos;un proche sous votre tutelle.
                  </p>
                </div>
              )}

              <PaymentMethodPicker
                value={selectedMethod}
                onChange={setSelectedMethod}
              />

              {selectedMethod === "virement" && (
                <div className="ax-card ax-card--compact">
                  <div className="ax-card__body flex flex-col gap-3">
                    <h3 className="ax-eyebrow">Coordonnées bancaires</h3>

                    <ul className="ax-list ax-list--compact">
                      <li className="ax-list__row px-0!">
                        <span className="ax-list__content">
                          <span className="ax-list__title">
                            {bankConfig.bank_name}
                          </span>
                          <span className="ax-list__meta">
                            {bankConfig.account_name}
                          </span>
                        </span>
                      </li>
                      <li className="ax-list__row px-0!">
                        <span className="ax-list__content">
                          {/* Un IBAN se recopie caractère par caractère : il lui
                              faut des chiffres tabulaires. */}
                          <span className="ax-list__title font-mono tabular">
                            {bankConfig.iban}
                          </span>
                          <span className="ax-list__meta">IBAN</span>
                        </span>
                      </li>
                      <li className="ax-list__row px-0!">
                        <span className="ax-list__content">
                          <span className="ax-list__title font-mono tabular">
                            {bankConfig.bic}
                          </span>
                          <span className="ax-list__meta">BIC</span>
                        </span>
                      </li>
                    </ul>

                    <div className="ax-field">
                      <label className="ax-field__label" htmlFor="wireReference">
                        Référence du virement
                        <span className="ax-field__required" aria-hidden="true"> *</span>
                      </label>
                      <input
                        id="wireReference"
                        name="wireReference"
                        className="ax-input font-mono"
                        placeholder={bankConfig.reference_format}
                        required
                      />
                      <p className="ax-field__hint">
                        Effectuez le virement, puis saisissez sa référence ici.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <label className="ax-check">
                <input
                  type="checkbox"
                  name="isAnonymous"
                  className="ax-checkbox"
                />
                <span className="text-sm">
                  Masquer mon identité dans l&apos;état du Ndiguel
                </span>
              </label>

              {errorMsg && (
                <p className="ax-field__message ax-field__message--error">
                  {errorMsg}
                </p>
              )}

              <button
                type="submit"
                className="ax-btn ax-btn--primary ax-btn--lg ax-btn--block"
                disabled={isPending}
              >
                <CreditCard className="ax-btn__icon" size={18} aria-hidden="true" />
                <span className="ax-btn__label">
                  {isPending ? "Traitement…" : "Confirmer le Jëf"}
                </span>
              </button>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}
