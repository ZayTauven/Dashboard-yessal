"use client";

/*
 * L'import Excel des membres, en deux temps : l'aperçu, puis la confirmation.
 *
 * Le fichier part DEUX fois à Django. La première avec `apercu`, qui déroule
 * tout — y compris les doublons entre lignes du même fichier — et annule :
 * l'administrateur voit ligne par ligne ce qui va se passer, et surtout quels
 * comptes naîtront sans Daara, et pourquoi. La seconde écrit.
 *
 * Un compte sans Daara n'est PAS un échec : le membre le choisira lui-même à
 * sa première connexion. D'où un ton « warning », jamais « danger », pour ces
 * lignes. Seules les lignes refusées sont des erreurs à corriger.
 */

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import * as XLSX from "xlsx";
import {
  importMembers,
  type LigneImportMembre,
  type RapportImportMembres,
} from "@/app/actions/users";
import { Modal } from "@/components/vireo/Modal";

const VERDICT: Record<
  LigneImportMembre["verdict"],
  { label: string; badge: string }
> = {
  cree: { label: "Créé", badge: "ax-badge--success" },
  cree_sans_daara: { label: "Sans Daara", badge: "ax-badge--warning" },
  rejete: { label: "Refusé", badge: "ax-badge--danger" },
};

/** Les colonnes que Django reconnaît — `ENTETES` dans `user_import.py`. */
const MODELE = [
  ["Prénom", "Nom", "Email", "Téléphone", "Rôle", "Daara", "LDD"],
  ["Awa", "Ndiaye", "awa.ndiaye@exemple.sn", "771234567", "Talubé", "KANDE", "KAOLACK1 WADIEUKHTOU"],
];

export function telechargerModele() {
  const feuille = XLSX.utils.aoa_to_sheet(MODELE);
  const classeur = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(classeur, feuille, "Membres");
  XLSX.writeFile(classeur, "Yessal_Modele_Import_Membres.xlsx");
}

/**
 * Les provisoires de l'import, en classeur. Django ne les rend qu'UNE fois et
 * n'en garde aucune copie en clair : ce fichier est le seul moyen de les
 * retrouver pour les transmettre de vive voix.
 */
function telechargerMotsDePasse(rapport: RapportImportMembres) {
  const lignes = rapport.lignes
    .filter((l) => l.mot_de_passe)
    .map((l) => [l.nom, l.identifiant, l.daara ?? "", l.mot_de_passe ?? ""]);
  const feuille = XLSX.utils.aoa_to_sheet([
    ["Membre", "Identifiant", "Daara", "Mot de passe provisoire"],
    ...lignes,
  ]);
  const classeur = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(classeur, feuille, "Provisoires");
  XLSX.writeFile(classeur, "Yessal_Mots_De_Passe_Provisoires.xlsx");
}

