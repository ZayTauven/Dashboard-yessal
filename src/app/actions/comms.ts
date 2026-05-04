"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:8000";

async function getAuthHeader(): Promise<HeadersInit | undefined> {
  const cookiesList = await cookies();
  const token = cookiesList.get("session-yessal")?.value;
  return token ? { Authorization: `Bearer ${token}` } : undefined;
}

export async function getChats() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/comms/`, {
      cache: 'no-store',
      headers: await getAuthHeader(),
    });

    if (!res.ok) {
      return { error: "Erreur lors de la récupération des discussions.", data: [] };
    }
    
    const raw = await res.json();
    const data = Array.isArray(raw) ? raw : raw?.results ?? [];
    return { data };
  } catch (err) {
    console.error(err);
    return { error: "Erreur de connexion au serveur backend.", data: [] };
  }
}

export async function sendMessage(chatId: string, content: string) {
  if (!content.trim()) return { error: "Le message ne peut pas être vide." };

  try {
    const res = await fetch(`${BACKEND_URL}/api/comms/messages/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(await getAuthHeader() as Record<string, string>),
      },
      body: JSON.stringify({
        chat: chatId,
        content,
      }),
    });

    if (!res.ok) {
      return { error: "Impossible d'envoyer le message." };
    }

    revalidatePath("/dashboard/chat");
    return { success: true };
  } catch (err) {
    console.error(err);
    return { error: "Erreur de connexion au serveur backend." };
  }
}

export async function getMessagesForChat(chatId: string) {
  try {
    const res = await fetch(
      `${BACKEND_URL}/api/comms/messages/?chat=${encodeURIComponent(chatId)}`,
      {
        cache: "no-store",
        headers: await getAuthHeader(),
      },
    );
    if (!res.ok) {
      return { error: "Impossible de charger les messages.", data: [] };
    }
    const data = await res.json();
    return { data: Array.isArray(data) ? data : data.results ?? [] };
  } catch (err) {
    console.error(err);
    return { error: "Erreur de connexion.", data: [] };
  }
}

export type ChatInviteMode =
  | "manual"
  | "daara_all"
  | "daara_members"
  | "daara_collectors"
  | "daara_chefs"
  | "global_chefs"
  | "global_collectors";

export async function createChat(payload: {
  name: string;
  daara_id?: number | null;
  invite_mode?: ChatInviteMode;
  preset_daara_id?: number | null;
  manual_user_ids?: number[];
  campaign_id?: number | null;
}) {
  const trimmed = payload.name.trim();
  if (!trimmed) {
    return { error: "Indiquez un nom pour le salon." };
  }
  try {
    const body: Record<string, unknown> = {
      name: trimmed,
      invite_mode: payload.invite_mode ?? "manual",
    };
    if (payload.daara_id != null) body.daara_id = payload.daara_id;
    if (payload.preset_daara_id != null)
      body.preset_daara_id = payload.preset_daara_id;
    if (payload.manual_user_ids?.length)
      body.manual_user_ids = payload.manual_user_ids;
    if (payload.campaign_id != null) body.campaign_id = payload.campaign_id;

    const res = await fetch(`${BACKEND_URL}/api/comms/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(await getAuthHeader() as Record<string, string>),
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return {
        error:
          (err as { detail?: string }).detail ||
          "Impossible de créer le salon.",
      };
    }
    revalidatePath("/dashboard/chat");
    return { success: true, data: await res.json() };
  } catch (err) {
    console.error(err);
    return { error: "Erreur de connexion au serveur backend." };
  }
}
