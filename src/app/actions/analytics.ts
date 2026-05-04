"use server";

import { cookies } from "next/headers";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:8000";

async function getAuthHeader(): Promise<HeadersInit | undefined> {
  const cookiesList = await cookies();
  const token = cookiesList.get("session-yessal")?.value;
  return token ? { Authorization: `Bearer ${token}` } : undefined;
}

export async function getDashboardStats() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/analytics/`, {
      cache: 'no-store',
      headers: await getAuthHeader(),
    });

    if (!res.ok) return { error: "Erreur lors de la récupération des stats." };
    
    return { data: await res.json() };
  } catch (err) {
    console.error(err);
    return { error: "Backend injoignable." };
  }
}

export async function getUserDashboardStats(userId: number | string) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/analytics/?user_id=${userId}`, {
      cache: 'no-store',
      headers: await getAuthHeader(),
    });

    if (!res.ok) return { error: "Erreur lors de la récupération des stats utilisateur." };
    
    return { data: await res.json() };
  } catch (err) {
    console.error(err);
    return { error: "Backend injoignable." };
  }
}

export async function getAuditLogs() {
    try {
      const res = await fetch(`${BACKEND_URL}/api/audit/`, {
        cache: 'no-store',
        headers: await getAuthHeader(),
      });
      if (!res.ok) return { error: "Impossible de lire les logs." };
      return { data: await res.json() };
    } catch (err) {
      return { error: "Erreur de connexion." };
    }
}

export async function getCampaignMetrics() {
    try {
      const res = await fetch(`${BACKEND_URL}/api/analytics/campaign-metrics/`, {
        cache: 'no-store',
        headers: await getAuthHeader(),
      });
      if (!res.ok) return { error: "Impossible de lire les métriques." };
      return { data: await res.json() };
    } catch (err) {
      return { error: "Erreur de connexion." };
    }
}
