"use server";

/*
 * La fenêtre de suivi de Sangue Bi, la guide du Kourel (`/api/suivi/`).
 * Lecture seule : la guide voit et annonce, elle ne modifie rien.
 */
import { cookies } from "next/headers";
import type {
  Periode,
  RepartitionPar,
  SuiviDaara,
  SuiviOverview,
  SuiviRepartition,
} from "@/types/suivi";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:8000";

async function getAuthHeader(): Promise<HeadersInit | undefined> {
  const token = (await cookies()).get("session-yessal")?.value;
  return token ? { Authorization: `Bearer ${token}` } : undefined;
}

async function lire<T>(path: string): Promise<{ data?: T; error?: string }> {
  try {
    const res = await fetch(`${BACKEND_URL}${path}`, { cache: "no-store", headers: await getAuthHeader() });
    if (res.status === 403) return { error: "Cette fenêtre est réservée à la guide du Kourel." };
    if (res.status === 404) return { error: "Introuvable." };
    if (!res.ok) return { error: "Le suivi n'a pas pu être chargé." };
    return { data: (await res.json()) as T };
  } catch (err) {
    console.error(`suivi ${path}:`, err);
    return { error: "Serveur injoignable." };
  }
}

export async function getSuivi(periode: Periode) {
  return lire<SuiviOverview>(`/api/suivi/?periode=${periode}`);
}

export async function getRepartition(par: RepartitionPar, periode: Periode) {
  return lire<SuiviRepartition>(`/api/suivi/repartition/?par=${par}&periode=${periode}`);
}

export async function getSuiviDaara(id: number, periode: Periode) {
  return lire<SuiviDaara>(`/api/suivi/daara/${id}/?periode=${periode}`);
}

/** Le canal « Annonces de Sangue Bi », avec le droit d'y publier. */
export async function getGuideChannel(): Promise<{ id: number; canPost: boolean; members: number } | null> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/comms/`, { cache: "no-store", headers: await getAuthHeader() });
    if (!res.ok) return null;
    const raw = await res.json();
    const chats: Array<{ id: number; channel_kind?: string | null; can_post?: boolean; members_count?: number; members?: unknown[] }> =
      Array.isArray(raw) ? raw : raw?.results ?? [];
    const chat = chats.find((c) => c.channel_kind === "guide");
    if (!chat) return null;
    return {
      id: chat.id,
      canPost: Boolean(chat.can_post),
      members: chat.members_count ?? (Array.isArray(chat.members) ? chat.members.length : 0),
    };
  } catch {
    return null;
  }
}
