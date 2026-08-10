"use client";

import { useRouter } from "next/navigation";
import axios from "axios";
import { useState, useRef } from "react";

import { useAuth } from "@/context/AuthContext";
import "../style.css";


const UploadImagePage = () => {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [description, setDescription] = useState<string>("");
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [message, setMessage] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const token = localStorage.getItem("accessToken");
    if (!token) return;

    if (!image) return;

    try {
      const formData = new FormData();
      formData.append("post_type", "image");
      formData.append("image", image);
      if (description) {
        formData.append("description", description);
      }

      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/posts/`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setImage(null);
      setPreview(null);
      setDescription("");

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
      <h1>Create a new image post.</h1>
      <p style={{color: "red"}}>{message}</p>

      {preview ? (
        <img className="image" src={preview} alt="Preview" />
      ) : (
        <div
          className="image-placeholder"
          onClick={() => fileInputRef.current?.click()}
        >
          Click to select an image
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageChange}
        style={{ display: "none" }}
      />

      <textarea
        value={description}
        onChange={e => setDescription(e.target.value)}
        placeholder="Description goes here (Optional)"></textarea>
      <input type="submit" value="Create Post" className="btn btn-outlined" />
    </form>
  </>;
}

export default UploadImagePage;
