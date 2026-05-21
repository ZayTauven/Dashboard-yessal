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

export async function sendChatMessage(formData: FormData) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/comms/messages/`, {
      method: "POST",
      headers: {
        ...(await getAuthHeader() as Record<string, string>),
      },
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { error: err.detail || "Impossible d'envoyer le message." };
    }

    revalidatePath("/dashboard/chat");
    return { success: true, data: await res.json() };
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

export async function deleteMessage(messageId: number) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/comms/messages/${messageId}/`, {
      method: "DELETE",
      headers: await getAuthHeader(),
    });
    if (!res.ok) {
      return { error: "Impossible de supprimer le message." };
    }
    revalidatePath("/dashboard/chat");
    return { success: true };
  } catch (err) {
    console.error(err);
    return { error: "Erreur de connexion au serveur backend." };
  }
}

export async function toggleMessageReaction(messageId: number, emoji: string) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/comms/messages/${messageId}/react/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(await getAuthHeader() as Record<string, string>),
      },
      body: JSON.stringify({ emoji }),
    });
    if (!res.ok) {
      return { error: "Impossible d'ajouter la réaction." };
    }
    return { success: true, data: await res.json() };
  } catch (err) {
    console.error(err);
    return { error: "Erreur de connexion au serveur backend." };
  }
}

export async function markChatAsRead(chatId: string) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/comms/${chatId}/read/`, {
      method: "POST",
      headers: await getAuthHeader(),
    });
    if (!res.ok) {
      return { error: "Erreur lors du marquage comme lu." };
    }
    return { success: true };
  } catch (err) {
    console.error(err);
    return { error: "Erreur de connexion." };
  }
}

export async function getChatMembers(chatId: string) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/comms/${chatId}/members/`, {
      cache: "no-store",
      headers: await getAuthHeader(),
    });
    if (!res.ok) {
      return { error: "Impossible de charger les membres.", data: [] };
    }
    return { data: await res.json() };
  } catch (err) {
    console.error(err);
    return { error: "Erreur de connexion.", data: [] };
  }
}

export async function searchMembers(query: string) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/comms/search-members/?q=${encodeURIComponent(query)}`, {
      cache: "no-store",
      headers: await getAuthHeader(),
    });
    if (!res.ok) {
      return { error: "Erreur lors de la recherche.", data: [] };
    }
    return { data: await res.json() };
  } catch (err) {
    console.error(err);
    return { error: "Erreur de connexion.", data: [] };
  }
}

export async function getInvitations() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/comms/invitations/`, {
      cache: "no-store",
      headers: await getAuthHeader(),
    });
    if (!res.ok) {
      return { error: "Erreur lors du chargement des invitations.", data: [] };
    }
    const raw = await res.json();
    return { data: Array.isArray(raw) ? raw : raw?.results ?? [] };
  } catch (err) {
    console.error(err);
    return { error: "Erreur de connexion.", data: [] };
  }
}

export async function createInvitation(recipientId: number) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/comms/invitations/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(await getAuthHeader() as Record<string, string>),
      },
      body: JSON.stringify({ recipient: recipientId }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { error: err.detail || (Array.isArray(err) ? err[0] : "Impossible d'envoyer l'invitation.") };
    }
    return { success: true, data: await res.json() };
  } catch (err) {
    console.error(err);
    return { error: "Erreur de connexion." };
  }
}

export async function respondToInvitation(invitationId: number, accept: boolean) {
  try {
    const endpoint = accept ? 'accept' : 'decline';
    const res = await fetch(`${BACKEND_URL}/api/comms/invitations/${invitationId}/${endpoint}/`, {
      method: "POST",
      headers: await getAuthHeader(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { error: err.detail || "Action impossible." };
    }
    revalidatePath("/dashboard/chat");
    return { success: true, data: await res.json() };
  } catch (err) {
    console.error(err);
    return { error: "Erreur de connexion." };
  }
}

export async function getMessagingPreferences() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/comms/preferences/`, {
      cache: "no-store",
      headers: await getAuthHeader(),
    });
    if (!res.ok) {
      return { error: "Impossible de charger les préférences.", data: null };
    }
    return { data: await res.json() };
  } catch (err) {
    console.error(err);
    return { error: "Erreur de connexion.", data: null };
  }
}

export async function updateMessagingPreferences(payload: any) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/comms/preferences/`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...(await getAuthHeader() as Record<string, string>),
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { error: err.detail || "Impossible de sauvegarder les préférences." };
    }
    return { success: true, data: await res.json() };
  } catch (err) {
    console.error(err);
    return { error: "Erreur de connexion." };
  }
}

export async function getPilotageConfig(daaraId?: number) {
  try {
    const url = daaraId 
      ? `${BACKEND_URL}/api/comms/pilotage/?daara_id=${daaraId}` 
      : `${BACKEND_URL}/api/comms/pilotage/`;
    const res = await fetch(url, {
      cache: "no-store",
      headers: await getAuthHeader(),
    });
    if (!res.ok) {
      return { error: "Impossible de charger le pilotage.", data: null };
    }
    return { data: await res.json() };
  } catch (err) {
    console.error(err);
    return { error: "Erreur de connexion.", data: null };
  }
}

export async function updatePilotageConfig(payload: any) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/comms/pilotage/`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...(await getAuthHeader() as Record<string, string>),
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { error: err.detail || "Action impossible." };
    }
    return { success: true, data: await res.json() };
  } catch (err) {
    console.error(err);
    return { error: "Erreur de connexion." };
  }
}

export async function getPusherAuthSignature(channelName: string, socketId: string) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/comms/pusher/auth/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(await getAuthHeader() as Record<string, string>),
      },
      body: JSON.stringify({ channel_name: channelName, socket_id: socketId }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { error: err.detail || "Authentification Pusher impossible." };
    }
    return await res.json();
  } catch (err) {
    console.error(err);
    return { error: "Erreur de connexion au serveur d'authentification." };
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
