"use client";

import { useRouter } from "next/navigation";
import axios from "axios";
import { useState } from "react";
import { NotePencilIcon } from "@phosphor-icons/react";

import { useAuth } from "@/context/AuthContext";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

const UploadTextPage = () => {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [text, setText] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const token = localStorage.getItem("accessToken");
    if (!token) return;

    if (!text.trim()) return;

    setSubmitting(true);
    setMessage("");

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
              <NotePencilIcon className="size-5" />
            </span>
            <div>
              <h1 className="text-lg font-semibold tracking-tight">Create a new text post</h1>
              <p className="text-sm text-muted-foreground">Share your thoughts with the community.</p>
            </div>
          </header>

          <div className="space-y-4 px-5 py-5">
            {message && (
              <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{message}</p>
            )}

            <Textarea
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="Type your thoughts here..."
              rows={6}
              className="min-h-32 resize-y"
              autoFocus
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
              disabled={!text.trim() || submitting}
            >
              {submitting ? "Creating..." : "Create Post"}
            </Button>
          </footer>
        </form>
      </div>
    </main>
  );
}

export default UploadTextPage;
