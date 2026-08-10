"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { FaPaperPlane } from "react-icons/fa";

import { DateFormat } from "@/utils";
import { Comment } from "@/types/posts";
import "./posts.css";


type pageProps = {
  postId: number
  showComments: boolean
  onCommentCount?: (count: number) => void
};

const CommentSection = ({ postId, showComments, onCommentCount }: pageProps) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    fetchComments();
  }, [postId]);

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
    <div className="comment-section">
      <div className="comments-container">
        <form className="comment-input-form" onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Write a comment..."
            value={newComment}
            onChange={e => setNewComment(e.target.value)}
            className="comment-input"
          />
          <button type="submit" className="comment-submit" disabled={!newComment.trim()}>
            <FaPaperPlane />
          </button>
        </form>

        {loading ? (
          <p className="comments-loading">Loading comments...</p>
        ) : comments.length === 0 ? (
          <p className="comments-empty">No comments yet.</p>
        ) : (
          <div className="comments-list">
            {comments.map(comment => (
              <CommentItem key={comment.id} comment={comment} postId={postId} />
            ))}
          </div>
        )}
      </div>
    </div>
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
    <div className="comment">
      <div className="comment-header">
        <span className="comment-author">{comment.author.first_name} {comment.author.last_name}</span>
        <span className="comment-time">{DateFormat(comment.created_at)}</span>
      </div>
      <p className="comment-text">{comment.text}</p>
      <div className="comment-actions">
        <button className="comment-reply-btn" onClick={() => setShowReplyInput(!showReplyInput)}>
          Reply
        </button>
      </div>

      {showReplyInput && (
        <form className="reply-input-form" onSubmit={handleReply}>
          <input
            type="text"
            placeholder="Write a reply..."
            value={replyText}
            onChange={e => setReplyText(e.target.value)}
            className="comment-input"
          />
          <button type="submit" className="comment-submit" disabled={!replyText.trim()}>
            <FaPaperPlane />
          </button>
        </form>
      )}

      {replies.length > 0 && (
        <button className="show-replies-btn" onClick={toggleReplies}>
          {showReplies ? "Hide replies" : `View ${replies.length} ${replies.length === 1 ? "reply" : "replies"}`}
        </button>
      )}

      {showReplies && (
        <div className="replies">
          {replies.map(reply => (
            <div key={reply.id} className="comment reply">
              <div className="comment-header">
                <span className="comment-author">{reply.author.first_name} {reply.author.last_name}</span>
                <span className="comment-time">{DateFormat(reply.created_at)}</span>
              </div>
              <p className="comment-text">{reply.text}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CommentSection;
