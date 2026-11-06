import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { messageForErrors } from "@/lib/api-result";

/*
 * Les pièces jointes de la messagerie, relayées telles quelles vers Django.
 *
 * Une action serveur garde tout le corps en mémoire, et le middleware ne laisse
 * passer que les 10 premiers Mo. Une route sous `/api` échappe au middleware, et
 * le flux ne fait que traverser Node : une vidéo de 100 Mo n'occupe pas 100 Mo
 * dans un conteneur limité à 768 Mo. C'est aussi ce qui donne une vraie barre de
 * progression au navigateur.
 */

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:8000";

export async function POST(request: NextRequest) {
  const token = (await cookies()).get("session-yessal")?.value;
  if (!token) {
    return NextResponse.json({ error: "Votre session a expiré. Reconnectez-vous." }, { status: 401 });
  }

  const contentType = request.headers.get("content-type");
  const contentLength = request.headers.get("content-length");
  if (!request.body || !contentType?.startsWith("multipart/form-data") || !contentLength) {
    return NextResponse.json({ error: "Envoi invalide." }, { status: 400 });
  }

  try {
    const res = await fetch(`${BACKEND_URL}/api/comms/messages/`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": contentType,
        /* Sans lui, le flux part en `Transfer-Encoding: chunked`, que Django lit
           comme un corps vide : tous les champs manquent à l'arrivée. */
        "Content-Length": contentLength,
      },
      body: request.body,
      // Exigé par Node dès que le corps de la requête est un flux.
      duplex: "half",
    } as RequestInit);

    const payload = await res.json().catch(() => ({}));
    if (!res.ok) {
      return NextResponse.json(
        { error: messageForErrors(payload, "Impossible d'envoyer le fichier.") },
        { status: res.status },
      );
    }
    return NextResponse.json(payload, { status: res.status });
  } catch (err) {
    console.error("chat/upload:", err);
    return NextResponse.json({ error: "Erreur de connexion au serveur backend." }, { status: 502 });
  }
}
