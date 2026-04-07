import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contacter le support",
  description: "Besoin d'aide ? Contactez l'équipe de support de Yessal Gui.",
};

export default function ContactPage() {
  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "var(--background)" }}
    >
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <span
              className="text-base font-medium"
              style={{ color: "var(--muted-foreground)" }}
            >
              Yessal Gui
            </span>
          </Link>
          <h1
            className="mt-3 text-2xl"
            style={{
              fontWeight: 300,
              letterSpacing: "-0.02em",
              color: "var(--foreground)",
            }}
          >
            Contacter le support
          </h1>
          <p
            className="mt-2 text-sm"
            style={{ color: "var(--muted-foreground)" }}
          >
            Un membre de l'équipe vous répondra rapidement.
          </p>
        </div>

        <form
          className="flex flex-col gap-4"
        >
          <div className="flex flex-col gap-1.5">
            <Label
              htmlFor="contact-name"
              style={{ color: "var(--foreground)" }}
            >
              Prénom et nom
            </Label>
            <Input
              id="contact-name"
              placeholder="Votre nom"
              style={{
                borderRadius: "8px",
                height: "44px",
                border: "1px solid var(--border)",
              }}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label
              htmlFor="contact-email"
              style={{ color: "var(--foreground)" }}
            >
              Adresse email
            </Label>
            <Input
              id="contact-email"
              type="email"
              placeholder="nom@exemple.com"
              style={{
                borderRadius: "8px",
                height: "44px",
                border: "1px solid var(--border)",
              }}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label
              htmlFor="contact-message"
              style={{ color: "var(--foreground)" }}
            >
              Message
            </Label>
            <Textarea
              id="contact-message"
              placeholder="Décrivez votre demande..."
              rows={4}
              style={{
                borderRadius: "8px",
                border: "1px solid var(--border)",
                resize: "none",
              }}
            />
          </div>
          <Button
            type="submit"
            style={{
              background: "var(--yessal-green)",
              color: "#FAFAF8",
              borderRadius: "8px",
              height: "48px",
              fontSize: "15px",
            }}
          >
            Envoyer
          </Button>
        </form>

        <p
          className="text-center text-xs mt-6"
          style={{ color: "var(--muted-foreground)" }}
        >
          <Link href="/" style={{ color: "var(--yessal-green)" }}>
            ← Retour à l'accueil
          </Link>
        </p>
      </div>
    </div>
  );
}
