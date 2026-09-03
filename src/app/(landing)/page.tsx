"use client";

/*
 * ═══════════════════════════════════════════════════════════════════════════
 * Accueil public
 * ═══════════════════════════════════════════════════════════════════════════
 * Repris du patron `pages/Landing` de Vireo : barre flottante, hero en deux
 * colonnes, et une colonne visuelle qui respire.
 *
 * Trois corrections de fond :
 *
 *   · L'écran était figé en `h-screen overflow-hidden` avec un hero
 *     `w-1/2` / `flex-1` SANS point de rupture. Sur téléphone, le texte se
 *     retrouvait donc écrasé sur la moitié de l'écran, à côté d'une galerie
 *     qui prenait l'autre moitié — sur la page d'entrée du produit, dans un
 *     pays où l'essentiel du trafic est mobile. La grille passe en une seule
 *     colonne sous lg, et la galerie disparaît là où elle nuit.
 *
 *   · Les trois « statistiques » — Membres, Daaras, Pays — n'affichaient
 *     AUCUN chiffre : juste une icône et un mot. Une statistique sans nombre
 *     n'est pas une statistique. Elles deviennent ce qu'elles sont réellement :
 *     les trois promesses du produit, formulées comme telles.
 *
 *   · Tout l'écran était peint sur `var(--yessal-violet)` littéral, avec des
 *     ombres `rgba(145,110,231,0.35)`. C'est pourtant la première page où l'on
 *     doit voir la couleur de marque retenue.
 */

import Link from "next/link";
import Image from "next/image";
import { useTheme } from "next-themes";
import {
  Globe,
  Heart,
  HelpCircle,
  LogIn,
  Moon,
  Sun,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { BrandMark } from "@/components/BrandMark";

/* ── Slots galerie ── */
const gallerySlots = [
  { label: "Magal de Touba", src: "/assets/yessal-event-1.jpg" },
  { label: "Gamou", src: "/assets/yessal-event-2.jpg" },
  { label: "Tog Ajumma", src: "/assets/yessal-event-3.jpg" },
  { label: "Rassemblement", src: "/assets/yessal-event-4.jpg" },
  { label: "Ziar", src: "/assets/yessal-event-5.jpg" },
  { label: "Communauté", src: "/assets/yessal-event-6.jpg" },
];

/*
 * Les trois arguments du produit. Ils remplacent les anciennes « statistiques »
 * sans chiffre : mieux vaut une promesse assumée qu'un nombre absent.
 */
const PROMISES: { icon: LucideIcon; title: string; text: string }[] = [
  {
    icon: Users,
    title: "Chaque Daara à sa place",
    text: "Membres, chefs et collecteurs, réunis par structure.",
  },
  {
    icon: Heart,
    title: "Chaque Jëf tracé",
    text: "Du don en espèces au virement, tout est consigné.",
  },
  {
    icon: Globe,
    title: "Depuis partout",
    text: "La diaspora contribue comme si elle était sur place.",
  },
];

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  return (
    <button
      type="button"
      className="ax-btn ax-btn--ghost ax-btn--icon"
      aria-label="Basculer le thème"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
    >
      <Sun
        size={16}
        className="rotate-0 scale-100 transition-transform dark:-rotate-90 dark:scale-0"
        aria-hidden="true"
      />
      <Moon
        size={16}
        className="absolute rotate-90 scale-0 transition-transform dark:rotate-0 dark:scale-100"
        aria-hidden="true"
      />
    </button>
  );
}

