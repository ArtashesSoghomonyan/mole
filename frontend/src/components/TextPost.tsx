"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import axios from "axios";
import { FaRegHeart } from "react-icons/fa";
import { FaRegComment } from "react-icons/fa";
import { FaRegShareSquare } from "react-icons/fa";

import { DateFormat } from "@/utils";
import CommentSection from "./CommentSection";
import "./posts.css";

const TextPost = ({isMine, id, author, content, created_at, updated_at}: {
  isMine: boolean,
  id: number,
  author: {
    username: string,
    first_name: string,
    last_name: string,
    profile_img: string,
  }
  content: string,
  created_at: string,
  updated_at: string | null,
}) => {
  const router = useRouter();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleted, setDeleted] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [commentCount, setCommentCount] = useState(0);

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

  return <div className={`post${deleted ? " post-deleted" : ""}`}>
    <div className="post-header">
      <div className="line-1">
        <Link className="author-name" href={`/${author.username}/`}>
          <img src={author.profile_img?.startsWith("http") ? author.profile_img : `${process.env.NEXT_PUBLIC_BACKEND_URL}/${author.profile_img}`} />
          <span>{author.first_name} {author.last_name}</span>
        </Link>
        <div className="options no-select">{isMine && <div>
          <Link href={`/p/${id}/edit/`}>Edit</Link> | <a href="#" onClick={e => { e.preventDefault(); setShowDeleteModal(true); }}>Delete</a>
        </div>}</div>
      </div>
      <div className="line-2">
        <span>Created {DateFormat(created_at)}</span>
        {updated_at && <span>Updated {DateFormat(updated_at)}</span>}
      </div>
    </div>
    <div className="post-body" onClick={() => router.push(`/p/${id}/`)}>
      <p onClick={e => e.stopPropagation()}>{content}</p>
    </div>
    <div className="post-footer">
      <FaRegHeart className="icon" />
      <span>52</span>
      <FaRegComment className="icon" onClick={() => setShowComments(!showComments)} style={{ cursor: "pointer" }} />
      <span>{commentCount}</span>
      <FaRegShareSquare className="icon" />
    </div>

    <CommentSection postId={id} showComments={showComments} onCommentCount={setCommentCount} />

    {showDeleteModal && (
      <div className="delete-modal-overlay" onClick={() => setShowDeleteModal(false)}>
        <div className="delete-modal" onClick={e => e.stopPropagation()}>
          <p>Are you sure you want to delete this post?</p>
          <div className="delete-modal-actions">
            <button className="delete-modal-cancel" onClick={() => setShowDeleteModal(false)}>Cancel</button>
            <button className="delete-modal-confirm" onClick={handleDelete}>Delete</button>
          </div>
        </div>
      </div>
    )}
  </div>
}

export default TextPost;
