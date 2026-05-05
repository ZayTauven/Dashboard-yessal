"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:8000";

async function getAuthHeader(): Promise<HeadersInit | undefined> {
  const cookiesList = await cookies();
  const token = cookiesList.get("session-yessal")?.value;
  return token ? { Authorization: `Bearer ${token}` } : undefined;
}

export async function getNews() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/news/posts/`, {
      cache: "no-store",
      headers: await getAuthHeader(),
    });

    if (!res.ok) {
      return { error: "Erreur lors de la récupération des actualités.", data: [] };
    }

    const data = await res.json();
    return { data: Array.isArray(data) ? data : data.results || [] };
  } catch (err) {
    console.error(err);
    return { error: "Erreur de connexion au serveur backend.", data: [] };
  }
}

export async function getNewsPost(slug: string) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/news/posts/${slug}/`, {
      cache: "no-store",
      headers: await getAuthHeader(),
    });

    if (!res.ok) {
      return { error: "Actualité introuvable." };
    }

    return { data: await res.json() };
  } catch (err) {
    return { error: "Erreur de connexion." };
  }
}

export async function addNewsPost(formData: FormData) {
  // We send the FormData directly to support file uploads
  const authHeader = await getAuthHeader();

  try {
    const res = await fetch(`${BACKEND_URL}/api/news/posts/`, {
      method: "POST",
      headers: {
        ...authHeader,
        // Let the browser/Next.js set the correct boundary for FormData
      },
      body: formData,
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return {
        error: (data as { detail?: string }).detail || "Erreur lors de la création de l'article.",
      };
    }

    revalidatePath("/dashboard/news");
    return { success: true, data: await res.json() };
  } catch (err) {
    console.error(err);
    return { error: "Erreur de connexion au serveur." };
  }
}

export async function deleteNewsPost(slug: string) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/news/posts/${slug}/`, {
      method: "DELETE",
      headers: await getAuthHeader(),
    });
    if (!res.ok) return { error: "Suppression échouée." };
    revalidatePath("/dashboard/news");
    return { success: true };
  } catch (err) {
    return { error: "Erreur réseau." };
  }
}

export async function updateNewsPost(idOrSlug: string | number, formData: FormData) {
  const authHeader = await getAuthHeader();
  try {
    const res = await fetch(`${BACKEND_URL}/api/news/posts/${idOrSlug}/`, {
      method: "PATCH",
      headers: { ...authHeader },
      body: formData,
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return { error: data.detail || "Échec de la mise à jour." };
    }

    revalidatePath("/dashboard/news");
    return { success: true, data: await res.json() };
  } catch (err) {
    return { error: "Erreur de connexion." };
  }
}

export async function addGalleryImage(slug: string, formData: FormData) {
  const authHeader = await getAuthHeader();
  try {
    const res = await fetch(`${BACKEND_URL}/api/news/posts/${slug}/gallery/`, {
      method: "POST",
      headers: { ...authHeader },
      body: formData,
    });

    if (!res.ok) return { error: "Échec de l'ajout de l'image." };

    revalidatePath("/dashboard/news");
    return { success: true };
  } catch (err) {
    return { error: "Erreur réseau." };
  }
}
export async function deleteGalleryImage(id: number) {
  const authHeader = await getAuthHeader();
  try {
    const res = await fetch(`${BACKEND_URL}/api/news/gallery/${id}/`, {
      method: "DELETE",
      headers: { ...authHeader },
    });
    if (!res.ok) return { error: "Échec de la suppression de l'image." };
    revalidatePath("/dashboard/news");
    return { success: true };
  } catch (err) {
    return { error: "Erreur réseau." };
  }
}
