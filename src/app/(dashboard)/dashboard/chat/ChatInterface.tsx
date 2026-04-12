"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { sendMessage } from "@/app/actions/comms";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Send,
  Hash,
  MoreVertical,
  MessageSquare,
  Search,
  User,
} from "lucide-react";

export function ChatInterface({
  initialChats,
  currentUser,
}: {
  initialChats: any[];
  currentUser: any;
}) {
  const [selectedChat, setSelectedChat] = useState<any>(
    initialChats[0] || null,
  );
  const [msgContent, setMsgContent] = useState("");
  const [isPending, startTransition] = useTransition();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [selectedChat]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!msgContent.trim() || !selectedChat) return;

    const content = msgContent;
    setMsgContent("");

    startTransition(async () => {
      const res = await sendMessage(selectedChat.id, content);
      if (res.error) {
        alert(res.error);
        setMsgContent(content); // Restore content on error
      }
    });
  };

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* SIDEBAR : CHAT LIST */}
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
              placeholder="Rechercher..."
              className="pl-9 h-9 bg-muted/30 border-none"
            />
          </div>
        </div>
        <ScrollArea className="flex-1">
          {/* // TOODO: add button to create new chat */}
          <div className="p-4">
            <Button variant="outline" size="sm" className="w-full">
              + Nouvelle discussion
            </Button>
          </div>
          {initialChats.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted-foreground italic">
              Aucune discussion active.
              <br />
              Invitez les membres de votre Daara à rejoindre la messagerie pour
              commencer à échanger !
            </div>
          ) : (
            initialChats.map((chat: any) => (
              <div
                key={chat.id}
                onClick={() => setSelectedChat(chat)}
                className={`p-4 flex items-center gap-3 cursor-pointer transition-colors border-b last:border-0 ${
                  selectedChat?.id === chat.id
                    ? "bg-yessal-green/5 border-l-4 border-l-yessal-green"
                    : "hover:bg-muted/50"
                }`}
                style={{
                  borderColor: "var(--border)",
                  borderLeftColor:
                    selectedChat?.id === chat.id
                      ? "var(--yessal-green)"
                      : "transparent",
                }}
              >
                <Avatar className="h-10 w-10">
                  <AvatarFallback
                    className="bg-yessal-green text-white"
                    style={{ background: "var(--yessal-green)" }}
                  >
                    {chat.name?.[0] || "D"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 overflow-hidden">
                  <div className="font-semibold text-sm truncate">
                    {chat.name || "Discussion générale"}
                  </div>
                  <div className="text-[10px] text-muted-foreground truncate">
                    {chat.messages?.[chat.messages.length - 1]?.content ||
                      "Démarrer la discussion..."}
                  </div>
                </div>
              </div>
            ))
          )}
        </ScrollArea>
      </div>

      {/* CHAT WINDOW */}
      <div className="flex-1 flex flex-col bg-background relative">
        {!selectedChat ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 opacity-40">
            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-4">
              <MessageSquare size={40} />
            </div>
            <h3 className="text-xl font-bold">
              Bienvenue sur le Messenger Yessal
            </h3>
            <p className="max-w-xs text-sm">
              Sélectionnez une discussion à gauche pour commencer à échanger
              avec votre Daara.
            </p>
          </div>
        ) : (
          <>
            {/* HEADER */}
            <div
              className="p-4 border-b flex items-center justify-between bg-card z-10"
              style={{ borderColor: "var(--border)" }}
            >
              <div className="flex items-center gap-3">
                <Avatar className="h-9 w-9">
                  <AvatarFallback
                    className="bg-yessal-green text-white"
                    style={{ background: "var(--yessal-green)" }}
                  >
                    <Hash size={18} />
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-bold text-sm leading-none">
                    {selectedChat.name || "Général"}
                  </div>
                  <div className="text-[10px] text-green-500 font-semibold mt-1 flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />{" "}
                    Salon actif
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Search size={16} />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <User size={16} />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical size={16} />
                </Button>
              </div>
            </div>

            {/* MESSAGES */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-6 space-y-4 bg-[url('/chat-bg-pattern.png')] bg-repeat"
            >
              {selectedChat.messages?.length === 0 ? (
                <div className="h-full flex items-center justify-center text-xs text-muted-foreground italic">
                  Le début d'une nouvelle histoire...
                </div>
              ) : (
                selectedChat.messages.map((m: any) => {
                  const isMe = m.sender === currentUser?.user_id;
                  return (
                    <div
                      key={m.id}
                      className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[70%] group ${isMe ? "items-end" : "items-start"}`}
                      >
                        <div
                          className={`text-[10px] text-muted-foreground mb-1 px-1 flex gap-2 ${isMe ? "flex-row-reverse" : ""}`}
                        >
                          <span className="font-bold">
                            {isMe ? "Moi" : m.sender_name}
                          </span>
                          <span>
                            {new Date(m.sent_at).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        <div
                          className={`p-3 rounded-2xl shadow-sm text-sm ${
                            isMe
                              ? "bg-yessal-green text-white rounded-tr-none"
                              : "bg-card border rounded-tl-none"
                          }`}
                          style={{
                            background: isMe
                              ? "var(--yessal-green)"
                              : "var(--card)",
                            borderColor: !isMe
                              ? "var(--border)"
                              : "transparent",
                          }}
                        >
                          {m.content}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* INPUT */}
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
                  placeholder="Écrire votre message..."
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
    </div>
  );
}
