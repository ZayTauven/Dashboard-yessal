"use client";

/*
 * ═══════════════════════════════════════════════════════════════════════════
 * Pilotage › Collecteurs
 * ═══════════════════════════════════════════════════════════════════════════
 * Trois questions, dans cet ordre :
 *
 *   1. La collecte en espèces est-elle ouverte ? — l'interrupteur. Le Kourel
 *      veut qu'un jour tout passe par le paiement mobile et la banque ; ce
 *      jour-là, on coupe. Le geste est lourd (tous les membres sont prévenus,
 *      les demandes en cours tombent) : il demande un code reçu par courriel,
 *      une case « j'ai compris », puis le mot SUSPENDRE tapé en toutes
 *      lettres. Reprendre demande le code, sans le mot.
 *   2. Chaque zone a-t-elle quelqu'un ? — une zone sans collecteur n'offre
 *      pas l'option « Collecteur » à ses membres.
 *   3. Qui couvre quoi ? — les zones LDD de chaque collecteur. Il ne voit que
 *      les demandes de ses zones ; il peut toujours encaisser pour n'importe
 *      quel membre qui le sollicite.
 */

import { useMemo, useState, useTransition } from "react";
import { HandCoins, MapPin, Pencil, Search, ShieldAlert, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import {
  requestCollecteCode,
  setCollecteurZones,
  toggleCollecte,
  type Collecteur,
  type ZoneCouverture,
} from "@/app/actions/collecte";
import { Modal } from "@/components/vireo/Modal";
import { formatFCFA } from "@/lib/format";

export type CollecteSettings = {
  collecte_physique_active?: boolean;
  collecte_modifiee_le?: string | null;
  collecte_modifiee_par_nom?: string | null;
};

const dateFmt = new Intl.DateTimeFormat("fr-SN", {
  day: "2-digit",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export function CollecteursPanel({
  settings,
  collecteurs,
  zones,
  onChanged,
}: {
  settings: CollecteSettings | null;
  collecteurs: Collecteur[];
  zones: ZoneCouverture[];
  onChanged: () => void;
}) {
  const active = settings?.collecte_physique_active !== false;
  const [switchOpen, setSwitchOpen] = useState(false);
  const [editing, setEditing] = useState<Collecteur | null>(null);

  const territoires = zones.filter((z) => z.geographique !== false);
  const sansCollecteur = territoires.filter((z) => z.collecteurs === 0);

  return (
    <div className="flex flex-col gap-4" role="tabpanel">
      {/* ── 1. Interrupteur ── */}
      <section className="ax-card">
        <div className="ax-card__header">
          <span
            className={`ax-card__kpi-icon ${active ? "ax-card__kpi-icon--c3" : "ax-card__kpi-icon--c4"}`}
            aria-hidden="true"
          >
            {active ? <ShieldCheck /> : <ShieldAlert />}
          </span>
          <div className="ax-card__titles">
            <h2 className="ax-card__title">
              Collecte en espèces : {active ? "ouverte" : "suspendue"}
            </h2>
            <p className="ax-card__subtitle">
              {settings?.collecte_modifiee_le
                ? `Modifiée le ${dateFmt.format(new Date(settings.collecte_modifiee_le))}${
                    settings.collecte_modifiee_par_nom ? ` par ${settings.collecte_modifiee_par_nom}` : ""
                  }.`
                : "Jamais modifiée."}
            </p>
          </div>
          <button
            type="button"
            className={`ax-btn ${active ? "ax-btn--danger" : "ax-btn--primary"}`}
            onClick={() => setSwitchOpen(true)}
          >
            <span className="ax-btn__label">
              {active ? "Suspendre la collecte" : "Reprendre la collecte"}
            </span>
          </button>
        </div>
        <div className="ax-card__body">
          <p className="ax-text-muted text-sm">
            {active
              ? "Les membres dont la zone est couverte peuvent demander une collecte ; les collecteurs encaissent et remettent l'argent à l'administration."
              : "Plus aucune demande ni aucun encaissement en espèces. L'argent déjà encaissé reste à remettre depuis l'onglet « À traiter »."}
          </p>
        </div>
      </section>

      {/* ── 2. Couverture ── */}
      <section className="ax-card">
        <div className="ax-card__header">
          <span className="ax-card__kpi-icon ax-card__kpi-icon--c2" aria-hidden="true">
            <MapPin />
          </span>
          <div className="ax-card__titles">
            <h2 className="ax-card__title">Couverture des zones</h2>
            <p className="ax-card__subtitle">
              {territoires.length - sansCollecteur.length} zone(s) couverte(s) sur {territoires.length}.
              Sans collecteur, l&apos;option « Collecteur » n&apos;est pas proposée aux membres.
            </p>
          </div>
        </div>
        {sansCollecteur.length > 0 && (
          <div className="ax-card__body flex flex-wrap gap-2">
            {sansCollecteur.map((z) => (
              <span key={z.id} className="ax-badge ax-badge--warning ax-badge--sm">
                {z.code} · {z.nom}
              </span>
            ))}
          </div>
        )}
      </section>

      {/* ── 3. Collecteurs ── */}
      <section className="ax-card">
        <div className="ax-card__header">
          <span className="ax-card__kpi-icon ax-card__kpi-icon--c1" aria-hidden="true">
            <HandCoins />
          </span>
          <div className="ax-card__titles">
            <h2 className="ax-card__title">Collecteurs</h2>
            <p className="ax-card__subtitle">
              Chacun ne voit que les demandes de ses zones. À sa nomination, la zone de son Daara
              lui est attribuée d&apos;office.
            </p>
          </div>
          <span className="ax-badge ax-badge--count ax-badge--sm">{collecteurs.length}</span>
        </div>

        {collecteurs.length === 0 ? (
          <div className="ax-card__body">
            <p className="ax-text-muted text-sm">
              Aucun collecteur. Nommez-en un depuis la fiche d&apos;un membre ou « Mon Daara ».
            </p>
          </div>
        ) : (
          <ul className="ax-list ax-list--comfortable">
            {collecteurs.map((c) => (
              <li key={c.id} className="ax-list__row items-start">
                <span className="ax-list__content gap-1">
                  <span className="ax-cluster flex-wrap gap-2">
                    <span className="ax-list__title">{c.nom}</span>
                    {c.statut !== "active" && (
                      <span className="ax-badge ax-badge--neutral ax-badge--sm">Inactif</span>
                    )}
                    {Number(c.caisse) > 0 && (
                      <span className="ax-badge ax-badge--info ax-badge--sm">
                        Caisse : {formatFCFA(Number(c.caisse))}
                      </span>
                    )}
                  </span>
                  <span className="ax-list__meta text-xs">
                    {c.daara || "Sans Daara"}
                    {c.ldd ? ` · ${c.ldd}` : ""}
                    {c.telephone ? ` · ${c.telephone}` : ""}
                  </span>
                  <span className="flex flex-wrap gap-1 pt-1">
                    {c.zones.length === 0 ? (
                      <span className="ax-badge ax-badge--warning ax-badge--sm">
                        Aucune zone : ne voit aucune demande
                      </span>
                    ) : (
                      c.zones.map((z) => (
                        <span key={z.id} className="ax-badge ax-badge--soft ax-badge--sm">
                          {z.code} · {z.nom}
                        </span>
                      ))
                    )}
                  </span>
                </span>
                <button
                  type="button"
                  className="ax-btn ax-btn--ghost ax-btn--sm ax-list__trailing"
                  onClick={() => setEditing(c)}
                >
                  <Pencil className="ax-btn__icon" size={14} aria-hidden="true" />
                  <span className="ax-btn__label">Zones</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {switchOpen && (
        <SwitchFlow
          active={active}
          onClose={() => setSwitchOpen(false)}
          onDone={() => {
            setSwitchOpen(false);
            onChanged();
          }}
        />
      )}

      {editing && (
        <ZonesEditor
          collecteur={editing}
          zones={zones}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            onChanged();
          }}
        />
      )}
    </div>
  );
}

/* ── L'interrupteur : avertir → code → confirmer ───────────────────────── */

type Step = "warn" | "code" | "confirm";

function SwitchFlow({
  active,
  onClose,
  onDone,
}: {
  active: boolean;
  onClose: () => void;
  onDone: () => void;
}) {
  const suspendre = active;
  const [step, setStep] = useState<Step>("warn");
  const [code, setCode] = useState("");
  const [understood, setUnderstood] = useState(false);
  const [typed, setTyped] = useState("");
  const [isPending, startTransition] = useTransition();

  const sendCode = () =>
    startTransition(async () => {
      const res = await requestCollecteCode(!active);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      if (res.data?.envoye === false) toast.warning(res.data.detail);
      else toast.success(res.data?.detail ?? "Code envoyé.");
      setStep("code");
    });

  const submit = () =>
    startTransition(async () => {
      const res = await toggleCollecte(!active, code.trim());
      if (res.error) {
        toast.error(res.error);
        /* Un code faux renvoie à sa saisie, pas au début du parcours. */
        setStep("code");
        return;
      }
      toast.success(
        suspendre
          ? `Collecte suspendue. ${res.data?.demandes_annulees ?? 0} demande(s) annulée(s), tous les membres sont prévenus.`
          : "Collecte reprise. Les membres sont prévenus.",
      );
      onDone();
    });

  const footer =
    step === "warn" ? (
      <>
        <button type="button" className="ax-btn ax-btn--ghost" onClick={onClose}>
          <span className="ax-btn__label">Annuler</span>
        </button>
        <button type="button" className="ax-btn ax-btn--primary" onClick={sendCode} disabled={isPending}>
          <span className="ax-btn__label">M&apos;envoyer un code</span>
        </button>
      </>
    ) : step === "code" ? (
      <>
        <button type="button" className="ax-btn ax-btn--ghost" onClick={sendCode} disabled={isPending}>
          <span className="ax-btn__label">Renvoyer un code</span>
        </button>
        <button
          type="button"
          className="ax-btn ax-btn--primary"
          onClick={() => (suspendre ? setStep("confirm") : submit())}
          disabled={code.trim().length !== 6 || !understood || isPending}
        >
          <span className="ax-btn__label">{suspendre ? "Continuer" : "Reprendre la collecte"}</span>
        </button>
      </>
    ) : (
      <>
        <button type="button" className="ax-btn ax-btn--ghost" onClick={onClose}>
          <span className="ax-btn__label">Non, ne rien changer</span>
        </button>
        <button
          type="button"
          className="ax-btn ax-btn--danger"
          onClick={submit}
          disabled={typed.trim().toUpperCase() !== "SUSPENDRE" || isPending}
        >
          <span className="ax-btn__label">Oui, suspendre la collecte</span>
        </button>
      </>
    );

  return (
    <Modal
      open
      onOpenChange={(o) => !o && onClose()}
      title={suspendre ? "Suspendre la collecte en espèces" : "Reprendre la collecte en espèces"}
      status={suspendre ? "danger" : "info"}
      size="sm"
      footer={footer}
    >
      {step === "warn" && (
        <div className="flex flex-col gap-3 text-sm">
          {suspendre ? (
            <ul className="flex list-disc flex-col gap-2 ps-5">
              <li>
                <strong>Tous les membres</strong> seront prévenus de ne confier leur argent à personne
                qui se présenterait comme collecteur.
              </li>
              <li>Les demandes de collecte en cours seront <strong>annulées</strong>.</li>
              <li>Plus aucune demande ni aucun encaissement en espèces ne sera possible.</li>
              <li>L&apos;argent déjà encaissé restera à remettre et à valider.</li>
            </ul>
          ) : (
            <p>
              Les membres dont la zone est couverte pourront de nouveau demander une collecte, et les
              collecteurs encaisser. Tous les membres en seront prévenus.
            </p>
          )}
          <p className="ax-text-muted">
            Pour confirmer qu&apos;il s&apos;agit bien de vous, un code à usage unique va être envoyé à
            votre adresse e-mail.
          </p>
        </div>
      )}

      {step === "code" && (
        <div className="flex flex-col gap-4">
          <div className="ax-field">
            <label className="ax-field__label" htmlFor="collecte-code">
              Code reçu par e-mail
            </label>
            <input
              id="collecte-code"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              className="ax-input ax-input--lg font-mono tracking-widest"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              placeholder="000000"
            />
            <p className="ax-field__hint">Valable 10 minutes, 5 essais.</p>
          </div>
          <label className="ax-check">
            <input
              type="checkbox"
              className="ax-checkbox"
              checked={understood}
              onChange={(e) => setUnderstood(e.target.checked)}
            />
            <span className="text-sm">
              {suspendre
                ? "J'ai compris : tous les membres seront prévenus et les demandes en cours annulées."
                : "J'ai compris : la collecte en espèces sera de nouveau ouverte."}
            </span>
          </label>
        </div>
      )}

      {step === "confirm" && (
        <div className="flex flex-col gap-4 text-sm">
          <p>
            <strong>Êtes-vous certain de vouloir suspendre la collecte en espèces ?</strong> Le message
            partira immédiatement à tous les membres.
          </p>
          <div className="ax-field">
            <label className="ax-field__label" htmlFor="collecte-mot">
              Tapez SUSPENDRE pour confirmer
            </label>
            <input
              id="collecte-mot"
              className="ax-input font-mono"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              autoComplete="off"
            />
          </div>
        </div>
      )}
    </Modal>
  );
}

/* ── Les zones d'un collecteur ─────────────────────────────────────────── */

function ZonesEditor({
  collecteur,
  zones,
  onClose,
  onSaved,
}: {
  collecteur: Collecteur;
  zones: ZoneCouverture[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const initiales = useMemo(() => new Set(collecteur.zones.map((z) => z.id)), [collecteur]);
  const [selected, setSelected] = useState<Set<number>>(() => new Set(initiales));
  const [query, setQuery] = useState("");
  const [isPending, startTransition] = useTransition();

  const visibles = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q
      ? zones.filter((z) => `${z.code} ${z.nom}`.toLowerCase().includes(q))
      : zones;
  }, [zones, query]);

  const toggle = (id: number) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  /* `z.collecteurs` compte l'état ENREGISTRÉ : sans cet ajustement, décocher
   * une zone laissait « 1 collecteur(s) » affiché alors qu'il n'en resterait aucun. */
  const compte = (z: ZoneCouverture) =>
    z.collecteurs - (initiales.has(z.id) ? 1 : 0) + (selected.has(z.id) ? 1 : 0);

  const save = () =>
    startTransition(async () => {
      const res = await setCollecteurZones(collecteur.id, [...selected]);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success(`Zones de ${collecteur.nom} enregistrées.`);
      onSaved();
    });

  return (
    <Modal
      open
      onOpenChange={(o) => !o && onClose()}
      title={`Zones de ${collecteur.nom}`}
      description={
        selected.size === 0
          ? "Aucune zone sélectionnée : il ne verra aucune demande de collecte."
          : `${selected.size} zone(s) sélectionnée(s). Il ne verra que les demandes de ces zones.`
      }
      size="md"
      footer={
        <>
          <button type="button" className="ax-btn ax-btn--ghost" onClick={onClose}>
            <span className="ax-btn__label">Annuler</span>
          </button>
          <button
            type="button"
            className={`ax-btn ${selected.size === 0 ? "ax-btn--danger" : "ax-btn--primary"}`}
            onClick={save}
            disabled={isPending}
          >
            <span className="ax-btn__label">
              {selected.size === 0 ? "Enregistrer sans zone" : "Enregistrer"}
            </span>
          </button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <div className="ax-field__control">
          <span className="ax-field__affix ax-field__affix--leading">
            <Search aria-hidden="true" />
          </span>
          <input
            type="search"
            className="ax-input ax-input--with-leading-icon"
            placeholder="Code ou nom de zone…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Rechercher une zone"
          />
        </div>
        <ul className="flex max-h-80 flex-col gap-1 overflow-y-auto">
          {visibles.map((z) => (
            <li key={z.id}>
              <label className="ax-check py-1">
                <input
                  type="checkbox"
                  className="ax-checkbox"
                  checked={selected.has(z.id)}
                  onChange={() => toggle(z.id)}
                />
                <span className="flex flex-1 items-center justify-between gap-2 text-sm">
                  <span>
                    <span className="font-mono">{z.code}</span> · {z.nom}
                    {z.geographique === false && (
                      <span className="ax-text-muted"> (hors territoire)</span>
                    )}
                  </span>
                  <span className={`ax-badge ax-badge--sm ${compte(z) ? "ax-badge--soft" : "ax-badge--warning"}`}>
                    {compte(z)} collecteur(s)
                  </span>
                </span>
              </label>
            </li>
          ))}
        </ul>
      </div>
    </Modal>
  );
}
