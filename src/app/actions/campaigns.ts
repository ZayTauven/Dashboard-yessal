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

export async function getCampaigns() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/events/campaigns/`, {
      cache: "no-store",
      headers: await getAuthHeader(),
    });

    if (!res.ok) {
      return {
        error: "Erreur lors de la récupération des campagnes.",
        data: [],
      };
    }

    const data = await res.json();
    return { data };
  } catch (err) {
    console.error(err);
    return { error: "Erreur de connexion au serveur backend.", data: [] };
  }
}

export async function getCampaignById(campaignId: number) {
  try {
    const res = await fetch(
      `${BACKEND_URL}/api/events/campaigns/${campaignId}/`,
      {
        cache: "no-store",
        headers: await getAuthHeader(),
      },
    );

    if (!res.ok) {
      return { error: "Impossible de charger la campagne." };
    }

    return { data: await res.json() };
  } catch (err) {
    console.error(err);
    return { error: "Erreur de connexion au serveur backend." };
  }
}

export async function getCampaignEtat(campaignId: number) {
  try {
    const res = await fetch(
      `${BACKEND_URL}/api/events/campaigns/${campaignId}/etat/`,
      {
        cache: "no-store",
        headers: await getAuthHeader(),
      },
    );

    if (!res.ok) {
      return { error: "Impossible de charger l'état du Ndiguel." };
    }

    return { data: await res.json() };
  } catch (err) {
    console.error(err);
    return { error: "Erreur de connexion au serveur backend." };
  }
}

export async function addCampaign(formData: FormData) {
  const name = formData.get("name");
  const deadline = formData.get("deadline");

  if (!name || !deadline) {
    return { error: "Veuillez remplir le nom et la date limite." };
  }

  const backendData = new FormData();
  backendData.append("name", name as string);
  backendData.append("deadline", deadline as string);
  backendData.append("status", "active");

  if (formData.get("description"))
    backendData.append("description", formData.get("description") as string);
  if (formData.get("goalAmount"))
    backendData.append("goal_amount", formData.get("goalAmount") as string);
  if (formData.get("objective"))
    backendData.append("objective", formData.get("objective") as string);
  if (formData.get("feteId"))
    backendData.append("fete", formData.get("feteId") as string);
  if (formData.get("organizerId"))
    backendData.append("organizer", formData.get("organizerId") as string);

  const photo = formData.get("illustrative_photo");
  if (photo && (photo as File).size > 0) {
    backendData.append("illustrative_photo", photo);
  }

  try {
    const authHeader = await getAuthHeader();
    const res = await fetch(`${BACKEND_URL}/api/events/campaigns/`, {
      method: "POST",
      headers: {
        ...(authHeader as Record<string, string>),
      },
      body: backendData,
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return {
        error:
          (data as { detail?: string }).detail ||
          "Erreur lors de la création de la campagne.",
      };
    }

    revalidatePath("/dashboard/campaigns");
    revalidatePath("/dashboard/campaigns/new");
    return { success: true };
  } catch (err) {
    console.error(err);
    return { error: "Erreur de connexion au serveur backend." };
  }
}

export async function getCampaignOrganizerDirectory(campaignId: number) {
  try {
    const res = await fetch(
      `${BACKEND_URL}/api/events/campaigns/${campaignId}/organizer-directory/`,
      {
        cache: "no-store",
        headers: await getAuthHeader(),
      },
    );

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return {
        error:
          (err as { detail?: string }).detail ||
          "Impossible de charger les membres pour l'organisation.",
      };
    }

    return { data: await res.json() };
  } catch (err) {
    console.error(err);
    return { error: "Erreur de connexion au serveur backend." };
  }
}

export async function updateCampaign(campaignId: number, formData: FormData) {
  const name = formData.get("name");
  const deadline = formData.get("deadline");

  if (!name || !deadline) {
    return { error: "Veuillez remplir le nom et la date limite." };
  }

  const backendData = new FormData();
  backendData.append("name", name as string);
  backendData.append("deadline", deadline as string);

  if (formData.get("description"))
    backendData.append("description", formData.get("description") as string);
  if (formData.get("goalAmount"))
    backendData.append("goal_amount", formData.get("goalAmount") as string);
  if (formData.get("objective"))
    backendData.append("objective", formData.get("objective") as string);
  if (formData.get("feteId") !== null)
    backendData.append("fete", (formData.get("feteId") as string) || "");
  if (formData.get("organizerId") !== null)
    backendData.append(
      "organizer",
      (formData.get("organizerId") as string) || "",
    );

  const photo = formData.get("illustrative_photo");
  if (photo && (photo as File).size > 0) {
    backendData.append("illustrative_photo", photo);
  }

  try {
    const authHeader = await getAuthHeader();
    const res = await fetch(
      `${BACKEND_URL}/api/events/campaigns/${campaignId}/`,
      {
        method: "PATCH",
        headers: {
          ...(authHeader as Record<string, string>),
        },
        body: backendData,
      },
    );

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return {
        error:
          (data as { detail?: string }).detail ||
          "Erreur lors de la mise Ã  jour de la campagne.",
      };
    }

    revalidatePath("/dashboard/campaigns");
    revalidatePath(`/dashboard/campaigns/${campaignId}`);
    return { success: true, data: await res.json() };
  } catch (err) {
    console.error(err);
    return { error: "Erreur de connexion au serveur backend." };
  }
}

export async function deleteCampaign(campaignId: number) {
  try {
    const res = await fetch(
      `${BACKEND_URL}/api/events/campaigns/${campaignId}/`,
      {
        method: "DELETE",
        headers: await getAuthHeader(),
      },
    );

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return {
        error:
          (data as { detail?: string }).detail ||
          "Erreur lors de la suppression de la campagne.",
      };
    }

    revalidatePath("/dashboard/campaigns");
    revalidatePath("/dashboard/admin/campaign-metrics");
    return { success: true };
  } catch (err) {
    console.error(err);
    return { error: "Erreur de connexion au serveur backend." };
  }
}

export async function addCampaignTodo(campaignId: number, title: string) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/events/campaign-todos/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...((await getAuthHeader()) as Record<string, string>),
      },
      body: JSON.stringify({
        campaign: campaignId,
        title,
        is_completed: false,
      }),
    });
    if (!res.ok) return { error: "Erreur lors de l'ajout de la tÃ¢che." };
    revalidatePath("/dashboard/campaigns");
    return { success: true };
  } catch (err) {
    console.error(err);
    return { error: "Erreur serveur." };
  }
}

export async function toggleCampaignTodo(todoId: number, isCompleted: boolean) {
  try {
    const res = await fetch(
      `${BACKEND_URL}/api/events/campaign-todos/${todoId}/`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...((await getAuthHeader()) as Record<string, string>),
        },
        body: JSON.stringify({ is_completed: isCompleted }),
      },
    );
    if (!res.ok)
      return { error: "Erreur lors de la mise Ã  jour de la tÃ¢che." };
    revalidatePath("/dashboard/campaigns");
    return { success: true };
  } catch (err) {
    console.error(err);
    return { error: "Erreur serveur." };
  }
}
