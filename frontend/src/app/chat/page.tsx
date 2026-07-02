"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/context/AuthContext";
import "./style.css";

const ChatPage = () => {
  const router = useRouter();
  const { user, loading } = useAuth();
  const socketRef = useRef<WebSocket | null>(null);
  const [messages, setMessages] = useState<string[]>([]);
  const [messageInput, setMessageInput] = useState<string>("");

  useEffect(() => {
    if (!loading && !user) {
      router.push("/");
    }

    const socket = new WebSocket(`${process.env.NEXT_PUBLIC_WS_URL}/ws/chat/1/`);
    socketRef.current = socket;

    socket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      setMessages(prev => [...prev, message.message]);
    }

    socket.onopen = () => {
      console.log("Connected.");
    }

    return () => {
      socket.close();
      socketRef.current = null;
    }
  }, [user, loading, router]);

  const sendMessage = () => {
    if (socketRef.current) {
      socketRef.current.send(JSON.stringify({ message: messageInput }));
      setMessageInput("");
    }
  }

  if (loading) {
    return <h1>Loading...</h1>;
  }

  return <>
    <input
      type="text"
      value={messageInput}
      onChange={e => setMessageInput(e.target.value)}
      />
    <input
      type="button"
      value="Send"
      onClick={sendMessage}
      />
    {messages.map((message, idx) => <div key={idx}>
      {message}
    </div>)}
  </>;
}

export default ChatPage;
