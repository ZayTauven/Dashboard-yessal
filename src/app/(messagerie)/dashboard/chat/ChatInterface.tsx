"use client";

/**
 * La messagerie Yessal — chef d'orchestre, en plein écran façon Discord
 * (maquette validée le 2026-10-29).
 *
 *   ┌ canaux / salons / directs ┬ fil de la conversation ┬ membres ┐
 *
 * Ce fichier ne garde que l'ÉTAT et le TEMPS RÉEL ; le rendu vit dans
 * `ChatSidebar`, `MessageThread`, `Composer`, `ConversationInfo`,
 * `ChannelCards` et `SidePanels`.
 *
 * ── Le temps réel, canal par canal ──────────────────────────────────────────
 *
 *   private-user.{moi}     new-invitation · chat-updated (salons et directs)
 *   private-kourel         chat-updated des canaux du Kourel (un seul envoi pour tous)
 *   private-chat.{fil}     new-message · message-edited · message-reaction · message-deleted · chat-read
 *   presence-chat.{fil}    qui a le fil ouvert · client-typing
 *
 * ── L'envoi optimiste ───────────────────────────────────────────────────────
 *
 * La bulle part dans le fil AVANT la réponse du serveur, marquée « en cours ».
 * Sur une connexion de Dakar, c'est ce qui évite le double envoi.
 */
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import Pusher from "pusher-js";
import { toast } from "sonner";
import { ArrowLeft, BellOff, HandHeart, Hash, Megaphone, PanelRight, Search, X } from "lucide-react";
import { useConfirm } from "@/components/vireo/ConfirmDialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  addChatMembers,
  createChat,
  createInvitation,
  deleteMessage,
  editMessage,
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
  searchMessages,
  sendChatMessage,
  setChannelAuthor,
  toggleChatMute,
  toggleMessageReaction,
  updateMessagingPreferences,
  updatePilotageConfig,
  type ChatInviteMode,
} from "@/app/actions/comms";
import { ChatSidebar, type SidebarPanel } from "./ChatSidebar";
import { Composer } from "./Composer";
import { ConversationInfo } from "./ConversationInfo";
import { MessageThread } from "./MessageThread";
import { InvitesPanel, PilotagePanel, SearchPanel, SettingsPanel } from "./SidePanels";
import { formatTime, initials, roleLabel } from "./format";
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

const PUSHER_KEY = process.env.NEXT_PUBLIC_PUSHER_KEY || "bea7b0eb7536983d2be8";
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

/** Les canaux du Kourel restent en tête ; le reste suit l'activité. */
export function sortChats(rows: ChatRow[]) {
  const at = (c: ChatRow) => new Date(c.last_message?.sent_at || c.last_activity_at || 0).getTime();
  return [...rows].sort((a, b) => at(b) - at(a));
}

function fileKind(file: File): MessageRow["file_kind"] {
  if (file.type.startsWith("image/")) return "image";
  if (file.type.startsWith("audio/")) return "audio";
  if (file.type.startsWith("video/")) return "video";
  return "document";
}

type PresenceMembers = { each: (fn: (m: { id: string; info: PresenceMember }) => void) => void };
type PresenceChannel = {
  bind: (event: string, handler: (payload: never) => void) => void;
  trigger: (event: string, data: unknown) => boolean;
};

