import { getChats } from "@/app/actions/comms";
import { getProfile } from "@/app/actions/users";
import { getDirectoryUsers } from "@/app/actions/directory";
import { getDaaras } from "@/app/actions/daara";
import { ChatInterface } from "./ChatInterface";
import { cookies } from "next/headers";
import { jwtDecode } from "jwt-decode";

export default async function ChatPage({
  searchParams,
}: {
  searchParams?: { chat?: string };
}) {
  const [{ data: chats, error }, { data: profile }] = await Promise.all([
    getChats(),
    getProfile(),
  ]);

  const role = profile?.role as string | undefined;
  const canLoadDirectory = role === "admin" || role === "chef_daara";

  let directoryUsers: unknown[] = [];
  let daarasForSelect: { id: number; name?: string }[] = [];

  if (canLoadDirectory) {
    const dir = await getDirectoryUsers();
    directoryUsers = dir.data ?? [];
  }
  if (role === "admin") {
    const da = await getDaaras();
    const raw = da.data as unknown;
    daarasForSelect = Array.isArray(raw)
      ? (raw as { id: number; name?: string }[])
      : ((raw as { results?: { id: number; name?: string }[] })?.results ??
        []);
  }

  const cookiesList = await cookies();
  const token = cookiesList.get("session-yessal")?.value;
  let jwtPayload: { user_id?: number } | null = null;
  if (token) {
    try {
      jwtPayload = jwtDecode(token) as { user_id?: number };
    } catch {
      jwtPayload = null;
    }
  }

  const currentUserId = profile?.id ?? jwtPayload?.user_id ?? 0;
  const initialSelectedChatId = searchParams?.chat
    ? Number(searchParams.chat)
    : null;

  const daaraId =
    profile?.daara && typeof profile.daara === "object" && "id" in profile.daara
      ? (profile.daara as { id: number }).id
      : null;

  return (
    <div className="h-[calc(100vh-140px)] p-4 max-w-7xl mx-auto flex flex-col">
      <div className="mb-4">
        <h1
          className="text-2xl font-bold tracking-tight"
          style={{ color: "var(--foreground)" }}
        >
          Messagerie
        </h1>
        <p className="text-xs text-muted-foreground">
          Les salons sont créés par un administrateur ou un chef de Daara ; les
          autres profils rejoignent les salons auxquels ils sont invités.
        </p>
      </div>

      <div
        className="flex-1 bg-card rounded-2xl border shadow-sm overflow-hidden flex min-h-0"
        style={{ borderColor: "var(--border)" }}
      >
        {error ? (
          <div className="flex-1 flex items-center justify-center text-red-500 bg-red-50/50 p-8 text-center font-medium">
            {error}
          </div>
        ) : (
          <ChatInterface
            initialChats={chats || []}
            currentUserId={currentUserId}
            initialSelectedChatId={initialSelectedChatId}
            daaraId={daaraId}
            viewerRole={role}
            directoryUsers={
              directoryUsers as {
                id: number;
                first_name: string;
                last_name: string;
                role: string;
              }[]
            }
            daarasForSelect={daarasForSelect}
          />
        )}
      </div>
    </div>
  );
}
