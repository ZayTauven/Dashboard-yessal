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
    
    const data = await res.json();
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
        ...(await getAuthHeader() as any),
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
