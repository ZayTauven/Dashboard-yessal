import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Percent, Target, TrendingUp, Users } from "lucide-react";
import { getCampaignById, getCampaignEtat } from "@/app/actions/campaigns";
import { formatFCFA } from "@/lib/format";
import { Avatar } from "@/components/vireo/Avatar";
import { PageHead } from "@/components/vireo/PageHead";
import { PaymentMethodBadge } from "@/components/vireo/StatusBadge";
import { StatCard } from "@/components/vireo/StatCard";

/*
 * ═══════════════════════════════════════════════════════════════════════════
 * État d'un Ndiguel
 * ═══════════════════════════════════════════════════════════════════════════
 * Page de lecture pure : aucun filtre, aucune saisie. Elle reste donc un
 * composant serveur — pas une ligne de JavaScript n'est envoyée au navigateur
 * pour l'afficher — et le tableau utilise directement le contrat `.ax-table`
 * plutôt que <DataTable>, qui est client par nature.
 *
 * Les quatre tuiles de tête passent sur <StatCard>, donc sur le même contrat
 * `.ax-kpi` que les tableaux de bord de rôle : c'était le dernier endroit où
 * un KPI Yessal se dessinait autrement qu'ailleurs.
 *
 * Les couleurs de méthode de paiement codées en dur (`bg-orange-100
 * text-orange-700`, invisibles en thème sombre) laissent place à
 * <PaymentMethodBadge>.
 */

type Contribution = {
  member_name: string;
  member_id: number;
  daara_name: string | null;
  amount: number | string;
  date: string;
  payment_method: string;
  is_anonymous: boolean;
};

const dateFmt = new Intl.DateTimeFormat("fr-SN", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

function formatDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : dateFmt.format(d);
}

/** Un don anonyme ne porte ni nom ni initiales — pas même celles du donateur. */
const displayName = (c: Contribution) =>
  c.is_anonymous ? "Contributeur anonyme" : c.member_name || "—";