type ReactionState = { emoji: string; count: number; user_ids: number[] };

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

  const [panel, setPanel] = useState<SidebarPanel>("chats");
  /** Sous 768 px, la colonne des canaux et le fil ne tiennent pas côte à côte. */
  const [mobileView, setMobileView] = useState<"list" | "thread">(initialSelectedChatId ? "thread" : "list");
  const [showInfo, setShowInfo] = useState(false);

  const [chatList, setChatList] = useState<ChatRow[]>(() => sortChats(initialChats));
  const [selectedId, setSelectedId] = useState<number | null>(() => {
    const wanted = initialChats.find((c) => Number(c.id) === Number(initialSelectedChatId));
    if (wanted) return wanted.id;
    /* Par défaut, la dernière conversation active hors canaux — sinon le canal du guide. */
    const sorted = sortChats(initialChats);
    return (sorted.find((c) => c.chat_type !== "channel") ?? sorted[0])?.id ?? null;
  });
  const selectedChat = useMemo(() => chatList.find((c) => c.id === selectedId) ?? null, [chatList, selectedId]);
  const selectedIdRef = useRef<number | null>(selectedId);
  useEffect(() => {
    selectedIdRef.current = selectedId;
  }, [selectedId]);

  /* Sur grand écran, le panneau des membres est ouvert d'office, comme sur la maquette. */
  useEffect(() => {
    if (window.matchMedia("(min-width: 1280px)").matches) setShowInfo(true);
  }, []);

  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [loadingThread, setLoadingThread] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [members, setMembers] = useState<ChatMember[]>([]);
  const [unreadMark, setUnreadMark] = useState<{ fromId: number | null; count: number }>({ fromId: null, count: 0 });
  const [replyingTo, setReplyingTo] = useState<MessageRow | null>(null);
  const [focusId, setFocusId] = useState<number | null>(null);
  /* Incrémenté à chaque reconnexion de Pusher : le fil ouvert se recale. */
  const [resyncTick, setResyncTick] = useState(0);

  const [threadQuery, setThreadQuery] = useState("");
  const [threadResults, setThreadResults] = useState<MessageRow[] | null>(null);
  const threadSearchRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    if (res.data) setChatList(sortChats(res.data as ChatRow[]));
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
      sortChats(rows.map((c) => (c.id === id ? { ...c, ...(typeof patch === "function" ? patch(c) : patch) } : c))),
    );
  }, []);

  const markRead = useCallback(
    (chatId: number) => {
      patchChat(chatId, { unread_count: 0 });
      markChatAsRead(String(chatId));
    },
    [patchChat],
  );

  // ─── Pusher : connexion, canal personnel et canal commun ──────────────
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

    const onChatUpdated = (data: ChatUpdatedEvent) => {
      setChatList((rows) => {
        const row = rows.find((c) => c.id === data.chat_id);
        if (!row) {
          // Un salon où l'on vient d'être ajouté : on recharge la liste.
          void reloadChats();
          return rows;
        }
        const mine = data.last_message.sender_id === currentUserId;
        const open = selectedIdRef.current === data.chat_id && document.visibilityState === "visible";
        return sortChats(
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
    };

    const userChannel = pusher.subscribe(`private-user.${currentUserId}`);
    userChannel.bind("new-invitation", () => {
      loadInvitations();
      toast("Nouvelle demande de discussion", { description: "Ouvrez les demandes pour répondre." });
    });
    userChannel.bind("chat-updated", onChatUpdated);
    /* Lu sur un autre appareil : la pastille s'éteint ici aussi. */
    userChannel.bind("chat-read", (data: { chat_id: number; user_id: number }) => {
      if (data.user_id !== currentUserId) return;
      setChatList((rows) => rows.map((c) => (c.id === data.chat_id ? { ...c, unread_count: 0 } : c)));
    });
    pusher.subscribe("private-kourel").bind("chat-updated", onChatUpdated);

    /* Après une coupure, des événements ont pu se perdre : la liste et le fil
       ouvert se rechargent. La toute première connexion n'en a pas besoin. */
    let dejaConnecte = false;
    pusher.connection.bind("connected", () => {
      if (dejaConnecte) {
        void reloadChats();
        setResyncTick((t) => t + 1);
      }
      dejaConnecte = true;
    });

    return () => {
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
    setThreadQuery("");
    setThreadResults(null);

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
          /* Par l'identifiant donné à la bulle — et, pour un événement d'un
             serveur plus ancien qui ne le renvoie pas, par le contenu. */
          const idx = prev.findIndex((m) =>
            data.client_id
              ? m.local?.clientId === data.client_id
              : m.local?.status === "sending" && m.content === data.content && m.message_type === data.message_type,
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
    msgChannel.bind("message-edited", (data: MessageRow) => {
      setMessages((prev) => prev.map((m) => (m.id === data.id ? { ...m, content: data.content, edited_at: data.edited_at } : m)));
    });
    msgChannel.bind(
      "message-reaction",
      (data: { message_id: number; emoji: string; user_id: number; action: "add" | "remove"; reactions?: ReactionState[] }) => {
        /* L'état complet, quand le serveur l'envoie : appliqué tel quel, y
           compris pour ses propres réactions faites depuis un autre appareil. */
        if (data.reactions) {
          const next = data.reactions.map((r) => ({
            emoji: r.emoji,
            count: r.count,
            reacted_by_me: r.user_ids.includes(currentUserId),
          }));
          setMessages((prev) => prev.map((m) => (m.id === data.message_id ? { ...m, reactions: next } : m)));
          return;
        }
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
    presence.bind("pusher:subscription_succeeded", ((list: PresenceMembers) => {
      const active: Record<string, PresenceMember> = {};
      list.each((m) => {
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
      if (pusherRef.current === pusher && pusher.connection.state === "connected") {
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

  /* Reconnexion : la dernière page du fil ouvert est refusionnée. */
  useEffect(() => {
    const chatId = selectedIdRef.current;
    if (!resyncTick || !chatId) return;
    let active = true;
    getMessagesPage(chatId).then((page) => {
      if (!active || selectedIdRef.current !== chatId) return;
      const fresh = (page.data as MessageRow[]) ?? [];
      setMessages((prev) => {
        const byId = new Map(prev.filter((m) => !m.local).map((m) => [m.id, m]));
        for (const m of fresh) byId.set(m.id, m);
        const pending = prev.filter((m) => m.local);
        return [...[...byId.values()].sort((a, b) => new Date(a.sent_at).getTime() - new Date(b.sent_at).getTime()), ...pending];
      });
    });
    return () => {
      active = false;
    };
  }, [resyncTick]);

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

  // ─── Recherche dans la conversation ───────────────────────────────────
  const onThreadSearch = (q: string) => {
    setThreadQuery(q);
    if (threadSearchRef.current) clearTimeout(threadSearchRef.current);
    if (!selectedId || q.trim().length < 2) return setThreadResults(null);
    const chatId = selectedId;
    threadSearchRef.current = setTimeout(async () => {
      const res = await searchMessages(chatId, q.trim());
      if (selectedIdRef.current === chatId) setThreadResults(((res.data as MessageRow[]) ?? []).slice(-30).reverse());
    }, 300);
  };

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

  const deliver = useCallback((chatId: number, local: MessageRow) => {
    const formData = new FormData();
    formData.append("chat", String(chatId));
    formData.append("content", local.content);
    if (local.local?.clientId) formData.append("client_id", local.local.clientId);
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
        return already ? prev.filter((m) => m.id !== local.id) : prev.map((m) => (m.id === local.id ? saved : m));
      });
      if (local.local?.previewUrl) URL.revokeObjectURL(local.local.previewUrl);
    });
  }, []);

  const handleSend = (text: string, file: File | null) => {
    if (!selectedChat) return;
    if (typingIdleRef.current) clearTimeout(typingIdleRef.current);
    lastTypingSentRef.current = 0;
    presenceRef.current?.trigger("client-typing", { user_id: currentUserId, name: "", typing: false });

    const now = new Date().toISOString();
    const kind = file ? fileKind(file) : null;
    const local: MessageRow = {
      id: -Date.now(),
      chat: selectedChat.id,
      sender: { id: currentUserId, name: currentUserName || "Moi", avatar: currentUserAvatar, role: viewerRole },
      message_type: file ? "file" : "text",
      content: text,
      file_name: file?.name ?? null,
      file_size: file?.size ?? null,
      file_is_image: kind === "image",
      file_kind: kind,
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
      local: {
        status: "sending",
        file,
        previewUrl: kind === "image" && file ? URL.createObjectURL(file) : null,
        clientId: `web-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      },
    };
    setMessages((prev) => [...prev, local]);
    setReplyingTo(null);
    setUnreadMark({ fromId: null, count: 0 });
    patchChat(selectedChat.id, {
      last_message: {
        content: kind === "audio" ? "Note vocale" : file ? `Pièce jointe : ${file.name}` : text,
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

  const handleEdit = async (m: MessageRow, text: string) => {
    if (text === m.content) return true;
    const res = await editMessage(m.id, text);
    if (res.error) {
      toast.error(res.error);
      return false;
    }
    const saved = res.data as MessageRow;
    setMessages((prev) => prev.map((x) => (x.id === m.id ? { ...x, content: saved.content, edited_at: saved.edited_at } : x)));
    return true;
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

  // ─── Conversation : sourdine, départ, ajout, auteurs ──────────────────
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
        setMobileView("list");
        toast.success("Vous avez quitté le salon.");
      },
    });
  };

  const reloadMembers = async (chatId: number) => {
    const mem = await getChatMembers(String(chatId));
    if (selectedIdRef.current === chatId) setMembers((mem.data as ChatMember[]) ?? []);
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
    await reloadMembers(selectedChat.id);
    patchChat(selectedChat.id, (c) => ({ members_count: (c.members_count ?? 0) + added }));
    return true;
  };

  const handleSetAuthor = async (userId: number, canPost: boolean) => {
    if (!selectedChat) return false;
    setInfoBusy(true);
    const res = await setChannelAuthor(selectedChat.id, userId, canPost);
    setInfoBusy(false);
    if (res.error) {
      toast.error(res.error);
      return false;
    }
    toast.success(canPost ? "Auteur désigné." : "Auteur retiré.");
    if (userId === currentUserId) patchChat(selectedChat.id, { can_post: canPost });
    await reloadMembers(selectedChat.id);
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
  };

  const handleRespondInvite = async (inviteId: number, accept: boolean) => {
    const res = await respondToInvitation(inviteId, accept);
    if (res.error) return toast.error(res.error);
    loadInvitations();
    const chatsRes = await getChats();
    if (chatsRes.data) setChatList(sortChats(chatsRes.data as ChatRow[]));
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
        const rows = sortChats(chatsRes.data as ChatRow[]);
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
  const onlineIds = useMemo(() => new Set(Object.keys(onlineMembers).map(Number)), [onlineMembers]);
  const typingNames = Object.values(typingUsers).map((t) => t.name);
  const isGroup = selectedChat?.chat_type === "group";
  const isChannel = selectedChat?.chat_type === "channel";
  const peer = selectedChat?.chat_type === "direct" ? members.find((m) => m.id !== currentUserId) : null;
  const canManage = Boolean(selectedChat && isGroup && (canCreateSalon || selectedChat.created_by === currentUserId));

  const subtitle = (() => {
    if (!selectedChat) return "";
    if (typingNames.length) return typingNames.length === 1 ? `${typingNames[0]} écrit…` : "plusieurs personnes écrivent…";
    if (isChannel) return selectedChat.description || "Canal du Kourel";
    if (isGroup) {
      const here = [...onlineIds].filter((id) => id !== currentUserId).length;
      const count = members.length || selectedChat.members_count || 0;
      return `${count} membre${count > 1 ? "s" : ""}${here ? ` · ${here} dans le salon` : ""}`;
    }
    if (peer && onlineIds.has(peer.id)) return "Dans la conversation";
    return [peer?.title, roleLabel(peer?.role), peer?.daara_name].filter(Boolean).join(" · ");
  })();
  const subtitleLive = typingNames.length > 0 || (!!peer && onlineIds.has(peer.id));

  const readOnlyNote =
    isChannel && !selectedChat?.can_post
      ? selectedChat?.channel_kind === "jefs"
        ? "Dans ce canal, on réagit — on ne répond pas."
        : "Seul Sangue Bi publie ici. Réagissez aux annonces."
      : null;

  const headerIcon = !selectedChat ? null : isChannel ? (
    selectedChat.channel_kind === "guide" ? (
      <Megaphone size={20} className="text-[#7954D4]" aria-hidden />
    ) : (
      <HandHeart size={20} className="text-[#7954D4]" aria-hidden />
    )
  ) : isGroup ? (
    <Hash size={22} className="text-[#7954D4]" aria-hidden />
  ) : (
    <span className="relative">
      <Avatar className="h-8 w-8">
        {selectedChat.avatar ? <AvatarImage src={selectedChat.avatar} alt="" /> : null}
        <AvatarFallback className="bg-[#7954D4] text-[11px] font-bold text-white">{initials(selectedChat.display_name)}</AvatarFallback>
      </Avatar>
      {peer && onlineIds.has(peer.id) && (
        <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-card bg-[#1F9D55]" aria-hidden />
      )}
    </span>
  );

  // ═══════════════════════════════════════════════════════════════
  //  RENDU
  // ═══════════════════════════════════════════════════════════════
  return (
    <div className="relative flex h-full min-h-0 w-full overflow-hidden">
      {/* ── Colonne des canaux ─────────────────────────────────────── */}
      <div className={`${mobileView === "thread" ? "hidden md:flex" : "flex"} w-full shrink-0 flex-col md:w-[300px]`}>
        <ChatSidebar
          chats={chatList}
          selectedId={selectedId}
          panel={panel}
          pendingInvites={pendingIncoming.length}
          canPilot={canCreateSalon}
          canCreateSalon={canCreateSalon}
          onlineIds={onlineIds}
          onSelect={openChat}
          onPanel={setPanel}
          onCreateSalon={() => {
            resetCreateForm();
            setNewOpen(true);
          }}
        >
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
        </ChatSidebar>
      </div>

      {/* ── Fil ──────────────────────────────────────────────────────── */}
      <main
        className={`${mobileView === "list" ? "hidden md:flex" : "flex"} min-h-0 min-w-0 flex-1 flex-col bg-card`}
        aria-label={selectedChat ? `Conversation : ${selectedChat.display_name}` : "Conversation"}
      >
        {!selectedChat ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
            <p className="text-xl font-extrabold">Vos échanges, au même endroit</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              Choisissez un canal, un salon ou une discussion à gauche, ou écrivez à un membre de votre Daara.
            </p>
            <button type="button" className="ax-btn ax-btn--primary" onClick={() => setPanel("search")}>
              <span className="ax-btn__label">Écrire à un membre</span>
            </button>
          </div>
        ) : (
          <>
            <header className="relative flex h-14 shrink-0 items-center gap-3 border-b px-3 sm:px-5">
              <button type="button" className="ax-btn ax-btn--ghost ax-btn--icon md:hidden" onClick={() => setMobileView("list")} aria-label="Revenir aux discussions">
                <ArrowLeft size={18} aria-hidden />
              </button>
              {headerIcon}
              <h1 className="truncate text-base font-extrabold">{selectedChat.display_name}</h1>
              {selectedChat.is_muted && <BellOff size={14} className="shrink-0 text-muted-foreground" aria-label="En sourdine" />}
              <span
                className={`hidden min-w-0 flex-1 truncate border-s ps-3 text-[13px] lg:block ${subtitleLive ? "font-medium text-[#4E2E9E]" : "text-muted-foreground"}`}
              >
                {subtitle}
              </span>
              <span className="flex-1 lg:hidden" />

              <div className="relative hidden sm:block">
                <label className="flex w-48 items-center gap-1.5 rounded-lg border bg-[#F7F7F5] px-2.5 py-1.5 focus-within:border-[color:var(--ax-accent)] dark:bg-muted xl:w-56">
                  <Search size={14} className="text-muted-foreground" aria-hidden />
                  <input
                    type="search"
                    value={threadQuery}
                    onChange={(e) => onThreadSearch(e.target.value)}
                    placeholder="Rechercher…"
                    aria-label="Rechercher dans la conversation"
                    className="w-full bg-transparent text-[13px] outline-none"
                  />
                  {threadQuery && (
                    <button type="button" onClick={() => onThreadSearch("")} aria-label="Effacer la recherche" className="text-muted-foreground">
                      <X size={13} aria-hidden />
                    </button>
                  )}
                </label>
                {threadResults && (
                  <div className="absolute right-0 top-10 z-30 max-h-96 w-80 overflow-y-auto rounded-xl border bg-card p-1 shadow-xl">
                    <p className="px-2.5 py-1.5 text-[11px] font-bold tracking-wider text-muted-foreground">
                      {threadResults.length ? `${threadResults.length} RÉSULTAT${threadResults.length > 1 ? "S" : ""}` : "AUCUN RÉSULTAT"}
                    </p>
                    {threadResults.map((r) => (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => {
                          setFocusId(null);
                          requestAnimationFrame(() => setFocusId(r.id));
                          setThreadResults(null);
                        }}
                        className="block w-full rounded-lg px-2.5 py-2 text-left hover:bg-muted"
                      >
                        <span className="flex items-center justify-between gap-2 text-xs">
                          <strong className="truncate">{r.sender.name}</strong>
                          <span className="shrink-0 text-muted-foreground">
                            {new Date(r.sent_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })} · {formatTime(r.sent_at)}
                          </span>
                        </span>
                        <span className="line-clamp-2 text-[13px] text-muted-foreground">{r.content}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button
                type="button"
                className={`ax-btn ax-btn--ghost ax-btn--icon ${showInfo ? "text-[#4E2E9E]" : ""}`}
                aria-pressed={showInfo}
                aria-label="Afficher les membres et les détails"
                onClick={() => setShowInfo((s) => !s)}
              >
                <PanelRight size={18} aria-hidden />
              </button>
            </header>

            <MessageThread
              chat={selectedChat}
              messages={messages}
              currentUserId={currentUserId}
              canDeleteAny={isAdmin}
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
              onEdit={handleEdit}
              focusId={focusId}
            />

            <Composer
              placeholder={isChannel ? `Publier dans ${selectedChat.display_name}…` : isGroup ? `Écrire dans #${selectedChat.display_name}` : `Écrire à ${selectedChat.display_name}`}
              disabled={loadingThread}
              allowFiles={!pilotage || pilotage.allow_file_sharing !== false}
              replyingTo={replyingTo}
              onCancelReply={() => setReplyingTo(null)}
              members={isGroup ? members : []}
              currentUserId={currentUserId}
              draftKey={String(selectedChat.id)}
              onSend={handleSend}
              onTyping={pushTyping}
              readOnlyNote={readOnlyNote}
            />
          </>
        )}
      </main>

      {/* ── Membres et détails ─────────────────────────────────────────── */}
      {selectedChat && showInfo && (
        <div className="absolute inset-y-0 right-0 z-30 flex w-full shadow-2xl sm:w-[320px] xl:static xl:z-auto xl:w-auto xl:shadow-none">
          <ConversationInfo
            chat={selectedChat}
            members={members}
            onlineIds={onlineIds}
            currentUserId={currentUserId}
            canManage={canManage}
            isAdmin={isAdmin}
            directoryUsers={directoryUsers}
            busy={infoBusy}
            onClose={() => setShowInfo(false)}
            onToggleMute={handleToggleMute}
            onLeave={handleLeave}
            onAddMembers={handleAddMembers}
            onSetAuthor={handleSetAuthor}
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
              <input id="salon-name" className="ax-input" placeholder="Ex. Coordination Magal" value={newName} onChange={(e) => setNewName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="invite-mode" className="ax-field__label">
                Qui y entre ?
              </label>
              <select id="invite-mode" className="ax-select" value={inviteMode} onChange={(e) => setInviteMode(e.target.value as ChatInviteMode)}>
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
                <span className="ax-field__label">Membres à inviter{manualIds.length ? ` (${manualIds.length})` : ""}</span>
                <input
                  className="ax-input ax-input--sm"
                  value={manualSearch}
                  onChange={(e) => setManualSearch(e.target.value)}
                  placeholder="Filtrer les membres…"
                  aria-label="Filtrer les membres"
                />
                <div className="h-40 overflow-y-auto rounded-xl border p-2">
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
                </div>
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
