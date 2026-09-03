"use client";

/*
 * ═══════════════════════════════════════════════════════════════════════════
 * Zone de dépôt de fichiers
 * ═══════════════════════════════════════════════════════════════════════════
 * Contrat `.ax-dropzone` de Vireo (patron `forms/FileUpload`).
 *
 * Il remplace l'`<input type="file">` natif, utilisé jusqu'ici aux six
 * emplacements du produit. Deux raisons :
 *
 *   · SON TEXTE N'EST PAS TRADUISIBLE. « Choose file / No file chosen » est
 *     rendu par le navigateur selon SA locale, pas celle du site : aucun
 *     attribut, aucune feuille de style ne permet de le changer. La seule
 *     solution est de masquer l'input et de dessiner l'interface soi-même —
 *     c'est ce que fait ce composant, entièrement en français.
 *
 *   · AUCUNE LIMITE DE TAILLE N'EXISTAIT. Ni dans le front, ni dans Django
 *     (nginx plafonne à 20 Mo, mais le message d'erreur est alors une page 413
 *     illisible). Un membre déposant une photo de 30 Mo depuis son téléphone se
 *     heurtait à un échec sans explication. Le plafond est désormais explicite,
 *     annoncé avant le dépôt et vérifié après.
 *
 * Le champ reste un vrai `<input type="file">` masqué, porteur du `name` : le
 * composant fonctionne donc dans un `<form action={...}>` sans JavaScript
 * supplémentaire, comme les Server Actions du projet l'attendent.
 */

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { FileUp, Image as ImageIcon, Paperclip, X } from "lucide-react";
import { cn } from "@/lib/utils";

/** Plafond commun à tous les dépôts du produit. Aligné sur Django. */
export const MAX_FILE_SIZE_MB = 15;
const MAX_FILE_SIZE = MAX_FILE_SIZE_MB * 1024 * 1024;

