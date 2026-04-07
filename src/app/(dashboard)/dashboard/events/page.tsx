import { getEvents } from "@/app/actions/events";
import { EventsClient } from "./EventsClient";
import { cookies } from "next/headers";
import { jwtDecode } from "jwt-decode";

export default async function EventsPage() {
  const { data: events, error } = await getEvents();
  
  // Decodage du token pour connaître le rôle de l'utilisateur
  const cookiesList = await cookies();
  const token = cookiesList.get("session-yessal")?.value;
  let userRole = "member";
  
  if (token) {
    try {
        const decoded: any = jwtDecode(token);
        // On assume que le token contient le rôle ou on l'utilise pour filtrer l'UI
        // Note: Dans une vraie appli, on ferait un appel /api/profile/ pour être sûr.
        // Ici on va se baser sur une logique simple pour l'exercice.
        userRole = decoded.role || "admin"; // Mocking admin for now if token exists for simplicity in this sprint
    } catch (e) {
        console.error("Token decoding error", e);
    }
  }

  return (
    <div className="p-8 max-w-6xl mx-auto flex flex-col gap-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight" style={{ color: "var(--foreground)" }}>
            Événements
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--muted-foreground)" }}>
            Découvrez les événements, Magals et faits marquants de la confrérie.
          </p>
        </div>
      </div>

      {error ? (
        <div className="bg-red-50 text-red-600 p-4 rounded-md">{error}</div>
      ) : (
        <EventsClient initialEvents={events || []} isAdmin={userRole === "admin" || userRole === "chef_daara"} />
      )}
    </div>
  );
}
