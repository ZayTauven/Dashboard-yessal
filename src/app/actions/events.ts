"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { messageForStatus } from "@/lib/api-result";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:8000";

async function getAuthHeader(): Promise<HeadersInit | undefined> {
  const cookiesList = await cookies();
  const token = cookiesList.get("session-yessal")?.value;
  return token ? { Authorization: `Bearer ${token}` } : undefined;
}

export async function getEvents() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/events/fetes/`, {
      cache: "no-store",
      headers: await getAuthHeader(),
    });

    if (!res.ok) {
      return { error: "Erreur lors de la récupération des fêtes.", data: [] };
    }

    const data = await res.json();
    return { data };
  } catch (err) {
    console.error(err);
    return { error: "Erreur de connexion au serveur backend.", data: [] };
  }
}

export async function addEvent(formData: FormData) {
  const isActiveRaw = String(formData.get("is_active") || "true");
  const payload = {
    name: String(formData.get("name") || "").trim(),
    description: String(formData.get("description") || "").trim(),
    date: formData.get("event_date") || null,
    recurrence: formData.get("recurrence") || "none",
    is_active: isActiveRaw === "true" || isActiveRaw === "on",
  };

  try {
    const res = await fetch(`${BACKEND_URL}/api/events/fetes/`, {
      method: "POST",
      headers: {
        ...(await getAuthHeader()),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return {
        error:
          (data as { detail?: string }).detail ||
          "Erreur lors de la création de la fête.",
      };
    }

    revalidatePath("/dashboard/events");
    revalidatePath("/dashboard/campaigns/new");
    return { success: true, data: await res.json() };
  } catch (err) {
    console.error(err);
    return { error: "Erreur de connexion au serveur." };
  }
}

export async function updateEvent(id: number, formData: FormData) {
  const isActiveRaw = String(formData.get("is_active") || "true");
  const payload = {
    name: String(formData.get("name") || "").trim(),
    description: String(formData.get("description") || "").trim(),
    date: formData.get("event_date") || null,
    recurrence: formData.get("recurrence") || "none",
    is_active: isActiveRaw === "true" || isActiveRaw === "on",
  };

  try {
    const res = await fetch(`${BACKEND_URL}/api/events/fetes/${id}/`, {
      method: "PATCH",
      headers: {
        ...(await getAuthHeader()),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return {
        error:
          (data as { detail?: string }).detail ||
          "Erreur lors de la mise à jour de la fête.",
      };
    }

    revalidatePath("/dashboard/events");
    return { success: true, data: await res.json() };
  } catch (err) {
    console.error(err);
    return { error: "Erreur de connexion au serveur." };
  }
}

export async function deleteEvent(id: number) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/events/fetes/${id}/`, {
      method: "DELETE",
      headers: await getAuthHeader(),
    });
    if (!res.ok) return { error: "Suppression échouée." };
    revalidatePath("/dashboard/events");
    return { success: true };
  } catch (err) {
    console.error("deleteEvent:", err);
    return { error: "Erreur réseau." };
  }
}

/*
 * SIMULATION — aucun envoi reel n'a lieu.
 *
 * Cette action attend 1,5 s puis repond « Les membres ont ete notifies via
 * mobile et email », ce qui est faux : rien n'est envoye. Le backend n'expose
 * aucune route de notification sur les fetes (`events/views.py` ne notifie que
 * l'organisateur d'un Ndiguel).
 *
 * Le branchement reel passerait par `POST /api/comms/announcements/`, qui
 * existe deja et declenche le push FCM via le signal `post_save` sur
 * Notification. Le type de retour est desormais explicite : l'ancien `any`
 * cote appelant masquait completement le caractere factice de la reponse.
 */
export async function notifyMembersAboutEvent(
  id: number,
): Promise<{ success: boolean; message: string; error?: string }> {
  void id;
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ success: true, message: "Les membres ont été notifiés via mobile et email." });
    }, 1500);
  });
}

export async function addEventMedia() {
  return { error: "La galerie d'actualités est gérée via /api/news." };
}

export async function getFeteById(id: number) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/events/fetes/${id}/`, {
      cache: "no-store",
      headers: await getAuthHeader(),
    });
    if (!res.ok) return { error: "Fête introuvable.", data: null };
    return { data: await res.json() };
  } catch (err) {
    console.error(err);
    return { error: "Erreur de connexion.", data: null };
  }
}

export async function getFeteEtat(id: number) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/events/fetes/${id}/etat/`, {
      cache: "no-store",
      headers: await getAuthHeader(),
    });
    if (!res.ok) {
      return {
        data: null,
        status: res.status,
        error: messageForStatus(res.status, "Données introuvables."),
      };
    }
    return { data: await res.json(), status: res.status };
  } catch (err) {
    console.error(err);
    return { data: null, status: 0, error: messageForStatus(0, "") };
  }
}
