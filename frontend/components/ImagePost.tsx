"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import axios from "axios";
import { ChatCircle, Heart, ShareNetwork } from "@phosphor-icons/react";

import { DateFormat, mediaUrl } from "@/utils";
import CommentSection from "./CommentSection";

const ImagePost = ({isMine, id, author, image, description, created_at, updated_at, likes_count, is_liked}: {
  isMine: boolean,
  id: number,
  author: {
    username: string,
    first_name: string,
    last_name: string,
    profile_img: string,
  }
  image: string,
  description: string | null,
  created_at: string,
  updated_at: string | null,
  likes_count: number,
  is_liked: boolean,
}) => {
  const router = useRouter();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleted, setDeleted] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [commentCount, setCommentCount] = useState(0);
  const [liked, setLiked] = useState(is_liked);
  const [likeCount, setLikeCount] = useState(likes_count);
  const [likeLoading, setLikeLoading] = useState(false);

  useEffect(() => {
    if (showDeleteModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [showDeleteModal]);

  const handleDelete = async () => {
    setDeleted(true);
    setShowDeleteModal(false);
    try {
      const token = localStorage.getItem("accessToken");
      await axios.delete(
        `${process.env.NEXT_PUBLIC_API_URL}/posts/${id}/`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (error) {
      console.error("Failed to delete post:", error);
    }
  };

  const handleLikeToggle = async () => {
    if (likeLoading) return;
    setLikeLoading(true);

    const token = localStorage.getItem("accessToken");
    if (!token) return;

    const wasLiked = liked;
    setLiked(!wasLiked);
    setLikeCount(prev => wasLiked ? prev - 1 : prev + 1);

    try {
      if (wasLiked) {
        await axios.delete(
          `${process.env.NEXT_PUBLIC_API_URL}/posts/${id}/unlike/`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/posts/${id}/like/`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
    } catch (error) {
      setLiked(wasLiked);
      setLikeCount(prev => wasLiked ? prev + 1 : prev - 1);
      console.error("Failed to toggle like:", error);
    } finally {
      setLikeLoading(false);
    }
  };

  return <article className={`mx-auto my-4 w-full max-w-2xl overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-sm transition-opacity ${deleted ? "pointer-events-none opacity-0" : ""}`}>
    <header className="flex items-start justify-between gap-4 p-4">
      <div>
        <Link className="flex items-center gap-3 font-medium hover:text-primary" href={`/${author.username}/`}>
          <img
            src={mediaUrl(author.profile_img)}
            alt={`${author.first_name} ${author.last_name}`}
            className="size-10 rounded-full border border-border object-cover"
          />
          <span>{author.first_name} {author.last_name}</span>
        </Link>
        <div className="mt-1 flex flex-wrap gap-x-3 text-xs text-muted-foreground">
          <span>Created {DateFormat(created_at)}</span>
          {updated_at && <span>Updated {DateFormat(updated_at)}</span>}
        </div>
      </div>
      {isMine && <div className="flex shrink-0 items-center gap-2 text-sm">
        <Link href={`/p/${id}/edit/`} className="rounded-md px-2 py-1 text-muted-foreground hover:bg-accent hover:text-accent-foreground">Edit</Link>
        <button type="button" className="rounded-md px-2 py-1 text-destructive hover:bg-destructive/10" onClick={() => setShowDeleteModal(true)}>Delete</button>
      </div>}
    </header>
    <div className="cursor-pointer border-y border-border" onClick={() => router.push(`/p/${id}/`)}>
      <img src={mediaUrl(image)} alt={description || "Post image"} className="max-h-128 w-full object-cover" onClick={e => e.stopPropagation()} />
      {description && <p className="whitespace-pre-wrap break-words px-4 py-4 leading-7" onClick={e => e.stopPropagation()}>{description}</p>}
    </div>
    <footer className="flex items-center gap-1 px-3 py-2">
      <button type="button" aria-label="Like post" className={`inline-flex size-9 items-center justify-center rounded-md transition-colors hover:bg-accent ${liked ? "text-destructive" : "text-muted-foreground"}`} onClick={handleLikeToggle}>
        <Heart className="size-5" weight={liked ? "fill" : "regular"} />
      </button>
      <span className="mr-3 text-sm text-muted-foreground">{likeCount}</span>
      <button type="button" aria-label="Show comments" className="inline-flex size-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground" onClick={() => setShowComments(!showComments)}>
        <ChatCircle className="size-5" />
      </button>
      <span className="mr-3 text-sm text-muted-foreground">{commentCount}</span>
      <button type="button" aria-label="Share post" className="inline-flex size-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground">
        <ShareNetwork className="size-5" />
      </button>
    </footer>

    <CommentSection postId={id} showComments={showComments} onCommentCount={setCommentCount} />

    {showDeleteModal && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setShowDeleteModal(false)}>
        <div className="w-full max-w-sm rounded-xl border border-border bg-popover p-6 text-popover-foreground shadow-xl" onClick={e => e.stopPropagation()}>
          <p className="text-sm">Are you sure you want to delete this post?</p>
          <div className="mt-5 flex justify-end gap-3">
            <button type="button" className="inline-flex h-9 items-center justify-center rounded-lg border border-input bg-background px-4 text-sm font-medium hover:bg-accent" onClick={() => setShowDeleteModal(false)}>Cancel</button>
            <button type="button" className="inline-flex h-9 items-center justify-center rounded-lg bg-destructive px-4 text-sm font-medium text-white hover:bg-destructive/90" onClick={handleDelete}>Delete</button>
          </div>
        </div>
      </div>
    )}
  </article>
}

export default ImagePost;
