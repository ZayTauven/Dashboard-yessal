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

export async function getDonations() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/contributions/`, {
      cache: "no-store",
      headers: await getAuthHeader(),
    });

    if (!res.ok) {
      return { error: "Erreur lors de la récupération des dons.", data: [] };
    }

    const data = await res.json();
    return { data };
  } catch (err) {
    console.error(err);
    return { error: "Erreur de connexion au serveur.", data: [] };
  }
}

export async function getUserDonations(userId: number | string) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/contributions/?user_id=${userId}`, {
      cache: "no-store",
      headers: await getAuthHeader(),
    });

    if (!res.ok) {
      return { error: "Erreur lors de la récupération des dons de l'utilisateur.", data: [] };
    }

    const data = await res.json();
    return { data };
  } catch (err) {
    console.error(err);
    return { error: "Erreur de connexion au serveur.", data: [] };
  }
}

export async function getPendingWireDonations() {
  try {
    const res = await fetch(
      `${BACKEND_URL}/api/contributions/admin/pending-wire/`,
      {
        cache: "no-store",
        headers: await getAuthHeader(),
      },
    );
    if (!res.ok)
      return {
        error: "Impossible de charger les virements en attente.",
        data: [],
      };
    return { data: await res.json() };
  } catch (err) {
    console.error(err);
    return { error: "Erreur de connexion au serveur.", data: [] };
  }
}

export async function confirmWireDonation(donationId: number) {
  try {
    const res = await fetch(
      `${BACKEND_URL}/api/contributions/${donationId}/admin/confirm-wire/`,
      {
        method: "POST",
        headers: await getAuthHeader(),
      },
    );
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return {
        error: (data as { detail?: string }).detail || "Confirmation échouée.",
      };
    }
    revalidatePath("/dashboard/donations");
    return { data: await res.json() };
  } catch (err) {
    console.error(err);
    return { error: "Erreur de connexion au serveur." };
  }
}

export async function createDonationArchive(name: string, description = "") {
  try {
    const res = await fetch(
      `${BACKEND_URL}/api/contributions/admin/create-archive/`,
      {
        method: "POST",
        headers: {
          ...(await getAuthHeader()),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, description }),
      },
    );

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return {
        error:
          (data as { detail?: string }).detail || "Création d'archive échouée.",
      };
    }

    revalidatePath("/dashboard/donations");
    return { data: await res.json() };
  } catch (err) {
    console.error(err);
    return { error: "Erreur de connexion au serveur." };
  }
}

export async function listDonationArchives() {
  try {
    const res = await fetch(
      `${BACKEND_URL}/api/contributions/admin/archives/`,
      {
        cache: "no-store",
        headers: await getAuthHeader(),
      },
    );
    if (!res.ok)
      return { error: "Impossible de charger les archives.", data: [] };
    return { data: await res.json() };
  } catch (err) {
    console.error(err);
    return { error: "Erreur de connexion au serveur.", data: [] };
  }
}

export async function getArchiveDonations(archiveId: number) {
  try {
    const res = await fetch(
      `${BACKEND_URL}/api/contributions/${archiveId}/admin/archive-donations/`,
      {
        cache: "no-store",
        headers: await getAuthHeader(),
      },
    );
    if (!res.ok)
      return { error: "Impossible de charger les dons archivés.", data: [] };
    return { data: await res.json() };
  } catch (err) {
    console.error(err);
    return { error: "Erreur de connexion au serveur.", data: [] };
  }
}

export async function getBankAccountConfig() {
  return {
    bank_name: process.env.BANK_NAME || "BICIS",
    iban: process.env.BANK_IBAN || "SN28 XXXX XXXX XXXX XXXX XXXX XXX",
    bic: process.env.BANK_BIC || "BICISSND",
    account_name: process.env.BANK_ACCOUNT_NAME || "Association Yessal Gui",
    reference_format:
      process.env.BANK_REFERENCE_FORMAT || "YG-{member_id}-{date}",
  };
}

export async function makeDonation(formData: FormData) {
  const campaignId = formData.get("campaignId");
  const amount = formData.get("amount");
  const beneficiaryId = formData.get("beneficiaryId");
  const paymentMethod = formData.get("paymentMethod");
  const wireReference = formData.get("wireReference");
  const isAnonymous = formData.get("isAnonymous") === "on";

  if (!campaignId || !amount || !paymentMethod) {
    return { error: "Informations de paiement manquantes." };
  }

  try {
    const res = await fetch(`${BACKEND_URL}/api/contributions/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...((await getAuthHeader()) as Record<string, string>),
      },
      body: JSON.stringify({
        campaign: campaignId,
        amount,
        beneficiary: beneficiaryId || null,
        payment_method: paymentMethod,
        payment_status: "pending",
        is_anonymous: isAnonymous,
      }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return {
        error:
          (data as { detail?: string }).detail ||
          "La création du don a échoué cÃ´té serveur.",
      };
    }

    const donation = await res.json();

    if (paymentMethod === "virement") {
      const payRes = await payDonation(
        donation.id,
        paymentMethod,
        String(wireReference || ""),
      );
      if (payRes.error) {
        return { error: payRes.error };
      }
    }

    revalidatePath("/dashboard/donations");
    revalidatePath("/dashboard/donations/new");
    revalidatePath("/dashboard/campaigns");

    return { success: true, data: donation };
  } catch (err) {
    console.error(err);
    return { error: "Erreur de connexion au serveur backend." };
  }
}

export async function payDonation(
  donationId: number,
  paymentMethod: string,
  wireReference = "",
) {
  try {
    const res = await fetch(
      `${BACKEND_URL}/api/contributions/${donationId}/pay/`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...((await getAuthHeader()) as Record<string, string>),
        },
        body: JSON.stringify({
          payment_method: paymentMethod,
          wire_reference: wireReference,
        }),
      },
    );

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return {
        error:
          (data as { error?: string }).error ||
          "L'initiation du paiement a échoué.",
      };
    }

    const data = await res.json();
    return { data };
  } catch (err) {
    console.error(err);
    return { error: "Erreur de connexion au serveur backend." };
  }
}
