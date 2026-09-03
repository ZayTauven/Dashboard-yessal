import Link from "next/link";
import { Briefcase, CheckCircle2, Presentation, TrendingUp } from "lucide-react";
import { getCampaignMetrics } from "@/app/actions/analytics";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorAlert } from "@/components/ui/error-alert";
import { formatFCFA } from "@/lib/format";
import { roleLabel } from "@/lib/roles";
import { PageHead } from "@/components/vireo/PageHead";
import { StatCard } from "@/components/vireo/StatCard";
import { StatusBadge } from "@/components/vireo/StatusBadge";

/*
 * ═══════════════════════════════════════════════════════════════════════════
 * Performance des Ndiguels
 * ═══════════════════════════════════════════════════════════════════════════
 * Rapport de lecture pure : aucun filtre, aucune saisie, un nombre de lignes
 * borné par le nombre de Ndiguels confiés. Il reste donc composant serveur, et
 * le tableau utilise directement le contrat `.ax-table` — pas <DataTable>, qui
 * est client et n'apporterait ici qu'un tri sur une poignée de lignes.
 *
 * Corrections au passage :
 *
 *   · `parseInt(m.collected_amount)` TRONQUAIT les montants décimaux : DRF
 *     sérialise les `DecimalField` en chaîne, donc « 12500.75 » devenait
 *     12 500. Remplacé par `Number()`.
 *
 *   · Le statut s'affichait en anglais brut (« active », « completed ») dans
 *     une pastille peinte en `bg-green-100`, invisible en thème sombre.
 *
 *   · Les trois tuiles de KPI avaient chacune sa couleur écrite en dur
 *     (`bg-blue-50`, `bg-emerald-50`, `bg-purple-50`). Elles passent sur
 *     <StatCard>, dont les tuiles c1..c4 suivent l'accent.
 *
 *   · Le total récolté était affiché dans un encadré isolé à droite du titre.
 *     Il rejoint la rangée de KPI, où on le compare aux autres chiffres.
 */

type CampaignMetric = {
  id: number;
  campaign_name: string;
  objective?: string;
  status: string;
  goal_amount: string | number;
  collected_amount: string | number;
  organizer_name: string;
  organizer_role: string;
  tasks_total: number;
  tasks_completed: number;
  days_active: number;
  days_total: number;
  days_remaining: number;
  chat_count: number;
};

