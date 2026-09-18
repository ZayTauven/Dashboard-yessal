import { donorName, rankDonors } from "@/lib/donor-ranking";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  BookOpen,
  CalendarDays,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";
import { getFeteEtat } from "@/app/actions/events";
import { formatFCFA } from "@/lib/format";
import { Avatar } from "@/components/vireo/Avatar";
import { DateTile } from "@/components/vireo/DateTile";
import { PageHead } from "@/components/vireo/PageHead";
import { StatCard } from "@/components/vireo/StatCard";
import {
  PaymentMethodBadge,
  StatusBadge,
} from "@/components/vireo/StatusBadge";

/*
 * ═══════════════════════════════════════════════════════════════════════════
 * État d'une fête
 * ═══════════════════════════════════════════════════════════════════════════
 * Page de lecture pure, donc composant serveur : les tableaux utilisent
 * directement le contrat `.ax-table` plutôt que <DataTable>, qui est client.
 * Même parti que l'état d'un Ndiguel, avec lequel cet écran doit se lire de la
 * même façon.
 *
 * Ce que la reprise corrige :
 *
 *   · Trois tables de correspondance locales — `METHOD_LABELS`,
 *     `METHOD_COLORS`, `STATUS_CONFIG` — recopiaient un vocabulaire déjà
 *     centralisé, avec des couleurs en dur (`bg-orange-100 text-orange-700`)
 *     invisibles en thème sombre. Elles laissent la place à <StatusBadge> et
 *     <PaymentMethodBadge>.
 *
 *   · Le statut de la fête s'affichait « Active »/« Inactive » en vert/rouge
 *     codés en dur.
 *
 *   · Les quatre tuiles de tête étaient dessinées à la main : elles passent
 *     sur <StatCard>, comme partout ailleurs.
 */

type Contribution = {
  member_name: string;
  member_id: number;
  daara_name: string | null;
  campaign_name: string | null;
  amount: string;
  date: string;
  payment_method: string;
  is_anonymous: boolean;
};

type CampaignRow = {
  id: number;
  name: string;
  goal_amount: string | null;
  collected_amount: string;
  progress_pct: number;
  status: string;
  deadline: string;
  daara_name: string | null;
  organizer_name: string | null;
};

/** `events.Fete.Recurrence` */
const RECURRENCE_LABELS: Record<string, string> = {
  annual: "Annuelle",
  quarterly: "Trimestrielle",
  weekly: "Hebdomadaire",
  none: "Ponctuelle",
};

