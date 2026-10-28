"use client";

/*
 * Les deux files du collecteur, au-dessus du formulaire de collecte :
 *
 *   · DEMANDES DE COLLECTE — les membres qui ont choisi « Collecteur » et
 *     attendent qu'on passe. Il en était notifié, mais ne les voyait nulle part :
 *     le serveur ne lui rendait que ses propres encaissements.
 *   · MA CAISSE — ce qu'il a encaissé et pas encore remis à l'administration.
 *     C'est la somme dont il répond ; elle ne redescend qu'à la remise.
 *
 * « Encaisser » se confirme dans un dialogue qui répète le nom et le montant :
 * le membre reçoit son reçu à l'instant, le geste ne se défait pas.
 */

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { HandCoins, Inbox, Phone, Wallet } from "lucide-react";
import { toast } from "sonner";
import { collectDonation } from "@/app/actions/donations";
import { useConfirm } from "@/components/vireo/ConfirmDialog";
import { formatFCFA } from "@/lib/format";

export type QueueDonation = {
  id: number;
  amount: number | string;
  donor_name?: string;
  donor_phone?: string | null;
  donor_daara_name?: string | null;
  campaign_name?: string;
  created_at: string;
  collected_at?: string | null;
};

const dateFmt = new Intl.DateTimeFormat("fr-SN", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

export function CollectQueues({
  requests,
  cash,
}: {
  requests: QueueDonation[];
  cash: QueueDonation[];
}) {
  const router = useRouter();
  const { ask, dialog } = useConfirm();
  const [isPending, startTransition] = useTransition();

  const cashTotal = cash.reduce((sum, d) => sum + Number(d.amount || 0), 0);

  const encaisser = (d: QueueDonation) =>
    ask({
      title: `Avez-vous reçu ${formatFCFA(Number(d.amount))} ?`,
      description: `De ${d.donor_name || "ce membre"}${
        d.campaign_name ? ` pour « ${d.campaign_name} »` : ""
      }. Le membre reçoit son reçu immédiatement, et la somme entre dans votre caisse jusqu'à la remise.`,
      confirmLabel: "Oui, j'ai encaissé",
      tone: "info",
      onConfirm: () =>
        new Promise<void>((resolve) =>
          startTransition(async () => {
            const res = await collectDonation(d.id);
            if (res.error) toast.error(res.error);
            else toast.success("Encaissement enregistré. Le membre a reçu son reçu.");
            router.refresh();
            resolve();
          }),
        ),
    });

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <section className="ax-card lg:col-span-2">
        <div className="ax-card__header">
          <span className="ax-card__kpi-icon ax-card__kpi-icon--c2" aria-hidden="true">
            <Inbox />
          </span>
          <div className="ax-card__titles">
            <h2 className="ax-card__title">Demandes de collecte</h2>
            <p className="ax-card__subtitle">
              Des membres attendent votre passage. Appelez avant de vous déplacer.
            </p>
          </div>
          {requests.length > 0 && (
            <span className="ax-badge ax-badge--warning ax-badge--sm">{requests.length}</span>
          )}
        </div>

        {requests.length === 0 ? (
          <div className="ax-card__body">
            <p className="ax-text-muted text-sm">Aucune demande en attente.</p>
          </div>
        ) : (
          <ul className="ax-list ax-list--comfortable">
            {requests.map((d) => (
              <li key={d.id} className="ax-list__row items-start">
                <span className="ax-list__content gap-1">
                  <span className="ax-cluster flex-wrap gap-2">
                    <span className="ax-list__title">{d.donor_name || "—"}</span>
                    <span className="text-montant font-mono tabular font-semibold">
                      {formatFCFA(Number(d.amount || 0))}
                    </span>
                  </span>
                  <span className="ax-list__meta text-xs">
                    {d.donor_daara_name || "Sans Daara"}
                    {d.campaign_name ? ` · ${d.campaign_name}` : ""}
                  </span>
                  <span className="ax-text-subtle flex flex-wrap items-center gap-x-3 text-xs">
                    {d.donor_phone && (
                      <a href={`tel:${d.donor_phone}`} className="ax-link inline-flex items-center gap-1">
                        <Phone size={12} aria-hidden="true" />
                        <span className="font-mono tabular">{d.donor_phone}</span>
                      </a>
                    )}
                    <span>Demandé le {dateFmt.format(new Date(d.created_at))}</span>
                  </span>
                </span>
                <button
                  type="button"
                  className="ax-btn ax-btn--soft-success ax-btn--sm ax-list__trailing"
                  onClick={() => encaisser(d)}
                  disabled={isPending}
                >
                  <HandCoins className="ax-btn__icon" size={14} aria-hidden="true" />
                  <span className="ax-btn__label">Encaisser</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="ax-card">
        <div className="ax-card__header">
          <span className="ax-card__kpi-icon ax-card__kpi-icon--c3" aria-hidden="true">
            <Wallet />
          </span>
          <div className="ax-card__titles">
            <h2 className="ax-card__title">Ma caisse</h2>
            <p className="ax-card__subtitle">À remettre à l&apos;administration.</p>
          </div>
        </div>
        <div className="ax-card__body flex flex-col gap-2">
          <span className="text-montant font-mono tabular text-2xl font-semibold">
            {formatFCFA(cashTotal)}
          </span>
          <span className="ax-text-muted text-sm">
            {cash.length === 0
              ? "Rien en caisse."
              : `${cash.length} Jëf(s) encaissé(s), confirmés à la remise.`}
          </span>
          {cash.length > 0 && (
            <ul className="ax-list ax-list--compact">
              {cash.map((d) => (
                <li key={d.id} className="ax-list__row">
                  <span className="ax-list__content">
                    <span className="ax-list__title text-sm">{d.donor_name || "—"}</span>
                    <span className="ax-list__meta text-xs">
                      JEF-{d.id}
                      {d.collected_at ? ` · ${dateFmt.format(new Date(d.collected_at))}` : ""}
                    </span>
                  </span>
                  <span className="ax-list__trailing font-mono tabular text-sm">
                    {formatFCFA(Number(d.amount || 0))}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {dialog}
    </div>
  );
}
