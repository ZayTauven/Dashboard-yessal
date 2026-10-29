import { redirect } from "next/navigation";

/**
 * `/dashboard/chat/12` — l'adresse que porte le push d'un nouveau message.
 *
 * Le mobile la traduit en `/chat/12` (`usePushNavigation`) ; le web n'a
 * qu'un écran de messagerie, qui choisit son fil par `?chat=`. Un seul lien
 * pour les deux, plutôt qu'une charge de push différente par plateforme.
 */
export default async function ChatDeepLink({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const chatId = Number(id);
  redirect(Number.isFinite(chatId) && chatId > 0 ? `/dashboard/chat?chat=${chatId}` : "/dashboard/chat");
}
