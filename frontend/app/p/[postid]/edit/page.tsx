"use client";

import { use, useEffect, useState, useRef } from "react";
import { redirect, useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import {
  ArrowLeftIcon,
  ImageIcon,
  NotePencilIcon,
  WarningCircleIcon,
  XIcon,
} from "@phosphor-icons/react";

import { Post } from "@/types/posts";
import { useAuth } from "@/context/AuthContext";
import { mediaUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import Spinner from "@/components/Spinner";


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
  const invalidId = isNaN(postIdNum);

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
          setPreview(mediaUrl(imageContent.image));
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
  }, [loading, postIdNum]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      setPreview(URL.createObjectURL(file));
      setMessage("");
    }
  };

  const clearImage = () => {
    setImage(null);
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
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

  if (invalidId) {
    return (
      <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-muted/20 px-4">
        <ErrorState title="Invalid post" message="The post ID should be a valid number." />
      </main>
    );
  }

  if (loading || postLoading) {
    return <Spinner />;
  }

  if (!user) {
    redirect("/");
  }

  if (fetchError) {
    return (
      <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-muted/20 px-4">
        <ErrorState title="Something went wrong" message={fetchError} />
      </main>
    );
  }

  if (notFound) {
    return (
      <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-muted/20 px-4">
        <ErrorState title="Post not found" message={`The post #${postid} does not exist.`} />
      </main>
    );
  }

  if (!post) {
    return null;
  }

  if (post.author.username !== user.username) {
    return (
      <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-muted/20 px-4">
        <ErrorState title="Not authorized" message="You are not the author of this post." />
      </main>
    );
  }

  const isTextPost = post.post_type === "text";

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-muted/20 px-4 py-8">
      <div className="mx-auto w-full max-w-2xl">
        <div className="mb-4">
          <Link
            href={`/p/${postIdNum}`}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeftIcon className="size-4" />
            Back to post
          </Link>
        </div>

        <form
          onSubmit={handleSubmit}
          className="overflow-hidden rounded-2xl border border-border bg-card text-card-foreground shadow-sm"
        >
          <header className="flex items-center gap-3 border-b border-border/80 px-5 py-4">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              {isTextPost ? (
                <NotePencilIcon className="size-5" />
              ) : (
                <ImageIcon className="size-5" />
              )}
            </span>
            <div>
              <h1 className="text-lg font-semibold tracking-tight">
                Edit {isTextPost ? "text" : "image"} post
              </h1>
              <p className="text-sm text-muted-foreground">Update your post details.</p>
            </div>
          </header>

          <div className="space-y-4 px-5 py-5">
            {message && (
              <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{message}</p>
            )}

            {isTextPost ? (
              <Textarea
                value={textContent}
                onChange={e => setTextContent(e.target.value)}
                placeholder="Type your thoughts here..."
                rows={6}
                className="min-h-32 resize-y"
              />
            ) : (
              <>
                {preview ? (
                  <div className="group relative overflow-hidden rounded-xl border border-border">
                    <img src={preview} alt="Preview" className="max-h-96 w-full object-cover" />
                    <button
                      type="button"
                      onClick={clearImage}
                      className="absolute top-2 right-2 inline-flex size-8 items-center justify-center rounded-full bg-black/60 text-white transition-colors hover:bg-black/80"
                      aria-label="Remove image"
                    >
                      <XIcon className="size-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex min-h-56 w-full flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border bg-muted/20 px-4 py-10 text-center transition-colors hover:border-ring hover:bg-muted/40"
                  >
                    <span className="flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
                      <ImageIcon className="size-7" />
                    </span>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-foreground">Click to select an image</p>
                      <p className="text-xs text-muted-foreground">JPG, PNG or GIF. Any size works.</p>
                    </div>
                  </button>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />

                <Textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Description goes here (Optional)"
                  rows={3}
                  className="min-h-20 resize-y"
                />
              </>
            )}
          </div>

          <footer className="flex items-center justify-end gap-3 border-t border-border/80 bg-muted/20 px-5 py-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving || (isTextPost && !textContent)}
            >
              {saving ? "Saving..." : "Save changes"}
            </Button>
          </footer>
        </form>
      </div>
    </main>
  );
}

function ErrorState({ title, message }: { title: string; message: string }) {
  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <span className="flex size-16 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <WarningCircleIcon className="size-8" />
      </span>
      <div className="space-y-1">
        <h1 className="text-xl font-semibold text-foreground">{title}</h1>
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
      <Link
        href="/"
        className="inline-flex h-9 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
      >
        Back to home
      </Link>
    </div>
  );
}

export default PostEditPage;
