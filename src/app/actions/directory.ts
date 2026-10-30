"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { messageForErrors } from "@/lib/api-result";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:8000";

async function getAuthHeader(): Promise<HeadersInit | undefined> {
  const cookiesList = await cookies();
  const token = cookiesList.get("session-yessal")?.value;
  return token ? { Authorization: `Bearer ${token}` } : undefined;
}

/**
 * `messagerie` : la liste de choix des salons. Pour un admin, le backend y
 * ajoute les autres admins et la guide, absents de l'annuaire de la communauté.
 */
export async function getDirectoryUsers(options: { messagerie?: boolean } = {}) {
  try {
    const query = options.messagerie ? "?messagerie=1" : "";
    const res = await fetch(`${BACKEND_URL}/api/directory/users/${query}`, {
      cache: "no-store",
      headers: await getAuthHeader(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return {
        error:
          messageForErrors(err, "Impossible de charger l’annuaire."),
        data: [],
      };
    }
    const data = await res.json();
    return { data: Array.isArray(data) ? data : data.results ?? [] };
  } catch (e) {
    console.error(e);
    return { error: "Erreur de connexion au serveur.", data: [] };
  }
}

export async function promoteUserToCollector(userId: number) {
  try {
    const res = await fetch(
      `${BACKEND_URL}/api/directory/users/${userId}/promote-collector/`,
      {
        method: "POST",
        headers: await getAuthHeader(),
      },
    );
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return {
        error: messageForErrors(err, "Action refusée."),
      };
    }
    revalidatePath("/dashboard/members");
    return { success: true, data: await res.json() };
  } catch (e) {
    console.error(e);
    return { error: "Erreur de connexion au serveur." };
  }
}
