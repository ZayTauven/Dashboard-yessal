"use client";

/*
 * ═══════════════════════════════════════════════════════════════════════════
 * Remises en espèces
 * ═══════════════════════════════════════════════════════════════════════════
 * Le dernier maillon du circuit des espèces : demandé → encaissé → CONFIRMÉ.
 * Un collecteur apporte l'argent ; l'administrateur coche les Jëfs qu'il
 * couvre, saisit ce qu'il a COMPTÉ, et ne peut valider que si les deux totaux
 * sont identiques. C'est la page du cahier, horodatée et signée — le bordereau
 * que le Kourel tenait à la main.
 *
 * L'écart n'est pas « corrigeable » ici : un Jëf qui n'a pas été remis se
 * décoche (il reste dans la caisse du collecteur), un Jëf qui n'aurait jamais
 * dû exister s'annule avec un motif. Le serveur refuse de toute façon une
 * remise dont le compte ne tombe pas juste.
 */

import { useMemo, useState, useTransition } from "react";
import { Ban, Check, FileCheck2, HandCoins, Phone } from "lucide-react";
import { toast } from "sonner";
import { cancelDonation, confirmCashDeposit } from "@/app/actions/donations";
import { Modal } from "@/components/vireo/Modal";
import { formatFCFA } from "@/lib/format";

export type CashDonation = {
  id: number;
  amount: number | string;
  donor_name?: string;
  donor_daara_name?: string | null;
  campaign_name?: string;
  is_anonymous?: boolean;
  collected_at?: string | null;
};

export type CashGroup = {
  collector: number;
  collector_name: string;
  collector_phone?: string | null;
  total_amount: number | string;
  count: number;
  since?: string | null;
  donations: CashDonation[];
};

export type CashDepositRow = {
  id: number;
  collector_name?: string;
  validated_by_name?: string;
  total_amount: number | string;
  total_count: number;
  note?: string;
  created_at: string;
};

