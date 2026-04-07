"use server";

import { cookies } from "next/headers";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:8000";

async function getAuthHeader() {
  const cookiesList = await cookies();
  const token = cookiesList.get("session-yessal")?.value;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// Récupérer le Daara auquel le User appartient ainsi que les stats ou membres si fournis
export async function getMyDaara() {
  try {
    // Dans notre architecture, l'user appartient forcément à un Daara, mais pour le mock up on liste les Daaras.
    // Idéalement on lit `api/profile/` puis `api/daara/{id}/`
    
    const profileRes = await fetch(`${BACKEND_URL}/api/profile/`, {
        cache: 'no-store',
        headers: { ...(await getAuthHeader()) },
    });

    if (!profileRes.ok) return { error: "Impossible de lire le profil." };
    const profile = await profileRes.json();

    if (!profile.daara) {
        return { error: "Vous n'êtes rattaché à aucun Daara." };
    }

    // Le backend nous fournit l'objet Daara imbriqué via le serializer
    return { data: profile.daara };

  } catch (err) {
    console.error(err);
    return { error: "Erreur de connexion au serveur." };
  }
}
