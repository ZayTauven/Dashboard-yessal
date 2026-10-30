"use client";

/*
 * La répartition des Jëfs : par LDD, par Daara, par titre, par pays. Un
 * onglet = un classement, le plus grand d'abord. Les Daaras mènent à leur
 * fiche, jusqu'au montant de chaque Talubé.
 */
import { useState, useTransition } from "react";
import Link from "next/link";
import { getRepartition } from "@/app/actions/suivi";
import { Amount } from "@/components/vireo/Amount";
import type { Periode, RepartitionPar, SuiviRepartition } from "@/types/suivi";

const ONGLETS: { value: RepartitionPar; label: string }[] = [
  { value: "daara", label: "Daara" },
  { value: "ldd", label: "LDD" },
  { value: "titre", label: "Titre" },
  { value: "pays", label: "Pays" },
];

function resume(r: SuiviRepartition): string | null {
  if (r.by === "ldd" && r.without_jef !== null) {
    return `${r.rows.length} LDD ont donné · ${r.without_jef} sans Jëf`;
  }
  if (r.by === "daara" && r.without_jef !== null) {
    return `${r.rows.length} Daaras ont donné · ${r.without_jef.toLocaleString("fr-FR")} sans Jëf`;
  }
  return null;
}

export function RepartitionCard({ periode, initiale }: { periode: Periode; initiale: SuiviRepartition | null }) {
  const [par, setPar] = useState<RepartitionPar>("daara");
  const [donnees, setDonnees] = useState<Partial<Record<RepartitionPar, SuiviRepartition>>>(
    initiale ? { daara: initiale } : {},
  );
  const [erreur, setErreur] = useState<string | null>(null);
  const [chargement, demarrer] = useTransition();

  const choisir = (suivant: RepartitionPar) => {
    setPar(suivant);
    setErreur(null);
    if (donnees[suivant]) return;
    demarrer(async () => {
      const res = await getRepartition(suivant, periode);
      if (res.data) setDonnees((d) => ({ ...d, [suivant]: res.data }));
      else setErreur(res.error ?? "La répartition n'a pas pu être chargée.");
    });
  };

  const r = donnees[par];
  const max = r ? Math.max(...r.rows.map((l) => l.amount), 1) : 1;

  return (
    <section className="ax-card" aria-labelledby="suivi-repartition">
      <div className="ax-card__header flex-wrap gap-3">
        <div className="ax-card__titles">
          <h2 id="suivi-repartition" className="ax-card__title">Répartition des Jëfs</h2>
          {r && resume(r) && <p className="ax-text-subtle text-xs">{resume(r)}</p>}
        </div>
        <div className="ax-tabs ax-tabs--pill">
          <div className="ax-tabs__list" role="tablist" aria-label="Regrouper par">
            {ONGLETS.map((o) => (
              <button
                key={o.value}
                type="button"
                role="tab"
                className="ax-tabs__tab"
                aria-selected={par === o.value}
                aria-controls="suivi-repartition-liste"
                onClick={() => choisir(o.value)}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div id="suivi-repartition-liste" role="tabpanel" className="ax-card__body" aria-busy={chargement}>
        {erreur && <p className="text-sm" role="alert">{erreur}</p>}
        {!r && !erreur && <p className="ax-text-subtle text-sm">Chargement…</p>}
        {r && r.rows.length === 0 && <p className="ax-text-subtle text-sm">Aucun Jëf confirmé sur la période.</p>}
        {r && r.rows.length > 0 && (
          <ol className="flex flex-col">
            {r.rows.slice(0, 12).map((l, i) => {
              const nom =
                r.by === "daara" && typeof l.id === "number" ? (
                  <Link href={`/dashboard/suivi/daara/${l.id}?periode=${periode}`} className="ax-link truncate font-semibold">
                    {l.name}
                  </Link>
                ) : (
                  <span className="truncate font-semibold">{l.name}</span>
                );
              const detail =
                r.by === "titre"
                  ? `${l.members ?? 0} membre${(l.members ?? 0) > 1 ? "s" : ""}${l.count ? ` · ${l.count} Jëf${l.count > 1 ? "s" : ""}` : ""}`
                  : `${l.count} Jëf${l.count > 1 ? "s" : ""} · ${l.pct} %`;
              return (
                <li
                  key={`${l.id ?? "aucun"}-${l.name}`}
                  className="flex flex-col gap-1.5 border-b py-2.5 last:border-b-0"
                  style={{ borderColor: "var(--ax-border)" }}
                >
                  <div className="flex items-baseline gap-3 text-sm">
                    <span className="w-5 shrink-0 text-xs font-extrabold" style={{ color: "var(--ax-accent)" }}>{i + 1}</span>
                    <span className="flex min-w-0 flex-1 items-baseline gap-2">
                      {nom}
                      {l.ldd && <span className="ax-text-subtle hidden truncate text-xs sm:inline">{l.ldd}</span>}
                    </span>
                    <span className="font-bold tabular-nums">{l.amount ? <Amount value={l.amount} /> : "—"}</span>
                  </div>
                  <div className="flex items-center gap-3 pl-8">
                    <div className="ax-progress ax-progress--xs flex-1" aria-hidden="true">
                      <div className="ax-progress__track">
                        <div className="ax-progress__fill" style={{ width: `${Math.max(1, Math.round((l.amount / max) * 100))}%` }} />
                      </div>
                    </div>
                    <span className="ax-text-subtle min-w-28 text-right text-xs">{detail}</span>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
        {r && r.rows.length > 12 && (
          <p className="ax-text-subtle pt-2 text-xs">… et {r.rows.length - 12} autres.</p>
        )}
      </div>
    </section>
  );
}
