"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

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
      return { error: "Erreur lors de la récupération des fÃªtes.", data: [] };
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
          "Erreur lors de la création de la fÃªte.",
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
    return { error: "Erreur réseau." };
  }
}

export async function notifyMembersAboutEvent(id: number) {
  // Simulation d'une notification aux membres
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
    if (!res.ok) return { error: "Données introuvables.", data: null };
    return { data: await res.json() };
  } catch (err) {
    console.error(err);
    return { error: "Erreur de connexion.", data: null };
  }
}