const dateTime = new Intl.DateTimeFormat("fr-SN", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

const fmtDate = (value?: string | null) => (value ? dateTime.format(new Date(value)) : "—");

/* ── File d'attente : une carte par collecteur ─────────────────────────── */

export function PendingCashSection({
  groups,
  onChanged,
}: {
  groups: CashGroup[];
  onChanged: () => void;
}) {
  const [cancelling, setCancelling] = useState<CashDonation | null>(null);
  const [reason, setReason] = useState("");
  const [isPending, startTransition] = useTransition();

  const submitCancel = () => {
    if (!cancelling) return;
    const motif = reason.trim();
    if (!motif) {
      toast.error("Le motif est obligatoire : il sera lu par le membre et le collecteur.");
      return;
    }
    startTransition(async () => {
      const res = await cancelDonation(cancelling.id, motif);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success("Jëf annulé. Le membre et le collecteur sont prévenus.");
      setCancelling(null);
      setReason("");
      onChanged();
    });
  };

  if (groups.length === 0) return null;

  return (
    <>
      {groups.map((g) => (
        <CollectorCash
          /* La clé porte la LISTE des Jëfs : après une annulation ou une
             remise partielle, la carte repart d'une sélection fraîche au lieu
             de garder des identifiants qui ne sont plus dans la caisse. */
          key={`${g.collector}:${g.donations.map((d) => d.id).join(",")}`}
          group={g}
          onChanged={onChanged}
          onCancel={(d) => setCancelling(d)}
        />
      ))}

      <Modal
        open={Boolean(cancelling)}
        onOpenChange={(o) => {
          if (!o) {
            setCancelling(null);
            setReason("");
          }
        }}
        title="Annuler ce Jëf"
        description={
          cancelling
            ? `JEF-${cancelling.id} · ${formatFCFA(Number(cancelling.amount))} · ${
                cancelling.donor_name || "—"
              }`
            : undefined
        }
        status="warning"
        size="sm"
        footer={
          <>
            <button type="button" className="ax-btn ax-btn--ghost" onClick={() => setCancelling(null)}>
              <span className="ax-btn__label">Retour</span>
            </button>
            <button
              type="button"
              className="ax-btn ax-btn--danger"
              onClick={submitCancel}
              disabled={isPending}
            >
              <span className="ax-btn__label">Annuler le Jëf</span>
            </button>
          </>
        }
      >
        <div className="ax-field">
          <label className="ax-field__label" htmlFor="cancel-reason">
            Motif
            <span className="ax-field__required" aria-hidden="true"> *</span>
          </label>
          <textarea
            id="cancel-reason"
            rows={4}
            className="ax-textarea"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Doublon, erreur de membre, argent rendu…"
          />
          <p className="ax-field__hint">
            Le Jëf reste au registre avec ce motif. Si l&apos;argent a été
            encaissé, le collecteur doit le rendre au membre.
          </p>
        </div>
      </Modal>
    </>
  );
}

function CollectorCash({
  group,
  onChanged,
  onCancel,
}: {
  group: CashGroup;
  onChanged: () => void;
  onCancel: (d: CashDonation) => void;
}) {
  /* Tout est coché à l'arrivée : le cas courant est une remise complète. */
  const [selected, setSelected] = useState<Set<number>>(
    () => new Set(group.donations.map((d) => d.id)),
  );
  const [counted, setCounted] = useState("");
  const [note, setNote] = useState("");
  const [isPending, startTransition] = useTransition();

  const selectedTotal = useMemo(
    () =>
      group.donations
        .filter((d) => selected.has(d.id))
        .reduce((sum, d) => sum + Number(d.amount || 0), 0),
    [group.donations, selected],
  );
  const countedValue = counted === "" ? null : Number(counted);
  const ecart = countedValue === null ? null : countedValue - selectedTotal;
  const ready = selected.size > 0 && ecart === 0;

  const toggle = (id: number) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const submit = () => {
    if (!ready || countedValue === null) return;
    startTransition(async () => {
      const res = await confirmCashDeposit({
        collector: group.collector,
        donations: [...selected],
        counted_amount: countedValue,
        note: note.trim(),
      });
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success(
        `Remise n°${res.data?.id} validée : ${selected.size} Jëf(s), ${formatFCFA(selectedTotal)}.`,
      );
      onChanged();
    });
  };

  return (
    <section className="ax-card">
      <div className="ax-card__header">
        <span className="ax-card__kpi-icon ax-card__kpi-icon--c3" aria-hidden="true">
          <HandCoins />
        </span>
        <div className="ax-card__titles">
          <h2 className="ax-card__title">Remise de {group.collector_name}</h2>
          <p className="ax-card__subtitle">
            {group.count} Jëf(s) · {formatFCFA(Number(group.total_amount))} en caisse depuis le{" "}
            {fmtDate(group.since)}
            {group.collector_phone ? (
              <>
                {" · "}
                <Phone className="inline" size={12} aria-hidden="true" />{" "}
                <span className="font-mono tabular">{group.collector_phone}</span>
              </>
            ) : null}
          </p>
        </div>
      </div>

      <ul className="ax-list ax-list--comfortable">
        {group.donations.map((d) => (
          <li key={d.id} className="ax-list__row items-start">
            <label className="ax-check ax-list__content">
              <input
                type="checkbox"
                className="ax-checkbox"
                checked={selected.has(d.id)}
                onChange={() => toggle(d.id)}
                aria-label={`Inclure JEF-${d.id} dans la remise`}
              />
              <span className="flex flex-col gap-1">
                <span className="ax-cluster flex-wrap gap-2">
                  <span className="ax-list__title font-mono">JEF-{d.id}</span>
                  <span className="text-montant font-mono tabular font-semibold">
                    {formatFCFA(Number(d.amount || 0))}
                  </span>
                </span>
                <span className="ax-list__meta text-xs">
                  {d.is_anonymous ? "Anonyme" : d.donor_name || "—"}
                  {d.donor_daara_name ? ` · ${d.donor_daara_name}` : ""}
                  {d.campaign_name ? ` · ${d.campaign_name}` : ""}
                </span>
                <span className="ax-text-subtle text-xs">Encaissé le {fmtDate(d.collected_at)}</span>
              </span>
            </label>
            <button
              type="button"
              className="ax-btn ax-btn--ghost ax-btn--sm ax-list__trailing"
              onClick={() => onCancel(d)}
            >
              <Ban className="ax-btn__icon" size={14} aria-hidden="true" />
              <span className="ax-btn__label">Annuler</span>
            </button>
          </li>
        ))}
      </ul>

      <div className="ax-card__footer flex flex-col gap-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="ax-field">
            <label className="ax-field__label" htmlFor={`counted-${group.collector}`}>
              Montant compté
              <span className="ax-field__required" aria-hidden="true"> *</span>
            </label>
            <div className="ax-field__control">
              <input
                id={`counted-${group.collector}`}
                inputMode="numeric"
                className="ax-input ax-input--with-trailing font-mono tabular"
                placeholder="0"
                value={counted}
                onChange={(e) => setCounted(e.target.value.replace(/\D/g, ""))}
              />
              <span className="ax-field__affix ax-field__affix--trailing">FCFA</span>
            </div>
            {/* L'écart se lit AVANT de valider : c'est lui qui dit s'il faut
                recompter, ou décocher un Jëf que le collecteur n'a pas apporté. */}
            {ecart !== null && ecart !== 0 ? (
              <p className="ax-field__message ax-field__message--error">
                Écart de {formatFCFA(Math.abs(ecart))} {ecart > 0 ? "en trop" : "manquant"} par
                rapport aux Jëfs cochés ({formatFCFA(selectedTotal)}).
              </p>
            ) : (
              <p className="ax-field__hint">
                Jëfs cochés : {formatFCFA(selectedTotal)}. Saisissez ce que vous avez réellement
                compté.
              </p>
            )}
          </div>
          <div className="ax-field">
            <label className="ax-field__label" htmlFor={`note-${group.collector}`}>
              Note
            </label>
            <textarea
              id={`note-${group.collector}`}
              rows={2}
              className="ax-textarea"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Facultatif : lieu, circonstances…"
            />
          </div>
        </div>

        <button
          type="button"
          className="ax-btn ax-btn--primary ax-btn--block"
          onClick={submit}
          disabled={!ready || isPending}
        >
          <Check className="ax-btn__icon" size={16} aria-hidden="true" />
          <span className="ax-btn__label">
            Valider la remise de {formatFCFA(selectedTotal)}
          </span>
        </button>
      </div>
    </section>
  );
}

/* ── Historique : les bordereaux validés ───────────────────────────────── */

export function CashDepositHistory({ deposits }: { deposits: CashDepositRow[] }) {
  return (
    <section className="ax-card lg:col-span-3">
      <div className="ax-card__header">
        <span className="ax-card__kpi-icon ax-card__kpi-icon--c3" aria-hidden="true">
          <FileCheck2 />
        </span>
        <div className="ax-card__titles">
          <h2 className="ax-card__title">Bordereaux de remise</h2>
          <p className="ax-card__subtitle">
            Chaque remise d&apos;espèces validée : qui a apporté, qui a compté, combien.
          </p>
        </div>
      </div>

      {deposits.length === 0 ? (
        <div className="ax-card__body">
          <p className="ax-text-muted text-sm">Aucune remise validée pour l&apos;instant.</p>
        </div>
      ) : (
        <ul className="ax-list ax-list--comfortable">
          {deposits.map((r) => (
            <li key={r.id} className="ax-list__row items-start">
              <span className="ax-list__content gap-1">
                <span className="ax-cluster flex-wrap gap-2">
                  <span className="ax-list__title font-mono">Remise n°{r.id}</span>
                  <span className="text-montant font-mono tabular font-semibold">
                    {formatFCFA(Number(r.total_amount))}
                  </span>
                  <span className="ax-badge ax-badge--soft ax-badge--sm">
                    {r.total_count} Jëf(s)
                  </span>
                </span>
                <span className="ax-list__meta text-xs">
                  Apportée par <span className="ax-text-strong">{r.collector_name || "—"}</span>,
                  comptée par <span className="ax-text-strong">{r.validated_by_name || "—"}</span>
                  {r.note ? ` · ${r.note}` : ""}
                </span>
              </span>
              <span className="ax-text-subtle ax-list__trailing text-xs">{fmtDate(r.created_at)}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
