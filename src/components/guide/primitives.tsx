/*
 * ═══════════════════════════════════════════════════════════════════════════
 * Yessal Guide — les briques d'un chapitre
 * ═══════════════════════════════════════════════════════════════════════════
 * Tout ce qu'un chapitre assemble : encarts, étapes, figures encadrées,
 * tableaux de droits, listes de moyens de paiement. Aucune n'a d'état — elles
 * restent donc des composants serveur, et les chapitres aussi.
 *
 * Les seules exceptions, qui vivent dans leurs propres fichiers parce qu'elles
 * ont besoin du navigateur : <Terme> (infobulle), <Faq> (accordéon), le rail,
 * la palette et l'avancement de lecture.
 */

import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import {
  ArrowRight,
  CheckCircle2,
  CircleDashed,
  Info,
  Lightbulb,
  MinusCircle,
  Scale,
  TriangleAlert,
  XCircle,
} from "lucide-react";

/* ═══════════════════════════════════════════════════════════════════════════
   Encarts
   ═══════════════════════════════════════════════════════════════════════════ */

type CalloutTone = "info" | "warn" | "tip" | "rule";

const CALLOUT_ICON = {
  info: Info,
  warn: TriangleAlert,
  tip: Lightbulb,
  rule: Scale,
} as const;

const CALLOUT_DEFAULT_TITLE: Record<CalloutTone, string> = {
  info: "Bon à savoir",
  warn: "Attention",
  tip: "Le raccourci",
  rule: "La règle",
};

