import { getChats } from "@/app/actions/comms";
import { getProfile } from "@/app/actions/users";
import { getDirectoryUsers } from "@/app/actions/directory";
import { getDaaras } from "@/app/actions/daara";
import { ChatInterface } from "./ChatInterface";
import { ErrorAlert } from "@/components/ui/error-alert";
import { PageHead } from "@/components/vireo/PageHead";
import type { Role } from "@/lib/nav";
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
   * La messagerie occupe toute la hauteur disponible : c'est le seul ecran ou
   * la liste, le fil et le panneau d'infos doivent defiler independamment. La
   * hauteur reste donc calculee, mais la carte passe sur `.ax-card` au lieu
   * d'un `bg-card rounded-2xl border` recompose a la main.
   */
  return (
    <div className="flex h-[calc(100vh-190px)] min-h-[520px] flex-col gap-4">
      <PageHead
        role={(role ?? "member") as Role}
        title="Messagerie"
        subtitle="Les salons sont créés par un administrateur ou un chef de Daara ; les autres profils rejoignent ceux auxquels ils sont invités."
      />

      <div className="ax-card flex min-h-0 flex-1 overflow-hidden">
        {error ? (
          <div className="flex-1 flex items-center justify-center p-8">
            <ErrorAlert message={error} className="max-w-md" />
          </div>
        ) : (
          <ChatInterface
            initialChats={chats || []}
            currentUserId={currentUserId}
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
    </div>
  );
}
