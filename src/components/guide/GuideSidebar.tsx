"use client";

/*
 * ═══════════════════════════════════════════════════════════════════════════
 * Yessal Guide — le rail des chapitres
 * ═══════════════════════════════════════════════════════════════════════════
 * Treize entrées, quatre sections, et deux repères visuels qui font tout le
 * travail : le chapitre courant, et les chapitres déjà lus.
 *
 * L'avancement est LOCAL au navigateur (voir reading-state.ts). Il est donc
 * absent de la première peinture, celle que le serveur envoie — sinon le HTML
 * du serveur et celui du client divergent, et React réhydrate en erreur. La
 * barre d'avancement apparaît après le montage ; elle ne clignote pas, elle
 * arrive vide puis se remplit.
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Check } from "lucide-react";
import {
  GUIDE_CHAPTERS,
  GUIDE_SECTIONS,
  chaptersOfSection,
} from "@/lib/guide/manifest";
import { GuideIcon } from "./GuideIcon";
import { useReadChapters } from "./reading-state";

export function GuideSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname() || "/guide";
  const { read, reset } = useReadChapters();

  const total = GUIDE_CHAPTERS.length;
  const done = read.filter((slug) =>
    GUIDE_CHAPTERS.some((c) => c.slug === slug),
  ).length;

  return (
    <nav className="yg-side" aria-label="Sommaire du guide">
      <div className="yg-progress">
        <div className="yg-progress__top">
          <span className="yg-progress__label">Votre lecture</span>
          <span className="yg-progress__count">
            {done}/{total}
          </span>
        </div>
        <div
          className="yg-progress__track"
          role="progressbar"
          aria-valuenow={done}
          aria-valuemin={0}
          aria-valuemax={total}
          aria-label="Chapitres lus"
        >
          <span
            className="yg-progress__fill"
            style={{ width: `${(done / total) * 100}%` }}
          />
        </div>
        {done > 0 && (
          <button type="button" className="yg-progress__reset" onClick={reset}>
            Tout remettre à zéro
          </button>
        )}
      </div>

      <div className="yg-side__section">
        <p className="yg-side__label">Le guide</p>
        <Link
          href="/guide"
          className={`yg-side__link${pathname === "/guide" ? " is-active" : ""}`}
          onClick={onNavigate}
        >
          <span className="yg-side__icon">
            <GuideIcon name="compass" size={16} />
          </span>
          <span className="yg-side__text">Accueil du guide</span>
        </Link>
      </div>

      {GUIDE_SECTIONS.map((section) => (
        <div key={section.id} className="yg-side__section">
          <p className="yg-side__label">{section.label}</p>
          {chaptersOfSection(section.id).map((chapter) => {
            const href = `/guide/${chapter.slug}`;
            const active = pathname === href;
            return (
              <Link
                key={chapter.slug}
                href={href}
                className={`yg-side__link${active ? " is-active" : ""}`}
                aria-current={active ? "page" : undefined}
                onClick={onNavigate}
              >
                <span className="yg-side__icon">
                  <GuideIcon name={chapter.icon} size={16} />
                </span>
                <span className="yg-side__text">{chapter.title}</span>
                {read.includes(chapter.slug) && (
                  <span className="yg-side__done" title="Chapitre lu">
                    <Check size={14} aria-hidden="true" />
                    <span className="sr-only">lu</span>
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