export function Callout({
  tone = "info",
  title,
  children,
}: {
  tone?: CalloutTone;
  title?: string;
  children: ReactNode;
}) {
  const Icon = CALLOUT_ICON[tone];
  return (
    <aside className={`yg-callout yg-callout--${tone}`}>
      <span className="yg-callout__icon">
        <Icon size={16} aria-hidden="true" />
      </span>
      <div className="yg-callout__body">
        <strong className="yg-callout__title">
          {title ?? CALLOUT_DEFAULT_TITLE[tone]}
        </strong>
        {children}
      </div>
    </aside>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Étapes
   ═══════════════════════════════════════════════════════════════════════════ */

export function Steps({ children }: { children: ReactNode }) {
  return <div className="yg-steps">{children}</div>;
}

export function Step({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="yg-step">
      {/* Le numéro est posé par CSS (counter) : rien à tenir à jour à la main
          quand une étape s'insère au milieu. */}
      <span className="yg-step__num" aria-hidden="true" />
      <div className="yg-step__body">
        <h3 className="yg-step__title">{title}</h3>
        {children}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Figures
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Une capture du dashboard, posée dans un cadre de navigateur.
 *
 * `crop` limite la hauteur et fond le bas : beaucoup de captures ne valent
 * que par leur haut, et une page entière réduite à la largeur d'une colonne
 * de lecture ne montre plus rien.
 */
export function Shot({
  src,
  alt,
  url = "yessal.sn/dashboard",
  caption,
  width = 1440,
  height = 900,
  crop = false,
  priority = false,
}: {
  src: string;
  alt: string;
  url?: string;
  caption?: ReactNode;
  width?: number;
  height?: number;
  crop?: boolean;
  priority?: boolean;
}) {
  return (
    <figure className="yg-fig">
      <div className={`yg-browser${crop ? " yg-browser--crop" : ""}`}>
        <div className="yg-browser__bar">
          <span className="yg-browser__dots" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          <span className="yg-browser__url">{url}</span>
        </div>
        <div className="yg-browser__view">
          <Image
            className="yg-browser__shot"
            src={src}
            alt={alt}
            width={width}
            height={height}
            sizes="(min-width: 992px) 44rem, 100vw"
            priority={priority}
          />
        </div>
      </div>
      {caption ? <figcaption className="yg-fig__cap">{caption}</figcaption> : null}
    </figure>
  );
}

/**
 * Un DÉTAIL d'écran — une fenêtre, un panneau, une carte — sans cadre de
 * navigateur.
 *
 * Poser une barre d'adresse autour d'un fragment découpé au milieu d'une page
 * raconte quelque chose de faux : ce n'est pas ce que montre l'onglet. Le
 * détail reçoit donc son propre encadrement, plus discret, et se voit centré
 * sur une largeur qui laisse le texte respirer autour.
 */
export function Detail({
  src,
  alt,
  caption,
  width,
  height,
  max = "26rem",
}: {
  src: string;
  alt: string;
  caption?: ReactNode;
  width: number;
  height: number;
  /** Largeur maximale de rendu. Un détail n'a pas à occuper toute la colonne. */
  max?: string;
}) {
  return (
    <figure className="yg-fig">
      <div className="yg-detail" style={{ maxWidth: max }}>
        <Image
          src={src}
          alt={alt}
          width={width}
          height={height}
          sizes="(min-width: 768px) 26rem, 100vw"
          className="yg-detail__img"
        />
      </div>
      {caption ? <figcaption className="yg-fig__cap">{caption}</figcaption> : null}
    </figure>
  );
}

/** Une capture de l'application mobile, dans un cadre de téléphone. */
export function Phone({
  src,
  alt,
  caption,
}: {
  src: string;
  alt: string;
  caption?: string;
}) {
  return (
    <figure className="yg-phone">
      <span className="yg-phone__notch" aria-hidden="true" />
      <div className="yg-phone__screen">
        <Image src={src} alt={alt} width={540} height={1170} sizes="15rem" />
      </div>
      {caption ? <figcaption className="yg-fig__cap">{caption}</figcaption> : null}
    </figure>
  );
}

export function Phones({ children }: { children: ReactNode }) {
  return <div className="yg-phones">{children}</div>;
}

/* ═══════════════════════════════════════════════════════════════════════════
   Pastilles et éléments en ligne
   ═══════════════════════════════════════════════════════════════════════════ */

export function Pill({
  tone,
  children,
}: {
  tone?: "accent" | "gold" | "green";
  children: ReactNode;
}) {
  return (
    <span className={`yg-pill${tone ? ` yg-pill--${tone}` : ""}`}>{children}</span>
  );
}

/** Le libellé exact d'un élément de l'interface, cité dans une phrase. */
export function Ui({ children }: { children: ReactNode }) {
  return <span className="yg-ui">{children}</span>;
}

export function Kbd({ children }: { children: ReactNode }) {
  return <kbd className="yg-kbd">{children}</kbd>;
}

/** Un montant. Toujours en vert Yessal — jamais à la couleur d'accent. */
export function Amount({ children }: { children: ReactNode }) {
  return <span className="yg-amount">{children}</span>;
}

/* ═══════════════════════════════════════════════════════════════════════════
   Cartes
   ═══════════════════════════════════════════════════════════════════════════ */

export function Cards({
  cols = 2,
  children,
}: {
  cols?: 2 | 3;
  children: ReactNode;
}) {
  return <div className={`yg-cards yg-cards--${cols}`}>{children}</div>;
}

export function Card({
  href,
  title,
  icon,
  num,
  more = "Lire",
  children,
}: {
  href?: string;
  title: string;
  icon?: ReactNode;
  num?: string;
  more?: string;
  children: ReactNode;
}) {
  const inner = (
    <>
      {num ? (
        <span className="yg-card__num" aria-hidden="true">
          {num}
        </span>
      ) : null}
      {icon ? <span className="yg-card__icon">{icon}</span> : null}
      <span className="yg-card__title">{title}</span>
      <span className="yg-card__text">{children}</span>
      {href ? (
        <span className="yg-card__more">
          {more}
          <ArrowRight size={14} aria-hidden="true" />
        </span>
      ) : null}
    </>
  );

  if (!href) return <div className="yg-card">{inner}</div>;
  return (
    <Link href={href} className="yg-card">
      {inner}
    </Link>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Tableau de droits
   ═══════════════════════════════════════════════════════════════════════════ */

export type MatrixMark = "yes" | "no" | "part";

/**
 * Les trois marques portent un libellé lisible au lecteur d'écran : une coche
 * verte dans une grille de droits n'est pas une décoration, c'est l'information.
 */
export function Mark({ value, note }: { value: MatrixMark; note?: string }) {
  if (value === "yes")
    return (
      <span className="yg-matrix__yes" title={note}>
        <CheckCircle2 size={17} aria-hidden="true" />
        <span className="sr-only">Oui{note ? ` — ${note}` : ""}</span>
      </span>
    );
  if (value === "part")
    return (
      <span className="yg-matrix__part" title={note}>
        <MinusCircle size={17} aria-hidden="true" />
        <span className="sr-only">En partie{note ? ` — ${note}` : ""}</span>
      </span>
    );
  return (
    <span className="yg-matrix__no" title={note}>
      <XCircle size={17} aria-hidden="true" />
      <span className="sr-only">Non{note ? ` — ${note}` : ""}</span>
    </span>
  );
}

export function Matrix({
  columns,
  rows,
}: {
  columns: string[];
  rows: { label: string; cells: { value: MatrixMark; note?: string }[] }[];
}) {
  return (
    <>
      {/*
        Douze lignes sur quatre colonnes ne tiennent pas dans 358 px. Le cadre
        défile, mais rien ne le dit : sur un téléphone, une colonne coupée
        ressemble à une colonne manquante. On le dit donc, et seulement là où
        c'est vrai.
      */}
      <p className="mb-2 text-xs text-(--ax-text-subtle) md:hidden">
        Le tableau défile horizontalement.
      </p>
      <div className="yg-matrix-wrap">
        <table className="yg-matrix">
          <thead>
            <tr>
              <th scope="col">Peut…</th>
              {columns.map((c) => (
                <th key={c} scope="col">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label}>
                <th scope="row">{row.label}</th>
                {row.cells.map((cell, i) => (
                  <td key={`${row.label}-${columns[i] ?? i}`}>
                    <Mark value={cell.value} note={cell.note} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Moyens de paiement
   ═══════════════════════════════════════════════════════════════════════════ */

export function Pays({ children }: { children: ReactNode }) {
  return <div className="yg-pays">{children}</div>;
}

export function Pay({
  logo,
  name,
  children,
}: {
  logo: string;
  name: string;
  children: ReactNode;
}) {
  return (
    <div className="yg-pay">
      <span className="yg-pay__logo">
        <Image src={logo} alt="" width={64} height={64} />
      </span>
      <span>
        <span className="yg-pay__name">{name}</span>
        <span className="yg-pay__note">{children}</span>
      </span>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Séparateur orné
   ═══════════════════════════════════════════════════════════════════════════ */

export function Ornament() {
  return (
    <div className="yg-rule" aria-hidden="true">
      <Image src="/guide-assets/decor/ornement.png" alt="" width={120} height={120} />
    </div>
  );
}

/** Une liste de vérification, pour clore un chapitre. */
export function Checklist({ items }: { items: string[] }) {
  return (
    <ul className="yg-plain my-6 grid gap-2">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-2.5 text-sm leading-relaxed">
          <CircleDashed
            size={16}
            className="mt-0.75 flex-none text-(--ax-accent)"
            aria-hidden="true"
          />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}
