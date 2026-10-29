"use client";

/**
 * La messagerie Yessal — chef d'orchestre.
 *
 * Ce fichier tenait 1 350 lignes à lui seul : la liste, le fil, le composeur,
 * les volets et le temps réel. Il ne garde que l'ÉTAT et le TEMPS RÉEL ; le
 * rendu vit dans `ConversationList`, `MessageThread`, `Composer`,
 * `ConversationInfo` et `SidePanels`.
 *
 * ── Le temps réel, canal par canal ──────────────────────────────────────────
 *
 *   private-user.{moi}     new-invitation · chat-updated (toute la liste)
 *   private-chat.{fil}     new-message · message-reaction · message-deleted · chat-read
 *   presence-chat.{fil}    qui a le fil ouvert · client-typing
 *
 * `chat-updated` est nouveau : seul le fil OUVERT écoutait jusqu'ici, si bien
 * qu'un message dans un autre salon n'apparaissait qu'au rechargement de la
 * page — pastille comprise.
 *
 * ── L'envoi optimiste ───────────────────────────────────────────────────────
 *
 * La bulle part dans le fil AVANT la réponse du serveur, marquée « en cours ».
 * L'ancien champ se vidait puis rien ne se passait pendant l'aller-retour :
 * sur une connexion de Dakar, une à deux secondes pendant lesquelles on se
 * demandait si le message était parti — et on le renvoyait.
 */
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import Pusher from "pusher-js";
import { toast } from "sonner";
import { ArrowLeft, BellOff, Hash, Info, MessageSquare, Search, Settings, Shield, UserCheck } from "lucide-react";
import { useConfirm } from "@/components/vireo/ConfirmDialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  addChatMembers,
  createChat,
  createInvitation,
  deleteMessage,
  getChatMembers,
  getChats,
  getInvitations,
  getMessagesPage,
  getMessagingPreferences,
  getPilotageConfig,
  getPusherAuthSignature,
  leaveChat,
  markChatAsRead,
  respondToInvitation,
  searchMembers,
  sendChatMessage,
  toggleChatMute,
  toggleMessageReaction,
  updateMessagingPreferences,
  updatePilotageConfig,
  type ChatInviteMode,
} from "@/app/actions/comms";
import { Composer } from "./Composer";
import { ConversationInfo } from "./ConversationInfo";
import { ConversationList, sortByActivity } from "./ConversationList";
import { MessageThread } from "./MessageThread";
import { InvitesPanel, PilotagePanel, SearchPanel, SettingsPanel } from "./SidePanels";
import { initials, roleLabel } from "./format";
import type {
  ChatInvitationRow,
  ChatMember,
  ChatRow,
  ChatUpdatedEvent,
  DaaraOption,
  DirectorySearchUser,
  ManualPickUser,
  MessageRow,
  MessagingPreferences,
  PilotageConfig,
  PresenceMember,
  Reaction,
} from "./types";

const PUSHER_KEY = process.env.NEXT_PUBLIC_PUSHER_KEY || "0369577c46baf67bfc0a";
const PUSHER_CLUSTER = process.env.NEXT_PUBLIC_PUSHER_CLUSTER || "eu";

/** On renvoie « écrit » au plus toutes les 3 s, et on l'éteint après 2,5 s de silence. */
const TYPING_THROTTLE_MS = 3000;
const TYPING_IDLE_MS = 2500;
/** Un « écrit… » reçu s'efface seul s'il n'est pas renouvelé (onglet fermé, réseau coupé). */
const TYPING_EXPIRE_MS = 6000;

const CHEF_MODES: { value: ChatInviteMode; label: string }[] = [
  { value: "manual", label: "Choisir des membres manuellement" },
  { value: "daara_all", label: "Tout le Daara (membres, coordinateur, collecteurs)" },
  { value: "daara_members", label: "Membres du Daara uniquement" },
  { value: "daara_collectors", label: "Collecteurs du Daara" },
  { value: "daara_chefs", label: "Coordinateurs du Daara (votre Daara)" },
];

const ADMIN_MODES: { value: ChatInviteMode; label: string }[] = [
  { value: "manual", label: "Choisir des personnes manuellement" },
  { value: "daara_all", label: "Un Daara entier (tous rôles communautaires)" },
  { value: "daara_members", label: "Membres d'un Daara" },
  { value: "daara_collectors", label: "Collecteurs d'un Daara" },
  { value: "daara_chefs", label: "Coordinateurs d'un Daara" },
  { value: "global_chefs", label: "Tous les coordinateurs de Daara (plateforme)" },
  { value: "global_collectors", label: "Tous les collecteurs (plateforme)" },
];

function needsPresetDaara(mode: ChatInviteMode) {
  return mode === "daara_all" || mode === "daara_members" || mode === "daara_collectors" || mode === "daara_chefs";
}

type Panel = "chats" | "search" | "invites" | "pilotage" | "settings";

type PresenceMembers = { each: (fn: (m: { id: string; info: PresenceMember }) => void) => void };
type PresenceChannel = {
  bind: (event: string, handler: (payload: never) => void) => void;
  trigger: (event: string, data: unknown) => boolean;
};

function applyReaction(reactions: Reaction[] = [], emoji: string, add: boolean, mine: boolean): Reaction[] {
  const next = reactions.map((r) => ({ ...r }));
  const i = next.findIndex((r) => r.emoji === emoji);
  if (add) {
    if (i >= 0) {
      next[i].count += 1;
      if (mine) next[i].reacted_by_me = true;
    } else next.push({ emoji, count: 1, reacted_by_me: mine });
  } else if (i >= 0) {
    next[i].count -= 1;
    if (mine) next[i].reacted_by_me = false;
    if (next[i].count <= 0) next.splice(i, 1);
  }
  return next;
}

