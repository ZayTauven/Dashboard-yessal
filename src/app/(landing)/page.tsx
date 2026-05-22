"use client";

import Link from "next/link";
import Image from "next/image";
import { useTheme } from "next-themes";
import { Moon, Sun, LogIn, HelpCircle, Users, Heart, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrandMark } from "@/components/BrandMark";

export default function LandingPage() {
  return (
    <div
      className="h-screen w-full overflow-hidden flex flex-col"
      style={{ background: "var(--background)" }}
    >
      {/* ── Navbar flottante ── */}
      <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-5">
        <BrandMark href="/" size="sm" showSubtitle={false} />
        <nav className="flex items-center gap-2">
          <ThemeToggle />
          <Link href="/contact">
            <Button
              variant="ghost"
              size="sm"
              className="text-sm gap-2 hidden sm:flex"
              style={{ color: "var(--muted-foreground)" }}
            >
              <HelpCircle size={14} strokeWidth={1.5} />
              Support
            </Button>
          </Link>
          <Link href="/login">
            <Button
              size="sm"
              className="text-sm gap-2"
              style={{
                background: "var(--yessal-violet)",
                color: "#ffffff",
                borderRadius: "8px",
              }}
            >
              <LogIn size={14} strokeWidth={1.5} />
              Connexion
            </Button>
          </Link>
        </nav>
      </header>

      {/* ── Hero 50/50 ── */}
      <main className="flex-1 flex overflow-hidden">
        {/* ── Gauche : Texte ── */}
        <section className="w-1/2 h-full flex flex-col justify-center pl-16 pr-8 max-w-2xl">

          {/* Pill badge */}
          <div className="flex items-center mb-8">
            <span
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold tracking-wide"
              style={{
                background: "var(--accent)",
                color: "var(--yessal-violet)",
                border: "1px solid",
                borderColor: "color-mix(in srgb, var(--yessal-violet) 20%, transparent)",
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: "var(--yessal-violet)" }}
              />
              Réseau Yessal Gui · Confrérie Mouride
            </span>
          </div>

          {/* Headline */}
          <h1
            className="text-5xl mb-5"
            style={{
              fontWeight: 300,
              lineHeight: 1.15,
              letterSpacing: "-0.03em",
              color: "var(--foreground)",
            }}
          >
            Gérez les dons{" "}
            <br />
            <span style={{ color: "var(--yessal-violet)", fontWeight: 400 }}>
              de votre Daara
            </span>
          </h1>

          <p
            className="text-base mb-10 leading-relaxed"
            style={{ color: "var(--muted-foreground)", maxWidth: "400px" }}
          >
            Centralisez les Ndiguels, tracez chaque Jëfs et renforcez
            les liens de votre communauté — depuis n&apos;importe où dans le monde.
          </p>

          {/* Stats rapides */}
          <div className="flex items-center gap-6 mb-10">
            <Stat icon={Users} label="Membres" />
            <div style={{ width: "1px", height: "28px", background: "var(--border)" }} />
            <Stat icon={Heart} label="Daaras" />
            <div style={{ width: "1px", height: "28px", background: "var(--border)" }} />
            <Stat icon={Globe} label="Pays" />
          </div>

          {/* CTAs */}
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button
                size="lg"
                style={{
                  background: "var(--yessal-violet)",
                  color: "#ffffff",
                  borderRadius: "10px",
                  padding: "0 28px",
                  height: "48px",
                  fontSize: "15px",
                  fontWeight: 500,
                  boxShadow: "0 4px 16px rgba(145,110,231,0.35)",
                }}
              >
                <LogIn size={15} strokeWidth={1.5} />
                Se connecter
              </Button>
            </Link>
            <Link href="/contact">
              <Button
                variant="ghost"
                size="lg"
                style={{
                  borderRadius: "10px",
                  height: "48px",
                  fontSize: "15px",
                  color: "var(--muted-foreground)",
                  border: "1px solid var(--border)",
                }}
              >
                Contacter le support
              </Button>
            </Link>
          </div>
        </section>

        {/* ── Droite : Galerie défilante ── */}
        <section
          className="flex-1 h-full relative overflow-hidden"
          style={{
            maskImage:
              "linear-gradient(transparent 0%, black 10%, black 90%, transparent 100%)",
            WebkitMaskImage:
              "linear-gradient(transparent 0%, black 10%, black 90%, transparent 100%)",
          }}
        >
          {/* Gradient overlay gauche pour transition douce */}
          <div
            className="absolute inset-y-0 left-0 w-16 z-10 pointer-events-none"
            style={{
              background:
                "linear-gradient(to right, var(--background), transparent)",
            }}
          />

          <div className="absolute inset-0 flex gap-4 px-4 py-4 justify-center pointer-events-none">
            {/* Colonne 1 */}
            <div
              className="gallery-scroll flex flex-col gap-4"
              style={{ width: "48%", marginTop: "-8vh" }}
            >
              {gallerySlots.concat(gallerySlots).map((slot, i) => (
                <div
                  key={`col1-${i}`}
                  className="relative flex-shrink-0 overflow-hidden"
                  style={{
                    aspectRatio: i % 2 === 0 ? "4 / 5" : "1 / 1",
                    borderRadius: "14px",
                  }}
                >
                  <Image
                    src={slot.src}
                    alt={slot.label}
                    fill
                    className="object-cover"
                    sizes="22vw"
                  />
                  <div className="absolute inset-0 bg-black/15" />
                  {/* Label flottant */}
                  <div className="absolute bottom-2 left-2 right-2">
                    <span
                      className="inline-block text-[10px] font-medium px-2 py-0.5 rounded-full truncate"
                      style={{
                        background: "rgba(0,0,0,0.45)",
                        color: "rgba(255,255,255,0.9)",
                        backdropFilter: "blur(4px)",
                      }}
                    >
                      {slot.label}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Colonne 2 (décalée) */}
            <div
              className="gallery-scroll flex flex-col gap-4"
              style={{ width: "48%", marginTop: "8vh" }}
            >
              {[...gallerySlots].reverse().concat([...gallerySlots].reverse()).map((slot, i) => (
                <div
                  key={`col2-${i}`}
                  className="relative flex-shrink-0 overflow-hidden"
                  style={{
                    aspectRatio: i % 2 === 0 ? "1 / 1" : "4 / 5",
                    borderRadius: "14px",
                  }}
                >
                  <Image
                    src={slot.src}
                    alt={slot.label}
                    fill
                    className="object-cover"
                    sizes="22vw"
                  />
                  <div className="absolute inset-0 bg-black/15" />
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

/* ── Composant stat ── */
function Stat({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <Icon
        size={14}
        strokeWidth={1.5}
        style={{ color: "var(--yessal-violet)", opacity: 0.7 }}
      />
      <span className="text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>
        {label}
      </span>
    </div>
  );
}

/* ── Slots galerie ── */
const gallerySlots = [
  { label: "Magal de Touba", src: "/assets/yessal-event-1.jpg" },
  { label: "Gamou", src: "/assets/yessal-event-2.jpg" },
  { label: "Tog Ajumma", src: "/assets/yessal-event-3.jpg" },
  { label: "Rassemblement", src: "/assets/yessal-event-4.jpg" },
  { label: "Ziar", src: "/assets/yessal-event-5.jpg" },
  { label: "Communauté", src: "/assets/yessal-event-6.jpg" },
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
      style={{ width: "36px", height: "36px", color: "var(--muted-foreground)" }}
    >
      <Sun
        size={15}
        strokeWidth={1.5}
        className="rotate-0 scale-100 transition-transform dark:-rotate-90 dark:scale-0"
      />
      <Moon
        size={15}
        strokeWidth={1.5}
        className="absolute rotate-90 scale-0 transition-transform dark:rotate-0 dark:scale-100"
      />
    </Button>
  );
}
