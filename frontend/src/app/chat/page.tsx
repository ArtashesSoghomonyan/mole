"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

import { useAuth } from "@/context/AuthContext";
import { Conversation, Message } from "@/types/chat";
import { DateFormat } from "@/utils";
import "./style.css";

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
    return <h1>Loading...</h1>;
  }

  if (!user) {
    router.push("/");
    return null;
  }

  return (
    <div className="chat-page">
      <aside className="conversations-sidebar">
        <h2 className="conversations-title">Messages</h2>
        {conversationsLoading ? (
          <p className="conversations-loading">Loading conversations...</p>
        ) : conversations.length === 0 ? (
          <p className="conversations-empty">No conversations yet.</p>
        ) : (
          <ul className="conversations-list">
            {conversations.map((conversation) => (
              <li
                key={conversation.id}
                className={`conversation-item ${
                  activeConversation?.id === conversation.id ? "active" : ""
                }`}
                onClick={() => (activeConversation?.id !== conversation.id) && selectConversation(conversation)}
              >
                <div className="conversation-avatar">
                  {getConversationTitle(conversation).charAt(0).toUpperCase()}
                </div>
                <div className="conversation-info">
                  <span className="conversation-name">
                    {getConversationTitle(conversation)}
                  </span>
                  {conversation.last_message && (
                    <span className="conversation-preview">
                      {conversation.last_message.content}
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </aside>

      <main className="chat-main">
        {activeConversation ? (
          <>
            <header className="chat-header">
              <div className="chat-header-avatar">
                {getConversationTitle(activeConversation).charAt(0).toUpperCase()}
              </div>
              <div className="chat-header-info">
                <h3>{getConversationTitle(activeConversation)}</h3>
                <span className="chat-header-participants">
                  {getOtherParticipants(activeConversation)}
                </span>
              </div>
            </header>

            <div className="messages-container">
              {messagesLoading ? (
                <p className="messages-loading">Loading messages...</p>
              ) : messages.length === 0 ? (
                <p className="messages-empty">No messages yet. Start the conversation!</p>
              ) : (
                messages.map((msg, idx) => (
                  <div
                    key={msg.id || idx}
                    className={`message ${
                      msg.sender === user.id ? "message-own" : "message-other"
                    }`}
                  >
                    <div className="message-content">
                      <span className="message-sender">{msg.sender_username}</span>
                      <p>{msg.content}</p>
                      <span className="message-time">{DateFormat(msg.created_at)}</span>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="message-input-container">
              <textarea
                className="message-input"
                placeholder="Type a message..."
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
              />
              <button
                className="send-button"
                onClick={sendMessage}
                disabled={!messageInput.trim()}
              >
                Send
              </button>
            </div>
          </>
        ) : (
          <div className="chat-placeholder">
            <h2>Select a conversation</h2>
            <p>Choose a conversation from the sidebar to start chatting.</p>
          </div>
        )}
      </main>
    </div>
  );
};
