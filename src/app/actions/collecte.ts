"use server";

/*
 * Collecte en espèces : zones des collecteurs, « Je m'en charge », et
 * interrupteur général. Le serveur fait foi sur chaque règle ; ces actions ne
 * font que relayer, en rendant les erreurs DRF lisibles.
 */

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { messageForErrors } from "@/lib/api-result";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:8000";

async function authHeaders(): Promise<Record<string, string>> {
  const token = (await cookies()).get("session-yessal")?.value;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function get<T>(path: string, fallback: string): Promise<{ data?: T; error?: string }> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/${path}`, {
      cache: "no-store",
      headers: await authHeaders(),
    });
    if (!res.ok) return { error: fallback };
    return { data: (await res.json()) as T };
  } catch (err) {
    console.error(err);
    return { error: "Erreur de connexion au serveur." };
  }
}

async function post<T>(path: string, body: unknown, fallback: string): Promise<{ data?: T; error?: string }> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(await authHeaders()) },
      body: JSON.stringify(body ?? {}),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { error: messageForErrors(data, fallback) };
    return { data: data as T };
  } catch (err) {
    console.error(err);
    return { error: "Erreur de connexion au serveur." };
  }
}

/* ── Disponibilité, côté membre et collecteur ───────────────────────────── */

export type CollecteStatus = {
  /** L'administration n'a pas suspendu la collecte en espèces. */
  active: boolean;
  /** L'appelant peut DEMANDER une collecte : un collecteur couvre sa zone. */
  disponible: boolean;
  raison: "suspendue" | "hors_zone" | null;
};

export async function getCollecteStatus() {
  return get<CollecteStatus>("contributions/collecte/", "Disponibilité de la collecte inconnue.");
}

/* ── « Je m'en charge » ─────────────────────────────────────────────────── */

export async function claimDonation(id: number) {
  const res = await post(`contributions/${id}/claim/`, {}, "La prise en charge a échoué.");
  revalidatePath("/dashboard/collect");
  return res;
}

export async function releaseDonation(id: number) {
  const res = await post(`contributions/${id}/release/`, {}, "La demande n'a pas pu être relâchée.");
  revalidatePath("/dashboard/collect");
  return res;
}

/* ── Gestion des collecteurs (administration) ───────────────────────────── */

export type Zone = { id: number; code: string; nom: string };
/* `geographique: false` : INDIVIDUELS et DEFAULT, qui ne sont pas des territoires à couvrir. */
export type ZoneCouverture = Zone & { collecteurs: number; geographique?: boolean };
export type Collecteur = {
  id: number;
  nom: string;
  telephone?: string | null;
  statut: string;
  daara?: string | null;
  ldd?: string | null;
  zones: Zone[];
  caisse: string;
};

export async function listCollecteurs() {
  return get<Collecteur[]>("collecteurs/", "Impossible de charger les collecteurs.");
}

export async function getCouverture() {
  return get<ZoneCouverture[]>("collecteurs/couverture/", "Impossible de charger les zones.");
}

export async function setCollecteurZones(id: number, zones: number[]) {
  return post<{ id: number; zones: Zone[] }>(
    `collecteurs/${id}/zones/`,
    { zones },
    "Les zones n'ont pas pu être enregistrées.",
  );
}

/* ── Interrupteur de la collecte en espèces ─────────────────────────────── */

export async function requestCollecteCode(active: boolean) {
  /* `envoye: false` en DEBUG seulement : le code est dans le journal du serveur. */
  return post<{ detail: string; envoye?: boolean }>(
    "settings/pilotage/collecte/code/",
    { active },
    "Le code n'a pas pu être envoyé.",
  );
}

export async function toggleCollecte(active: boolean, code: string) {
  const res = await post<{ collecte_physique_active: boolean; demandes_annulees: number }>(
    "settings/pilotage/collecte/",
    { active, code, confirme: true },
    "L'opération a échoué.",
  );
  revalidatePath("/dashboard", "layout");
  return res;
}