export function ChatInterface({
  initialChats,
  currentUserId,
  currentUserName = "",
  currentUserAvatar = null,
  initialSelectedChatId,
  inviteUserId = null,
  daaraId,
  viewerRole = "member",
  directoryUsers = [],
  daarasForSelect = [],
}: {
  initialChats: ChatRow[];
  currentUserId: number;
  currentUserName?: string;
  currentUserAvatar?: string | null;
  initialSelectedChatId?: number | null;
  /** Membre à pré-cocher dans la fenêtre de création (lien « Inviter »). */
  inviteUserId?: number | null;
  daaraId?: number | null;
  viewerRole?: string;
  directoryUsers?: ManualPickUser[];
  daarasForSelect?: DaaraOption[];
}) {
  const canCreateSalon = viewerRole === "admin" || viewerRole === "chef_daara";
  const isAdmin = viewerRole === "admin";
  const { ask, dialog } = useConfirm();

  const [panel, setPanel] = useState<Panel>("chats");
  /** Sous 768 px, la liste et le fil ne tiennent pas côte à côte. */
  const [mobileView, setMobileView] = useState<"list" | "thread">(initialSelectedChatId ? "thread" : "list");
  const [showInfo, setShowInfo] = useState(false);

  const [chatList, setChatList] = useState<ChatRow[]>(() => sortByActivity(initialChats));
  const [selectedId, setSelectedId] = useState<number | null>(
    () =>
      initialChats.find((c) => Number(c.id) === Number(initialSelectedChatId))?.id ??
      sortByActivity(initialChats)[0]?.id ??
      null,
  );
  const selectedChat = useMemo(() => chatList.find((c) => c.id === selectedId) ?? null, [chatList, selectedId]);
  const selectedIdRef = useRef<number | null>(selectedId);
  useEffect(() => {
    selectedIdRef.current = selectedId;
  }, [selectedId]);

  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [loadingThread, setLoadingThread] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [members, setMembers] = useState<ChatMember[]>([]);
  const [unreadMark, setUnreadMark] = useState<{ fromId: number | null; count: number }>({ fromId: null, count: 0 });
  const [replyingTo, setReplyingTo] = useState<MessageRow | null>(null);

  const [onlineMembers, setOnlineMembers] = useState<Record<string, PresenceMember>>({});
  const [typingUsers, setTypingUsers] = useState<Record<string, { name: string; at: number }>>({});
  const lastTypingSentRef = useRef(0);
  const typingIdleRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const markReadTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pusherRef = useRef<Pusher | null>(null);
  const presenceRef = useRef<PresenceChannel | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [searchResult, setSearchResult] = useState<DirectorySearchUser[]>([]);
  const [invitations, setInvitations] = useState<ChatInvitationRow[]>([]);
  const [preferences, setPreferences] = useState<MessagingPreferences | null>(null);
  const [pilotage, setPilotage] = useState<PilotageConfig | null>(null);
  const [infoBusy, setInfoBusy] = useState(false);

  const [isPending, startTransition] = useTransition();
  const [newOpen, setNewOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [inviteMode, setInviteMode] = useState<ChatInviteMode>("manual");
  const [presetDaaraId, setPresetDaaraId] = useState<string>("");
  const [manualIds, setManualIds] = useState<number[]>([]);
  const [createError, setCreateError] = useState("");
  const [manualSearch, setManualSearch] = useState("");

  const modeOptions = isAdmin ? ADMIN_MODES : CHEF_MODES;

  // ─── Chargements annexes ──────────────────────────────────────────────
  const loadPreferences = useCallback(async () => {
    const res = await getMessagingPreferences();
    if (res.data) setPreferences(res.data);
  }, []);
  const loadInvitations = useCallback(async () => {
    const res = await getInvitations();
    if (res.data) setInvitations(res.data);
  }, []);
  const loadPilotage = useCallback(async () => {
    const res = await getPilotageConfig(daaraId || undefined);
    if (res.data) setPilotage(res.data);
  }, [daaraId]);
  const reloadChats = useCallback(async () => {
    const res = await getChats();
    if (res.data) setChatList(sortByActivity(res.data as ChatRow[]));
  }, []);

  useEffect(() => {
    loadPreferences();
    loadInvitations();
    loadPilotage();
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [loadPreferences, loadInvitations, loadPilotage]);

  const patchChat = useCallback((id: number, patch: Partial<ChatRow> | ((c: ChatRow) => Partial<ChatRow>)) => {
    setChatList((rows) =>
      sortByActivity(rows.map((c) => (c.id === id ? { ...c, ...(typeof patch === "function" ? patch(c) : patch) } : c))),
    );
  }, []);

  const markRead = useCallback(
    (chatId: number) => {
      patchChat(chatId, { unread_count: 0 });
      markChatAsRead(String(chatId));
    },
    [patchChat],
  );

  // ─── Pusher : connexion et canal personnel ────────────────────────────
  useEffect(() => {
    const pusher = new Pusher(PUSHER_KEY, {
      cluster: PUSHER_CLUSTER,
      channelAuthorization: {
        customHandler: async ({ channelName, socketId }, callback) => {
          try {
            const res = (await getPusherAuthSignature(channelName, socketId)) as { auth?: string; channel_data?: string };
            if (typeof res.auth === "string") callback(null, { auth: res.auth, channel_data: res.channel_data });
            else callback(new Error("Pusher auth failed"), null);
          } catch (e) {
            callback(e as Error, null);
          }
        },
      },
    });
    pusherRef.current = pusher;

    const userChannel = pusher.subscribe(`private-user.${currentUserId}`);
    userChannel.bind("new-invitation", () => {
      loadInvitations();
      toast("Nouvelle demande de discussion", { description: "Ouvrez l'onglet Demandes pour répondre." });
    });
    userChannel.bind("chat-updated", (data: ChatUpdatedEvent) => {
      setChatList((rows) => {
        const row = rows.find((c) => c.id === data.chat_id);
        if (!row) {
          // Un salon où l'on vient d'être ajouté : on recharge la liste.
          void reloadChats();
          return rows;
        }
        const mine = data.last_message.sender_id === currentUserId;
        const open = selectedIdRef.current === data.chat_id && document.visibilityState === "visible";
        return sortByActivity(
          rows.map((c) =>
            c.id === data.chat_id
              ? {
                  ...c,
                  last_message: { ...data.last_message, is_mine: mine },
                  last_activity_at: data.last_message.sent_at,
                  unread_count: mine || open ? 0 : (c.unread_count ?? 0) + 1,
                }
              : c,
          ),
        );
      });
    });

    return () => {
      pusher.unsubscribe(`private-user.${currentUserId}`);
      pusher.disconnect();
      pusherRef.current = null;
    };
  }, [currentUserId, loadInvitations, reloadChats]);

  // ─── Ouverture d'une conversation ─────────────────────────────────────
  useEffect(() => {
    if (!selectedId) return;
    let active = true;
    const startingUnread = chatList.find((c) => c.id === selectedId)?.unread_count ?? 0;

    setMessages([]);
    setMembers([]);
    setReplyingTo(null);
    setHasMore(false);
    setLoadingThread(true);
    setUnreadMark({ fromId: null, count: 0 });

    (async () => {
      const [page, mem] = await Promise.all([getMessagesPage(selectedId), getChatMembers(String(selectedId))]);
      if (!active) return;
      const rows = (page.data as MessageRow[]) ?? [];
      if (page.error) toast.error(page.error);
      setMessages(rows);
      setHasMore(page.hasMore);
      setMembers((mem.data as ChatMember[]) ?? []);
      setLoadingThread(false);

      /* Le repère « non lus » se pose avant le premier message reçu non lu. */
      if (startingUnread > 0) {
        let left = startingUnread;
        let fromId: number | null = null;
        for (let i = rows.length - 1; i >= 0 && left > 0; i--) {
          const m = rows[i];
          if (m.message_type !== "system" && m.sender.id !== currentUserId && !m.is_deleted) {
            fromId = m.id;
            left--;
          }
        }
        setUnreadMark({ fromId, count: startingUnread });
      }
      markRead(selectedId);
    })();

    return () => {
      active = false;
    };
    // `chatList` est lu une fois à l'ouverture, pour le compte de non-lus ; le suivre rechargerait le fil à chaque message.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, currentUserId, markRead]);

  // ─── Canaux du fil ouvert ─────────────────────────────────────────────
  useEffect(() => {
    if (!selectedId) return;
    const pusher = pusherRef.current;
    if (!pusher) return;
    const chatId = selectedId;

    const msgChannel = pusher.subscribe(`private-chat.${chatId}`);
    msgChannel.bind("new-message", (data: MessageRow) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === data.id)) return prev;
        /* Mon propre message peut arriver par Pusher avant la réponse HTTP :
           il remplace alors sa bulle optimiste au lieu de la doubler. */
        if (data.sender?.id === currentUserId) {
          const idx = prev.findIndex(
            (m) => m.local?.status === "sending" && m.content === data.content && m.message_type === data.message_type,
          );
          if (idx >= 0) {
            const next = [...prev];
            if (next[idx].local?.previewUrl) URL.revokeObjectURL(next[idx].local!.previewUrl!);
            next[idx] = data;
            return next;
          }
        }
        return [...prev, data];
      });
      setTypingUsers((prev) => {
        const next = { ...prev };
        delete next[String(data.sender?.id)];
        return next;
      });
      if (data.sender?.id !== currentUserId) {
        if (markReadTimeoutRef.current) clearTimeout(markReadTimeoutRef.current);
        markReadTimeoutRef.current = setTimeout(() => {
          if (document.visibilityState === "visible") markRead(chatId);
        }, 700);
      }
    });
    msgChannel.bind(
      "message-reaction",
      (data: { message_id: number; emoji: string; user_id: number; action: "add" | "remove" }) => {
        // Les miennes sont déjà appliquées, de façon optimiste.
        if (data.user_id === currentUserId) return;
        setMessages((prev) =>
          prev.map((m) =>
            m.id === data.message_id ? { ...m, reactions: applyReaction(m.reactions, data.emoji, data.action === "add", false) } : m,
          ),
        );
      },
    );
    msgChannel.bind("message-deleted", (data: { message_id: number }) => {
      setMessages((prev) =>
        prev.map((m) => (m.id === data.message_id ? { ...m, is_deleted: true, content: "Message supprimé", file_url: null } : m)),
      );
    });
    msgChannel.bind("chat-read", (data: { user_id: number; read_at: string }) => {
      if (data.user_id !== currentUserId) patchChat(chatId, { peer_last_read_at: data.read_at });
    });

    const presence = pusher.subscribe(`presence-chat.${chatId}`) as unknown as PresenceChannel;
    presenceRef.current = presence;
    presence.bind("pusher:subscription_succeeded", ((members: PresenceMembers) => {
      const active: Record<string, PresenceMember> = {};
      members.each((m) => {
        if (!m.info?.hidden) active[m.id] = m.info;
      });
      setOnlineMembers(active);
    }) as never);
    presence.bind("pusher:member_added", ((m: { id: string; info: PresenceMember }) => {
      if (!m.info?.hidden) setOnlineMembers((prev) => ({ ...prev, [m.id]: m.info }));
    }) as never);
    presence.bind("pusher:member_removed", ((m: { id: string }) => {
      setOnlineMembers((prev) => {
        const next = { ...prev };
        delete next[m.id];
        return next;
      });
      setTypingUsers((prev) => {
        const next = { ...prev };
        delete next[m.id];
        return next;
      });
    }) as never);
    presence.bind("client-typing", ((data: { user_id: number; name: string; typing: boolean }) => {
      if (data.user_id === currentUserId) return;
      setTypingUsers((prev) => {
        const next = { ...prev };
        if (data.typing) next[String(data.user_id)] = { name: data.name, at: Date.now() };
        else delete next[String(data.user_id)];
        return next;
      });
    }) as never);

    return () => {
      /* Au démontage, la connexion est déjà coupée par l'effet du canal
         personnel : se désabonner d'un socket fermé ne fait que salir la
         console. */
      if (pusherRef.current === pusher) {
        pusher.unsubscribe(`private-chat.${chatId}`);
        pusher.unsubscribe(`presence-chat.${chatId}`);
      }
      presenceRef.current = null;
      setTypingUsers({});
      setOnlineMembers({});
      if (markReadTimeoutRef.current) {
        clearTimeout(markReadTimeoutRef.current);
        markReadTimeoutRef.current = null;
      }
    };
  }, [selectedId, currentUserId, markRead, patchChat]);

  /* Les « écrit… » orphelins s'éteignent seuls. */
  useEffect(() => {
    if (Object.keys(typingUsers).length === 0) return;
    const t = setInterval(() => {
      setTypingUsers((prev) => {
        const now = Date.now();
        const next = Object.fromEntries(Object.entries(prev).filter(([, v]) => now - v.at < TYPING_EXPIRE_MS));
        return Object.keys(next).length === Object.keys(prev).length ? prev : next;
      });
    }, 1500);
    return () => clearInterval(t);
  }, [typingUsers]);

  /* Revenir sur l'onglet, c'est lire ce qui est arrivé entre-temps. */
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible" && selectedIdRef.current) {
        const row = chatList.find((c) => c.id === selectedIdRef.current);
        if (row?.unread_count) markRead(row.id);
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [chatList, markRead]);

  // ─── Actions du fil ───────────────────────────────────────────────────
  const loadOlder = useCallback(async () => {
    if (!selectedId || loadingOlder || !hasMore) return;
    const oldest = messages.find((m) => !m.local);
    if (!oldest) return;
    setLoadingOlder(true);
    const page = await getMessagesPage(selectedId, oldest.id);
    if (selectedIdRef.current === selectedId) {
      setMessages((prev) => [...((page.data as MessageRow[]) ?? []), ...prev]);
      setHasMore(page.hasMore);
    }
    setLoadingOlder(false);
  }, [selectedId, loadingOlder, hasMore, messages]);

  const pushTyping = useCallback(() => {
    const presence = presenceRef.current;
    if (!presence) return;
    const now = Date.now();
    const firstName = currentUserName.split(" ")[0] || "Quelqu'un";
    if (now - lastTypingSentRef.current > TYPING_THROTTLE_MS) {
      lastTypingSentRef.current = now;
      presence.trigger("client-typing", { user_id: currentUserId, name: firstName, typing: true });
    }
    if (typingIdleRef.current) clearTimeout(typingIdleRef.current);
    typingIdleRef.current = setTimeout(() => {
      lastTypingSentRef.current = 0;
      presenceRef.current?.trigger("client-typing", { user_id: currentUserId, name: firstName, typing: false });
    }, TYPING_IDLE_MS);
  }, [currentUserId, currentUserName]);

  const deliver = useCallback(
    (chatId: number, local: MessageRow) => {
      const formData = new FormData();
      formData.append("chat", String(chatId));
      formData.append("content", local.content);
      if (local.local?.file) formData.append("file", local.local.file);
      if (local.reply_to) formData.append("reply_to", String(local.reply_to));

      startTransition(async () => {
        const res = await sendChatMessage(formData);
        if (res.error) {
          toast.error(res.error);
          setMessages((prev) => prev.map((m) => (m.id === local.id ? { ...m, local: { ...m.local!, status: "failed" } } : m)));
          return;
        }
        const saved = res.data as MessageRow;
        setMessages((prev) => {
          const already = prev.some((m) => m.id === saved.id);
          const next = already ? prev.filter((m) => m.id !== local.id) : prev.map((m) => (m.id === local.id ? saved : m));
          return next;
        });
        if (local.local?.previewUrl) URL.revokeObjectURL(local.local.previewUrl);
      });
    },
    [],
  );

  const handleSend = (text: string, file: File | null) => {
    if (!selectedChat) return;
    if (typingIdleRef.current) clearTimeout(typingIdleRef.current);
    lastTypingSentRef.current = 0;
    presenceRef.current?.trigger("client-typing", { user_id: currentUserId, name: "", typing: false });

    const now = new Date().toISOString();
    const isImage = !!file && file.type.startsWith("image/");
    const local: MessageRow = {
      id: -Date.now(),
      chat: selectedChat.id,
      sender: { id: currentUserId, name: currentUserName || "Moi", avatar: currentUserAvatar },
      message_type: file ? "file" : "text",
      content: text,
      file_name: file?.name ?? null,
      file_size: file?.size ?? null,
      file_is_image: isImage,
      reply_to: replyingTo?.id ?? null,
      reply_preview: replyingTo
        ? {
            id: replyingTo.id,
            sender_name: replyingTo.sender.name,
            content: replyingTo.message_type === "file" ? `Pièce jointe : ${replyingTo.file_name ?? ""}` : replyingTo.content,
            message_type: replyingTo.message_type,
            is_deleted: replyingTo.is_deleted,
          }
        : null,
      reactions: [],
      is_deleted: false,
      sent_at: now,
      local: { status: "sending", file, previewUrl: isImage && file ? URL.createObjectURL(file) : null },
    };
    setMessages((prev) => [...prev, local]);
    setReplyingTo(null);
    setUnreadMark({ fromId: null, count: 0 });
    patchChat(selectedChat.id, {
      last_message: {
        content: file ? `Pièce jointe : ${file.name}` : text,
        sent_at: now,
        sender_name: currentUserName,
        sender_id: currentUserId,
        is_mine: true,
      },
      last_activity_at: now,
    });
    deliver(selectedChat.id, local);
  };

  const handleRetry = (m: MessageRow) => {
    if (!selectedChat) return;
    const again: MessageRow = { ...m, sent_at: new Date().toISOString(), local: { ...m.local!, status: "sending" } };
    setMessages((prev) => [...prev.filter((x) => x.id !== m.id), again]);
    deliver(selectedChat.id, again);
  };

  const handleReact = async (m: MessageRow, emoji: string) => {
    const mineAlready = m.reactions?.find((r) => r.emoji === emoji)?.reacted_by_me ?? false;
    setMessages((prev) =>
      prev.map((x) => (x.id === m.id ? { ...x, reactions: applyReaction(x.reactions, emoji, !mineAlready, true) } : x)),
    );
    const res = await toggleMessageReaction(m.id, emoji);
    if (res.error) {
      toast.error(res.error);
      setMessages((prev) =>
        prev.map((x) => (x.id === m.id ? { ...x, reactions: applyReaction(x.reactions, emoji, mineAlready, true) } : x)),
      );
    }
  };

  const handleDelete = (m: MessageRow) => {
    ask({
      title: "Supprimer ce message ?",
      description: "Les autres participants verront « Message supprimé » à sa place. La pièce jointe est effacée.",
      confirmLabel: "Supprimer",
      onConfirm: async () => {
        const res = await deleteMessage(m.id);
        if (res.error) toast.error(res.error);
        else
          setMessages((prev) =>
            prev.map((x) => (x.id === m.id ? { ...x, is_deleted: true, content: "Message supprimé", file_url: null } : x)),
          );
      },
    });
  };

  // ─── Conversation : sourdine, départ, ajout ───────────────────────────
  const handleToggleMute = async () => {
    if (!selectedChat) return;
    setInfoBusy(true);
    const res = await toggleChatMute(selectedChat.id);
    setInfoBusy(false);
    if (res.error) return toast.error(res.error);
    const muted = Boolean((res.data as { is_muted?: boolean })?.is_muted);
    patchChat(selectedChat.id, { is_muted: muted });
    toast.success(muted ? "Conversation en sourdine." : "Notifications réactivées.");
  };

  const handleLeave = () => {
    if (!selectedChat) return;
    const chat = selectedChat;
    ask({
      title: `Quitter « ${chat.display_name} » ?`,
      description: "Vous ne recevrez plus ses messages. Pour y revenir, il faudra qu'un coordinateur vous y ajoute.",
      confirmLabel: "Quitter le salon",
      onConfirm: async () => {
        const res = await leaveChat(chat.id);
        if (res.error) return void toast.error(res.error);
        setChatList((rows) => rows.filter((c) => c.id !== chat.id));
        setSelectedId(null);
        setShowInfo(false);
        setMobileView("list");
        toast.success("Vous avez quitté le salon.");
      },
    });
  };

  const handleAddMembers = async (ids: number[]) => {
    if (!selectedChat) return false;
    setInfoBusy(true);
    const res = await addChatMembers(selectedChat.id, ids);
    setInfoBusy(false);
    if (res.error) {
      toast.error(res.error);
      return false;
    }
    const added = (res.data as { added?: number })?.added ?? 0;
    toast.success(added > 1 ? `${added} membres ajoutés.` : added === 1 ? "Membre ajouté." : "Déjà présents.");
    const mem = await getChatMembers(String(selectedChat.id));
    setMembers((mem.data as ChatMember[]) ?? []);
    patchChat(selectedChat.id, (c) => ({ members_count: (c.members_count ?? 0) + added }));
    return true;
  };

  // ─── Volets secondaires ───────────────────────────────────────────────
  const handleSearchMembers = (q: string) => {
    setSearchTerm(q);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    if (q.trim().length < 2) return setSearchResult([]);
    searchTimeoutRef.current = setTimeout(async () => {
      const res = await searchMembers(q);
      if (res.data) setSearchResult(res.data);
    }, 250);
  };

  const handleSendInvite = async (userId: number) => {
    const res = await createInvitation(userId);
    if (res.error) return toast.error(res.error);
    toast.success("Demande envoyée.", { description: "La discussion s'ouvrira dès qu'elle sera acceptée." });
    loadInvitations();
  };

  const openChat = (chat: ChatRow) => {
    setSelectedId(chat.id);
    setPanel("chats");
    setMobileView("thread");
    setShowInfo(false);
  };

  const handleRespondInvite = async (inviteId: number, accept: boolean) => {
    const res = await respondToInvitation(inviteId, accept);
    if (res.error) return toast.error(res.error);
    loadInvitations();
    const chatsRes = await getChats();
    if (chatsRes.data) setChatList(sortByActivity(chatsRes.data as ChatRow[]));
    const accepted = res.data as { chat?: ChatRow } | undefined;
    if (accept && accepted?.chat) openChat(accepted.chat);
  };

  const handlePrefChange = async (key: string, value: string | boolean) => {
    setPreferences((p) => ({ ...p, [key]: value }));
    const res = await updateMessagingPreferences({ [key]: value });
    if (res.error) {
      toast.error(res.error);
      loadPreferences();
    }
  };

  const handlePilotageChange = async (key: string, value: boolean) => {
    const updated = { ...pilotage, [key]: value };
    setPilotage(updated);
    const res = await updatePilotageConfig({ ...updated, daara: daaraId || null });
    if (res.error) {
      toast.error(res.error);
      loadPilotage();
    }
  };

  // ─── Création de salon ────────────────────────────────────────────────
  const inviteHandled = useRef(false);
  useEffect(() => {
    if (inviteHandled.current || !inviteUserId || !canCreateSalon) return;
    inviteHandled.current = true;
    setInviteMode("manual");
    setManualIds([inviteUserId]);
    setNewOpen(true);
  }, [inviteUserId, canCreateSalon]);

  const resetCreateForm = () => {
    setNewName("");
    setInviteMode("manual");
    setPresetDaaraId("");
    setManualIds([]);
    setManualSearch("");
    setCreateError("");
  };

  const handleCreateChat = () => {
    setCreateError("");
    const name = newName.trim();
    if (!name) return setCreateError("Indiquez un nom pour le salon.");
    if (isAdmin && needsPresetDaara(inviteMode) && !presetDaaraId)
      return setCreateError("Sélectionnez le Daara cible pour ce mode d'invitation.");
    startTransition(async () => {
      const res = await createChat({
        name,
        invite_mode: inviteMode,
        daara_id: daaraId || undefined,
        preset_daara_id: presetDaaraId ? Number(presetDaaraId) : undefined,
        manual_user_ids: inviteMode === "manual" && manualIds.length ? manualIds : undefined,
      });
      if (res.error) return setCreateError(res.error);
      setNewOpen(false);
      resetCreateForm();
      const chatsRes = await getChats();
      if (chatsRes.data) {
        const rows = sortByActivity(chatsRes.data as ChatRow[]);
        setChatList(rows);
        const created = (res as { data?: { id?: number } }).data;
        const target = rows.find((c) => c.id === created?.id) ?? rows.find((c) => c.display_name === name);
        if (target) openChat(target);
      }
      toast.success(`Salon « ${name} » créé.`);
    });
  };

  // ─── Dérivés d'affichage ──────────────────────────────────────────────
  const pickableUsers = directoryUsers.filter((u) => u.id !== currentUserId && u.role !== "admin");
  const pendingIncoming = invitations.filter((i) => i.status === "pending" && Number(i.recipient.id) === Number(currentUserId));
  const totalUnread = chatList.reduce((acc, c) => acc + (c.is_muted ? 0 : c.unread_count || 0), 0);
  const onlineIds = useMemo(() => new Set(Object.keys(onlineMembers).map(Number)), [onlineMembers]);
  const typingNames = Object.values(typingUsers).map((t) => t.name);
  const isGroup = selectedChat?.chat_type === "group";
  const peer = !isGroup ? members.find((m) => m.id !== currentUserId) : null;
  const canManage = Boolean(
    selectedChat && isGroup && (canCreateSalon || selectedChat.created_by === currentUserId),
  );

  const status = (() => {
    if (!selectedChat) return "";
    if (typingNames.length) return typingNames.length === 1 ? `${typingNames[0]} écrit…` : "plusieurs personnes écrivent…";
    if (isGroup) {
      const here = [...onlineIds].filter((id) => id !== currentUserId).length;
      const count = members.length || selectedChat.members_count || 0;
      return `${count} membre${count > 1 ? "s" : ""}${here ? ` · ${here} dans le salon` : ""}`;
    }
    if (peer && onlineIds.has(peer.id)) return "Dans la conversation";
    return [roleLabel(peer?.role), peer?.daara_name].filter(Boolean).join(" · ");
  })();
  const statusLive = typingNames.length > 0 || (!isGroup && !!peer && onlineIds.has(peer.id));

  const rail: { tab: Panel; icon: React.ReactNode; label: string; badge?: number }[] = [
    { tab: "chats", icon: <MessageSquare size={20} />, label: "Discussions", badge: totalUnread },
    { tab: "search", icon: <Search size={20} />, label: "Écrire à un membre" },
    { tab: "invites", icon: <UserCheck size={20} />, label: "Demandes", badge: pendingIncoming.length },
    ...(canCreateSalon ? [{ tab: "pilotage" as const, icon: <Shield size={20} />, label: "Pilotage" }] : []),
    { tab: "settings", icon: <Settings size={20} />, label: "Réglages" },
  ];

  // ═══════════════════════════════════════════════════════════════
  //  RENDU
  // ═══════════════════════════════════════════════════════════════
  return (
    <div className="relative flex h-full min-h-0 flex-1 flex-col overflow-hidden md:flex-row">
      {/* ── Rail ─────────────────────────────────────────────────── */}
      <nav
        aria-label="Sections de la messagerie"
        className={`${mobileView === "thread" ? "hidden md:flex" : "flex"} shrink-0 items-center gap-1 border-b bg-card px-2 py-1.5 md:w-[68px] md:flex-col md:border-b-0 md:border-r md:px-2 md:py-4`}
      >
        {rail.map(({ tab, icon, label, badge }) => {
          const active = panel === tab;
          return (
            <button
              key={tab}
              type="button"
              onClick={() => setPanel(tab)}
              title={label}
              aria-label={label}
              aria-current={active ? "page" : undefined}
              className={`relative flex h-11 w-11 items-center justify-center rounded-xl transition-colors md:w-full ${
                active ? "text-white" : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
              } ${tab === "settings" ? "md:mt-auto" : ""}`}
              style={active ? { background: "var(--ax-accent)" } : undefined}
            >
              {icon}
              {badge ? (
                <span className="ax-badge-count absolute right-1 top-1">{badge > 9 ? "9+" : badge}</span>
              ) : null}
            </button>
          );
        })}
      </nav>

      {/* ── Colonne de gauche ───────────────────────────────────────── */}
      <section
        className={`${mobileView === "thread" ? "hidden md:flex" : "flex"} min-h-0 w-full flex-1 flex-col border-r bg-card md:w-[320px] md:flex-none`}
      >
        {panel === "chats" && (
          <ConversationList
            chats={chatList}
            selectedId={selectedId}
            typingByChat={selectedId ? { [selectedId]: typingNames.length > 0 } : {}}
            canCreateSalon={canCreateSalon}
            onSelect={openChat}
            onCreateSalon={() => {
              resetCreateForm();
              setNewOpen(true);
            }}
            onFindMember={() => setPanel("search")}
          />
        )}
        {panel === "search" && (
          <SearchPanel
            term={searchTerm}
            results={searchResult}
            chats={chatList}
            invitations={invitations}
            currentUserId={currentUserId}
            onSearch={handleSearchMembers}
            onInvite={handleSendInvite}
            onOpenChat={openChat}
          />
        )}
        {panel === "invites" && <InvitesPanel invitations={pendingIncoming} onRespond={handleRespondInvite} />}
        {panel === "pilotage" && pilotage && <PilotagePanel pilotage={pilotage} onChange={handlePilotageChange} />}
        {panel === "settings" && preferences && (
          <SettingsPanel preferences={preferences} pilotage={pilotage} onChange={handlePrefChange} />
        )}
      </section>

      {/* ── Fil ──────────────────────────────────────────────────────── */}
      <main
        className={`${mobileView === "list" ? "hidden md:flex" : "flex"} min-h-0 min-w-0 flex-1 flex-col bg-background`}
        aria-label={selectedChat ? `Conversation : ${selectedChat.display_name}` : "Conversation"}
      >
        {!selectedChat ? (
          <div className="yc-thread flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
            <div
              className="flex h-16 w-16 items-center justify-center rounded-2xl"
              style={{ background: "color-mix(in srgb, var(--ax-accent) 12%, transparent)" }}
            >
              <MessageSquare size={30} style={{ color: "var(--ax-accent)" }} aria-hidden />
            </div>
            <div>
              <h3 className="text-lg font-bold">Vos échanges, au même endroit</h3>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                Choisissez une discussion à gauche, ou écrivez à un membre de votre Daara.
              </p>
            </div>
            <button type="button" className="ax-btn ax-btn--primary" onClick={() => setPanel("search")}>
              <span className="ax-btn__label">Écrire à un membre</span>
            </button>
          </div>
        ) : (
          <>
            <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-card px-2 sm:px-4">
              <button
                type="button"
                className="ax-btn ax-btn--ghost ax-btn--icon md:hidden"
                onClick={() => setMobileView("list")}
                aria-label="Revenir aux discussions"
              >
                <ArrowLeft size={18} aria-hidden />
              </button>
              <button
                type="button"
                onClick={() => setShowInfo((s) => !s)}
                className="flex min-w-0 flex-1 items-center gap-3 rounded-xl px-1.5 py-1 text-left hover:bg-muted/40"
              >
                <div className="relative shrink-0">
                  <Avatar className="h-10 w-10">
                    {selectedChat.avatar ? <AvatarImage src={selectedChat.avatar} alt="" /> : null}
                    <AvatarFallback
                      className="text-sm font-bold"
                      style={
                        isGroup
                          ? { background: "color-mix(in srgb, var(--ax-accent) 16%, var(--ax-surface))", color: "var(--ax-accent)" }
                          : { background: "var(--ax-accent)", color: "white" }
                      }
                    >
                      {isGroup ? <Hash size={18} aria-hidden /> : initials(selectedChat.display_name)}
                    </AvatarFallback>
                  </Avatar>
                  {!isGroup && peer && onlineIds.has(peer.id) && (
                    <span
                      className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full ring-2 ring-[color:var(--ax-surface)]"
                      style={{ background: "var(--ax-viz-emerald)" }}
                      aria-hidden
                    />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="truncate text-sm font-semibold">{selectedChat.display_name}</span>
                    {selectedChat.is_muted && <BellOff size={12} className="shrink-0 text-muted-foreground" aria-label="En sourdine" />}
                  </div>
                  <div
                    className={`truncate text-[11px] ${statusLive ? "font-medium" : "text-muted-foreground"}`}
                    style={statusLive ? { color: "var(--ax-accent)" } : undefined}
                  >
                    {status}
                  </div>
                </div>
              </button>
              <button
                type="button"
                className="ax-btn ax-btn--ghost ax-btn--icon"
                aria-pressed={showInfo}
                aria-label="Informations sur la conversation"
                onClick={() => setShowInfo((s) => !s)}
              >
                <Info size={18} aria-hidden />
              </button>
            </header>

            <MessageThread
              chatId={selectedChat.id}
              messages={messages}
              currentUserId={currentUserId}
              isGroup={isGroup}
              canDeleteAny={isAdmin}
              peerLastReadAt={selectedChat.peer_last_read_at}
              typingNames={typingNames}
              loading={loadingThread}
              hasMore={hasMore}
              loadingOlder={loadingOlder}
              unreadFromId={unreadMark.fromId}
              unreadCount={unreadMark.count}
              onLoadOlder={loadOlder}
              onReply={setReplyingTo}
              onReact={handleReact}
              onDelete={handleDelete}
              onRetry={handleRetry}
            />

            <Composer
              placeholder={isGroup ? "Écrire au salon…" : "Écrire un message…"}
              disabled={loadingThread}
              allowFiles={!pilotage || pilotage.allow_file_sharing !== false}
              replyingTo={replyingTo}
              onCancelReply={() => setReplyingTo(null)}
              members={isGroup ? members : []}
              currentUserId={currentUserId}
              draftKey={String(selectedChat.id)}
              onSend={handleSend}
              onTyping={pushTyping}
            />
          </>
        )}
      </main>

      {/* ── Informations ─────────────────────────────────────────────── */}
      {selectedChat && showInfo && (
        <div className="absolute inset-0 z-30 flex lg:static lg:z-auto">
          <ConversationInfo
            chat={selectedChat}
            members={members}
            onlineIds={onlineIds}
            currentUserId={currentUserId}
            canManage={canManage}
            directoryUsers={directoryUsers}
            busy={infoBusy}
            onClose={() => setShowInfo(false)}
            onToggleMute={handleToggleMute}
            onLeave={handleLeave}
            onAddMembers={handleAddMembers}
          />
        </div>
      )}

      {/* ── Création de salon ───────────────────────────────────────── */}
      <Dialog
        open={newOpen}
        onOpenChange={(o) => {
          setNewOpen(o);
          if (!o) resetCreateForm();
        }}
      >
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Créer un salon</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-1">
            <div className="space-y-1.5">
              <label htmlFor="salon-name" className="ax-field__label">
                Nom du salon
              </label>
              <input
                id="salon-name"
                className="ax-input"
                placeholder="Ex. Coordination Magal"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="invite-mode" className="ax-field__label">
                Qui y entre ?
              </label>
              <select
                id="invite-mode"
                className="ax-select"
                value={inviteMode}
                onChange={(e) => setInviteMode(e.target.value as ChatInviteMode)}
              >
                {modeOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            {isAdmin && needsPresetDaara(inviteMode) && daarasForSelect.length > 0 && (
              <div className="space-y-1.5">
                <label htmlFor="preset-daara" className="ax-field__label">
                  Daara cible
                </label>
                <select id="preset-daara" className="ax-select" value={presetDaaraId} onChange={(e) => setPresetDaaraId(e.target.value)}>
                  <option value="">Sélectionner un Daara</option>
                  {daarasForSelect.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name || `Daara #${d.id}`}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {inviteMode === "manual" && pickableUsers.length > 0 && (
              <div className="space-y-1.5">
                <span className="ax-field__label">
                  Membres à inviter{manualIds.length ? ` (${manualIds.length})` : ""}
                </span>
                <input
                  className="ax-input ax-input--sm"
                  value={manualSearch}
                  onChange={(e) => setManualSearch(e.target.value)}
                  placeholder="Filtrer les membres…"
                  aria-label="Filtrer les membres"
                />
                <ScrollArea className="h-40 rounded-xl border p-2">
                  <div className="space-y-1">
                    {pickableUsers
                      .filter((u) => {
                        const q = manualSearch.trim().toLowerCase();
                        return !q || `${u.first_name} ${u.last_name} ${u.role}`.toLowerCase().includes(q);
                      })
                      .map((u) => (
                        <label key={u.id} className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm hover:bg-muted/50">
                          <Checkbox
                            checked={manualIds.includes(u.id)}
                            onCheckedChange={() =>
                              setManualIds((prev) => (prev.includes(u.id) ? prev.filter((x) => x !== u.id) : [...prev, u.id]))
                            }
                          />
                          <span className="font-medium">
                            {u.first_name} {u.last_name}
                          </span>
                          <span className="text-[11px] text-muted-foreground">{roleLabel(u.role)}</span>
                        </label>
                      ))}
                  </div>
                </ScrollArea>
              </div>
            )}
            {createError && <p className="ax-field__message ax-field__message--error">{createError}</p>}
          </div>
          <DialogFooter className="gap-2 pt-2">
            <button type="button" className="ax-btn ax-btn--ghost" onClick={() => setNewOpen(false)}>
              <span className="ax-btn__label">Annuler</span>
            </button>
            <button type="button" className="ax-btn ax-btn--primary" disabled={isPending} onClick={handleCreateChat}>
              <span className="ax-btn__label">Créer le salon</span>
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {dialog}
    </div>
  );
}
