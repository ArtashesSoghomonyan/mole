"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import {
  ArrowLeftIcon,
  ChatsCircle,
  PaperPlaneTilt,
  Spinner,
} from "@phosphor-icons/react";

import { useAuth } from "@/context/AuthContext";
import { Conversation, Message } from "@/types/chat";
import { DateFormat } from "@/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Bubble, BubbleContent } from "@/components/ui/bubble";
import {
  Message as MessageRow,
  MessageAvatar,
  MessageContent,
  MessageFooter,
  MessageGroup,
  MessageHeader,
} from "@/components/ui/message";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export default function ChatPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const socketRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState<string>("");
  const [conversationsLoading, setConversationsLoading] = useState<boolean>(true);
  const [messagesLoading, setMessagesLoading] = useState<boolean>(false);

  useEffect(() => {
    if (loading || !user) return;

    const fetchConversations = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        const response = await axios.get<Conversation[]>(
          `${process.env.NEXT_PUBLIC_API_URL}/chat/conversations`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setConversations(response.data);
      } catch (error) {
        console.error("Failed to fetch conversations:", error);
      } finally {
        setConversationsLoading(false);
      }
    };

    fetchConversations();
  }, [user, loading]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // WebSocket connection for active conversation
  useEffect(() => {
    if (!activeConversation || !user) return;

    const token = localStorage.getItem("accessToken");
    const socket = new WebSocket(
      `${process.env.NEXT_PUBLIC_WS_URL}/ws/chat/${activeConversation.id}/?token=${token}`
    );
    socketRef.current = socket;

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      const newMessage: Message = {
        id: data.message_id,
        content: data.message,
        sender: data.sender_id,
        sender_username: data.sender_username,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, newMessage]);
    };

    socket.onclose = () => {
      console.log("Disconnected.");
    };

    return () => {
      socket.close();
      socketRef.current = null;
    };
  }, [activeConversation, user]);

  const sendMessage = useCallback(() => {
    if (!socketRef.current || !messageInput.trim()) return;

    socketRef.current.send(JSON.stringify({ message: messageInput }));
    setMessageInput("");
  }, [messageInput]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const selectConversation = async (conversation: Conversation) => {
    try {
      const token = localStorage.getItem("accessToken");
      setActiveConversation(conversation);
      setMessagesLoading(true);
      const response = await axios.get<Message[]>(
        `${process.env.NEXT_PUBLIC_API_URL}/chat/conversations/${conversation.id}/messages/`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessages(response.data);
    } catch (error) {
      console.error("Failed to load conversation messages", error);
    } finally {
      setMessagesLoading(false);
    }
  };

  const getConversationTitle = (conversation: Conversation): string => {
    if (conversation.title) return conversation.title;
    return conversation.participants
      .filter((p) => p.id !== user?.id)
      .map((p) => p.username)
      .join(", ");
  };

  const getOtherParticipants = (conversation: Conversation): string => {
    return conversation.participants
      .filter((p) => p.id !== user?.id)
      .map((p) => p.username)
      .join(", ");
  };

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center bg-muted/20">
        <Spinner className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    router.push("/");
    return null;
  }

  const conversationList = (
    <ConversationList
      conversations={conversations}
      loading={conversationsLoading}
      activeId={activeConversation?.id}
      onSelect={selectConversation}
      getTitle={getConversationTitle}
    />
  );

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-muted/20">
      {/* Desktop sidebar */}
      <aside className="hidden w-80 shrink-0 flex-col border-r border-border/80 bg-card md:flex">
        <header className="shrink-0 border-b border-border/80 px-4 py-4">
          <h2 className="text-lg font-semibold tracking-tight text-foreground">Messages</h2>
        </header>
        {conversationList}
      </aside>

      {/* Mobile: fullscreen conversation list */}
      {!activeConversation && (
        <div className="flex min-w-0 flex-1 flex-col bg-card md:hidden">
          <header className="shrink-0 border-b border-border/80 px-4 py-4">
            <h2 className="text-lg font-semibold tracking-tight text-foreground">Messages</h2>
          </header>
          {conversationList}
        </div>
      )}

      {/* Chat area */}
      <main
        className={`${
          activeConversation ? "flex" : "hidden md:flex"
        } min-w-0 flex-1 flex-col`}
      >
        {activeConversation ? (
          <>
            {/* Chat header */}
            <header className="flex shrink-0 items-center gap-3 border-b border-border/80 bg-card px-3 py-3 sm:px-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setActiveConversation(null)}
                className="shrink-0 md:hidden"
                aria-label="Back to conversations"
              >
                <ArrowLeftIcon className="size-5" />
              </Button>
              <Avatar size="lg" className="shrink-0">
                <AvatarFallback>
                  {getConversationTitle(activeConversation).charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <h3 className="truncate text-sm font-semibold text-foreground">
                  {getConversationTitle(activeConversation)}
                </h3>
                <p className="truncate text-xs text-muted-foreground">
                  {getOtherParticipants(activeConversation)}
                </p>
              </div>
            </header>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-3 py-4 sm:px-4">
              {messagesLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Spinner className="size-5 animate-spin text-muted-foreground" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-12 text-center">
                  <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                    <ChatsCircle className="size-6" />
                  </span>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-foreground">No messages yet</p>
                    <p className="text-xs text-muted-foreground">
                      Send the first message to start the conversation.
                    </p>
                  </div>
                </div>
              ) : (
                <ConversationMessages messages={messages} currentUserId={user.id} />
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message input */}
            <div className="shrink-0 border-t border-border/80 bg-card p-3">
              <div className="flex items-end gap-2">
                <Textarea
                  placeholder="Type a message..."
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  rows={1}
                  className="max-h-32 min-h-10 flex-1 resize-none rounded-xl py-2.5"
                />
                <Button
                  onClick={sendMessage}
                  disabled={!messageInput.trim()}
                  size="icon-lg"
                  className="shrink-0"
                  aria-label="Send message"
                >
                  <PaperPlaneTilt className="size-5" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center">
            <div className="flex flex-col items-center gap-4 text-center">
              <span className="flex size-16 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <ChatsCircle className="size-8" />
              </span>
              <div className="space-y-1">
                <h2 className="text-xl font-semibold text-foreground">Your messages</h2>
                <p className="text-sm text-muted-foreground">
                  Select a conversation from the sidebar to start chatting.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function ConversationList({
  conversations,
  loading,
  activeId,
  onSelect,
  getTitle,
}: {
  conversations: Conversation[];
  loading: boolean;
  activeId: number | undefined;
  onSelect: (conversation: Conversation) => void;
  getTitle: (conversation: Conversation) => string;
}) {
  if (loading) {
    return (
      <div className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 rounded-lg px-3 py-2.5">
            <div className="size-10 shrink-0 animate-pulse rounded-full bg-muted" />
            <div className="min-w-0 flex-1 space-y-1.5">
              <div className="h-3.5 w-24 animate-pulse rounded bg-muted" />
              <div className="h-3 w-36 animate-pulse rounded bg-muted" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 overflow-y-auto px-4 py-12 text-center">
        <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <ChatsCircle className="size-6" />
        </span>
        <div className="space-y-1">
          <p className="text-sm font-medium text-foreground">No conversations</p>
          <p className="text-xs text-muted-foreground">Start a chat from someone&apos;s profile.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-2">
      {conversations.map((conversation) => {
        const isActive = activeId === conversation.id;
        const title = getTitle(conversation);
        return (
          <button
            key={conversation.id}
            type="button"
            onClick={() => !isActive && onSelect(conversation)}
            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-start transition-colors ${
              isActive ? "bg-accent text-accent-foreground" : "hover:bg-muted/60"
            }`}
          >
            <Avatar size="lg" className="shrink-0">
              <AvatarFallback>{title.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{title}</p>
              {conversation.last_message && (
                <p className="truncate text-xs text-muted-foreground">
                  {conversation.last_message.content}
                </p>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}

function ConversationMessages({
  messages,
  currentUserId,
}: {
  messages: Message[];
  currentUserId: number;
}) {
  // Group consecutive messages from the same sender.
  const groups: Message[][] = [];
  for (const message of messages) {
    const last = groups[groups.length - 1];
    if (last && last[0].sender === message.sender) {
      last.push(message);
    } else {
      groups.push([message]);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {groups.map((group) => {
        const isOwn = group[0].sender === currentUserId;
        return (
          <MessageGroup key={group[0].id}>
            {group.map((message, i) => {
              const isFirst = i === 0;
              const isLast = i === group.length - 1;
              return (
                <MessageRow key={message.id} align={isOwn ? "end" : "start"}>
                  {!isOwn && (
                    <MessageAvatar className={isLast ? undefined : "invisible"}>
                      <Avatar size="lg">
                        <AvatarFallback>
                          {message.sender_username.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </MessageAvatar>
                  )}
                  <MessageContent>
                    {!isOwn && isFirst && (
                      <MessageHeader>{message.sender_username}</MessageHeader>
                    )}
                    <Bubble variant={isOwn ? "default" : "secondary"}>
                      <BubbleContent>{message.content}</BubbleContent>
                    </Bubble>
                    <MessageFooter
                      className={isOwn ? "text-primary-foreground/60" : undefined}
                    >
                      {DateFormat(message.created_at)}
                    </MessageFooter>
                  </MessageContent>
                </MessageRow>
              );
            })}
          </MessageGroup>
        );
      })}
    </div>
  );
}
