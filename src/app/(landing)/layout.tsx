import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Accueil",
  description:
    "Yessal Gui — Gérez les dons, campagnes et événements de votre confrérie.",
};

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
