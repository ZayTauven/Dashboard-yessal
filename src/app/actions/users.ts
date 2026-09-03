"use server";

import { cookies } from "next/headers";
import { generateProvisionalPassword } from "@/lib/password";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:8000";

async function getAuthHeader(): Promise<HeadersInit | undefined> {
  const cookiesList = await cookies();
  const token = cookiesList.get("session-yessal")?.value;
  return token ? { Authorization: `Bearer ${token}` } : undefined;
}

export async function searchMembers(query: string) {
  if (!query || query.length < 2) return { data: [] };

  try {
    const res = await fetch(
      `${BACKEND_URL}/api/directory/users/?search=${query}`,
      {
        cache: "no-store",
        headers: await getAuthHeader(),
      },
    );

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
      cache: "no-store",
      headers: await getAuthHeader(),
    });
    if (!res.ok) return { error: "Impossible de lister les utilisateurs." };
    return { data: await res.json() };
  } catch (err) {
    console.error("getAllUsers:", err);
    return { error: "Erreur de connexion." };
  }
}

export async function getUser(userId: number | string) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/users/${userId}/`, {
      cache: "no-store",
      headers: await getAuthHeader(),
    });
    if (!res.ok) return { error: "Utilisateur non trouvé." };
    return { data: await res.json() };
  } catch (err) {
    console.error("getUser:", err);
    return { error: "Erreur de connexion." };
  }
}

export async function getDirectoryUsers() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/directory/users/`, {
      cache: "no-store",
      headers: await getAuthHeader(),
    });
    if (!res.ok) return { error: "Impossible de lister l'annuaire." };
    return { data: await res.json() };
  } catch (err) {
    console.error("getDirectoryUsers:", err);
    return { error: "Erreur de connexion." };
  }
}

export async function getPilotageSettings() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/settings/pilotage/`, {
      cache: "no-store",
      headers: await getAuthHeader(),
    });
    if (!res.ok) return { error: "Impossible de charger les réglages." };
    const data = await res.json();
    // Since it's a list (ViewSet), we take the first element if it's an array, or just data if singleton
    return { data: Array.isArray(data) ? data[0] : data };
  } catch (err) {
    console.error("getPilotageSettings:", err);
    return { error: "Erreur de connexion." };
  }
}

export async function getProfile() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/profile/`, {
      cache: "no-store",
      headers: await getAuthHeader(),
    });
    /*
     * 401 distingué des autres échecs : c'est le cas d'une session fermée à
     * distance — mot de passe changé ailleurs, ou réinitialisé par un
     * administrateur. Le cookie est toujours là et le middleware, qui ne
     * regarde que sa PRÉSENCE, laisse passer : sans ce signal, la personne
     * resterait sur un tableau de bord vide sans comprendre pourquoi.
     */
    if (res.status === 401) return { error: "Session fermée.", unauthorized: true };
    if (!res.ok) return { error: "Profil non trouvé." };
    return { data: await res.json() };
  } catch (err) {
    console.error("getProfile:", err);
    return { error: "Erreur de connexion." };
  }
}

export async function updateUserStatus(
  userId: number,
  action: "validate" | "block",
) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/users/${userId}/${action}/`, {
      method: "POST",
      headers: await getAuthHeader(),
    });
    if (!res.ok) return { error: "Action échouée." };
    return { data: await res.json() };
  } catch (err) {
    console.error("updateUserStatus:", err);
    return { error: "Erreur de connexion." };
  }
}

export async function createUserByAdmin(userData: any) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/users/`, {
      method: "POST",
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
    console.error("createUserByAdmin:", err);
    return { error: "Erreur réseau." };
  }
}

export async function updateUserRole(userId: number, role: string) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/users/${userId}/`, {
      method: "PATCH",
      headers: {
        ...(await getAuthHeader()),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ role }),
    });
    if (!res.ok) return { error: "Mise à jour du rôle échouée." };
    return { data: await res.json() };
  } catch (err) {
    console.error("updateUserRole:", err);
    return { error: "Erreur réseau." };
  }
}

export async function updateProfile(formData: FormData) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/profile/`, {
      method: "PATCH",
      headers: await getAuthHeader(),
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json();
      // Return field-specific errors if available
      if (typeof err === "object" && !err.detail) {
        const firstError = Object.entries(err)[0];
        if (firstError) {
          return { error: `${firstError[0]}: ${firstError[1]}` };
        }
      }
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
      method: "PATCH",
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
    console.error("updateUserAction:", err);
    return { error: "Erreur réseau." };
  }
}

