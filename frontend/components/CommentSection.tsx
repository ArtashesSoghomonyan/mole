"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { PaperPlaneTilt } from "@phosphor-icons/react";

import { DateFormat } from "@/utils";
import { Comment } from "@/types/posts";

type pageProps = {
  postId: number
  showComments: boolean
  onCommentCount?: (count: number) => void
};

const CommentSection = ({ postId, showComments, onCommentCount }: pageProps) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchComments = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        const response = await axios.get<Comment[]>(
          `${process.env.NEXT_PUBLIC_API_URL}/comments/?post=${postId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setComments(response.data);
        onCommentCount?.(response.data.length);
      } catch (error) {
        console.error("Failed to fetch comments:", error);
      } finally {
        setLoading(false);
      }
    };

    void fetchComments();
  }, [onCommentCount, postId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      const token = localStorage.getItem("accessToken");
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/comments/`,
        { post: postId, text: newComment },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setComments(prev => [response.data, ...prev]);
      setNewComment("");
    } catch (error) {
      console.error("Failed to create comment:", error);
    }
  };

  if (!showComments) return null;

  return (
    <section className="border-t border-border bg-muted/20 px-4 py-4">
      <div className="mx-auto max-w-2xl">
        <form className="flex gap-2" onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Write a comment..."
            value={newComment}
            onChange={e => setNewComment(e.target.value)}
            className="h-9 min-w-0 flex-1 rounded-lg border border-input bg-background px-3 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
          />
          <button
            type="submit"
            className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-colors hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50"
            disabled={!newComment.trim()}
            aria-label="Post comment"
          >
            <PaperPlaneTilt className="size-4" />
          </button>
        </form>

        {loading ? (
          <p className="py-6 text-center text-sm text-muted-foreground">Loading comments...</p>
        ) : comments.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">No comments yet.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {comments.map(comment => (
              <CommentItem key={comment.id} comment={comment} postId={postId} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

const CommentItem = ({ comment, postId }: { comment: Comment; postId: number }) => {
  const [showReplies, setShowReplies] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replies, setReplies] = useState<Comment[]>(comment.replies || []);

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    try {
      const token = localStorage.getItem("accessToken");
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/comments/`,
        { post: postId, parent: comment.id, text: replyText },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setReplies(prev => [...prev, response.data]);
      setReplyText("");
      setShowReplyInput(false);
    } catch (error) {
      console.error("Failed to create reply:", error);
    }
  };

  const fetchReplies = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await axios.get<Comment[]>(
        `${process.env.NEXT_PUBLIC_API_URL}/comments/?post=${postId}&parent=${comment.id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setReplies(response.data);
    } catch (error) {
      console.error("Failed to fetch replies:", error);
    }
  };

  const toggleReplies = () => {
    if (!showReplies && replies.length === 0) {
      fetchReplies();
    }
    setShowReplies(!showReplies);
  };

  return (
    <article className="rounded-lg bg-background/70 p-3 shadow-sm ring-1 ring-border/60">
      <div className="flex items-start justify-between gap-3">
        <span className="font-medium">{comment.author.first_name} {comment.author.last_name}</span>
        <span className="shrink-0 text-xs text-muted-foreground">{DateFormat(comment.created_at)}</span>
      </div>
      <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-6">{comment.text}</p>
      <button type="button" className="mt-2 text-xs font-medium text-muted-foreground transition-colors hover:text-primary" onClick={() => setShowReplyInput(!showReplyInput)}>Reply</button>

      {showReplyInput && (
        <form className="mt-3 flex gap-2" onSubmit={handleReply}>
          <input
            type="text"
            placeholder="Write a reply..."
            value={replyText}
            onChange={e => setReplyText(e.target.value)}
            className="h-8 min-w-0 flex-1 rounded-md border border-input bg-background px-2.5 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
          />
          <button
            type="submit"
            className="inline-flex size-8 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground transition-colors hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50"
            disabled={!replyText.trim()}
            aria-label="Post reply"
          >
            <PaperPlaneTilt className="size-4" />
          </button>
        </form>
      )}

      {replies.length > 0 && (
        <button type="button" className="mt-3 text-xs font-medium text-primary hover:underline" onClick={toggleReplies}>
          {showReplies ? "Hide replies" : `View ${replies.length} ${replies.length === 1 ? "reply" : "replies"}`}
        </button>
      )}

      {showReplies && (
        <div className="mt-3 space-y-3 border-l-2 border-border pl-3">
          {replies.map(reply => (
            <article key={reply.id} className="rounded-md bg-muted/50 p-3">
              <div className="flex items-start justify-between gap-3">
                <span className="font-medium text-sm">{reply.author.first_name} {reply.author.last_name}</span>
                <span className="shrink-0 text-xs text-muted-foreground">{DateFormat(reply.created_at)}</span>
              </div>
              <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-6">{reply.text}</p>
            </article>
          ))}
        </div>
      )}
    </article>
  );
};

export default CommentSection;
