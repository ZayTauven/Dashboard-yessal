"use server";

import { cookies } from "next/headers";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:8000";

async function getAuthHeader(): Promise<HeadersInit | undefined> {
  const cookiesList = await cookies();
  const token = cookiesList.get("session-yessal")?.value;
  return token ? { Authorization: `Bearer ${token}` } : undefined;
}

export async function searchMembers(query: string) {
  if (!query || query.length < 2) return { data: [] };

  try {
    const res = await fetch(`${BACKEND_URL}/api/users/?search=${query}`, {
      cache: 'no-store',
      headers: await getAuthHeader(),
    });

    if (!res.ok) return { error: "Erreur de recherche membre.", data: [] };
    
    const data = await res.json();
    return { data };
  } catch (err) {
    console.error(err);
    return { error: "Backend injoignable.", data: [] };
  }
}

export async function getAllUsers() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/users/`, {
      cache: 'no-store',
      headers: await getAuthHeader(),
    });
    if (!res.ok) return { error: "Impossible de lister les utilisateurs." };
    return { data: await res.json() };
  } catch (err) {
    return { error: "Erreur de connexion." };
  }
}

export async function getProfile() {
    try {
        const res = await fetch(`${BACKEND_URL}/api/profile/`, {
            cache: 'no-store',
            headers: await getAuthHeader(),
        });
        if (!res.ok) return { error: "Profil non trouvé." };
        return { data: await res.json() };
    } catch (err) {
        return { error: "Erreur de connexion." };
    }
}

export async function updateUserStatus(userId: number, action: 'validate' | 'block') {
    try {
        const res = await fetch(`${BACKEND_URL}/api/users/${userId}/${action}/`, {
            method: 'POST',
            headers: await getAuthHeader(),
        });
        if (!res.ok) return { error: "Action échouée." };
        return { data: await res.json() };
    } catch (err) {
        return { error: "Erreur de connexion." };
    }
}

export async function createUserByAdmin(userData: any) {
    try {
        const res = await fetch(`${BACKEND_URL}/api/users/`, {
            method: 'POST',
            headers: {
                ...(await getAuthHeader()),
                "Content-Type": "application/json",
            },
            body: JSON.stringify(userData),
        });
        if (!res.ok) {
            const err = await res.json();
            return { error: err.detail || "Échec de création de l'utilisateur." };
        }
        return { data: await res.json() };
    } catch (err) {
        return { error: "Erreur réseau." };
    }
}

export async function updateUserRole(userId: number, role: string) {
    try {
        const res = await fetch(`${BACKEND_URL}/api/users/${userId}/`, {
            method: 'PATCH',
            headers: {
                ...(await getAuthHeader()),
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ role }),
        });
        if (!res.ok) return { error: "Mise à jour du rôle échouée." };
        return { data: await res.json() };
    } catch (err) {
        return { error: "Erreur réseau." };
    }
}

export async function updateProfile(formData: FormData) {
    try {
        const res = await fetch(`${BACKEND_URL}/api/profile/`, {
            method: 'PATCH',
            headers: await getAuthHeader(),
            body: formData,
        });
        if (!res.ok) {
            const err = await res.json();
            return { error: err.detail || "Mise à jour du profil échouée." };
        }
        return { data: await res.json() };
    } catch (err) {
        console.error(err);
        return { error: "Erreur de connexion au serveur." };
    }
}

export async function updateUserAction(userId: number, userData: any) {
    try {
        const res = await fetch(`${BACKEND_URL}/api/users/${userId}/`, {
            method: 'PATCH',
            headers: {
                ...(await getAuthHeader()),
                "Content-Type": "application/json",
            },
            body: JSON.stringify(userData),
        });
        if (!res.ok) {
            const err = await res.json();
            return { error: err.detail || "Échec de modification." };
        }
        return { data: await res.json() };
    } catch (err) {
        return { error: "Erreur réseau." };
    }
}

export async function deleteUserAction(userId: number) {
    try {
        const res = await fetch(`${BACKEND_URL}/api/users/${userId}/`, {
            method: 'DELETE',
            headers: await getAuthHeader(),
        });
        if (!res.ok) return { error: "Suppression échouée." };
        return { success: true };
    } catch (err) {
        return { error: "Erreur réseau." };
    }
}