export default async function CampaignMetricsPage() {
  const { data, error } = await getCampaignMetrics();
  const metrics: CampaignMetric[] = data ?? [];

  if (error) {
    return (
      <div className="flex flex-col gap-6">
        <PageHead role="admin" title="Performance des Ndiguels" />
        <ErrorAlert
          message={`${error} — Impossible de charger les métriques.`}
        />
      </div>
    );
  }

  const totalCollected = metrics.reduce(
    (acc, m) => acc + (Number(m.collected_amount) || 0),
    0,
  );
  const totalTasks = metrics.reduce((acc, m) => acc + m.tasks_total, 0);
  const completedTasks = metrics.reduce((acc, m) => acc + m.tasks_completed, 0);
  const activeCount = metrics.filter((m) => m.status === "active").length;
  const uniqueOrganizers = new Set(
    metrics.map((m) => `${m.organizer_name}-${m.organizer_role}`),
  ).size;
  const totalChats = metrics.reduce((acc, m) => acc + m.chat_count, 0);

  /* Rien ne sert d'afficher une colonne d'avancement si aucun Ndiguel ne porte
     de tâche : chaque ligne dirait « 0 / 0 tâches » avec une barre vide, ce qui
     se lit comme un retard généralisé plutôt que comme une absence de suivi. */
  const hasTasks = totalTasks > 0;

  return (
    <div className="flex flex-col gap-6">
      <PageHead
        role="admin"
        title="Performance des Ndiguels"
        subtitle="Suivi de l'implication des responsables de Ndiguel."
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Total récolté"
          value={totalCollected}
          currency
          icon={TrendingUp}
          tone="montant"
        />
        <StatCard
          label="Ndiguels en cours"
          value={activeCount}
          icon={Presentation}
          tone="accent"
          hint={`sur ${metrics.length} confié${metrics.length > 1 ? "s" : ""}`}
        />
        {/*
          « 0 sur 0 au total » n'est pas une statistique, c'est un aveu. Tant
          qu'aucun Ndiguel ne porte de tâche, la tuile annonce ce qu'il en est
          plutôt qu'une fraction impossible.
        */}
        <StatCard
          label="Tâches accomplies"
          value={hasTasks ? completedTasks : 0}
          icon={CheckCircle2}
          tone="info"
          hint={
            hasTasks
              ? `sur ${totalTasks} au total`
              : "Aucune tâche définie pour l'instant"
          }
        />
        <StatCard
          label="Responsables"
          value={uniqueOrganizers}
          icon={Briefcase}
          tone="or"
          hint={`${totalChats} salon${totalChats > 1 ? "s" : ""} d'organisation`}
        />
      </div>

      <section className="ax-card">
        <div className="ax-card__header">
          <div className="ax-card__titles">
            <h2 className="ax-card__title">Détail par Ndiguel</h2>
          </div>
          <span className="ax-badge ax-badge--neutral ax-badge--sm">
            {metrics.length}
          </span>
        </div>

        {metrics.length === 0 ? (
          <div className="ax-card__body">
            <EmptyState
              icon={Briefcase}
              title="Aucun responsable assigné"
              description="Les statistiques apparaîtront ici dès qu'un Ndiguel sera confié à un membre."
              action={
                <Link
                  href="/dashboard/campaigns"
                  className="ax-btn ax-btn--primary"
                >
                  <span className="ax-btn__label">Voir les Ndiguels</span>
                </Link>
              }
            />
          </div>
        ) : (
          <div className="ax-table-wrap">
            <table className="ax-table ax-table--hover">
              <caption className="ax-visually-hidden">
                Performance des responsables de Ndiguel
              </caption>
              <thead className="ax-table__head">
                <tr>
                  <th scope="col" className="ax-table__th">
                    Responsable
                  </th>
                  <th scope="col" className="ax-table__th">
                    Ndiguel
                  </th>
                  {hasTasks && (
                    <th scope="col" className="ax-table__th hidden md:table-cell">
                      Avancement
                    </th>
                  )}
                  <th scope="col" className="ax-table__th ax-table__th--num">
                    Récolté
                  </th>
                  <th
                    scope="col"
                    className="ax-table__th ax-table__th--num hidden lg:table-cell"
                  >
                    Jours
                  </th>
                  <th scope="col" className="ax-table__th ax-table__th--num">
                    Statut
                  </th>
                </tr>
              </thead>

              <tbody>
                {metrics.map((m) => {
                  const percent =
                    m.tasks_total > 0
                      ? Math.round((m.tasks_completed / m.tasks_total) * 100)
                      : 0;
                  const collected = Number(m.collected_amount) || 0;
                  const goal = Number(m.goal_amount) || 0;

                  return (
                    <tr key={m.id} className="ax-table__row">
                      <td className="ax-table__td">
                        <div className="flex flex-col">
                          <span className="font-medium">{m.organizer_name}</span>
                          <span className="ax-text-subtle text-xs">
                            {roleLabel(m.organizer_role)}
                          </span>
                        </div>
                      </td>

                      <td className="ax-table__td">
                        <Link
                          href={`/dashboard/campaigns/${m.id}`}
                          className="ax-link font-medium"
                        >
                          {m.campaign_name}
                        </Link>
                        {m.objective && (
                          <span
                            className="ax-text-subtle ax-truncate block max-w-56 text-xs"
                            title={m.objective}
                          >
                            {m.objective}
                          </span>
                        )}
                      </td>

                      {hasTasks && (
                      <td className="ax-table__td hidden md:table-cell">
                        <div
                          className="ax-progress ax-progress--xs w-36"
                          role="progressbar"
                          aria-valuenow={percent}
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-label={`Avancement des tâches de ${m.campaign_name}`}
                        >
                          <div className="ax-progress__track">
                            <div
                              className="ax-progress__fill"
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                          <span className="ax-progress__value">{percent} %</span>
                        </div>
                        <span className="ax-text-subtle mt-1 block text-xs">
                          {m.tasks_completed} / {m.tasks_total} tâches
                        </span>
                      </td>
                      )}

                      <td className="ax-table__td ax-table__td--num">
                        <span className="text-montant font-semibold">
                          {formatFCFA(collected)}
                        </span>
                        {goal > 0 && (
                          <span className="ax-text-subtle block text-xs">
                            sur {formatFCFA(goal)}
                          </span>
                        )}
                      </td>

                      <td className="ax-table__td ax-table__td--num hidden lg:table-cell">
                        {m.days_active} / {m.days_total}
                        <span className="ax-text-subtle block text-xs">
                          reste {m.days_remaining}
                        </span>
                      </td>

                      <td className="ax-table__td ax-table__td--num">
                        <StatusBadge domain="campaign" value={m.status} size="sm" />
                        <span className="ax-text-subtle mt-1 block text-xs">
                          {m.chat_count} salon{m.chat_count > 1 ? "s" : ""}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>

              <tfoot className="ax-table__foot">
                <tr>
                  <td colSpan={3}>Total</td>
                  <td className="ax-table__td--num text-montant">
                    {formatFCFA(totalCollected)}
                  </td>
                  <td colSpan={2} />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
