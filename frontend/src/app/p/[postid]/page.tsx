"use client";

import { use, useEffect, useState } from "react";
import { redirect } from "next/navigation";
import axios from "axios";

import { Post } from "@/types/posts";
import { useAuth } from "@/context/AuthContext";
import TextPost from "@/components/TextPost";
import ImagePost from "@/components/ImagePost";
import "./style.css";


const PostDetailPage = ({
  params,
}: {
  params: Promise<{ postid: string }>
}) => {
  const { postid } = use(params);
  const [post, setPost] = useState<Post | null>(null);
  const [notFound, setNotFound] = useState<boolean>(false);
  const { user, loading } = useAuth();
  const [postLoading, setPostLoading] = useState<boolean>(true);

  const postIdNum = Number(postid);

  if (isNaN(postIdNum)) {
    return <h1>Oops! Invalid postid, it should be an integer.</h1>
  }

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const response = await axios.get<Post>(`${process.env.NEXT_PUBLIC_API_URL}/posts/${postIdNum}/`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
        });
        setPost(response.data);
      } catch {
        setNotFound(true);
      } finally {
        setPostLoading(false);
      }
    }

    fetchPost();
  }, [])

  if (loading || postLoading) {
    return <h1>Loading</h1>;
  }

  if (!user) {
    redirect("/");
  }

  if (notFound) {
    return <h1>Oops! Post N:{postid} does not exist.</h1>;
  }

  if (post.post_type === "text") {
    return <div className="container"><TextPost
      isMine={post.author.username === user.username}
      id={post.id}
      author={{
        username: post.author.username,
        first_name: post.author.first_name,
        last_name: post.author.last_name,
        profile_img: post.author.profile.avatar
      }}
      content={post.content.content}
      created_at={post.created_at}
      updated_at={post.updated_at}
      key={post.content.post}
    /></div>;
  } else if (post.post_type === "image") {
    return <div className="container"><ImagePost
      isMine={post.author.username === user.username}
      id={post.id}
      author={{
        username: post.author.username,
        first_name: post.author.first_name,
        last_name: post.author.last_name,
        profile_img: post.author.profile.avatar
      }}
      image={post.content.image}
      description={post.content.description}
      created_at={post.created_at}
      updated_at={post.updated_at}
      key={post.content.post}
    /></div>;
  }
}

export default PostDetailPage;
