"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:8000";

async function getAuthHeader(): Promise<HeadersInit | undefined> {
  const cookiesList = await cookies();
  const token = cookiesList.get("session-yessal")?.value;
  return token ? { Authorization: `Bearer ${token}` } : undefined;
}

export async function getEvents() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/events/`, {
      cache: 'no-store',
      headers: await getAuthHeader(),
    });

    if (!res.ok) {
      return { error: "Erreur lors de la récupération des événements.", data: [] };
    }
    
    const data = await res.json();
    return { data };
  } catch (err) {
    console.error(err);
    return { error: "Erreur de connexion au serveur backend.", data: [] };
  }
}

export async function addEvent(formData: FormData) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/events/`, {
      method: "POST",
      headers: await getAuthHeader(),
      body: formData, // Send FormData directly for file support
    });

    if (!res.ok) {
      const data = await res.json();
      return { error: data.detail || "Erreur lors de la création de l'événement." };
    }

    revalidatePath("/dashboard/events");
    return { success: true, data: await res.json() };
  } catch (err) {
    console.error(err);
    return { error: "Erreur de connexion au serveur backend (Django joignable ?)." };
  }
}

export async function deleteEvent(id: number) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/events/${id}/`, {
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

export async function addEventMedia(eventId: number, formData: FormData) {
    try {
      const res = await fetch(`${BACKEND_URL}/api/events-media/`, {
        method: "POST",
        headers: await getAuthHeader(),
        body: formData,
      });
      if (!res.ok) return { error: "Échec de l'ajout du média." };
      return { success: true, data: await res.json() };
    } catch (err) {
      return { error: "Erreur réseau." };
    }
}
