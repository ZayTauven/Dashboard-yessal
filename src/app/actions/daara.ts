"use server";

import { cookies } from "next/headers";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:8000";

async function getAuthHeader(): Promise<HeadersInit | undefined> {
  const cookiesList = await cookies();
  const token = cookiesList.get("session-yessal")?.value;
  return token ? { Authorization: `Bearer ${token}` } : undefined;
}

export async function getMyDaara() {
  try {
    const profileRes = await fetch(`${BACKEND_URL}/api/profile/`, {
      cache: "no-store",
      headers: await getAuthHeader(),
    });

    if (!profileRes.ok) return { error: "Impossible de lire le profil." };
    const profile = await profileRes.json();

    if (!profile.daara) {
      return { error: "Vous n'êtes rattaché à aucun Daara." };
    }

    return { data: profile.daara };
  } catch (err) {
    console.error(err);
    return { error: "Erreur de connexion au serveur." };
  }
}

export async function getDaaras() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/daara/`, {
      cache: 'no-store',
      headers: await getAuthHeader(),
    });
    if (!res.ok) return { error: "Erreur de récupération des Daaras." };
    return { data: await res.json() };
  } catch (err) {
    return { error: "Erreur de connexion." };
  }
}

export async function createDaara(formData: FormData) {
  const name = formData.get("name") as string;
  const code = formData.get("code") as string;
  const description = formData.get("description") as string;

  try {
    const res = await fetch(`${BACKEND_URL}/api/daara/`, {
      method: "POST",
      headers: {
        ...(await getAuthHeader() as object),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name, code, description, is_active: true }),
    });

    if (!res.ok) {
        const errorData = await res.json();
        return { error: errorData.code?.[0] || "Erreur lors de la création." };
    }
    return { data: await res.json() };
  } catch (err) {
    return { error: "Problème de communication avec le serveur." };
  }
}

export async function deleteDaara(id: number) {
    try {
        const res = await fetch(`${BACKEND_URL}/api/daara/${id}/`, {
            method: 'DELETE',
            headers: await getAuthHeader(),
        });
        if (!res.ok) return { error: "Suppression refusée." };
        return { success: true };
    } catch (err) {
        return { error: "Erreur de connexion." };
    }
}
