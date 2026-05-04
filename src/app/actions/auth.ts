"use server";

import { cookies } from "next/headers";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:8000";

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
    cookiesList.set({
      name: "session-yessal",
      value: data.access,
      httpOnly: true,
      path: "/",
      maxAge: 60 * 60,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });

    return { success: true };
  } catch (error) {
    console.error("Login Error:", error);
    return { error: "Erreur de connexion au serveur." };
  }
}

export async function logoutAction() {
  const cookiesList = await cookies();
  cookiesList.delete("session-yessal");
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
