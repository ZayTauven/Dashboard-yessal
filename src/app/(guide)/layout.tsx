import type { Metadata } from "next";
import { GuideShell } from "@/components/guide/GuideShell";

/*
 * ═══════════════════════════════════════════════════════════════════════════
 * Yessal Guide
 * ═══════════════════════════════════════════════════════════════════════════
 * Un groupe de routes à part — mais PAS une zone publique.
 *
 * Yessal Gui est un outil interne à la confrérie, et sa documentation décrit
 * l'organisation, les rôles et les circuits de collecte. `/guide` est donc
 * protégé par l'intergiciel au même titre que `/dashboard` : sans session, on
 * est renvoyé vers la connexion.
 *
 * Ce qui justifie le groupe de routes distinct n'est pas l'accès mais la
 * LECTURE. Un chapitre se lit en colonne étroite, avec son propre sommaire et
 * ses figures pleine largeur — la coque applicative (rail de vingt entrées,
 * barre d'actions, fil d'Ariane) travaillerait contre lui. Le guide garde donc
 * sa coque, et un retour bien visible vers le tableau de bord.
 *
 * `robots: noindex` pour la même raison : rien de tout cela n'a à se retrouver
 * dans un moteur de recherche.
 */

export const metadata: Metadata = {
  title: {
    default: "Yessal Guide",
    template: "%s | Yessal Guide",
  },
  description:
    "Le guide de prise en main de Yessal Gui : ouvrir son compte, faire un Jëf, suivre un Ndiguel, tenir son Daara.",
  robots: { index: false, follow: false },
};

export default function GuideLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <GuideShell>{children}</GuideShell>;
}
