"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  sendMessage,
  getMessagesForChat,
  createChat,
  type ChatInviteMode,
} from "@/app/actions/comms";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import { Send, Hash, MessageSquare, Search, Check, CheckCheck, MoreVertical } from "lucide-react";

type ChatRow = {
  id: number | string;
  name?: string | null;
  daara?: number | null;
};

type MessageRow = {
  id: number;
  sender: number;
  sender_name?: string;
  content: string;
  sent_at: string;
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
  initialChats: ChatRow[];
  currentUserId: number;
  initialSelectedChatId?: number | null;
  daaraId?: number | null;
  viewerRole?: string;
  directoryUsers?: ManualPickUser[];
  daarasForSelect?: DaaraOption[];
}) {
  const router = useRouter();
  const canCreateSalon =
    viewerRole === "admin" || viewerRole === "chef_daara";
  const isAdmin = viewerRole === "admin";

  const [chatList, setChatList] = useState<ChatRow[]>(initialChats);
  const [selectedChat, setSelectedChat] = useState<ChatRow | null>(
    initialChats.find((chat) => Number(chat.id) === Number(initialSelectedChatId)) ||
      initialChats[0] ||
      null,
  );
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [msgContent, setMsgContent] = useState("");
  const [isPending, startTransition] = useTransition();
  const [newOpen, setNewOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [inviteMode, setInviteMode] = useState<ChatInviteMode>("manual");
  const [presetDaaraId, setPresetDaaraId] = useState<string>("");
  const [contextDaaraId, setContextDaaraId] = useState<string>("");
  const [manualIds, setManualIds] = useState<number[]>([]);
  const [createError, setCreateError] = useState("");
  const [manualSearch, setManualSearch] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const modeOptions = isAdmin ? ADMIN_MODES : CHEF_MODES;

  const resetCreateForm = () => {
    setNewName("");
    setInviteMode("manual");
    setPresetDaaraId("");
    setContextDaaraId("");
    setManualIds([]);
    setManualSearch("");
    setCreateError("");
  };

  useEffect(() => {
    setChatList(initialChats);
    setSelectedChat((prev) => {
      if (!initialChats.length) return null;
      const byQuery = initialChats.find(
        (c) => Number(c.id) === Number(initialSelectedChatId),
      );
      if (byQuery) return byQuery;
      if (!prev) return initialChats[0];
      const found = initialChats.find((c) => String(c.id) === String(prev.id));
      return found || initialChats[0];
    });
  }, [initialChats, initialSelectedChatId]);

  useEffect(() => {
    if (!selectedChat) {
      setMessages([]);
      return;
    }

    const chatId = selectedChat.id;
    let cancelled = false;

    const fetchMsgs = async () => {
      const { data, error } = await getMessagesForChat(String(chatId));
      if (!cancelled) {
        if (error) setMessages([]);
        else setMessages((data as MessageRow[]) || []);
      }
    };

    fetchMsgs();

    // Polling WhatsApp-style
    const interval = setInterval(fetchMsgs, 5000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [selectedChat]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, selectedChat?.id]);

  const reloadMessages = async (chatId: string | number) => {
    const { data } = await getMessagesForChat(String(chatId));
    setMessages((data as MessageRow[]) || []);
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!msgContent.trim() || !selectedChat) return;

    const content = msgContent;
    setMsgContent("");

    startTransition(async () => {
      const res = await sendMessage(String(selectedChat.id), content);
      if (res.error) {
        alert(res.error);
        setMsgContent(content);
        return;
      }
      router.refresh();
      await reloadMessages(selectedChat.id);
    });
  };

  const toggleManualId = (id: number) => {
    setManualIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const handleCreateChat = () => {
    setCreateError("");
    const name = newName.trim();
    if (!name) {
      setCreateError("Indiquez un nom pour le salon.");
      return;
    }

    if (isAdmin && needsPresetDaara(inviteMode)) {
      const pid = Number(presetDaaraId);
      if (!pid) {
        setCreateError("Sélectionnez le Daara concerné.");
        return;
      }
    }

    startTransition(async () => {
      const preset =
        presetDaaraId && !Number.isNaN(Number(presetDaaraId))
          ? Number(presetDaaraId)
          : null;
      const contextD =
        contextDaaraId && !Number.isNaN(Number(contextDaaraId))
          ? Number(contextDaaraId)
          : null;

      let daara_id: number | null | undefined;
      let preset_daara_id: number | null | undefined;

      if (viewerRole === "chef_daara") {
        daara_id = daaraId ?? undefined;
        preset_daara_id = undefined;
      } else if (isAdmin) {
        if (needsPresetDaara(inviteMode) && preset) {
          preset_daara_id = preset;
          daara_id = preset;
        } else if (inviteMode === "manual" || inviteMode.startsWith("global")) {
          daara_id = contextD ?? undefined;
        }
      }

      const res = await createChat({
        name,
        invite_mode: inviteMode,
        daara_id: daara_id ?? undefined,
        preset_daara_id: preset_daara_id ?? undefined,
        manual_user_ids:
          inviteMode === "manual" && manualIds.length ? manualIds : undefined,
      });

      if (res.error) {
        setCreateError(res.error);
        return;
      }
      setNewOpen(false);
      resetCreateForm();
      router.refresh();
    });
  };

  const pickableUsers = directoryUsers.filter(
    (u) => u.id !== currentUserId && u.role !== "admin",
  );
  const filteredPickableUsers = pickableUsers.filter((u) => {
    const q = manualSearch.trim().toLowerCase();
    if (!q) return true;
    return [u.first_name, u.last_name, u.role]
      .join(" ")
      .toLowerCase()
      .includes(q);
  });

  return (
    <div className="flex-1 flex overflow-hidden">
      <div
        className="w-[300px] border-r flex flex-col bg-muted/10"
        style={{ borderColor: "var(--border)" }}
      >
        <div
          className="p-4 border-b bg-card space-y-4"
          style={{ borderColor: "var(--border)" }}
        >
          <div className="flex items-center justify-between">
            <span className="font-bold">Discussions</span>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MessageSquare size={16} />
            </Button>
          </div>
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              size={14}
            />
            <Input
              placeholder="Rechercher…"
              className="pl-9 h-9 bg-muted/30 border-none"
            />
          </div>
        </div>
        <ScrollArea className="flex-1">
          {canCreateSalon ? (
            <div className="p-4">
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                type="button"
                onClick={() => {
                  resetCreateForm();
                  setNewOpen(true);
                }}
              >
                + Nouveau salon
              </Button>
            </div>
          ) : null}
          {chatList.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted-foreground italic">
              Aucune discussion.{" "}
              {canCreateSalon
                ? "Créez un salon pour commencer."
                : "Un responsable vous ajoutera à un salon."}
            </div>
          ) : (
            chatList.map((chat) => (
              <div
                key={chat.id}
                role="button"
                tabIndex={0}
                onClick={() => setSelectedChat(chat)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") setSelectedChat(chat);
                }}
                className={`p-4 flex items-center gap-3 cursor-pointer transition-colors border-b last:border-0 ${
                  String(selectedChat?.id) === String(chat.id)
                    ? "bg-yessal-green/5 border-l-4 border-l-yessal-green"
                    : "hover:bg-muted/50"
                }`}
                style={{
                  borderColor: "var(--border)",
                  borderLeftColor:
                    String(selectedChat?.id) === String(chat.id)
                      ? "var(--yessal-green)"
                      : "transparent",
                }}
              >
                <Avatar className="h-10 w-10">
                  <AvatarFallback
                    className="bg-yessal-green text-white"
                    style={{ background: "var(--yessal-green)" }}
                  >
                    {(chat.name?.[0] || "D").toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 overflow-hidden">
                  <div className="font-semibold text-sm truncate">
                    {chat.name || "Discussion"}
                  </div>
                  <div className="text-[10px] text-muted-foreground truncate">
                    {chat.daara ? "Salon lié à un Daara" : "Salon communautaire"}
                  </div>
                </div>
              </div>
            ))
          )}
        </ScrollArea>
      </div>

      <div className="flex-1 flex flex-col bg-background relative min-w-0">
        {!selectedChat ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 opacity-40">
            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-4">
              <MessageSquare size={40} />
            </div>
            <h3 className="text-xl font-bold">Messagerie Yessal</h3>
            <p className="max-w-xs text-sm mt-2">
              Sélectionnez une discussion ou créez-en une nouvelle.
            </p>
          </div>
        ) : (
          <>
            <div
              className="p-4 border-b flex items-center justify-between bg-white/80 backdrop-blur-md z-10 sticky top-0"
              style={{ borderColor: "var(--border)" }}
            >
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 border-2 border-yessal-green/20">
                  <AvatarFallback
                    className="bg-yessal-green text-white"
                    style={{ background: "var(--yessal-green)" }}
                  >
                    {selectedChat.name ? selectedChat.name[0].toUpperCase() : <Hash size={18} />}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-bold text-sm leading-none">
                    {selectedChat.name || "Discussion"}
                  </div>
                  <div className="text-[10px] text-yessal-green mt-1 font-semibold animate-pulse">
                    en ligne
                  </div>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                <MoreVertical size={18} />
              </Button>
            </div>

            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-6 space-y-3 min-h-[200px]"
              style={{ 
                backgroundColor: "#e5ddd5",
                backgroundImage: "url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')",
                backgroundBlendMode: "overlay",
                backgroundOpacity: 0.06
              }}
            >
              {messages.length === 0 ? (
                <div className="h-full flex items-center justify-center text-xs text-muted-foreground italic bg-white/20 backdrop-blur-sm rounded-lg">
                  Aucun message pour l&apos;instant. Envoyez le premier.
                </div>
              ) : (
                messages.map((m) => {
                  const isMe = Number(m.sender) === Number(currentUserId);
                  return (
                    <div
                      key={m.id}
                      className={`flex ${isMe ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-1 duration-300`}
                    >
                      <div
                        className={`max-w-[85%] relative ${isMe ? "items-end" : "items-start"}`}
                      >
                        <div
                          className={`p-2 px-3 rounded-xl shadow-sm text-[13px] relative ${
                            isMe
                              ? "bg-[#dcf8c6] text-slate-800 rounded-tr-none"
                              : "bg-white text-slate-800 rounded-tl-none border border-slate-200"
                          }`}
                        >
                          {!isMe && (
                            <div className="text-[10px] font-black text-yessal-green mb-0.5 uppercase tracking-tighter">
                                {m.sender_name || "Membre"}
                            </div>
                          )}
                          <div className="leading-relaxed whitespace-pre-wrap break-words pb-4 pr-12">
                            {m.content}
                          </div>
                          
                          <div className="absolute bottom-1 right-2 flex items-center gap-1">
                            <span className="text-[9px] text-slate-400 font-medium">
                                {new Date(m.sent_at).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                })}
                            </span>
                            {isMe && (
                                <CheckCheck size={12} className="text-blue-500" />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div
              className="p-4 bg-muted/20 border-t"
              style={{ borderColor: "var(--border)" }}
            >
              <form
                onSubmit={handleSend}
                className="flex items-center gap-3 bg-card p-1.5 rounded-full border shadow-sm pl-4 overflow-hidden"
                style={{ borderColor: "var(--border)" }}
              >
                <Input
                  value={msgContent}
                  onChange={(e) => setMsgContent(e.target.value)}
                  placeholder="Écrire un message…"
                  className="border-none focus-visible:ring-0 bg-transparent flex-1"
                  disabled={isPending}
                />
                <Button
                  type="submit"
                  size="icon"
                  className="rounded-full h-10 w-10 shrink-0"
                  disabled={!msgContent.trim() || isPending}
                  style={{ background: "var(--yessal-green)", color: "white" }}
                >
                  <Send size={18} />
                </Button>
              </form>
            </div>
          </>
        )}
      </div>

      <Dialog
        open={newOpen}
        onOpenChange={(o) => {
          setNewOpen(o);
          if (!o) resetCreateForm();
        }}
      >
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nouveau salon</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="salon-name">Nom du salon</Label>
              <Input
                id="salon-name"
                placeholder="Ex. Coordination Ramadan"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="invite-mode">Invitations</Label>
              <select
                id="invite-mode"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                value={inviteMode}
                onChange={(e) =>
                  setInviteMode(e.target.value as ChatInviteMode)
                }
              >
                {modeOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {isAdmin && needsPresetDaara(inviteMode) ? (
              <div className="space-y-2">
                <Label htmlFor="preset-daara">Daara cible</Label>
                <select
                  id="preset-daara"
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                  value={presetDaaraId}
                  onChange={(e) => setPresetDaaraId(e.target.value)}
                >
                  <option value="">Choisir un Daara…</option>
                  {daarasForSelect.map((d) => (
                    <option key={d.id} value={String(d.id)}>
                      {d.name || `Daara #${d.id}`}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}

            {isAdmin &&
            (inviteMode === "manual" || inviteMode.startsWith("global")) ? (
              <div className="space-y-2">
                <Label htmlFor="ctx-daara">
                  Contexte Daara (optionnel)
                </Label>
                <select
                  id="ctx-daara"
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                  value={contextDaaraId}
                  onChange={(e) => setContextDaaraId(e.target.value)}
                >
                  <option value="">Aucun</option>
                  {daarasForSelect.map((d) => (
                    <option key={d.id} value={String(d.id)}>
                      {d.name || `Daara #${d.id}`}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}

            {inviteMode === "manual" && pickableUsers.length > 0 ? (
              <div className="space-y-2">
                <Label>Participants</Label>
                <Input
                  value={manualSearch}
                  onChange={(e) => setManualSearch(e.target.value)}
                  placeholder="Rechercher un membre ou un rôle..."
                />
                <ScrollArea className="h-40 rounded-md border p-2" style={{ borderColor: "var(--border)" }}>
                  <div className="space-y-2 pr-2">
                    {filteredPickableUsers.map((u) => (
                      <label
                        key={u.id}
                        className="flex items-center gap-2 text-sm cursor-pointer"
                      >
                        <Checkbox
                          checked={manualIds.includes(u.id)}
                          onCheckedChange={() => toggleManualId(u.id)}
                        />
                        <span>
                          {u.first_name} {u.last_name}
                          <span className="text-muted-foreground text-xs ml-1">
                            ({u.role})
                          </span>
                        </span>
                      </label>
                    ))}
                    {filteredPickableUsers.length === 0 ? (
                      <p className="text-xs text-muted-foreground">
                        Aucun membre ne correspond à la recherche.
                      </p>
                    ) : null}
                  </div>
                </ScrollArea>
              </div>
            ) : null}

            {inviteMode === "manual" && pickableUsers.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                Aucun contact disponible pour une sélection manuelle.
              </p>
            ) : null}

            {createError ? (
              <p className="text-xs text-red-600 font-medium">{createError}</p>
            ) : null}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              type="button"
              onClick={() => setNewOpen(false)}
            >
              Annuler
            </Button>
            <Button
              type="button"
              disabled={isPending}
              style={{ background: "var(--yessal-green)", color: "white" }}
              onClick={handleCreateChat}
            >
              Créer le salon
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
