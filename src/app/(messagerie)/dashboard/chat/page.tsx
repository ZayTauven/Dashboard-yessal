import { getChats } from "@/app/actions/comms";
import { getProfile } from "@/app/actions/users";
import { getDirectoryUsers } from "@/app/actions/directory";
import { getDaaras } from "@/app/actions/daara";
import { ChatInterface } from "./ChatInterface";
import { ErrorAlert } from "@/components/ui/error-alert";
import { cookies } from "next/headers";
import { jwtDecode } from "jwt-decode";

export default async function ChatPage({
  searchParams,
}: {
  searchParams: Promise<{ chat?: string; with?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const [{ data: chats, error }, { data: profile }] = await Promise.all([
    getChats(),
    getProfile(),
  ]);

  const role = profile?.role as string | undefined;
  const canLoadDirectory = role === "admin" || role === "chef_daara" || role === "guide";

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
  const initialSelectedChatId = resolvedSearchParams.chat
    ? Number(resolvedSearchParams.chat)
    : null;

  /*
   * « Inviter dans un salon », depuis la fiche d'un Daara, pointait vers
   * /dashboard/chat/nouveau — une route qui n'a jamais existé : la création
   * d'un salon se fait dans une fenêtre de <ChatInterface>, pas sur un écran
   * dédié. Le bouton menait donc à une 404. Il pointe désormais ici, et
   * l'identifiant du membre ouvre la fenêtre avec lui déjà coché.
   */
  const inviteUserId = Number(resolvedSearchParams.with) || null;

  const daaraId =
    profile?.daara && typeof profile.daara === "object" && "id" in profile.daara
      ? (profile.daara as { id: number }).id
      : null;

  /*
   * Plein écran : la coque du tableau de bord n'est plus là (voir le layout
   * du groupe `(messagerie)`), la messagerie prend toute la fenêtre.
   */
  return (
    <div className="flex min-h-0 w-full flex-1">
        {error ? (
          <div className="flex-1 flex items-center justify-center p-8">
            <ErrorAlert message={error} className="max-w-md" />
          </div>
        ) : (
          <ChatInterface
            initialChats={chats || []}
            currentUserId={currentUserId}
            currentUserName={
              [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") || profile?.email || ""
            }
            currentUserAvatar={profile?.avatar ?? profile?.avatar_url ?? null}
            initialSelectedChatId={initialSelectedChatId}
            inviteUserId={inviteUserId}
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
  );
}
