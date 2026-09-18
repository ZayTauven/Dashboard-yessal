"use client";

/*
 * ═══════════════════════════════════════════════════════════════════════════
 * Confirmation d'une action destructrice
 * ═══════════════════════════════════════════════════════════════════════════
 * Les suppressions se confirmaient jusqu'ici dans un TOAST — `toast("Supprimer
 * cette image ?", { action, cancel })`. Trois défauts, dans l'ordre de gravité :
 *
 *   · LE TOAST EST AILLEURS. Le Toaster est posé en `bottom-left`
 *     (AuroraToaster.tsx) ; la question apparaît donc dans le coin bas-gauche
 *     de la fenêtre, pendant que le regard est sur la vignette qu'on vient de
 *     cliquer. Quand l'action partait d'une modale centrée, la confirmation
 *     tombait carrément hors d'elle : c'est le symptôme d'où vient cette passe.
 *
 *   · LE TOAST EXPIRE. Sonner referme ses toasts après quelques secondes. Une
 *     question qui disparaît d'elle-même a une réponse par défaut, et cette
 *     réponse par défaut est « non » — ce qui est heureux ici, mais tient au
 *     hasard et non à une décision.
 *
 *   · LE TOAST NE PIÈGE PAS LE FOCUS. Au clavier, rien ne mène aux boutons
 *     Confirmer / Annuler : l'action est simplement hors d'atteinte.
 *
 * Une confirmation est une question bloquante, donc une modale. On s'appuie sur
 * <Modal>, qui porte déjà le piège de focus Radix, la fermeture par Échap et le
 * retour du focus au déclencheur.
 *
 * ── Portée ────────────────────────────────────────────────────────────────
 * Écrit d'abord pour les actualités, puis étendu le 2026-09-18 aux ONZE autres
 * confirmations du tableau de bord : annonces, Daaras, zones, titres, comptes,
 * Ndiguels, fêtes, messages, blocage d'accès. Il ne reste aucun
 * `toast(..., { cancel })` dans `src/app`.
 *
 * ── La description porte la CONSÉQUENCE ───────────────────────────────────
 * « Cette action est irréversible » n'apprend rien : la personne le sait déjà,
 * elle vient de cliquer sur « Supprimer ». Ce qu'elle ignore, c'est ce qui
 * part AVEC — et cela se lit dans les `on_delete` des modèles Django, pas dans
 * l'intuition. Supprimer un Ndiguel emporte ses dons (CASCADE) ; supprimer un
 * Daara laisse ses membres inscrits mais sans affiliation (SET_NULL). Les deux
 * méritaient d'être dits, et aucun ne l'était.
 */

import { useCallback, useState } from "react";
import { Modal } from "@/components/vireo/Modal";

export interface ConfirmRequest {
  title: string;
  description?: string;
  /** Libellé du bouton d'action. Doit nommer l'acte : « Supprimer », pas « OK ». */
  confirmLabel?: string;
  cancelLabel?: string;
  /** `danger` par défaut : ce composant sert d'abord aux suppressions. */
  tone?: "danger" | "warning" | "info";
  /** Peut être asynchrone — le dialogue reste ouvert et occupé le temps voulu. */
  onConfirm: () => void | Promise<void>;
}

export interface ConfirmDialogProps extends ConfirmRequest {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirmer",
  cancelLabel = "Annuler",
  tone = "danger",
  onConfirm,
}: ConfirmDialogProps) {
  const [busy, setBusy] = useState(false);

  const run = async () => {
    setBusy(true);
    try {
      await onConfirm();
      onOpenChange(false);
    } finally {
      /*
       * `finally` : si l'action échoue, le dialogue reste ouvert — l'erreur
       * s'affiche en toast et l'auteur peut réessayer — mais le bouton doit
       * sortir de son état occupé, sans quoi il reste bloqué pour de bon.
       */
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      onOpenChange={(o) => !busy && onOpenChange(o)}
      title={title}
      description={description}
      status={tone}
      size="sm"
      /* `bare` toujours : une confirmation n'a PAS de corps. La conséquence est
         passée à <Modal> en `description`, qui la rend dans l'en-tête — et
         surtout la relie au dialogue par `aria-describedby`, ce qu'un
         paragraphe posé dans le corps ne ferait pas.

         Elle a d'abord été rendue AUX DEUX endroits : le texte s'affichait en
         double, une fois sous le titre et une fois dans le corps. Sans `bare`,
         le corps vide laissait par ailleurs une bande blanche entre le titre et
         les boutons. */
      bare
      footer={
        <>
          <button
            type="button"
            className="ax-btn ax-btn--ghost"
            onClick={() => onOpenChange(false)}
            disabled={busy}
          >
            <span className="ax-btn__label">{cancelLabel}</span>
          </button>
          <button
            type="button"
            className={
              tone === "danger"
                ? "ax-btn ax-btn--danger"
                : "ax-btn ax-btn--primary"
            }
            onClick={run}
            disabled={busy}
            aria-busy={busy}
          >
            <span className="ax-btn__label">
              {busy ? "Un instant…" : confirmLabel}
            </span>
          </button>
        </>
      }
    />
  );
}

/**
 * Forme impérative, pour les listes.
 *
 * Une carte par article, une vignette par photo : déclarer un dialogue contrôlé
 * par ligne obligerait à tenir un état d'ouverture par ligne. Le crochet n'en
 * tient qu'un seul, et la question voyage avec l'appel :
 *
 * ```tsx
 * const { ask, dialog } = useConfirm();
 * …
 * <button onClick={() => ask({ title: "Supprimer ?", onConfirm: … })} />
 * {dialog}
 * ```
 */
export function useConfirm() {
  const [request, setRequest] = useState<ConfirmRequest | null>(null);

  const ask = useCallback((next: ConfirmRequest) => setRequest(next), []);

  /*
   * Le dialogue n'existe dans l'arbre que pendant qu'une question est posée.
   * C'est ce qui garantit qu'`onConfirm` capture bien la ligne cliquée : à
   * chaque question, un composant neuf reçoit la nouvelle fermeture, sans
   * qu'une ancienne puisse survivre d'un rendu à l'autre.
   */
  const dialog = request ? (
    <ConfirmDialog
      {...request}
      open={Boolean(request)}
      onOpenChange={(o) => {
        if (!o) setRequest(null);
      }}
    />
  ) : null;

  return { ask, dialog };
}

export default ConfirmDialog;
