import { isVideoFile } from "@/components/vireo/FileDrop";
import type { MessageRow } from "./types";

const APERCU_COTE = 640;
const APERCU_DELAI_MS = 8000;

export type ApercuVideo = { thumbnail: string | null; duration: number | null };

/**
 * L'image d'aperçu et la durée d'une vidéo, lues dans le navigateur.
 *
 * Jamais bloquant : un format que le navigateur ne sait pas décoder (le HEVC
 * d'un iPhone, souvent) part simplement sans aperçu.
 */
export function apercuVideo(file: File): Promise<ApercuVideo> {
  if (!isVideoFile(file)) return Promise.resolve({ thumbnail: null, duration: null });

  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    let duration: number | null = null;

    const finir = (thumbnail: string | null) => {
      clearTimeout(delai);
      URL.revokeObjectURL(url);
      video.removeAttribute("src");
      video.load();
      resolve({ thumbnail, duration });
    };
    const delai = setTimeout(() => finir(null), APERCU_DELAI_MS);

    video.muted = true;
    video.playsInline = true;
    video.preload = "auto";
    video.onerror = () => finir(null);
    video.onloadedmetadata = () => {
      if (Number.isFinite(video.duration)) duration = Math.round(video.duration);
      /* Pas la toute première image : elle est souvent noire. */
      video.currentTime = Math.min(1, (video.duration || 0) / 2);
    };
    video.onseeked = () => {
      try {
        const echelle = Math.min(1, APERCU_COTE / Math.max(video.videoWidth, video.videoHeight));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(video.videoWidth * echelle);
        canvas.height = Math.round(video.videoHeight * echelle);
        canvas.getContext("2d")?.drawImage(video, 0, 0, canvas.width, canvas.height);
        finir(canvas.toDataURL("image/jpeg", 0.7).split(",")[1] ?? null);
      } catch {
        finir(null);
      }
    };
    video.src = url;
  });
}

type ResultatEnvoi = { data?: MessageRow; error?: string };

/**
 * Envoie une pièce jointe vers `/api/chat/upload`.
 *
 * XMLHttpRequest et non `fetch` : c'est le seul à rapporter la progression d'un
 * envoi, et une vidéo peut prendre plusieurs minutes sur une connexion mobile.
 */
export function envoyerFichier(form: FormData, onProgress: (percent: number) => void): Promise<ResultatEnvoi> {
  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/chat/upload");
    xhr.responseType = "json";
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onerror = () => resolve({ error: "La connexion a été interrompue pendant l'envoi." });
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve({ data: xhr.response as MessageRow });
      } else if (xhr.status === 413) {
        resolve({ error: "Ce fichier dépasse la taille autorisée par le serveur." });
      } else {
        resolve({ error: (xhr.response as { error?: string } | null)?.error || "Impossible d'envoyer le fichier." });
      }
    };
    xhr.send(form);
  });
}
