"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:8000";

async function getAuthHeader(): Promise<HeadersInit | undefined> {
  const cookiesList = await cookies();
  const token = cookiesList.get("session-yessal")?.value;
  return token ? { Authorization: `Bearer ${token}` } : undefined;
}

export async function getCampaigns() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/events/campaigns/`, {
      cache: 'no-store',
      headers: await getAuthHeader(),
    });

    if (!res.ok) {
      return { error: "Erreur lors de la récupération des campagnes.", data: [] };
    }
    
    const data = await res.json();
    return { data };
  } catch (err) {
    console.error(err);
    return { error: "Erreur de connexion au serveur backend.", data: [] };
  }
}

export async function addCampaign(formData: FormData) {
  const name = formData.get("name");
  const description = formData.get("description");
  const goalAmount = formData.get("goalAmount");
  const deadline = formData.get("deadline");
  const eventId = formData.get("eventId");

  if (!name || !goalAmount || !deadline) {
    return { error: "Veuillez remplir tous les champs obligatoires." };
  }

  try {
    const res = await fetch(`${BACKEND_URL}/api/events/campaigns/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(await getAuthHeader() as any),
      },
      body: JSON.stringify({
        name,
        description,
        goal_amount: goalAmount,
        deadline,
        event: eventId || null,
        status: 'active',
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      return { error: data.detail || "Erreur lors de la création de la campagne." };
    }

    revalidatePath("/dashboard/campaigns");
    return { success: true };
  } catch (err) {
    console.error(err);
    return { error: "Erreur de connexion au serveur backend." };
  }
}
