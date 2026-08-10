"use client";

import { use, useEffect, useState, useRef } from "react";
import { redirect, useRouter } from "next/navigation";
import axios from "axios";

import { Post } from "@/types/posts";
import { useAuth } from "@/context/AuthContext";
import "./style.css";


const PostEditPage = ({
  params,
}: {
  params: Promise<{ postid: string }>
}) => {
  const { postid } = use(params);
  const router = useRouter();
  const [post, setPost] = useState<Post | null>(null);
  const [notFound, setNotFound] = useState<boolean>(false);
  const [fetchError, setFetchError] = useState<string>("");
  const { user, loading } = useAuth();
  const [postLoading, setPostLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [message, setMessage] = useState<string>("");

  // Text post state
  const [textContent, setTextContent] = useState<string>("");

  // Image post state
  const [description, setDescription] = useState<string>("");
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const postIdNum = Number(postid);

  if (isNaN(postIdNum)) {
    return <h1>Oops! Invalid postid, it should be an integer.</h1>
  }

  useEffect(() => {
    if (loading) return;

    const fetchPost = async () => {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        setFetchError("You need to be logged in.");
        setPostLoading(false);
        return;
      }

      try {
        const response = await axios.get<Post>(`${process.env.NEXT_PUBLIC_API_URL}/posts/${postIdNum}/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const fetchedPost = response.data;
        setPost(fetchedPost);

        if (fetchedPost.post_type === "text") {
          setTextContent(fetchedPost.content.content as unknown as string);
        } else if (fetchedPost.post_type === "image") {
          const imageContent = fetchedPost.content as unknown as { image: string; description: string | null };
          setDescription(imageContent.description || "");
          setPreview(`${process.env.NEXT_PUBLIC_BACKEND_URL}/${imageContent.image}`);
        }
      } catch (error) {
        if (axios.isAxiosError(error)) {
          if (error.response?.status === 404) {
            setNotFound(true);
          } else if (error.response?.status === 401) {
            setFetchError("Your session has expired. Please log in again.");
          } else if (error.response?.status === 403) {
            setFetchError("You don't have permission to view this post.");
          } else {
            setFetchError("Failed to load post.");
          }
        } else {
          setFetchError("Failed to load post.");
        }
      } finally {
        setPostLoading(false);
      }
    }

    fetchPost();
  }, [loading])

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

    setSaving(true);
    setMessage("");

    try {
      if (post!.post_type === "text") {
        if (!textContent) {
          setMessage("Content cannot be empty.");
          setSaving(false);
          return;
        }

        await axios.patch(
          `${process.env.NEXT_PUBLIC_API_URL}/posts/${postIdNum}/`,
          { content: textContent },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
      } else if (post!.post_type === "image") {
        const formData = new FormData();
        if (description) {
          formData.append("description", description);
        }
        if (image) {
          formData.append("image", image);
        }

        await axios.patch(
          `${process.env.NEXT_PUBLIC_API_URL}/posts/${postIdNum}/`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "multipart/form-data",
            },
          }
        );
      }

      router.push(`/p/${postIdNum}`);
    } catch {
      setMessage("Oops! Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  if (loading || postLoading) {
    return <h1>Loading</h1>;
  }

  if (!user) {
    redirect("/");
  }

  if (fetchError) {
    return <div className="container">
      <h1>{fetchError}</h1>
    </div>;
  }

  if (notFound) {
    return <h1>Oops! Post N:{postid} does not exist.</h1>;
  }

  if (!post) {
    return null;
  }

  if (post.author.username !== user.username) {
    return <div className="container">
      <h1>You are not the author of this post.</h1>
    </div>;
  }

  if (post.post_type === "text") {
    return <div className="container">
      <form onSubmit={handleSubmit}>
        <h1>Edit text post.</h1>
        <p style={{ color: "red" }}>{message}</p>
        <textarea
          value={textContent}
          onChange={e => setTextContent(e.target.value)}
          placeholder="Type your thoughts here..."
        />
        <button type="submit" className="btn btn-filled" disabled={saving}>
          {saving ? "Saving..." : "Save"}
        </button>
      </form>
    </div>;
  } else if (post.post_type === "image") {
    return <div className="container">
      <form onSubmit={handleSubmit}>
        <h1>Edit image post.</h1>
        <p style={{ color: "red" }}>{message}</p>

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
          placeholder="Description goes here (Optional)"
        />
        <button type="submit" className="btn btn-filled" disabled={saving}>
          {saving ? "Saving..." : "Save"}
        </button>
      </form>
    </div>;
  }
}

export default PostEditPage;
