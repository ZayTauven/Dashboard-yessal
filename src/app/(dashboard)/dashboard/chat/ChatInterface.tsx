"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import Pusher from "pusher-js";
import {
  getChats,
  sendChatMessage,
  getMessagesForChat,
  createChat,
  deleteMessage,
  toggleMessageReaction,
  markChatAsRead,
  searchMembers,
  getInvitations,
  createInvitation,
  respondToInvitation,
  getMessagingPreferences,
  updateMessagingPreferences,
  getPilotageConfig,
  updatePilotageConfig,
  getPusherAuthSignature,
  type ChatInviteMode,
} from "@/app/actions/comms";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Send,
  MessageSquare,
  Search,
  CheckCheck,
  Reply,
  Trash2,
  Paperclip,
  X,
  FileText,
  Shield,
  Settings,
  Info,
  UserCheck,
  Clock,
} from "lucide-react";

const PUSHER_KEY = process.env.NEXT_PUBLIC_PUSHER_KEY || "0369577c46baf67bfc0a";
const PUSHER_CLUSTER = process.env.NEXT_PUBLIC_PUSHER_CLUSTER || "eu";

type ChatRow = {
  id: number | string;
  chat_type: "direct" | "group";
  display_name: string;
  avatar?: string | null;
  last_message?: {
    content: string;
    sent_at: string;
    sender_name: string;
  } | null;
  unread_count?: number;
  members_count?: number;
  daara?: number | null;
  campaign?: number | null;
};

type MessageRow = {
  id: number;
  chat: number | string;
  sender: { id: number; name: string; avatar?: string | null; role?: string };
  message_type: "text" | "file" | "system";
  content: string;
  file_url?: string | null;
  reply_to?: number | null;
  reactions?: { emoji: string; count: number; reacted_by_me: boolean }[];
  is_deleted: boolean;
  sent_at: string;
};

type ChatInvitationRow = {
  id: number;
  sender: { id: number; name: string; avatar?: string | null };
  recipient: { id: number; name: string; avatar?: string | null };
  chat?: number | null;
  chat_name?: string | null;
  status: "pending" | "accepted" | "declined" | "expired";
  created_at: string;
};

type ManualPickUser = {
  id: number;
  first_name: string;
  last_name: string;
  role: string;
};

type DaaraOption = { id: number; name?: string };

const CHEF_MODES: { value: ChatInviteMode; label: string }[] = [
  { value: "manual", label: "Choisir des membres manuellement" },
  { value: "daara_all", label: "Tout le Daara (membres, chef, collecteurs)" },
  { value: "daara_members", label: "Membres du Daara uniquement" },
  { value: "daara_collectors", label: "Collecteurs du Daara" },
  { value: "daara_chefs", label: "Chefs de Daara (votre Daara)" },
];

const ADMIN_MODES: { value: ChatInviteMode; label: string }[] = [
  { value: "manual", label: "Choisir des personnes manuellement" },
  { value: "daara_all", label: "Un Daara entier (tous rôles communautaires)" },
  { value: "daara_members", label: "Membres d’un Daara" },
  { value: "daara_collectors", label: "Collecteurs d’un Daara" },
  { value: "daara_chefs", label: "Chefs d’un Daara" },
  { value: "global_chefs", label: "Tous les chefs de Daara (plateforme)" },
  { value: "global_collectors", label: "Tous les collecteurs (plateforme)" },
];

const EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

function needsPresetDaara(mode: ChatInviteMode) {
  return (
    mode === "daara_all" ||
    mode === "daara_members" ||
    mode === "daara_collectors" ||
    mode === "daara_chefs"
  );
}

