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

export async function getLDDs() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/ldd/`, {
      cache: "no-store",
      headers: await getAuthHeader(),
    });
    if (!res.ok) return { error: "Erreur de récupération des Zones." };
    return { data: await res.json() };
  } catch (err) {
    console.error(err);
    return { error: "Erreur de connexion." };
  }
}

export async function createLDD(payload: { name: string; code: string }) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/ldd/`, {
      method: "POST",
      headers: {
        ...((await getAuthHeader()) as object),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) return { error: "Échec de création de la Zone." };
    revalidatePath("/dashboard/admin/daara");
    return { data: await res.json() };
  } catch (err) {
    return { error: "Erreur serveur." };
  }
}

export async function updateLDD(id: number, payload: { name?: string; code?: string }) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/ldd/${id}/`, {
      method: "PATCH",
      headers: {
        ...((await getAuthHeader()) as object),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) return { error: "Échec de mise à jour de la Zone." };
    revalidatePath("/dashboard/admin/daara");
    return { data: await res.json() };
  } catch (err) {
    return { error: "Erreur serveur." };
  }
}

export async function deleteLDD(id: number) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/ldd/${id}/`, {
      method: "DELETE",
      headers: await getAuthHeader(),
    });
    if (!res.ok) return { error: "Suppression de la Zone impossible (Daaras rattachés ?)." };
    revalidatePath("/dashboard/admin/daara");
    return { success: true };
  } catch (err) {
    return { error: "Erreur réseau." };
  }
}

export async function getDaaras() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/daara/`, {
      cache: "no-store",
      headers: await getAuthHeader(),
    });
    if (!res.ok) return { error: "Erreur de récupération des Daaras." };
    return { data: await res.json() };
  } catch (err) {
    console.error(err);
    return { error: "Erreur de connexion." };
  }
}

export async function createDaara(formData: FormData) {
  const name = formData.get("name") as string;
  const ldd_id = formData.get("ldd_id") as string;
  const description = formData.get("description") as string;

  if (!ldd_id) {
    return { error: "Veuillez sélectionner une LDD." };
  }

  try {
    const res = await fetch(`${BACKEND_URL}/api/daara/`, {
      method: "POST",
      headers: {
        ...((await getAuthHeader()) as object),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name: name?.trim(), ldd_id: parseInt(ldd_id), description, is_active: true }),
    });

    if (!res.ok) {
      const errorData = await res.json();
      return { error: errorData.error || errorData.detail || "Erreur lors de la création." };
    }
    revalidatePath("/dashboard/admin/daara");
    return { data: await res.json() };
  } catch (err) {
    console.error(err);
    return { error: "Problème de communication avec le serveur." };
  }
}

export async function deleteDaara(id: number) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/daara/${id}/`, {
      method: "DELETE",
      headers: await getAuthHeader(),
    });
    if (!res.ok) return { error: "Suppression refusée." };
    return { success: true };
  } catch (err) {
    console.error(err);
    return { error: "Erreur de connexion." };
  }
}

export async function updateDaara(
  id: number,
  payload: {
    name?: string;
    code?: string;
    description?: string;
    is_active?: boolean;
    chef?: number | null;
  },
) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/daara/${id}/`, {
      method: "PATCH",
      headers: {
        ...((await getAuthHeader()) as object),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return {
        error:
          (err as { detail?: string }).detail ||
          "Mise à jour refusée.",
      };
    }
    revalidatePath("/dashboard/admin/daara");
    revalidatePath(`/dashboard/admin/daara/${id}`);
    revalidatePath("/dashboard/daara");
    return { data: await res.json() };
  } catch (err) {
    console.error(err);
    return { error: "Erreur de connexion." };
  }
}

export async function getDaaraById(id: number) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/daara/${id}/`, {
      cache: "no-store",
      headers: await getAuthHeader(),
    });
    if (!res.ok) return { error: "Daara introuvable." };
    return { data: await res.json() };
  } catch (err) {
    console.error(err);
    return { error: "Erreur de connexion." };
  }
}

export async function getDaaraEtat(id: number) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/daara/${id}/etat/`, {
      cache: "no-store",
      headers: await getAuthHeader(),
    });
    if (!res.ok) return { error: "Impossible de charger les détails du Daara." };
    return { data: await res.json() };
  } catch (err) {
    console.error(err);
    return { error: "Erreur de connexion." };
  }
}

export async function importDaaraExcel(formData: FormData) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/daara/import-excel/`, {
      method: "POST",
      headers: await getAuthHeader(),
      body: formData,
    });
    
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return {
        error:
          (err as { error?: string }).error ||
          "Erreur lors de l'importation.",
      };
    }
    revalidatePath("/dashboard/admin/daara");
    return { success: true, data: await res.json() };
  } catch (err) {
    console.error(err);
    return { error: "Erreur de connexion lors de l'importation." };
  }
}
