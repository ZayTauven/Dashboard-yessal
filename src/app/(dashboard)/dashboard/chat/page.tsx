import { getChats } from "@/app/actions/comms";
import { ChatInterface } from "./ChatInterface";
import { cookies } from "next/headers";
import { jwtDecode } from "jwt-decode";

export default async function ChatPage() {
  const { data: chats, error } = await getChats();

  const cookiesList = await cookies();
  const token = cookiesList.get("session-yessal")?.value;
  let currentUser: any = null;

  if (token) {
    try {
      currentUser = jwtDecode(token);
    } catch (e) {}
  }
  //TODO: implementer la creation de chat et l'envoi de message
  return (
    <div className="h-[calc(100vh-140px)] p-4 max-w-7xl mx-auto flex flex-col">
      <div className="mb-4">
        <h1
          className="text-2xl font-bold tracking-tight"
          style={{ color: "var(--foreground)" }}
        >
          Messagerie Daara
        </h1>
        <p className="text-xs text-muted-foreground">
          Communiquez avec les membres de votre Daara en temps réel.
        </p>
      </div>

      <div
        className="flex-1 bg-card rounded-2xl border shadow-sm overflow-hidden flex"
        style={{ borderColor: "var(--border)" }}
      >
        {error ? (
          <div className="flex-1 flex items-center justify-center text-red-500 bg-red-50/50 p-8 text-center font-medium">
            {error}
          </div>
        ) : (
          <ChatInterface initialChats={chats || []} currentUser={currentUser} />
        )}
      </div>
    </div>
  );
}
