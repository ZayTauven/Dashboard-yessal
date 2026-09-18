"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { stripEmptyFiles } from "@/lib/form-data";
import { messageForErrors } from "@/lib/api-result";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:8000";

async function getAuthHeader(): Promise<HeadersInit | undefined> {
  const cookiesList = await cookies();
  const token = cookiesList.get("session-yessal")?.value;
  return token ? { Authorization: `Bearer ${token}` } : undefined;
}

export async function getMyDaara() {
  try {
    const profileRes = await fetch(`${BACKEND_URL}/api/profile/`, {
      cache: "no-store",
      headers: await getAuthHeader(),
    });

    if (!profileRes.ok) return { error: "Impossible de lire le profil." };
    const profile = await profileRes.json();

    if (!profile.daara) {
      return { error: "Vous n'êtes rattaché à aucun Daara." };
    }

    return { data: profile.daara };
  } catch (err) {
    console.error(err);
    return { error: "Erreur de connexion au serveur." };
  }
}

/**
 * Ce que l'import rend, en succès comme en échec.
 *
 * Le rapport est la raison d'être de ce point d'entrée : un import qui touche
 * quatre cents Daaras ne se résume pas à « réussi » ou « échoué ». Il dit ce
 * qui a été créé, ce qui a été réaffecté, et ce sur quoi il refuse de trancher.
 * Voir `accounts/services/ldd_import.py`.
 */
export interface RapportImport {
  success: boolean;
  mode: string;
  message: string;
  zones_creees: string[];
  zones_reconnues: number;
  daaras_crees: string[];
  daaras_deplaces: string[];
  orthographes_alignees: string[];
  daaras_inchanges: number;
  lignes_ignorees: string[];
  avertissements: string[];
  erreurs: string[];
}

export async function getLDDs() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/ldd/`, {
      cache: "no-store",
      headers: await getAuthHeader(),
    });
    if (!res.ok) return { error: "Erreur de récupération des Zones." };
    return { data: await res.json() };
  } catch (err) {
    console.error(err);
    return { error: "Erreur de connexion." };
  }
}

export async function createLDD(payload: { name: string; code: string }) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/ldd/`, {
      method: "POST",
      headers: {
        ...((await getAuthHeader()) as object),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const corps = await res.json().catch(() => null);
      /* Le serveur dit précisément ce qui cloche — « Ldd avec ces Code et Name
         existe déjà », par exemple. Le taire obligeait l'administrateur à
         deviner, et c'est la dette déjà corrigée partout ailleurs. */
      return { error: messageForErrors(corps, "Échec de création de la Zone.") };
    }
    revalidatePath("/dashboard/admin/daara");
    return { data: await res.json() };
  } catch (err) {
    console.error("createLDD:", err);
    return { error: "Erreur serveur." };
  }
}

export async function updateLDD(id: number, payload: { name?: string; code?: string }) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/ldd/${id}/`, {
      method: "PATCH",
      headers: {
        ...((await getAuthHeader()) as object),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const corps = await res.json().catch(() => null);
      return { error: messageForErrors(corps, "Échec de mise à jour de la Zone.") };
    }
    revalidatePath("/dashboard/admin/daara");
    return { data: await res.json() };
  } catch (err) {
    console.error("updateLDD:", err);
    return { error: "Erreur serveur." };
  }
}

export async function deleteLDD(id: number) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/ldd/${id}/`, {
      method: "DELETE",
      headers: await getAuthHeader(),
    });
    if (!res.ok) {
      const corps = (await res.json().catch(() => null)) as
        | { detail?: string; daaras_count?: number; daaras_apercu?: string[] }
        | null;
      /* 🔴 CE MESSAGE ÉTAIT UNE DEVINETTE — « (Daaras rattachés ?) », point
         d'interrogation compris — parce que la réponse n'était jamais lue. Et
         elle ne pouvait rien dire : le point d'entrée répondait 405 à toute
         suppression. Le serveur nomme maintenant le nombre de Daaras et les
         premiers d'entre eux, ce qu'il faut pour savoir quoi faire ensuite. */
      return {
        error: messageForErrors(corps, "Suppression de la Zone impossible."),
        daarasCount: corps?.daaras_count,
        daarasApercu: corps?.daaras_apercu,
      };
    }
    revalidatePath("/dashboard/admin/daara");
    return { success: true };
  } catch (err) {
    console.error("deleteLDD:", err);
    return { error: "Erreur réseau." };
  }
}

/**
 * Déplace en bloc tous les Daaras d'une zone vers une autre.
 *
 * Vider une zone de vingt-neuf Daaras demandait sinon vingt-neuf modifications
 * à la main — et sa suppression restait donc hors d'atteinte en pratique. Le
 * déplacement PRÉSERVE les Daaras : membres, dons et Ndiguels suivent, là où
 * supprimer puis recréer les perdrait.
 */
