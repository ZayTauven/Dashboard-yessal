"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:8000";

async function getAuthHeader() {
  const cookiesList = await cookies();
  const token = cookiesList.get("session-yessal")?.value;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function getEvents() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/events/`, {
      cache: 'no-store',
      headers: {
        ...(await getAuthHeader()),
      },
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
  const name = formData.get("name");
  const description = formData.get("description");
  const eventDate = formData.get("eventDate");
  const recurrence = formData.get("recurrence");

  if (!name) {
    return { error: "Le nom de l'événement est requis." };
  }

  try {
    const res = await fetch(`${BACKEND_URL}/api/events/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(await getAuthHeader()),
      },
      body: JSON.stringify({
        name,
        description,
        event_date: eventDate || null,
        recurrence: recurrence || 'none',
        is_date_fixed: !!eventDate,
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      return { error: data.detail || "Erreur lors de la création de l'événement." };
    }

    revalidatePath("/dashboard/events");
    return { success: true };
  } catch (err) {
    console.error(err);
    return { error: "Erreur de connexion au serveur backend (Django joignable ?)." };
  }
}
