"use client";

/*
 * ═══════════════════════════════════════════════════════════════════════════
 * Collecte physique
 * ═══════════════════════════════════════════════════════════════════════════
 * Le poste de travail du collecteur : il est debout, souvent sur téléphone,
 * face à quelqu'un qui lui tend de l'argent. La tâche est strictement linéaire
 * — identifier la personne, puis enregistrer le versement — mais l'écran la
 * présentait comme deux panneaux côte à côte de même poids, dont le second
 * restait grisé sans jamais dire qu'il ATTENDAIT le premier.
 *
 * D'où le numérotage explicite des deux étapes, et le passage du second panneau
 * en `is-selected` dès qu'un membre est choisi : on voit d'un coup d'œil où on
 * en est, y compris en pleine rue à bout de bras.
 *
 * Corrections de fond au passage :
 *
 *   · « Attribuer au Jëf (Campagne) » désignait la campagne sous le nom du don.
 *     Un Jëf est le DON, un Ndiguel est la CAMPAGNE — l'étiquette annonçait
 *     donc l'inverse de ce que le champ contient.
 *   · La recherche relançait sa requête à chaque frappe passé deux caractères
 *     sans jamais annuler la précédente ; les réponses pouvaient revenir dans
 *     le désordre et afficher les résultats d'une saisie déjà effacée.
 *   · `any` partout — la forme des membres et des Ndiguels est désormais typée.
 */

import { useEffect, useState, useTransition } from "react";
import {
  Banknote,
  CheckCircle2,
  Copy,
  KeyRound,
  Loader2,
  Search,
  UserPlus,
  UserSearch,
} from "lucide-react";
import { toast } from "sonner";
import { createUserByAdmin, searchMembers } from "@/app/actions/users";
import { makeDonation } from "@/app/actions/donations";
import { generateProvisionalPassword } from "@/lib/password";
import { roleLabelLong } from "@/lib/roles";
import { ErrorAlert } from "@/components/ui/error-alert";
import PhoneNumberValidation from "@/components/PhoneNumberValidation";
import { Avatar } from "@/components/vireo/Avatar";
import { CardHeader } from "@/components/vireo/CardHeader";
import { Modal } from "@/components/vireo/Modal";

export interface CollectMember {
  id: number;
  first_name: string;
  last_name: string;
  email?: string | null;
  phone?: string | null;
  role?: string | null;
  avatar?: string | null;
  avatar_url?: string | null;
}

export interface CollectCampaign {
  id: number;
  name: string;
  status?: string | null;
}

const fullName = (m: CollectMember) =>
  `${m.first_name ?? ""} ${m.last_name ?? ""}`.trim();

