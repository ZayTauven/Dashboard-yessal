"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { messageForErrors, messageForStatus } from "@/lib/api-result";
import { stripEmptyFiles } from "@/lib/form-data";

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
      return {
        status: res.status,
        error: messageForStatus(res.status, "Actualité introuvable."),
      };
    }

    return { data: await res.json(), status: res.status };
  } catch (err) {
    console.error("getNewsPost:", err);
    return { status: 0, error: messageForStatus(0, "") };
  }
}

export async function addNewsPost(formData: FormData) {
  const authHeader = await getAuthHeader();

  /* `stripEmptyFiles` : un champ fichier laissé vide arrive jusqu'ici sous
     forme de `File` de taille nulle, que le `fetch` de Node renomme en
     traversant — Django y voit alors un téléversement vide et refuse tout
     l'article. Créer une actualité sans bannière était impossible. */
  const body = stripEmptyFiles(formData);

  try {
    const res = await fetch(`${BACKEND_URL}/api/news/posts/`, {
      method: "POST",
      headers: {
        ...authHeader,
        // La frontière multipart est posée par fetch : ne pas fixer
        // Content-Type à la main.
      },
      body,
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      /* `messageForErrors` et non `data.detail` : une erreur de VALIDATION a la
         forme `{"champ": ["message"]}` et n'a pas de `detail`. Le message
         générique masquait donc toujours la vraie cause. */
      return {
        error: messageForErrors(data, "Erreur lors de la création de l'article."),
        status: res.status,
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
    console.error("deleteNewsPost:", err);
    return { error: "Erreur réseau." };
  }
}

export async function updateNewsPost(idOrSlug: string | number, formData: FormData) {
  const authHeader = await getAuthHeader();
  /* Même piège qu'à la création : sans ce nettoyage, enregistrer une
     modification sans TOUCHER à la bannière échouait. */
  const body = stripEmptyFiles(formData);
  try {
    const res = await fetch(`${BACKEND_URL}/api/news/posts/${idOrSlug}/`, {
      method: "PATCH",
      headers: { ...authHeader },
      body,
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return {
        error: messageForErrors(data, "Échec de la mise à jour."),
        status: res.status,
      };
    }

    revalidatePath("/dashboard/news");
    return { success: true, data: await res.json() };
  } catch (err) {
    console.error("updateNewsPost:", err);
    return { error: "Erreur de connexion." };
  }
}

export async function addGalleryImage(slug: string, formData: FormData) {
  const authHeader = await getAuthHeader();
  const body = stripEmptyFiles(formData);
  try {
    const res = await fetch(`${BACKEND_URL}/api/news/posts/${slug}/gallery/`, {
      method: "POST",
      headers: { ...authHeader },
      body,
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return { error: messageForErrors(data, "Échec de l'ajout de l'image.") };
    }

    revalidatePath("/dashboard/news");
    return { success: true };
  } catch (err) {
    console.error("addGalleryImage:", err);
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
    console.error("deleteGalleryImage:", err);
    return { error: "Erreur réseau." };
  }
}