export function ImportMembresModal({
  file,
  apercu,
  onClose,
  onImported,
}: {
  /** Le fichier choisi ; `null` ferme la modale. */
  file: File | null;
  /** Le rapport de l'aperçu, déjà calculé par l'appelant. */
  apercu: RapportImportMembres | null;
  onClose: () => void;
  onImported: () => void;
}) {
  const [final, setFinal] = useState<RapportImportMembres | null>(null);
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const rapport = final ?? apercu;
  const aCreer = rapport ? rapport.totaux.crees + rapport.totaux.crees_sans_daara : 0;

  const fermer = () => {
    setFinal(null);
    setErreur(null);
    onClose();
  };

  const confirmer = async () => {
    if (!file) return;
    setEnvoi(true);
    setErreur(null);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("apercu", "false");
    const { data, error } = await importMembers(fd);
    setEnvoi(false);
    if (error || !data) {
      setErreur(error ?? "L'import a échoué.");
      return;
    }
    setFinal(data);
    onImported();
  };

  return (
    <Modal
      open={Boolean(file && apercu)}
      onOpenChange={(o) => {
        if (!o && !envoi) fermer();
      }}
      title={final ? "Import terminé" : "Aperçu de l'import"}
      description={file?.name}
      status={final ? "success" : undefined}
      size="xl"
      footer={
        final ? (
          <button type="button" className="ax-btn ax-btn--primary" onClick={fermer}>
            <span className="ax-btn__label">Fermer</span>
          </button>
        ) : (
          <>
            <button
              type="button"
              className="ax-btn ax-btn--outline"
              onClick={fermer}
              disabled={envoi}
            >
              <span className="ax-btn__label">Annuler</span>
            </button>
            <button
              type="button"
              className="ax-btn ax-btn--primary"
              onClick={confirmer}
              disabled={envoi || aCreer === 0}
            >
              {envoi && (
                <Loader2 className="ax-btn__icon animate-spin" size={16} aria-hidden="true" />
              )}
              <span className="ax-btn__label">
                {aCreer === 0
                  ? "Aucun compte à créer"
                  : `Créer ${aCreer} compte${aCreer > 1 ? "s" : ""}`}
              </span>
            </button>
          </>
        )
      }
    >
      {rapport && (
        <div className="flex flex-col gap-4">
          <p className="text-sm">
            <strong>{rapport.message}</strong>
            {rapport.totaux.lignes_vides > 0 &&
              ` ${rapport.totaux.lignes_vides} ligne(s) vide(s) ignorée(s).`}
          </p>

          {rapport.totaux.crees_sans_daara > 0 && (
            <div className="ax-alert ax-alert--info ax-alert--inline">
              <div className="ax-alert__content">
                <p className="ax-alert__message">
                  Un Daara n’est affecté que si le fichier le désigne sans
                  ambiguïté. Les comptes « Sans Daara » sont bien créés : le
                  membre choisira lui-même sa LDD et son Daara à sa première
                  connexion, avant de remplacer son mot de passe provisoire.
                </p>
              </div>
            </div>
          )}

          {final && aCreer > 0 && (
            <div className="ax-alert ax-alert--warning ax-alert--inline">
              <div className="ax-alert__content">
                <p className="ax-alert__message">
                  Chaque compte a son propre mot de passe provisoire, à
                  transmettre de vive voix. Ils ne s’affichent qu’ici, une seule
                  fois : téléchargez-les avant de fermer.
                </p>
                <button
                  type="button"
                  className="ax-btn ax-btn--outline ax-btn--sm self-start mt-2"
                  onClick={() => telechargerMotsDePasse(final)}
                >
                  <Download className="ax-btn__icon" size={14} aria-hidden="true" />
                  <span className="ax-btn__label">Télécharger les mots de passe</span>
                </button>
              </div>
            </div>
          )}

          {erreur && (
            <div className="ax-alert ax-alert--danger ax-alert--inline" role="alert">
              <div className="ax-alert__content">
                <p className="ax-alert__message">{erreur}</p>
              </div>
            </div>
          )}

          <div className="ax-table-wrap">
            <table className="ax-table">
              <thead>
                <tr>
                  <th scope="col">Ligne</th>
                  <th scope="col">Membre</th>
                  <th scope="col">Résultat</th>
                  <th scope="col">Daara</th>
                  <th scope="col">Détail</th>
                  {final && <th scope="col">Mot de passe</th>}
                </tr>
              </thead>
              <tbody>
                {rapport.lignes.map((l) => (
                  <tr key={l.ligne}>
                    <td className="ax-text-muted">{l.ligne}</td>
                    <td>
                      <div className="font-medium">{l.nom || "—"}</div>
                      <div className="ax-text-muted text-xs">{l.identifiant || "—"}</div>
                    </td>
                    <td>
                      <span className={`ax-badge ${VERDICT[l.verdict].badge}`}>
                        {VERDICT[l.verdict].label}
                      </span>
                    </td>
                    <td>{l.daara ?? "—"}</td>
                    <td className="text-sm">
                      {[l.motif, ...l.remarques].filter(Boolean).join(" · ") || "—"}
                    </td>
                    {final && (
                      <td>
                        {l.mot_de_passe ? (
                          <code className="ax-code">{l.mot_de_passe}</code>
                        ) : (
                          "—"
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {!final && (
            <button
              type="button"
              className="ax-btn ax-btn--ghost ax-btn--sm self-start"
              onClick={telechargerModele}
            >
              <Download className="ax-btn__icon" size={14} aria-hidden="true" />
              <span className="ax-btn__label">Télécharger le modèle de fichier</span>
            </button>
          )}
        </div>
      )}
    </Modal>
  );
}