export default function LandingPage() {
  return (
    <div className="flex min-h-dvh flex-col">
      {/* ── Barre flottante ── */}
      <header className="sticky top-0 z-50 flex items-center justify-between px-5 py-5 backdrop-blur-sm sm:px-8 lg:px-10">
        <BrandMark href="/" size="sm" showSubtitle={false} />

        <nav className="flex items-center gap-2">
          <ThemeToggle />
          <Link href="/contact" className="ax-btn ax-btn--ghost hidden sm:inline-flex">
            <HelpCircle className="ax-btn__icon" size={15} aria-hidden="true" />
            <span className="ax-btn__label">Support</span>
          </Link>
          <Link href="/login" className="ax-btn ax-btn--primary">
            <LogIn className="ax-btn__icon" size={15} aria-hidden="true" />
            <span className="ax-btn__label">Connexion</span>
          </Link>
        </nav>
      </header>

      {/* ── Hero ── */}
      <main className="grid flex-1 grid-cols-1 lg:grid-cols-2">
        <section className="flex flex-col justify-center px-6 py-16 sm:px-10 lg:px-20 lg:py-24">
          <div className="mb-10">
            <span className="ax-badge ax-badge--soft ax-badge--accent ax-badge--pill">
              <span className="ax-badge__dot" aria-hidden="true" />
              Réseau Yessal Gui · Confrérie Mouride
            </span>
          </div>

          <h1 className="mb-6 text-4xl leading-tight font-light tracking-tight lg:text-5xl">
            Gérez les dons
            <br />
            <span className="ax-text-accent font-normal">de votre Daara</span>
          </h1>

          <p className="ax-text-muted mb-12 max-w-prose text-base leading-relaxed">
            Centralisez les Ndiguels, tracez chaque Jëf et renforcez les liens de
            votre communauté — depuis n&apos;importe où dans le monde.
          </p>

          {/* Les trois promesses, chiffres absents assumés. */}
          <ul className="mb-12 flex flex-col gap-5">
            {PROMISES.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex items-start gap-3">
                <span
                  className="ax-kpi__icon ax-kpi__icon--c1 shrink-0"
                  aria-hidden="true"
                >
                  <Icon />
                </span>
                <span className="flex flex-col">
                  <span className="text-sm font-medium">{title}</span>
                  <span className="ax-text-muted text-sm">{text}</span>
                </span>
              </li>
            ))}
          </ul>

          <div className="flex flex-wrap items-center gap-3">
            <Link href="/login" className="ax-btn ax-btn--primary ax-btn--lg">
              <LogIn className="ax-btn__icon" size={16} aria-hidden="true" />
              <span className="ax-btn__label">Se connecter</span>
            </Link>
            <Link href="/register" className="ax-btn ax-btn--outline ax-btn--lg">
              <span className="ax-btn__label">Demander un accès</span>
            </Link>
          </div>
        </section>

        {/*
          Galerie — masquée sous lg. Sur téléphone, elle disputait la moitié de
          l'écran au texte ; elle n'y apporte rien que le hero ne dise déjà.
        */}
        <section
          className="relative hidden overflow-hidden lg:block"
          aria-hidden="true"
          style={{
            maskImage:
              "linear-gradient(transparent 0%, black 10%, black 90%, transparent 100%)",
            WebkitMaskImage:
              "linear-gradient(transparent 0%, black 10%, black 90%, transparent 100%)",
          }}
        >
          <div className="absolute inset-0 flex justify-center gap-4 px-4 py-4">
            {[0, 1].map((col) => (
              <div
                key={col}
                className="gallery-scroll flex flex-col gap-4"
                /* La seconde colonne démarre décalée, pour éviter deux bandes
                   parfaitement synchrones. */
                style={col === 1 ? { animationDelay: "-15s" } : undefined}
              >
                {[...gallerySlots, ...gallerySlots].map((slot, i) => (
                  <div
                    key={`${col}-${slot.label}-${i}`}
                    className="relative h-56 w-44 shrink-0 overflow-hidden rounded-(--ax-radius-lg)"
                  >
                    <Image
                      src={slot.src}
                      alt=""
                      fill
                      sizes="176px"
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-black/15" />
                    <div className="absolute inset-x-2 bottom-2">
                      <span className="ax-badge ax-badge--sm ax-badge--solid ax-truncate">
                        {slot.label}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