/** 2411724 → « 2,3 Mo ». Le séparateur décimal est la virgule, en français. */
export function formatFileSize(bytes: number): string {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1).replace(".", ",")} Mo`;
  }
  return `${Math.max(1, Math.round(bytes / 1024))} Ko`;
}

/**
 * Vérifie un fichier contre le plafond et renvoie un message prêt à afficher,
 * ou `null` si le fichier passe.
 *
 * Pour les dépôts qui ont déjà leur propre interface — l'appareil photo sur
 * l'avatar, le trombone du chat, les imports Excel — où une zone de dépôt
 * complète serait de trop, mais où le contrôle de taille manque tout autant.
 */
export function checkFileSize(
  file: File,
  maxSizeMb: number = MAX_FILE_SIZE_MB,
): string | null {
  const max = maxSizeMb * 1024 * 1024;
  if (file.size <= max) return null;
  return `« ${file.name} » fait ${formatFileSize(file.size)} : la taille maximale autorisée est de ${maxSizeMb} Mo.`;
}

export interface FileDropProps {
  name: string;
  /** Types acceptés, syntaxe de l'attribut `accept`. */
  accept?: string;
  multiple?: boolean;
  /** Plafond par fichier, en mégaoctets. */
  maxSizeMb?: number;
  /** Consigne affichée dans la zone, ex. « JPG, PNG ou PDF ». */
  hint?: string;
  /** Aperçu d'un fichier déjà enregistré côté serveur. */
  currentPreview?: string | null;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  /** Notifie le parent — utile pour un envoi immédiat. */
  onFilesChange?: (files: File[]) => void;
}

interface Rejected {
  name: string;
  size: number;
}

export function FileDrop({
  name,
  accept = "image/*",
  multiple = false,
  maxSizeMb = MAX_FILE_SIZE_MB,
  hint,
  currentPreview,
  required,
  disabled,
  className,
  onFilesChange,
}: FileDropProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [rejected, setRejected] = useState<Rejected[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const describedBy = useId();

  const maxBytes = maxSizeMb * 1024 * 1024;
  const isImage = accept.includes("image");

  /*
   * Les URL d'aperçu sont créées une fois par lot et révoquées au changement.
   * Sans ce nettoyage, chaque nouveau dépôt fuiterait une URL de blob.
   */
  useEffect(() => {
    if (!isImage) return;
    const made: Record<string, string> = {};
    for (const f of files) {
      if (f.type.startsWith("image/")) made[f.name] = URL.createObjectURL(f);
    }
    setPreviews(made);
    return () => Object.values(made).forEach(URL.revokeObjectURL);
  }, [files, isImage]);

  /*
   * L'input masqué est la source de vérité pour le formulaire. On y réinjecte
   * la sélection filtrée via un DataTransfer, pour qu'un fichier refusé ne
   * parte jamais au serveur.
   */
  const commit = useCallback(
    (accepted: File[]) => {
      const dt = new DataTransfer();
      accepted.forEach((f) => dt.items.add(f));
      if (inputRef.current) inputRef.current.files = dt.files;
      setFiles(accepted);
      onFilesChange?.(accepted);
    },
    [onFilesChange],
  );

  const ingest = useCallback(
    (incoming: FileList | null) => {
      if (!incoming || incoming.length === 0) return;

      const list = Array.from(incoming);
      const tooBig = list.filter((f) => f.size > maxBytes);
      const ok = list.filter((f) => f.size <= maxBytes);

      setRejected(tooBig.map((f) => ({ name: f.name, size: f.size })));
      commit(multiple ? [...files, ...ok] : ok.slice(0, 1));
    },
    [maxBytes, multiple, files, commit],
  );

  const removeAt = (index: number) => {
    setRejected([]);
    commit(files.filter((_, i) => i !== index));
  };

  return (
    <div className={cn("ax-dropzone", className)}>
      {/*
        Zone de dépôt. C'est un <label> : le clic ouvre nativement le sélecteur
        de fichiers, sans JavaScript, et le champ reste associé au libellé.
      */}
      <label
        className={cn("ax-dropzone__area", dragOver && "border-(--ax-accent)")}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (!disabled) ingest(e.dataTransfer.files);
        }}
      >
        <input
          ref={inputRef}
          type="file"
          name={name}
          accept={accept}
          multiple={multiple}
          required={required && files.length === 0}
          disabled={disabled}
          className="ax-visually-hidden"
          aria-describedby={describedBy}
          onChange={(e) => ingest(e.target.files)}
        />

        {isImage ? (
          <ImageIcon aria-hidden="true" />
        ) : (
          <FileUp aria-hidden="true" />
        )}

        <span className="text-sm font-medium">
          Déposez {multiple ? "vos fichiers" : "votre fichier"} ou cliquez pour
          parcourir
        </span>

        <span id={describedBy} className="ax-text-subtle text-xs">
          {hint ? `${hint} · ` : ""}
          {maxSizeMb} Mo maximum{multiple ? " par fichier" : ""}
        </span>
      </label>

      {/* Fichier déjà enregistré, tant qu'aucun remplaçant n'est choisi. */}
      {currentPreview && files.length === 0 && (
        <figure className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={currentPreview}
            alt=""
            className="h-16 w-24 rounded-(--ax-radius-sm) border border-(--ax-border) object-cover"
          />
          <figcaption className="ax-text-subtle text-xs">
            Fichier actuel — déposez-en un nouveau pour le remplacer.
          </figcaption>
        </figure>
      )}

      {/* Refus : on nomme le fichier ET son poids, pour que la cause soit claire. */}
      {rejected.length > 0 && (
        <div className="ax-alert ax-alert--danger ax-alert--inline" role="alert">
          <X className="ax-alert__icon" aria-hidden="true" />
          <div className="ax-alert__content">
            <p className="ax-alert__message">
              {rejected.length === 1
                ? `« ${rejected[0].name} » fait ${formatFileSize(rejected[0].size)} et dépasse la limite de ${maxSizeMb} Mo.`
                : `${rejected.length} fichiers dépassent la limite de ${maxSizeMb} Mo et ont été écartés.`}
            </p>
          </div>
        </div>
      )}

      {files.length > 0 && (
        <ul className="ax-dropzone__list">
          {files.map((f, i) => (
            <li key={`${f.name}-${i}`} className="ax-dropzone__file">
              {previews[f.name] ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={previews[f.name]}
                  alt=""
                  className="h-10 w-10 shrink-0 rounded-(--ax-radius-xs) object-cover"
                />
              ) : (
                <Paperclip size={16} className="shrink-0" aria-hidden="true" />
              )}

              <span className="ax-dropzone__name">{f.name}</span>

              <span className="ax-text-subtle font-mono tabular text-xs">
                {formatFileSize(f.size)}
              </span>

              <button
                type="button"
                className="ax-dropzone__remove"
                aria-label={`Retirer ${f.name}`}
                onClick={() => removeAt(i)}
              >
                <X size={14} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default FileDrop;
