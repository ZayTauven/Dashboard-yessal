'use client';
/*
 * Vireo Next.js — Customizer / theme state provider.
 *
 * Single source of UI truth for the theme attribute contract. It mirrors the
 * current <html> data-ax-* attributes into React state and exposes setters that
 * call the pure lib/theme mutators (which set the attribute + persist the ax:
 * key + dispatch ax:change). The anti-flash IIFE in app/layout.tsx <head> has
 * already painted the correct first frame; this provider re-reads it AFTER mount
 * (useEffect) so the initial server/client render agrees, then keeps the
 * controls in sync on every ax:change.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useTheme } from 'next-themes';
import * as theme from '@/lib/vireo/theme';
import * as store from '@/lib/vireo/storage';

export interface CustomizerState {
  mode: string; // light | dark | system
  themeResolved: string; // light | dark (actual painted)
  dir: string; // ltr | rtl
  lang: string;
  accent: string;
  customAccent: string;
  recentAccents: string[];
  nav: string;
  shellStyle: string;
  sidebarBehavior: string;
  menu: string;
  page: string;
  width: string;
  headerPos: string;
  sidebarPos: string;
  sidebarScheme: string;
  headerScheme: string;
  sidebarImage: string;
  loader: string;
  collapsed: boolean;
  bgLowContrast: boolean;
}

export interface CustomizerApi extends CustomizerState {
  setMode: (m: string) => void;
  setDir: (d: string) => void;
  setLang: (l: string) => void;
  setAccent: (a: string) => void;
  setCustomAccent: (hex: string) => void;
  setCustomBg: (hex: string) => void;
  setReg: (name: string, value: string) => void;
  toggleTheme: () => void;
  toggleCollapsed: () => void;
  reset: () => void;
  copyConfig: () => void;
}

/* Deterministic state for the server/first-client render. The anti-flash IIFE
   has already set the correct <html> attributes before paint, but React must
   render the SAME tree on server and on first client pass to avoid a hydration
   mismatch — so we start from canonical defaults and re-`read()` the real DOM in
   a mount effect (see CustomizerProvider). */
const SSR_STATE: CustomizerState = {
  mode: 'system',
  themeResolved: 'light',
  dir: 'ltr',
  lang: 'EN',
  accent: 'yessal',
  customAccent: '',
  recentAccents: [],
  nav: 'vertical',
  shellStyle: 'default',
  sidebarBehavior: 'collapsible',
  menu: 'click',
  page: 'regular',
  width: 'fluid',
  headerPos: 'fixed',
  sidebarPos: 'fixed',
  sidebarScheme: 'light',
  headerScheme: 'light',
  sidebarImage: 'none',
  loader: 'on',
  collapsed: false,
  bgLowContrast: false,
};

function read(): CustomizerState {
  if (typeof document === 'undefined') return SSR_STATE;
  const D = document.documentElement;
  return {
    mode: theme.currentValueOf('mode'),
    themeResolved: D.getAttribute('data-ax-theme') === 'dark' ? 'dark' : 'light',
    dir: theme.currentValueOf('dir'),
    lang: theme.currentValueOf('lang'),
    accent: theme.currentValueOf('accent'),
    customAccent: store.get('ax:accent-custom') || '',
    recentAccents: theme.recentSwatches(),
    nav: theme.currentValueOf('nav'),
    shellStyle: theme.currentValueOf('shell-style'),
    sidebarBehavior: theme.currentValueOf('sidebar-behavior'),
    menu: theme.currentValueOf('menu'),
    page: theme.currentValueOf('page'),
    width: theme.currentValueOf('width'),
    headerPos: theme.currentValueOf('header-position'),
    sidebarPos: theme.currentValueOf('sidebar-position'),
    sidebarScheme: theme.currentValueOf('sidebar-scheme'),
    headerScheme: theme.currentValueOf('header-scheme'),
    sidebarImage: theme.currentValueOf('sidebar-image'),
    loader: theme.currentValueOf('loader'),
    collapsed: theme.isCollapsed(),
    bgLowContrast: false,
  };
}

const Ctx = createContext<CustomizerApi | null>(null);

export function CustomizerProvider({ children }: { children: ReactNode }) {
  // Start from the SSR-safe default so server and first-client render match,
  // then read the real <html> attributes (set by the anti-flash IIFE) on mount.
  const [state, setState] = useState<CustomizerState>(SSR_STATE);
  const sync = useCallback(() => setState(read()), []);

  /*
   * Le mode clair/sombre reste la propriété de next-themes, pas de Vireo.
   * Les deux écrivent la même clé (`ax:theme`) avec le même vocabulaire
   * (light | dark | system) et next-themes appose `class="dark"` ET
   * `data-ax-theme="dark"` — donc la lecture de Vireo reste juste. Ce qu'il
   * faut éviter, c'est que le Customizer écrive l'attribut dans le dos de
   * next-themes : son état React resterait périmé et le <Navbar>, qui lit
   * useTheme(), afficherait la mauvaise icône. On délègue donc l'écriture.
   */
  const { theme: ntTheme, resolvedTheme, setTheme } = useTheme();

  /*
   * next-themes applique `data-ax-theme` via un effet React, donc APRÈS le
   * retour de setTheme(). Émettre `ax:change` immédiatement ferait relire aux
   * graphiques la palette de l'ancien thème — ils resteraient sombres sur fond
   * clair jusqu'au prochain rendu. On attend donc la frame suivante, une fois
   * l'attribut posé et les variables CSS résolues.
   */
  const emitAfterPaint = useCallback(() => {
    requestAnimationFrame(() => theme.emitChange('theme'));
  }, []);

  // Mount: pull the real attribute values + wire listeners. Re-sync on ax:change.
  useEffect(() => {
    sync();
    theme.listenSystem();
    const onChange = () => sync();
    document.addEventListener('ax:change', onChange);
    return () => document.removeEventListener('ax:change', onChange);
  }, [sync]);

  const api = useMemo<CustomizerApi>(
    () => ({
      ...state,
      mode: ntTheme ?? state.mode,
      themeResolved: resolvedTheme ?? state.themeResolved,
      setMode: (m) => {
        setTheme(m);
        // Les graphiques et tout ce qui écoute ax:change doivent se repeindre.
        emitAfterPaint();
      },
      setDir: (d) => {
        theme.setDir(d);
        sync();
      },
      setLang: (l) => {
        theme.setLang(l);
        sync();
      },
      setAccent: (a) => {
        theme.setAccent(a);
        sync();
      },
      setCustomAccent: (hex) => {
        const low = theme.isLowContrast(hex);
        theme.setCustomAccent(hex);
        setState((s) => ({ ...read(), bgLowContrast: low ? s.bgLowContrast : s.bgLowContrast }));
      },
      setCustomBg: (hex) => {
        const low = theme.setCustomBg(hex);
        setState({ ...read(), bgLowContrast: low });
      },
      setReg: (name, value) => {
        theme.setByName(name, value);
        sync();
      },
      toggleTheme: () => {
        setTheme((resolvedTheme ?? 'light') === 'dark' ? 'light' : 'dark');
        emitAfterPaint();
      },
      toggleCollapsed: () => {
        theme.toggleCollapsed();
        sync();
      },
      reset: () => {
        theme.reset();
        setState({ ...read(), bgLowContrast: false });
      },
      copyConfig: () => {
        theme.copyConfig();
      },
    }),
    [state, sync, ntTheme, resolvedTheme, setTheme, emitAfterPaint],
  );

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function useCustomizer(): CustomizerApi {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useCustomizer must be used within CustomizerProvider');
  return ctx;
}
