"use client";

import { useState, useTransition, useEffect, useRef, useMemo } from "react";
import Pusher from "pusher-js";
import { toast } from "sonner";
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
  { value: "daara_members", label: "Membres d'un Daara" },
  { value: "daara_collectors", label: "Collecteurs d'un Daara" },
  { value: "daara_chefs", label: "Chefs d'un Daara" },
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

function groupMessagesByDate(msgs: MessageRow[]) {
  const groups: { label: string; messages: MessageRow[] }[] = [];
  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86_400_000).toDateString();
  msgs.forEach((msg) => {
    const key = new Date(msg.sent_at).toDateString();
    const label =
      key === today
        ? "Aujourd'hui"
        : key === yesterday
          ? "Hier"
          : new Date(msg.sent_at).toLocaleDateString("fr-FR", {
              weekday: "long",
              day: "numeric",
              month: "long",
            });
    const last = groups[groups.length - 1];
    if (last && last.label === label) {
      last.messages.push(msg);
    } else {
      groups.push({ label, messages: [msg] });
    }
  });
  return groups;
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

  const [activeTab, setActiveTab] = useState<"chats" | "search" | "invites" | "pilotage" | "settings">("chats");
  const [showRightPanel, setShowRightPanel] = useState(false);

  const [chatList, setChatList] = useState<ChatRow[]>(initialChats as ChatRow[]);
  const [selectedChat, setSelectedChat] = useState<ChatRow | null>(
    (initialChats as ChatRow[]).find((c) => Number(c.id) === Number(initialSelectedChatId)) ||
      (initialChats as ChatRow[])[0] ||
      null,
  );
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [msgContent, setMsgContent] = useState("");
  const [replyingTo, setReplyingTo] = useState<MessageRow | null>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [chatSearch, setChatSearch] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResult, setSearchResult] = useState<any[]>([]);
  const [invitations, setInvitations] = useState<ChatInvitationRow[]>([]);

  const [preferences, setPreferences] = useState<any>(null);
  const [pilotage, setPilotage] = useState<any>(null);

  const [onlineMembers, setOnlineMembers] = useState<Record<string, any>>({});
  const [typingUsers, setTypingUsers] = useState<Record<string, string>>({});
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const markReadTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pusherRef = useRef<Pusher | null>(null);
  const presenceChannelRef = useRef<any>(null);

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

  const messageGroups = useMemo(() => groupMessagesByDate(messages), [messages]);

  // ─── Pusher initialization ────────────────────────────────────────────
  useEffect(() => {
    const pusher = new Pusher(PUSHER_KEY, {
      cluster: PUSHER_CLUSTER,
      channelAuthorization: {
        customHandler: async ({ channelName, socketId }, callback) => {
          try {
            const res = await getPusherAuthSignature(channelName, socketId);
            if ((res as any).auth) {
              callback(null, res as any);
            } else {
              callback(new Error("Pusher auth failed"), null);
            }
          } catch (e) {
            callback(e as Error, null);
          }
        },
      },
    });
    pusherRef.current = pusher;

    const userChannel = pusher.subscribe(`private-user.${currentUserId}`);
    userChannel.bind("new-invitation", () => loadInvitations());

    return () => {
      pusher.unsubscribe(`private-user.${currentUserId}`);
      pusher.disconnect();
      pusherRef.current = null;
    };
  }, [currentUserId]);

  // ─── Chat channel listeners ───────────────────────────────────────────
  useEffect(() => {
    if (!selectedChat) return;
    reloadMessages(selectedChat.id);
    markChatAsRead(String(selectedChat.id));

    const pusher = pusherRef.current;
    if (!pusher) return;

    const msgChannel = pusher.subscribe(`private-chat.${selectedChat.id}`);

    msgChannel.bind("new-message", (data: MessageRow) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === data.id)) return prev;
        return [...prev, data];
      });
      if (Number(data.sender?.id) !== Number(currentUserId)) {
        if (markReadTimeoutRef.current) clearTimeout(markReadTimeoutRef.current);
        markReadTimeoutRef.current = setTimeout(() => markChatAsRead(String(selectedChat.id)), 700);
      }
    });

    msgChannel.bind("message-reaction", (data: { message_id: number; emoji: string; user_id: number; action: "add" | "remove" }) => {
      setMessages((prev) =>
        prev.map((msg) => {
          if (msg.id !== data.message_id) return msg;
          const currentReactions = msg.reactions || [];
          let updatedReactions = [...currentReactions];
          const isMe = data.user_id === currentUserId;
          const existingEmojiIdx = updatedReactions.findIndex((r) => r.emoji === data.emoji);
          if (data.action === "add") {
            if (existingEmojiIdx >= 0) {
              updatedReactions[existingEmojiIdx].count += 1;
              if (isMe) updatedReactions[existingEmojiIdx].reacted_by_me = true;
            } else {
              updatedReactions.push({ emoji: data.emoji, count: 1, reacted_by_me: isMe });
            }
          } else {
            if (existingEmojiIdx >= 0) {
              updatedReactions[existingEmojiIdx].count -= 1;
              if (isMe) updatedReactions[existingEmojiIdx].reacted_by_me = false;
              if (updatedReactions[existingEmojiIdx].count <= 0) updatedReactions.splice(existingEmojiIdx, 1);
            }
          }
          return { ...msg, reactions: updatedReactions };
        }),
      );
    });

    msgChannel.bind("message-deleted", (data: { message_id: number }) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === data.message_id ? { ...msg, is_deleted: true, content: "Message supprimé", file_url: null } : msg,
        ),
      );
    });

    const presenceChannel = pusher.subscribe(`presence-chat.${selectedChat.id}`);
    presenceChannelRef.current = presenceChannel;

    presenceChannel.bind("pusher:subscription_succeeded", (members: any) => {
      const active: Record<string, any> = {};
      members.each((member: any) => { active[member.id] = member.info; });
      setOnlineMembers(active);
    });
    presenceChannel.bind("pusher:member_added", (member: any) => setOnlineMembers((prev) => ({ ...prev, [member.id]: member.info })));
    presenceChannel.bind("pusher:member_removed", (member: any) => {
      setOnlineMembers((prev) => { const next = { ...prev }; delete next[member.id]; return next; });
      setTypingUsers((prev) => { const next = { ...prev }; delete next[member.id]; return next; });
    });
    presenceChannel.bind("client-typing", (data: { user_id: number; name: string; typing: boolean }) => {
      if (data.user_id === currentUserId) return;
      setTypingUsers((prev) => {
        const next = { ...prev };
        if (data.typing) next[data.user_id] = data.name;
        else delete next[data.user_id];
        return next;
      });
    });

    return () => {
      pusher.unsubscribe(`private-chat.${selectedChat.id}`);
      pusher.unsubscribe(`presence-chat.${selectedChat.id}`);
      presenceChannelRef.current = null;
      setTypingUsers({});
      setOnlineMembers({});
      if (markReadTimeoutRef.current) { clearTimeout(markReadTimeoutRef.current); markReadTimeoutRef.current = null; }
    };
  }, [selectedChat, currentUserId]);

  useEffect(() => {
    loadPreferences();
    loadInvitations();
    loadPilotage();
    return () => { if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current); };
  }, []);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, typingUsers]);

  const loadPreferences = async () => { const res = await getMessagingPreferences(); if (res.data) setPreferences(res.data); };
  const loadInvitations = async () => { const res = await getInvitations(); if (res.data) setInvitations(res.data); };
  const loadPilotage = async () => { const res = await getPilotageConfig(daaraId || undefined); if (res.data) setPilotage(res.data); };
  const reloadMessages = async (chatId: string | number) => { const { data } = await getMessagesForChat(String(chatId)); setMessages((data as MessageRow[]) || []); };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!msgContent.trim() && !selectedFile) return;
    if (!selectedChat) return;
    const content = msgContent;
    const file = selectedFile;
    const replyTo = replyingTo;
    setMsgContent("");
    setSelectedFile(null);
    setReplyingTo(null);
    startTransition(async () => {
      const formData = new FormData();
      formData.append("chat", String(selectedChat.id));
      formData.append("content", content);
      formData.append("message_type", file ? "file" : "text");
      if (file) formData.append("file", file);
      if (replyTo) formData.append("reply_to", String(replyTo.id));
      const res = await sendChatMessage(formData);
      if (res.error) {
        toast.error(res.error);
        setMsgContent(content);
        setSelectedFile(file);
        setReplyingTo(replyTo);
      }
    });
  };

  const handleMessageChange = (val: string) => {
    setMsgContent(val);
    if (!selectedChat) return;
    if (!isTyping) {
      setIsTyping(true);
      presenceChannelRef.current?.trigger("client-typing", { user_id: currentUserId, name: preferences?.visibility !== "nobody" ? "Quelqu'un" : "Un membre", typing: true });
    }
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      presenceChannelRef.current?.trigger("client-typing", { user_id: currentUserId, name: "", typing: false });
    }, 2000);
  };

  const handleReact = async (msgId: number, emoji: string) => {
    const res = await toggleMessageReaction(msgId, emoji);
    if (res.error) toast.error(res.error);
  };

  const handleDeleteMsg = (msgId: number) => {
    toast("Supprimer ce message ?", {
      action: {
        label: "Confirmer",
        onClick: async () => {
          const res = await deleteMessage(msgId);
          if (res.error) {
            toast.error(res.error);
          } else {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === msgId
                  ? { ...m, is_deleted: true, content: "Message supprimé", file_url: null }
                  : m,
              ),
            );
          }
        },
      },
      cancel: { label: "Annuler", onClick: () => {} },
    });
  };

  const handleSearchMembers = async (q: string) => {
    setSearchTerm(q);
    if (searchTimeoutRef.current) { clearTimeout(searchTimeoutRef.current); searchTimeoutRef.current = null; }
    if (q.trim().length < 2) { setSearchResult([]); return; }
    searchTimeoutRef.current = setTimeout(async () => {
      const res = await searchMembers(q);
      if (res.data) setSearchResult(res.data);
    }, 250);
  };

  const handleSendInvite = async (userId: number) => {
    const res = await createInvitation(userId);
    if (res.error) { toast.error(res.error); }
    else { toast.success("Invitation envoyée."); setSearchTerm(""); setSearchResult([]); }
  };

  const handleRespondInvite = async (inviteId: number, accept: boolean) => {
    const res = await respondToInvitation(inviteId, accept);
    if (res.error) { toast.error(res.error); }
    else {
      loadInvitations();
      const chatsRes = await getChats();
      if (chatsRes.data) {
        setChatList(chatsRes.data);
        if (accept && (res.data as any)?.chat) { setSelectedChat((res.data as any).chat); setActiveTab("chats"); }
      }
    }
  };

  const handlePrefChange = async (key: string, value: any) => {
    const updated = { ...preferences, [key]: value };
    setPreferences(updated);
    const res = await updateMessagingPreferences({ [key]: value });
    if (res.error) { toast.error(res.error); loadPreferences(); }
  };

  const handlePilotageChange = async (key: string, value: any) => {
    const updated = { ...pilotage, [key]: value };
    setPilotage(updated);
    const res = await updatePilotageConfig({ ...updated, daara: daaraId || null });
    if (res.error) { toast.error(res.error); loadPilotage(); }
  };

  const resetCreateForm = () => { setNewName(""); setInviteMode("manual"); setPresetDaaraId(""); setManualIds([]); setManualSearch(""); setCreateError(""); };

  const handleCreateChat = () => {
    setCreateError("");
    const name = newName.trim();
    if (!name) { setCreateError("Indiquez un nom pour le salon."); return; }
    if (isAdmin && needsPresetDaara(inviteMode) && !presetDaaraId) { setCreateError("Sélectionnez le Daara cible pour ce mode d'invitation."); return; }
    startTransition(async () => {
      const res = await createChat({ name, invite_mode: inviteMode, daara_id: daaraId || undefined, preset_daara_id: presetDaaraId ? Number(presetDaaraId) : undefined, manual_user_ids: inviteMode === "manual" && manualIds.length ? manualIds : undefined });
      if (res.error) { setCreateError(res.error); return; }
      setNewOpen(false);
      resetCreateForm();
      const chatsRes = await getChats();
      if (chatsRes.data) setChatList(chatsRes.data);
    });
  };

  const toggleManualId = (id: number) => setManualIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

  const isUserOnline = (userId: number) => !!onlineMembers[userId];

  const getChatStatus = () => {
    if (!selectedChat) return "";
    if (selectedChat.chat_type === "group") {
      const activeCount = Object.keys(onlineMembers).length;
      return `${selectedChat.members_count || 0} membres · ${activeCount} en ligne`;
    }
    const otherMemberId = Object.keys(onlineMembers).find((k) => Number(k) !== currentUserId);
    if (otherMemberId) {
      const typers = Object.values(typingUsers);
      return typers.length > 0 ? "écrit..." : "en ligne";
    }
    return "hors ligne";
  };

  const pickableUsers = directoryUsers.filter((u) => u.id !== currentUserId && u.role !== "admin");
  const pendingIncomingInvitations = invitations.filter((invite) => invite.status === "pending" && Number(invite.recipient.id) === Number(currentUserId));
  const totalUnread = chatList.reduce((acc, c) => acc + (c.unread_count || 0), 0);

  // ═══════════════════════════════════════════════════════════════
  //  RENDER
  // ═══════════════════════════════════════════════════════════════
  return (
    <div className="flex-1 flex overflow-hidden h-full">

      {/* ── SIDEBAR ICÔNES ─────────────────────────────────────────── */}
      <div className="w-[68px] bg-card border-r flex flex-col items-center py-5 gap-2 justify-between shrink-0" style={{ borderColor: "var(--border)" }}>
        <div className="flex flex-col gap-1 items-center w-full px-2">
          {/* Logo */}
          <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: "var(--primary)" }}>
            <MessageSquare size={18} className="text-white" />
          </div>

          {[
            { tab: "chats" as const, icon: <MessageSquare size={20} />, label: "Discussions", badge: totalUnread > 0 ? totalUnread : 0 },
            { tab: "search" as const, icon: <Search size={20} />, label: "Rechercher" },
            { tab: "invites" as const, icon: <UserCheck size={20} />, label: "Invitations", badge: pendingIncomingInvitations.length },
            ...(canCreateSalon ? [{ tab: "pilotage" as const, icon: <Shield size={20} />, label: "Pilotage" }] : []),
          ].map(({ tab, icon, label, badge }) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              title={label}
              className={`relative w-full flex items-center justify-center p-3 rounded-xl transition-all ${
                activeTab === tab
                  ? "text-white"
                  : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
              }`}
              style={activeTab === tab ? { background: "var(--primary)" } : {}}
            >
              {icon}
              {badge ? (
                <span className="absolute top-1.5 right-1.5 h-4 min-w-[16px] px-1 flex items-center justify-center text-[9px] font-black bg-red-500 text-white rounded-full">
                  {badge > 9 ? "9+" : badge}
                </span>
              ) : null}
            </button>
          ))}
        </div>

        <button
          onClick={() => setActiveTab("settings")}
          title="Paramètres"
          className={`relative w-10 flex items-center justify-center p-3 rounded-xl transition-all ${
            activeTab === "settings" ? "text-white" : "text-muted-foreground hover:bg-muted/60"
          }`}
          style={activeTab === "settings" ? { background: "var(--primary)" } : {}}
        >
          <Settings size={20} />
        </button>
      </div>

      {/* ── PANNEAU CENTRAL (liste chats / onglets) ──────────────────── */}
      <div className="w-[300px] bg-card border-r flex flex-col shrink-0 min-w-0" style={{ borderColor: "var(--border)" }}>

        {/* ─ ONGLET : DISCUSSIONS ─ */}
        {activeTab === "chats" && (
          <>
            <div className="px-4 pt-5 pb-3 border-b space-y-3" style={{ borderColor: "var(--border)" }}>
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-base tracking-tight">Messages</h2>
                {canCreateSalon && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs rounded-lg gap-1"
                    onClick={() => { resetCreateForm(); setNewOpen(true); }}
                  >
                    + Salon
                  </Button>
                )}
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
                <Input
                  placeholder="Rechercher..."
                  className="pl-8 h-9 text-sm bg-muted/40 border-transparent focus-visible:border-border focus-visible:bg-background rounded-xl"
                  value={chatSearch}
                  onChange={(e) => setChatSearch(e.target.value)}
                />
              </div>
            </div>

            <ScrollArea className="flex-1">
              <div className="py-2">
                {chatList
                  .filter((c) => c.display_name.toLowerCase().includes(chatSearch.toLowerCase()))
                  .map((chat) => {
                    const isSelected = Number(selectedChat?.id) === Number(chat.id);
                    const initials = chat.display_name.slice(0, 2).toUpperCase();
                    return (
                      <button
                        key={chat.id}
                        type="button"
                        onClick={() => { setSelectedChat(chat); }}
                        className={`w-full px-3 py-2.5 flex items-center gap-3 transition-colors text-left ${
                          isSelected ? "bg-primary/8 border-l-[3px]" : "hover:bg-muted/40 border-l-[3px] border-l-transparent"
                        }`}
                        style={isSelected ? { borderLeftColor: "var(--primary)", backgroundColor: "color-mix(in srgb, var(--primary) 8%, transparent)" } : {}}
                      >
                        <div className="relative shrink-0">
                          <Avatar className="h-11 w-11">
                            {chat.avatar ? <AvatarImage src={chat.avatar} /> : null}
                            <AvatarFallback className="text-sm font-bold text-white" style={{ background: "var(--primary)" }}>
                              {initials}
                            </AvatarFallback>
                          </Avatar>
                          {chat.chat_type === "direct" && isUserOnline(Number(chat.id)) && (
                            <span className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 rounded-full border-2 border-card" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-0.5">
                            <span className="font-semibold text-sm truncate">{chat.display_name}</span>
                            {chat.last_message && (
                              <span className="text-[10px] text-muted-foreground shrink-0 ml-1">
                                {new Date(chat.last_message.sent_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center justify-between gap-1">
                            <p className="text-xs text-muted-foreground truncate flex-1">
                              {chat.last_message ? (
                                <>{chat.last_message.sender_name}: {chat.last_message.content}</>
                              ) : (
                                <span className="italic">Aucun message</span>
                              )}
                            </p>
                            {chat.unread_count ? (
                              <span className="h-5 min-w-[20px] px-1 flex items-center justify-center text-[9px] font-black text-white rounded-full shrink-0" style={{ background: "var(--primary)" }}>
                                {chat.unread_count}
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </button>
                    );
                  })}

                {chatList.length === 0 && (
                  <div className="p-8 text-center text-sm text-muted-foreground italic">Aucune discussion.</div>
                )}
              </div>
            </ScrollArea>
          </>
        )}

        {/* ─ ONGLET : RECHERCHE ─ */}
        {activeTab === "search" && (
          <div className="flex-1 flex flex-col p-4 gap-4">
            <div>
              <h2 className="font-bold text-base">Trouver des membres</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Invitez des membres à démarrer un chat direct.</p>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
              <Input
                placeholder="Nom, email, Daara..."
                className="pl-8 h-9 text-sm"
                value={searchTerm}
                onChange={(e) => handleSearchMembers(e.target.value)}
              />
            </div>
            <ScrollArea className="flex-1">
              <div className="space-y-2 pr-1">
                {searchResult.map((u) => (
                  <div key={u.id} className="p-3 rounded-xl border flex items-center justify-between gap-3" style={{ borderColor: "var(--border)" }}>
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar className="h-9 w-9 shrink-0">
                        {u.avatar ? <AvatarImage src={u.avatar} /> : null}
                        <AvatarFallback className="text-xs font-bold text-white" style={{ background: "var(--primary)" }}>
                          {u.name[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <div className="font-semibold text-sm truncate">{u.name}</div>
                        <div className="text-[10px] text-muted-foreground truncate">{u.role}{u.daara_name ? ` · ${u.daara_name}` : ""}</div>
                      </div>
                    </div>
                    <Button size="sm" onClick={() => handleSendInvite(u.id)} className="text-xs h-8 shrink-0 text-white" style={{ background: "var(--primary)" }}>
                      Inviter
                    </Button>
                  </div>
                ))}
                {searchTerm.trim().length >= 2 && searchResult.length === 0 && (
                  <p className="text-center text-sm text-muted-foreground italic mt-6">Aucun membre trouvé.</p>
                )}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* ─ ONGLET : INVITATIONS ─ */}
        {activeTab === "invites" && (
          <div className="flex-1 flex flex-col p-4 gap-4">
            <div>
              <h2 className="font-bold text-base">Invitations</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Demandes de discussion directe.</p>
            </div>
            <ScrollArea className="flex-1">
              <div className="space-y-3">
                {pendingIncomingInvitations.map((invite) => (
                  <div key={invite.id} className="p-3.5 rounded-xl border space-y-3" style={{ borderColor: "var(--border)" }}>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        {invite.sender.avatar ? <AvatarImage src={invite.sender.avatar} /> : null}
                        <AvatarFallback className="text-xs font-bold text-white" style={{ background: "var(--primary)" }}>
                          {invite.sender.name[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-sm truncate">{invite.sender.name}</div>
                        <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <Clock size={10} />
                          {new Date(invite.created_at).toLocaleDateString("fr-FR")}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleRespondInvite(invite.id, true)} className="flex-1 text-xs h-8 text-white" style={{ background: "var(--primary)" }}>
                        Accepter
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleRespondInvite(invite.id, false)} className="flex-1 text-xs h-8">
                        Décliner
                      </Button>
                    </div>
                  </div>
                ))}
                {pendingIncomingInvitations.length === 0 && (
                  <p className="text-center text-sm text-muted-foreground italic py-8">Aucune invitation en attente.</p>
                )}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* ─ ONGLET : PILOTAGE ─ */}
        {activeTab === "pilotage" && pilotage && (
          <div className="flex-1 flex flex-col p-4 gap-4 overflow-y-auto">
            <div className="flex items-center gap-2">
              <Shield size={18} style={{ color: "var(--primary)" }} />
              <h2 className="font-bold text-base">Pilotage</h2>
            </div>
            <p className="text-xs text-muted-foreground -mt-2">Configuration des échanges pour {pilotage.daara_name || "la Plateforme"}.</p>
            <div className="space-y-2">
              {[
                { key: "allow_cross_daara_search", label: "Recherche inter-Daara", desc: "Autoriser la recherche de membres d'autres Daaras." },
                { key: "allow_member_invite", label: "Invitations directes", desc: "Autoriser les membres à s'inviter en privé." },
                { key: "allow_group_creation", label: "Création de groupes", desc: "Autoriser les membres à créer des salons collectifs." },
                { key: "allow_file_sharing", label: "Partage de fichiers", desc: "Autoriser l'envoi de documents joints." },
                { key: "allow_member_visibility_setting", label: "Paramètre de visibilité", desc: "Autoriser les membres à ajuster leur propre visibilité." },
              ].map(({ key, label, desc }) => (
                <div key={key} className="flex items-center justify-between gap-3 p-3 rounded-xl bg-muted/40 hover:bg-muted/60 transition-colors">
                  <div>
                    <span className="text-xs font-semibold block">{label}</span>
                    <p className="text-[10px] text-muted-foreground">{desc}</p>
                  </div>
                  <Checkbox checked={pilotage[key]} onCheckedChange={(checked) => handlePilotageChange(key, !!checked)} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─ ONGLET : PARAMÈTRES ─ */}
        {activeTab === "settings" && preferences && (
          <div className="flex-1 flex flex-col p-4 gap-4 overflow-y-auto">
            <div className="flex items-center gap-2">
              <Settings size={18} style={{ color: "var(--primary)" }} />
              <h2 className="font-bold text-base">Paramètres</h2>
            </div>
            <p className="text-xs text-muted-foreground -mt-2">Confidentialité et notifications.</p>
            <div className="space-y-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Qui peut vous voir ?</Label>
                <select
                  className="flex h-9 w-full rounded-lg border bg-background px-3 text-xs shadow-sm focus:outline-none focus:ring-2"
                  style={{ borderColor: "var(--border)" }}
                  value={preferences.visibility}
                  onChange={(e) => handlePrefChange("visibility", e.target.value)}
                  disabled={pilotage && !pilotage.allow_member_visibility_setting}
                >
                  <option value="all">Tout le monde</option>
                  <option value="daara_only">Mon Daara uniquement</option>
                  <option value="nobody">Personne</option>
                </select>
                {pilotage && !pilotage.allow_member_visibility_setting && (
                  <p className="text-[10px] text-muted-foreground italic">Verrouillé par l&apos;administrateur.</p>
                )}
              </div>
              {[
                { key: "allow_direct_invites", label: "Invitations directes", desc: "Autoriser les invitations en message privé." },
                { key: "allow_group_invites", label: "Invitations de groupes", desc: "Autoriser les invitations dans des salons." },
                { key: "show_online_status", label: "Statut en ligne", desc: "Afficher mon statut connecté aux autres." },
                { key: "notifications_enabled", label: "Notifications", desc: "Recevoir des alertes pour les nouveaux messages." },
              ].map(({ key, label, desc }) => (
                <div key={key} className="flex items-center justify-between gap-3 p-3 rounded-xl bg-muted/40">
                  <div>
                    <span className="text-xs font-semibold block">{label}</span>
                    <p className="text-[10px] text-muted-foreground">{desc}</p>
                  </div>
                  <Checkbox checked={preferences[key]} onCheckedChange={(checked) => handlePrefChange(key, !!checked)} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── ZONE DE CHAT PRINCIPALE ──────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0" style={{ background: "var(--background)" }}>
        {!selectedChat ? (
          /* Empty state */
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center p-8">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: "color-mix(in srgb, var(--primary) 10%, transparent)" }}>
              <MessageSquare size={32} style={{ color: "var(--primary)" }} />
            </div>
            <div>
              <h3 className="font-bold text-lg">Messagerie Yessal</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-xs">Sélectionnez une discussion ou invitez un membre pour commencer.</p>
            </div>
          </div>
        ) : (
          <>
            {/* ─ HEADER CHAT ─ */}
            <div className="h-[65px] px-5 border-b flex items-center justify-between shrink-0 bg-card" style={{ borderColor: "var(--border)" }}>
              <div className="flex items-center gap-3">
                <Avatar className="h-9 w-9">
                  {selectedChat.avatar ? <AvatarImage src={selectedChat.avatar} /> : null}
                  <AvatarFallback className="font-bold text-sm text-white" style={{ background: "var(--primary)" }}>
                    {selectedChat.display_name[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-semibold text-sm leading-none">{selectedChat.display_name}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5" style={getChatStatus() === "en ligne" || getChatStatus().includes("ligne") ? { color: "#22c55e" } : {}}>
                    {getChatStatus()}
                  </div>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setShowRightPanel(!showRightPanel)} className={`h-8 w-8 rounded-lg ${showRightPanel ? "bg-primary/10" : ""}`} style={showRightPanel ? { color: "var(--primary)" } : {}}>
                <Info size={17} />
              </Button>
            </div>

            {/* ─ MESSAGES ─ */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-1 min-h-0">
              {messageGroups.map((group) => (
                <div key={group.label}>
                  {/* Date separator */}
                  <div className="flex items-center gap-3 my-5">
                    <div className="flex-1 h-px bg-border" />
                    <span className="text-[10px] font-semibold text-muted-foreground bg-background border px-3 py-1 rounded-full" style={{ borderColor: "var(--border)" }}>
                      {group.label}
                    </span>
                    <div className="flex-1 h-px bg-border" />
                  </div>

                  <div className="space-y-2">
                    {group.messages.map((m) => {
                      const isMe = Number(m.sender.id) === Number(currentUserId);
                      const isSystem = m.message_type === "system";
                      const isGroup = selectedChat.chat_type === "group";

                      if (isSystem) {
                        return (
                          <div key={m.id} className="flex justify-center my-3">
                            <span className="px-3 py-1 rounded-full bg-muted text-[10px] font-medium text-muted-foreground">{m.content}</span>
                          </div>
                        );
                      }

                      return (
                        <div key={m.id} className={`flex gap-2.5 group ${isMe ? "flex-row-reverse" : "flex-row"}`}>
                          {/* Avatar (only for others) */}
                          {!isMe && (
                            <Avatar className="h-8 w-8 shrink-0 mt-1">
                              {m.sender.avatar ? <AvatarImage src={m.sender.avatar} /> : null}
                              <AvatarFallback className="text-[10px] font-bold text-white" style={{ background: "var(--primary)" }}>
                                {m.sender.name[0].toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                          )}

                          <div className={`max-w-[65%] flex flex-col gap-1 relative ${isMe ? "items-end" : "items-start"}`}>
                            {/* Sender name in group (others only) */}
                            {!isMe && isGroup && (
                              <span className="text-[11px] font-bold ml-1" style={{ color: "var(--primary)" }}>{m.sender.name}</span>
                            )}

                            {/* Bubble */}
                            <div
                              className={`relative px-4 py-2.5 shadow-sm ${
                                isMe
                                  ? "rounded-2xl rounded-tr-sm text-white"
                                  : "rounded-2xl rounded-tl-sm bg-card border text-foreground"
                              } ${m.is_deleted ? "opacity-50 italic" : ""}`}
                              style={isMe ? { background: "var(--primary)" } : { borderColor: "var(--border)" }}
                            >
                              {/* Reply quote */}
                              {m.reply_to && (
                                <div className={`mb-2 pl-3 py-1.5 rounded-lg text-xs border-l-4 ${isMe ? "bg-white/15 border-white/40" : "bg-muted/60 border-muted-foreground/30"}`}>
                                  <span className="opacity-80 line-clamp-2">{messages.find((x) => x.id === m.reply_to)?.content || "Message référencé"}</span>
                                </div>
                              )}

                              {/* File attachment */}
                              {m.message_type === "file" && m.file_url && (
                                <div className={`mb-2 p-3 rounded-xl flex items-center gap-3 ${isMe ? "bg-white/15" : "bg-muted/60"}`}>
                                  <FileText size={22} className={isMe ? "text-white/80 shrink-0" : "shrink-0"} style={!isMe ? { color: "var(--primary)" } : {}} />
                                  <div className="min-w-0 flex-1">
                                    <p className="text-xs font-semibold truncate">{m.content || "Fichier partagé"}</p>
                                    <a href={m.file_url} target="_blank" rel="noreferrer" className={`text-[10px] font-bold hover:underline mt-0.5 inline-block ${isMe ? "text-white/70" : ""}`} style={!isMe ? { color: "var(--primary)" } : {}}>
                                      Télécharger
                                    </a>
                                  </div>
                                </div>
                              )}

                              {/* Text */}
                              {m.message_type === "text" && (
                                <p className="text-sm leading-relaxed whitespace-pre-wrap break-words pr-14">{m.content}</p>
                              )}

                              {/* Time + checkmark */}
                              <div className="absolute bottom-1.5 right-3 flex items-center gap-1 select-none">
                                <span className={`text-[9px] font-medium ${isMe ? "text-white/60" : "text-muted-foreground"}`}>
                                  {new Date(m.sent_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                </span>
                                {isMe && <CheckCheck size={10} className="text-white/60" />}
                              </div>

                              {/* Reactions */}
                              {m.reactions && m.reactions.length > 0 && (
                                <div className={`absolute -bottom-3 ${isMe ? "right-2" : "left-2"} flex items-center gap-0.5 bg-card border rounded-full px-2 py-0.5 shadow-sm z-10`} style={{ borderColor: "var(--border)" }}>
                                  {m.reactions.map((r, idx) => (
                                    <button key={idx} onClick={() => handleReact(m.id, r.emoji)} className={`text-[11px] flex items-center gap-0.5 hover:scale-110 transition-transform ${r.reacted_by_me ? "font-bold" : ""}`}>
                                      {r.emoji}<span className="text-[9px] text-muted-foreground">{r.count}</span>
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* Hover actions */}
                            {!m.is_deleted && (
                              <div className={`opacity-0 group-hover:opacity-100 flex items-center gap-1 ${isMe ? "flex-row-reverse" : "flex-row"} transition-opacity`}>
                                {EMOJIS.slice(0, 3).map((emoji) => (
                                  <button key={emoji} onClick={() => handleReact(m.id, emoji)} className="text-sm hover:scale-125 transition-transform bg-card border rounded-full w-6 h-6 flex items-center justify-center shadow-sm" style={{ borderColor: "var(--border)" }}>
                                    {emoji}
                                  </button>
                                ))}
                                <button onClick={() => setReplyingTo(m)} className="h-6 w-6 flex items-center justify-center rounded-full bg-card border text-muted-foreground hover:text-foreground shadow-sm transition-colors" style={{ borderColor: "var(--border)" }} title="Répondre">
                                  <Reply size={12} />
                                </button>
                                {(isMe || viewerRole === "admin") && (
                                  <button onClick={() => handleDeleteMsg(m.id)} className="h-6 w-6 flex items-center justify-center rounded-full bg-card border text-muted-foreground hover:text-red-500 shadow-sm transition-colors" style={{ borderColor: "var(--border)" }} title="Supprimer">
                                    <Trash2 size={12} />
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}

              {/* Typing indicator */}
              {Object.values(typingUsers).length > 0 && (
                <div className="flex items-center gap-2.5 px-1">
                  <div className="flex gap-1 items-center bg-card border px-3 py-2 rounded-2xl rounded-tl-sm shadow-sm" style={{ borderColor: "var(--border)" }}>
                    <span className="text-xs text-muted-foreground italic">{Object.values(typingUsers).join(", ")} écrit</span>
                    <span className="flex gap-0.5 ml-1">
                      {[0, 1, 2].map((i) => (
                        <span key={i} className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                      ))}
                    </span>
                  </div>
                </div>
              )}

              {messages.length === 0 && (
                <div className="h-full flex items-center justify-center">
                  <p className="text-sm text-muted-foreground italic">Aucun message. Lancez la conversation !</p>
                </div>
              )}
            </div>

            {/* ─ INPUT BAR ─ */}
            <div className="px-4 py-3 border-t bg-card shrink-0 space-y-2" style={{ borderColor: "var(--border)" }}>
              {/* Reply preview */}
              {replyingTo && (
                <div className="flex items-center justify-between px-3 py-2 rounded-xl border-l-4 bg-muted/40 text-xs" style={{ borderLeftColor: "var(--primary)" }}>
                  <div className="min-w-0">
                    <span className="font-semibold block" style={{ color: "var(--primary)" }}>Réponse à {replyingTo.sender.name}</span>
                    <p className="text-muted-foreground truncate mt-0.5">{replyingTo.content}</p>
                  </div>
                  <button onClick={() => setReplyingTo(null)} className="text-muted-foreground hover:text-foreground ml-3 shrink-0"><X size={14} /></button>
                </div>
              )}

              {/* File preview */}
              {selectedFile && (
                <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-muted/40 border text-xs" style={{ borderColor: "var(--border)" }}>
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText size={14} style={{ color: "var(--primary)" }} />
                    <span className="font-medium truncate">{selectedFile.name}</span>
                    <span className="text-muted-foreground shrink-0">({(selectedFile.size / 1024).toFixed(0)} KB)</span>
                  </div>
                  <button onClick={() => setSelectedFile(null)} className="text-muted-foreground hover:text-foreground ml-3 shrink-0"><X size={14} /></button>
                </div>
              )}

              <form onSubmit={handleSend} className="flex items-center gap-2 bg-muted/40 rounded-2xl border px-3 py-1.5" style={{ borderColor: "var(--border)" }}>
                {(!pilotage || pilotage.allow_file_sharing) && (
                  <>
                    <input type="file" ref={fileInputRef} onChange={(e) => { if (e.target.files?.length) setSelectedFile(e.target.files[0]); }} className="hidden" />
                    <button type="button" onClick={() => fileInputRef.current?.click()} className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-muted transition-colors shrink-0">
                      <Paperclip size={17} />
                    </button>
                  </>
                )}

                <Input
                  value={msgContent}
                  onChange={(e) => handleMessageChange(e.target.value)}
                  placeholder="Tapez un message..."
                  className="border-none focus-visible:ring-0 bg-transparent flex-1 text-sm h-9 px-0"
                  disabled={isPending}
                />

                <Button
                  type="submit"
                  size="icon"
                  className="h-9 w-9 rounded-xl shrink-0 text-white shadow-sm"
                  style={{ background: "var(--primary)" }}
                  disabled={(!msgContent.trim() && !selectedFile) || isPending}
                >
                  <Send size={16} />
                </Button>
              </form>
            </div>
          </>
        )}
      </div>

      {/* ── PANNEAU DROIT — INFO CONVERSATION ───────────────────────── */}
      {selectedChat && showRightPanel && (
        <div className="w-[260px] bg-card border-l flex flex-col shrink-0 overflow-y-auto" style={{ borderColor: "var(--border)" }}>
          <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b" style={{ borderColor: "var(--border)" }}>
            <h3 className="font-bold text-sm">Informations</h3>
            <button onClick={() => setShowRightPanel(false)} className="text-muted-foreground hover:text-foreground"><X size={17} /></button>
          </div>

          <div className="flex flex-col items-center text-center px-5 py-6 gap-3">
            <Avatar className="h-16 w-16 ring-4" style={{ '--tw-ring-color': 'color-mix(in srgb, var(--primary) 20%, transparent)' } as any}>
              {selectedChat.avatar ? <AvatarImage src={selectedChat.avatar} /> : null}
              <AvatarFallback className="text-xl font-bold text-white" style={{ background: "var(--primary)" }}>
                {selectedChat.display_name[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h4 className="font-bold">{selectedChat.display_name}</h4>
              <p className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-wider font-semibold">
                {selectedChat.chat_type === "direct" ? "Discussion privée" : "Salon de groupe"}
              </p>
            </div>
          </div>

          <div className="h-px bg-border mx-5" />

          {selectedChat.chat_type === "group" && Object.values(onlineMembers).length > 0 && (
            <div className="px-5 py-4 space-y-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Membres connectés</span>
              <div className="space-y-2">
                {Object.values(onlineMembers).map((m: any, idx) => (
                  <div key={idx} className="flex items-center gap-2.5">
                    <span className="h-2 w-2 rounded-full bg-green-500 shrink-0" />
                    <span className="text-xs font-medium truncate">{m.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── DIALOG CRÉATION SALON ────────────────────────────────────── */}
      <Dialog open={newOpen} onOpenChange={(o) => { setNewOpen(o); if (!o) resetCreateForm(); }}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Créer un salon de groupe</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-1">
            <div className="space-y-1.5">
              <Label htmlFor="salon-name" className="text-xs font-semibold">Nom du salon</Label>
              <Input id="salon-name" placeholder="Ex: Coordination Ramadan" value={newName} onChange={(e) => setNewName(e.target.value)} className="rounded-xl" />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="invite-mode" className="text-xs font-semibold">Mode d&apos;invitation</Label>
              <select
                id="invite-mode"
                className="flex h-10 w-full rounded-xl border bg-background px-3 py-2 text-sm shadow-sm focus:outline-none"
                style={{ borderColor: "var(--border)" }}
                value={inviteMode}
                onChange={(e) => setInviteMode(e.target.value as ChatInviteMode)}
              >
                {modeOptions.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
            </div>

            {isAdmin && needsPresetDaara(inviteMode) && daarasForSelect.length > 0 && (
              <div className="space-y-1.5">
                <Label htmlFor="preset-daara" className="text-xs font-semibold">Daara cible</Label>
                <select
                  id="preset-daara"
                  className="flex h-10 w-full rounded-xl border bg-background px-3 py-2 text-sm shadow-sm focus:outline-none"
                  style={{ borderColor: "var(--border)" }}
                  value={presetDaaraId}
                  onChange={(e) => setPresetDaaraId(e.target.value)}
                >
                  <option value="">Sélectionner un Daara</option>
                  {daarasForSelect.map((daara) => <option key={daara.id} value={daara.id}>{daara.name || `Daara #${daara.id}`}</option>)}
                </select>
              </div>
            )}

            {inviteMode === "manual" && pickableUsers.length > 0 && (
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Membres à inviter</Label>
                <Input
                  value={manualSearch}
                  onChange={(e) => setManualSearch(e.target.value)}
                  placeholder="Filtrer les membres..."
                  className="h-9 rounded-xl text-xs"
                />
                <ScrollArea className="h-36 rounded-xl border p-3" style={{ borderColor: "var(--border)" }}>
                  <div className="space-y-2.5 pr-1">
                    {pickableUsers
                      .filter((u) => {
                        const q = manualSearch.trim().toLowerCase();
                        return !q || `${u.first_name} ${u.last_name} ${u.role}`.toLowerCase().includes(q);
                      })
                      .map((u) => (
                        <label key={u.id} className="flex items-center gap-2.5 text-xs cursor-pointer hover:text-foreground text-muted-foreground transition-colors">
                          <Checkbox checked={manualIds.includes(u.id)} onCheckedChange={() => toggleManualId(u.id)} />
                          <span className="font-medium text-foreground">{u.first_name} {u.last_name}</span>
                          <span className="text-[10px] text-muted-foreground">({u.role})</span>
                        </label>
                      ))}
                  </div>
                </ScrollArea>
              </div>
            )}

            {createError && <p className="text-xs text-red-500 font-semibold">{createError}</p>}
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button variant="outline" type="button" onClick={() => setNewOpen(false)} className="rounded-xl text-sm">Annuler</Button>
            <Button type="button" disabled={isPending} onClick={handleCreateChat} className="rounded-xl text-sm text-white" style={{ background: "var(--primary)" }}>
              Créer le salon
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