export default async function CampaignEtatPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const campaignId = Number(id);

  const [{ data: campaign }, { data: etat, error, status }] = await Promise.all([
    getCampaignById(campaignId),
    getCampaignEtat(campaignId),
  ]);

  /*
   * `notFound()` est réservé au vrai 404. Une session expirée (401), un droit
   * manquant (403) ou un backend à terre (500 / 0) ne sont pas des absences :
   * les confondre affichait « cette page n'existe pas » sur des écrans
   * parfaitement existants. On relaie donc l'incident à la frontière
   * d'erreur du segment, qui propose de réessayer.
   */
  if (status === 404) notFound();
  if (error || !etat) throw new Error(error ?? "État du Ndiguel indisponible.");

  const contributions: Contribution[] = etat.contributions || [];
  const collectedAmount = Number(etat.collected_amount || 0);
  const goalAmount = Number(etat.goal_amount || 0);
  const progressPct =
    etat.progress_pct ??
    (goalAmount > 0 ? Math.round((collectedAmount / goalAmount) * 100) : 0);
  const donationCount = etat.donation_count ?? contributions.length;
  const campaignName =
    campaign?.name || etat.ndiguel_name || `Ndiguel #${campaignId}`;

  /*
   * ── Le classement des contributeurs ──
   *
   * On cumule PAR PERSONNE. La version précédente triait les contributions
   * individuelles : quelqu'un qui avait versé trois fois occupait les trois
   * places du podium, et un contributeur régulier de 3 × 40 000 FCFA passait
   * derrière un versement unique de 50 000. Ce n'est pas un classement des
   * dons, c'est un classement des donateurs.
   *
   * Les dons anonymes restent groupés séparément, un par un : les cumuler
   * reviendrait à dire combien une même personne anonyme a donné, ce que
   * l'anonymat interdit précisément de laisser deviner.
   */
  const byDonor = new Map<
    string,
    { key: string; name: string; amount: number; count: number; anonymous: boolean }
  >();

  contributions.forEach((c, i) => {
    const anonymous = Boolean(c.is_anonymous);
    const key = anonymous ? `anon-${i}` : `member-${c.member_id ?? c.member_name}`;
    const entry = byDonor.get(key);

    if (entry) {
      entry.amount += Number(c.amount) || 0;
      entry.count += 1;
    } else {
      byDonor.set(key, {
        key,
        name: displayName(c),
        amount: Number(c.amount) || 0,
        count: 1,
        anonymous,
      });
    }
  });

  const topDonors = [...byDonor.values()]
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  /* Barre relative au PREMIER, pas à l'objectif : sur un Ndiguel à 17 % de sa
     cible, toutes les barres seraient écrасées et le classement illisible. */
  const topAmount = topDonors[0]?.amount ?? 0;

  return (
    <div className="flex flex-col gap-6">
      <PageHead
        title="État du Ndiguel"
        subtitle={campaignName}
        crumbs={[
          { label: "Gestion" },
          { label: "Les Ndiguels", href: "/dashboard/campaigns" },
        ]}
        actions={
          <Link href="/dashboard/campaigns" className="ax-btn ax-btn--ghost">
            <ArrowLeft className="ax-btn__icon" size={16} aria-hidden="true" />
            <span className="ax-btn__label">Retour aux Ndiguels</span>
          </Link>
        }
      />

      {/*
        PAS de `ax-dash-grid` ici. Cette classe Vireo (utilities.css, hors
        layer) impose `grid-template-columns: repeat(12, 1fr)` et l'emporte donc
        sur `grid-cols-4` de Tailwind, qui vit dans @layer utilities. Chaque
        tuile se retrouvait sur UNE colonne sur douze — 90 px de large — et son
        libellé comme sa valeur débordaient hors du cadre : les quatre cartes
        n'affichaient plus que leur icône.
        Vireo prévoit `ax-dash-grid` avec ses propres classes de span, pas avec
        celles de Tailwind. Le reste de l'application utilise Tailwind : on s'y
        tient.
      */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Collecté"
          value={collectedAmount}
          currency
          icon={TrendingUp}
          tone="montant"
        />
        <StatCard
          label="Objectif"
          value={goalAmount}
          currency={goalAmount > 0}
          icon={Target}
          tone="accent"
          hint={goalAmount > 0 ? undefined : "Ndiguel sans objectif chiffré"}
        />
        <StatCard
          label="Donateurs"
          value={donationCount}
          icon={Users}
          tone="info"
        />
        <StatCard
          label="Progression"
          value={progressPct}
          suffix="%"
          icon={Percent}
          tone="or"
          hint={progressPct >= 100 ? "Objectif atteint" : undefined}
        />
      </div>

      {goalAmount > 0 && (
        <section className="ax-card">
          <div className="ax-card__body flex flex-col gap-3">
            <div
              className="ax-progress ax-progress--lg"
              role="progressbar"
              aria-valuenow={progressPct}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Progression vers l'objectif"
            >
              <div className="ax-progress__track">
                <div
                  className="ax-progress__fill"
                  style={{ width: `${Math.min(progressPct, 100)}%` }}
                />
              </div>
              <span className="ax-progress__value">{progressPct} %</span>
            </div>
            <p className="ax-text-muted text-xs">
              <span className="text-montant font-mono tabular">
                {formatFCFA(collectedAmount)}
              </span>{" "}
              collectés sur{" "}
              <span className="font-mono tabular">{formatFCFA(goalAmount)}</span>
            </p>
          </div>
        </section>
      )}

      {topDonors.length > 0 && (
        <section className="ax-card">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <h2 className="ax-card__title">Top contributeurs</h2>
            </div>
          </div>
          <div className="ax-card__body">
            {/*
              Une rangée de cartes côte à côte ne dit pas qui est premier : rien
              ne distinguait 100 000 FCFA de 15 000 sinon le chiffre lui-même,
              qu'il fallait lire et comparer. Un classement se lit d'un coup
              d'œil — d'où le rang, la barre proportionnelle au premier, et la
              part du total collecté.
            */}
            <ol className="flex flex-col gap-3">
              {topDonors.map((d, i) => {
                const share =
                  collectedAmount > 0
                    ? Math.round((d.amount / collectedAmount) * 100)
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
              Aucune contribution confirmée pour ce Ndiguel.
            </p>
          </div>
        ) : (
          <div className="ax-table-wrap">
            <table className="ax-table ax-table--hover">
              <caption className="ax-visually-hidden">
                Contributions confirmées pour {campaignName}
              </caption>
              <thead className="ax-table__head">
                <tr>
                  <th scope="col" className="ax-table__th">
                    Contributeur
                  </th>
                  <th scope="col" className="ax-table__th hidden md:table-cell">
                    Daara
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
                        <span className="font-medium">{displayName(row)}</span>
                      </div>
                    </td>
                    <td className="ax-table__td ax-text-muted hidden md:table-cell">
                      {row.daara_name || "—"}
                    </td>
                    <td className="ax-table__td hidden sm:table-cell">
                      <PaymentMethodBadge value={row.payment_method} />
                    </td>
                    <td className="ax-table__td ax-table__td--num text-montant font-semibold">
                      {formatFCFA(Number(row.amount))}
                    </td>
                    <td className="ax-table__td ax-table__td--num ax-text-muted text-xs">
                      {formatDate(row.date)}
                    </td>
                  </tr>
                ))}
              </tbody>

              {/*
                Un total en pied : la page annonçait le montant collecté en
                tête, mais la colonne ne le récapitulait jamais — il fallait
                croire la tuile sur parole.
              */}
              <tfoot className="ax-table__foot">
                <tr>
                  <td colSpan={3}>Total des contributions listées</td>
                  <td className="ax-table__td--num text-montant">
                    {formatFCFA(
                      contributions.reduce((s, r) => s + Number(r.amount || 0), 0),
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
