import Link from "next/link";
import { BrandMark } from "@/components/BrandMark";

/*
 * 404 racine — pour tout ce qui vit hors du tableau de bord (pages publiques,
 * adresses inventées). Sans layout de coque à sa disposition, elle se suffit
 * à elle-même, mais reste sur les jetons Aurora : même fond, même typographie,
 * même accent que le reste du produit.
 */

export const metadata = {
  title: "Page introuvable",
};

export default function NotFound() {
  return (
    <main
      className="grid min-h-svh place-items-center px-6 py-16"
      style={{ background: "var(--ax-canvas)" }}
    >
      <div className="flex w-full max-w-md flex-col items-center gap-6 text-center">
        <BrandMark size="md" />

        <p
          className="font-mono text-6xl font-semibold leading-none"
          style={{ color: "var(--ax-accent)" }}
        >
          404
        </p>

        <div className="space-y-2">
          <h1 className="text-xl font-semibold text-text-strong">
            Cette page n&apos;existe pas
          </h1>
          <p className="text-sm leading-relaxed text-text-muted">
            L&apos;adresse demandée ne correspond à aucune page de Yessal Gui.
            Vérifiez le lien, ou repartez de l&apos;accueil.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2">
          <Link href="/" className="ax-btn ax-btn--primary">
            Retour à l&apos;accueil
          </Link>
          <Link href="/dashboard" className="ax-btn ax-btn--outline">
            Mon tableau de bord
          </Link>
        </div>
      </div>
    </main>
  );
}
