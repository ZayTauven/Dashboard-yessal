"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:8000";

async function getAuthHeader() {
  const cookiesList = await cookies();
  const token = cookiesList.get("session-yessal")?.value;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function getTutelles() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/tutelles/`, {
      cache: 'no-store',
      headers: {
        ...(await getAuthHeader()),
      },
    });

    if (!res.ok) {
      return { error: "Erreur lors de la récupération des tutelles.", data: [] };
    }
    
    const data = await res.json();
    return { data };
  } catch (err) {
    console.error(err);
    return { error: "Erreur de connexion au serveur.", data: [] };
  }
}

export async function addTutelle(formData: FormData) {
  const firstName = formData.get("firstName");
  const lastName = formData.get("lastName");
  const relation = formData.get("relation");

  if (!firstName || !lastName || !relation) {
    return { error: "Veuillez remplir tous les champs." };
  }

  try {
    const res = await fetch(`${BACKEND_URL}/api/tutelles/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(await getAuthHeader()),
      },
      body: JSON.stringify({
        first_name: firstName,
        last_name: lastName,
        relation: relation,
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      return { error: data.detail || "Erreur lors de l'ajout de la tutelle." };
    }

    revalidatePath("/dashboard/tutelles");
    return { success: true };
  } catch (err) {
    console.error(err);
    return { error: "Erreur de connexion au serveur." };
  }
}
