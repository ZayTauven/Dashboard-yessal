"use client";

/*
 * Le podium des donateurs — le « Top 10 » que Sangue Bi annonce au Kourel.
 * Remplace la carte « Coordinateurs », jugée sans intérêt par le porteur
 * (2026-11-01). Semaine depuis lundi, mois depuis le 1er, année depuis le
 * 1er janvier, à l'heure de Dakar : le serveur fixe les bornes.
 *
 * Un donateur qui a fait un Jëf anonyme dans la période porte l'étiquette
 * « Anonyme » : la guide voit son nom, elle ne doit pas le citer.
 *
 * Les trois premiers reçoivent leur médaille (or, argent, bronze) et une
 * couronne de laurier autour de leur photo.
 */
import { useState, useTransition } from "react";
import Link from "next/link";
import { getPodium } from "@/app/actions/suivi";
import { Amount } from "@/components/vireo/Amount";
import { AnonymeBadge } from "@/components/vireo/AnonymeBadge";
import { Avatar } from "@/components/vireo/Avatar";
import { CouronneLaurier, Medaille, metalDuRang } from "@/components/vireo/Medaille";
import { TitleBadge } from "@/components/vireo/TitleBadge";
import type { PodiumPeriode, SuiviPodium } from "@/types/suivi";

const ONGLETS: { value: PodiumPeriode; label: string }[] = [
  { value: "semaine", label: "Semaine" },
  { value: "mois", label: "Mois" },
  { value: "annee", label: "Année" },
];

/* Un voile du métal derrière la ligne : lisible en clair comme en sombre. */
const FOND_PODIUM = {
  or: "linear-gradient(90deg, rgba(232, 182, 63, 0.16), transparent 70%)",
  argent: "linear-gradient(90deg, rgba(160, 168, 180, 0.16), transparent 70%)",
  bronze: "linear-gradient(90deg, rgba(196, 120, 64, 0.16), transparent 70%)",
} as const;

const VIDE: Record<PodiumPeriode, string> = {
  semaine: "Aucun Jëf confirmé depuis lundi.",
  mois: "Aucun Jëf confirmé ce mois-ci.",
  annee: "Aucun Jëf confirmé cette année.",
};

export function PodiumCard({ initiale }: { initiale: SuiviPodium | null }) {
  const [periode, setPeriode] = useState<PodiumPeriode>("semaine");
  const [donnees, setDonnees] = useState<Partial<Record<PodiumPeriode, SuiviPodium>>>(
    initiale ? { semaine: initiale } : {},
  );
  const [erreur, setErreur] = useState<string | null>(null);
  const [chargement, demarrer] = useTransition();

  const choisir = (suivante: PodiumPeriode) => {
    setPeriode(suivante);
    setErreur(null);
    if (donnees[suivante]) return;
    demarrer(async () => {
      const res = await getPodium(suivante);
      if (res.data) setDonnees((d) => ({ ...d, [suivante]: res.data }));
      else setErreur(res.error ?? "Le podium n'a pas pu être chargé.");
    });
  };

  const p = donnees[periode];

  return (
    <section className="ax-card" aria-labelledby="suivi-podium">
      <div className="ax-card__header flex-wrap gap-3">
        <div className="ax-card__titles">
          <h2 id="suivi-podium" className="ax-card__title">Top 10 des donateurs</h2>
        </div>
        <div className="ax-tabs ax-tabs--pill">
          <div className="ax-tabs__list" role="tablist" aria-label="Période du podium">
            {ONGLETS.map((o) => (
              <button
                key={o.value}
                type="button"
                role="tab"
                className="ax-tabs__tab"
                aria-selected={periode === o.value}
                aria-controls="suivi-podium-liste"
                onClick={() => choisir(o.value)}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div id="suivi-podium-liste" role="tabpanel" className="ax-card__body" aria-busy={chargement}>
        {erreur && <p className="text-sm" role="alert">{erreur}</p>}
        {!erreur && !p && <p className="ax-text-subtle text-sm">Chargement…</p>}
        {p && p.rows.length === 0 && <p className="ax-text-subtle text-sm">{VIDE[periode]}</p>}
        {p && p.rows.length > 0 && (
          <ol className="flex flex-col">
            {p.rows.map((d) => {
              const metal = metalDuRang(d.rank);
              return (
              <li
                key={d.id}
                className={`flex items-center gap-2.5 border-b py-2.5 last:border-b-0 ${metal ? "-mx-2 rounded-xl px-2" : ""}`}
                style={{
                  borderColor: "var(--ax-border)",
                  background: metal ? FOND_PODIUM[metal] : undefined,
                }}
              >
                {metal ? (
                  <Medaille metal={metal} rang={d.rank} />
                ) : (
                  <span className="ax-badge ax-badge--neutral w-[26px] shrink-0 justify-center tabular-nums" aria-label={`Rang ${d.rank}`}>
                    {d.rank}
                  </span>
                )}
                {metal ? (
                  <CouronneLaurier metal={metal} taille={50}>
                    <Avatar src={d.avatar} name={d.name} size="sm" />
                  </CouronneLaurier>
                ) : (
                  <span className="inline-flex w-[50px] shrink-0 justify-center">
                    <Avatar src={d.avatar} name={d.name} size="sm" />
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  {/* Les étiquettes passent à la ligne plutôt que d'écraser le
                      nom : dans la colonne étroite, il tombait à « S… ». */}
                  <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
                    <span className="max-w-full truncate text-sm font-semibold">{d.name}</span>
                    <TitleBadge title={d.title} size="sm" />
                    {d.anonymous && <AnonymeBadge />}
                  </div>
                  <span className="ax-text-subtle text-xs">
                    {d.daara ? (
                      <Link href={`/dashboard/suivi/daara/${d.daara.id}`} className="ax-link">
                        Daara {d.daara.name}
                      </Link>
                    ) : (
                      "Sans Daara"
                    )}
                    {` · ${d.count} Jëf${d.count > 1 ? "s" : ""}`}
                  </span>
                </div>
                <span className="shrink-0 text-sm font-bold tabular-nums">
                  <Amount value={d.amount} />
                </span>
              </li>
              );
            })}
          </ol>
        )}
      </div>
    </section>
  );
}
