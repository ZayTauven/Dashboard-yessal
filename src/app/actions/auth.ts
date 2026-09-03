"use server";

import { cookies } from "next/headers";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:8000";

const ACCESS_COOKIE = "session-yessal";
const REFRESH_COOKIE = "refresh-yessal";

/** Attributs communs aux deux cookies de session. */
const SESSION_COOKIE = {
  httpOnly: true,
  path: "/",
  maxAge: 60 * 60,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
};

function extractApiError(payload: unknown, fallback: string) {
  if (!payload || typeof payload !== "object") return fallback;

  if ("detail" in payload && typeof payload.detail === "string") {
    return payload.detail;
  }

  for (const value of Object.values(payload)) {
    if (typeof value === "string") return value;
    if (
      Array.isArray(value) &&
      value.length > 0 &&
      typeof value[0] === "string"
    ) {
      return value[0];
    }
  }

  return fallback;
}

export async function loginAction(formData: FormData) {
  const identifier = formData.get("identifier");
  const password = formData.get("password");

  if (!identifier || !password) {
    return { error: "Veuillez remplir tous les champs." };
  }

  try {
    const response = await fetch(`${BACKEND_URL}/api/auth/login/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ identifier, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { error: data.detail || "Identifiants invalides." };
    }

    const cookiesList = await cookies();
    cookiesList.set({ ...SESSION_COOKIE, name: ACCESS_COOKIE, value: data.access });

    /*
     * Le backend renvoie DEUX jetons : `access`, valable une heure, et
     * `refresh`, valable un jour. Seul le premier était conservé — le second
     * était lu, puis abandonné. Au bout d'une heure, la session mourait sans
     * recours, alors que `/api/auth/refresh/` existait précisément pour la
     * prolonger. C'est l'intergiciel qui s'en sert (voir middleware.ts).
     */
    if (typeof data.refresh === "string") {
      cookiesList.set({
        ...SESSION_COOKIE,
        name: REFRESH_COOKIE,
        value: data.refresh,
        maxAge: 60 * 60 * 24,
      });
    }

    return { success: true };
  } catch (error) {
    console.error("Login Error:", error);
    return { error: "Erreur de connexion au serveur." };
  }
}

export async function logoutAction() {
  const cookiesList = await cookies();
  cookiesList.delete(ACCESS_COOKIE);
  // Sans cette ligne, le jeton de rafraîchissement survivait à la déconnexion
  // et l'intergiciel refabriquait une session au premier /dashboard.
  cookiesList.delete(REFRESH_COOKIE);
  return { success: true };
}

export async function registerAction(formData: FormData) {
  const data = Object.fromEntries(formData);
  const email = String(data.email || "").trim();
  const phone = String(data.phone || "").trim();
  if (!email && !phone) {
    return {
      error: "Un email ou un numéro de téléphone est obligatoire.",
    };
  }

  data.email = email;
  data.phone = phone;
  try {
    const res = await fetch(`${BACKEND_URL}/api/auth/register/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok) {
      return {
        error: extractApiError(result, "Échec de l'inscription."),
      };
    }
    return { success: true };
  } catch (err) {
    console.error(err);
    return { error: "Erreur réseau." };
  }
}

export async function forgotPasswordAction(email: string) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/auth/forgot-password/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const result = await res.json();
    if (!res.ok) return { error: result.detail || "Échec de la demande." };
    return { success: true, message: result.detail };
  } catch (err) {
    console.error(err);
    return { error: "Erreur réseau." };
  }
}

/*
 * ═══════════════════════════════════════════════════════════════════════════
 * Changement de mot de passe par l'intéressé
 * ═══════════════════════════════════════════════════════════════════════════
 * Les comptes créés par un tiers — inscription rapide d'un collecteur, import
 * Excel — reçoivent un mot de passe qu'ils n'ont pas choisi, et que d'autres
 * connaissent. Le backend lève alors `must_change_password`, et l'interface le
 * signale à chaque écran jusqu'à ce que ce soit fait.
 *
 * Encore fallait-il pouvoir le faire : aucun endpoint ne le permettait, et
 * `ProfileUpdateSerializer` ne porte pas le champ. Seul « mot de passe oublié »
 * existait, ce qui suppose une adresse e-mail — précisément ce qui manque à
 * une partie des membres inscrits sur le terrain.
 */
export async function changePasswordAction(
  currentPassword: string,
  newPassword: string,
) {
  try {
    const cookiesList = await cookies();
    const token = cookiesList.get("session-yessal")?.value;

    if (!token) return { error: "Session expirée. Reconnectez-vous." };

    const res = await fetch(`${BACKEND_URL}/api/auth/change-password/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        current_password: currentPassword,
        new_password: newPassword,
      }),
    });

    const result = await res.json().catch(() => null);

    if (!res.ok) {
      return {
        error: extractApiError(result, "Impossible de modifier le mot de passe."),
      };
    }

    /*
     * Changer son mot de passe ferme TOUTES les sessions du compte — c'est le
     * but : on le change souvent parce qu'on le croit connu d'un autre. Sans ce
     * qui suit, la session d'où part la demande tomberait avec les autres, et
     * l'écran suivant renverrait vers la page de connexion.
     *
     * Le backend réémet donc un jeton sur la nouvelle génération, qu'on pose
     * ici à la place de l'ancien. L'intéressé reste connecté sur cet appareil,
     * et nulle part ailleurs.
     */
    if (typeof result?.access === "string") {
      cookiesList.set({ ...SESSION_COOKIE, name: ACCESS_COOKIE, value: result.access });
    }
    if (typeof result?.refresh === "string") {
      cookiesList.set({
        ...SESSION_COOKIE,
        name: REFRESH_COOKIE,
        value: result.refresh,
        maxAge: 60 * 60 * 24,
      });
    } else {
      // Le changement de mot de passe invalide la génération de jetons : un
      // ancien jeton de rafraîchissement ferait révoquer la session neuve au
      // premier renouvellement.
      cookiesList.delete(REFRESH_COOKIE);
    }

    return { success: true };
  } catch (err) {
    console.error(err);
    return { error: "Erreur réseau." };
  }
}
