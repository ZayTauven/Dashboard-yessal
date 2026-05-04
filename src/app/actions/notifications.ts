"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:8000";

async function getAuthHeader(): Promise<HeadersInit | undefined> {
  const cookiesList = await cookies();
  const token = cookiesList.get("session-yessal")?.value;
  return token ? { Authorization: `Bearer ${token}` } : undefined;
}

export type NotificationDto = {
  id: number;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
};

function normalizeNotificationList(raw: unknown): NotificationDto[] {
  let list: unknown[] = [];
  if (Array.isArray(raw)) list = raw;
  else if (raw && typeof raw === "object" && "results" in raw) {
    list = (raw as { results?: unknown[] }).results ?? [];
  }
  return list as NotificationDto[];
}

export async function getNotifications() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/comms/notifications/`, {
      cache: "no-store",
      headers: await getAuthHeader(),
    });
    if (!res.ok) {
      return { error: "Erreur lors de la récupération des notifications." };
    }
    const raw = await res.json();
    return { data: normalizeNotificationList(raw) };
  } catch (err) {
    console.error(err);
    return { error: "Erreur de connexion." };
  }
}

export async function getNotificationsPreview(limit = 3) {
  const { data, error } = await getNotifications();
  if (error || !data) return { data: [] as NotificationDto[], error };
  return { data: data.slice(0, limit) };
}

export async function markNotificationRead(id: number, isRead = true) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/comms/notifications/${id}/`, {
      method: "PATCH",
      headers: {
        ...(await getAuthHeader()),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ is_read: isRead }),
    });
    if (!res.ok) {
      return { error: "Impossible de mettre à jour la notification." };
    }
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/notifications");
    return { data: await res.json() };
  } catch (err) {
    console.error(err);
    return { error: "Erreur réseau." };
  }
}

export async function markAllNotificationsRead() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/comms/notifications/mark-all-read/`, {
      method: "POST",
      headers: await getAuthHeader(),
    });
    if (!res.ok) {
      return { error: "Impossible de marquer toutes les notifications comme lues." };
    }
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/notifications");
    return { data: await res.json() };
  } catch (err) {
    console.error(err);
    return { error: "Erreur réseau." };
  }
}
