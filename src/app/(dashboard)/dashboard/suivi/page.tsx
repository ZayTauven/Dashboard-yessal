import Link from "next/link";
import { cookies } from "next/headers";
import { jwtDecode } from "jwt-decode";
import { CalendarClock, Globe2, HandCoins, Users } from "lucide-react";
import { getGuideChannel, getRepartition, getSuivi } from "@/app/actions/suivi";
import { ErrorAlert } from "@/components/ui/error-alert";
import { Amount } from "@/components/vireo/Amount";
import { Avatar } from "@/components/vireo/Avatar";
import { PageHead } from "@/components/vireo/PageHead";
import { StatCard } from "@/components/vireo/StatCard";
import { TitleBadge } from "@/components/vireo/TitleBadge";
import type { Role } from "@/lib/nav";
import { lirePeriode, PERIODES, type Periode, type SuiviNdiguel } from "@/types/suivi";
import { AnnonceCard } from "./AnnonceCard";
import { RepartitionCard } from "./RepartitionCard";

/*
 * ═══════════════════════════════════════════════════════════════════════════
 * Suivi du Kourel — la fenêtre de Sangue Bi
 * ═══════════════════════════════════════════════════════════════════════════
 * Toute la plateforme d'un coup d'œil, pour la guide du Kourel (maquette
 * validée le 2026-10-30) : Jëfs, Talubés, Ndiguels, coordinateurs, et la
 * répartition par LDD, Daara, titre et pays — jusqu'au montant de chaque Jëf.
 * Elle voit et annonce ; elle ne modifie rien.
 *
 * La période passe par l'URL (`?periode=`) : un lien partagé montre ce qu'on
 * a vu, et le rendu reste serveur. Seuls les onglets de répartition et la
 * saisie d'une annonce sont des composants clients.
 */

export const metadata = { title: "Suivi du Kourel" };

const MOIS = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];

function dateCourte(iso: string) {
  const d = new Date(`${iso.slice(0, 10)}T12:00:00`);
  return `${d.getDate()} ${MOIS[d.getMonth()]}`;
}

function compact(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} M`;
  if (n >= 1_000) return `${Math.round(n / 1_000)} k`;
  return String(n);
}

function NdiguelLigne({ n }: { n: SuiviNdiguel }) {
  const pct = n.pct ?? 0;
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline gap-2 text-sm">
        <span className="min-w-0 flex-1 truncate font-semibold">{n.name}</span>
        <span className="font-bold tabular-nums" style={{ color: "var(--ax-accent)" }}>
          {n.status === "pending" ? "À venir" : n.pct === null ? <Amount value={n.collected} /> : `${pct} %`}
        </span>
      </div>
      {n.pct !== null && (
        <div
          className="ax-progress ax-progress--xs"
          role="progressbar"
          aria-valuenow={Math.min(pct, 100)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Avancement de ${n.name}`}
        >
          <div className="ax-progress__track">
            <div className="ax-progress__fill" style={{ width: `${Math.min(pct, 100)}%` }} />
          </div>
        </div>
      )}
      <span className="ax-text-subtle text-xs">
        {n.goal_amount ? (
          <>
            <Amount value={n.collected} exact /> sur <Amount value={n.goal_amount} exact />
          </>
        ) : (
          "Sans objectif chiffré"
        )}
        {" · "}
        {n.status === "pending" && n.opens_on ? `ouvre le ${dateCourte(n.opens_on)}` : `jusqu'au ${dateCourte(n.deadline)}`}
        {n.recurrent && " · récurrent"}
      </span>
    </div>
  );
}

