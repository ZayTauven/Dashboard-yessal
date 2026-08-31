import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { CustomizerProvider } from "@/context/CustomizerContext";
import { AuroraToaster } from "@/components/vireo/AuroraToaster";

/*
 * Typographie — les trois familles du langage Aurora, auto-hébergées.
 * Space Grotesk porte les titres (il a le caractère que Segoe UI n'avait pas),
 * Inter le texte courant, JetBrains Mono tout ce qui s'aligne en colonne :
 * montants FCFA, références de virement, identifiants.
 */
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-space-grotesk",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Yessal Gui — Plateforme de gestion des dons",
    template: "%s | Yessal Gui",
  },
  description:
    "Gérez les Jëfs, les Ndiguels et actualités de votre communauté. Plateforme dédiée à la confrérie.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F6F8FC" },
    { media: "(prefers-color-scheme: dark)", color: "#0A0C11" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

/*
 * Restauration anti-flash des attributs de personnalisation.
 *
 * next-themes injecte déjà son propre script bloquant pour le mode clair/sombre
 * (il pose `class="dark"` et `data-ax-theme="dark"` avant la peinture). Ce
 * script-ci couvre le RESTE du contrat Vireo : accent, orientation du menu,
 * schémas de sidebar/header, largeur, rail replié… Sans lui, la première frame
 * s'affiche avec l'accent par défaut puis saute sur l'accent choisi.
 *
 * Il doit rester la première chose exécutable du <head> et ne jamais lever :
 * un localStorage inaccessible (navigation privée, cookies bloqués) doit
 * simplement donner les valeurs par défaut.
 */
const RESTORE_AX_ATTRS = `
(function () {
  var D = document.documentElement, LS;
  try { LS = window.localStorage; } catch (e) { LS = null; }
  function get(k){ try { return LS && LS.getItem(k); } catch(e){ return null; } }

  try {
    if (LS && get('ax:schema') && get('ax:schema') !== '1') {
      Object.keys(LS).forEach(function(k){ if (k.indexOf('ax:') === 0) LS.removeItem(k); });
    }
    if (LS) LS.setItem('ax:schema', '1');
  } catch(e){}

  /* Accent — 'yessal' est le defaut de la marque, donc sans attribut. */
  var accent = get('ax:accent') || 'yessal';
  if (accent === 'yessal') D.removeAttribute('data-ax-accent');
  else D.setAttribute('data-ax-accent', accent);

  /* Attributs de mise en page : on n'ecrit que les valeurs non-defaut. */
  function setAttr(attr, key, def){
    var v = get(key);
    if (v && v !== def) D.setAttribute(attr, v); else D.removeAttribute(attr);
  }
  setAttr('data-ax-nav',              'ax:nav',              'vertical');
  setAttr('data-ax-shell-style',      'ax:shell-style',      'default');
  setAttr('data-ax-sidebar-behavior', 'ax:sidebar-behavior', 'collapsible');
  setAttr('data-ax-menu',             'ax:menu',             'click');
  setAttr('data-ax-page',             'ax:page',             'regular');
  setAttr('data-ax-width',            'ax:width',            'fluid');
  setAttr('data-ax-header-position',  'ax:header-position',  'fixed');
  setAttr('data-ax-sidebar-position', 'ax:sidebar-position', 'fixed');
  setAttr('data-ax-sidebar',          'ax:sidebar-scheme',   'light');
  setAttr('data-ax-header',           'ax:header-scheme',    'light');
  setAttr('data-ax-sidebar-image',    'ax:sidebar-image',    'none');
  setAttr('data-ax-loader',           'ax:loader',           'on');

  var behavior = get('ax:sidebar-behavior') || 'collapsible';
  if (behavior === 'collapsible' && get('ax:collapsed') === '1') D.setAttribute('data-ax-collapsed', '');
  else D.removeAttribute('data-ax-collapsed');

  /* Couleurs personnalisees : on rejoue la rampe derivee, deterministe. */
  var customAccent = get('ax:accent-custom');
  if (accent === 'custom' && customAccent) {
    D.style.setProperty('--ax-accent', customAccent);
    var h = customAccent.replace('#','');
    var r = parseInt(h.substr(0,2),16), g = parseInt(h.substr(2,2),16), b = parseInt(h.substr(4,2),16);
    var L = (0.2126*r + 0.7152*g + 0.0722*b)/255;
    D.style.setProperty('--ax-on-accent', L > 0.62 ? '#1F1602' : '#FFFFFF');
    D.setAttribute('data-ax-accent','custom');
  }
  var isDark = D.getAttribute('data-ax-theme') === 'dark';
  var bg = get(isDark ? 'ax:bg-custom-dark' : 'ax:bg-custom');
  if (bg) D.style.setProperty('--ax-canvas', bg);
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      suppressHydrationWarning
      className={`${inter.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: RESTORE_AX_ATTRS }} />
      </head>
      <body className="antialiased">
        {/*
          `attribute` est un tableau : shadcn et les pages existantes réagissent
          à `.dark`, tout Vireo réagit à `[data-ax-theme="dark"]`. La clé de
          stockage est celle de Vireo (`ax:theme`, mêmes valeurs), pour que les
          deux systèmes lisent la même préférence.
        */}
        <ThemeProvider
          attribute={["class", "data-ax-theme"]}
          defaultTheme="system"
          enableSystem
          storageKey="ax:theme"
          disableTransitionOnChange
        >
          <CustomizerProvider>
            {children}
            <AuroraToaster />
          </CustomizerProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
