import { EyeOff } from "lucide-react";

/**
 * « Anonyme » — posé à côté du VRAI nom d'un donateur anonyme, que seuls
 * l'administration et Sangue Bi voient (`anonymous_revealed` côté serveur).
 *
 * Sangue Bi annonce parfois le « Top 3 » des donateurs d'un Ndiguel : sans
 * cette étiquette, rien ne l'empêchait de citer au Kourel quelqu'un qui avait
 * demandé à rester anonyme.
 */
export function AnonymeBadge() {
  return (
    <span
      className="ax-badge ax-badge--soft ax-badge--warning ml-1.5 inline-flex shrink-0 items-center gap-1 align-middle text-[11px] font-medium"
      title="Ce donateur a demandé à rester anonyme : ne le citez pas."
    >
      <EyeOff size={11} aria-hidden="true" />
      Anonyme
    </span>
  );
}
