"use client";

import { useRouter } from "next/navigation";
import axios from "axios";
import { useState, useRef } from "react";
import { ImageIcon, XIcon } from "@phosphor-icons/react";

import { useAuth } from "@/context/AuthContext";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

const UploadImagePage = () => {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [description, setDescription] = useState<string>("");
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [message, setMessage] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

    if (!image) return;

    setSubmitting(true);
    setMessage("");

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
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-muted/20">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-muted border-t-primary" />
      </main>
    );
  }

  if (!user) {
    router.push("/");
    return null;
  }

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-muted/20 px-4 py-8">
      <div className="mx-auto w-full max-w-2xl">
        <form
          onSubmit={handleSubmit}
          className="overflow-hidden rounded-2xl border border-border bg-card text-card-foreground shadow-sm"
        >
          <header className="flex items-center gap-3 border-b border-border/80 px-5 py-4">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <ImageIcon className="size-5" />
            </span>
            <div>
              <h1 className="text-lg font-semibold tracking-tight">Create a new image post</h1>
              <p className="text-sm text-muted-foreground">Share a photo with the community.</p>
            </div>
          </header>

          <div className="space-y-4 px-5 py-5">
            {message && (
              <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{message}</p>
            )}

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
              disabled={!image || submitting}
            >
              {submitting ? "Creating..." : "Create Post"}
            </Button>
          </footer>
        </form>
      </div>
    </main>
  );
}

export default UploadImagePage;