export function CollectClient({ campaigns }: { campaigns: CollectCampaign[] }) {
  const [query, setQuery] = useState("");
  const [members, setMembers] = useState<CollectMember[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<CollectMember | null>(null);
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  /* Le mot de passe qui vient d'être attribué, le temps de le transmettre. */
  const [issued, setIssued] = useState<{ name: string; password: string } | null>(
    null,
  );
  const [paymentMethod, setPaymentMethod] = useState("manual");

  const activeCampaigns = campaigns.filter((c) => c.status === "active");

  /*
   * Recherche différée de 400 ms, ANNULÉE si la saisie change avant la réponse.
   * Le drapeau `cancelled` est ce qui manquait : sans lui, une réponse lente
   * pour « ama » pouvait écraser les résultats déjà affichés pour « amadou ».
   */
  useEffect(() => {
    if (query.trim().length < 2) {
      setMembers([]);
      setSearching(false);
      return;
    }

    let cancelled = false;
    setSearching(true);

    const timer = setTimeout(async () => {
      const res = await searchMembers(query.trim());
      if (cancelled) return;
      if (res.error) setErrorMsg(res.error);
      else setMembers((res.data ?? []) as CollectMember[]);
      setSearching(false);
    }, 400);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  const handleCollect = (formData: FormData) => {
    setErrorMsg("");
    startTransition(async () => {
      const res = await makeDonation(formData);
      if (res.error) {
        setErrorMsg(res.error);
        return;
      }
      if (res.redirectUrl) {
        window.location.href = res.redirectUrl;
        return;
      }
      setSelected(null);
      setQuery("");
      setMembers([]);
      toast.success("Jëf enregistré avec succès.");
    });
  };

  const handleQuickRegister = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.currentTarget));

    /* Un mot de passe par compte, tiré au sort à l'instant. Il n'est connu que
       de cet écran, et seulement le temps de le dicter au membre. */
    const password = generateProvisionalPassword();

    startTransition(async () => {
      const res = await createUserByAdmin({ ...data, role: "member", password });

      if (res.error) {
        toast.error(res.error);
        return;
      }
      const member = res.data as CollectMember;
      toast.success("Membre inscrit avec succès.");
      setIsAddOpen(false);
      setSelected(member);
      /* Affiché APRÈS création, une seule fois : c'est le seul moment où il
         peut l'être, et le seul où il sert. */
      setIssued({ name: `${member.first_name} ${member.last_name}`, password });
    });
  };

  const copyPassword = async () => {
    if (!issued) return;
    try {
      await navigator.clipboard.writeText(issued.password);
      toast.success("Mot de passe copié.");
    } catch {
      /* Presse-papiers refusé (contexte non sécurisé, permission) : le mot de
         passe reste lisible à l'écran, le collecteur le dicte. */
      toast.error("Copie impossible — notez-le à l'écran.");
    }
  };

  return (
    <>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* ── Étape 1 — identifier le membre ── */}
        <section className="ax-card">
          <CardHeader
            icon={UserSearch}
            tone="c1"
            title="1 · Identifier le membre"
            subtitle="Nom, prénom, e-mail ou téléphone."
          />

          <div className="ax-card__body flex flex-col gap-3">
            <div className="ax-field__control">
              <span className="ax-field__affix ax-field__affix--leading">
                {searching ? (
                  <Loader2 className="animate-spin" aria-hidden="true" />
                ) : (
                  <Search aria-hidden="true" />
                )}
              </span>
              <input
                type="search"
                className="ax-input ax-input--with-leading-icon ax-input--lg"
                placeholder="Rechercher un membre…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                aria-label="Rechercher un membre"
              />
            </div>

            {members.length > 0 && (
              <ul className="ax-list ax-list--selectable">
                {members.map((m) => (
                  <li key={m.id}>
                    <button
                      type="button"
                      className={`ax-list__row w-full text-start ${
                        selected?.id === m.id ? "is-active" : ""
                      }`}
                      aria-pressed={selected?.id === m.id}
                      onClick={() => setSelected(m)}
                    >
                      <Avatar
                        className="ax-list__leading"
                        src={m.avatar || m.avatar_url}
                        name={fullName(m)}
                        size="sm"
                      />
                      <span className="ax-list__content">
                        <span className="ax-list__title">{fullName(m)}</span>
                        <span className="ax-list__meta">
                          {m.email || m.phone || "—"}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {/*
              Aucun résultat n'est une IMPASSE pour un collecteur en pleine
              collecte : la porte de sortie — inscrire la personne sur place —
              doit être offerte ici, pas cherchée dans un autre écran.
            */}
            {members.length === 0 && !searching && query.trim().length >= 2 && (
              <div className="ax-alert ax-alert--info">
                <UserPlus className="ax-alert__icon" aria-hidden="true" />
                <div className="ax-alert__content">
                  <p className="ax-alert__title">Aucun membre trouvé</p>
                  <p className="ax-alert__message">
                    Inscrivez la personne maintenant pour enregistrer son
                    versement sans attendre.
                  </p>
                  <div className="ax-alert__actions">
                    <button
                      type="button"
                      className="ax-btn ax-btn--soft-info ax-btn--sm"
                      onClick={() => setIsAddOpen(true)}
                    >
                      <UserPlus className="ax-btn__icon" size={14} aria-hidden="true" />
                      <span className="ax-btn__label">Inscrire ce membre</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ── Étape 2 — enregistrer le versement ── */}
        <section className={`ax-card ${selected ? "ax-card--selected" : ""}`}>
          <CardHeader
            icon={Banknote}
            tone="c2"
            title="2 · Enregistrer le versement"
            subtitle={
              selected ? `Pour ${fullName(selected)}` : "En attente de l'étape 1."
            }
          />

          <div className="ax-card__body">
            {!selected ? (
              <div className="ax-center flex flex-col items-center gap-3 py-10 text-center">
                <span className="ax-avatar ax-avatar--xl" aria-hidden="true">
                  <UserSearch className="ax-avatar__icon" />
                </span>
                <p className="ax-text-muted text-sm">
                  Identifiez d&apos;abord le membre qui effectue le versement.
                </p>
              </div>
            ) : (
              <form action={handleCollect} className="flex flex-col gap-4">
                <input type="hidden" name="beneficiaryId" value="" />
                <input type="hidden" name="donorId" value={selected.id} />

                <div className="ax-list__row px-0">
                  <Avatar
                    className="ax-list__leading"
                    src={selected.avatar || selected.avatar_url}
                    name={fullName(selected)}
                    size="md"
                  />
                  <span className="ax-list__content">
                    <span className="ax-list__title">{fullName(selected)}</span>
                    <span className="ax-list__meta">
                      {roleLabelLong(selected.role ?? "")}
                    </span>
                  </span>
                  <button
                    type="button"
                    className="ax-btn ax-btn--ghost ax-btn--sm ax-list__trailing"
                    onClick={() => setSelected(null)}
                  >
                    <span className="ax-btn__label">Changer</span>
                  </button>
                </div>

                <div className="ax-field">
                  <label className="ax-field__label" htmlFor="paymentMethod">
                    Méthode de versement
                    <span className="ax-field__required" aria-hidden="true">
                      {" "}*
                    </span>
                  </label>
                  <select
                    id="paymentMethod"
                    name="paymentMethod"
                    className="ax-select"
                    required
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  >
                    <option value="manual">Conserver en espèces</option>
                    <option value="wave">Dépôt Wave</option>
                    <option value="orange_money">Dépôt Orange Money</option>
                    <option value="visa">Dépôt carte bancaire</option>
                    <option value="virement">Virement bancaire</option>
                  </select>
                  <p className="ax-field__hint">
                    Comment les espèces collectées rejoignent le compte Yessal.
                  </p>
                </div>

                {paymentMethod === "virement" && (
                  <div className="ax-field">
                    <label className="ax-field__label" htmlFor="wireReference">
                      Référence du virement
                      <span className="ax-field__required" aria-hidden="true">
                        {" "}*
                      </span>
                    </label>
                    <input
                      id="wireReference"
                      name="wireReference"
                      className="ax-input font-mono"
                      placeholder="VIR-12345"
                      required
                    />
                    <p className="ax-field__hint">
                      Effectuez le virement, puis saisissez sa référence ici.
                    </p>
                  </div>
                )}

                <div className="ax-field">
                  <label className="ax-field__label" htmlFor="campaignId">
                    Attribuer au Ndiguel
                    <span className="ax-field__required" aria-hidden="true">
                      {" "}*
                    </span>
                  </label>
                  <select
                    id="campaignId"
                    name="campaignId"
                    className="ax-select"
                    required
                    defaultValue=""
                  >
                    <option value="" disabled>
                      Choisir un Ndiguel en cours…
                    </option>
                    {activeCampaigns.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  {activeCampaigns.length === 0 && (
                    <p className="ax-field__message ax-field__message--error">
                      Aucun Ndiguel en cours : la collecte ne peut être
                      rattachée.
                    </p>
                  )}
                </div>

                <div className="ax-field">
                  <label className="ax-field__label" htmlFor="amount">
                    Somme récoltée
                    <span className="ax-field__required" aria-hidden="true">
                      {" "}*
                    </span>
                  </label>
                  <div className="ax-field__control">
                    <span className="ax-field__affix ax-field__affix--leading">
                      <Banknote aria-hidden="true" />
                    </span>
                    <input
                      id="amount"
                      name="amount"
                      type="number"
                      min="1000"
                      step="500"
                      inputMode="numeric"
                      className="ax-input ax-input--with-leading-icon ax-input--lg font-mono tabular"
                      placeholder="0"
                      required
                    />
                    <span className="ax-field__affix ax-field__affix--trailing">
                      FCFA
                    </span>
                  </div>
                  <p className="ax-field__hint">Minimum 1 000 FCFA.</p>
                </div>

                {errorMsg && <ErrorAlert message={errorMsg} />}

                <button
                  type="submit"
                  className="ax-btn ax-btn--primary ax-btn--lg ax-btn--block"
                  disabled={isPending || activeCampaigns.length === 0}
                >
                  {isPending ? (
                    <Loader2 className="ax-btn__icon animate-spin" size={18} aria-hidden="true" />
                  ) : (
                    <CheckCircle2 className="ax-btn__icon" size={18} aria-hidden="true" />
                  )}
                  <span className="ax-btn__label">
                    {isPending ? "Validation…" : "Enregistrer le Jëf"}
                  </span>
                </button>
              </form>
            )}
          </div>
        </section>
      </div>

      {/* ── Inscription express, depuis l'impasse « aucun résultat » ── */}
      <Modal
        open={isAddOpen}
        onOpenChange={setIsAddOpen}
        title="Inscription rapide"
        description="Créez le compte du membre pour enregistrer sa collecte immédiatement."
        size="sm"
      >
        <form
          id="quick-register"
          onSubmit={handleQuickRegister}
          className="flex flex-col gap-4"
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="ax-field">
              <label className="ax-field__label" htmlFor="qr-first">
                Prénom
              </label>
              <input
                id="qr-first"
                name="first_name"
                className="ax-input"
                placeholder="Amadou"
                required
              />
            </div>
            <div className="ax-field">
              <label className="ax-field__label" htmlFor="qr-last">
                Nom
              </label>
              <input
                id="qr-last"
                name="last_name"
                className="ax-input"
                placeholder="Ndiaye"
                required
              />
            </div>
          </div>

          <div className="ax-field">
            <label className="ax-field__label" htmlFor="qr-email">
              E-mail
            </label>
            <input
              id="qr-email"
              name="email"
              type="email"
              className="ax-input"
              placeholder="email@exemple.com"
            />
            <p className="ax-field__hint">Facultatif.</p>
          </div>

          <div className="ax-field">
            <PhoneNumberValidation name="phone" required />
          </div>

          <p className="ax-note">
            Un mot de passe provisoire sera généré à la validation. Il
            s&apos;affichera une seule fois, à vous de le transmettre au membre.
          </p>

          <button
            type="submit"
            className="ax-btn ax-btn--primary ax-btn--block"
            disabled={isPending}
          >
            <span className="ax-btn__label">
              {isPending ? "Inscription…" : "Valider l'inscription"}
            </span>
          </button>
        </form>
      </Modal>

      {/*
        Le mot de passe, une fois et une seule. Il n'est stocké nulle part côté
        navigateur : fermer cette fenêtre l'efface pour de bon, et il faudra
        passer par une réinitialisation. C'est dit explicitement, parce que le
        collecteur est debout, dehors, et n'a pas le loisir de revenir dessus.
      */}
      <Modal
        open={issued !== null}
        onOpenChange={(open) => !open && setIssued(null)}
        title="Mot de passe provisoire"
        description={
          issued
            ? `Transmettez-le à ${issued.name}. Il ne sera plus affiché.`
            : undefined
        }
        status="success"
        size="sm"
        footer={
          <button
            type="button"
            className="ax-btn ax-btn--primary"
            onClick={() => setIssued(null)}
          >
            <span className="ax-btn__label">J&apos;ai transmis le mot de passe</span>
          </button>
        }
      >
        <div className="flex flex-col gap-4">
          <div className="ax-field__control">
            <span className="ax-field__affix ax-field__affix--leading">
              <KeyRound aria-hidden="true" />
            </span>
            <input
              readOnly
              value={issued?.password ?? ""}
              aria-label="Mot de passe provisoire"
              className="ax-input ax-input--lg ax-input--with-leading-icon ax-input--with-trailing font-mono tracking-wider"
              onFocus={(e) => e.currentTarget.select()}
            />
            <button
              type="button"
              className="ax-field__affix ax-field__affix--trailing ax-field__affix--button"
              aria-label="Copier le mot de passe"
              onClick={copyPassword}
            >
              <Copy aria-hidden="true" />
            </button>
          </div>

          <p className="ax-text-muted text-sm leading-relaxed">
            Le membre pourra le changer à sa première connexion.
          </p>
        </div>
      </Modal>
    </>
  );
}
