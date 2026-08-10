"use client";

import { useRouter } from "next/navigation";
import axios from "axios";
import { useState } from "react";

import { useAuth } from "@/context/AuthContext";
import "../style.css";


const UploadTextPage = () => {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [text, setText] = useState<string>("");
  const [message, setMessage] = useState<string>("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const token = localStorage.getItem("accessToken");
    if (!token) return;

    if (!text) return;

    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/posts/`,
        {
          "post_type": "text",
          "content": text,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setText("");

      const id = response.data.id;

      router.push(`/p/${id}`)
    } catch {
      setMessage("Oops! Something went wrong.")
    }
  }

  if (loading) {
    return <h1>Loading...</h1>
  }

  if (!user) {
    router.push("/");
  }

  return <>
    <form onSubmit={handleSubmit} className="container">
      <h1>Create a new text post.</h1>
      <p style={{color: "red"}}>{message}</p>
      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="Type your thoughts here..."></textarea>
      <input type="submit" value="Create Post" className="btn btn-outlined" />
    </form>
  </>;
}

export default UploadTextPage;