export async function transferLDDDaaras(id: number, targetId: number) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/ldd/${id}/transferer-daaras/`, {
      method: "POST",
      headers: {
        ...((await getAuthHeader()) as object),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ target_ldd: targetId }),
    });
    const corps = (await res.json().catch(() => null)) as
      | { detail?: string; moved?: number; collisions?: string[] }
      | null;
    if (!res.ok) {
      return {
        error: messageForErrors(corps, "Déplacement impossible."),
        collisions: corps?.collisions,
      };
    }
    revalidatePath("/dashboard/admin/daara");
    return { success: true, moved: corps?.moved ?? 0, detail: corps?.detail };
  } catch (err) {
    console.error("transferLDDDaaras:", err);
    return { error: "Erreur réseau." };
  }
}

export async function getDaaras() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/daara/`, {
      cache: "no-store",
      headers: await getAuthHeader(),
    });
    if (!res.ok) return { error: "Erreur de récupération des Daaras." };
    return { data: await res.json() };
  } catch (err) {
    console.error(err);
    return { error: "Erreur de connexion." };
  }
}

export async function createDaara(formData: FormData) {
  const name = formData.get("name") as string;
  const ldd_id = formData.get("ldd_id") as string;
  const description = formData.get("description") as string;

  if (!ldd_id) {
    return { error: "Veuillez sélectionner une LDD." };
  }

  try {
    const res = await fetch(`${BACKEND_URL}/api/daara/`, {
      method: "POST",
      headers: {
        ...((await getAuthHeader()) as object),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name: name?.trim(), ldd_id: parseInt(ldd_id), description, is_active: true }),
    });

    if (!res.ok) {
      const errorData = await res.json();
      return { error: messageForErrors(errorData, "Erreur lors de la création.") };
    }
    revalidatePath("/dashboard/admin/daara");
    return { data: await res.json() };
  } catch (err) {
    console.error(err);
    return { error: "Problème de communication avec le serveur." };
  }
}

export async function deleteDaara(id: number) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/daara/${id}/`, {
      method: "DELETE",
      headers: await getAuthHeader(),
    });
    if (!res.ok) return { error: "Suppression refusée." };
    return { success: true };
  } catch (err) {
    console.error(err);
    return { error: "Erreur de connexion." };
  }
}

export async function updateDaara(
  id: number,
  payload: {
    name?: string;
    code?: string;
    description?: string;
    is_active?: boolean;
    chef?: number | null;
  },
) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/daara/${id}/`, {
      method: "PATCH",
      headers: {
        ...((await getAuthHeader()) as object),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return {
        error:
          messageForErrors(err, "Mise à jour refusée."),
      };
    }
    revalidatePath("/dashboard/admin/daara");
    revalidatePath(`/dashboard/admin/daara/${id}`);
    revalidatePath("/dashboard/daara");
    return { data: await res.json() };
  } catch (err) {
    console.error(err);
    return { error: "Erreur de connexion." };
  }
}

export async function getDaaraById(id: number) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/daara/${id}/`, {
      cache: "no-store",
      headers: await getAuthHeader(),
    });
    if (!res.ok) return { error: "Daara introuvable." };
    return { data: await res.json() };
  } catch (err) {
    console.error(err);
    return { error: "Erreur de connexion." };
  }
}

export async function getDaaraEtat(id: number) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/daara/${id}/etat/`, {
      cache: "no-store",
      headers: await getAuthHeader(),
    });
    if (!res.ok) return { error: "Impossible de charger les détails du Daara." };
    return { data: await res.json() };
  } catch (err) {
    console.error(err);
    return { error: "Erreur de connexion." };
  }
}

export async function importDaaraExcel(formData: FormData) {
  /* Garde-fou de frontiere, PAS un correctif : aucun appelant actuel n'envoie
     de fichier vide — tous construisent leur FormData a la main, sous garde
     (`if (file) …`). Le filtre est ici pour le jour ou ce formulaire passera
     en soumission native (`<form action={…}>`), ou le navigateur inclut TOUS
     les champs, y compris un champ fichier non rempli. C'est ce qui rendait
     impossible la creation d'un article sans banniere — voir lib/form-data.ts. */
  const body = stripEmptyFiles(formData);

  try {
    const res = await fetch(`${BACKEND_URL}/api/daara/import-excel/`, {
      method: "POST",
      headers: await getAuthHeader(),
      body,
    });
    
    const corps = (await res.json().catch(() => null)) as RapportImport | null;

    if (!res.ok) {
      /* Un import refusé rend un RAPPORT, pas un message : la liste des lignes
         fautives est ce qui permet de corriger le fichier. On la fait donc
         remonter telle quelle jusqu'à l'écran. */
      return {
        error: messageForErrors(corps, "Erreur lors de l'importation."),
        rapport: corps ?? undefined,
      };
    }
    revalidatePath("/dashboard/admin/daara");
    return { success: true, data: corps ?? undefined };
  } catch (err) {
    console.error(err);
    return { error: "Erreur de connexion lors de l'importation." };
  }
}
