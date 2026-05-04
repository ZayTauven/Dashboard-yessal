"use client";

import Link from "next/link";
import Image from "next/image";
import { useTheme } from "next-themes";
import { Moon, Sun, LogIn, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrandMark } from "@/components/BrandMark";

export default function LandingPage() {
  return (
    <div className="h-screen w-full overflow-hidden flex flex-col" style={{ background: "var(--background)" }}>
      {/* ── Navbar flottante ── */}
      <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-5">
        <BrandMark href="/" size="sm" showSubtitle={false} />
        <nav className="flex items-center gap-3">
          <ThemeToggle />
          <Link href="/contact">
            <Button
              variant="ghost"
              size="sm"
              className="text-sm gap-2"
              style={{ color: "var(--muted-foreground)", cursor: "pointer" }}
            >
              <HelpCircle size={15} strokeWidth={1.5} />
              Contacter le support
            </Button>
          </Link>
          <Link href="/login">
            <Button
              size="sm"
              className="text-sm gap-2"
              style={{
                background: "var(--yessal-green)",
                color: "#FAFAF8",
                borderRadius: "8px",
                cursor: "pointer",
              }}
            >
              <LogIn size={15} strokeWidth={1.5} />
              Connexion
            </Button>
          </Link>
        </nav>
      </header>

      {/* ── Hero 50/50 ── */}
      <main className="flex-1 flex overflow-hidden">
        {/* ── Gauche : Texte ── */}
        <section
          className="w-1/2 h-full flex flex-col justify-center pl-16 pr-8"
          style={{ maxWidth: "640px" }}
        >
          <p
            className="text-sm font-medium mb-6 tracking-widest uppercase"
            style={{ color: "var(--yessal-green)", letterSpacing: "0.12em" }}
          >
            Confrérie · Daara · Solidarité
          </p>

          <h1
            className="text-5xl mb-6"
            style={{
              fontWeight: 300,
              lineHeight: 1.15,
              letterSpacing: "-0.02em",
              color: "var(--foreground)",
            }}
          >
            Gérez les dons
            <br />
            de votre communauté
          </h1>

          <p
            className="text-base mb-10 leading-relaxed"
            style={{ color: "var(--muted-foreground)", maxWidth: "420px" }}
          >
            Centralisez les Ndiguels, tracez chaque Jëfs et renforcez
            les liens de votre Daara — depuis n'importe où dans le monde.
          </p>

          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button
                size="lg"
                style={{
                  background: "var(--yessal-green)",
                  color: "#FAFAF8",
                  borderRadius: "8px",
                  padding: "0 28px",
                  height: "48px",
                  fontSize: "15px",
                  cursor: "pointer",
                }}
              >
                Connexion
              </Button>
            </Link>
            <Link href="/contact">
              <Button
                variant="ghost"
                size="lg"
                style={{
                  borderRadius: "8px",
                  height: "48px",
                  fontSize: "15px",
                  color: "var(--muted-foreground)",
                  border: "1px solid var(--border)",  
                  cursor: "pointer",
                }}
              >
                Contacter le support
              </Button>
            </Link>
          </div>
        </section>

        {/* ── Droite : Galerie défilante ── */}
        <section
          className="w-1/2 h-full relative overflow-hidden"
          style={{
            maskImage:
              "linear-gradient(transparent 0%, black 12%, black 88%, transparent 100%)",
            WebkitMaskImage:
              "linear-gradient(transparent 0%, black 12%, black 88%, transparent 100%)",
          }}
        >
          <div className="absolute inset-0 flex gap-6 px-6 py-4 justify-center pointer-events-none">
            {/* Colonne 1 */}
            <div className="gallery-scroll w-1/2 flex flex-col gap-6" style={{ marginTop: "-10vh" }}>
              {gallerySlots.concat(gallerySlots).map((slot, i) => (
                <div
                  key={`col1-${i}`}
                  className="relative flex-shrink-0 overflow-hidden shadow-sm"
                  style={{
                    aspectRatio: i % 2 === 0 ? "4 / 5" : "1 / 1",
                    borderRadius: "16px",
                  }}
                >
                  <Image
                    src={slot.src}
                    alt={slot.label}
                    fill
                    className="object-cover"
                    sizes="25vw"
                  />
                  <div className="absolute inset-0 bg-black/10" />
                </div>
              ))}
            </div>

            {/* Colonne 2 (décalée vers le haut, ordre invérsé) */}
            <div className="gallery-scroll w-1/2 flex flex-col gap-6" style={{ marginTop: "10vh" }}>
              {[...gallerySlots].reverse().concat([...gallerySlots].reverse()).map((slot, i) => (
                <div
                  key={`col2-${i}`}
                  className="relative flex-shrink-0 overflow-hidden shadow-sm"
                  style={{
                    aspectRatio: i % 2 === 0 ? "1 / 1" : "4 / 5",
                    borderRadius: "16px",
                  }}
                >
                  <Image
                    src={slot.src}
                    alt={slot.label}
                    fill
                    className="object-cover"
                    sizes="25vw"
                  />
                  <div className="absolute inset-0 bg-black/10" />
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

/* ── Slots galerie — à remplacer par vos photos ── */
const gallerySlots = [
  { label: "Photo événement · Magal", src: "/assets/yessal-event-1.jpg" },
  { label: "Photo événement · Gamou", src: "/assets/yessal-event-2.jpg" },
  { label: "Photo événement · Tog Ajumma", src: "/assets/yessal-event-3.jpg" },
  { label: "Photo événement · Rassemblement", src: "/assets/yessal-event-4.jpg" },
  { label: "Photo événement · Ziar", src: "/assets/yessal-event-5.jpg" },
  { label: "Photo événement · Communauté", src: "/assets/yessal-event-6.jpg" },
];

/* ── Toggle dark/light ── */
function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Basculer le thème"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      style={{
        width: "36px",
        height: "36px",
        color: "var(--muted-foreground)",
      }}
    >
      <Sun
        size={16}
        strokeWidth={1.5}
        className="rotate-0 scale-100 transition-transform dark:-rotate-90 dark:scale-0"
      />
      <Moon
        size={16}
        strokeWidth={1.5}
        className="absolute rotate-90 scale-0 transition-transform dark:rotate-0 dark:scale-100"
      />
    </Button>
  );
}