export async function deleteUserAction(userId: number) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/users/${userId}/`, {
      method: "DELETE",
      headers: await getAuthHeader(),
    });
    if (!res.ok) return { error: "Suppression échouée." };
    return { success: true };
  } catch (err) {
    console.error("deleteUserAction:", err);
    return { error: "Erreur réseau." };
  }
}

export async function updatePilotageSettings(data: any) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/settings/pilotage/`, {
      method: "POST",
      headers: {
        ...(await getAuthHeader()),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      return { error: err.detail || "Mise à jour échouée." };
    }
    return { data: await res.json() };
  } catch (err) {
    console.error("updatePilotageSettings:", err);
    return { error: "Erreur réseau." };
  }
}

export async function getTitles() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/titles/`, {
      cache: "no-store",
      headers: await getAuthHeader(),
    });
    if (!res.ok)
      return { error: "Impossible de charger les titres.", data: [] };
    return { data: await res.json() };
  } catch (err) {
    console.error("getTitles:", err);
    return { error: "Erreur de connexion.", data: [] };
  }
}

export async function createTitle(payload: {
  name: string;
  description?: string;
  is_active?: boolean;
}) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/titles/`, {
      method: "POST",
      headers: {
        ...(await getAuthHeader()),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) return { error: "Creation du titre echouee." };
    return { data: await res.json() };
  } catch (err) {
    console.error("createTitle:", err);
    return { error: "Erreur reseau." };
  }
}

export async function updateTitle(
  titleId: number,
  payload: { name?: string; description?: string; is_active?: boolean },
) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/titles/${titleId}/`, {
      method: "PATCH",
      headers: {
        ...(await getAuthHeader()),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) return { error: "Mise a jour du titre echouee." };
    return { data: await res.json() };
  } catch (err) {
    console.error("updateTitle:", err);
    return { error: "Erreur reseau." };
  }
}

export async function deleteTitle(titleId: number) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/titles/${titleId}/`, {
      method: "DELETE",
      headers: await getAuthHeader(),
    });
    if (!res.ok) return { error: "Suppression du titre echouee." };
    return { success: true };
  } catch (err) {
    console.error("deleteTitle:", err);
    return { error: "Erreur reseau." };
  }
}

export async function getTitleRequests(status?: string) {
  try {
    const url = status
      ? `${BACKEND_URL}/api/title-requests/?status=${status}`
      : `${BACKEND_URL}/api/title-requests/`;
    const res = await fetch(url, {
      cache: "no-store",
      headers: await getAuthHeader(),
    });
    if (!res.ok)
      return {
        error: "Impossible de charger les demandes de titre.",
        data: [],
      };
    return { data: await res.json() };
  } catch (err) {
    console.error("getTitleRequests:", err);
    return { error: "Erreur reseau.", data: [] };
  }
}

export async function submitTitleRequest(titleId: number, note = "") {
  try {
    const res = await fetch(`${BACKEND_URL}/api/title-requests/`, {
      method: "POST",
      headers: {
        ...(await getAuthHeader()),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ title: titleId, note }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return {
        error:
          (err as { detail?: string }).detail ||
          "Soumission de la demande echouee.",
      };
    }
    return { data: await res.json() };
  } catch (err) {
    console.error("submitTitleRequest:", err);
    return { error: "Erreur reseau." };
  }
}

export async function reviewTitleRequest(
  requestId: number,
  action: "approve" | "refuse",
  note = "",
) {
  try {
    const res = await fetch(
      `${BACKEND_URL}/api/title-requests/${requestId}/review/`,
      {
        method: "PATCH",
        headers: {
          ...(await getAuthHeader()),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action, note }),
      },
    );
    if (!res.ok) return { error: "Traitement de la demande echoue." };
    return { data: await res.json() };
  } catch (err) {
    console.error("reviewTitleRequest:", err);
    return { error: "Erreur reseau." };
  }
}