export function ChatInterface({
  initialChats,
  currentUserId,
  initialSelectedChatId,
  daaraId,
  viewerRole = "member",
  directoryUsers = [],
  daarasForSelect = [],
}: {
  initialChats: any[];
  currentUserId: number;
  initialSelectedChatId?: number | null;
  daaraId?: number | null;
  viewerRole?: string;
  directoryUsers?: ManualPickUser[];
  daarasForSelect?: DaaraOption[];
}) {
  const canCreateSalon = viewerRole === "admin" || viewerRole === "chef_daara";
  const isAdmin = viewerRole === "admin";

  // State de navigation & UI
  const [activeTab, setActiveTab] = useState<
    "chats" | "search" | "invites" | "pilotage" | "settings"
  >("chats");
  const [showRightPanel, setShowRightPanel] = useState(false);

  // Discussions & Messages
  const [chatList, setChatList] = useState<ChatRow[]>(
    initialChats as ChatRow[],
  );
  const [selectedChat, setSelectedChat] = useState<ChatRow | null>(
    (initialChats as ChatRow[]).find(
      (c) => Number(c.id) === Number(initialSelectedChatId),
    ) ||
      (initialChats as ChatRow[])[0] ||
      null,
  );
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [msgContent, setMsgContent] = useState("");
  const [replyingTo, setReplyingTo] = useState<MessageRow | null>(null);

  // Fichiers joints
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Recherche & Invitations
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResult, setSearchResult] = useState<any[]>([]);
  const [invitations, setInvitations] = useState<ChatInvitationRow[]>([]);

  // Préférences & Pilotage
  const [preferences, setPreferences] = useState<any>(null);
  const [pilotage, setPilotage] = useState<any>(null);

  // Temps réel (Pusher)
  const [onlineMembers, setOnlineMembers] = useState<Record<string, any>>({});
  const [typingUsers, setTypingUsers] = useState<Record<string, string>>({}); // user_id -> name
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const markReadTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pusherRef = useRef<Pusher | null>(null);
  const presenceChannelRef = useRef<any>(null);

  // Formulaire Création Salon
  const [isPending, startTransition] = useTransition();
  const [newOpen, setNewOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [inviteMode, setInviteMode] = useState<ChatInviteMode>("manual");
  const [presetDaaraId, setPresetDaaraId] = useState<string>("");
  const [manualIds, setManualIds] = useState<number[]>([]);
  const [createError, setCreateError] = useState("");
  const [manualSearch, setManualSearch] = useState("");

  const scrollRef = useRef<HTMLDivElement>(null);
  const modeOptions = isAdmin ? ADMIN_MODES : CHEF_MODES;

  // Initialisation Pusher & Écouteurs globaux
  useEffect(() => {
    // Connexion Pusher
    const pusher = pusherRef.current;
    if (!pusher) return;
    pusherRef.current = pusher;

    // Écoute sur le canal privé de l'utilisateur
    const userChannel = pusher.subscribe(`private-user.${currentUserId}`);
    userChannel.bind("new-invitation", (data: any) => {
      // Recharger les invitations
      loadInvitations();
    });

    return () => {
      pusher.unsubscribe(`private-user.${currentUserId}`);
      pusher.disconnect();
      pusherRef.current = null;
    };
  }, [currentUserId]);

  // Écouteurs pour le chat sélectionné (messages & présence)
  useEffect(() => {
    if (!selectedChat) return;

    // Charger les messages initiaux
    reloadMessages(selectedChat.id);
    markChatAsRead(String(selectedChat.id));

    // Connexion Pusher pour le chat spécifique
    const pusher = pusherRef.current;
    if (!pusher) return;

    // 1. Canal de messages privé
    const msgChannel = pusher.subscribe(`private-chat.${selectedChat.id}`);

    msgChannel.bind("new-message", (data: MessageRow) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === data.id)) return prev;
        return [...prev, data];
      });
      if (Number(data.sender?.id) !== Number(currentUserId)) {
        if (markReadTimeoutRef.current)
          clearTimeout(markReadTimeoutRef.current);
        markReadTimeoutRef.current = setTimeout(() => {
          markChatAsRead(String(selectedChat.id));
        }, 700);
      }
    });

    msgChannel.bind(
      "message-reaction",
      (data: {
        message_id: number;
        emoji: string;
        user_id: number;
        action: "add" | "remove";
      }) => {
        setMessages((prev) =>
          prev.map((msg) => {
            if (msg.id !== data.message_id) return msg;
            const currentReactions = msg.reactions || [];
            let updatedReactions = [...currentReactions];
            const isMe = data.user_id === currentUserId;

            const existingEmojiIdx = updatedReactions.findIndex(
              (r) => r.emoji === data.emoji,
            );

            if (data.action === "add") {
              if (existingEmojiIdx >= 0) {
                updatedReactions[existingEmojiIdx].count += 1;
                if (isMe)
                  updatedReactions[existingEmojiIdx].reacted_by_me = true;
              } else {
                updatedReactions.push({
                  emoji: data.emoji,
                  count: 1,
                  reacted_by_me: isMe,
                });
              }
            } else {
              if (existingEmojiIdx >= 0) {
                updatedReactions[existingEmojiIdx].count -= 1;
                if (isMe)
                  updatedReactions[existingEmojiIdx].reacted_by_me = false;
                if (updatedReactions[existingEmojiIdx].count <= 0) {
                  updatedReactions.splice(existingEmojiIdx, 1);
                }
              }
            }
            return { ...msg, reactions: updatedReactions };
          }),
        );
      },
    );

    msgChannel.bind("message-deleted", (data: { message_id: number }) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === data.message_id
            ? {
                ...msg,
                is_deleted: true,
                content: "Message supprimé",
                file_url: null,
              }
            : msg,
        ),
      );
    });

    // 2. Canal de présence
    const presenceChannel = pusher.subscribe(
      `presence-chat.${selectedChat.id}`,
    );
    presenceChannelRef.current = presenceChannel;

    presenceChannel.bind("pusher:subscription_succeeded", (members: any) => {
      const active: Record<string, any> = {};
      members.each((member: any) => {
        active[member.id] = member.info;
      });
      setOnlineMembers(active);
    });

    presenceChannel.bind("pusher:member_added", (member: any) => {
      setOnlineMembers((prev) => ({ ...prev, [member.id]: member.info }));
    });

    presenceChannel.bind("pusher:member_removed", (member: any) => {
      setOnlineMembers((prev) => {
        const next = { ...prev };
        delete next[member.id];
        return next;
      });
      setTypingUsers((prev) => {
        const next = { ...prev };
        delete next[member.id];
        return next;
      });
    });

    // Typing indicators
    presenceChannel.bind(
      "client-typing",
      (data: { user_id: number; name: string; typing: boolean }) => {
        if (data.user_id === currentUserId) return;
        setTypingUsers((prev) => {
          const next = { ...prev };
          if (data.typing) {
            next[data.user_id] = data.name;
          } else {
            delete next[data.user_id];
          }
          return next;
        });
      },
    );

    return () => {
      pusher.unsubscribe(`private-chat.${selectedChat.id}`);
      pusher.unsubscribe(`presence-chat.${selectedChat.id}`);
      presenceChannelRef.current = null;
      setTypingUsers({});
      setOnlineMembers({});
      if (markReadTimeoutRef.current) {
        clearTimeout(markReadTimeoutRef.current);
        markReadTimeoutRef.current = null;
      }
    };
  }, [selectedChat, currentUserId]);

  // Load preferences, invitations, pilotage au montage
  useEffect(() => {
    loadPreferences();
    loadInvitations();
    loadPilotage();
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  // Sync scroll on messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, typingUsers]);

  const loadPreferences = async () => {
    const res = await getMessagingPreferences();
    if (res.data) setPreferences(res.data);
  };

  const loadInvitations = async () => {
    const res = await getInvitations();
    if (res.data) setInvitations(res.data);
  };

  const loadPilotage = async () => {
    const res = await getPilotageConfig(daaraId || undefined);
    if (res.data) setPilotage(res.data);
  };

  const reloadMessages = async (chatId: string | number) => {
    const { data } = await getMessagesForChat(String(chatId));
    setMessages((data as MessageRow[]) || []);
  };

  // Envoi de message (Text, Fichier, Citation)
  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!msgContent.trim() && !selectedFile) return;
    if (!selectedChat) return;

    const content = msgContent;
    const file = selectedFile;
    const replyTo = replyingTo;

    // Reset input states
    setMsgContent("");
    setSelectedFile(null);
    setReplyingTo(null);

    startTransition(async () => {
      const formData = new FormData();
      formData.append("chat", String(selectedChat.id));
      formData.append("content", content);

      if (file) {
        formData.append("message_type", "file");
        formData.append("file", file);
      } else {
        formData.append("message_type", "text");
      }

      if (replyTo) {
        formData.append("reply_to", String(replyTo.id));
      }

      const res = await sendChatMessage(formData);
      if (res.error) {
        alert(res.error);
        setMsgContent(content);
        setSelectedFile(file);
        setReplyingTo(replyTo);
      }
    });
  };

  // Typing event trigger
  const handleMessageChange = (val: string) => {
    setMsgContent(val);
    if (!selectedChat) return;

    if (!isTyping) {
      setIsTyping(true);
      const channel = presenceChannelRef.current;
      if (channel) {
        channel.trigger("client-typing", {
          user_id: currentUserId,
          name:
            preferences?.visibility !== "nobody" ? "Quelqu'un" : "Un membre",
          typing: true,
        });
      }
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      const channel = presenceChannelRef.current;
      if (channel) {
        channel.trigger("client-typing", {
          user_id: currentUserId,
          name: "",
          typing: false,
        });
      }
    }, 2000);
  };

  // Actions Messages
  const handleReact = async (msgId: number, emoji: string) => {
    const res = await toggleMessageReaction(msgId, emoji);
    if (res.error) alert(res.error);
  };

  const handleDeleteMsg = async (msgId: number) => {
    if (!confirm("Voulez-vous supprimer ce message ?")) return;
    const res = await deleteMessage(msgId);
    if (res.error) alert(res.error);
  };

  // Actions Recherche / Invitations
  const handleSearchMembers = async (q: string) => {
    setSearchTerm(q);
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
      searchTimeoutRef.current = null;
    }
    if (q.trim().length < 2) {
      setSearchResult([]);
      return;
    }
    searchTimeoutRef.current = setTimeout(async () => {
      const res = await searchMembers(q);
      if (res.data) setSearchResult(res.data);
    }, 250);
  };

  const handleSendInvite = async (userId: number) => {
    const res = await createInvitation(userId);
    if (res.error) {
      alert(res.error);
    } else {
      alert("Invitation envoyée avec succès.");
      setSearchTerm("");
      setSearchResult([]);
    }
  };

  const handleRespondInvite = async (inviteId: number, accept: boolean) => {
    const res = await respondToInvitation(inviteId, accept);
    if (res.error) {
      alert(res.error);
    } else {
      loadInvitations();
      // Recharger la liste des chats
      const chatsRes = await getChats();
      if (chatsRes.data) {
        setChatList(chatsRes.data);
        if (accept && res.data?.chat) {
          setSelectedChat(res.data.chat);
          setActiveTab("chats");
        }
      }
    }
  };

  // Préférences & Pilotage updates
  const handlePrefChange = async (key: string, value: any) => {
    const updated = { ...preferences, [key]: value };
    setPreferences(updated);
    const res = await updateMessagingPreferences({ [key]: value });
    if (res.error) {
      alert(res.error);
      loadPreferences();
    }
  };

  const handlePilotageChange = async (key: string, value: any) => {
    const updated = { ...pilotage, [key]: value };
    setPilotage(updated);
    const res = await updatePilotageConfig({
      ...updated,
      daara: daaraId || null,
    });
    if (res.error) {
      alert(res.error);
      loadPilotage();
    }
  };

  // Dialog creation salon
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
    if (!name) {
      setCreateError("Indiquez un nom pour le salon.");
      return;
    }
    if (isAdmin && needsPresetDaara(inviteMode) && !presetDaaraId) {
      setCreateError("Sélectionnez le Daara cible pour ce mode d'invitation.");
      return;
    }

    startTransition(async () => {
      const res = await createChat({
        name,
        invite_mode: inviteMode,
        daara_id: daaraId || undefined,
        preset_daara_id: presetDaaraId ? Number(presetDaaraId) : undefined,
        manual_user_ids:
          inviteMode === "manual" && manualIds.length ? manualIds : undefined,
      });

      if (res.error) {
        setCreateError(res.error);
        return;
      }
      setNewOpen(false);
      resetCreateForm();
      const chatsRes = await getChats();
      if (chatsRes.data) setChatList(chatsRes.data);
    });
  };

  const toggleManualId = (id: number) => {
    setManualIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  // Helpers UI
  const isUserOnline = (userId: number) => {
    return !!onlineMembers[userId];
  };

  const getChatStatus = () => {
    if (!selectedChat) return "";
    if (selectedChat.chat_type === "group") {
      const activeCount = Object.keys(onlineMembers).length;
      return `${selectedChat.members_count || 0} membres • ${activeCount} en ligne`;
    }
    // Direct chat online status
    const keys = Object.keys(onlineMembers);
    const otherMemberId = keys.find((k) => Number(k) !== currentUserId);
    if (otherMemberId) {
      const user = onlineMembers[otherMemberId];
      // Check typing
      const typers = Object.values(typingUsers);
      if (typers.length > 0) {
        return "écrit...";
      }
      return "en ligne";
    }
    return "hors ligne";
  };

  const pickableUsers = directoryUsers.filter(
    (u) => u.id !== currentUserId && u.role !== "admin",
  );
  const pendingIncomingInvitations = invitations.filter(
    (invite) =>
      invite.status === "pending" &&
      Number(invite.recipient.id) === Number(currentUserId),
  );

  return (
    <div
      className="flex-1 flex overflow-hidden h-full rounded-2xl border shadow-xl bg-slate-900 text-slate-100"
      style={{ borderColor: "rgba(255,255,255,0.08)" }}
    >
      {/* SIDEBAR GAUCHE - Tabs de navigation */}
      <div
        className="w-[80px] bg-slate-950/80 backdrop-blur-md border-r flex flex-col items-center py-6 gap-6 justify-between"
        style={{ borderColor: "rgba(255,255,255,0.08)" }}
      >
        <div className="flex flex-col gap-5 items-center w-full">
          <Avatar className="h-12 w-12 ring-2 ring-emerald-500 ring-offset-2 ring-offset-slate-900">
            <AvatarImage src="/assets/branding/logo-yessal.png" />
            <AvatarFallback className="bg-emerald-600 font-bold">
              Y
            </AvatarFallback>
          </Avatar>

          <div className="h-[1px] w-12 bg-white/10 my-2" />

          <button
            onClick={() => setActiveTab("chats")}
            className={`p-3 rounded-2xl relative transition-all duration-300 ${activeTab === "chats" ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 scale-105" : "text-slate-400 hover:bg-white/5 hover:text-white"}`}
            title="Discussions"
          >
            <MessageSquare size={22} />
            {chatList.reduce((acc, c) => acc + (c.unread_count || 0), 0) >
              0 && (
              <span className="absolute top-1 right-1 h-3 w-3 bg-red-500 rounded-full ring-2 ring-slate-950" />
            )}
          </button>

          <button
            onClick={() => setActiveTab("search")}
            className={`p-3 rounded-2xl transition-all duration-300 ${activeTab === "search" ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 scale-105" : "text-slate-400 hover:bg-white/5 hover:text-white"}`}
            title="Rechercher des membres"
          >
            <Search size={22} />
          </button>

          <button
            onClick={() => setActiveTab("invites")}
            className={`p-3 rounded-2xl relative transition-all duration-300 ${activeTab === "invites" ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 scale-105" : "text-slate-400 hover:bg-white/5 hover:text-white"}`}
            title="Invitations de discussion"
          >
            <UserCheck size={22} />
            {pendingIncomingInvitations.length > 0 && (
              <span className="absolute top-1 right-1 px-1.5 py-0.5 text-[9px] font-bold bg-red-500 rounded-full text-white ring-2 ring-slate-950">
                {pendingIncomingInvitations.length}
              </span>
            )}
          </button>

          {(viewerRole === "admin" || viewerRole === "chef_daara") && (
            <button
              onClick={() => setActiveTab("pilotage")}
              className={`p-3 rounded-2xl transition-all duration-300 ${activeTab === "pilotage" ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 scale-105" : "text-slate-400 hover:bg-white/5 hover:text-white"}`}
              title="Pilotage Administrateur"
            >
              <Shield size={22} />
            </button>
          )}
        </div>

        <button
          onClick={() => setActiveTab("settings")}
          className={`p-3 rounded-2xl transition-all duration-300 ${activeTab === "settings" ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 scale-105" : "text-slate-400 hover:bg-white/5 hover:text-white"}`}
          title="Paramètres de messagerie"
        >
          <Settings size={22} />
        </button>
      </div>

      {/* SECONDE COLONNE - Contenu de l'onglet actif */}
      <div
        className="w-[340px] bg-slate-950/40 border-r flex flex-col min-w-[300px]"
        style={{ borderColor: "rgba(255,255,255,0.08)" }}
      >
        {/* TABS CONTENT: CHATS */}
        {activeTab === "chats" && (
          <>
            <div
              className="p-5 border-b space-y-4"
              style={{ borderColor: "rgba(255,255,255,0.08)" }}
            >
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-black tracking-tight">Messages</h2>
                {canCreateSalon && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-emerald-500/30 text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500 hover:text-white rounded-xl text-xs font-semibold"
                    onClick={() => {
                      resetCreateForm();
                      setNewOpen(true);
                    }}
                  >
                    + Salon
                  </Button>
                )}
              </div>
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                  size={15}
                />
                <Input
                  placeholder="Rechercher une discussion..."
                  className="pl-9 bg-slate-900/60 border-white/5 text-slate-200 placeholder:text-slate-500 h-10 rounded-xl"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <ScrollArea className="flex-1">
              <div className="p-2 space-y-1">
                {chatList
                  .filter((chat) =>
                    chat.display_name
                      .toLowerCase()
                      .includes(searchTerm.toLowerCase()),
                  )
                  .map((chat) => {
                    const isSelected =
                      Number(selectedChat?.id) === Number(chat.id);
                    return (
                      <div
                        key={chat.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => setSelectedChat(chat)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ")
                            setSelectedChat(chat);
                        }}
                        className={`p-3.5 flex items-center gap-3.5 cursor-pointer rounded-xl transition-all duration-300 ${isSelected ? "bg-emerald-500/20 border-l-4 border-emerald-500" : "hover:bg-white/5"}`}
                      >
                        <div className="relative shrink-0">
                          <Avatar className="h-11 w-11 ring-1 ring-white/10">
                            {chat.avatar ? (
                              <AvatarImage src={chat.avatar} />
                            ) : null}
                            <AvatarFallback className="bg-slate-800 text-emerald-400 font-bold text-sm">
                              {chat.display_name[0].toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          {chat.chat_type === "direct" &&
                            isUserOnline(Number(chat.id)) && (
                              <span className="absolute bottom-0 right-0 h-3 w-3 bg-emerald-500 rounded-full border-2 border-slate-900" />
                            )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <span className="font-bold text-sm text-slate-200 truncate">
                              {chat.display_name}
                            </span>
                            {chat.last_message && (
                              <span className="text-[10px] text-slate-500 font-medium shrink-0">
                                {new Date(
                                  chat.last_message.sent_at,
                                ).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center justify-between gap-2">
                            <p className="text-xs text-slate-400 truncate flex-1">
                              {chat.last_message ? (
                                <>
                                  <span className="text-emerald-500 font-semibold mr-1">
                                    {chat.last_message.sender_name}:
                                  </span>
                                  {chat.last_message.content}
                                </>
                              ) : (
                                <span className="italic text-slate-500">
                                  Aucun message
                                </span>
                              )}
                            </p>
                            {chat.unread_count ? (
                              <span className="h-5 min-w-[20px] px-1.5 flex items-center justify-center text-[10px] font-bold bg-emerald-500 text-white rounded-full shrink-0">
                                {chat.unread_count}
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                {chatList.length === 0 && (
                  <div className="p-8 text-center text-xs text-slate-500 italic">
                    Aucune discussion.
                  </div>
                )}
              </div>
            </ScrollArea>
          </>
        )}

        {/* TABS CONTENT: RECHERCHER DES CONTACTS */}
        {activeTab === "search" && (
          <div className="flex-1 flex flex-col p-5 space-y-4">
            <h2 className="text-lg font-black">Trouver des membres</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Recherchez des membres enregistrés pour leur envoyer une
              invitation à démarrer un chat direct.
            </p>
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                size={15}
              />
              <Input
                placeholder="Nom, email, Daara..."
                className="pl-9 bg-slate-900/60 border-white/5 text-slate-200"
                value={searchTerm}
                onChange={(e) => handleSearchMembers(e.target.value)}
              />
            </div>

            <ScrollArea className="flex-1">
              <div className="space-y-2 pr-1">
                {searchResult.map((u) => (
                  <div
                    key={u.id}
                    className="p-3.5 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar className="h-9 w-9 shrink-0">
                        {u.avatar ? <AvatarImage src={u.avatar} /> : null}
                        <AvatarFallback className="bg-slate-800 text-slate-300 font-bold text-xs">
                          {u.name[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <div className="font-bold text-sm truncate">
                          {u.name}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate">
                          {u.role} {u.daara_name ? `• ${u.daara_name}` : ""}
                        </div>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleSendInvite(u.id)}
                      className="bg-emerald-500 text-white hover:bg-emerald-600 rounded-lg shrink-0 text-xs font-semibold px-2.5 h-8"
                    >
                      Inviter
                    </Button>
                  </div>
                ))}
                {searchTerm.trim().length >= 2 && searchResult.length === 0 && (
                  <p className="text-center text-xs text-slate-500 italic mt-6">
                    Aucun membre trouvé ou autorisé.
                  </p>
                )}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* TABS CONTENT: INVITATIONS */}
        {activeTab === "invites" && (
          <div className="flex-1 flex flex-col p-5 space-y-4">
            <h2 className="text-lg font-black">Invitations</h2>
            <p className="text-xs text-slate-400">
              Gérez les demandes de discussion directe entrantes.
            </p>

            <ScrollArea className="flex-1">
              <div className="space-y-3">
                {pendingIncomingInvitations.map((invite) => (
                  <div
                    key={invite.id}
                    className="p-4 rounded-xl bg-slate-900/80 border border-white/5 space-y-3.5"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        {invite.sender.avatar ? (
                          <AvatarImage src={invite.sender.avatar} />
                        ) : null}
                        <AvatarFallback className="bg-slate-800 font-bold text-xs text-slate-300">
                          {invite.sender.name[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <div className="font-bold text-sm truncate">
                          {invite.sender.name}
                        </div>
                        <div className="text-[10px] text-slate-500 flex items-center gap-1">
                          <Clock size={10} />
                          {new Date(invite.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleRespondInvite(invite.id, true)}
                        className="bg-emerald-500 text-white hover:bg-emerald-600 rounded-lg flex-1 text-xs font-semibold"
                      >
                        Accepter
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRespondInvite(invite.id, false)}
                        className="border-white/10 hover:bg-white/5 rounded-lg flex-1 text-xs font-semibold text-slate-300"
                      >
                        Décliner
                      </Button>
                    </div>
                  </div>
                ))}
                {pendingIncomingInvitations.length === 0 && (
                  <div className="text-center p-8 text-xs text-slate-500 italic">
                    Aucune invitation en attente.
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* TABS CONTENT: PILOTAGE ADMIN */}
        {activeTab === "pilotage" && pilotage && (
          <div className="flex-1 flex flex-col p-5 space-y-4 overflow-y-auto">
            <h2 className="text-lg font-black flex items-center gap-2">
              <Shield size={20} className="text-emerald-400" />
              Pilotage Admin
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Configurez les droits globaux d&apos;échange et de recherche pour
              les membres de {pilotage.daara_name || "la Plateforme"}.
            </p>

            <div className="space-y-4 pt-4">
              <div className="flex items-center justify-between gap-4 p-3 rounded-xl bg-white/5">
                <div className="space-y-1">
                  <span className="text-xs font-semibold block">
                    Recherche Inter-Daara
                  </span>
                  <p className="text-[10px] text-slate-400 leading-tight">
                    Autorise la recherche de membres d&apos;autres Daaras.
                  </p>
                </div>
                <Checkbox
                  checked={pilotage.allow_cross_daara_search}
                  onCheckedChange={(checked) =>
                    handlePilotageChange("allow_cross_daara_search", !!checked)
                  }
                />
              </div>

              <div className="flex items-center justify-between gap-4 p-3 rounded-xl bg-white/5">
                <div className="space-y-1">
                  <span className="text-xs font-semibold block">
                    Invitations directes
                  </span>
                  <p className="text-[10px] text-slate-400 leading-tight">
                    Autorise les membres à s&apos;inviter en message privé.
                  </p>
                </div>
                <Checkbox
                  checked={pilotage.allow_member_invite}
                  onCheckedChange={(checked) =>
                    handlePilotageChange("allow_member_invite", !!checked)
                  }
                />
              </div>

              <div className="flex items-center justify-between gap-4 p-3 rounded-xl bg-white/5">
                <div className="space-y-1">
                  <span className="text-xs font-semibold block">
                    Création de groupe
                  </span>
                  <p className="text-[10px] text-slate-400 leading-tight">
                    Autorise les membres à créer des salons collectifs.
                  </p>
                </div>
                <Checkbox
                  checked={pilotage.allow_group_creation}
                  onCheckedChange={(checked) =>
                    handlePilotageChange("allow_group_creation", !!checked)
                  }
                />
              </div>

              <div className="flex items-center justify-between gap-4 p-3 rounded-xl bg-white/5">
                <div className="space-y-1">
                  <span className="text-xs font-semibold block">
                    Partage de fichiers
                  </span>
                  <p className="text-[10px] text-slate-400 leading-tight">
                    Autorise l&apos;envoi de documents joints dans le chat.
                  </p>
                </div>
                <Checkbox
                  checked={pilotage.allow_file_sharing}
                  onCheckedChange={(checked) =>
                    handlePilotageChange("allow_file_sharing", !!checked)
                  }
                />
              </div>

              <div className="flex items-center justify-between gap-4 p-3 rounded-xl bg-white/5">
                <div className="space-y-1">
                  <span className="text-xs font-semibold block">
                    Modif de visibilité
                  </span>
                  <p className="text-[10px] text-slate-400 leading-tight">
                    Autorise les membres à ajuster leur propre visibilité.
                  </p>
                </div>
                <Checkbox
                  checked={pilotage.allow_member_visibility_setting}
                  onCheckedChange={(checked) =>
                    handlePilotageChange(
                      "allow_member_visibility_setting",
                      !!checked,
                    )
                  }
                />
              </div>
            </div>
          </div>
        )}

        {/* TABS CONTENT: PARAMETRES PREFERENCES */}
        {activeTab === "settings" && preferences && (
          <div className="flex-1 flex flex-col p-5 space-y-4 overflow-y-auto">
            <h2 className="text-lg font-black flex items-center gap-2">
              <Settings size={20} className="text-emerald-400" />
              Paramètres
            </h2>
            <p className="text-xs text-slate-400">
              Ajustez vos préférences de confidentialité et de notification.
            </p>

            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label className="text-xs font-semibold">
                  Qui peut vous voir et vous rechercher ?
                </Label>
                <select
                  className="flex h-10 w-full rounded-xl border border-white/5 bg-slate-900 px-3 py-1 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  value={preferences.visibility}
                  onChange={(e) =>
                    handlePrefChange("visibility", e.target.value)
                  }
                  disabled={
                    pilotage && !pilotage.allow_member_visibility_setting
                  }
                >
                  <option value="all">Tout le monde</option>
                  <option value="daara_only">
                    Membres de mon Daara uniquement
                  </option>
                  <option value="nobody">Personne</option>
                </select>
                {pilotage && !pilotage.allow_member_visibility_setting && (
                  <p className="text-[9px] text-slate-500 italic">
                    Verrouillé par l&apos;administrateur.
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between gap-4 p-3 rounded-xl bg-white/5">
                <div className="space-y-1">
                  <span className="text-xs font-semibold block">
                    Invitations directes
                  </span>
                  <p className="text-[10px] text-slate-400 leading-tight">
                    Autoriser les invitations à discuter en direct.
                  </p>
                </div>
                <Checkbox
                  checked={preferences.allow_direct_invites}
                  onCheckedChange={(checked) =>
                    handlePrefChange("allow_direct_invites", !!checked)
                  }
                />
              </div>

              <div className="flex items-center justify-between gap-4 p-3 rounded-xl bg-white/5">
                <div className="space-y-1">
                  <span className="text-xs font-semibold block">
                    Invitations de groupes
                  </span>
                  <p className="text-[10px] text-slate-400 leading-tight">
                    Autoriser les invitations à des salons de groupe.
                  </p>
                </div>
                <Checkbox
                  checked={preferences.allow_group_invites}
                  onCheckedChange={(checked) =>
                    handlePrefChange("allow_group_invites", !!checked)
                  }
                />
              </div>

              <div className="flex items-center justify-between gap-4 p-3 rounded-xl bg-white/5">
                <div className="space-y-1">
                  <span className="text-xs font-semibold block">
                    Statut En Ligne
                  </span>
                  <p className="text-[10px] text-slate-400 leading-tight">
                    Afficher mon statut connecté aux autres membres.
                  </p>
                </div>
                <Checkbox
                  checked={preferences.show_online_status}
                  onCheckedChange={(checked) =>
                    handlePrefChange("show_online_status", !!checked)
                  }
                />
              </div>

              <div className="flex items-center justify-between gap-4 p-3 rounded-xl bg-white/5">
                <div className="space-y-1">
                  <span className="text-xs font-semibold block">
                    Activer les notifications
                  </span>
                  <p className="text-[10px] text-slate-400 leading-tight">
                    Recevoir des alertes lors de nouveaux messages.
                  </p>
                </div>
                <Checkbox
                  checked={preferences.notifications_enabled}
                  onCheckedChange={(checked) =>
                    handlePrefChange("notifications_enabled", !!checked)
                  }
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* COLONNE CENTRALE - Zone de discussion (WhatsApp premium style) */}
      <div className="flex-1 flex flex-col bg-slate-900 relative min-w-0">
        {!selectedChat ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 opacity-55">
            <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mb-5 ring-4 ring-emerald-500/10 animate-bounce">
              <MessageSquare size={38} className="text-emerald-400" />
            </div>
            <h3 className="text-xl font-black text-slate-100">
              Messagerie Intelligente Yessal
            </h3>
            <p className="max-w-xs text-xs text-slate-400 mt-2 leading-relaxed">
              Sélectionnez une discussion à gauche, ou utilisez le moteur de
              recherche pour inviter des contacts.
            </p>
          </div>
        ) : (
          <>
            {/* Header du Chat */}
            <div
              className="p-4 border-b flex items-center justify-between bg-slate-950/40 backdrop-blur-md z-10 sticky top-0"
              style={{ borderColor: "rgba(255,255,255,0.08)" }}
            >
              <div className="flex items-center gap-3.5">
                <Avatar className="h-10 w-10 ring-2 ring-emerald-500/20">
                  {selectedChat.avatar ? (
                    <AvatarImage src={selectedChat.avatar} />
                  ) : null}
                  <AvatarFallback className="bg-slate-800 text-emerald-400 font-bold">
                    {selectedChat.display_name[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-bold text-sm leading-none text-slate-100">
                    {selectedChat.display_name}
                  </div>
                  <div className="text-[10px] text-emerald-400 mt-1 font-bold tracking-tight">
                    {getChatStatus()}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowRightPanel(!showRightPanel)}
                  className={`h-9 w-9 rounded-xl transition-all duration-300 ${showRightPanel ? "bg-emerald-500/10 text-emerald-400" : "text-slate-400 hover:bg-white/5 hover:text-white"}`}
                >
                  <Info size={18} />
                </Button>
              </div>
            </div>

            {/* Corps de discussion (Messages) */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-6 space-y-4 min-h-[200px]"
              style={{
                backgroundColor: "#0b141a",
                backgroundImage:
                  "url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')",
                backgroundBlendMode: "soft-light",
                opacity: 0.98,
              }}
            >
              {messages.map((m) => {
                const isMe = Number(m.sender.id) === Number(currentUserId);
                const isSystem = m.message_type === "system";

                if (isSystem) {
                  return (
                    <div key={m.id} className="flex justify-center my-2">
                      <span className="px-3.5 py-1.5 rounded-xl bg-slate-800/80 border border-white/5 text-[10px] font-semibold text-slate-400 shadow-md">
                        {m.content}
                      </span>
                    </div>
                  );
                }

                return (
                  <div
                    key={m.id}
                    className={`flex ${isMe ? "justify-end" : "justify-start"} group relative animate-in fade-in duration-300`}
                  >
                    <div className="max-w-[70%] relative flex flex-col items-start gap-1">
                      {/* Bulle de message */}
                      <div
                        className={`p-3.5 rounded-2xl shadow-lg relative ${
                          isMe
                            ? "bg-emerald-600 text-white rounded-tr-none"
                            : "bg-slate-800 text-slate-200 rounded-tl-none border border-white/5"
                        }`}
                      >
                        {/* Auteur si groupe */}
                        {!isMe && selectedChat.chat_type === "group" && (
                          <div className="text-[10px] font-extrabold text-emerald-400 mb-1 uppercase tracking-tight">
                            {m.sender.name}
                          </div>
                        )}

                        {/* Citation / Reply Render */}
                        {m.reply_to && (
                          <div className="mb-2 p-2 rounded-lg bg-black/20 border-l-4 border-emerald-400 text-xs text-slate-400 truncate">
                            {messages.find((x) => x.id === m.reply_to)
                              ?.content || "Message référencé"}
                          </div>
                        )}

                        {/* Contenu Fichier Joint */}
                        {m.message_type === "file" && m.file_url && (
                          <div className="mb-2 p-3.5 rounded-xl bg-black/25 flex items-center gap-3 border border-white/5 shadow-inner">
                            <FileText
                              size={28}
                              className="text-emerald-400 shrink-0"
                            />
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-bold text-slate-200 truncate">
                                {m.content || "Fichier partagé"}
                              </p>
                              <a
                                href={m.file_url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[10px] text-emerald-400 font-bold hover:underline mt-1 inline-block"
                              >
                                Télécharger le document
                              </a>
                            </div>
                          </div>
                        )}

                        {/* Message Texte */}
                        {m.message_type === "text" && (
                          <p className="leading-relaxed whitespace-pre-wrap break-words text-[13px] pb-3 pr-10">
                            {m.content}
                          </p>
                        )}

                        {/* Timestamp & Double Check */}
                        <div className="absolute bottom-1 right-2.5 flex items-center gap-1 select-none">
                          <span className="text-[9px] text-slate-300 opacity-60 font-medium">
                            {new Date(m.sent_at).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                          {isMe && (
                            <CheckCheck
                              size={11}
                              className="text-emerald-300"
                            />
                          )}
                        </div>

                        {/* Aggregated reactions render */}
                        {m.reactions && m.reactions.length > 0 && (
                          <div className="absolute -bottom-2.5 left-2.5 flex items-center gap-0.5 bg-slate-900 border border-white/10 rounded-full px-1.5 py-0.5 shadow-md scale-95 z-20">
                            {m.reactions.map((r, idx) => (
                              <span
                                key={idx}
                                className={`text-[10px] flex items-center gap-0.5 cursor-pointer hover:scale-110 transition-transform ${r.reacted_by_me ? "font-bold text-emerald-400" : ""}`}
                                onClick={() => handleReact(m.id, r.emoji)}
                              >
                                {r.emoji}{" "}
                                <span className="text-[8px] opacity-75">
                                  {r.count}
                                </span>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Éléments de contrôle au survol (Reactions, Reply, Delete) */}
                      {!m.is_deleted && (
                        <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1.5 absolute top-1/2 -translate-y-1/2 -right-28 bg-slate-900/90 backdrop-blur-sm border border-white/10 p-1.5 rounded-full shadow-lg z-30 transition-all duration-200">
                          {/* Emojis shortcuts */}
                          <div className="flex items-center gap-0.5 pr-1.5 border-r border-white/10">
                            {EMOJIS.slice(0, 3).map((emoji) => (
                              <button
                                key={emoji}
                                onClick={() => handleReact(m.id, emoji)}
                                className="text-xs hover:scale-125 transition-transform"
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                          <button
                            onClick={() => setReplyingTo(m)}
                            className="p-1 hover:text-emerald-400 text-slate-400 rounded-full hover:bg-white/5"
                            title="Répondre"
                          >
                            <Reply size={13} />
                          </button>
                          {(isMe || viewerRole === "admin") && (
                            <button
                              onClick={() => handleDeleteMsg(m.id)}
                              className="p-1 hover:text-red-400 text-slate-400 rounded-full hover:bg-white/5"
                              title="Supprimer"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {messages.length === 0 && (
                <div className="h-full flex items-center justify-center text-xs text-slate-500 italic bg-slate-950/20 backdrop-blur-sm rounded-2xl p-6 border border-white/5">
                  Aucun message pour l&apos;instant. Ouvrez la discussion avec
                  un message.
                </div>
              )}
            </div>

            {/* Zone d'envoi et inputs additionnels */}
            <div
              className="p-4 bg-slate-950/30 border-t space-y-3"
              style={{ borderColor: "rgba(255,255,255,0.08)" }}
            >
              {/* Citation en cours */}
              {replyingTo && (
                <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900 border-l-4 border-emerald-500 text-xs">
                  <div className="min-w-0">
                    <span className="font-bold text-emerald-400 block mb-0.5">
                      En réponse à {replyingTo.sender.name}
                    </span>
                    <p className="text-slate-400 truncate">
                      {replyingTo.content}
                    </p>
                  </div>
                  <button
                    onClick={() => setReplyingTo(null)}
                    className="text-slate-400 hover:text-white"
                  >
                    <X size={15} />
                  </button>
                </div>
              )}

              {/* Fichier joint sélectionné */}
              {selectedFile && (
                <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900 border border-white/5 text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText size={16} className="text-emerald-400" />
                    <span className="text-slate-200 font-medium truncate">
                      {selectedFile.name}
                    </span>
                    <span className="text-[10px] text-slate-500 shrink-0">
                      ({(selectedFile.size / 1024).toFixed(0)} KB)
                    </span>
                  </div>
                  <button
                    onClick={() => setSelectedFile(null)}
                    className="text-slate-400 hover:text-white"
                  >
                    <X size={15} />
                  </button>
                </div>
              )}

              <form
                onSubmit={handleSend}
                className="flex items-center gap-3 bg-slate-950 p-2 rounded-2xl border"
                style={{ borderColor: "rgba(255,255,255,0.08)" }}
              >
                {/* Attachement fichier (uniquement si autorisé par pilotage) */}
                {(!pilotage || pilotage.allow_file_sharing) && (
                  <>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={(e) => {
                        if (e.target.files?.length)
                          setSelectedFile(e.target.files[0]);
                      }}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => fileInputRef.current?.click()}
                      className="h-10 w-10 text-slate-400 hover:bg-white/5 hover:text-white rounded-full shrink-0"
                    >
                      <Paperclip size={18} />
                    </Button>
                  </>
                )}

                <Input
                  value={msgContent}
                  onChange={(e) => handleMessageChange(e.target.value)}
                  placeholder="Tapez un message..."
                  className="border-none focus-visible:ring-0 bg-transparent flex-1 text-slate-200 placeholder:text-slate-500 h-10 text-sm"
                  disabled={isPending}
                />

                <Button
                  type="submit"
                  size="icon"
                  className="rounded-xl h-10 w-10 shrink-0 bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20"
                  disabled={(!msgContent.trim() && !selectedFile) || isPending}
                >
                  <Send size={18} />
                </Button>
              </form>
            </div>
          </>
        )}
      </div>

      {/* DROITE DETAIL CONVERSATION / MEMBRES (Drawer style) */}
      {selectedChat && showRightPanel && (
        <div
          className="w-[280px] bg-slate-950/80 backdrop-blur-md border-l flex flex-col p-6 space-y-6 overflow-y-auto"
          style={{ borderColor: "rgba(255,255,255,0.08)" }}
        >
          <div
            className="flex items-center justify-between border-b pb-4"
            style={{ borderColor: "rgba(255,255,255,0.08)" }}
          >
            <h3 className="font-black text-sm tracking-tight">Infos</h3>
            <button
              onClick={() => setShowRightPanel(false)}
              className="text-slate-400 hover:text-white"
            >
              <X size={18} />
            </button>
          </div>

          <div className="flex flex-col items-center text-center space-y-3">
            <Avatar className="h-20 w-20 ring-4 ring-emerald-500/20">
              {selectedChat.avatar ? (
                <AvatarImage src={selectedChat.avatar} />
              ) : null}
              <AvatarFallback className="bg-slate-800 text-emerald-400 font-bold text-xl">
                {selectedChat.display_name[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h4 className="font-extrabold text-slate-100">
                {selectedChat.display_name}
              </h4>
              <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider font-semibold">
                {selectedChat.chat_type === "direct"
                  ? "Discussion privée"
                  : "Discussion de groupe"}
              </p>
            </div>
          </div>

          <div className="h-[1px] bg-white/10" />

          {selectedChat.chat_type === "group" && (
            <div className="space-y-3">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                Membres connectés
              </span>
              <div className="space-y-2">
                {Object.values(onlineMembers).map((m: any, idx) => (
                  <div key={idx} className="flex items-center gap-2.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                    <span className="text-xs text-slate-300 font-medium truncate">
                      {m.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {selectedChat.chat_type === "direct" && (
            <div className="space-y-3.5 text-xs text-slate-300">
              <div className="space-y-1">
                <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider">
                  Disponibilité
                </span>
                <span className="text-emerald-400 font-bold">Autorisé</span>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider">
                  Mute notifications
                </span>
                <span className="text-slate-400">Non silencieux</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* DIALOG CREATION SALON (MODAL) */}
      <Dialog
        open={newOpen}
        onOpenChange={(o) => {
          setNewOpen(o);
          if (!o) resetCreateForm();
        }}
      >
        <DialogContent className="max-w-md bg-slate-900 border border-white/10 text-slate-100 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-black tracking-tight text-slate-100">
              Créer un salon de groupe
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label
                htmlFor="salon-name"
                className="text-slate-300 text-xs font-semibold"
              >
                Nom du salon
              </Label>
              <Input
                id="salon-name"
                placeholder="Ex: Coordination Ramadan"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="bg-slate-950 border-white/10 text-slate-200 placeholder:text-slate-600 rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="invite-mode"
                className="text-slate-300 text-xs font-semibold"
              >
                Mode d&apos;invitation
              </Label>
              <select
                id="invite-mode"
                className="flex h-10 w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-xs text-slate-200 shadow-sm focus:outline-none"
                value={inviteMode}
                onChange={(e) =>
                  setInviteMode(e.target.value as ChatInviteMode)
                }
              >
                {modeOptions.map((opt) => (
                  <option
                    key={opt.value}
                    value={opt.value}
                    className="bg-slate-900"
                  >
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {isAdmin &&
            needsPresetDaara(inviteMode) &&
            daarasForSelect.length > 0 ? (
              <div className="space-y-2">
                <Label
                  htmlFor="preset-daara"
                  className="text-slate-300 text-xs font-semibold"
                >
                  Daara cible
                </Label>
                <select
                  id="preset-daara"
                  className="flex h-10 w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-xs text-slate-200 shadow-sm focus:outline-none"
                  value={presetDaaraId}
                  onChange={(e) => setPresetDaaraId(e.target.value)}
                >
                  <option value="" className="bg-slate-900">
                    Sélectionner un Daara
                  </option>
                  {daarasForSelect.map((daara) => (
                    <option
                      key={daara.id}
                      value={daara.id}
                      className="bg-slate-900"
                    >
                      {daara.name || `Daara #${daara.id}`}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}

            {inviteMode === "manual" && pickableUsers.length > 0 ? (
              <div className="space-y-2">
                <Label className="text-slate-300 text-xs font-semibold">
                  Membres à inviter
                </Label>
                <Input
                  value={manualSearch}
                  onChange={(e) => setManualSearch(e.target.value)}
                  placeholder="Filtrer les membres..."
                  className="bg-slate-950 border-white/10 text-slate-200 placeholder:text-slate-600 h-9 rounded-xl text-xs"
                />
                <ScrollArea className="h-36 rounded-xl border border-white/10 p-3 bg-slate-950/40">
                  <div className="space-y-2.5 pr-2">
                    {pickableUsers
                      .filter((u) => {
                        const q = manualSearch.trim().toLowerCase();
                        if (!q) return true;
                        return `${u.first_name} ${u.last_name} ${u.role}`
                          .toLowerCase()
                          .includes(q);
                      })
                      .map((u) => (
                        <label
                          key={u.id}
                          className="flex items-center gap-2.5 text-xs cursor-pointer hover:text-white transition-colors"
                        >
                          <Checkbox
                            checked={manualIds.includes(u.id)}
                            onCheckedChange={() => toggleManualId(u.id)}
                            className="border-white/20"
                          />
                          <span>
                            {u.first_name} {u.last_name}
                            <span className="text-slate-500 text-[10px] ml-1.5">
                              ({u.role})
                            </span>
                          </span>
                        </label>
                      ))}
                  </div>
                </ScrollArea>
              </div>
            ) : null}

            {createError ? (
              <p className="text-xs text-red-500 font-semibold">
                {createError}
              </p>
            ) : null}
          </div>

          <DialogFooter className="pt-4 gap-2">
            <Button
              variant="outline"
              type="button"
              onClick={() => setNewOpen(false)}
              className="border-white/10 text-slate-300 hover:bg-white/5 rounded-xl text-xs font-bold"
            >
              Annuler
            </Button>
            <Button
              type="button"
              disabled={isPending}
              onClick={handleCreateChat}
              className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-500/20"
            >
              Créer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