const longDate = new Intl.DateTimeFormat("fr-SN", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

const shortDate = new Intl.DateTimeFormat("fr-SN", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

function fmt(iso?: string | null, long = false): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return long ? longDate.format(d) : shortDate.format(d);
}


export default async function FeteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const feteId = Number(id);

  const { data: etat, error, status } = await getFeteEtat(feteId);

  /*
   * `notFound()` est réservé au vrai 404. Une session expirée (401), un droit
   * manquant (403) ou un backend à terre (500 / 0) ne sont pas des absences :
   * les confondre affichait « cette page n'existe pas » sur des écrans
   * parfaitement existants. On relaie donc l'incident à la frontière
   * d'erreur du segment, qui propose de réessayer.
   */
  if (status === 404) notFound();
  if (error || !etat) throw new Error(error ?? "Fête indisponible.");

  const contributions: Contribution[] = etat.contributions || [];
  const campaigns: CampaignRow[] = etat.campaigns || [];
  const totalCollected = Number(etat.total_collected || 0);
  /*
   * ── Le classement des contributeurs ──
   *
   * On cumule PAR PERSONNE. La version precedente triait les contributions
   * individuelles et gardait les trois plus grosses : quelqu'un qui avait verse
   * trois fois occupait les trois places du podium, et un contributeur regulier
   * de 3 x 40 000 FCFA passait derriere un versement unique de 50 000. Ce
   * n'etait pas un classement des donateurs, mais un classement des dons.
   *
   * Le meme correctif avait deja ete apporte a la page d'etat d'un Ndiguel ; il
   * n'avait jamais ete reporte ici. Les deux ecrans montrent desormais la meme
   * chose de la meme maniere.
   *
   * Les dons anonymes restent groupes separement, un par un : les cumuler
   * reviendrait a dire combien une meme personne anonyme a donne, ce que
   * l'anonymat interdit precisement de laisser deviner.
   */
  const topDonors = rankDonors(contributions);

  /* Barre relative au PREMIER, pas au total : sinon, des qu'un contributeur
     domine, toutes les autres barres sont ecrasees et le classement illisible. */
  const topAmount = topDonors[0]?.amount ?? 0;

  return (
    <div className="flex flex-col gap-6">
      <PageHead
        title={etat.name}
        subtitle={etat.description || undefined}
        crumbs={[
          { label: "Gestion" },
          { label: "Les Fêtes", href: "/dashboard/events" },
        ]}
        actions={
          <Link href="/dashboard/events" className="ax-btn ax-btn--ghost">
            <ArrowLeft className="ax-btn__icon" size={16} aria-hidden="true" />
            <span className="ax-btn__label">Retour aux fêtes</span>
          </Link>
        }
      >
        <div className="ax-cluster ax-text-muted mt-3 flex-wrap gap-4 text-sm">
          <StatusBadge
            domain="user"
            value={etat.is_active === false ? "inactive" : "active"}
            size="sm"
          />
          {etat.date && (
            <span className="ax-cluster gap-1">
              <CalendarDays size={14} aria-hidden="true" />
              {fmt(etat.date, true)}
            </span>
          )}
          <span className="ax-cluster gap-1">
            <BookOpen size={14} aria-hidden="true" />
            {RECURRENCE_LABELS[etat.recurrence] ?? etat.recurrence}
          </span>
        </div>
      </PageHead>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Total collecté"
          value={totalCollected}
          currency
          icon={TrendingUp}
          tone="montant"
        />
        {/* « Donateurs » comptait en realite `donation_count`, c'est-a-dire des
            CONTRIBUTIONS. Verifie sur les donnees : la fete « Kazu Rajab »
            affichait 10 donateurs pour 9 personnes distinctes. Le libelle dit
            desormais ce que le chiffre mesure, dans le vocabulaire du projet. */}
        <StatCard
          label="Jëfs recus"
          value={Number(etat.donation_count ?? 0)}
          icon={Users}
          tone="info"
        />
        <StatCard
          label="Ndiguels rattachés"
          value={Number(etat.campaigns_count ?? 0)}
          icon={Target}
          tone="accent"
        />

        {/* La date mérite sa pastille plutôt qu'un KPI : ce n'est pas une
            quantité, et c'est le repère visuel de tout l'écran des fêtes. */}
        <article className="ax-card ax-card--stat">
          <div className="ax-card__body flex items-center gap-4">
            <DateTile date={etat.date} />
            <div>
              <p className="ax-kpi__label">Date</p>
              <p className="text-sm font-medium">{fmt(etat.date)}</p>
            </div>
          </div>
        </article>
      </div>

      {topDonors.length > 0 && (
        <section className="ax-card">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <h2 className="ax-card__title">Top contributeurs</h2>
            </div>
          </div>
          <div className="ax-card__body">
            {/*
              Une rangee de cartes cote a cote ne dit pas qui est premier : rien
              ne distinguait 100 000 FCFA de 15 000 sinon le chiffre lui-meme,
              qu'il fallait lire et comparer. Un classement se lit d'un coup
              d'oeil — d'ou le rang, la barre proportionnelle au premier, et la
              part du total collecte.
            */}
            <ol className="flex flex-col gap-3">
              {topDonors.map((d, i) => {
                const share =
                  totalCollected > 0
                    ? Math.round((d.amount / totalCollected) * 100)
                    : 0;
                const width = topAmount > 0 ? (d.amount / topAmount) * 100 : 0;

                return (
                  <li key={d.key} className="flex items-center gap-3">
                    <span
                      className={`ax-badge ax-badge--pill shrink-0 font-mono tabular ${
                        i === 0
                          ? "ax-badge--soft ax-badge--accent"
                          : "ax-badge--neutral"
                      }`}
                      aria-label={`Rang ${i + 1}`}
                    >
                      {i + 1}
                    </span>

                    <Avatar
                      name={d.anonymous ? undefined : d.name}
                      size="sm"
                      className="shrink-0"
                    />

                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                      <div className="flex items-baseline justify-between gap-3">
                        <span className="ax-truncate text-sm font-medium">
                          {d.name}
                          {/* Le Daara n'apparait que si un homonyme figure au
                              classement — voir `rankDonors`. */}
                          {d.hint && (
                            <span className="ax-text-subtle font-normal">
                              {" "}
                              · {d.hint}
                            </span>
                          )}
                        </span>
                        <span className="text-montant shrink-0 font-mono tabular text-sm font-semibold">
                          {formatFCFA(d.amount)}
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="ax-progress ax-progress--xs flex-1">
                          <div className="ax-progress__track">
                            <div
                              className="ax-progress__fill"
                              style={{ width: `${width}%` }}
                            />
                          </div>
                        </div>
                        <span className="ax-text-subtle shrink-0 font-mono tabular text-xs">
                          {share} % · {d.count} Jëf{d.count > 1 ? "s" : ""}
                        </span>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>
        </section>
      )}

      {campaigns.length > 0 && (
        <section className="ax-card">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <h2 className="ax-card__title">Ndiguels rattachés</h2>
            </div>
            <span className="ax-badge ax-badge--neutral ax-badge--sm">
              {campaigns.length}
            </span>
          </div>

          <ul className="ax-list ax-list--comfortable">
            {campaigns.map((c) => {
              const goal = Number(c.goal_amount || 0);
              const collected = Number(c.collected_amount || 0);

              return (
                <li key={c.id} className="ax-list__row items-start">
                  <span className="ax-list__content gap-2">
                    <span className="ax-cluster gap-2">
                      <Link
                        href={`/dashboard/campaigns/${c.id}/etat`}
                        className="ax-link font-medium"
                      >
                        {c.name}
                      </Link>
                      <StatusBadge domain="campaign" value={c.status} size="sm" />
                    </span>

                    <span className="ax-list__meta ax-cluster flex-wrap gap-3 text-xs">
                      {c.daara_name && <span>{c.daara_name}</span>}
                      {c.organizer_name && (
                        <span>Responsable : {c.organizer_name}</span>
                      )}
                      <span>Échéance : {fmt(c.deadline)}</span>
                    </span>

                    {goal > 0 && (
                      <span
                        className="ax-progress ax-progress--xs mt-1"
                        role="progressbar"
                        aria-valuenow={Math.round(c.progress_pct)}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label={`Progression de ${c.name}`}
                      >
                        <span className="ax-progress__track">
                          <span
                            className="ax-progress__fill block"
                            style={{ width: `${Math.min(c.progress_pct, 100)}%` }}
                          />
                        </span>
                        <span className="ax-progress__value">
                          {c.progress_pct} %
                        </span>
                      </span>
                    )}
                  </span>

                  <span className="ax-list__trailing flex-col items-end">
                    <span className="text-montant font-mono tabular text-sm font-semibold">
                      {formatFCFA(collected)}
                    </span>
                    {goal > 0 && (
                      <span className="ax-text-subtle font-mono tabular text-xs">
                        sur {formatFCFA(goal)}
                      </span>
                    )}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <section className="ax-card">
        <div className="ax-card__header">
          <div className="ax-card__titles">
            <h2 className="ax-card__title">Liste des contributeurs</h2>
          </div>
          <span className="ax-badge ax-badge--neutral ax-badge--sm">
            {contributions.length} Jëf{contributions.length > 1 ? "s" : ""}
          </span>
        </div>

        {contributions.length === 0 ? (
          <div className="ax-card__body">
            <p className="ax-text-subtle text-center text-sm italic">
              Aucune contribution confirmée pour cette fête.
            </p>
          </div>
        ) : (
          <div className="ax-table-wrap">
            <table className="ax-table ax-table--hover">
              <caption className="ax-visually-hidden">
                Contributions confirmées pour {etat.name}
              </caption>
              <thead className="ax-table__head">
                <tr>
                  <th scope="col" className="ax-table__th">
                    Contributeur
                  </th>
                  <th scope="col" className="ax-table__th hidden lg:table-cell">
                    Daara
                  </th>
                  <th scope="col" className="ax-table__th hidden md:table-cell">
                    Ndiguel
                  </th>
                  <th scope="col" className="ax-table__th hidden sm:table-cell">
                    Méthode
                  </th>
                  <th scope="col" className="ax-table__th ax-table__th--num">
                    Montant
                  </th>
                  <th scope="col" className="ax-table__th ax-table__th--num">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody>
                {contributions.map((row, idx) => (
                  <tr key={`${row.member_id}-${idx}`} className="ax-table__row">
                    <td className="ax-table__td">
                      <div className="flex items-center gap-3">
                        <Avatar
                          name={row.is_anonymous ? undefined : row.member_name}
                          size="sm"
                        />
                        <span className="font-medium">{donorName(row)}</span>
                      </div>
                    </td>
                    <td className="ax-table__td ax-text-muted hidden lg:table-cell">
                      {row.daara_name || "—"}
                    </td>
                    <td className="ax-table__td ax-text-muted hidden md:table-cell">
                      {row.campaign_name || "—"}
                    </td>
                    <td className="ax-table__td hidden sm:table-cell">
                      <PaymentMethodBadge value={row.payment_method} />
                    </td>
                    <td className="ax-table__td ax-table__td--num text-montant font-semibold">
                      {formatFCFA(Number(row.amount))}
                    </td>
                    <td className="ax-table__td ax-table__td--num ax-text-muted text-xs">
                      {fmt(row.date)}
                    </td>
                  </tr>
                ))}
              </tbody>

              <tfoot className="ax-table__foot">
                <tr>
                  <td colSpan={4}>Total des contributions listées</td>
                  <td className="ax-table__td--num text-montant">
                    {formatFCFA(
                      contributions.reduce(
                        (s, r) => s + Number(r.amount || 0),
                        0,
                      ),
                    )}
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
