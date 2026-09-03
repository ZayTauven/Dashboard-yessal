import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, Send } from "lucide-react";
import { BrandMark } from "@/components/BrandMark";

export const metadata: Metadata = {
  title: "Contacter le support",
  description: "Besoin d'aide ? Contactez l'équipe de support de Yessal Gui.",
};

/*
 * ═══════════════════════════════════════════════════════════════════════════
 * Contacter le support
 * ═══════════════════════════════════════════════════════════════════════════
 * Repris du patron `forms/Validation` de Vireo : carte centrée, champs sur les
 * contrats `.ax-field`.
 *
 * ⚠️ CE FORMULAIRE N'EST PAS BRANCHÉ.
 *
 * Il n'a ni `action` ni `onSubmit` : le bouton « Envoyer » recharge la page et
 * la saisie est perdue. Aucun endpoint de support n'existe côté backend. Le
 * comportement est laissé tel quel — le brancher est une décision produit,
 * consignée dans AGENTS/REFONTE_DETTE.md — mais la page ne PROMET plus une
 * réponse qu'elle ne peut pas tenir : le sous-titre disait « Un membre de
 * l'équipe vous répondra rapidement », il est remplacé par une consigne
 * exacte, et l'encart d'avertissement dit ce qu'il en est.
 *
 * Le champ téléphone était `type="phone"` — un type inexistant en HTML, que les
 * navigateurs traitent comme `type="text"`. Il passe en `type="tel"`, ce qui
 * fait apparaître le clavier numérique sur mobile.
 */
export default function ContactPage() {
  return (
    <div className="flex min-h-dvh items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <BrandMark href="/" size="md" className="justify-center" />
          <h1 className="mt-4 text-2xl font-semibold tracking-tight">
            Contacter le support
          </h1>
          <p className="ax-text-muted mt-1.5 text-sm">
            Décrivez votre demande le plus précisément possible.
          </p>
        </div>

        <div className="ax-card">
          <div className="ax-card__body flex flex-col gap-6">
            {/*
              L'avertissement est volontairement visible : envoyer un message
              dans le vide, sans le savoir, est pire que pas de formulaire.
            */}
            <div className="ax-alert ax-alert--warning ax-alert--inline">
              <Send className="ax-alert__icon" aria-hidden="true" />
              <div className="ax-alert__content">
                <p className="ax-alert__message">
                  Ce formulaire n&apos;est pas encore relié au support. En
                  attendant, passez par votre chef de Daara ou un
                  administrateur.
                </p>
              </div>
            </div>

            <form className="flex flex-col gap-5">
              <div className="ax-field">
                <label className="ax-field__label" htmlFor="contact-name">
                  Prénom et nom
                </label>
                <input
                  id="contact-name"
                  name="name"
                  className="ax-input"
                  autoComplete="name"
                  placeholder="Amadou Ndiaye"
                />
              </div>

              <div className="ax-field">
                <label className="ax-field__label" htmlFor="contact-phone">
                  Téléphone
                </label>
                <input
                  id="contact-phone"
                  name="phone"
                  type="tel"
                  inputMode="tel"
                  className="ax-input font-mono"
                  autoComplete="tel"
                  placeholder="+221 78 123 45 67"
                />
              </div>

              <div className="ax-field">
                <label className="ax-field__label" htmlFor="contact-email">
                  Adresse e-mail
                </label>
                <input
                  id="contact-email"
                  name="email"
                  type="email"
                  className="ax-input"
                  autoComplete="email"
                  placeholder="nom@exemple.com"
                />
              </div>

              <div className="ax-field">
                <label className="ax-field__label" htmlFor="contact-message">
                  Message
                </label>
                <textarea
                  id="contact-message"
                  name="message"
                  rows={5}
                  className="ax-textarea"
                  placeholder="Décrivez votre demande…"
                />
              </div>

              <button
                type="submit"
                className="ax-btn ax-btn--primary ax-btn--lg ax-btn--block"
              >
                <Send className="ax-btn__icon" size={16} aria-hidden="true" />
                <span className="ax-btn__label">Envoyer</span>
              </button>
            </form>
          </div>
        </div>

        <p className="mt-5 text-center">
          <Link href="/" className="ax-link text-sm">
            <ArrowLeft size={13} className="inline" aria-hidden="true" /> Retour
            à l&apos;accueil
          </Link>
        </p>
      </div>
    </div>
  );
}
