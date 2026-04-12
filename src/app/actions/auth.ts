"use server";

import { cookies } from "next/headers";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:8000";

export async function loginAction(formData: FormData) {
  const email = formData.get("email");
  const password = formData.get("password");

  if (!email || !password) {
    return { error: "Veuillez remplir tous les champs." };
  }

  try {
    const response = await fetch(`${BACKEND_URL}/api/auth/login/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
        // Renvoie l'erreur détaillée de Django (ex: compte inactif ou mauvais identifiants)
        return { error: data.detail || "Identifiants invalides." };
    }

    // On stocke le JWT comme convenu ("session-yessal") pour que le middleware le détecte
    const cookiesList = await cookies();
    cookiesList.set({
      name: "session-yessal",
      value: data.access,
      httpOnly: true,
      path: "/",
      maxAge: 60 * 60, // 1 heure (Doit matcher avec SIMPLE_JWT)
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });

    return { success: true };
  } catch (error) {
    console.error("Login Error:", error);
    return { error: "Erreur de connexion au serveur backend (Django joignable ?)." };
  }
}

export async function logoutAction() {
  const cookiesList = await cookies();
  cookiesList.delete("session-yessal");
  return { success: true };
}

export async function registerAction(formData: FormData) {
    const data = Object.fromEntries(formData);
    try {
        const res = await fetch(`${BACKEND_URL}/api/auth/register/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        const result = await res.json();
        if (!res.ok) return { error: result.detail || "Échec de l'inscription." };
        return { success: true };
    } catch (err) {
        return { error: "Erreur réseau." };
    }
}

export async function forgotPasswordAction(email: string) {
    try {
        const res = await fetch(`${BACKEND_URL}/api/auth/forgot-password/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email }),
        });
        const result = await res.json();
        if (!res.ok) return { error: result.detail || "Échec de la demande." };
        return { success: true, message: result.detail };
    } catch (err) {
        return { error: "Erreur réseau." };
    }
}
