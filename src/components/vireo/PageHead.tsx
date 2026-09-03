"use client";

/*
 * ═══════════════════════════════════════════════════════════════════════════
 * En-tête de page
 * ═══════════════════════════════════════════════════════════════════════════
 * Contrat `.ax-page-head` de Vireo : fil d'Ariane, titre, sous-titre, actions.
 *
 * Chaque page du tableau de bord réinventait jusqu'ici son propre en-tête —
 * d'où des titres en `text-3xl font-black` sur l'une, `text-lg font-medium`
 * sur l'autre, des fils d'Ariane présents à trois endroits sur vingt-huit, et
 * des boutons d'action tantôt à gauche tantôt à droite. Ce composant tranche :
 * un seul en-tête, une seule hiérarchie typographique, les actions toujours au
 * même endroit.
 *
 * Le fil d'Ariane se déduit de l'arborescence de navigation quand on ne le
 * fournit pas : la page n'a rien à savoir de sa position dans le menu.
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";
import { trailFor, type Role } from "@/lib/nav";

export interface Crumb {
  label: string;
  href?: string;
}

export interface PageHeadProps {
  title: string;
  subtitle?: string;
  /** Rôle courant — sert à déduire le fil d'Ariane depuis le menu. */
  role?: Role;
  /** Fil d'Ariane explicite. Sinon déduit de la navigation. */
  crumbs?: Crumb[];
  /** Boutons alignés à droite du titre. */
  actions?: React.ReactNode;
  /** Contenu libre sous le titre (badges de statut, filtres…). */
  children?: React.ReactNode;
}

export function PageHead({
  title,
  subtitle,
  role = "member",
  crumbs,
  actions,
  children,
}: PageHeadProps) {
  const pathname = usePathname() || "/dashboard";

  /*
   * Fil déduit : section du menu puis entrée active. On n'ajoute pas l'entrée
   * courante en dernier maillon quand elle répète le titre — « Ndiguels ›
   * Ndiguels » n'apprend rien à personne.
   */
  const resolved: Crumb[] =
    crumbs ??
    (() => {
      const t = trailFor(pathname, role);
      if (!t) return [];
      const out: Crumb[] = [{ label: t.section.label }];
      if (t.item.title !== title) out.push({ label: t.item.title, href: t.item.href });
      return out;
    })();

  return (
    <div className="ax-page-head">
      <nav className="ax-breadcrumb" aria-label="Fil d'Ariane">
        <ol className="ax-breadcrumb__list">
          <li className="ax-breadcrumb__item ax-breadcrumb__home">
            <Link href="/dashboard" aria-label="Tableau de bord">
              <Home size={15} aria-hidden="true" />
            </Link>
          </li>
          {resolved.map((c) => (
            <li key={c.label} className="ax-breadcrumb__item">
              <ChevronRight
                className="ax-breadcrumb__sep"
                size={14}
                aria-hidden="true"
              />
              {c.href ? <Link href={c.href}>{c.label}</Link> : <span>{c.label}</span>}
            </li>
          ))}
          <li className="ax-breadcrumb__item" aria-current="page">
            <ChevronRight className="ax-breadcrumb__sep" size={14} aria-hidden="true" />
            <span>{title}</span>
          </li>
        </ol>
      </nav>

      <div className="ax-page-head__row">
        <div>
          <h1 className="ax-page-head__title">{title}</h1>
          {subtitle && <p className="ax-page-head__subtitle">{subtitle}</p>}
        </div>
        {actions && <div className="ax-page-head__actions">{actions}</div>}
      </div>

      {children}
    </div>
  );
}

export default PageHead;
