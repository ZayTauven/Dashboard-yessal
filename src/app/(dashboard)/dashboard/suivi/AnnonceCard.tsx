"use client";

/*
 * Annoncer au Kourel depuis la fenêtre de suivi : un texte, une photo ou un
 * document au besoin, publiés dans « Annonces de Sangue Bi ». Le canal
 * notifie tout le Kourel (`comms.services.destinataires_push`).
 *
 * La note vocale reste dans la messagerie, où l'enregistreur existe déjà :
 * le lien « Ouvrir le canal » y mène.
 */
import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import { Paperclip, Send, X } from "lucide-react";
import { toast } from "sonner";
import { sendChatMessage } from "@/app/actions/comms";

export function AnnonceCard({ chatId, membres }: { chatId: number; membres: number }) {
  const [texte, setTexte] = useState("");
  const [fichier, setFichier] = useState<File | null>(null);
  const [envoi, demarrer] = useTransition();
  const champFichier = useRef<HTMLInputElement>(null);

  const publier = () => {
    if (!texte.trim() && !fichier) return;
    demarrer(async () => {
      const fd = new FormData();
      fd.append("chat", String(chatId));
      fd.append("content", texte.trim());
      if (fichier) fd.append("file", fichier);
      const res = await sendChatMessage(fd);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      setTexte("");
      setFichier(null);
      if (champFichier.current) champFichier.current.value = "";
      toast.success("Annonce publiée au Kourel.");
    });
  };

  return (
    <section id="annonce" className="ax-card scroll-mt-24" aria-labelledby="suivi-annonce">
      <div className="ax-card__header">
        <div className="ax-card__titles">
          <h2 id="suivi-annonce" className="ax-card__title">Annoncer au Kourel</h2>
          <p className="ax-text-subtle text-xs">
            Dans « Annonces de Sangue Bi » · {membres} membre{membres > 1 ? "s" : ""} notifié{membres > 1 ? "s" : ""}
          </p>
        </div>
      </div>
      <div className="ax-card__body flex flex-col gap-3">
        <label htmlFor="suivi-annonce-texte" className="ax-visually-hidden">Texte de l&rsquo;annonce</label>
        <textarea
          id="suivi-annonce-texte"
          className="ax-textarea min-h-28"
          placeholder="Écrire une annonce pour tout le Kourel…"
          value={texte}
          onChange={(e) => setTexte(e.target.value)}
          disabled={envoi}
        />
        {fichier && (
          <div className="flex items-center gap-2 text-sm">
            <Paperclip size={15} aria-hidden="true" />
            <span className="min-w-0 flex-1 truncate">{fichier.name}</span>
            <button
              type="button"
              className="ax-btn ax-btn--ghost ax-btn--icon"
              aria-label="Retirer la pièce jointe"
              onClick={() => {
                setFichier(null);
                if (champFichier.current) champFichier.current.value = "";
              }}
            >
              <X size={16} aria-hidden="true" />
            </button>
          </div>
        )}
        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={champFichier}
            id="suivi-annonce-fichier"
            type="file"
            accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx"
            className="ax-visually-hidden"
            onChange={(e) => setFichier(e.target.files?.[0] ?? null)}
          />
          <label htmlFor="suivi-annonce-fichier" className="ax-btn ax-btn--secondary cursor-pointer">
            <Paperclip size={16} aria-hidden="true" />
            <span className="ax-btn__label">Photo ou document</span>
          </label>
          <Link href={`/dashboard/chat?chat=${chatId}`} className="ax-btn ax-btn--ghost">
            <span className="ax-btn__label">Ouvrir le canal</span>
          </Link>
          <button
            type="button"
            className="ax-btn ax-btn--primary ml-auto"
            onClick={publier}
            disabled={envoi || (!texte.trim() && !fichier)}
          >
            <Send size={16} aria-hidden="true" />
            <span className="ax-btn__label">{envoi ? "Publication…" : "Publier"}</span>
          </button>
        </div>
      </div>
    </section>
  );
}
