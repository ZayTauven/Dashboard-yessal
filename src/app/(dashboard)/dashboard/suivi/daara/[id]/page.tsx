import Link from "next/link";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { jwtDecode } from "jwt-decode";
import { HandCoins, MessageCircle, Phone, Users } from "lucide-react";
import { getSuiviDaara } from "@/app/actions/suivi";
import { ErrorAlert } from "@/components/ui/error-alert";
import { Amount } from "@/components/vireo/Amount";
import { Avatar } from "@/components/vireo/Avatar";
import { PageHead } from "@/components/vireo/PageHead";
import { StatCard } from "@/components/vireo/StatCard";
import { TitleBadge } from "@/components/vireo/TitleBadge";
import type { Role } from "@/lib/nav";
import { roleLabel } from "@/lib/roles";
import { lirePeriode, PERIODES } from "@/types/suivi";

/*
 * Un Daara, jusqu'au membre : son coordinateur, chaque Talubé avec ce qu'il a
 * donné sur la période, et le détail des Jëfs. Lecture seule, comme toute la
 * fenêtre de suivi de Sangue Bi.
 */

export const metadata = { title: "Daara · Suivi du Kourel" };

const MOIS = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];

function dateCourte(iso: string) {
  const d = new Date(iso);
  return `${d.getDate()} ${MOIS[d.getMonth()]} ${d.getFullYear()}`;
}

export default async function SuiviDaaraPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ periode?: string }>;
}) {
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) notFound();
  const periode = lirePeriode((await searchParams).periode);

  let role: Role = "guide";
  const token = (await cookies()).get("session-yessal")?.value;
  if (token) {
    try {
      role = jwtDecode<{ role?: Role }>(token).role ?? role;
    } catch {
      /* Le backend tranchera. */
    }
  }

  const res = await getSuiviDaara(id, periode);
  if (res.error === "Introuvable.") notFound();
  const crumbs = [
    { label: "Suivi du Kourel", href: `/dashboard/suivi?periode=${periode}` },
  ];
  if (res.error || !res.data) {
    return (
      <div className="flex flex-col gap-6">
        <PageHead role={role} title="Daara" crumbs={crumbs} />
        <ErrorAlert message={res.error ?? "Le Daara n'a pas pu être chargé."} />
      </div>
    );
  }

  const d = res.data;
  const libellePeriode = PERIODES.find((p) => p.value === periode)?.label.toLowerCase() ?? "";

  return (
    <div className="flex flex-col gap-6">
      <PageHead
        role={role}
        title={`Daara ${d.name}`}
        subtitle={d.ldd ? `LDD ${d.ldd.name}` : undefined}
        crumbs={crumbs}
        actions={
          <nav className="ax-tabs ax-tabs--pill" aria-label="Période">
            <div className="ax-tabs__list">
              {PERIODES.map((p) => (
                <Link
                  key={p.value}
                  href={`/dashboard/suivi/daara/${d.id}?periode=${p.value}`}
                  className="ax-tabs__tab"
                  aria-selected={p.value === periode}
                  aria-current={p.value === periode ? "page" : undefined}
                >
                  {p.label}
                </Link>
              ))}
            </div>
          </nav>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <StatCard label="Jëfs confirmés" value={d.amount} currency icon={HandCoins} tone="montant" hint={`${d.count} Jëf${d.count > 1 ? "s" : ""} · ${libellePeriode}`} />
        <StatCard label="Talubés" value={d.members_count} icon={Users} tone="accent" hint={`dont ${d.donors_count} donateur${d.donors_count > 1 ? "s" : ""}`} />
        <section className="ax-card col-span-2 lg:col-span-1" aria-label="Coordination">
          <div className="ax-card__body flex items-center gap-3">
            {d.coordinator ? (
              <>
                <Avatar src={d.coordinator.avatar} name={d.coordinator.name} size="md" />
                <div className="min-w-0 flex-1">
                  <span className="block truncate font-semibold">{d.coordinator.name}</span>
                  <span className="ax-text-subtle text-xs">{roleLabel("chef_daara")}</span>
                </div>
                <Link href={`/dashboard/chat?with=${d.coordinator.id}`} className="ax-btn ax-btn--secondary ax-btn--icon" aria-label={`Écrire à ${d.coordinator.name}`}>
                  <MessageCircle size={17} aria-hidden="true" />
                </Link>
                {d.coordinator.phone && (
                  <a href={`tel:${d.coordinator.phone}`} className="ax-btn ax-btn--secondary ax-btn--icon" aria-label={`Appeler ${d.coordinator.name}`}>
                    <Phone size={17} aria-hidden="true" />
                  </a>
                )}
              </>
            ) : (
              <span className="ax-text-subtle text-sm">Aucun coordinateur nommé pour ce Daara.</span>
            )}
          </div>
        </section>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <section className="ax-card" aria-labelledby="daara-talubes">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <h2 id="daara-talubes" className="ax-card__title">Talubés</h2>
            </div>
            <span className="ax-badge ax-badge--neutral ax-badge--sm">{d.members_count}</span>
          </div>
          {d.members.length === 0 ? (
            <div className="ax-card__body ax-text-subtle text-sm">Aucun Talubé rattaché à ce Daara.</div>
          ) : (
            <div className="ax-table-wrap">
              <table className="ax-table">
                <caption className="ax-visually-hidden">Ce que chaque Talubé du Daara a donné</caption>
                <thead className="ax-table__head">
                  <tr>
                    <th scope="col" className="ax-table__th">Talubé</th>
                    <th scope="col" className="ax-table__th ax-table__th--num">Jëfs</th>
                    <th scope="col" className="ax-table__th ax-table__th--num">Montant</th>
                  </tr>
                </thead>
                <tbody>
                  {d.members.map((m) => (
                    <tr key={m.id} className="ax-table__row">
                      <td className="ax-table__td">
                        <div className="flex items-center gap-2.5">
                          <Avatar src={m.avatar} name={m.name} size="sm" />
                          <span className="font-semibold">{m.name}</span>
                          <TitleBadge title={m.title} size="sm" />
                        </div>
                      </td>
                      <td className="ax-table__td ax-table__td--num">{m.count || "—"}</td>
                      <td className={`ax-table__td ax-table__td--num font-bold ${m.amount ? "" : "ax-text-subtle"}`}>
                        {m.amount ? <Amount value={m.amount} exact /> : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="ax-card" aria-labelledby="daara-jefs">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <h2 id="daara-jefs" className="ax-card__title">Jëfs du Daara</h2>
              <p className="ax-text-subtle text-xs">Du plus récent · 50 au plus</p>
            </div>
          </div>
          {d.donations.length === 0 ? (
            <div className="ax-card__body ax-text-subtle text-sm">Aucun Jëf confirmé sur la période.</div>
          ) : (
            <ul className="ax-card__body flex flex-col">
              {d.donations.map((j) => (
                <li key={j.id} className="flex items-center gap-3 border-b py-2.5 last:border-b-0" style={{ borderColor: "var(--ax-border)" }}>
                  <div className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">{j.donor.name}</span>
                    <span className="ax-text-subtle block truncate text-xs">{j.campaign.name} · {j.method}</span>
                  </div>
                  <div className="text-right">
                    <span className="block text-sm font-bold"><Amount value={j.amount} exact /></span>
                    <span className="ax-text-subtle text-xs">{dateCourte(j.created_at)}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
