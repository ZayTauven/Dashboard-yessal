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
    const res = await fetch(
      `${BACKEND_URL}/api/contributions/?user_id=${userId}`,
      {
        cache: "no-store",
        headers: await getAuthHeader(),
      },
    );

    if (!res.ok) {
      return {
        error: "Erreur lors de la récupération des dons de l'utilisateur.",
        data: [],
      };
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
        error: messageForErrors(data, "Confirmation échouée."),
      };
    }
    revalidatePath("/dashboard/donations");
    return { data: await res.json() };
  } catch (err) {
    console.error(err);
    return { error: "Erreur de connexion au serveur." };
  }
}

/* ── Circuit des espèces : encaissé → remise validée par l'admin ─────────── */

async function postContribution(path: string, body: unknown, fallback: string) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/contributions/${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...((await getAuthHeader()) as Record<string, string>),
      },
      body: JSON.stringify(body ?? {}),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { error: messageForErrors(data, fallback) };
    revalidatePath("/dashboard/donations");
    revalidatePath("/dashboard/collect");
    return { data };
  } catch (err) {
    console.error(err);
    return { error: "Erreur de connexion au serveur." };
  }
}

async function getContribution(path: string, fallback: string) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/contributions/${path}`, {
      cache: "no-store",
      headers: await getAuthHeader(),
    });
    if (!res.ok) return { error: fallback, data: [] };
    return { data: await res.json() };
  } catch (err) {
    console.error(err);
    return { error: "Erreur de connexion au serveur.", data: [] };
  }
}

/** La caisse de chaque collecteur : espèces encaissées, pas encore remises. */
export async function getPendingCash() {
  return getContribution("admin/pending-cash/", "Impossible de charger les espèces à remettre.");
}

/** Les bordereaux de remise déjà validés. */
export async function listCashDeposits() {
  return getContribution("admin/cash-deposits/", "Impossible de charger les remises.");
}

/** L'administrateur a compté l'argent : le total doit égaler celui des Jëfs. */
export async function confirmCashDeposit(input: {
  collector: number;
  donations: number[];
  counted_amount: number;
  note?: string;
}) {
  return postContribution("admin/confirm-cash/", input, "La remise n'a pas pu être validée.");
}

/** Les deux files du collecteur : demandes ouvertes, et sa caisse non remise. */
export async function getCollectQueues() {
  const [requests, cash] = await Promise.all([
    getContribution("?a_collecter=1", "Impossible de charger les demandes de collecte."),
    getContribution("?ma_caisse=1", "Impossible de charger votre caisse."),
  ]);
  return {
    requests: (requests.data ?? []) as unknown[],
    cash: (cash.data ?? []) as unknown[],
    error: requests.error || cash.error,
  };
}

/** Le collecteur déclare avoir reçu l'argent d'une demande de collecte. */
export async function collectDonation(donationId: number) {
  return postContribution(`${donationId}/collect/`, {}, "L'encaissement a échoué.");
}

/** Annulation par l'administration, motif obligatoire. */
export async function cancelDonation(donationId: number, reason: string) {
  return postContribution(`${donationId}/admin/cancel/`, { reason }, "L'annulation a échoué.");
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
          messageForErrors(data, "Création d'archive échouée."),
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
  const donorId = formData.get("donorId");
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
        donor: donorId || null,
        beneficiary: beneficiaryId || null,
        payment_method: paymentMethod,
        /* Plus de `payment_status` : il CONFIRMAIT d'office tout Jëf en
           espèces, demande de collecte d'un membre comprise. Le serveur
           décide seul (demandé, encaissé, puis confirmé à la remise). */
        is_anonymous: isAnonymous,
      }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return {
        error:
          messageForErrors(data, "La création du don a échoué côté serveur."),
      };
    }

    const donation = await res.json();

    if (
      [
        "virement",
        "wave",
        "orange_money",
        "visa",
        "mastercard",
        "bictorys",
      ].includes(paymentMethod as string)
    ) {
      const payRes = await payDonation(
        donation.id,
        paymentMethod as string,
        String(wireReference || ""),
      );
      if (payRes.error) {
        return { error: payRes.error };
      }
      /* Le service rend `checkout_url` (`contributions/services/bictorys.py`) :
         seule la forme camelCase était lue, la page de carte ne s'ouvrait pas. */
      const redirectUrl =
        payRes.data?.checkout_url || payRes.data?.checkoutUrl || payRes.data?.url;
      if (redirectUrl) {
        return { success: true, redirectUrl };
      }
    }

    revalidatePath("/dashboard/donations");
    revalidatePath("/dashboard/donations/new");
    revalidatePath("/dashboard/campaigns");
    revalidatePath("/dashboard/collect");

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
