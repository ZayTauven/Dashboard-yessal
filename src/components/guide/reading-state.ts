"use client";

/*
 * ═══════════════════════════════════════════════════════════════════════════
 * Yessal Guide — ce que le lecteur a déjà lu, et qui il est
 * ═══════════════════════════════════════════════════════════════════════════
 * Deux préférences, toutes deux locales au navigateur : les chapitres marqués
 * comme lus, et le profil choisi (« je suis collecteur »). Rien ne part au
 * serveur — un guide public n'a pas à savoir qui le consulte.
 *
 * Trois précautions, dans cet ordre d'importance :
 *
 *   1. `localStorage` peut LEVER, pas seulement rendre null : navigation
 *      privée, cookies bloqués, quota plein. Chaque accès est enveloppé.
 *
 *   2. La première peinture doit être celle du serveur. Lire le stockage
 *      pendant le rendu ferait diverger le HTML serveur et le HTML client —
 *      l'erreur d'hydratation classique. On lit donc dans un effet, après le
 *      montage, et l'état initial est toujours « rien de lu ».
 *
 *   3. Deux onglets ouverts sur le guide doivent rester d'accord : on écoute
 *      `storage`, que le navigateur émet dans les AUTRES onglets, et un
 *      événement maison pour les composants du même onglet.
 */

import { useCallback, useEffect, useState } from "react";
import type { GuideRole } from "@/lib/guide/manifest";

const READ_KEY = "yg:read";
const ROLE_KEY = "yg:role";
/** Émis dans l'onglet courant ; `storage` ne couvre que les autres. */
const LOCAL_EVENT = "yg:change";

function readRaw(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeRaw(key: string, value: string | null) {
  try {
    if (value === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, value);
  } catch {
    /* Stockage indisponible : la préférence ne survivra pas au rechargement,
       et c'est tout. Rien de ce que fait le guide n'en dépend. */
  }
  window.dispatchEvent(new Event(LOCAL_EVENT));
}

function parseRead(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((v): v is string => typeof v === "string")
      : [];
  } catch {
    return [];
  }
}

/** Abonnement commun aux deux crochets : même onglet et onglets voisins. */
function useStoredValue<T>(key: string, decode: (raw: string | null) => T, empty: T) {
  const [value, setValue] = useState<T>(empty);

  useEffect(() => {
    const sync = () => setValue(decode(readRaw(key)));
    sync();
    window.addEventListener("storage", sync);
    window.addEventListener(LOCAL_EVENT, sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(LOCAL_EVENT, sync);
    };
    // `decode` est une fonction pure déclarée au module : stable par
    // construction, et la réinscrire à chaque rendu rebrancherait les écouteurs
    // pour rien.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return [value, setValue] as const;
}

export function useReadChapters() {
  const [read] = useStoredValue<string[]>(READ_KEY, parseRead, []);

  const toggle = useCallback((slug: string) => {
    const current = parseRead(readRaw(READ_KEY));
    const next = current.includes(slug)
      ? current.filter((s) => s !== slug)
      : [...current, slug];
    writeRaw(READ_KEY, JSON.stringify(next));
  }, []);

  const markRead = useCallback((slug: string) => {
    const current = parseRead(readRaw(READ_KEY));
    if (current.includes(slug)) return;
    writeRaw(READ_KEY, JSON.stringify([...current, slug]));
  }, []);

  const reset = useCallback(() => writeRaw(READ_KEY, null), []);

  return { read, toggle, markRead, reset };
}

const ROLES: GuideRole[] = ["talibe", "chef", "collecteur", "admin"];

function parseRole(raw: string | null): GuideRole | null {
  return raw && (ROLES as string[]).includes(raw) ? (raw as GuideRole) : null;
}

export function useGuideRole() {
  const [role] = useStoredValue<GuideRole | null>(ROLE_KEY, parseRole, null);

  const setRole = useCallback((next: GuideRole | null) => {
    writeRaw(ROLE_KEY, next);
  }, []);

  return { role, setRole };
}