export async function getUserDocuments(userId: number) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/users/${userId}/documents/`, {
      cache: "no-store",
      headers: await getAuthHeader(),
    });
    if (!res.ok)
      return { error: "Impossible de charger les documents.", data: [] };
    return { data: await res.json() };
  } catch (err) {
    console.error("getUserDocuments:", err);
    return { error: "Erreur reseau.", data: [] };
  }
}

export async function createUserDocument(userId: number, formData: FormData) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/users/${userId}/documents/`, {
      method: "POST",
      headers: await getAuthHeader(),
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return {
        error:
          (err as { detail?: string }).detail ||
          "Soumission du document echouee.",
      };
    }
    return { data: await res.json() };
  } catch (err) {
    console.error("createUserDocument:", err);
    return { error: "Erreur reseau." };
  }
}

export async function updateUserDocument(
  userId: number,
  documentId: number,
  formData: FormData,
) {
  try {
    const res = await fetch(
      `${BACKEND_URL}/api/users/${userId}/documents/${documentId}/`,
      {
        method: "PATCH",
        headers: await getAuthHeader(),
        body: formData,
      },
    );
    if (!res.ok) return { error: "Mise a jour du document echouee." };
    return { data: await res.json() };
  } catch (err) {
    console.error("updateUserDocument:", err);
    return { error: "Erreur reseau." };
  }
}

export async function getPendingDocuments() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/admin/documents/pending/`, {
      cache: "no-store",
      headers: await getAuthHeader(),
    });
    if (!res.ok)
      return {
        error: "Impossible de charger les documents en attente.",
        data: [],
      };
    return { data: await res.json() };
  } catch (err) {
    console.error("getPendingDocuments:", err);
    return { error: "Erreur reseau.", data: [] };
  }
}

export async function validateDocument(
  documentId: number,
  status: "validated" | "rejected",
  rejectionNote = "",
) {
  try {
    const res = await fetch(
      `${BACKEND_URL}/api/admin/documents/${documentId}/validate/`,
      {
        method: "PATCH",
        headers: {
          ...(await getAuthHeader()),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status, rejection_note: rejectionNote }),
      },
    );
    if (!res.ok) return { error: "Validation du document echouee." };
    return { data: await res.json() };
  } catch (err) {
    console.error("validateDocument:", err);
    return { error: "Erreur reseau." };
  }
}

export async function getUserTutelle(userId: number | string) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/users/${userId}/tutelle/`, {
      cache: "no-store",
      headers: await getAuthHeader(),
    });
    if (!res.ok)
      return { error: "Impossible de charger la liste de tutelle.", data: [] };
    return { data: await res.json() };
  } catch (err) {
    console.error("getUserTutelle:", err);
    return { error: "Erreur de connexion.", data: [] };
  }
}

/*
 * ════════════════════════════════════════════════════════════════════════════
 * Réinitialisation du mot de passe d'un membre — assistance
 * ════════════════════════════════════════════════════════════════════════════
 * Un membre qui a perdu son mot de passe et n'a pas d'adresse e-mail valide ne
 * peut pas passer par « mot de passe oublié » — c'est le cas d'une bonne part
 * des comptes créés sur le terrain. Il appelle alors son chef de Daara ou un
 * administrateur, qui lui en attribue un nouveau, de vive voix.
 *
 * Le mot de passe est tiré au sort ICI, côté serveur : écrit dans un composant
 * client, il partirait dans le bundle envoyé au navigateur. Il est renvoyé une
 * fois à l'appelant pour qu'il puisse le dicter, et n'est stocké nulle part.
 *
 * `UserSerializer.update()` lève `must_change_password` côté Django dès qu'un
 * mot de passe est posé par un tiers : le membre verra le bandeau à sa
 * prochaine connexion, et devra choisir le sien.
 */
export async function resetMemberPasswordAction(userId: number) {
  const password = generateProvisionalPassword();

  const res = await updateUserAction(userId, { password });
  if (res.error) return { error: res.error };

  return { password };
}