export default async function SuiviPage({
  searchParams,
}: {
  searchParams: Promise<{ periode?: string }>;
}) {
  const periode: Periode = lirePeriode((await searchParams).periode);

  const token = (await cookies()).get("session-yessal")?.value;
  let role: Role = "guide";
  let prenom = "";
  if (token) {
    try {
      const claims = jwtDecode<{ role?: Role; first_name?: string }>(token);
      role = claims.role ?? role;
      prenom = claims.first_name ?? "";
    } catch {
      /* Jeton illisible : le backend tranchera. */
    }
  }

  const [suivi, repartition, canal] = await Promise.all([
    getSuivi(periode),
    getRepartition("daara", periode),
    getGuideChannel(),
  ]);

  if (suivi.error || !suivi.data) {
    return (
      <div className="flex flex-col gap-6">
        <PageHead role={role} title="Suivi du Kourel" />
        <ErrorAlert message={suivi.error ?? "Le suivi n'a pas pu être chargé."} />
      </div>
    );
  }

  const s = suivi.data;
  const maxMois = Math.max(...s.monthly.map((m) => m.amount), 1);
  const moisFort = s.monthly.reduce((a, b) => (b.amount > a.amount ? b : a), s.monthly[0]);

  return (
    <div className="flex flex-col gap-6">
      <PageHead
        role={role}
        title="Le Kourel aujourd'hui"
        subtitle={role === "guide" ? `Assalamou alaykoum${prenom ? `, ${prenom}` : ""}.` : "La fenêtre de suivi de Sangue Bi."}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <nav className="ax-tabs ax-tabs--pill" aria-label="Période">
              <div className="ax-tabs__list">
                {PERIODES.map((p) => (
                  <Link
                    key={p.value}
                    href={`/dashboard/suivi?periode=${p.value}`}
                    className="ax-tabs__tab"
                    aria-selected={p.value === periode}
                    aria-current={p.value === periode ? "page" : undefined}
                  >
                    {p.label}
                  </Link>
                ))}
              </div>
            </nav>
            {canal?.canPost && (
              <a href="#annonce" className="ax-btn ax-btn--primary">
                <span className="ax-btn__label">Annoncer au Kourel</span>
              </a>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Jëfs confirmés"
          value={s.donations.amount}
          currency
          icon={HandCoins}
          tone="montant"
          hint={`${s.donations.count} Jëf${s.donations.count > 1 ? "s" : ""}`}
        />
        <StatCard
          label="Part de la diaspora"
          value={s.donations.diaspora_pct}
          suffix=" %"
          icon={Globe2}
          tone="info"
          hint="des montants confirmés"
        />
        <StatCard
          label="Talubés"
          value={s.members.total}
          icon={Users}
          tone="accent"
          hint={`${s.members.pending} inscription${s.members.pending > 1 ? "s" : ""} en attente · ${s.members.titled} titré${s.members.titled > 1 ? "s" : ""}`}
        />
        <StatCard
          label="Ndiguels en cours"
          value={s.campaigns.active}
          icon={CalendarClock}
          tone="or"
          hint={s.campaigns.upcoming ? `${s.campaigns.upcoming} à venir` : "aucun à venir"}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <section className="ax-card" aria-labelledby="suivi-mois">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <h2 id="suivi-mois" className="ax-card__title">Jëfs par mois</h2>
            </div>
            <span className="ax-text-subtle text-xs">8 derniers mois · FCFA</span>
          </div>
          <div className="ax-card__body">
            <div className="grid h-44 grid-cols-8 items-end gap-2" role="list">
              {s.monthly.map((m) => {
                const [an, mo] = m.month.split("-").map(Number);
                const fort = m === moisFort && m.amount > 0;
                return (
                  <div
                    key={m.month}
                    role="listitem"
                    className="flex h-full flex-col items-center justify-end gap-1.5"
                    aria-label={`${MOIS[mo - 1]} ${an} : ${m.amount.toLocaleString("fr-FR")} FCFA, ${m.count} Jëf${m.count > 1 ? "s" : ""}`}
                  >
                    <span className={`text-[11px] tabular-nums ${fort ? "font-bold" : "ax-text-subtle"}`}>{compact(m.amount)}</span>
                    <div
                      className="w-full max-w-10 rounded-t-lg rounded-b-sm"
                      style={{
                        height: `${Math.max(3, Math.round((m.amount / maxMois) * 120))}px`,
                        background: fort ? "var(--ax-accent)" : "color-mix(in oklab, var(--ax-accent) 28%, transparent)",
                      }}
                    />
                    <span className="ax-text-subtle text-xs">{MOIS[mo - 1]}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="ax-alert ax-alert--warning flex-col items-start" aria-labelledby="suivi-alertes">
          <h2 id="suivi-alertes" className="ax-alert__title text-xs font-extrabold uppercase tracking-wider">À regarder</h2>
          {s.alerts.length === 0 ? (
            <p className="ax-alert__message">Rien de particulier : tout suit son cours.</p>
          ) : (
            <ul className="ax-alert__message flex flex-col gap-2.5">
              {s.alerts.map((a) => (
                <li key={`${a.kind}-${a.strong}`} className="flex gap-2.5 leading-relaxed">
                  <span aria-hidden="true" className="mt-2 size-1.5 shrink-0 rounded-full bg-current" />
                  <span>
                    <strong>{a.strong}</strong>
                    {a.text}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="ax-card" aria-labelledby="suivi-ndiguels">
        <div className="ax-card__header">
          <div className="ax-card__titles">
            <h2 id="suivi-ndiguels" className="ax-card__title">Ndiguels</h2>
          </div>
          <span className="ax-badge ax-badge--neutral ax-badge--sm">{s.campaigns_list.length}</span>
        </div>
        <div className="ax-card__body">
          {s.campaigns_list.length === 0 ? (
            <p className="ax-text-subtle text-sm">Aucun Ndiguel en cours ni à venir.</p>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
              {s.campaigns_list.map((n) => (
                <NdiguelLigne key={n.id} n={n} />
              ))}
            </div>
          )}
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <RepartitionCard periode={periode} initiale={repartition.data ?? null} />

        <section className="ax-card" aria-labelledby="suivi-coord">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <h2 id="suivi-coord" className="ax-card__title">Coordinateurs</h2>
            </div>
            <span className="ax-text-subtle text-xs">
              {s.coordinators.total} pour {s.coordinators.daaras.toLocaleString("fr-FR")} Daaras
            </span>
          </div>
          <ul className="ax-card__body flex flex-col">
            {s.coordinators_list.length === 0 && <li className="ax-text-subtle text-sm">Aucun coordinateur nommé.</li>}
            {s.coordinators_list.map((c) => (
              <li key={c.id} className="flex items-center gap-3 border-b py-2.5 last:border-b-0" style={{ borderColor: "var(--ax-border)" }}>
                <Avatar src={c.avatar} name={c.name} size="sm" />
                <div className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">{c.name}</span>
                  {c.daara ? (
                    <Link href={`/dashboard/suivi/daara/${c.daara.id}?periode=${periode}`} className="ax-link text-xs">
                      Daara {c.daara.name}
                    </Link>
                  ) : (
                    <span className="ax-text-subtle text-xs">Sans Daara</span>
                  )}
                </div>
                <span className={`text-sm font-bold tabular-nums ${c.amount ? "" : "ax-text-subtle"}`}>
                  {c.amount ? <Amount value={c.amount} /> : "—"}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <section className="ax-card" aria-labelledby="suivi-recents">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <h2 id="suivi-recents" className="ax-card__title">Derniers Jëfs</h2>
            </div>
          </div>
          {s.recent.length === 0 ? (
            <div className="ax-card__body ax-text-subtle text-sm">Aucun Jëf confirmé sur la période.</div>
          ) : (
            <div className="ax-table-wrap">
              <table className="ax-table">
                <caption className="ax-visually-hidden">Les dix derniers Jëfs confirmés</caption>
                <thead className="ax-table__head">
                  <tr>
                    <th scope="col" className="ax-table__th">Talubé</th>
                    <th scope="col" className="ax-table__th hidden md:table-cell">Ndiguel</th>
                    <th scope="col" className="ax-table__th ax-table__th--num">Montant</th>
                    <th scope="col" className="ax-table__th ax-table__th--num">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {s.recent.map((j) => (
                    <tr key={j.id} className="ax-table__row">
                      <td className="ax-table__td">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{j.donor.name}</span>
                          <TitleBadge title={j.donor.title} size="sm" />
                        </div>
                        <span className="ax-text-subtle text-xs">
                          {j.daara ? `Daara ${j.daara} · ` : ""}
                          {j.method}
                        </span>
                      </td>
                      <td className="ax-table__td hidden md:table-cell">{j.campaign.name}</td>
                      <td className="ax-table__td ax-table__td--num font-bold">
                        <Amount value={j.amount} exact />
                      </td>
                      <td className="ax-table__td ax-table__td--num ax-text-subtle">{dateCourte(j.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {canal?.canPost ? (
          <AnnonceCard chatId={canal.id} membres={canal.members} />
        ) : (
          <section className="ax-card" aria-labelledby="suivi-canal">
            <div className="ax-card__header">
              <div className="ax-card__titles">
                <h2 id="suivi-canal" className="ax-card__title">Annonces de Sangue Bi</h2>
              </div>
            </div>
            <div className="ax-card__body flex flex-col gap-3 text-sm">
              <p className="ax-text-subtle">Seule la guide du Kourel, et les auteurs qu&rsquo;un administrateur désigne, publient dans ce canal.</p>
              {canal && (
                <Link href={`/dashboard/chat?chat=${canal.id}`} className="ax-btn ax-btn--secondary self-start">
                  <span className="ax-btn__label">Ouvrir le canal</span>
                </Link>
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
