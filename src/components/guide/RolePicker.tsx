"use client";

/*
 * ═══════════════════════════════════════════════════════════════════════════
 * « Je suis… » — le parcours de lecture
 * ═══════════════════════════════════════════════════════════════════════════
 * Treize chapitres, c'est trop pour qui vient avec une question précise. On
 * demande donc son rôle au lecteur, une fois, et on lui rend la liste courte :
 * six chapitres pour un talibé, huit pour un administrateur.
 *
 * Le choix reste dans le navigateur (aucun compte n'est requis pour lire le
 * guide) et se défait d'un clic sur la même carte.
 *
 * Les quatre cartes montrent un picto dessiné, pas une photographie. Poser un
 * visage sous « Collecteur » désignerait quelqu'un — ce que la documentation
 * d'un logiciel n'a pas à faire.
 */

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import {
  ROLE_LABELS,
  ROLE_ORDER,
  chaptersForRole,
  type GuideRole,
} from "@/lib/guide/manifest";
import { GuideIcon } from "./GuideIcon";
import { useGuideRole, useReadChapters } from "./reading-state";

/*
 * Un picto par rôle, choisi pour ce que le rôle FAIT :
 *   · le talibé donne          → la main qui tend un cœur ;
 *   · le chef veille           → les deux mains qui en abritent un ;
 *   · le collecteur encaisse   → la tirelire ;
 *   · l'administration arbitre → le quatre-feuilles, un motif de sceau.
 */
const ROLE_ART: Record<GuideRole, { picto: string; blurb: string }> = {
  talibe: {
    picto: "/guide-assets/pictos/jef.png",
    blurb: "Je fais mes Jëfs, je suis les Ndiguels de la communauté.",
  },
  chef: {
    picto: "/guide-assets/pictos/solidarite.png",
    blurb: "Je veille sur mon Daara, ses membres et ses collecteurs.",
  },
  collecteur: {
    picto: "/guide-assets/pictos/collecte.png",
    blurb: "J’encaisse les versements en personne et je les enregistre.",
  },
  admin: {
    picto: "/guide-assets/pictos/embleme.png",
    blurb: "Je lance les Ndiguels, je valide, je pilote l’ensemble.",
  },
};

export function RolePicker() {
  const { role, setRole } = useGuideRole();
  const { read } = useReadChapters();

  const path = role ? chaptersForRole(role) : [];
  const minutes = path.reduce((sum, c) => sum + c.minutes, 0);

  return (
    <div>
      <div className="yg-roles">
        {ROLE_ORDER.map((r) => {
          const selected = role === r;
          return (
            <button
              key={r}
              type="button"
              className={`yg-role${selected ? " is-selected" : ""}`}
              aria-pressed={selected}
              onClick={() => setRole(selected ? null : r)}
            >
              <span className="yg-role__check" aria-hidden="true">
                <Check size={14} />
              </span>
              <span className="yg-role__art">
                <Image
                  className="yg-picto"
                  src={ROLE_ART[r].picto}
                  alt=""
                  width={220}
                  height={220}
                />
              </span>
              <span className="yg-role__body">
                <span className="yg-role__name">{ROLE_LABELS[r]}</span>
                {ROLE_ART[r].blurb}
              </span>
            </button>
          );
        })}
      </div>

      {role && (
        <div className="yg-callout yg-callout--tip">
          <span className="yg-callout__icon">
            <Check size={16} aria-hidden="true" />
          </span>
          <div className="yg-callout__body">
            <strong className="yg-callout__title">
              Votre parcours — {path.length} chapitres, environ {minutes} minutes
            </strong>
            <ol className="yg-plain m-0 grid gap-1.5 p-0 text-sm">
              {path.map((c) => (
                <li key={c.slug}>
                  <Link
                    href={`/guide/${c.slug}`}
                    className="inline-flex items-center gap-2 text-(--ax-text) no-underline hover:text-(--ax-accent)"
                  >
                    <GuideIcon name={c.icon} size={15} />
                    <span>{c.title}</span>
                    {read.includes(c.slug) && (
                      <Check
                        size={13}
                        className="text-(--yessal-montant)"
                        aria-label="lu"
                      />
                    )}
                  </Link>
                </li>
              ))}
            </ol>
            <Link
              href={`/guide/${path[0]?.slug ?? "bienvenue"}`}
              className="ax-btn ax-btn--primary ax-btn--sm mt-1"
            >
              <span className="ax-btn__label">Commencer la lecture</span>
              <ArrowRight className="ax-btn__icon" size={14} aria-hidden="true" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
