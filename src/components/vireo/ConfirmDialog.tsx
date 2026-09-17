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
 * Le motif toast-de-confirmation compte encore une douzaine d'appels ailleurs
 * dans le tableau de bord. Ils ne sont pas touchés ici : cette passe porte sur
 * les actualités. Ce composant est écrit pour être leur remplaçant le jour où
 * on les reprendra — d'où la forme générique et le crochet `useConfirm`.
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
    >
      {/*
        Le corps porte la CONSÉQUENCE, pas une reformulation du titre. « Cette
        action est irréversible » n'apprend rien ; « les huit photos de la
        galerie partiront avec » évite un clic regretté.
      */}
      {description && <p className="ax-text-muted text-sm">{description}</p>}
    </Modal>
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
