"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:8000";

async function getAuthHeader(): Promise<HeadersInit | undefined> {
  const cookiesList = await cookies();
  const token = cookiesList.get("session-yessal")?.value;
  return token ? { Authorization: `Bearer ${token}` } : undefined;
}

export async function getDonations() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/contributions/`, {
      cache: 'no-store',
      headers: await getAuthHeader(),
    });

    if (!res.ok) {
      return { error: "Erreur lors de la récupération des dons.", data: [] };
    }
    
    const data = await res.json();
    return { data };
  } catch (err) {
    console.error(err);
    return { error: "Erreur de connexion au serveur backend (Django joignable ?).", data: [] };
  }
}

export async function makeDonation(formData: FormData) {
  const campaignId = formData.get("campaignId");
  const amount = formData.get("amount");
  const beneficiaryId = formData.get("beneficiaryId");
  const paymentMethod = formData.get("paymentMethod");

  if (!campaignId || !amount || !paymentMethod) {
    return { error: "Informations de paiement manquantes." };
  }

  try {
    const res = await fetch(`${BACKEND_URL}/api/contributions/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(await getAuthHeader() as any),
      },
      body: JSON.stringify({
        campaign: campaignId,
        amount,
        beneficiary: beneficiaryId || null,
        payment_method: paymentMethod,
        payment_status: 'confirmed', // Simulation de succès pour ce sprint
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      return { error: data.detail || "Le paiement a échoué côté serveur." };
    }

    revalidatePath("/dashboard/donations");
    revalidatePath("/dashboard/campaigns");
    return { success: true };
  } catch (err) {
    console.error(err);
    return { error: "Erreur de connexion au serveur backend." };
  }
}
