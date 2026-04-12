"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:8000";

async function getAuthHeader(): Promise<HeadersInit | undefined> {
  const cookiesList = await cookies();
  const token = cookiesList.get("session-yessal")?.value;
  return token ? { Authorization: `Bearer ${token}` } : undefined;
}

export async function getAnnouncements() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/comms/announcements/`, {
      cache: 'no-store',
      headers: await getAuthHeader(),
    });
    if (!res.ok) return { error: "Erreur lors de la récupération des annonces." };
    return { data: await res.json() };
  } catch (err) {
    return { error: "Erreur de connexion." };
  }
}

export async function createAnnouncement(payload: any) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/comms/announcements/`, {
      method: "POST",
      headers: {
        ...(await getAuthHeader()),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) return { error: "Échec de création de l'annonce." };
    revalidatePath("/dashboard");
    return { data: await res.json() };
  } catch (err) {
    return { error: "Erreur réseau." };
  }
}

export async function deleteAnnouncement(id: number) {
    try {
        const res = await fetch(`${BACKEND_URL}/api/comms/announcements/${id}/`, {
            method: "DELETE",
            headers: await getAuthHeader(),
        });
        if (!res.ok) return { error: "Échec de suppression." };
        revalidatePath("/dashboard");
        return { success: true };
    } catch (err) {
        return { error: "Erreur réseau." };
    }
}
